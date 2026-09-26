'use strict';

// Gates a finished clip before it goes anywhere. Every check here exists because it
// caught something that had already survived a viewing:
//
//   static runs  a 2.5s freeze from a segment boundary landing inside a long step-label
//                hold, and a 2.0s one from an animation driven over CDP instead of rAF
//   corners      a dev-build badge sitting on top of a live control, shipped once
//   filmstrip    the whole-clip read, which is how you notice the thing you were not
//                looking for
//   frames       pulls specific timestamps so quoted on-screen text can be checked
//                against the copy, which is a real failure: a re-record changed the
//                labels the copy quoted
//
// Usage:
//   node verify.js --video ship.mp4 [--out dir] [--max-static 0.8]
//                  [--tail 1.5] [--frames 12,20,33] [--tiles 12]
//
// Exits non-zero when a gate fails, so it can sit in front of an upload.

const fs = require('fs');
const path = require('path');
const {runId} = require('./output');
const {hasFaststart, outsideHolds} = require('./verification');
const { execFileSync } = require('child_process');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : 'true';
    a[k] = v;
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
if (!args.video) {
  console.error('usage: node verify.js --video <file> [--out dir] [--max-static 0.8] [--frames 12,20,33]');
  process.exit(2);
}

const VIDEO = path.resolve(args.video);
const project = path.resolve(args.project || path.join(path.dirname(VIDEO), '..'));
const OUT = path.join(path.resolve(args.out || path.join(project, 'checks')), runId('verify'));
const MAX_STATIC = Number(args['max-static'] || 0.8);
const TAIL = Number(args.tail || 0);
const audioPolicy = args.audio || 'optional';
if (!['optional', 'required', 'none'].includes(audioPolicy)) throw new Error('--audio must be optional, required or none');
fs.mkdirSync(OUT, { recursive: true });

// ffmpeg failures otherwise surface as a dumped byte array, which hides the one line
// that says what was wrong with the filter graph.
const ff = (a, opts = {}) => {
  try {
    return execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { timeout: 600000, ...opts });
  } catch (e) {
    const msg = (e.stderr || e.stdout || Buffer.from('')).toString().trim();
    throw new Error(`ffmpeg failed: ${msg || e.message}`);
  }
};
const probe = (entries, stream = []) =>
  execFileSync('ffprobe', ['-v', 'error', ...stream, '-show_entries', entries, '-of', 'csv=p=0', VIDEO])
    .toString()
    .trim();

const DURATION = Number(probe('format=duration'));
const [W, H] = probe('stream=width,height', ['-select_streams', 'v:0']).split(',').map(Number);
const FPS = (() => {
  const [n, d] = probe('stream=avg_frame_rate', ['-select_streams', 'v:0']).split('/').map(Number);
  return d ? n / d : n;
})();
const hasAudio = probe('stream=codec_type', ['-select_streams', 'a']).length > 0;
const faststart = hasFaststart(VIDEO);

console.log(`video    ${path.basename(VIDEO)}`);
console.log(`format   ${W}x${H} @ ${FPS}fps, ${DURATION.toFixed(2)}s, ${(fs.statSync(VIDEO).size / 1e6).toFixed(1)}MB`);
console.log(`audio    ${hasAudio ? 'present' : 'absent'} (policy: ${audioPolicy})`);
console.log(`faststart ${faststart ? 'yes' : 'NO (moov after mdat; streaming players will stall)'}`);

if (!Number.isFinite(DURATION) || DURATION <= 0 || !W || !H || !Number.isFinite(FPS) || FPS <= 0) throw new Error('Invalid video metadata');
if (!Number.isFinite(MAX_STATIC) || MAX_STATIC < 0 || !Number.isFinite(TAIL) || TAIL < 0) throw new Error('Invalid static threshold or tail');
const failures = [];

// ---------------------------------------------------------------------------
// 1. static runs
// ---------------------------------------------------------------------------

// Near-zero scene scores are a pacing heuristic, not proof of a freeze.
// Subtract only documented intentional holds; inspect them at normal speed too.
const scenePath = path.join(OUT, 'scene.txt');
ff(['-i', VIDEO, '-vf', `select='gte(scene,0)',metadata=print:file=${scenePath}`, '-f', 'null', '-']);

const frames = [];
{
  const lines = fs.readFileSync(scenePath, 'utf8').split('\n');
  let t = null;
  for (const line of lines) {
    const mt = line.match(/pts_time:([\d.]+)/);
    if (mt) { t = Number(mt[1]); continue; }
    const ms = line.match(/scene_score=([\d.]+)/);
    if (ms && t !== null) frames.push([t, Number(ms[1])]);
  }
}

const STATIC = 0.00005;
const runs = [];
let runStart = null;
for (let i = 0; i < frames.length; i += 1) {
  const [t, s] = frames[i];
  if (s < STATIC) {
    if (runStart === null) runStart = t;
  } else if (runStart !== null) {
    runs.push([runStart, t]);
    runStart = null;
  }
}
if (runStart !== null) runs.push([runStart, DURATION]);
const holds = args.holds ? JSON.parse(fs.readFileSync(args.holds, 'utf8')) : [];
if (TAIL > 0) holds.push({from: Math.max(0, DURATION - TAIL), to: DURATION, reason: 'Explicit --tail reading hold'});
const body = outsideHolds(runs, holds, DURATION);
body.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
const dupPct = (100 * frames.filter(([, s]) => s < 0.00002).length) / (frames.length || 1);

console.log(`\nstatic runs (frames: ${frames.length}, duplicate ${dupPct.toFixed(1)}%)`);
if (!body.length) console.log('  none outside the end hold');
for (const [s, e] of body.slice(0, 8)) {
  const d = e - s;
  console.log(`  ${d.toFixed(2)}s  ${s.toFixed(2)} -> ${e.toFixed(2)}${d > MAX_STATIC ? '   OVER LIMIT' : ''}`);
}
const worst = body.length ? body[0][1] - body[0][0] : 0;
if (worst > MAX_STATIC) {
  failures.push(`longest static run ${worst.toFixed(2)}s exceeds ${MAX_STATIC}s at ${body[0][0].toFixed(2)}s`);
}

// ---------------------------------------------------------------------------
// 2. corners
// ---------------------------------------------------------------------------

// Dev badges, build indicators and debug overlays live in the corners, and they are
// exactly what a viewer notices and you do not. Sampled across the clip because some
// mount late.
const cw = Math.min(460, Math.floor(W / 3));
const ch = Math.min(260, Math.floor(H / 3));
const at = [0.25, 0.55, 0.85].map((f) => +(DURATION * f).toFixed(2));
const cornerCrops = [
  ['tl', '0', '0'],
  ['tr', `in_w-${cw}`, '0'],
  ['bl', '0', `in_h-${ch}`],
  ['br', `in_w-${cw}`, `in_h-${ch}`],
];
const cornerFiles = [];
for (const t of at) {
  for (const [tag, x, y] of cornerCrops) {
    const f = path.join(OUT, `corner-${tag}-${t}.png`);
    ff(['-ss', String(t), '-i', VIDEO, '-vframes', '1',
        '-vf', `crop=${cw}:${ch}:${x}:${y},drawtext=text='${tag} t=${t}':x=8:y=8:fontcolor=yellow:fontsize=20`, f]);
    cornerFiles.push(f);
  }
}
// tile takes a single input stream, so separate stills have to be stacked instead:
// one hstack per row of four corners, then a vstack down the sampled timestamps.
const cornersSheet = path.join(OUT, 'corners.png');
const rowFilters = at
  .map((_, r) => `${cornerCrops.map((_, c) => `[${r * 4 + c}]`).join('')}hstack=inputs=4[r${r}];`)
  .join('');
ff([...cornerFiles.flatMap((f) => ['-i', f]),
    '-filter_complex',
    `${rowFilters}${at.map((_, r) => `[r${r}]`).join('')}vstack=inputs=${at.length}[out]`,
    '-map', '[out]', cornersSheet]);
// Keep individual frames with the report for reproducible inspection.

// ---------------------------------------------------------------------------
// 3. filmstrip
// ---------------------------------------------------------------------------

const tiles = Number(args.tiles || 12);
const cols = 4;
const rows = Math.ceil(tiles / cols);
const strip = path.join(OUT, 'filmstrip.png');
ff(['-i', VIDEO, '-vf', `fps=${(tiles / DURATION).toFixed(4)},scale=480:-1,tile=${cols}x${rows}`,
    '-frames:v', '1', strip]);

// ---------------------------------------------------------------------------
// 4. named frames
// ---------------------------------------------------------------------------

// For checking on-screen text the copy quotes. Copy that quotes a UI string is only
// worth writing if a viewer can find that string in the clip, and a re-record can
// change it without warning.
const framesOut = [];
if (args.frames && args.frames !== 'true') {
  for (const t of args.frames.split(',').map((s) => s.trim()).filter(Boolean)) {
    const f = path.join(OUT, `frame-${t}.png`);
    ff(['-ss', t, '-i', VIDEO, '-vframes', '1', f]);
    framesOut.push(f);
  }
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

if (!hasAudio && audioPolicy === 'required') failures.push('required audio track missing');
if (hasAudio && audioPolicy === 'none') failures.push('unexpected audio track');
if (!faststart) failures.push('moov atom is not at the front (+faststart missing)');

console.log('\nartifacts to read');
console.log(`  ${cornersSheet}`);
console.log(`  ${strip}`);
framesOut.forEach((f) => console.log(`  ${f}`));

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({video: VIDEO, duration: DURATION,
  width: W, height: H, fps: FPS, hasAudio, audioPolicy, faststart, holds, staticRuns: runs,
  unplannedRuns: body, failures, normalSpeedPlayback: 'not verified by this script'}, null, 2));
if (failures.length) {
  console.log('\nFAILED');
  failures.forEach((f) => console.log(`  ${f}`));
  process.exit(1);
}
console.log('\nmechanical gates passed. Now READ the sheets above: the corner and filmstrip');
console.log('checks are only as good as the eye that looks at them.');

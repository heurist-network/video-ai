'use strict';

// Cuts a raw take into the shipping edit using the beat marks the recorder wrote,
// rather than timestamps eyeballed from frames. Marks are why a re-record costs
// minutes instead of an afternoon: the plan is expressed against beats, so it still
// applies when the run takes 44s one time and 160s the next.
//
// Usage:
//   node cut.js --project <dir> --assets <take-dir> [--plan plan.json] [--speed 1.5] [--tail 1.5]
//               [--out cut.mp4] [--final ship.mp4]
//
// --assets must contain marks.json and raw/<take>.webm, both written by stage.js.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {mp4Path, runId} = require('./output');

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

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
if (!args.assets || !args.project) {
  console.error('usage: node cut.js --project <dir> --assets <take-dir> [--plan plan.json] [--fps N] [--allow-frame-drop] [--final <project>/export/out.mp4]');
  process.exit(2);
}

const ASSETS = path.resolve(args.assets);
const MARKS_PATH = path.join(ASSETS, 'marks.json');
const RAW_DIR = path.join(ASSETS, 'raw');

// ---------------------------------------------------------------------------
// inputs
// ---------------------------------------------------------------------------

if (!fs.existsSync(MARKS_PATH)) throw new Error(`no marks.json in ${ASSETS}`);
const marks = Object.fromEntries(JSON.parse(fs.readFileSync(MARKS_PATH, 'utf8')).map((m) => [m.name, m.t]));

const takes = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.webm')) : [];
if (takes.length !== 1) {
  throw new Error(`expected exactly one .webm in ${RAW_DIR}, found ${takes.length}. Select an isolated take directory.`);
}
const RAW = path.join(RAW_DIR, takes[0]);

const probe = (stream, entries) =>
  execFileSync('ffprobe', ['-v', 'error', ...stream, '-show_entries', entries, '-of', 'csv=p=0', RAW])
    .toString()
    .trim();

const DURATION = Number(probe([], 'format=duration'));
// avg_frame_rate comes back as a rational such as 25/1.
const SRC_FPS = (() => {
  const [n, d] = probe(['-select_streams', 'v:0'], 'stream=avg_frame_rate').split('/').map(Number);
  const fps = d ? n / d : n;
  return Number.isFinite(fps) && fps > 0 ? fps : 25;
})();

const planPath = args.plan ? path.resolve(args.plan) : path.join(ASSETS, 'plan.json');
if (!fs.existsSync(planPath)) throw new Error(`no cut plan at ${planPath}`);
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

const SPEED = Number(args.speed || plan.speed || 1.5);
const TAIL = Number(args.tail || plan.tailSeconds || 1.5);

// ---------------------------------------------------------------------------
// beat expressions
// ---------------------------------------------------------------------------

// A term is a mark name, a number, or one of the specials. Terms are joined by + and -.
// "answer_done-4.5" and "flash + 1.3" both parse. Keeping this deliberately small: a
// cut plan that needs real arithmetic is a plan that should be a script.
function evalExpr(expr, ctx) {
  if (typeof expr === 'number') return expr;
  const tokens = String(expr).replace(/\s+/g, '').match(/[+-]?[^+-]+/g);
  if (!tokens) throw new Error(`unparsable beat expression: ${expr}`);
  let total = 0;
  for (const tok of tokens) {
    const sign = tok.startsWith('-') ? -1 : 1;
    const body = tok.replace(/^[+-]/, '');
    let value;
    if (/^[\d.]+$/.test(body)) value = Number(body);
    else if (body === 'end') value = DURATION;
    else if (body === 'tail') value = TAIL * SPEED; // tail is specified in final seconds
    else if (body === 'prev') value = ctx.prev;
    else if (body in marks) value = marks[body];
    else throw new Error(`unknown mark "${body}" in expression "${expr}". Have: ${Object.keys(marks).join(', ')}`);
    total += sign * value;
  }
  return total;
}

// ---------------------------------------------------------------------------
// segments
// ---------------------------------------------------------------------------

let prev = 0;
const segs = plan.segments.map((s, i) => {
  const ctx = { prev };
  let from = evalExpr(s.from, ctx);
  let to = evalExpr(s.to, ctx);
  if (s.atLeast !== undefined) to = Math.max(to, evalExpr(s.atLeast, ctx));
  if (s.atMost !== undefined) to = Math.min(to, evalExpr(s.atMost, ctx));
  from = Math.max(0, Math.min(from, DURATION));
  to = Math.min(to, DURATION);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new Error('Invalid or empty segment');
  prev = to;

  // A compressed segment is compressed to a fixed on-screen length, not a fixed ratio,
  // so a run that takes 44s and one that takes 160s land at the same size in the edit.
  let rate = s.rate || 1;
  if (s.compressToSeconds) {
    rate = Math.max(s.minRate || 2, (to - from) / (s.compressToSeconds * SPEED));
  }
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid segment rate');
  return { name: s.name || `s${i}`, from, to, rate };
});

// ---------------------------------------------------------------------------
// filter graph
// ---------------------------------------------------------------------------

const labels = segs.map((_, i) => `v${i}`);
const chains = segs
  .map(
    (s, i) =>
      `[0:v]trim=${s.from.toFixed(3)}:${s.to.toFixed(3)},setpts=(PTS-STARTPTS)` +
      `${s.rate === 1 ? '' : `/${s.rate.toFixed(3)}`}[${labels[i]}];`
  )
  .join('\n');
const filter =
  `${chains}\n${labels.map((l) => `[${l}]`).join('')}concat=n=${segs.length}:v=1:a=0[cat];\n` +
  `[cat]setpts=PTS/${SPEED}[v]`;

const preSpeed = segs.reduce((t, s) => t + (s.to - s.from) / s.rate, 0);
const finalLen = preSpeed / SPEED;

console.log(`source ${path.basename(RAW)}  ${DURATION.toFixed(1)}s @ ${SRC_FPS}fps`);
for (const s of segs) {
  console.log(
    `  ${s.name.padEnd(10)} ${s.from.toFixed(1)}-${s.to.toFixed(1)}s /${s.rate.toFixed(1)}` +
      ` -> ${((s.to - s.from) / s.rate).toFixed(2)}s`
  );
}
console.log(`concat ${preSpeed.toFixed(2)}s, at ${SPEED}x -> ${finalLen.toFixed(2)}s`);

// CFR conversion can drop frames, especially compressed waits. Include segment rate
// in the estimate; average source fps cannot prove preservation for a VFR capture.
if (!Number.isFinite(SPEED) || SPEED <= 0 || !segs.length) throw new Error('Invalid speed or empty plan');
const needed = SRC_FPS * SPEED * Math.max(...segs.map((s) => s.rate));
const FPS = Number(args.fps || plan.fps || 60);
if (!Number.isFinite(FPS) || FPS <= 0) throw new Error('Invalid fps');
if (FPS < needed && args['allow-frame-drop'] !== 'true') {
  throw new Error(`Estimated retimed cadence ${needed.toFixed(1)}fps exceeds ${FPS}; explicitly pass --allow-frame-drop for compressed waits`);
}
console.log(`Retimed average cadence up to ${needed.toFixed(1)}fps; output ${FPS}fps. CFR resampling is not a frame-preservation guarantee.`);
const project = path.resolve(args.project);
const id = runId('cut');
const cutOut = mp4Path(project, args.out, `${id}.mp4`);
const final = args.final && args.final !== 'true' ? mp4Path(project, args.final, '') : null;
if (final === cutOut) throw new Error('Cut and final must have different names');
const audio = args.audio || 'none';
if (!['none', 'silent'].includes(audio)) throw new Error('--audio must be none or silent; original capture audio is not preserved');
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-n', '-i', RAW, '-filter_complex', filter, '-map', '[v]',
   '-r', String(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'veryfast',
   '-pix_fmt', 'yuv420p', '-movflags', '+faststart', cutOut],
  { stdio: 'inherit', timeout: 900000 }
);
console.log('wrote', cutOut);

// ---------------------------------------------------------------------------
// shipping encode
// ---------------------------------------------------------------------------

// Silent AAC is opt-in for a destination that requires it. Silent video is valid.
if (final) {
  execFileSync(
    'ffmpeg',
    ['-v', 'error', '-n', '-i', cutOut,
     ...(audio === 'silent' ? ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'] : []),
     '-c:v', 'copy',
     ...(audio === 'silent' ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : ['-an']),
     '-movflags', '+faststart', final],
    { stdio: 'inherit', timeout: 900000 }
  );
  const mb = (fs.statSync(final).size / 1e6).toFixed(1);
  console.log(`wrote ${final}  ${finalLen.toFixed(2)}s  ${mb}MB`);
  console.log(`next: node verify.js --video ${final}`);
}

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root = path.dirname(fileURLToPath(import.meta.url));
const [mode, ...argv] = process.argv.slice(2);
const get = (key, fallback) => { const i = argv.indexOf(`--${key}`); return i < 0 ? fallback : argv[i + 1]; };
if (!['proof', 'final'].includes(mode)) throw new Error('Use proof or final');
const browserExecutable = get('browser', process.env.SHOWCASE_BROWSER);
if (!browserExecutable || !fs.existsSync(browserExecutable)) throw new Error('Pass --browser /path/to/chrome; no automatic browser download');
const chromeMode = get('chrome-mode', process.env.SHOWCASE_CHROME_MODE || 'headless-shell');
if (!['headless-shell', 'chrome-for-testing'].includes(chromeMode)) throw new Error('Use --chrome-mode headless-shell or chrome-for-testing');
const compositionId = get('composition', 'Film');
if (mode === 'final' && compositionId !== 'Film') throw new Error('Final renders the full film');
const {bundle} = await import('@remotion/bundler');
const {selectComposition, renderMedia} = await import('@remotion/renderer');
const run = `${mode}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
const build = path.join(root, 'build', run);
const checks = path.join(root, 'checks', run);
const output = path.join(root, 'export', `${run}.mp4`);
for (const dir of [build, checks, path.dirname(output)]) fs.mkdirSync(dir, {recursive: true});
const log = (event, fields = {}) => fs.appendFileSync(path.join(checks, 'events.jsonl'), JSON.stringify({event, ...fields}) + '\n');
try {
  log('start', {mode, compositionId});
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.jsx'), outDir: path.join(build, 'bundle'), publicDir: path.join(root, 'public')});
  const composition = await selectComposition({serveUrl, id: compositionId, browserExecutable, chromeMode});
  if (fs.existsSync(output)) throw new Error('Refusing overwrite');
  await renderMedia({serveUrl, composition, outputLocation: output, codec: 'h264', pixelFormat: 'yuv420p',
    browserExecutable, chromeMode, concurrency: 1, scale: mode === 'proof' ? 0.5 : 2, overwrite: false,
    chromiumOptions: {disableWebSecurity: false}});
  const receipt = {mode, composition: compositionId, video: path.relative(root, output),
    audio: 'none', width: composition.width * (mode === 'proof' ? 0.5 : 2), height: composition.height * (mode === 'proof' ? 0.5 : 2),
    fps: composition.fps, frames: composition.durationInFrames};
  const receiptPath = path.join(checks, 'receipt.json');
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  log('complete', receipt);
  console.log(JSON.stringify({output, receipt: receiptPath}, null, 2));
} catch (error) {
  log('failure', {message: error.message});
  throw error;
}

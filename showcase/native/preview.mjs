import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {revision} from './revision.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const id = `preview-${randomUUID()}`;
const build = path.join(root, 'build', id);
const checks = path.join(root, 'checks', id);
fs.mkdirSync(checks, {recursive: true});
const log = (event, detail) => fs.appendFileSync(path.join(checks, 'events.jsonl'), JSON.stringify({event, detail}) + '\n');
try {
  const hash = revision(root);
  await bundle({entryPoint: path.join(root, 'src/index.jsx'), outDir: build, publicDir: path.join(root, 'public')});
  if (revision(root) !== hash) throw new Error('Source changed while bundling; restart preview');
  const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'};
  // Serve the real Remotion bundle, not an independently drawn storyboard.
  // Static Studio supports replay/seeking; use the guarded CLI for rendering.
  const server = http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {res.writeHead(405).end(); return;}
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(build, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(build + path.sep) || !fs.statSync(file).isFile()) {res.writeHead(404).end(); return;}
      res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      if (req.method === 'HEAD') res.end();
      else {const stream = fs.createReadStream(file); stream.on('error', (error) => {log('stream-failure', error.message); res.destroy();}); stream.pipe(res);}
    } catch (error) {log('request-miss', error.message); res.writeHead(404).end();}
  });
  server.on('error', (error) => {log('server-failure', error.message); process.exitCode = 1;});
  server.listen(Number(process.env.PORT || 0), '127.0.0.1', () => {
    log('ready', {revision: hash, port: server.address().port});
    console.log(`Storyboard revision ${hash}\nhttp://127.0.0.1:${server.address().port}\nStatic snapshot. Restart after source edits; old bundles remain preserved. Ctrl-C stops only this preview.`);
  });
} catch (error) {log('failure', error.message); throw error;}

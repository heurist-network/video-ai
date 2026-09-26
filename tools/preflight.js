#!/usr/bin/env node
'use strict';
// Read-only: no downloads, browser launch, installs, credentials or services.
const fs = require('fs');
const path = require('path');
const os = require('os');
const {createRequire} = require('module');
const {spawnSync} = require('child_process');
const argv = process.argv.slice(2);
const option = (name, fallback) => {const i = argv.indexOf(`--${name}`); return i < 0 ? fallback : argv[i + 1];};
const project = path.resolve(option('project', process.cwd()));
const checks = [];
const add = (name, ok, detail) => checks.push({name, ok, detail});
add('Node >=22', Number(process.versions.node.split('.')[0]) >= 22, process.version);
for (const bin of ['ffmpeg', 'ffprobe']) {
  const result = spawnSync(bin, ['-version'], {encoding: 'utf8'});
  add(bin, result.status === 0, result.error?.message || result.stdout?.split('\n')[0]);
}
const requireProject = createRequire(path.join(project, 'package.json'));
const playwright = process.env.PLAYWRIGHT_MODULE || 'playwright';
try {add(playwright, true, requireProject.resolve(playwright));} catch (error) {add(playwright, false, error.message.split('\n')[0]);}
let browser = option('browser', process.env.CAPTURE_BROWSER);
if (!browser) {
  try {browser = requireProject(playwright).chromium.executablePath();} catch { /* Missing dependency reported above. */ }
}
let browserOK = false;
if (browser) {try {fs.accessSync(browser, fs.constants.X_OK); browserOK = true;} catch { /* Report below. */ }}
add('browser executable', browserOK, browser || 'Set CAPTURE_BROWSER or pass --browser; install explicitly');
try {
  const stats = fs.statfsSync(project);
  const freeGiB = stats.bavail * stats.bsize / 2 ** 30;
  add('disk >=2 GiB for small proof', freeGiB >= 2, `${freeGiB.toFixed(1)} GiB free; estimate final and historical retention separately`);
} catch (error) {add('project disk', false, error.message);}
add('memory >=2 GiB available', os.freemem() >= 2 * 2 ** 30, `${(os.freemem() / 2 ** 30).toFixed(1)} GiB available; ${os.availableParallelism()} logical CPUs; use concurrency 1 initially`);
console.log(JSON.stringify({readOnly: true, project, checks, limitations: ['Presence checks only, not browser shared-library/runtime validation', 'No external APIs contacted', 'Verify fonts, licenses and output capacity before a full render']}, null, 2));
process.exitCode = checks.every((check) => check.ok) ? 0 : 1;

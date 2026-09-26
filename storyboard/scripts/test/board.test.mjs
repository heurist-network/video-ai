import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkPage} from '../board.mjs';
const scripts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('board check reads the template shot list and rejects broken pages', () => {
  const html = fs.readFileSync(path.join(scripts, '../assets/board/index.html'), 'utf8');
  const report = checkPage(html);
  assert.equal(report.status, 'draft');
  assert.deepEqual(report.shots.map((s) => [s.id, s.duration, s.selected]), [['01', 2.5, undefined], ['02', 3, 'A'], ['03', 2.5, undefined]]);
  assert.equal(report.total, 8);
  assert.throws(() => checkPage(html.replace('data-shot="03"', 'data-shot="01"')), /unique/);
  assert.throws(() => checkPage(html.replace('data-duration="3"', 'data-duration="0"')), /positive/);
  assert.throws(() => checkPage('<body></body>'), /No <section/);
});

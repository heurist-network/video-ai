#!/usr/bin/env node
// Storyboard page tools. `new` copies the template; `check` validates the hand-authored
// page's shot contract and prints the shot list as JSON. See references/storyboard.md.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function readShots(html) {
  const sections = [...html.matchAll(/<section\b[^>]*\sdata-shot="[^"]*"[^>]*>/g)];
  return sections.map((match, index) => {
    const tag = match[0];
    const end = index + 1 < sections.length ? sections[index + 1].index : html.length;
    const body = html.slice(match.index + tag.length, end);
    return {
      id: attr(tag, 'data-shot'),
      title: body.match(/<h2\b[^>]*>(.*?)<\/h2>/s)?.[1].replace(/<[^>]+>/g, '').trim() ?? '',
      duration: Number(attr(tag, 'data-duration')),
      selected: attr(tag, 'data-selected'),
      frames: [...body.matchAll(/class="([^"]*)"/g)].filter((m) => m[1].split(/\s+/).includes('frame')).length,
    };
  });
}

export function checkPage(html) {
  const shots = readShots(html);
  if (shots.length === 0) throw new Error('No <section data-shot> found');
  const ids = new Set();
  for (const shot of shots) {
    if (!shot.id || ids.has(shot.id)) throw new Error(`Shot ids must be unique and non-empty: ${shot.id}`);
    ids.add(shot.id);
    if (!(shot.duration > 0)) throw new Error(`Shot ${shot.id} needs a positive data-duration in seconds`);
    if (shot.frames === 0) throw new Error(`Shot ${shot.id} has no .frame element`);
    if (!shot.title) throw new Error(`Shot ${shot.id} has no <h2> title`);
  }
  const status = attr(html.match(/<body\b[^>]*>/)?.[0] ?? '', 'data-status') || 'draft';
  return {status, total: shots.reduce((n, s) => n + s.duration, 0), shots};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, target] = process.argv.slice(2);
  const template = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/board/index.html');
  if (command === 'new') {
    if (!target) throw new Error('Usage: board.mjs new <storyboard-dir>');
    const out = path.join(path.resolve(target), 'index.html');
    if (fs.existsSync(out)) throw new Error(`Refusing overwrite: ${out}`);
    fs.mkdirSync(path.dirname(out), {recursive: true});
    fs.copyFileSync(template, out);
    console.log(out);
  } else if (command === 'check') {
    if (!target) throw new Error('Usage: board.mjs check <index.html>');
    console.log(JSON.stringify(checkPage(fs.readFileSync(path.resolve(target), 'utf8')), null, 2));
  } else throw new Error('Use: board.mjs new <dir> | check <index.html>');
}

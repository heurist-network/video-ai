#!/usr/bin/env node
// Builds the shareable storyboard page from board.json. See references/storyboard.md.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const paragraphs = (text) => String(text ?? '').split(/\n{2,}/).map((p) => `<p>${escape(p.trim())}</p>`).join('');

export function validateBoard(board, dir) {
  if (!board.title) throw new Error('board.title is required');
  if (!Array.isArray(board.shots) || board.shots.length === 0) throw new Error('board.shots must be a non-empty array');
  const frame = board.frame || {};
  if (!(frame.width > 0 && frame.height > 0)) throw new Error('board.frame needs width and height');
  const ids = new Set();
  for (const shot of board.shots) {
    if (!shot.id || ids.has(shot.id)) throw new Error(`Shot ids must be unique: ${shot.id}`);
    ids.add(shot.id);
    if (!(shot.duration > 0)) throw new Error(`Shot ${shot.id} needs a positive duration in seconds`);
    if (!Array.isArray(shot.variants) || shot.variants.length === 0) throw new Error(`Shot ${shot.id} needs at least one variant`);
    const variantIds = new Set();
    for (const variant of shot.variants) {
      if (!variant.id || variantIds.has(variant.id)) throw new Error(`Shot ${shot.id}: variant ids must be unique`);
      variantIds.add(variant.id);
      const f = variant.frame || {};
      if (!['still', 'html', 'clip'].includes(f.type)) throw new Error(`Shot ${shot.id}/${variant.id}: frame.type must be still, html or clip`);
      if (!f.src || !fs.existsSync(path.resolve(dir, f.src))) throw new Error(`Shot ${shot.id}/${variant.id}: frame.src not found: ${f.src}`);
    }
    if (shot.variants.length > 1 && shot.selected && !variantIds.has(shot.selected)) throw new Error(`Shot ${shot.id}: selected variant ${shot.selected} does not exist`);
  }
  return board;
}

function frameDocument(board, fragment) {
  const {width, height} = board.frame;
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#000}</style>` +
    `<script>addEventListener('message',(e)=>{const m=e.data||{};if(m.type==='phase'&&window.frame&&window.frame.seek)window.frame.seek(m.phase);if(m.type==='replay'&&window.frame&&window.frame.replay)window.frame.replay();});</script>` +
    fragment;
}

function renderFrame(board, dir, shot, variant) {
  const f = variant.frame;
  if (f.type === 'still') return `<img class="still" src="${escape(f.src)}" alt="Shot ${escape(shot.id)} variant ${escape(variant.id)}">`;
  if (f.type === 'clip') return `<video class="clip" src="${escape(f.src)}" muted playsinline preload="metadata"></video>`;
  const fragment = fs.readFileSync(path.resolve(dir, f.src), 'utf8');
  return `<iframe class="html" title="Shot ${escape(shot.id)} variant ${escape(variant.id)}" srcdoc="${escape(frameDocument(board, fragment))}" sandbox="allow-scripts"></iframe>`;
}

function renderVariant(board, dir, shot, variant, selected) {
  const f = variant.frame;
  const phases = f.type === 'html' && f.animated ? (f.phases || ['start', 'transition', 'settled']) : [];
  const controls = [];
  if (phases.length) controls.push(`<div role="group" aria-label="Phase">${phases.map((p) => `<button type="button" data-phase="${escape(p)}">${escape(p)}</button>`).join('')}</div>`);
  if (f.type === 'clip' || phases.length) controls.push('<button type="button" data-replay>Replay</button>');
  return `<div class="variant" data-variant="${escape(variant.id)}"${selected ? ' data-selected' : ''}>
  <div class="frame">${renderFrame(board, dir, shot, variant)}</div>
  ${controls.length ? `<div class="frame-controls">${controls.join('')}</div>` : ''}
  ${variant.label ? `<p class="variant-label">${escape(variant.id)} · ${escape(variant.label)}</p>` : ''}
</div>`;
}

function renderShot(board, dir, shot, index, startAt) {
  const end = startAt + shot.duration;
  const multi = shot.variants.length > 1;
  const selected = shot.selected || shot.variants[0].id;
  const facts = [
    ['Takeaway', shot.takeaway], ['On-screen copy', shot.copy], ['Source', [shot.source, shot.input].filter(Boolean).join(' · ')],
  ].filter(([, v]) => v);
  const notes = Object.entries(shot.notes || {});
  return `<section class="shot" id="shot-${escape(shot.id)}" data-shot="${escape(shot.id)}" data-duration="${shot.duration}" data-default="${escape(selected)}">
  <header>
    <span class="index">${String(index + 1).padStart(2, '0')}</span>
    <h2>${escape(shot.title || '')}</h2>
    <span class="timing">${startAt.toFixed(1)}–${end.toFixed(1)}s · ${shot.duration}s</span>
  </header>
  ${multi ? `<div class="variant-picker" role="group" aria-label="Shot ${escape(shot.id)} variant">${shot.variants.map((v) => `<button type="button" data-pick="${escape(v.id)}">${escape(v.id)}</button>`).join('')}<span class="pick-hint">pick one, then copy decisions</span></div>` : ''}
  ${shot.variants.map((v) => renderVariant(board, dir, shot, v, v.id === selected)).join('\n')}
  ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl>` : ''}
  ${notes.map(([k, v]) => `<div class="note"><b>${escape(k)}</b>${paragraphs(v)}</div>`).join('')}
  ${multi ? `<label class="decision-note">Director note<textarea data-note="${escape(shot.id)}" rows="2"></textarea></label>` : ''}
</section>`;
}

export function renderBoard(board, dir) {
  validateBoard(board, dir);
  const total = board.shots.reduce((n, s) => n + s.duration, 0);
  let t = 0;
  const shots = board.shots.map((s, i) => { const html = renderShot(board, dir, s, i, t); t += s.duration; return html; }).join('\n');
  const status = board.status === 'locked' ? 'LOCKED' : 'DRAFT · AWAITING DECISIONS';
  const brief = Object.entries(board.brief || {});
  const closing = Object.entries(board.closing || {});
  const lock = board.lock ? `<p class="lock">Locked by ${escape(board.lock.by)} on ${escape(board.lock.at)}${board.lock.note ? ` · ${escape(board.lock.note)}` : ''}</p>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(board.title)} · Storyboard</title>
<style>${CSS}</style>
</head>
<body data-status="${escape(board.status || 'draft')}" data-frame-width="${board.frame.width}" data-frame-height="${board.frame.height}">
<header class="top">
  <div>
    ${board.subtitle ? `<p class="subtitle">${escape(board.subtitle)}</p>` : ''}
    <h1>${escape(board.title)}</h1>
    ${board.summary ? paragraphs(board.summary) : ''}
    <p class="meta">${board.shots.length} shots · ${total.toFixed(1)}s${board.frame.width && board.frame.height ? ` · ${board.frame.width}×${board.frame.height}` : ''}</p>
    ${lock}
  </div>
  <div class="actions">
    <span class="status">${status}</span>
    <button type="button" data-play>Play animatic</button>
    <button type="button" data-copy>Copy decisions</button>
    <button type="button" data-reset>Reset picks</button>
    <button type="button" onclick="window.print()">Print / PDF</button>
  </div>
</header>
<nav class="shots-nav">${board.shots.map((s, i) => `<a href="#shot-${escape(s.id)}">${String(i + 1).padStart(2, '0')} ${escape(s.title || '')}</a>`).join('')}</nav>
${brief.length ? `<section class="brief"><h2>Brief</h2><dl>${brief.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join('')}</dl></section>` : ''}
${shots}
${closing.map(([k, v]) => `<section class="closing"><h2>${escape(k)}</h2>${paragraphs(v)}</section>`).join('\n')}
<div class="player" hidden><div class="player-stage"></div><div class="player-bar"><span class="player-label"></span><button type="button" data-stop>Stop</button></div></div>
<script>${JS}</script>
</body>
</html>
`;
}

const CSS = `
:root{--bg:#0f1115;--panel:#171a21;--line:#2a2f3a;--text:#e8eaf0;--muted:#9aa3b5;--accent:#7cc4ff;--warn:#ffcf70}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:0 clamp(16px,4vw,48px) 64px}
h1{font-size:clamp(24px,3vw,36px);margin:4px 0 8px}h2{font-size:20px;margin:0}
p{margin:6px 0}.subtitle,.meta,.timing,.pick-hint,.variant-label{color:var(--muted)}
.top{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;align-items:flex-start;padding:32px 0 16px;border-bottom:1px solid var(--line)}
.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.status{font-weight:700;letter-spacing:.06em;font-size:12px;color:var(--warn);padding:6px 10px;border:1px solid var(--warn);border-radius:6px}
body[data-status=locked] .status{color:#8fe3a2;border-color:#8fe3a2}
button{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px 12px;cursor:pointer;font:inherit}
button:hover{border-color:var(--accent)}button[aria-pressed=true]{background:var(--accent);color:#08131d;border-color:var(--accent)}
.shots-nav{display:flex;flex-wrap:wrap;gap:6px 18px;padding:12px 0;font-size:14px}.shots-nav a{color:var(--muted);text-decoration:none}.shots-nav a:hover{color:var(--text)}
.brief dl,.facts{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:8px 0}dt{color:var(--muted)}dd{margin:0}
section{padding:28px 0;border-bottom:1px solid var(--line)}
.shot header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:12px}.index{font-size:28px;font-weight:700;color:var(--accent)}
.variant-picker{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.variant{display:none}.variant[data-selected]{display:block}
.frame{position:relative;width:100%;max-width:1200px;aspect-ratio:var(--ar);background:#000;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.frame img.still,.frame video.clip{width:100%;height:100%;object-fit:contain;display:block}
.frame iframe.html{position:absolute;left:0;top:0;border:0;transform-origin:0 0}
.frame-controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.note{margin-top:10px;max-width:72ch}.note b{display:block;color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.05em}
.decision-note{display:block;margin-top:12px;max-width:72ch;color:var(--muted);font-size:13px}
textarea{display:block;width:100%;margin-top:4px;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:6px;padding:8px;font:inherit}
.lock{color:#8fe3a2}
.player[hidden]{display:none}
.player{position:fixed;inset:0;background:#000;z-index:10;display:flex;flex-direction:column}
.player-stage{flex:1;position:relative;display:flex;align-items:center;justify-content:center}
.player-stage>img,.player-stage>video{max-width:100%;max-height:100%}
.player-stage iframe{border:0;transform-origin:0 0;position:absolute;left:0;top:0}
.player-bar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#111;color:var(--muted)}
@media print{body{background:#fff;color:#000;padding:0}.actions,.shots-nav,.decision-note,.variant-picker,.frame-controls{display:none}section{break-inside:avoid;border:0}.variant{display:block!important}.frame{border:1px solid #999}.status{color:#000;border-color:#000}}
`;

const JS = `
(() => {
  const W = +document.body.dataset.frameWidth, H = +document.body.dataset.frameHeight;
  document.documentElement.style.setProperty('--ar', W + ' / ' + H);
  const key = 'showcase-board:' + document.title;
  let state = {picks: {}, notes: {}};
  try { state = {...state, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch {}
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} };

  function fitFrames(root = document) {
    root.querySelectorAll('.frame iframe.html').forEach((f) => {
      const box = f.parentElement.getBoundingClientRect();
      const s = box.width / W;
      f.style.width = W + 'px'; f.style.height = H + 'px'; f.style.transform = 'scale(' + s + ')';
    });
  }
  addEventListener('resize', () => fitFrames());

  function show(section, id) {
    section.querySelectorAll('.variant').forEach((v) => v.toggleAttribute('data-selected', v.dataset.variant === id));
    section.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pick === id)));
    fitFrames(section);
  }
  document.querySelectorAll('.shot').forEach((section) => {
    const id = section.dataset.shot;
    show(section, state.picks[id] || section.dataset.default);
    section.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { state.picks[id] = b.dataset.pick; save(); show(section, b.dataset.pick); }));
    const note = section.querySelector('[data-note]');
    if (note) { note.value = state.notes[id] || ''; note.addEventListener('input', () => { state.notes[id] = note.value; save(); }); }
    section.querySelectorAll('.variant').forEach((variant) => {
      const iframe = variant.querySelector('iframe'), video = variant.querySelector('video');
      variant.querySelectorAll('[data-phase]').forEach((b) => b.addEventListener('click', () => iframe.contentWindow.postMessage({type: 'phase', phase: b.dataset.phase}, '*')));
      const replay = variant.querySelector('[data-replay]');
      if (replay) replay.addEventListener('click', () => { if (video) { video.currentTime = 0; video.play(); } else iframe.contentWindow.postMessage({type: 'replay'}, '*'); });
    });
  });
  fitFrames();

  document.querySelector('[data-copy]').addEventListener('click', async () => {
    const decisions = [...document.querySelectorAll('.shot')].filter((s) => s.querySelector('[data-pick]')).map((s) => ({shot: s.dataset.shot, pick: state.picks[s.dataset.shot] || s.dataset.default, note: state.notes[s.dataset.shot] || ''}));
    const text = JSON.stringify({board: document.title, decisions}, null, 2);
    try { await navigator.clipboard.writeText(text); alert('Decisions copied. Paste them to the agent.'); } catch { prompt('Copy these decisions:', text); }
  });
  document.querySelector('[data-reset]').addEventListener('click', () => { state = {picks: {}, notes: {}}; save(); location.reload(); });

  const player = document.querySelector('.player'), stage = player.querySelector('.player-stage'), label = player.querySelector('.player-label');
  let playing = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function fitStage(el) {
    const box = stage.getBoundingClientRect(), s = Math.min(box.width / W, box.height / H);
    el.style.width = W + 'px'; el.style.height = H + 'px'; el.style.transform = 'scale(' + s + ')';
    el.style.left = ((box.width - W * s) / 2) + 'px'; el.style.top = ((box.height - H * s) / 2) + 'px';
  }
  async function play() {
    playing = true; player.hidden = false;
    const shots = [...document.querySelectorAll('.shot')];
    for (const [i, section] of shots.entries()) {
      if (!playing) break;
      const variant = section.querySelector('.variant[data-selected]');
      label.textContent = String(i + 1).padStart(2, '0') + ' ' + section.querySelector('h2').textContent + ' · ' + section.dataset.duration + 's';
      stage.replaceChildren();
      const src = variant.querySelector('.frame > *');
      const el = src.cloneNode(true);
      if (el.tagName === 'IFRAME') { el.removeAttribute('style'); stage.append(el); fitStage(el); await new Promise((r) => { el.onload = r; }); el.contentWindow.postMessage({type: 'replay'}, '*'); }
      else { stage.append(el); if (el.tagName === 'VIDEO') { el.currentTime = 0; el.play(); } }
      await sleep(section.dataset.duration * 1000);
    }
    stop();
  }
  function stop() { playing = false; player.hidden = true; stage.replaceChildren(); }
  document.querySelector('[data-play]').addEventListener('click', play);
  player.querySelector('[data-stop]').addEventListener('click', stop);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') stop(); });
})();
`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const option = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i < 0 ? fallback : argv[i + 1]; };
  const boardPath = path.resolve(option('board', 'storyboard/board.json'));
  const dir = path.dirname(boardPath);
  const out = path.resolve(option('out', path.join(dir, 'index.html')));
  if (path.dirname(out) !== dir) throw new Error('--out must sit beside board.json so relative frame paths resolve');
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  fs.writeFileSync(out, renderBoard(board, dir));
  console.log(out);
}

#!/usr/bin/env node
'use strict';

// Surgical patch of a Typefully draft.
//
// The whole point is what it does NOT touch. A human edits drafts in the UI while the
// video is still being cut, so a blind update silently replaces their wording. This
// reads the draft, changes only the fields named in the patch, and prints every post
// back so the result is visible rather than assumed.
//
//   node patch-draft.mjs --set <set-id> --draft <draft-id> --patch patch.json [--dry]
//
// patch.json:
//   {
//     "expectedUpdatedAt": "<timestamp from latest GET>",
//     "posts": [
//       { "index": 0, "media": ["<media-id>"] },
//       { "index": 1, "textFile": "post2.txt" }
//     ]
//   }
//
// A post index that is not mentioned is left exactly as it is. "text" may be given
// inline instead of "textFile".

import fs from 'fs';
import os from 'os';
import path from 'path';
import {patchPosts} from './draft-patch.mjs';

const API = 'https://api.typefully.com/v2';

function args(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[(i += 1)] : true;
    a[k] = v;
  }
  return a;
}

const A = args(process.argv.slice(2));
if (!A.set || !A.draft || !A.patch) {
  console.error('usage: patch-draft.mjs --set <social_set> --draft <draft_id> --patch <patch.json> [--dry]');
  process.exit(2);
}

// The key is read from the same places the typefully CLI uses. It is never passed on the
// command line and never printed.
function apiKey() {
  if (process.env.TYPEFULLY_API_KEY) return process.env.TYPEFULLY_API_KEY;
  const candidates = [
    path.join(process.cwd(), '.typefully/config.json'),
    path.join(os.homedir(), '.config/typefully/config.json'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const c = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (c.api_key || c.apiKey) return c.api_key || c.apiKey;
  }
  throw new Error('no Typefully API key found. Run the typefully skill setup.');
}

const KEY = apiKey();

async function req(method, ep, body) {
  const r = await fetch(`${API}${ep}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) {
    console.error(`HTTP ${r.status}: ${text.slice(0, 400)}`);
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}

const patch = JSON.parse(fs.readFileSync(path.resolve(A.patch), 'utf8'));
const draft = await req('GET', `/social-sets/${A.set}/drafts/${A.draft}`);

console.log(`draft ${A.draft}  updated_at ${draft.updated_at}`);
console.log('If that timestamp is newer than your last read, somebody is editing it now.\n');

const byIndex = new Map((patch.posts || []).map((p) => [p.index, p]));
const posts = patchPosts(draft, patch, path.dirname(path.resolve(A.patch)));

const show = (list, label) => {
  console.log(`--- ${label} ---`);
  list.forEach((p, i) => {
    const changed = byIndex.has(i) ? '  (patched)' : '  (untouched)';
    console.log(`post ${i + 1} [${p.text.length} chars, media=${JSON.stringify(p.media_ids)}]${changed}`);
    console.log(p.text + '\n');
  });
};

if (A.dry) {
  show(posts, 'DRY RUN, nothing written');
  process.exit(0);
}

const latest = await req('GET', `/social-sets/${A.set}/drafts/${A.draft}`);
if (latest.updated_at !== draft.updated_at || JSON.stringify(latest.platforms) !== JSON.stringify(draft.platforms)) {
  throw new Error('Draft changed during preparation; nothing written. Fetch and merge again.');
}
// This API has no verified atomic compare-and-swap here. Coordinate an editing pause.
await req('PATCH', `/social-sets/${A.set}/drafts/${A.draft}`, {
  platforms: { x: { ...draft.platforms.x, posts } },
});
const out = await req('GET', `/social-sets/${A.set}/drafts/${A.draft}`);
show(out.platforms.x.posts, 'read back after patch');
if (posts.some((post, i) => post.text !== out.platforms.x.posts[i]?.text ||
  JSON.stringify(post.media_ids) !== JSON.stringify(out.platforms.x.posts[i]?.media_ids))) {
  throw new Error('Read-back differs; inspect latest draft without retrying');
}
console.log(draft.private_url || `https://typefully.com/?d=${A.draft}&a=${A.set}`);

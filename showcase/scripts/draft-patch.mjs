import fs from 'node:fs';
import path from 'node:path';
export function patchPosts(draft, patch, directory) {
  const original = draft.platforms?.x?.posts;
  if (!Array.isArray(original)) throw new Error('Draft has no X posts');
  if (!patch.expectedUpdatedAt || patch.expectedUpdatedAt !== draft.updated_at) throw new Error('Draft changed or expectedUpdatedAt missing; fetch latest and merge human edits');
  if (!Array.isArray(patch.posts) || !patch.posts.length) throw new Error('No patches supplied');
  const posts = structuredClone(original);
  const seen = new Set();
  for (const p of patch.posts) {
    if (!Number.isInteger(p.index) || p.index < 0 || p.index >= posts.length || seen.has(p.index)) throw new Error('Invalid or duplicate post index');
    seen.add(p.index);
    if (p.media !== undefined) {
      if (!Array.isArray(p.media) || p.media.some((id) => typeof id !== 'string')) throw new Error('media must be an array of IDs');
      posts[p.index].media_ids = p.media;
    }
    if (p.textFile && p.text !== undefined) throw new Error('Choose text or textFile');
    if (p.textFile) posts[p.index].text = fs.readFileSync(path.resolve(directory, p.textFile), 'utf8').replace(/\n+$/, '');
    else if (typeof p.text === 'string') posts[p.index].text = p.text;
  }
  return posts;
}

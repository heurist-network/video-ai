import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const digest = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function revision(root) {
  const hash = createHash('sha256');
  const visit = (relative) => {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) return;
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error(`Do not use symlinked render inputs: ${relative}`);
    if (fs.statSync(file).isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) visit(path.join(relative, name));
    } else hash.update(relative).update('\0').update(fs.readFileSync(file)).update('\0');
  };
  for (const input of ['src', 'public', 'package.json', 'package-lock.json', 'render.mjs', 'revision.mjs']) visit(input);
  return hash.digest('hex');
}
export function checkApproval(approval, receipt, current, root) {
  if (approval.decision !== 'approved' || !approval.reviewer || !approval.reviewedAt) throw new Error('Explicit human approval required');
  if (approval.revision !== current || receipt.revision !== current) throw new Error('Content changed: review a new proof');
  if (receipt.mode !== 'proof' || receipt.composition !== 'Film') throw new Error('Approve a full-film proof, not a single shot');
  if (approval.proofSha256 !== receipt.sha256 || digest(path.resolve(root, receipt.video)) !== receipt.sha256) {
    throw new Error('Proof bytes do not match approval');
  }
}

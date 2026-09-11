import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {board} from '../src/storyboard.mjs';
import {validateBoard, stateAt, length, shotId} from '../src/timing.mjs';
import {revision, digest, checkApproval} from '../revision.mjs';
test('duration, variant IDs and phase boundaries', () => {
  assert.equal(validateBoard(board), board);
  assert.equal(board.shots.reduce((n, s) => n + length(s), 0), 180);
  for (const shot of board.shots) for (const variant of shot.variants) {
    assert.match(shotId(shot, variant), /^shot-/);
    assert.equal(stateAt(0, shot, variant).opacity, 0);
    assert.equal(stateAt(shot.entrance, shot, variant).phase, 'settled');
    assert.equal(stateAt(shot.entrance, shot, variant).opacity, 1);
    assert.equal(stateAt(length(shot) - 1, shot, variant).opacity, 0);
    const frames = Array.from({length: length(shot)}, (_, f) => stateAt(f, shot, variant));
    for (let f = length(shot) - 1; f >= 0; f--) assert.deepEqual(stateAt(f, shot, variant), frames[f]);
  }
  assert.throws(() => validateBoard({...board, targetSeconds: 7}), /durations/);
  const changed = structuredClone(board); changed.shots[0].selected = 'missing';
  assert.throws(() => validateBoard(changed), /Selected/);
});
test('approval binds source, assets and exact full-proof bytes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'showcase-approval-'));
  fs.mkdirSync(path.join(root, 'src')); fs.mkdirSync(path.join(root, 'public')); fs.mkdirSync(path.join(root, 'export'));
  fs.writeFileSync(path.join(root, 'src/scene.jsx'), 'source');
  fs.writeFileSync(path.join(root, 'export/proof.mp4'), 'proof fixture, not a rendered video');
  const current = revision(root);
  const receipt = {mode: 'proof', composition: 'Film', revision: current, video: 'export/proof.mp4', sha256: digest(path.join(root, 'export/proof.mp4'))};
  const approval = {decision: 'approved', reviewer: 'test fixture', reviewedAt: 'test', revision: current, proofSha256: receipt.sha256};
  assert.doesNotThrow(() => checkApproval(approval, receipt, current, root));
  assert.throws(() => checkApproval(approval, {...receipt, composition: 'shot-opening-rise'}, current, root), /full-film/);
  fs.writeFileSync(path.join(root, 'public/mark.svg'), 'changed asset');
  assert.throws(() => checkApproval(approval, receipt, revision(root), root), /Content changed/);
  fs.writeFileSync(path.join(root, 'export/proof.mp4'), 'changed bytes');
  assert.throws(() => checkApproval(approval, receipt, current, root), /Proof bytes/);
});

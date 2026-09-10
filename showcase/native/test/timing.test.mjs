import test from 'node:test';
import assert from 'node:assert/strict';
import {board} from '../src/storyboard.mjs';
import {validateBoard, stateAt, length, shotId} from '../src/timing.mjs';
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

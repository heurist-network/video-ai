export const length = (shot) => shot.entrance + shot.settled + shot.exit;
const validId = (id) => typeof id === 'string' && /^[a-zA-Z0-9-]+$/.test(id);
export function validateBoard(board) {
  for (const key of ['fps', 'width', 'height']) {
    if (!Number.isInteger(board[key]) || board[key] <= 0) throw new Error(`Invalid ${key}`);
  }
  if (!board.revision || !board.shots?.length) throw new Error('Revision and shots required');
  const ids = new Set();
  for (const shot of board.shots) {
    if (!validId(shot.id) || ids.has(shot.id)) throw new Error('Invalid or duplicate shot ID');
    ids.add(shot.id);
    for (const phase of ['entrance', 'settled', 'exit']) {
      if (!Number.isInteger(shot[phase]) || shot[phase] < 1) throw new Error(`Invalid ${phase}`);
    }
    const variants = new Set();
    for (const variant of shot.variants) {
      if (!validId(variant.id) || variants.has(variant.id)) throw new Error('Invalid or duplicate variant ID');
      variants.add(variant.id);
      if (!['rise', 'fade'].includes(variant.motion)) throw new Error('Unknown motion');
    }
    if (!variants.has(shot.selected)) throw new Error('Selected variant missing');
  }
  if (board.shots.reduce((n, s) => n + length(s), 0) !== board.targetSeconds * board.fps) {
    throw new Error('Shot durations must equal targetSeconds at the chosen fps');
  }
  return board;
}

// Absolute frame state: no timers, CSS transitions or accumulated transforms.
// Rise adapts the Minara text blur-pop quartic recipe; see motion-patterns.md.
export function stateAt(frame, shot, variant) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const entered = 1 - (1 - clamp(frame / shot.entrance)) ** 4;
  const exited = clamp((frame - shot.entrance - shot.settled) / Math.max(1, shot.exit - 1));
  return {
    opacity: entered * (1 - exited),
    y: variant.motion === 'rise' ? 24 * (1 - entered) - 22 * exited : 0,
    blur: variant.motion === 'rise' ? 12 * (1 - entered) : 0,
    phase: frame < shot.entrance ? 'entrance' : frame < shot.entrance + shot.settled ? 'settled' : 'exit'
  };
}
export const shotId = (shot, variant) => `shot-${shot.id}-${variant.id}`;

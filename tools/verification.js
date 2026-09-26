'use strict';
const fs = require('fs');
function hasFaststart(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const total = fs.fstatSync(fd).size;
    let offset = 0;
    let moov = false;
    const header = Buffer.alloc(16);
    while (offset + 8 <= total) {
      fs.readSync(fd, header, 0, 8, offset);
      let size = header.readUInt32BE(0);
      const type = header.toString('ascii', 4, 8);
      if (size === 1) {
        if (offset + 16 > total) return false;
        fs.readSync(fd, header, 8, 8, offset + 8);
        size = Number(header.readBigUInt64BE(8));
      } else if (size === 0) size = total - offset;
      if (!Number.isSafeInteger(size) || size < 8 || offset + size > total) return false;
      if (type === 'moov') moov = true;
      if (type === 'mdat') return moov;
      offset += size;
    }
    return false;
  } finally { fs.closeSync(fd); }
}
function outsideHolds(runs, holds, duration) {
  for (const hold of holds) {
    if (!hold.reason || !Number.isFinite(hold.from) || !Number.isFinite(hold.to) || hold.from < 0 || hold.to <= hold.from || hold.to > duration + 0.05) {
      throw new Error('Each hold requires valid from/to seconds and a reason');
    }
  }
  return runs.flatMap((run) => {
    let pieces = [run];
    for (const hold of holds) pieces = pieces.flatMap(([s, e]) => {
      if (hold.to <= s || hold.from >= e) return [[s, e]];
      return [...(s < hold.from ? [[s, hold.from]] : []), ...(e > hold.to ? [[hold.to, e]] : [])];
    });
    return pieces;
  });
}
module.exports = {hasFaststart, outsideHolds};

'use strict';
const fs = require('fs');
const path = require('path');
const {randomUUID} = require('crypto');
const runId = (prefix) => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
function mp4Path(project, requested, fallback) {
  const dir = path.resolve(project, 'export');
  const output = requested ? path.resolve(requested) : path.join(dir, fallback);
  if (path.dirname(output) !== dir || path.extname(output).toLowerCase() !== '.mp4') {
    throw new Error(`All MP4 outputs must be directly in ${dir}`);
  }
  fs.mkdirSync(dir, {recursive: true});
  if (fs.existsSync(output)) throw new Error(`Refusing overwrite: ${output}`);
  return output;
}
module.exports = {runId, mp4Path};

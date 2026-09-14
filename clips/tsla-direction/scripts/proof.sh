#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export HYPERFRAMES_FFMPEG_PATH="${HYPERFRAMES_FFMPEG_PATH:-$(pwd)/../../reference-lab/node_modules/ffmpeg-static/ffmpeg}"
export HYPERFRAMES_FFPROBE_PATH="${HYPERFRAMES_FFPROBE_PATH:-$(pwd)/../../reference-lab/node_modules/ffprobe-static/bin/darwin/arm64/ffprobe}"
mkdir -p qa
npx --no-install hyperframes snapshot --at 0,0.6,1.7,2.8,3.9,4.4,5,7.966
npx --no-install hyperframes keyframes . --selector '#down' --shot qa/down-motion.png --layout strip --from 2.55 --to 3.23 --samples 6
for t in 0.6 1.7 2.8 3.9 4.4 5 7.966; do
  "$HYPERFRAMES_FFMPEG_PATH" -y -v error -ss "$t" -i renders/tsla-direction.mp4 -frames:v 1 "qa/render-$t.png"
done
"$HYPERFRAMES_FFMPEG_PATH" -y -v error -i renders/tsla-direction.mp4 -vf 'fps=2,scale=216:384,tile=4x4' -frames:v 1 qa/contact-sheet.png

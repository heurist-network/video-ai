#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export HYPERFRAMES_RUN_ID=tsla-direction-final
export HYPERFRAMES_FFMPEG_PATH="${HYPERFRAMES_FFMPEG_PATH:-$(pwd)/../../reference-lab/node_modules/ffmpeg-static/ffmpeg}"
export HYPERFRAMES_FFPROBE_PATH="${HYPERFRAMES_FFPROBE_PATH:-$(pwd)/../../reference-lab/node_modules/ffprobe-static/bin/darwin/arm64/ffprobe}"
mkdir -p renders qa
npx --no-install hyperframes check --at 0,0.6,1.7,2.8,3.9,4.4,5,7.966 --json > qa/check.json
npx --no-install hyperframes render --fps 30 --quality high --output renders/tsla-direction.mp4
"$HYPERFRAMES_FFPROBE_PATH" -v error -show_streams -show_format -of json renders/tsla-direction.mp4 > qa/render-probe.json

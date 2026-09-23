# Evidence and annotation pipeline

Use the existing `reference-lab/analyze.mjs`, not the historical TypeSafe-specific script with absolute paths. It preserves raw responses, prompts, usage, source hashes, cards and evidence frames. Newly supported options isolate each study without changing the default library workflow:

- `--output-root DIR`: writes `DIR/library/references/<run-id>/` and `DIR/library/sources/`.
- `--prompt-file FILE`: overrides the base annotation prompt.
- `--probe-path BIN`: overrides bundled FFprobe, also available as `FFPROBE_PATH`.

`--question`, `--model`, `--fps`, `--resolution` and `--run-id` remain available. Existing run IDs are not overwritten. Parse the command's actual result; a created directory alone does not mean success. Inspect `source.json.status`, `validation.json`, `card.json` and `raw-response.json`.

## Local media preparation

Find working `ffmpeg` and `ffprobe` on PATH or in `~/.local/bin`. Test `-version`. This Mac previously had an x86 binary in a package named `darwin/arm64`; trust execution, not the directory name. The repo's FFmpeg fallback is `reference-lab/node_modules/ffmpeg-static/ffmpeg`. Do not hardcode a failed probe path or fabricate duration from an unavailable tool.

Example, from the repository root; substitute concrete paths and keep shell arguments quoted:

```sh
ffprobe -v error -show_format -show_streams -of json "$SOURCE" > "$STUDY/data/media.json"
ffmpeg -hide_banner -loglevel error -ss "$START" -i "$SOURCE" -t "$LENGTH" \
  -map 0:v:0 -map '0:a:0?' -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -c:a aac -movflags +faststart "$STUDY/clips/scene-01.mp4"
ffmpeg -hide_banner -loglevel error -ss "$SOURCE_TIME" -i "$SOURCE" \
  -frames:v 1 -q:v 2 "$STUDY/frames/scene-01-middle.jpg"
```

Create directories first. Re-encode accurate analysis clips instead of assuming stream-copy cuts land exactly on arbitrary requested boundaries. Record requested source start, measured resulting duration and any known offset uncertainty. Keep native source FPS when cutting; model sampling is a separate setting. For variable-frame-rate material use presentation timestamps, not `frame / nominal_fps` as an exact clock.

Store a playable copy of the original under the study root for a standalone report. Do not rely on symlinks escaping the served directory. Contact sheets help shortlist; important overlaps require denser inspection, often 0.1–0.25s and frame-level around suspected cuts/snaps. Avoid blindly exporting every frame of a long film.

## Model passes

The repository default is `gemini-3.8-flash`. Verify the requested model once:

```sh
node reference-lab/analyze.mjs check-model --model gemini-3.8-flash
node reference-lab/analyze.mjs analyze "$SOURCE" \
  --output-root "$STUDY" --probe-path "$FFPROBE" \
  --model gemini-3.8-flash --fps 2 --resolution high \
  --run-id overview --prompt-file "$SKILL/references/overview-prompt.txt"
node reference-lab/analyze.mjs analyze "$STUDY/clips/scene-01.mp4" \
  --output-root "$STUDY" --probe-path "$FFPROBE" \
  --model gemini-3.8-flash --fps 24 --resolution high \
  --run-id scene-01 --prompt-file "$SKILL/references/deep-prompt.txt"
```

`SKILL` is this skill directory. These are starting settings, not magic values: use economical overview sampling and dense sampling on short complex clips. Keep model-local timestamps local in raw cards. Reviewed report chapter/frame times are original-source seconds; report event times are local to their selected clip.

The analyzer loads the repository `.env`; never print it or API keys. Analysis sends video to the configured Gemini service. Do not trigger additional annotation when existing usable runs suffice. If access, quota or the requested model fails, retain completed work and explain the actual blocker; don't silently replace the requested model. For malformed output, inspect the raw response, narrow the clip/question, and retry once with a new run ID. A failed second attempt warrants a disclosed partial result or user guidance, not an unbounded paid retry loop.

## Review and assembly

A useful study layout:

```
samples/<slug>-study/
  index.html
  source.mp4
  data/study.json
  data/media.json
  clips/
  frames/
  library/references/<run-id>/   # raw and normalized model artifacts
  library/sources/
  prompts.md                   # reviewed, reusable directions
  checks/                      # browser and media verification
```

Treat the HTML as presentation, `data/study.json` as the reviewed synthesis, and original model cards as retained hypotheses. Do not overwrite a raw response to make it agree with your interpretation. Persist meaningful corrections and their evidence in the reviewed scene's limitations/provenance.

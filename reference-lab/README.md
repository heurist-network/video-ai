# Reference Lab

This document covers ingestion and gallery operations, not the end-to-end video workflow.

How was it made: We used Gemini 3.8 Flash inspects video visuals, extracts reusable creative ideas and five groups of motion-design fingerprints, and saves auditable evidence. Audio not included.

## Run

Requires Node 10+, Python 3, and `GEMINI_API_KEY` in `../.env` (already configured).

```sh
cd ~/video-ai/reference-lab
npm ci
node analyze.mjs check-model
node analyze.mjs analyze /absolute/path/to/video.mp4
python3 report.py
```

Open `index.html` in a browser for the searchable review gallery.

Defaults: **HIGH media resolution + 10 FPS**, the maximum FPS accepted by the API is 24. Original videos are submitted without resizing. Saved evidence frames use source dimensions. HIGH is the highest documented video resolution setting; ULTRA_HIGH applies to image parts, not video. Gemini may internally resize/tokenize video.

```sh
node analyze.mjs analyze /absolute/path/to/video.mp4 --fps 2 --resolution unspecified
node analyze.mjs analyze /absolute/path/to/video.mp4 --fps 10 --resolution high --question 'Which direction do the letters rotate, and when does the exit begin?'
node --test test.mjs
```

Each invocation makes one generation request. Existing runs are retained. Model override is explicit via `--model`; no fallback silently changes models. Small files are sent inline; larger files use Google's Files API and are deleted remotely after processing. The larger-file branch is implemented but was not exercised by these short samples. Local originals remain. API requests have bounded timeouts; failed generations remain recorded and are not silently retried.

## Folder structure

```
reference-lab/
  analyze.mjs                 Video ingestion CLI
  prompt.txt                  Evidence and creative-analysis instructions
  report.py                   Offline browser + search index builder
  index.html                  Review browser (generated)
  library/
    sources/                  Original videos, deduplicated by SHA-256
    references/<hash>-<run>/
      source.json             Source hash, settings, time, usage, status
      media.json              Measured source duration, dimensions, audio
      prompt.txt              Exact prompt used in this run
      raw-response.json       Unmodified Gemini API response
      card.json / card.md     Machine-readable and readable reference
      fingerprints.json       Narrative/editing/product/motion/graphics
      ideas.json              Mechanisms, applications, limitations
      frames/                 Extracted source frames at evidence timestamps
      validation.json         Structural checks; NOT semantic approval
      review.json             Separate reviewer notes, when available
    index.json                Run metadata index, including failures
  validation/
    sources.json              Public sample provenance
    ground-truth/             Source HTML withheld from Gemini
    findings.md               Pilot results and limitations
    hyperframes-bridge.md     Candidate prefab mappings, not implementation
```

The sample files have friendly aliases in `sources/`; content-addressed copies support deduplication for subsequent runs. `report.py` rebuilds indexes explicitly, avoiding parallel-generation write races. It preserves unsuccessful runs in the metadata index but excludes them from the search index.

## HyperFrames catalog batch (100 videos)

The catalog batch uses **four concurrent Gemini 3.8 Flash workers, HIGH resolution, and 10 FPS** (100 ms requested sampling intervals). Analysis is visual only; audio understanding is excluded from the prompt. Catalog titles, tags, URLs and selection metadata remain provenance, rather than instructions passed to Gemini.

Run or resume from this folder:

```sh
node batch.mjs --manifest library/batches/hyperframes-100/catalog-selection.json
python3 report.py
```

State and provenance live in `library/batches/hyperframes-100/`:

- `catalog-selection.json`: selected catalog items, selection rationale and reserve candidates.
- `manifest.json`: the exact selected items used by this batch.
- `state.json`: per-item status, source hash, provenance, reference ID, attempt IDs, log paths and errors.
- `sources/`: downloaded catalog videos; completed cards link to content-addressed originals in `library/sources/`.
- `logs/`: one analyzer log per attempt. Full cards, Gemini responses, usage, evidence frames and validation remain under `library/references/<reference_id>/`.

## Official sources - no need to read unless instructed

- https://ai.google.dev/gemini-api/docs/generate-content/video-understanding
- https://ai.google.dev/gemini-api/docs/generate-content/media-resolution
- https://www.hyperframes.dev/?view=catalog
- https://github.com/heygen-com/hyperframes

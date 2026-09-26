# Tools

Product capture and MP4 checks. Paths below are relative to the repository root.

| File | Does |
| --- | --- |
| `preflight.js` | Read-only check for Node, ffmpeg, Playwright and a browser executable |
| `stage.js` | Records a real product interaction in Playwright |
| `cut.js` | Cuts a recorded take into an edit using its beat marks |
| `verify.js` | Checks an exported MP4 |
| `targets/EXAMPLE.json` | Target schema for `stage.js` |

Tests: `node --test tools/test/*.test.mjs`.

## Recording a product interaction

```sh
node tools/preflight.js --project "$PROJECT" [--browser "$BROWSER"]
```

`stage.js` supplies recording affordances; a per-demo script supplies the
choreography. Pass the project's target JSON path (schema in `targets/EXAMPLE.json`).
Playwright is not a dependency of this repository; set `CAPTURE_BROWSER` to use a
browser other than Playwright's own.

```js
const {loadTarget, createStage} = require('<repo>/tools/stage.js');
const target = loadTarget('./target.json');
const stage = await createStage({target, outDir: PROJECT});
await stage.page.goto(target.app.url);
stage.mark('ready');
// Drive real app controls; no fabricated response.
const {takeDir} = await stage.finish();
```

Each take gets `build/take-<unique>/raw/*.webm` and its own `marks.json`. `finish()`
returns `takeDir`; cut that specific take, never guess from multiple recordings. Marks
use an approximate wall-clock origin, so inspect capture alignment and adjust beat
offsets if needed. `waitForSettled()` is a text-length stability heuristic, not proof that an
agent finished; prefer the app's verified completion signal when available.

Use `mark(name)` generously. `glide()` and the injected cursor/selection/camera helpers
animate in-page on requestAnimationFrame. Keep root
layout zoom distinct from an inner camera transform. Hide dev chrome during capture
rather than smearing live controls in post.

## Cutting a take

```sh
node tools/cut.js --project "$PROJECT" --assets "$TAKE" --plan "$PROJECT/plan.json" --fps 60 --final "$PROJECT/export/delivery-r1.mp4" --audio none
```

Plans contain `segments` with `name`, `from`, `to` and optional `rate`,
`compressToSeconds`, `minRate`, `atLeast`, `atMost`. Beat expressions support numbers,
mark names, `end`, `prev`, `tail`, `+` and `-`. Global `speed` defaults to 1.5; set it
to 1 for real-time interactions. `compressToSeconds` is subject to `minRate` (default
2), so short waits can finish sooner than the requested length. Never compress the
actual interaction without an explicit editorial decision. Retiming can drop frames
because capture is variable frame rate; `--allow-frame-drop` accepts constant-frame-rate
resampling for compressed waits. Original capture audio is discarded. `--audio silent`
adds a silent AAC track for destinations that require one. Both encodes use faststart.

Capture follows the repository's [stage and review policy](../docs/workflow.md).

## Checking an MP4

```sh
node tools/verify.js --project "$PROJECT" --video "$PROJECT/export/delivery-r1.mp4" --audio none --holds "$PROJECT/holds.json" --frames 0.3,2,5
```

Audio policies: `optional` (default), `none`, `required`. Silent video is valid when the
brief intends it; use `required` for an agreed audio deliverable, and check the content
of that audio separately. Holds are explicit
`[{"from":1,"to":2,"reason":"Read the comparison"}]` in delivery seconds; `--tail N`
adds a reading hold over the last N seconds.

The static detector is a heuristic. Review flagged intervals, document intentional
reading holds, and fix unintended freezes. Do not add jitter or perpetual motion to
satisfy the detector. Named frames, corner sheets and filmstrips go to a unique checks
directory; inspect all three, then play at normal speed.

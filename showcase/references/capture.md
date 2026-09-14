# Real capture and cutting

`scripts/stage.js` supplies recording affordances; a per-demo script supplies the
choreography. Pass an explicit target JSON path (see `targets/EXAMPLE.json`). Bare
names remain compatible with `AGENT_WORK_DIR/<name>/showcase/target.json` or the
user's work bucket, but portable scripts should use explicit project paths.

```js
const {loadTarget, createStage} = require('<skill>/scripts/stage.js');
const target = loadTarget('./target.json');
const stage = await createStage({target, outDir: PROJECT});
await stage.page.goto(target.app.url);
stage.mark('ready');
// Drive real app controls; no fabricated response.
const {takeDir} = await stage.finish();
```

Each take gets `build/take-<unique>/raw/*.webm` and its own `marks.json`. `finish()`
returns `takeDir`; cut that specific take, never guess from multiple recordings. Marks
use an approximate wall-clock origin after page creation, not an independently
calibrated encoded-video timestamp. Inspect capture alignment and adjust beat offsets
if needed. `waitForSettled()` is a text-length stability heuristic, not proof that an
agent finished; prefer the app's verified completion signal when available.

Use `mark(name)` generously. `glide()` and the injected cursor/selection/camera helpers
animate in-page on requestAnimationFrame, not a slow Node/CDP step loop. Keep root
layout zoom distinct from an inner camera transform. Hide dev chrome during capture
rather than smearing live controls in post.

## Cutting a take

```sh
node "$SKILL/scripts/cut.js" --project "$PROJECT" --assets "$TAKE" --plan "$PROJECT/plan.json" --fps 60 --final "$PROJECT/export/delivery-r1.mp4" --audio none
```

Plans contain `segments` with `name`, `from`, `to` and optional `rate`,
`compressToSeconds`, `minRate`, `atLeast`, `atMost`. Beat expressions support numbers,
mark names, `end`, `prev`, `tail`, `+` and `-`. Global `speed` defaults to 1.5; set it
to 1 for real-time interactions. `compressToSeconds` is subject to `minRate` (default
2), so short waits can finish sooner than the requested length. Never compress the
actual interaction without an explicit editorial decision. Retiming can drop frames:
the cadence estimate includes global and segment speed, but VFR capture still prevents
a preservation guarantee. `--allow-frame-drop` explicitly accepts CFR resampling for
compressed waits. Do not claim every captured frame survived because fps is 60.
Original capture audio is discarded. `--audio silent` opts into a silent AAC track
only when the destination needs it; it is not sound design. Both encodes use faststart.

Capture follows the repository's [stage and review policy](../../docs/workflow.md).
The optional native proof receipt is specific to the Remotion path; it is not a second
universal approval gate for captured or HyperFrames videos.

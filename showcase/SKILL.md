---
name: showcase
description: "Create a product feature video through brief-first, replayable storyboard review, native React/Remotion rendering or real browser capture, verification, and optional social draft staging. Use when asked to record a demo, make a feature video, or produce a launch clip."
---

# Showcase

Start with the brief, iterate on replayable shots, approve concrete content, then render.
Project data, assets, exports and decisions stay outside this shared skill.
The bundled native starter is an explicitly illustrative motion study, not a real app demo.

## 1. Brief first

Read the existing project decisions and inspect its source, running build and available
assets before asking questions. Use the installed `grilling` skill when available; load
it through the host's skill discovery, never patch or copy its upstream instructions.
If unavailable, follow this portable fallback: ask **one question at a time**, include
your recommended answer and its trade-off, wait for feedback, then resolve the next
unsettled dependency. Do not ask code-answerable questions or repeat settled decisions.

Set the audience, one capability/payoff, target duration, aspect ratio, delivery size,
sound intent, visual references and real-versus-composed boundary before expensive work.
Recommend a duration based on the amount of readable content, not a fixed template.
A request to explore is not approval to render a finished film or publish anything.

Check which build actually performs the action, authentication needs, source freshness,
third-party rights and dev-only chrome. Do not run paid product actions without the
account owner's authorization and limits. Record data timestamps and actual refresh
cadence. A recorded snapshot does not establish a real-time claim.

## 2. Replayable storyboard is the working surface

Read [motion patterns](references/motion-patterns.md) and copy
[the storyboard record](assets/storyboard.md) into the project's showcase directory.
Each shot needs a purpose, source, entrance, settled reading window and exit. Preserve
prior options by variant ID and revision; select an option rather than destroying it.

Use [the native starter](native/README.md) for composed scenes. Remotion Studio supplies
play/pause, replay, frame seeking, full-film preview and a separate composition for every
shot variant. `src/Scenes.jsx` and `src/timing.mjs` are shared by preview and final render.
Change `selected` in `src/storyboard.mjs` to choose the full-film variant. Replay a single
shot cheaply, then review the sequence at normal speed. Never build an independent HTML
storyboard mock that differs from the renderer. The older `motion-preview.html` is a
recipe sandbox only, not the film's approval surface.

Adapt the starter using actual source-backed product components or captured footage.
Keep reconstructed presentation distinct from recorded product behavior. Do not invent
submitted queries, answers, live numbers or controls. Use authentic marks and licensed
assets. Preserve pair identities, token/stock distinctions, fee tiers, units and dates.
Keep glyph sizes independent of morphing panel dimensions; use uniform camera scaling
only when intentional. Never stretch text or replace low-resolution logos with invented
vectors. Record unavoidable softness honestly.

### Review and approval

1. Preview each entrance, settled state and exit, including reverse seeks. Preserve prior
   previews and choices so the user can compare them.
2. Render a low-resolution **full-film proof before 4K**. Watch at normal speed: contact
   sheets expose clipping and wrong text but cannot establish rhythm or pacing.
3. Obtain explicit approval tied to the revision hash, selected content and exact proof
   bytes. The native final command validates the proof receipt and approval record.
   A changed selection, source, timing, font, asset or copy invalidates approval.
4. Render the approved film, inspect decoded delivery frames and normal-speed playback.
   A direction approval alone does not approve different film content. Do not fabricate
   human review or approval records. No additional review gate is needed for an unchanged
   approved revision; technical checks still apply.

## Output contract

Use one project root, with every MP4 directly together in `export/`: shot previews,
failed proofs, intermediate encodes, final deliveries and historical versions. Never
split MP4s into review/build/archive directories. `checks/` holds frames, receipts,
reports and logs; `build/` holds bundles, raw WebM takes and non-MP4 intermediates.
Source/assets and storyboard revisions remain outside these generated directories.

Use unique names; never overwrite or delete old outputs. Before migrating existing
outputs, inventory and hash them, resolve collisions with unique names, update source
references, then verify retained bytes. Migration requires project authorization; this
skill does not automatically move historical artifacts.

## Setup and native commands

[Setup and GCP notes](references/setup.md) describe explicit, isolated installation.
No scripts install packages, start services or acquire credentials automatically.

```sh
node "$SKILL/scripts/preflight.js" --project "$PROJECT" --mode native --browser "$BROWSER"
# From a project-local copy of native/, after explicit dependency installation:
npm run studio
npm run proof -- --browser "$BROWSER" --composition shot-opening-rise
npm run proof -- --browser "$BROWSER"
# After human approval of that exact full proof:
npm run final -- --browser "$BROWSER" --receipt checks/<proof-run>/receipt.json --approval approval.json
```

The native runner uses a local browser, concurrency 1, silent video, a half-size proof
and a 2x delivery. A 1920x1080 board therefore produces 960x540 proofs and 3840x2160
finals. Licensing, fonts and machine capacity remain explicit checks.

## Real capture path

`scripts/stage.js` supplies recording affordances; a per-demo script supplies actual
choreography. Pass an explicit target JSON path (see `targets/EXAMPLE.json`). Bare names
remain compatible with `AGENT_WORK_DIR/<name>/showcase/target.json` or the user's work
bucket, but portable scripts should use explicit project paths.

```js
const {loadTarget, createStage} = require('<skill>/scripts/stage.js');
const target = loadTarget('./target.json');
const stage = await createStage({target, outDir: PROJECT});
await stage.page.goto(target.app.url);
stage.mark('ready');
// Drive real app controls; no fabricated response.
const {takeDir} = await stage.finish();
```

Each take gets `build/take-<unique>/raw/*.webm` and its own `marks.json`. `finish()` returns
`takeDir`; cut that specific take, never guess from multiple recordings. Marks use an
approximate wall-clock origin after page creation, not an independently calibrated
encoded-video timestamp. Inspect capture alignment and adjust beat offsets if needed.
`waitForSettled()` is a text-length stability heuristic, not proof that an agent finished;
prefer the app's verified completion signal when available.

Use `mark(name)` generously. `glide()` and the injected cursor/selection/camera helpers
animate in-page on requestAnimationFrame, not a slow Node/CDP step loop. Keep root layout
zoom distinct from an inner camera transform. Hide dev chrome during capture rather
than smearing live controls in post.

```sh
node "$SKILL/scripts/cut.js" --project "$PROJECT" --assets "$TAKE" --plan "$PROJECT/plan.json" --fps 60 --final "$PROJECT/export/delivery-r1.mp4" --audio none
```

Plans contain `segments` with `name`, `from`, `to` and optional `rate`,
`compressToSeconds`, `minRate`, `atLeast`, `atMost`. Beat expressions support numbers,
mark names, `end`, `prev`, `tail`, `+` and `-`. Global `speed` defaults to 1.5; set it to
1 for real-time interactions. `compressToSeconds` is subject to `minRate` (default 2),
so short waits can finish sooner than the requested length. Never compress the actual
interaction without an explicit editorial decision. Retiming can drop frames: the
cadence estimate includes global and segment speed, but VFR capture still prevents a
preservation guarantee. `--allow-frame-drop` explicitly accepts CFR resampling for
compressed waits. Do not claim every captured frame survived because fps is 60.
Original capture audio is discarded. `--audio silent` opts into a silent AAC track only
when the destination needs it; it is not sound design. Both encodes use faststart.

For capture-only projects, record the approved take, cut-plan hash, revision and proof
hash in the storyboard before the delivery encode. The cut CLI does not enforce the
native approval receipt; the operator owns this gate.

## Verify the actual output

```sh
node "$SKILL/scripts/verify.js" --project "$PROJECT" --video "$PROJECT/export/delivery-r1.mp4" --audio none --holds "$PROJECT/holds.json" --frames 0.3,2,5
```

Audio policies: `optional` (default), `none`, `required`. Audio-less video is valid when
intended. Use `required` only for a checked destination requirement. Holds are explicit
`[{"from":1,"to":2,"reason":"Read the comparison"}]` in delivery seconds. There is no
implicit end-hold exemption; `--tail` is an explicit legacy option.

The static detector is a heuristic. Review flagged intervals, document intentional
reading holds, and fix unintended freezes. Do not add jitter or perpetual motion to
satisfy a detector. Reports retain raw and unplanned static runs. Native-resolution
named frames, corner sheets and filmstrips go to a unique checks directory. Inspect
all three, then play normally. Report sampled inspection and playback separately.
Faststart is checked by parsing MP4 atoms, not searching arbitrary header bytes.

## Optional copy and staging

Only when requested, load the installed `brand-voice` and `typefully` skills and read
[publishing constraints](references/publishing.md). If those skills are absent, hand
over the verified MP4 and approved copy; do not invent an authentication path.
Verify every mention against the intended account's current official profile before
staging. Similar handles are not interchangeable. Preserve the latest human Typefully
edits, patch only authorized fields, and read back the result. Upload/stage is not
permission to schedule or publish. The human sends unless explicitly authorized otherwise.

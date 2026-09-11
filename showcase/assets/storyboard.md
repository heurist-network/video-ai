# Showcase proof and asset record

Copy this into the project's showcase work folder as `proof-record.md`. This is a
supporting evidence ledger, not a second storyboard or decision source. The project's
`storyboard/index.html` owns the brief, shot design, variants, timing and director lock.
Link those decisions here rather than maintaining competing editable copies.

## Locked board reference

- HTML storyboard path and exact revision:
- Directors, lock wording and time:
- Frozen HTML/assets under render `public/board-lock/`:
- Source observation time and actual refresh cadence:
- Real-versus-composed boundary and agreed sound/destination policy (link to board):
- Current native content revision hash:

## Shot evidence

| Shot / locked variant | Source or composition path | Selected take | Preview MP4 | Inspected times / evidence | Review state |
| --- | --- | --- | --- | --- | --- |

Reference the HTML's approved shot IDs and versions. Distinguish planned, rendered,
frame-inspected, normal-speed-played and human-approved states. Preserve earlier
variant IDs and source revisions. Scene/timing logic must be shared by the HTML
animatic and native renderer, not recreated as a separate approximate interpretation.

All MP4 paths point directly into `export/`, including single-shot proofs, intermediate
encodes and historical choices. Frames/reports go to `checks/`; other intermediates go
to `build/`. Never overwrite or delete previous options.

## Concrete approval

- Full-film low-resolution proof path and SHA-256:
- Native content revision hash and locked HTML revision:
- Native proof receipt and approval JSON paths (when using the native renderer):
- Capture-only selected take, cut-plan hash and revision (operator-enforced gate):
- Director, exact approval wording and time:
- Normal-speed playback evidence (separate from contact-sheet inspection):
- Final selected delivery path:

Direction approval does not approve different film content. Content, asset, timing or
selection changes invalidate proof approval and require a new proof. Creative changes
also reopen the HTML board for re-lock. Do not invent an approval record. An unchanged
approved revision does not need repeated questioning.

## Asset record

| Asset ID | Local path | Source URL / commit / file | License or permission | Attribution | Adaptation | Used in shot | Verification evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

Include footage, fonts, icons, music, generated assets, and reused code. Unknown
rights mean reference-only until resolved; replace with owned assets where possible.
Keep adapted project assets with the project. Promote generic recipes into the
skill only when they work independently of the product's copy, data, and brand.

## Timing, parity and inspection evidence

- Link source beat names from `stage.mark()` and the selected `plan.json`.
- Link shared scene/timing modules and the locked absolute starts/durations, easing,
  staggers and transforms. Do not author alternative timings in this record.
- Record identical HTML/native sample times at entrances, boundaries, holds and exits;
  include approach/click alignment where relevant, differences found and fixes.
- Link reverse-seek, immediate stop/restart, image/font readiness and reduced-motion checks.
- Link close-up legibility, first/last frame and final MP4 verification evidence.
- Record intentional static holds, unresolved defects and final selected exports.

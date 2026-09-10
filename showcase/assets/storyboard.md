# Showcase storyboard

Copy this into the project's showcase work folder. Values below describe fields,
not a prescribed aesthetic or a required scene count.

## Film brief

- Capability and observable payoff:
- Target/build and recording URL:
- Audience, aspect ratio, delivery duration:
- Product typography, palette, framing reference:
- Real footage versus native reconstruction versus illustration:
- Sound intent and destination requirements:
- Source observation time and actual refresh cadence:
- Settled decisions (do not ask again):
- Current source revision hash and selected variants:

## Shots

| Shot / version | Viewer takeaway | From / to beat | Footage or illustration | Pattern / source | Camera target and timing | Hold / exit | Audio cue | Review state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

For each shot, record its script/composition path, selected take, preview and export
paths, and inspected entrance/hold/exit frames. Use one selected version per shot.
Distinguish planned, rendered, frame-inspected, normal-speed-played and human-approved
states. Each shot records entrance, settled hold and exit in frames. Preserve earlier
variant IDs and source revisions. Use the same scene components and timing in the
storyboard player and final render, not a separate HTML interpretation.

All MP4 paths point directly into `export/`, including single-shot proofs, intermediate
encodes and historical choices. Frames/reports go to `checks/`; other intermediates go
to `build/`. Never overwrite or delete previous options.

## Concrete approval

- Full-film low-resolution proof path and SHA-256:
- Content revision hash and selected shot variants:
- Reviewer, approval wording and time:
- Normal-speed playback evidence (separate from contact-sheet inspection):
- Final selected delivery path:

Direction approval does not approve different film content. Content, asset, timing or
selection changes invalidate the proof approval and require a new proof. Do not invent
an approval record. An unchanged approved revision does not need repeated questioning.

## Asset record

| Asset ID | Local path | Source URL / commit / file | License or permission | Attribution | Adaptation | Used in shot | Verification evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

Include footage, fonts, icons, music, generated assets, and reused code. Unknown
rights mean reference-only until resolved; replace with owned assets where possible.
Keep adapted project assets beside this storyboard. Promote generic recipes into
the skill only when they work independently of the product's copy, data, and brand.

## Timing and inspection

- Define source beat names with `stage.mark()`; preserve them in `plan.json`.
- For composed scenes, record absolute start/duration, easing, stagger, and transforms.
- Check that changing scene order or seeking backward produces the same frame.
- Link close-up legibility, first/last frame, and final MP4 verification evidence.
- Record intentional static holds, unresolved defects, and final selected exports.

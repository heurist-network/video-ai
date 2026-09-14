# Ideas → storyboard → video

Use human feedback in the conversation to move between stages. No per-clip status file,
formal review log, or approval ledger is required. Read the current artifacts and ask
only if the next step's authorization is genuinely unclear.

## 1. Find ideas

Understand the audience, goal, main message, promotional-graphic versus product-demo
treatment, duration, format and sound intent. Reuse answers already given.

Use [Reference Lab search](../reference-lab/AGENTS.md) to find visual mechanisms.
Read short matches, retrieve selected Gemini ideas, and inspect a few evidence images.
Inspect the original video when precise motion matters; stills cannot establish easing
or rotation direction. Distinguish observed evidence from proposed adaptations.

Present a few distinct directions with reference links/images and a recommendation.

**Pause for the human to choose or refine a direction.** Do not build the storyboard yet.

## 2. Create the storyboard

Follow [showcase/SKILL.md](../showcase/SKILL.md). Work in `storyboard/index.html` using
mostly static style frames, exact copy, composition, timing and motion descriptions.
Add a selective motion study only when it helps decide the treatment. A full animatic
is not a prerequisite.

Promotional graphics remove secondary interface detail and emphasize the core message.
Actual product demos preserve relevant interface states and interactions. Keep source
provenance outside the film unless essential to its meaning.

Run the board checker and inspect the browser layout. Show the board with any meaningful
open choices. Keep an earlier revision when editing.

**Pause for feedback or approval to produce.** A human saying to produce the current
board with specified edits is sufficient authorization; no extra approval form is needed.

## 3. Produce the video

Follow the [HyperFrames guide map](hyperframes.md). Implement the approved direction
with one deterministic timeline and local assets. Reuse any accepted motion-study logic.
Keep the board aligned with requested changes; ask only when an implementation decision
would materially depart from the agreed design.

Run the framework checks, inspect warnings, and verify actual rendered frames and
normal-speed playback. Check text clipping, moving decimals, boundaries, texture and
reading holds. A passing structural check does not establish visual quality or pacing.
Use a draft proof when useful; produce the final-quality file within the authorized scope.
Renderer-specific proof receipts apply only when that explicitly selected renderer
requires them, not as a new universal HyperFrames ceremony.

Keep new MP4s in `export/` with versioned names, technical checks in `checks/`.
Present the playable video and download, with duration and any material limitation.

**Pause for human feedback.** Apply requested revisions and present again. Producing a
video does not mean it has been accepted or that it may be published.

## Existing work

A revision request can enter the relevant stage directly; do not restart ideation.
Historical autonomous instructions are scoped to their original task, not future work.
Do not reconstruct missing approvals, create backfilled logs, or regenerate old outputs
just to make a project look compliant. An explicit user request can waive a stage pause;
never infer that waiver from a generic request to make a video.

## Optional MP4 verification helper

Use when checking an exported MP4 with the bundled helper. `SKILL` is the repository’s
`showcase/` directory and `PROJECT` is the clip directory.

```sh
node "$SKILL/scripts/verify.js" --project "$PROJECT" --video "$PROJECT/export/delivery-r1.mp4" --audio none --holds "$PROJECT/holds.json" --frames 0.3,2,5
```

Audio policies: `optional` (default), `none`, `required`. Audio-less video is valid when
intended; the bundled renderer defaults to silent output, but sound intent comes from
the brief. Use `required` for an agreed audio deliverable or checked destination
requirement, and verify the content of that audio separately. Holds are
explicit `[{"from":1,"to":2,"reason":"Read the comparison"}]` in delivery seconds.
There is no implicit end-hold exemption; `--tail` is an explicit legacy option.

The static detector is a heuristic. Review flagged intervals, document intentional
reading holds, and fix unintended freezes. Do not add jitter or perpetual motion to
satisfy a detector. Reports retain raw and unplanned static runs. Native-resolution
named frames, corner sheets and filmstrips go to a unique checks directory. Inspect
all three, then play normally. Report sampled inspection and playback separately.
Faststart is checked by parsing MP4 atoms, not searching arbitrary header bytes.

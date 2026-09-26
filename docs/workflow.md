# Ideas → storyboard → video

Use human feedback in the conversation to move between stages. Read the current
artifacts and ask only if the next step's authorization is unclear.

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

Follow [storyboard/SKILL.md](../storyboard/SKILL.md). Work in `storyboard/index.html` using
mostly static style frames, exact copy, composition, timing and motion descriptions.
Add a selective motion study only when it helps decide the treatment. A full animatic
is not a prerequisite.

Promotional graphics remove secondary interface detail and emphasize the core message.
Actual product demos preserve relevant interface states and interactions. Keep source
provenance outside the film unless essential to its meaning.

Run the board checker and inspect the browser layout. Show the board with any meaningful
open choices. Keep an earlier revision when editing.

**Pause for feedback or approval to produce.** A human saying to produce the current
board with specified edits is sufficient authorization.

## 3. Produce the video

Follow the [HyperFrames guide map](hyperframes.md). Implement the approved direction
with one deterministic timeline and local assets. Reuse any accepted motion-study logic.
Keep the board aligned with requested changes; ask only when an implementation decision
would materially depart from the agreed design.

Run the framework checks, inspect warnings, and verify actual rendered frames and
normal-speed playback. Check text clipping, moving decimals, boundaries, texture and
reading holds. A passing structural check does not establish visual quality or pacing.
Use a draft render when useful, then produce the final-quality file.
[`tools/verify.js`](../tools/README.md#checking-an-mp4) checks an exported MP4.

Keep new MP4s in `export/` with versioned names, technical checks in `checks/`.
Present the playable video and download, with duration and any material limitation.

**Pause for human feedback.** Apply requested revisions and present again. Producing a
video does not mean it has been accepted or that it may be published.

## Existing work

A revision request can enter the relevant stage directly; do not restart ideation.
A user can explicitly skip a stage pause; a generic request to make a video does not.

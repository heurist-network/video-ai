---
name: showcase
description: "Create a product feature video through an HTML storyboard and animatic, director lock, native React/Remotion rendering or real browser capture, exact-proof approval, and verification. Use when asked to record a demo, make a feature video, or produce a launch clip. Publishing is optional and separately authorized."
---

# Showcase

Create and review the HTML storyboard first. Lock it with the directors, then build
and approve an exact full-film proof before the final render. Project data, assets,
exports and decisions stay outside this shared skill. The bundled starters are
illustrations, not live product demos or finished continuity designs.

## 1. Ideation and storyboard creation

Understand the project from its source, docs, running build and available assets before
asking questions: scope, design language, features and how they actually behave.
Use the installed `grilling` skill to settle only what those sources cannot answer.
Load it through the host's skill discovery, never patch or copy its upstream instructions.
If unavailable, ask **one question at a time**, include your recommended answer and its
trade-off, wait for feedback, then resolve the next unsettled dependency. Do not repeat
settled decisions or ask code-answerable or trivial questions.

Set the audience, one capability/payoff, target duration, aspect ratio, delivery size,
sound intent, visual references and real-versus-composed boundary. Audience and sound
come from the brief, not a fixed social channel or silent-film policy. The bundled
renderer defaults to silent output. Derive duration from readable content, not a fixed
template. Draft on-screen copy now: changing it later changes reading time and motion.
A request to explore is not approval to render a finished film or publish anything.

Inputs may include implemented product features, explicitly proposed features,
simplified composed presentation, screenshots, reference films, conversations, meeting
transcripts and marketing notes. Label unbuilt or illustrative scenes clearly in the
source/boundary notes and agree any necessary viewer-facing disclosure. Never imply
that composed behavior was recorded from a working product.

Check which build performs the action, authentication, source freshness, rights and
dev-only chrome. Do not run paid product actions without the account owner's
authorization and limits. Record data timestamps and actual refresh cadence. A recorded
snapshot does not establish a real-time claim.

### Produce the storyboard

Before composing, read [shot direction](references/shot-direction.md) in full. Every
worker designing shots must read it too, with the approved references and fixed
constraints in their brief. It governs interaction, shot-to-shot and conversational
continuity, selective streaming, cursor choreography, backgrounds and authentic branding.
Resolve one or two finished style frames and a representative transition before a large
rebuild. They evolve with the board and settle when it locks.

The working surface is one hand-authored page, `storyboard/index.html`. Read
[storyboard page](references/storyboard.md), copy [the template](assets/board/index.html)
and replace its example content. One section per shot records timing, a source-backed
frame, composition, motion and source/boundary notes. Specify each entrance, settled
reading window and exit in seconds/frames, and what connects adjacent shots. The
selected shot durations must sum to the agreed film length. The header states the viewer
takeaway, film length and recommended picks. Offer variants only where a real choice
exists; preserve their IDs and prior revisions rather than destroying alternatives.
Read [motion patterns](references/motion-patterns.md) as implementation references,
not a mandatory menu of effects.

```sh
node "$SKILL/scripts/board.mjs" new "$PROJECT/storyboard"
node "$SKILL/scripts/board.mjs" check "$PROJECT/storyboard/index.html"
```

Run the checker after every edit and before sharing. Review the full animatic at normal
speed, including outgoing state, connecting motion and incoming hold. A sequence of
isolated fade-ins is not finished continuity. The template/checker supplies a starter
and structural validation, not proof of pacing, source truth or director approval.

### Review and lock

Directors open the page and give feedback in chat or unstructured feedback markdown.
Apply it to the page, reshare and repeat. Keep alternatives available until decided.
The board locks as a whole once every shot is agreed: set its status to locked and
record who locked it, when and the exact revision. Any later change to copy, order,
duration, source label, frame, style or selected motion reopens the affected shot in
section 1 and requires the board to be re-locked. Never record inferred approval.

Keep `storyboard/index.html`, its referenced assets and every revision in project version
control or uniquely named source snapshots. Copy [the supporting record](assets/storyboard.md)
for provenance, parity evidence and proof/approval receipts only. That markdown record
is not another storyboard or a competing source of creative decisions.

## 2. Animate and deliver

Start only from a locked HTML storyboard revision. Shot order, copy, durations, source
labels and look are fixed. If implementation cannot match a boarded shot, stop and
explain which shot and why; resolve it through section 1. Do not silently change copy
or timing to make a shot work.

### Build the shots

Composed shots use [the native starter](native/README.md). Remotion Studio is the
implementation preview after board lock, not an alternative first approval path. It
supplies play/pause, replay, frame seeking, full-film preview and per-variant compositions.
Its scene components and timing drive native preview and final render.

Reuse one deterministic scene/timing implementation across HTML animatic and native
rendering. When porting the initial HTML studies, extract shared state/timing and scene
logic into local source modules consumed by both views, not two approximate designs.
Follow the [port and parity contract](references/storyboard.md#native-port-and-parity):
compare identical times at entrances, boundaries and holds, including reverse seeking,
stop/restart and asset readiness. The bundled HTML and native examples are different
illustrations; copying both does not establish parity. `motion-preview.html` remains
a recipe sandbox only.

Adapt scenes with source-backed components or captured footage. Do not invent submitted
queries, answers, live numbers or controls and present them as observed product behavior.
Use authentic marks and licensed assets. Preserve pair identities, token/stock
distinctions, fee tiers, units and dates. Keep glyph sizes independent of morphing panel
dimensions; use uniform camera scaling only intentionally. Never stretch text or replace
soft logos with invented vectors. Record unavoidable softness honestly.

Recorded shots use [real capture](references/capture.md): drive real controls, mark
beats, hide dev chrome during capture and cut one selected take. Keep recorded behavior
visibly distinct from composed presentation. Capture-only proof approval is an operator
gate; the cut CLI does not enforce native approval receipts.

### Review and exact-proof approval

1. Preview entrances, settled states and exits, including reverse seeks. Compare frames,
   copy and exact-time parity against the locked board; preserve prior previews.
2. Render a low-resolution **full-film proof before the delivery render**, including
   before 4K. Watch normally and compare pacing to the locked animatic. Contact sheets
   alone cannot establish rhythm or pacing.
3. Obtain director approval tied to the content revision hash, selected content and exact
   proof SHA-256. Record who approved, when and the proof file. The native final command
   validates the proof receipt and approval record; see [native commands](native/README.md).
   Changes to selection, source, timing, fonts, assets or copy invalidate proof approval.
   Do not fabricate review records. Board lock is not approval of different film content.
4. Render the approved film and [verify the actual output](references/verify.md), including
   decoded delivery frames and normal-speed playback. Report sampled inspection and
   playback separately. An unchanged approved revision needs no repeated approval gate;
   technical checks still apply.

### Output contract

Every MP4 stays directly together in project `export/`: shot previews, failed proofs,
intermediate encodes, final deliveries and historical versions. Never split MP4s into
review/build/archive directories. `checks/` holds frames, receipts, reports and logs;
`build/` holds bundles, raw WebM takes and non-MP4 intermediates. Source, assets and
storyboard revisions stay outside these generated directories.

Use unique names; never overwrite or delete old outputs. Before migrating existing
outputs, inventory and hash them, resolve name collisions, update references and verify
retained bytes. Migration requires project authorization; this skill does not move
historical artifacts automatically.

[Setup](references/setup.md) covers isolated installation, browsers and capacity.
Both hosts install the same canonical package revision; machine differences belong in
configuration, never host-specific workflow forks. No script installs packages, starts
services or acquires credentials automatically.

## Optional copy and staging

Only when requested, load installed `brand-voice` and `typefully` skills and read
[publishing constraints](references/publishing.md). If absent, hand over the verified
MP4 and approved copy; do not invent an authentication path. Verify each mention against
the intended account's current official profile. Preserve latest human Typefully edits,
patch only authorized fields and read back the result. Upload/stage is not permission
to schedule or publish. The human sends unless explicitly authorized otherwise.

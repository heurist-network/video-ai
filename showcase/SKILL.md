---
name: showcase
description: "Create a product feature video through a locked storyboard first, then native React/Remotion rendering or real browser capture and verification. Use when asked to record a demo, make a feature video, or produce a launch clip."
---

# Showcase

An agent-native motion graphics pipeline for high-quality product demo videos and
motion graphics. The storyboard is the center of gravity: everything is debated and
edited there until the human directors agree, and only then are scenes animated.

## 1. Brief and ideation

Understand the project (usually a frontend product) from its source code and docs
before asking anything: scope, design language, the features to showcase and how they
actually behave. Then use the installed `grilling` skill to settle what the code cannot
answer. If it is unavailable, ask **one question at a time**, include your recommended
answer and its trade-off, wait for feedback, then resolve the next unsettled dependency.
Do not ask code-answerable or trivial questions; gather authentic insight.

Fixed decisions:

- Audience: the project's X (Twitter) followers, existing users and prospective users.
- No sound or music.

Decide the one message the viewer should take away, target duration, aspect ratio,
delivery size and visual references. Derive duration from how much copy and UI the
viewer must read, not from a template. Draft the on-screen copy now, because copy
sets read time and duration, and changing it later means re-animating a shot.

Use these input sources to guide your design:

- Real product features: the implemented source code and running build.
- Composed product features: features not yet built, or a simplified mock of a
  complex real one (e.g. production AI chat input has many states and auxiliary text;
  the video needs a visually simplified version that shows its essence).
- Screenshots and reference videos we find inspiring.
- Conversations, meeting transcripts and marketing notes.

Produce one or two style frames alongside the first shot stills: finished stills of
key moments that fix typography, color and how the UI is framed. They evolve with the
board and are settled when the board locks.

### Produce the storyboard

Copy [the storyboard record](assets/storyboard.md) into the project's `storyboard/`
directory. The board holds the brief, the style frames and one row per shot with its
viewer takeaway, final on-screen copy, real-or-composed label with input source,
entrance, hold and exit durations, and a still that shows the shot's settled state.
Draw stills in the style frames' look; real shots use actual product components or
screenshots, composed shots are drawn to the simplified mock. Durations should land
near the target length. [Motion patterns](references/motion-patterns.md) are a
reference for how shots can move, not a menu to pick from.

Play the board as a timed animatic: the stills shown for their planned durations,
rendered as a low-resolution MP4 in `export/`. Contact sheets and tables cannot show
rhythm; the animatic is how directors judge pacing before anything is animated.

### Review and lock

Directors debate the board shot by shot. Edit the board and re-render the animatic for
every change. Keep prior versions of a shot by variant ID so directors can compare.

The board locks as a whole, once, when every shot is agreed. Record in the storyboard
who locked it, when, and which animatic they watched. After the lock, any change to
copy, shot order, duration, source label, still or style frame reopens section 1 for
that shot and the board must be re-locked.

### Section 1 output

- `storyboard/`: the record, style frames and shot stills, every revision retained.
- `export/`: animatic MP4s, one per board revision, uniquely named.

## 2. Animate and deliver

Start only from a locked storyboard revision. The board is the spec: shot order, copy,
durations, source labels and look are fixed. If animating reveals a shot cannot be
built as boarded, stop and say which shot and why; the fix goes through section 1.
Never silently adjust copy or timing to make a shot work.

### Build the shots

Composed shots use [the native starter](native/README.md). Remotion Studio supplies
play/pause, replay, frame seeking, full-film preview and a separate composition per
shot variant, and the same scene components drive preview and final render. Never
build an independent HTML mock that differs from the renderer; `motion-preview.html`
is a recipe sandbox only. Adapt the starter with source-backed product components.
Do not invent submitted queries, answers, live numbers or controls. Use authentic marks
and licensed assets. Preserve pair identities, token/stock distinctions, fee tiers,
units and dates. Keep glyph sizes independent of morphing panel dimensions. Never
stretch text or replace low-resolution logos with invented vectors. Record unavoidable
softness honestly.

Recorded shots use [real capture](references/capture.md): drive the real app, mark
each beat, hide dev chrome during capture, and cut the one selected take by beats.
Keep recorded product behavior visibly distinct from composed presentation.

### Review and approval

1. Preview each shot's entrance, settled state and exit, including reverse seeks, and
   check it against its storyboard still and copy. Preserve prior previews and choices.
2. Render a low-resolution full-film proof before the delivery render. Watch it at
   normal speed and compare its pacing to the locked animatic.
3. Get the director's approval of that exact proof and record who approved it, when,
   and which proof file. Any change to selection, source, timing, font, asset or copy
   after that needs a new proof and a new approval.
4. Render the approved film, inspect decoded delivery frames and normal-speed playback
   with [verify](references/verify.md). Report sampled inspection and playback
   separately.

### Section 2 output

Every MP4 goes directly in `export/`: shot previews, failed proofs, intermediate
encodes, final deliveries and historical versions. Never split MP4s into review, build
or archive directories. `checks/` holds frames, receipts, reports and logs; `build/`
holds bundles, raw WebM takes and non-MP4 intermediates. Use unique names; never
overwrite or delete old outputs.

Installation, browsers and machine capacity are explicit checks described in
[setup](references/setup.md). No script installs packages, starts services or
acquires credentials.

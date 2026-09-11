# Storyboard page

The storyboard is one hand-authored HTML file, `storyboard/index.html`, that the team
opens in a browser. The agent writes and edits it directly as directors decide.
[The template](../assets/board/index.html) starts with one style block and one script;
shared local scene/timing modules may be extracted for native reuse. Copy it and replace
its example content. It demonstrates the page contract and one motion study, not a
finished continuous film or parity with the separate native example.

```sh
node "$SKILL/scripts/board.mjs" new "$PROJECT/storyboard"
node "$SKILL/scripts/board.mjs" check "$PROJECT/storyboard/index.html"
```

`check` validates the contract below and prints the shot list with durations as JSON.
Run it after each edit, before sharing the page and when section 2 needs the shot list.
It checks shot IDs, positive durations, titles and frame presence. It does not validate
visible timing labels, selected-variant behavior, continuity, lock authority or native
parity. Review those separately. Host the directory on an authorized review surface;
images it references sit beside it. Do not expose private product data publicly.

## Page structure

- Header: eyebrow with product and draft number, a title, one paragraph stating the
  film length, which shots offer variants, recommended picks and current lock status.
  For a locked board, include the approving directors, time and exact revision. A status
  tag, and the animatic and print buttons.
- A nav listing every shot.
- One `<section>` per shot: number, title, timing range, the frame, then a three-column
  notes grid with **Composition**, **Motion** and **Source / boundary**.
- A summary with the story in one paragraph and the production boundaries.
- A footer with evidence paths and review caveats.

## Contract the script and `check` rely on

```html
<body data-status="draft">                              <!-- or locked -->
<section id="shot-03" data-shot="03" data-duration="2.5" data-selected="A">
  <div class="meta"><span class="num">03</span><h2>Title</h2><span class="time">4.0–6.5s · proposed</span></div>
  <div class="frame-review"><div class="frame"> ... </div></div>
  <div class="notes"> ... </div>
</section>
```

`data-duration` is seconds; the timing range text is derived by hand from the running
total. `data-selected` names the recommended variant for shots that have a study.
Everything else on the page is free.

## Frames

A frame is a `div.frame` with `aspect-ratio: 16/9` and `container-type: inline-size`.
Everything inside is sized in `cqw`, so the frame scales to any width with no script,
in the page, in the animatic overlay and in print. Build frames from the product's
real components and data: actual tables with actual rows, actual labels, actual logos.
Use `tabular-nums`. Keep glyph geometry fixed; move surfaces, crop with a uniform
transform, never reflow or stretch text.

A shot that is a keyframe is just markup. Shots that share a layout reuse the same DOM
with a shot class that restyles it, for example `.shot-close .hero` enlarging one card.

## Motion studies and variants

A shot with alternatives registers one entry in the script's `studies` map:

```js
'03': {
  duration: 1600,
  variants: {A: '3A · Recommended: ...', B: '3B · Alternative: ...'},
  build(frame, variant, animate) { animate(el, keyframes); ... }
}
```

`build` attaches paused Web Animations for the chosen variant; the shared code adds
the variant buttons, Start / Transition / Settled phase buttons, Replay once, a status
line and the reduced-motion fallback. Variants differ in
keyframes, not in DOM copies. Coordinates are in `cqw`; numbers never interpolate.
The frame must read as the settled shot when loaded.

## Feedback and lock

Directors only read the page. They reply in chat or in an unstructured feedback
markdown; the agent applies the feedback to the page, updates `data-selected` and the
header's recommended picks, and reshares. When nothing is contested, set
`data-status="locked"`, change the tag text and record who locked it and when in the
header.

The template's **Play animatic** moves frames into a full-screen overlay for each
`data-duration`, replays registered studies, then restores the frames. Its timer-driven
player is a rough sequencing aid: Stop/Escape is observed after the current wait, and
keyframe-only shots have no connecting motion. Do not treat that starter behavior as
the production playback contract. Implement the real transitions and deterministic
seeking in the project before locking a finished motion treatment.

Keep all revisions and variant IDs in project version control or unique snapshots.
After lock, a change to copy, duration, order, source, frame, style or selected motion
reopens the affected shot and requires a new whole-board lock. The supporting
[proof and asset record](../assets/storyboard.md) links evidence; creative decisions
remain in this HTML page.

## Native port and parity

Use one deterministic timeline and shared scene logic, not parallel HTML and React
designs. Initial studies may start inline in the HTML. During the port, extract their
scene data, timing, easing and state-at-time logic into project `src/` modules used by
both the HTML review page and the native components. Reuse scene markup/components
where possible; any DOM/React adapter must apply the same complete state, not recalculate
an approximate animation. The native starter's example `src/storyboard.mjs` is renderer
input derived from the locked board, not an independent creative decision source.

Freeze a copy of the locked board and its referenced local assets in the render
workspace's `public/board-lock/` before the proof. Keep shared modules in `src/` and
fonts/media in `public/`, which the existing revision command hashes. Reference the
locked HTML revision in the supporting record. The renderer does not parse board-lock
metadata or enforce director consent; the operator must check the active board against
the frozen copy and refresh it after any re-lock. Do not import mutable files outside
the hashed input tree or introduce another approval mechanism.

For each port or visual/timing change:

- Compare HTML and native views at the same absolute seconds/frame numbers at entrance,
  intermediate approach/click, both sides of every shot boundary, settled hold and exit.
  Match viewport/aspect ratio, selected variants, fonts and asset versions. Record the
  sampled times and side-by-side evidence in `checks/`, including differences and fixes.
- Check reverse seeks and immediate stop/restart. Wait for images/fonts and decoded
  footage frames; reduced-motion review must still expose inspectable settled states.
- Watch the full animatic and proof normally. Exact-time samples do not establish
  pacing or approval. A technical port must preserve the locked look and motion; any
  creative change goes back to board review before a new proof.

The shared-logic and parity requirements apply to the adapted project. Neither bundled
example implements a complete cross-renderer film, and `board.mjs check` cannot prove
these requirements.

# Storyboard page

The storyboard is one hand-authored HTML file, `storyboard/index.html`, that the team
opens in a browser. The agent writes it directly, one style block and one script, and
edits it in place as directors decide. `assets/board/index.html` is the template and a
complete example; copy it and replace everything.

```sh
node "$SKILL/scripts/board.mjs" new "$PROJECT/storyboard"
node "$SKILL/scripts/board.mjs" check "$PROJECT/storyboard/index.html"
```

`check` validates the contract below and prints the shot list with durations as JSON.
Run it before sharing the page and when section 2 needs the shot list. Host the
directory anywhere; images it references sit beside it.

## Page structure

- Header: eyebrow with product and draft number, a title, one paragraph stating the
  film length, which shots offer variants, the recommended picks and that nothing is
  locked. A status tag, and the animatic and print buttons.
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

**Play animatic** moves each frame into a full-screen overlay for its `data-duration`,
replaying its study, then puts it back. Escape stops it.

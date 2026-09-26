# Storyboard page

Stage handoffs are owned by [workflow.md](../../docs/workflow.md).
This guide owns the HTML page contract.

The storyboard is one hand-authored HTML file, `storyboard/index.html`, that the team
opens in a browser. The agent writes and edits it directly as directors decide.
[The template](../assets/board/index.html) starts with one style block and one script.
Copy it and replace its example content. It demonstrates the page contract and one
motion study, not a finished continuous film.

```sh
node "$SKILL/scripts/board.mjs" new "$PROJECT/storyboard"
node "$SKILL/scripts/board.mjs" check "$PROJECT/storyboard/index.html"
```

`check` validates the contract below and prints the shot list with durations as JSON.
Run it after each edit, before sharing the page and when section 2 needs the shot list.
It checks shot IDs, positive durations, titles and frame presence; review timing labels,
variant behavior and continuity in the browser. Images the page references sit beside
it. Do not publish private product data.

## Page structure

- Header: title, duration and a brief statement of any open creative choices. Show a
  revision identifier when useful. Offer an animatic button only if that preview exists.
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
in the page, in the animatic overlay and in print. For product demos, use the product's real components and data. For promotional
graphics, follow the [treatment guidance](shot-direction.md#choose-promotional-graphics-or-a-product-demo):
compose only the essential message, using source-backed facts without recreating UI.
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
keyframes, not in DOM copies. Coordinates are in `cqw`. Keep source-backed values
fixed unless numeric change is part of the brief; animate a price only through observed
values, never from zero. The frame must read as the settled shot when loaded.

## Feedback and lock

Apply human feedback to the page using the [workflow handoffs](../../docs/workflow.md).
Reflect actual approval in the header and data-status only after it is received;
identify the approved board revision when useful. Never infer a lock.

The template's **Play animatic** moves frames into a full-screen overlay for each
`data-duration`, replays registered studies, then restores the frames. It is a rough
sequencing aid: keyframe-only shots have no connecting motion. A board can lock with
transitions described in words; build a motion study only where needed to settle a
creative choice, and implement full transitions during production.

Keep every revision. Apply requested changes and return the revised result for feedback;
the [workflow](../../docs/workflow.md) owns what authorizes production.

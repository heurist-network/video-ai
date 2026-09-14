# Reusable launch-video patterns

Source: [Antonia's Minara feature-video archive](https://github.com/Antoniaiaiaiaia/minara-feature-videos),
inspected at commit `cdf1758f4cce4fafb86c60206bccfeb9c5440679`.
The archive contains independent scene projects, iteration exports, storyboards, and
motion examples. Its final editor projects may be absent; do not assume a single build
recreates every published film. This reference records source behavior and our adaptation
choices separately. It does not certify upstream renders.

## Choose a pattern

| Pattern | Observed source recipe | Use in showcase |
| --- | --- | --- |
| Whole-subject camera | Center anchor; move one rig using x/y/scale. `.96 → 2.25`, y `0 → -756`, `.78s`, `power3.inOut`; return/reframe `.46s`. [Camera example](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/app-2.0-video/examples/camera-zoom/README.md) | Push into a recorded input or result. Recalculate framing for the target footage. Bundled as `camera()`. |
| Text blur-pop | Opacity `0 → 1`, y `24 → 0`, scale `.94 → 1`, blur `12px → 0`, `.58s`, `power3.out`, `.18s` stagger. [Text example](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/app-2.0-video/examples/text-blur-pop/README.md) | Whole words or meaningful phrases on a title card. Bundled as `textPop()`. Let the text hold still once it lands. |
| Detail, overview, scan | Detail at scale `1.85`, x `-113`, y `77.5`; pull out to scale `1`, x `0`, y `-60` in `.75s`; scan to y `-760` in `1.55s`. [Dashboard scene](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/minara-cross-sectional-factors/scene2-ui.html#L79-L91) | Establish one real result, reveal its context, then scan. Source also animates synthetic cards; borrow the camera grammar only for a product demonstration. |
| Geometry-anchored pointer | Measure target rect relative to stage rect, convert by `1920 / stage.width`; send approach `.42s`; ring `.25s`, scale `.6 → 1.7`, fade out. [Pointer code](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/harness-1min-scenes/codex/scenes/s06/scene-v13.js#L180-L190) | Measure the live locator after layout settles, then use existing `stage.glide()` and a real click. Do not replace real interaction with an animated cursor. |
| Zoom, pan, settle | Scale to `1.22` in `.36s`, pan to `(-115,-28)` in `.67s`, settle to `(-32,16)` in `.36s`, `power2.inOut`. [Workflow camera](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/harness-1min-scenes/codex/scenes/s06/scene-v13.js#L122-L129) | Inspect a real canvas. Keep the background grid and content in the same coordinate system. |
| Overlapping chapter transition | Outgoing view opacity to zero and y to `-22` in `.32s`; incoming view to opacity one/y zero in `.42s`, starting at `+.28s`. [Content swap](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/minara-cross-sectional-factors/scene4-demo.html#L183-L190) | Adapt for editorial transitions between recorded chapters; do not imply an invented app transition is native. |
| Cylindrical selection reel | Pitch `129`, angle `distance × .36`, radius `530`, visibility within `3.5` rows; opacity `exp(-.4 × distance²)`, blur capped at `2px`. [Reel projection](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/harness-1min-scenes/codex/scenes/s18-s19/scene.js#L21-L33) | Optional composed category montage with owned artwork. Use only when selection is the story; this is not a default treatment for every feature. |

The numeric transforms describe those source layouts, not universal camera positions.
The two DOM helpers adapt the first two recipes without GSAP or network dependencies.
The native starter adapts the blur-pop quartic entrance and upward fade exit with absolute
frame state. Other rows are implementation references, not installed effects.

## Using the portable assets

Copy `assets/motion-kit.js` and its `LICENSE.minara.txt` together into the composition.
The offline `assets/motion-preview.html` demonstrates both helpers and exposes `seek(t)`
in seconds. It is a recipe sandbox, not an approval storyboard or final-render source.
Start with the [HTML storyboard](storyboard.md); after approval, use the selected renderer for
implementation preview and MP4 rendering (`native/` only for Remotion). Reuse scene/timing logic across the HTML
animatic and native implementation and check exact-time parity during the port.
The sandbox's neutral frame is explicitly illustrative and uses system fonts.
Replace its words, colors, and subject with the target's chosen direction and footage.

```js
// Browser global after loading motion-kit.js; CommonJS exports are also available.
ShowcaseMotion.textPop(document.querySelectorAll('.phrase'), time, {
  start: 0.2, duration: 0.58, stagger: 0.18
});
ShowcaseMotion.camera(document.querySelector('.rig'), time, {
  start: 1.25, duration: 0.78,
  from: { x: 0, y: 0, scale: 0.96 },
  to: { x: -90, y: -340, scale: 1.55 }
});
```

Each call sets a complete state from absolute time and can be called in any order of
frames. Inputs are seconds and composition pixels, with finite values and nonnegative
durations. Zero duration means a cut. `textPop()` owns opacity, transform, and filter;
`camera()` owns the rig's transform and transform-origin. Use dedicated wrappers rather
than overwriting transforms on app elements or the document root. Disable CSS transitions
on these wrappers. The preview uses in-page rAF for playback; offline rendering should
call `seek(frame / fps)` directly.

For multiple camera intervals, select the active interval explicitly and supply complete
from/to states, as in the preview. Calling every interval unconditionally would let the
last one overwrite the current move. No autonomous timers, random motion, or accumulated
deltas belong in the render path. GSAP's `power3` corresponds to a quartic curve; the
helpers reproduce it with fourth powers.

A composed video needs more than deterministic CSS: set each footage element's
`currentTime` from the composition time, await its decoded frame, and await fonts/images
before capture. These DOM helpers do not synchronize media or render an MP4. Use the
bundled native renderer or the project's renderer for that work. Keep `stage.js` for recording actual interaction and
`cut.js` for beat-based footage editing.

## Framing and premium presentation

These are adaptation choices for showcase, not requirements inherited from Minara:

- Give each shot one subject and one payoff. Use a wider context shot before an extreme
  close-up when the viewer would otherwise lose their place.
- Move the entire device or footage rig together. Derive its final transform from the
  actual target rectangle. A 2.25× source move is a reference, not permission to clip
  the target control or enlarge soft footage.
- Preserve the product's status colors inside its UI. Let the surrounding frame borrow
  the product's approved typography and materials without importing Minara's branding.
- Use meaningful phrase groups for entrances. Keep final text sharp and stationary;
  avoid a second pulse of blur while the viewer is reading.
- Let the pointer arrive before the recorded click and the camera settle before the
  payoff hold. Add decorative motion only when it explains an action or change.
- Inspect key frames at delivery size. A beautiful full-screen preview may contain
  unreadable labels after a social feed scales it down.

## Asset provenance and retained patterns

[LICENSE](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/LICENSE)
permits reuse of original source under MIT. Preserve the included notice when copying
or adapting it. [ASSETS.md](https://github.com/Antoniaiaiaiaia/minara-feature-videos/blob/cdf1758f4cce4fafb86c60206bccfeb9c5440679/ASSETS.md)
excludes blanket permission for logos, fonts, music, screenshots, reference films, and
rendered media. A missing asset license grants no additional rights. Dependencies retain
their own terms. Use owned or separately licensed replacements; do not download the
entire media archive as a supposedly royalty-free asset pack.

Each reused asset
needs a source/commit/file, rights, adaptation, shot reference, and inspection evidence.
Each retained recipe needs its trigger, motion parameters, coordinate system, constraints,
and a reproducible preview. Keep source-observed, locally adapted, and render-verified
states distinct.

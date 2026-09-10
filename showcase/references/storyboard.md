# Storyboard page

The storyboard is a directory the agent maintains and a page the team opens:

```
storyboard/
  board.json        source of truth: brief, shots, variants, notes, lock
  frames/           one file per variant: still image, HTML frame or clip
  index.html        generated; never edit by hand
```

Build or rebuild the page after every edit:

```sh
node "$SKILL/scripts/board.mjs" --board "$PROJECT/storyboard/board.json"
```

The page is static. Host the directory anywhere or open `index.html` from disk.
`assets/board/` is a complete example with all three frame types.

## board.json

```json
{
  "title": "Stock tokens",
  "subtitle": "Heurist Finance / draft 05",
  "summary": "One paragraph on what the film does.",
  "status": "draft",
  "frame": {"width": 1920, "height": 1080},
  "brief": {"Viewer takeaway": "...", "Aspect ratio and target duration": "..."},
  "shots": [
    {
      "id": "03",
      "title": "Card becomes the table",
      "duration": 2.5,
      "takeaway": "One pool row is the unit of comparison.",
      "copy": "Exact on-screen text, if any.",
      "source": "real",
      "input": "app build 2026-09-09, pool table component",
      "selected": "A",
      "notes": {"Composition": "...", "Motion": "...", "Source / boundary": "..."},
      "variants": [
        {"id": "A", "label": "Recommended: rows reveal together", "frame": {"type": "html", "src": "frames/03a.html", "animated": true}},
        {"id": "B", "label": "Alternative: short stagger", "frame": {"type": "html", "src": "frames/03b.html", "animated": true}}
      ]
    }
  ],
  "closing": {"Story": "...", "Production boundaries": "..."},
  "lock": {"by": "name", "at": "2026-09-12", "note": "optional"}
}
```

`brief`, `notes` and `closing` are free-form key/value blocks rendered in order; use
the headings the directors expect. Shot timing is cumulative from `duration`. A shot
with one variant shows no picker. `status` is `draft` or `locked`; `lock` is written
when the directors lock the board.

## Frame types

- `still`: any image. Use for shots where nothing moves or a reference screenshot.
- `clip`: an MP4 or WebM, for example a shot proof from section 2 or a capture take.
  The page shows a replay button and plays it in the animatic.
- `html`: an HTML fragment rendered inside a sandboxed iframe at `frame.width` by
  `frame.height`, scaled to fit. Build it from real product components and data,
  the way a style frame is built. With `"animated": true` the page adds phase buttons
  and a replay button; the fragment must then expose:

```js
window.frame = {
  replay() { /* run the motion once from the start */ },
  seek(phase) { /* jump to 'start', 'transition' or 'settled' without playing */ }
};
```

Phase names default to start, transition and settled; override with `frame.phases`.
Use the Web Animations API with paused animations so `seek` sets `currentTime` and
`replay` plays; see `assets/board/frames/opening-a.html`. Keep glyphs fixed and move
surfaces; the frame should read as the settled shot when loaded.

## Decisions

Variant pickers and the director notes on the page store in the viewer's browser
only. When the directors are done they press **Copy decisions** and paste the JSON to
the agent, which applies each pick to `selected`, resolves the notes, and rebuilds.
Repeat until nothing is contested, then set `status` to `locked` and fill `lock`.

**Play animatic** runs the selected variant of every shot for its duration, in order,
full screen. Escape stops it.

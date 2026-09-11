# Verifying the delivered MP4

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

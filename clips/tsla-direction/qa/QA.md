# Final verification

Official HyperFrames 0.8.37 rendered `renders/tsla-direction.mp4` at high quality.

- FFprobe: H.264, 1080×1920, 30/1 fps, 240 frames, 8.000000 seconds, 463181 bytes.
- Exactly one stream: video. No audio stream (silent).
- Final official check: lint/runtime/layout/motion/contrast pass, zero errors and warnings. 161 motion samples; 22/22 contrast checks passed.
- Inspected browser snapshots at 2.8s and 7.966s; exact full sentence visible on final hold.
- Inspected actual encoded MP4 contact sheet across the whole clip and actual frame 239 (7.966s). All seven words visible, exact case and punctuation, clean margins, common balanced baseline, white final alternatives.
- Actual encoded proof frames: 0.6, 1.7, 2.8, 3.9, 4.4, 5, 7.966 seconds.
- Official `keyframes --shot` run saved down-motion.png. Its source parser does not expand loop-authored entrance tweens; the generated diagnostic overlay is not used as proof of final appearance. Rendered contact sheet and full-resolution MP4 frames are authoritative.

One early seek defect was caught by pixel inspection despite green assertions: binary `tl.set` reveals lost earlier words at late seeks. Explicit fromTo opacity gates repaired it. Final render has the repaired composition. No known remaining defect.

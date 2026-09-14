# HyperFrames runtime essentials

## Composition and timing

A standalone root lives directly in the document, with a composition ID and explicit
pixel dimensions. Do not wrap it in a template. Imported sub-compositions use the
separate template/host contract; read core’s sub-compositions reference when adding one.
For our fixed-duration clips, author the root duration in static HTML: changing it from
JavaScript does not change the compiled render length.

For GSAP, construct one paused timeline per composition and register the finished
timeline in `window.__timelines[id]`, matching the root ID. Font-dependent async setup
is supported; registration must happen after all tweens are built. Let HyperFrames seek
it instead of calling play or driving animation with timers.

A frame must reproduce from its requested time alone. Freeze required assets locally,
seed random-looking placement, and avoid live network data, wall clocks, user input and
state accumulated during playback. Repetition must fit a finite duration.

HyperFrames owns timed clip visibility. Animate visual properties or inner wrappers
without competing with that lifecycle. Avoid two timelines controlling the same property.
Prefer transforms and opacity for performance; size transformed elements and leave room
for glyphs and motion overshoot inside masks.

## Known upstream inconsistency

The installed animation overview bans async construction and width/height tweens. Core’s
detailed determinism reference explicitly permits completed async setup and describes a
property denylist rather than that blanket ban. Follow the specific runtime contract;
check the pinned version if relying on these features. These are not local creative bans.

## Verify the result

Use project commands and the installed CLI reference. Resolve lint errors before trusting
layout/contrast results: zero samples may mean those checks never ran. Inspect rendered
frames where motion, masks or layout change, and watch normal playback to judge pacing.
Finish the authorized render and fixes before the workflow’s human review handoff.

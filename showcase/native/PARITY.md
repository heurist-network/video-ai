# Native port and parity

Read only when porting an HTML board or motion study to the optional Remotion starter.


For animated studies that exist, use one deterministic timeline and shared scene logic,
not parallel HTML and React designs. Static frames and described motion do not require
a prebuilt animatic; implement them within the locked design and motion intent. Initial studies may start inline in the HTML. During the port, extract their
scene data, timing, easing and state-at-time logic into project `src/` modules used by
both the HTML review page and the native components. Reuse scene markup/components
where possible; any DOM/React adapter must apply the same complete state, not recalculate
an approximate animation. The native starter's example `src/storyboard.mjs` is renderer
input derived from the locked board, not an independent creative decision source.

Freeze a copy of the locked board and its referenced local assets in the render
workspace's `public/board-lock/` before the proof. Keep shared modules in `src/` and
fonts/media in `public/`, which the existing revision command hashes. The renderer does not parse board-lock
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
- Watch the full proof normally, and the animatic if one exists. Exact-time samples do not establish
  pacing or approval. A technical port must preserve the locked look and motion; any
  creative change goes back to board review before a new proof.

The shared-logic and parity requirements apply to the adapted project. Neither bundled
example implements a complete cross-renderer film, and `board.mjs check` cannot prove
these requirements.

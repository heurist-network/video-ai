# Native rendering starter

An illustrative two-shot motion study, not live app behavior. No product data, logos,
accounts, credentials, remote assets or network data clients are bundled. Begin here
only after directors lock the project's HTML storyboard; this is its implementation
preview and guarded renderer, not a competing storyboard-first review surface.
For a port, read [HTML/native parity](PARITY.md).
Read [shot direction](../references/shot-direction.md) before designing or porting shots.

Copy this starter's contents into the project showcase workspace without overwriting
existing files; resolve any collision before copying. Keep the HTML board in
`storyboard/` and `src/`, `public/`, package files and scripts together at the workspace
root so every MP4 shares its `export/` directory. Install dependencies
explicitly there with `npm ci --ignore-scripts --no-audit --no-fund`. Direct dependencies
are pinned and `package-lock.json` records transitive resolution. A clean local install
and full-film proof were tested with lifecycle scripts disabled. Review dependency
updates and retain the lock in the product workspace. See [setup](SETUP.md)
before installing.

Set `SHOWCASE_BROWSER` to an installed browser executable. The runner defaults to
`headless-shell`. For regular modern Chrome, set `SHOWCASE_CHROME_MODE=chrome-for-testing`
or pass `--chrome-mode chrome-for-testing`; old headless mode is no longer supported
by regular Chrome. Use the same browser/mode for proof and final. Run
`npm run studio` for a loopback-only static Remotion Studio snapshot. Restart the command
after source edits to build the next preview revision. Do not use Studio's browser-export
button: browser downloads bypass the approval and export-directory contract. Use the
guarded CLI instead. Use its timeline to play, scrub,
seek backward, replay, and inspect every `Shots/shot-<shot>-<variant>` composition.
All previews and final renders use `Shot` and `Film` from `src/Scenes.jsx`, with timing
from `src/timing.mjs`. Port the locked HTML animatic using shared scene/timing modules,
following [native port and parity](PARITY.md).
Compare identical times at entrances, boundaries and holds; do not recreate an
approximate second design. The native and HTML examples are different illustrations,
not a pre-integrated film. Freeze the locked HTML/assets in `public/board-lock/` and
keep shared implementation modules in `src/` so the existing revision hash covers them.

Derive `src/storyboard.mjs` from the locked HTML board: preserve variant entries,
match its approved `selected` values, and keep the sum
of entrance/settled/exit frames equal to `targetSeconds * fps`. Revision labels describe
iterations; the content hash, not that label, binds approval. Preserve previous source
revisions with project version control or uniquely named source snapshots. Snapshot the
source and license records before editing an approved iteration.

```sh
npm test
npm run revision
npm run proof -- --browser "$BROWSER" --composition shot-opening-rise
npm run proof -- --browser "$BROWSER"
```

Proofs render at half board size and final at twice board size, with concurrency 1.
Both default to H.264, yuv420p, no audio. A 1920x1080 board gives 960x540 proofs and
3840x2160 finals. Audience and sound intent come from the brief; if sound is required,
explicitly adapt delivery policy and audio handling in project source, then review a
new proof. Silent AAC from the capture cutter is not sound design. Source changes,
including the runner, invalidate earlier approval.
To integrate footage use Remotion's frame-synchronized media components, not a DOM video
whose clock runs independently. Local assets belong in `public/`, referenced with
`staticFile()`. Bundle fonts with their licenses for cross-host metrics. Do not import
external mutable files or fetch runtime data: freeze and hash approved inputs locally.

Each successful render prints its MP4 path and checks receipt. After the user watches
the exact full-film proof and approves it, record `approval.json`:

```json
{
  "decision": "approved",
  "reviewer": "<human reviewer>",
  "reviewedAt": "<ISO timestamp with timezone>",
  "revision": "<revision from full proof receipt>",
  "proofSha256": "<sha256 from full proof receipt>"
}
```

This file records actual approval, not permission for the agent to approve itself.
The runner checks source/assets/package/runner hashes, proof bytes and full-film status.
It cannot prove that a human watched or consented; that remains the operator's obligation.

```sh
npm run final -- --browser "$BROWSER" --receipt checks/<proof-run>/receipt.json --approval approval.json
```

All MP4s, including failed or intermediate outputs, remain directly in `export/` under
unique names. Bundles stay in `build/`; event logs and receipts stay in `checks/`.
Reruns never delete or overwrite prior outputs. Avoid editing source during a render;
a detected mid-render change retains the output but fails without a valid receipt.
Inspect decoded frames with the parent skill's `verify.js`, and watch normal-speed
playback. The starter's generic title design is a runnable example, not an approved
visual direction for any product. Remotion commercial licensing is a separate gate.

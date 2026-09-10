# Native storyboard starter

An illustrative two-shot motion study, not live app behavior. No product data, logos,
accounts, credentials, remote assets or network data clients are bundled.

Copy this directory into a new project-local showcase directory, never over an existing
project. Keep `src/`, `public/`, package files and scripts together. Install dependencies
explicitly there with `npm ci --ignore-scripts --no-audit --no-fund`. Direct dependencies
are pinned and `package-lock.json` records transitive resolution. A clean local install
and full-film proof were tested with lifecycle scripts disabled. Review dependency
updates and retain the lock in the product workspace. See [setup](../references/setup.md)
before installing.

Set `SHOWCASE_BROWSER` to an installed browser executable. The runner defaults to
`headless-shell`. For regular modern Chrome, set `SHOWCASE_CHROME_MODE=chrome-for-testing`
or pass `--chrome-mode chrome-for-testing`; old headless mode is no longer supported
by regular Chrome. Use the same browser/mode for proof and final. Run
`npm run studio` for a loopback-only static Remotion Studio snapshot. Restart the command
after source edits to build the next preview revision. Do not use Studio's browser-export
button: browser downloads bypass the export-directory contract. Use the CLI instead.
Use its timeline to play, scrub, seek backward, replay, and inspect every `Shots/shot-<shot>-<variant>` composition.
All previews and final renders use `Shot` and `Film` from `src/Scenes.jsx`, with timing
from `src/timing.mjs`. No second HTML rendering path exists.

Edit `src/storyboard.mjs`: preserve variant entries, change `selected`, and keep the sum
of entrance/settled/exit frames equal to `targetSeconds * fps`. Keep previous source
iterations in project version control or uniquely named snapshots.

```sh
npm test
npm run proof -- --browser /absolute/path/to/chrome --composition shot-opening-rise
npm run proof -- --browser /absolute/path/to/chrome
```

Proofs render at half board size and final at twice board size, with concurrency 1.
Both are H.264, yuv420p, no audio. Change delivery policy in source if required, then
review a new proof. To integrate footage use Remotion's frame-synchronized media components, not a DOM video
whose clock runs independently. Local assets belong in `public/`, referenced with
`staticFile()`. Bundle fonts with their licenses for cross-host metrics. Do not import
external mutable files or fetch runtime data: keep approved inputs local.

Each successful render prints its MP4 path and a receipt in `checks/`. After the
director approves the full-film proof, render the delivery:

```sh
npm run final -- --browser /absolute/path/to/chrome
```

Do not edit source during a render. Inspect decoded frames with the parent skill's `verify.js`, and watch normal-speed
playback. The starter's generic title design is a runnable example, not an approved
visual direction for any product. Remotion commercial licensing is a separate gate.

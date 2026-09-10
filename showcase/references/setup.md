# Portable setup and CLI-only GCP preparation

The skill is a local authoring tool, not a service. Keep its checkout and rendering
workspace isolated from product API repositories, databases and scheduler directories.
Do not modify PM2, systemd, cron, firewall rules, cloud credentials or product environment
files. Installation, browser downloads and system packages require explicit authorization.
No GCP installation or remote test is performed by the bundled scripts.

## Read-only preflight

Choose an existing project directory and run:

```sh
node "$SKILL/scripts/preflight.js" --project "$PROJECT" --mode native --browser "$BROWSER"
# Or, after a project-local Playwright installation:
node "$SKILL/scripts/preflight.js" --project "$PROJECT" --mode capture
```

The JSON reports Node >=22, ffmpeg/ffprobe, resolvable project dependencies, executable
browser presence, available disk/memory and CPU count. It writes nothing, downloads
nothing and contacts no APIs. Save its stdout in the project's checks directory when
retaining evidence. Presence does not establish browser shared-library compatibility.
Use a tiny illustrative local proof to validate runtime after authorized installation.
Budget for retained historical outputs and full-resolution frames, not just final MP4
size. Start with concurrency 1 and a low-resolution proof on shared machines.

## Explicit installation recipe

1. Obtain an approved skill revision in a dedicated tooling directory using the host's
   supported selective skill installation, or copy this skill alone. No absolute home
   directory, gstack browser or personal work bucket is required.
2. Have the operator install Node 22+ and ffmpeg (includes ffprobe) through the host's
   supported package manager. On Debian/Ubuntu, an authorized operator can run
   `sudo apt-get install ffmpeg`; Node setup depends on the distribution's supported
   version. Do not run a remote shell installer automatically.
3. Copy `native/` to an empty render workspace. Run
   `npm ci --ignore-scripts --no-audit --no-fund` explicitly there using the supplied lock.
   A clean local install and full-film proof passed with lifecycle scripts disabled.
   No global npm packages are needed. Registry access is an installation action, never
   part of preflight. Review dependency updates and retain their updated lock.
4. Supply a compatible local Chrome/Chromium executable with `SHOWCASE_BROWSER`. If the
   operator chooses Remotion's managed browser, run the installed local CLI's
   `remotion browser ensure` explicitly from `node_modules/.bin`, then use the resulting
   executable path. The render runner refuses an absent browser rather than downloading.
   For regular modern Chrome, use `SHOWCASE_CHROME_MODE=chrome-for-testing`; the default
   `headless-shell` mode is for the standalone headless shell, not current desktop Chrome.
   Presence preflight cannot detect this launch-mode mismatch; the proof render verifies it.
   On Linux, missing shared libraries require an explicit OS-package installation.
5. For real capture, explicitly install `playwright` in a separate project workspace and
   run its local CLI `playwright install chromium` only with download approval. Resolve
   it from that workspace's cwd or set `PLAYWRIGHT_MODULE` to its module directory.
6. Re-run preflight and render a small local illustrative shot. Inspect the decoded frame
   and playback before a real project. Review Remotion's current commercial license and
   every font/media license before commercial use.

## GCP access

Use SSH for the CLI. Do not open a public Studio port. If interactive review is needed,
keep Studio on `127.0.0.1` and explicitly forward its printed port through SSH, or render
a small MP4 and transfer it for local playback. No automatic tunnels or persistent
services are created. Stop only your own foreground Studio process when finished.

No cloud API, storage bucket, scheduler integration, product login or service account
is needed for the illustrative native starter. Supply project-specific credentials only
through a separately authorized capture workflow. Never copy
private product snapshots or account configuration into the shared skill.

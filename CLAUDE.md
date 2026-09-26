Start from [AGENTS.md](AGENTS.md).

## Maintaining the HyperFrames skills

`.agents/skills/` holds the official HyperFrames skill bundles with local edits: the ban on
async timeline building and width/height tweens is lifted (core's contract is to register
the timeline only after its build completes), and duplicated or case-specific negative rules
are cut. `npx hyperframes skills update` overwrites these files with upstream. After an update,
re-apply the lifted ban (see `git log -- .agents/skills`) and remove redundant instructions
again; do not keep upstream's duplicates just because they came back.

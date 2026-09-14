# Video AI

A human-directed pipeline: **reference ideas → storyboard → video**. Each stage ends
with a review, and the next stage starts from the human's feedback.

Agents start with [AGENTS.md](AGENTS.md). Humans and agents can follow the
[three-stage workflow](docs/workflow.md) and [repository map](AGENTS.md#repository-map). For production, use the
[HyperFrames guide map](docs/hyperframes.md).

| Folder | Purpose |
| --- | --- |
| `reference-lab/` | Shared Gemini analysis, searchable cards and human gallery |
| `clips/<name>/` | One project: storyboard, implementation and exports |
| `showcase/` | Reusable storyboard skill, templates and review helpers |
| `docs/` | Workflow, folder ownership and lessons from the pilot |

The motion corpus (`reference-lab/library`) is a Release asset, not git. After clone:

```sh
gh auth login
./scripts/fetch-media.sh
```

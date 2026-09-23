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

Completed clips, sample projects, generated galleries, bundled media, dependencies, and credentials are excluded from the source tree. Supply local media as needed by the workflows.

The optional motion corpus (`reference-lab/library`) is stored separately as a Release asset. To download it explicitly:

```sh
gh auth login
./scripts/fetch-media.sh
```

## License

Original code and documentation are available under the [MIT License](LICENSE).
Third-party code, skills, fonts, and media retain their respective licenses; see
[third-party notices](THIRD_PARTY_NOTICES.md). The MIT license does not relicense the reference-media archive.

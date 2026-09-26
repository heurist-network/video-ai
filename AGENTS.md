Create videos with HyperFrames. 3 steps: **find ideas → create a storyboard → produce video**. Consult [workflow](docs/workflow.md) for stage handoffs. Routine code or documentation edits do not require reading the creative workflow.

## Where to go

- **Study an external reference video:** [video-reference-study](.agents/skills/video-reference-study/SKILL.md). Produce a whole-video HTML analysis with evidence-backed scene choreography and transferable patterns.
- **Ideas:** [reference-lab/AGENTS.md](reference-lab/AGENTS.md). Search 100+ motion graphic clips, images and annotated texts about style and contents to find ideas.
- **Storyboard:** [storyboard/SKILL.md](storyboard/SKILL.md). Use static style frames and
  descriptions, adding small motion studies only when useful.
- **Video:** [HyperFrames guide map](docs/hyperframes.md). Use the repository-local official
  skills and the focused local runtime reference as needed.

## Human collaboration

Follow [workflow.md](docs/workflow.md) in stages to make videos.

End each major stage by showing the result and pausing for feedback. Do not silently
continue from ideas into a storyboard or from a storyboard into production. A human's
choice or approval authorizes the next stage.

The HTML storyboard owns shot design; update it when the human changes timing or copy.
Keep the previous revision when editing.

We default use HyperFrames to create videos.

## Repository map

Folder paths remain stable so existing videos, references and preview URLs keep working.

| Path | Owns |
| --- | --- |
| `docs/workflow.md` | Three stages and conversational human handoffs |
| `.agents/skills/` | Official HyperFrames skill bundles, loaded as needed; `.claude/skills` links here |
| `docs/hyperframes.md` | HyperFrames skill routing and conditional setup |
| `docs/hyperframes-runtime.md` | Adapted runtime essentials for composition work |
| `reference-lab/` | Shared ingestion, Gemini cards, evidence frames and search |
| `storyboard/` | Reusable HTML storyboard skill, guides, template and checker |
| `tools/` | Playwright product capture, take cutting and MP4 verification |
| `clips/<name>/` | Source inputs, storyboard, composition and video |

Use local package scripts where present. Resume from the conversation and existing
storyboard or video. Local media is in `assets/` and `inputs/`, the HyperFrames
composition in `index.html`, MP4s in `export/`, and technical outputs in `checks/`.

The TSLA pilot predates the storyboard workflow and uses `renders/` and `qa/`; preserve
those paths.

The shared corpus's source data is `reference-lab/library/references/*/card.json` with
local evidence images. `search.sqlite` provides compact retrieval. `index.html` and
`library/pages/` are generated human views; rebuild them with `python3 reference-lab/report.py`.
Search through `agent_library.py`, never by reading the generated HTML or loading the
corpus into context.

New clips go in `clips/<slug>/`. Serve only a project folder on localhost, never the repository
root containing .env.

# Lessons

- Retrieve ideas progressively: short search results, selected creative ideas, then a few
  evidence frames.
- Borrow a communication mechanism from references, not a prefab's sample copy or all its decorations.
- For motion graphics and fabricated UI copy, avoid extra labels, small descriptive texts, secondary titles, timestamps and file hashes.
- Fidelity of facts does not require copying an entire interface. Focus on meaningful visual highlights, ignore minor details.
- Storyboard step: resolve typography, hierarchy and reading order in static frames. Use a small motion study only when motion itself is the undecided choice, such as rolling decimals.
- Storyboard sections need not become sequential pauses. Multiple motions can overlap in one beat to look more dynamic. Prefer tightened pacing. Derive holds from reading needs, not always a pause between beats.

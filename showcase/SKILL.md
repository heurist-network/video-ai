---
name: showcase
description: "Create or revise a Video AI HTML storyboard with static style frames and optional motion studies."
---

# Showcase storyboard skill

[The repository workflow](../docs/workflow.md) owns stage transitions and human review.
Resume from the conversation and existing storyboard; consult the workflow when deciding
a stage handoff.

## Storyboard work

Read [shot direction](references/shot-direction.md) and [page contract](references/storyboard.md).
The former owns promotional-versus-demo treatment and visual direction; the latter owns
HTML structure and optional motion studies.

Use `storyboard/index.html` as the creative source of truth. Copy the starter, replace
its example content, and establish one or two finished style frames before a large build.
Include exact copy, timing, composition, motion connections and source/boundary notes.
Mostly static frames are sufficient. Add a motion study only when it settles a real
choice; a full animatic and implemented transitions are not required for board review.

```sh
node "$SKILL/scripts/board.mjs" new "$PROJECT/storyboard"
node "$SKILL/scripts/board.mjs" check "$PROJECT/storyboard/index.html"
```

Check after edits, inspect the browser layout, preserve a revision, and stop at the
workflow's storyboard handoff. Checks do not establish source truth or human approval.
A source-backed fact can appear in a simplified graphic; never imply composed behavior
was recorded from a real product. Dates/provenance belong in surrounding notes unless
a qualification is essential to the actual message.

## Conditional guides

- Producing the approved board: [HyperFrames guide map](../docs/hyperframes.md).
- Capturing a real product interaction: [capture](references/capture.md).
- Explicitly selected Remotion production: [native starter](native/README.md).
- Optional motion recipe examples: [motion patterns](references/motion-patterns.md).

Load these only for the corresponding task. A storyboard request does not need render,
media-sourcing or publishing instructions. Renderer implementation may derive a plan
from the HTML board when its tools require one; the board remains the creative source.

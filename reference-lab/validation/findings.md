# Gemini 3.8 Flash reference understanding: initial validation

**Result: useful for broad creative inspiration; insufficiently reliable for exact motion reconstruction without verification.** Highest supported video detail did not eliminate incorrect direction, trajectory, or production-method claims.

## Settings actually tested

Existing project key successfully accessed gemini-3.8-flash. Videos were submitted as video input, not text descriptions. Ground-truth HTML was withheld from the model. Tests used the same tightened reference prompt across the main resolution comparison; an earlier promo prompt and a later focused question are retained separately.

| Source | Duration | 2 FPS/default input tokens | 24 FPS/HIGH input tokens |
|---|---:|---:|---:|
| HyperFrames promo | 16.00s | 2,713 | 101,977 |
| Letter animation | 4.00s | 1,128 | 25,944 |
| Kinetic text | 15.02s | 2,960 | 96,020 |

The letter animation also used HIGH at 2 FPS: 2,712 input tokens. These are observed API token counts, including prompt overhead, not dollar estimates. 24 FPS/HIGH supplied substantially more input; this alone is not proof of improved accuracy.

The live endpoint rejected 30 FPS with `threshold must be less than or equal to 24`. The CLI now defaults to **24 FPS + HIGH**. This corresponds to a requested interval of approximately 41.7 ms. Source videos are unscaled. Newly saved evidence frames preserve source dimensions. HIGH is the highest documented video setting. ULTRA_HIGH is available for individual images, not video. The provider still controls internal video tokenization/resizing; HIGH does not mean every source pixel is read at original resolution.

## What improved

- Promo: identifies the three-section structure and more detailed ordering of entering typography, badges, gallery cards and metrics.
- Letters: explicitly recognizes downward entrance and left-to-right sequential exit, rather than merely a generic vertical movement.
- Kinetic text: extracts transient overlapping word assembly and blinking-cursor hold as separate reusable ideas. Low-detail output emphasized generic rhythmic typography.
- All successful requests produced structurally valid cards with legal timestamp intervals and extractable evidence frames. Original/raw/model-derived/reviewer material are stored separately.

## What did not improve enough

The focused 24 FPS/HIGH letters run still describes the first letter as counter-clockwise and proposes opposing sideways paths. The supplied source HTML instead specifies positive 720-degree rotation and vertical translation, no x translation. It starts the exit at 2.5s; the model estimates 2.67s, which may reflect perceptible motion rather than authored start. The output also makes ungrounded claims about collisions and keyframing.

The promo analysis continues to call apparent UI a mockup or simulated capture despite explicit instructions to preserve uncertainty. Metric count-up is not independently established. These statements must not become trusted library facts.

The text sample has a real audio stream, but detailed audio content and synchronization were not independently audited. Do not interpret absence of a review finding as an audio accuracy pass.

## Decision for this pipeline

Use HIGH/24 FPS for this quality-focused pilot. Keep the reference library useful by preserving raw outputs and adding reviewed caveats. A director can use the mechanisms and evidence to propose ideas, while requesting further inspection when an exact motion detail affects a storyboard or implementation.

Do not automatically convert model prose about rotation, easing, trajectories or production methods into HyperFrames parameters. Where source code exists, use its measured animation specification. Otherwise use focused frame sequences, tracking/measurement and human review. Extracted ULTRA_HIGH still images could help tiny UI text; they are a separate future test and do not alone solve temporal reasoning.

The sample size is three short fixtures with one run per main condition, not a production benchmark or a conclusive setting comparison. No external ad corpus, retrieval quality evaluation, or HyperFrames rendering integration was performed.

## Where to inspect

Open `../index.html` for originals, ideas, timestamps, full-resolution frame links and caveats. `sources.json` records sample provenance. Every successful reference folder contains `card.json`, `card.md`, `fingerprints.json`, `ideas.json`, `raw-response.json`, `source.json`, `validation.json`, `review.json` and frames. Failed 30 FPS runs are retained.

Documentation: https://ai.google.dev/gemini-api/docs/generate-content/media-resolution and https://ai.google.dev/gemini-api/docs/generate-content/video-understanding

Implementation audit: two same-video runs initially shared a millisecond-based folder name, so one of the three rejected 30 FPS requests was overwritten by its successful 2 FPS sibling. Two rejected requests remain archived. Run IDs now include a random UUID suffix to prevent this collision. Successful comparison data was preserved.

# HTML report and reviewed data

The report is the deliverable, not a directory listing of raw model output. Put the whole-film map and fine-grained motion analysis in the same page. A few meaningful headings are useful; piles of tiny tags, category badges, repeated mini-headings, redundant captions and instructions describing obvious controls are not.

A good reading order is: title and actual thesis → original video and chapter analysis → selected scene studies with clips and choreography → transferable patterns and copyable prompts. Keep technical method/source details expandable. Do not hide essential analysis there. Use chapter titles that explain the idea, not numbered generic labels. Let evidence images remain large enough to read.

`render_report.py` supplies a portable, dependency-free baseline. It validates contiguous full-video coverage, local event ranges, source frame ranges and local file references. It does not judge the quality or truth of the analysis. Authoring a tailored report is fine; preserve the same evidence and interaction requirements.

From the repo root:

```sh
python3 .agents/skills/video-reference-study/scripts/render_report.py \
  samples/<slug>-study/data/study.json --root samples/<slug>-study
python3 .agents/skills/video-reference-study/scripts/serve_report.py \
  samples/<slug>-study --port 8780
```

The renderer writes `index.html` under `--root`. Media paths are relative to that root; keep assets inside it. The server binds localhost, supports byte ranges for video seeking, and rejects symlink escapes. Inspect the browser and test controls before delivering a link. No report text should say “Click to play,” “Select a chapter to seek the original,” or similar filler.

## Reviewed JSON contract

All prose is plain text, escaped by the renderer. Chapter and deep-dive ranges use **original-source seconds**. Event start/end use **local clip seconds**. Evidence frame `time_s` uses **original-source seconds**. These conventions are intentionally different and must not be guessed.

```json
{
  "title": "Reference title — visual study",
  "summary": "A concrete thesis about how the film communicates.",
  "source": {"path": "source.mp4", "duration_s": 12, "fps": 24},
  "analysis": ["Whole-film structure and argument.", "Visual language and rhythm, grounded in source moments."],
  "chapters": [
    {"id": "opening", "start_s": 0, "end_s": 4, "title": "The question becomes visible", "analysis": ["What happens and why this section exists."]},
    {"id": "system", "start_s": 4, "end_s": 12, "title": "A system answers the question", "analysis": ["Composition, development and handoff."]}
  ],
  "scenes": [
    {
      "id": "system-change", "title": "From overview to local inspection",
      "start_s": 4, "end_s": 8, "clip": "clips/system-change.mp4",
      "selection_reason": "A precise reason this scene warrants closer study.",
      "analysis": ["Observed progression; distinguish inferred meaning in prose."],
      "events": [
        {"track": "Subject", "start_s": 0, "end_s": 1.5, "kind": "change", "label": "Rise", "change": "Tiles become columns.", "meaning": "Establish magnitude.", "attention": "Columns", "still": "Ground plane"},
        {"track": "Annotation", "start_s": 1, "end_s": 2, "kind": "change", "label": "Bind label", "change": "A leader and label resolve together.", "meaning": "Identify the measured object.", "attention": "Label target", "still": "Finished columns"}
      ],
      "overlaps": ["At +1.0–1.5s the label starts while the columns finish rising. Explain the visible relationship and limits of the timing estimate."],
      "invariants": ["The same ground plane anchors the change."],
      "frames": [{"path": "frames/before.jpg", "time_s": 4.2}, {"path": "frames/during.jpg", "time_s": 5.25}, {"path": "frames/after.jpg", "time_s": 7.8}],
      "prompt": "A concrete transferable build instruction with an observable acceptance condition.",
      "limitations": ["Apparent reframing is visible; true camera movement is unverified."]
    }
  ],
  "patterns": [{"title": "Preserve the anchor", "body": "The evidence-backed generalization, with source moments and scope.", "prompt": "Optional cross-scene reusable instruction."}],
  "method": ["Actual model and sampling settings; reviewed versus provisional claims; actual inspection performed."],
  "sources": [{"label": "Original source", "url": "https://example.com/video"}, {"label": "Raw scene analysis", "url": "library/references/scene-01/card.json"}]
}
```

The sample is a schema illustration, not observations to reuse. `scenes` may be empty when nothing warrants a deeper study, but explain that decision in the overview. Every selected scene needs actual evidence frames, a clip, useful events and a prompt. An empty `overlaps` array is honest when only sequential change is evidenced; explain that in the scene analysis. Never fabricate concurrency to populate the report.

## Review the result

- Coverage spans the measured source duration; chapter ordering and intervals are checked.
- Each detailed claim is traceable to the right excerpt and source time. Requested sampling is not described as frame-accurate model analysis.
- Chapter buttons seek the original; event bars and frame buttons seek the correct local clip. Copy buttons copy the actual prompt.
- Source and clips load, seek and play. Test a nonzero HTTP range and playback after a deep seek, not only initial loading.
- Frames and video remain usable on narrow screens; tables may scroll within their own container, not stretch the page.
- Meaningful complexity is explained. Merely moving a group or keeping objects visible is not counted as independent motion.
- No explanatory UI filler, decorative metadata chips, hidden analysis-only Markdown supplement, or generic “premium/dynamic/engaging” verdicts without evidence.

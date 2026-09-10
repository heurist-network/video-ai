# Staging the draft

Publishing is optional and separately authorized. Verify the target social account and
every mention against current official profiles, not a remembered handle or an account
with a similar name. Record the checked identity and source in the project storyboard.

## Preserve the latest human edits

Fetch the current draft before preparing a patch. `scripts/patch-draft.mjs` requires
`expectedUpdatedAt` from that read. It preserves posts and fields not named in the patch,
checks again immediately before writing, then GETs and compares text/media afterward.
Relative `textFile` paths resolve beside the patch JSON. Duplicate or out-of-range post
indices fail rather than silently skipping work.

```json
{
  "expectedUpdatedAt": "<exact updated_at from latest GET>",
  "posts": [{"index": 0, "media": ["<uploaded-media-id>"]}]
}
```

Use `--dry` to inspect proposed content first; dry mode still reads the remote draft.
Any timestamp conflict requires a fresh fetch and a deliberate merge, not a blind retry.
A media-only replacement must preserve the user's latest wording. The API adapter does
not claim atomic compare-and-swap: an edit between the last GET and PATCH can still race.
Coordinate a short editing pause with the human, and inspect the read-back. Never
"restore" old local text over newer human wording after a conflict.

The script requires `TYPEFULLY_API_KEY` or the supported Typefully configuration file.
It does not install credentials. Load the installed Typefully skill and current API
documentation before changing endpoint contracts or using a newly observed response
shape. Offline tests establish patch behavior, not current service compatibility.

## Destination and copy checks

Some previously observed Typefully CLI versions attached all uploaded media to post 1;
verify the current CLI's behavior before assuming per-post media assignments. The patch
adapter assigns each named post's `media_ids` explicitly. Previously observed direct
publishing of URL-bearing X drafts returned 403; treat that as an observation, not an
eternal API rule. Stop on refusal rather than probing repeatedly. Staging is not
scheduling or publishing authorization.

Faststart improves progressive playback. Audio-less MP4 is valid when intended; add
silent AAC only for a verified destination requirement. Silent AAC is not music or
sound design. `verify.js --audio none|required|optional` checks the selected policy.

Apply the target's copy constraints and the installed brand voice when requested:

- Claims must match observed product behavior, not a reconstructed scene or illustrative
  starter. Retrieval and citation alone are not independent verification.
- Preserve identity and meaning: a meme-token/tokenized-stock pair is not a separate
  meme-token research feature. Verify the actual pair shown before making that claim.
- Do not imply live updates from a recorded snapshot. Check observation time, source
  freshness and actual refresh cadence before saying "real time" or "now live".
- Avoid volatile figures in evergreen feature copy. If a dated fact is necessary, source
  and date it rather than silently making it timeless.
- Avoid quoting changing UI labels. Re-check any quoted text after every re-record.
- A second post must add something beyond restating the video. Preserve the author's
  approved emphasis rather than rewriting the entire thread while replacing its media.

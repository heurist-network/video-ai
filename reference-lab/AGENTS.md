# Searching the motion reference library

We used Gemini 3.8 flash to ingest Hyperframe example videos and built this reference library. Every sample has an integer index starting from 1.

Use the data layer, not index.html or library/pages/*.html. Original Gemini cards in library/references/*/card.json are authoritative analysis; HTML is generated presentation only.

Run from this directory:

Search methods:
- `python3 agent_library.py search 'line chart trend' --limit 5`
- `python3 agent_library.py search 'staggered cards' --collection hyperframes-100 --limit 5`

Get details of a sample:
- `python3 agent_library.py get 73` — compact summary and media/card links.
- `python3 agent_library.py get 73 --section ideas`
- `python3 agent_library.py get 73 --section frames --limit 3` — timestamped image paths; open only selected images with your image tool.
- `python3 agent_library.py get 73 --section fingerprints`
- `python3 agent_library.py get 73 --section review`

Search returns at most 20 matches, default 5, with snippets. It searches Gemini descriptions, ideas and fingerprints plus catalog titles/tags using SQLite FTS5/BM25. This is lexical retrieval, not semantic embedding search. Translate the product brief into several visual-mechanism queries (charts, staggered cards, counter, ticker), then shortlist by communication fit. Broad words such as stock may also match stock footage; inspect snippets. Do not load all cards into context.

Retrieve ideas and 2–4 frames for a shortlist, then review notes before proposing. Images validate composition; a few stills do not establish precise motion paths or easing. Distinguish Gemini observations, verified evidence, and your proposed adaptation. Do not equate price change, predicted direction, market probability, and resolved outcomes.

Search database: library/search.sqlite (ranked retrieval). Paths are relative to reference-lab except absolute_path returned by frames. Rebuild with `python3 report.py`; it refreshes the search database and human pages. No API calls or model regeneration are needed. Numbers match the website; reference_id is the persistent identifier across collection changes. Source JSON remains independently usable without HTML or SQLite.

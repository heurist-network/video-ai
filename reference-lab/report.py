"""Build the local reference catalog, detail pages, and search index. No API calls."""
import html
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
h = lambda value: html.escape(str(value), quote=True)

batches = []
reference_catalog = {}
reference_qa = {}
for manifest_path in sorted((ROOT / "library/batches").glob("*/manifest.json")):
    manifest = json.loads(manifest_path.read_text())
    qa_path = manifest_path.parent / "qa-sample.json"
    if qa_path.exists():
        qa = json.loads(qa_path.read_text())
        for item in qa.get("items", []):
            reference_qa[item["reference_id"]] = {**item, "file": "library/batches/" + manifest_path.parent.name + "/qa-sample.json"}
    batch_id = manifest.get("id", manifest_path.parent.name)
    items = manifest.get("items", [])
    state_path = manifest_path.parent / "state.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    records = state.get("items", {})
    counts = Counter(records.get(item["id"], {}).get("status", "pending") for item in items)
    batches.append({"id": batch_id, "total": len(items), "counts": dict(counts)})
    for item in items:
        record = records.get(item["id"], {})
        if record.get("reference_id"):
            reference_catalog[record["reference_id"]] = {**item, **record.get("provenance", {}), "catalog_id": item["id"], "batch_id": batch_id}

entries = []
for source_path in sorted((ROOT / "library/references").glob("*/source.json")):
    source = json.loads(source_path.read_text())
    card_path = source_path.parent / "card.json"
    source["card"] = json.loads(card_path.read_text()) if card_path.exists() else None
    review_path = source_path.parent / "review.json"
    source["review"] = json.loads(review_path.read_text()) if review_path.exists() else None
    source["catalog"] = reference_catalog.get(source["id"])
    source["ai_spot_check"] = reference_qa.get(source["id"])
    entries.append(source)

(ROOT / "library/index.json").write_text(json.dumps([{key: value for key, value in source.items() if key != "card"} for source in entries], indent=2))

catalog_css = """
*{box-sizing:border-box}body{margin:0;background:#f3f3f0;color:#1d211f;font:15px/1.5 system-ui,-apple-system,sans-serif}main{max-width:1240px;margin:auto;padding:34px 24px 72px}h1{margin:0 0 22px;font-size:40px;letter-spacing:-1.5px;line-height:1.05}
.toolbar{display:grid;grid-template-columns:minmax(260px,1fr) auto auto auto;gap:10px;align-items:center;position:sticky;top:0;z-index:5;padding:12px 0;background:#f3f3f0}.toolbar input,.toolbar select{height:44px;border:1px solid #cbd1cc;border-radius:9px;background:white;padding:0 13px;font:inherit}
.view-toggle{display:flex;border:1px solid #cbd1cc;border-radius:9px;overflow:hidden}.view-toggle button{border:0;background:white;height:42px;padding:0 14px;cursor:pointer}.view-toggle button.active{background:#202826;color:white}.count{margin:10px 0 18px;color:#68716b}
.catalog-item{position:relative;color:inherit;text-decoration:none;background:white;border:1px solid #d9dfda;border-radius:13px;overflow:hidden;transition:transform .15s,border-color .15s}.catalog-item:hover{border-color:#839287;transform:translateY(-2px)}.catalog-item:focus-visible{outline:3px solid #86a892;outline-offset:2px}
.number{position:absolute;top:9px;left:9px;z-index:2;min-width:30px;padding:4px 8px;border-radius:999px;background:rgba(18,22,20,.84);color:white;font-weight:700;text-align:center;backdrop-filter:blur(8px)}.preview{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#111}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}.grid-copy{display:block;padding:14px}.grid-copy h2{font-size:18px;line-height:1.2;margin:0 0 6px}.tags{display:block;color:#69726c;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.list{display:grid;gap:12px}.list-row{display:grid;grid-template-columns:220px minmax(0,1fr);height:154px}.list-row .preview{height:100%;aspect-ratio:auto}.list-copy{padding:12px 18px;min-width:0}.list-heading{display:flex;gap:12px;align-items:baseline}.list-heading h2{font-size:19px;line-height:1.2;margin:0;min-width:0}.duration{color:#778078;font-size:13px;white-space:nowrap}.summary,.digest{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;margin:6px 0 0}.summary{-webkit-line-clamp:2}.digest{-webkit-line-clamp:1;color:#657069;font-size:13px}.hidden{display:none!important}
@media(max-width:760px){.toolbar{grid-template-columns:1fr 1fr}.toolbar input{grid-column:1/-1}h1{font-size:34px}.grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}.list-row{grid-template-columns:145px minmax(0,1fr);height:122px}.digest{display:none}}
"""

detail_css = """
*{box-sizing:border-box}body{margin:0;background:#f3f3f0;color:#202826;font:16px/1.6 system-ui,-apple-system,sans-serif}main{max-width:1040px;margin:auto;padding:34px 24px 80px}a{color:#306e4c}.back{display:inline-block;margin-bottom:24px;text-decoration:none}.hero{background:white;padding:28px;border:1px solid #d9e1da;border-radius:14px}.hero h1{font-size:36px;line-height:1.1;margin:0 0 8px}.catalog-line{color:#68716b;margin:0 0 18px}.main-video{width:100%;max-height:590px;background:#101213;border-radius:9px}.summary{font-size:18px}.note{padding:16px;background:#fff5dd;border-radius:8px;margin:18px 0}.idea{background:white;padding:24px 28px;border:1px solid #d9e1da;border-radius:14px;margin:18px 0}.idea h2{margin-top:0}.play{background:#edf5ef;color:#285b40;border:1px solid #bcd3c2;border-radius:5px;padding:7px 12px;cursor:pointer}.frames{display:flex;gap:12px;overflow:auto;padding:10px 0}.frames a{flex:0 0 220px;color:inherit}.frames img{width:220px;height:138px;object-fit:contain;background:#121513}.support{background:white;padding:0 24px;border:1px solid #d9e1da;border-radius:14px;margin:18px 0}.support details{padding:16px 0;border-bottom:1px solid #e0e6e0}.support details:last-child{border:0}.support summary{cursor:pointer;font-weight:650}small{color:#68716b}
"""

complete = [source for source in entries if source["status"] == "complete" and source["card"]]
catalog_entries = sorted([source for source in complete if (source.get("catalog") or {}).get("batch_id") == "hyperframes-100"], key=lambda source: (source.get("catalog") or {}).get("selection_rank", 10_000))
catalog_ids = {source["id"] for source in catalog_entries}
pilot_entries = sorted([source for source in complete if source["id"] not in catalog_ids], key=lambda source: source["created_at"], reverse=True)
ordered = catalog_entries + pilot_entries
number_by_id = {source["id"]: number for number, source in enumerate(ordered, 1)}

# Searchable data is built independently of presentation markup.
from agent_library import build as build_agent_library
build_agent_library(ordered)
pages = ROOT / "library/pages"
pages.mkdir(parents=True, exist_ok=True)

def item_data(source):
    card = source["card"]
    catalog = source.get("catalog") or {}
    base = "library/references/" + source["id"]
    frames = [frame for idea in card["ideas"] for frame in idea.get("evidence_frames", [])]
    typical = frames[len(frames) // 2]["path"] if frames else "poster.jpg"
    if not frames and not (ROOT / base / typical).exists():
        ffmpeg = ROOT / "node_modules/ffmpeg-static/ffmpeg"
        try:
            subprocess.run([str(ffmpeg), "-hide_banner", "-loglevel", "error", "-ss", str(source["duration_s"] / 2), "-i", str(ROOT / source["source_path"]), "-frames:v", "1", "-q:v", "2", "-y", str(ROOT / base / typical)], check=True)
        except (OSError, subprocess.CalledProcessError):
            typical = ""
    title = catalog.get("title") or card.get("title", source["original_filename"])
    tags = ", ".join(catalog.get("tags", []))
    first_idea = card["ideas"][0] if card["ideas"] else None
    search = " ".join([title, tags, card["summary"], source["original_filename"]] + [idea["title"] + " " + idea["creative_mechanism"] + " " + idea["adaptation_example"] for idea in card["ideas"]]).lower()
    return card, catalog, base, typical, title, tags, first_idea, search

def preview(source_path, poster, title):
    return f'<video class="preview hover-preview" muted loop playsinline preload="none" poster="{h(poster)}" data-src="{h(source_path)}" aria-label="Preview of {h(title)}"></video>'

batch_options = "".join(f'<option value="{h(batch["id"])}"{" selected" if batch["id"] == "hyperframes-100" else ""}>{h(batch["id"])}</option>' for batch in batches)
body = '<main><h1>Motion reference library</h1><div class="toolbar"><input id="search" placeholder="Search titles, tags, ideas, or filenames" aria-label="Search references"><select id="batch" aria-label="Collection"><option value="">All collections</option><option value="pilot">Pilot</option>' + batch_options + '</select><select id="review" aria-label="Review status"><option value="">All reviews</option><option value="pending">Pending</option><option value="reviewed">Reviewed</option></select><div class="view-toggle" role="group" aria-label="View"><button id="grid-button" type="button">Grid</button><button id="list-button" type="button">List</button></div></div><p id="visible-count" class="count"></p><section id="grid" class="grid" aria-label="Reference grid">'

for source in ordered:
    card, catalog, base, typical, title, tags, first_idea, search = item_data(source)
    poster = f"{base}/{typical}" if typical else ""
    attrs = f'data-batch="{h(catalog.get("batch_id", "pilot"))}" data-review="{"reviewed" if source["review"] else "pending"}" data-search="{h(search)}"'
    number = number_by_id[source["id"]]
    body += f'<a class="catalog-item grid-card" href="library/pages/{h(source["id"])}.html" {attrs}><span class="number">{number}</span>{preview(source["source_path"], poster, title)}<span class="grid-copy"><h2>{h(title)}</h2><span class="tags">{h(tags)}</span></span></a>'

body += '</section><section id="list" class="list hidden" aria-label="Reference list">'
for source in ordered:
    card, catalog, base, typical, title, tags, first_idea, search = item_data(source)
    poster = f"{base}/{typical}" if typical else ""
    attrs = f'data-batch="{h(catalog.get("batch_id", "pilot"))}" data-review="{"reviewed" if source["review"] else "pending"}" data-search="{h(search)}"'
    number = number_by_id[source["id"]]
    digest = f'<p class="digest"><b>{h(first_idea["title"])}</b> · {h(first_idea["creative_mechanism"])}</p>' if first_idea else ""
    body += f'<a class="catalog-item list-row" href="library/pages/{h(source["id"])}.html" {attrs}><span class="number">{number}</span>{preview(source["source_path"], poster, title)}<span class="list-copy"><span class="list-heading"><h2>{h(title)}</h2><span class="duration">{source["duration_s"]:.1f}s</span></span><span class="tags">{h(tags)}</span><p class="summary">{h(card["summary"])}</p>{digest}</span></a>'
body += '</section></main>'

catalog_js = """<script>
const search=document.querySelector('#search'),batch=document.querySelector('#batch'),review=document.querySelector('#review'),grid=document.querySelector('#grid'),list=document.querySelector('#list');
const gridCards=[...grid.querySelectorAll('.catalog-item')],listRows=[...list.querySelectorAll('.catalog-item')];
function matches(item){return item.dataset.search.includes(search.value.toLowerCase())&&(!batch.value||item.dataset.batch===batch.value)&&(!review.value||item.dataset.review===review.value)}
function filter(){let count=0;gridCards.forEach(item=>{const show=matches(item);item.classList.toggle('hidden',!show);if(show)count++});listRows.forEach(item=>item.classList.toggle('hidden',!matches(item)));document.querySelector('#visible-count').textContent=count+' references'}
function view(mode){const isGrid=mode==='grid';grid.classList.toggle('hidden',!isGrid);list.classList.toggle('hidden',isGrid);document.querySelector('#grid-button').classList.toggle('active',isGrid);document.querySelector('#list-button').classList.toggle('active',!isGrid);localStorage.setItem('reference-view',mode);const url=new URL(location);url.searchParams.set('view',mode);history.replaceState(null,'',url)}
function play(item){const video=item.querySelector('video');if(!video.src){video.src=video.dataset.src;video.load()}video.play().catch(()=>{})}
function stop(item){const video=item.querySelector('video');video.pause();try{video.currentTime=0}catch{}}
document.querySelectorAll('.catalog-item').forEach(item=>{item.addEventListener('pointerenter',()=>play(item));item.addEventListener('pointerleave',()=>stop(item));item.addEventListener('focus',()=>play(item));item.addEventListener('blur',()=>stop(item))});
search.addEventListener('input',filter);batch.addEventListener('change',filter);review.addEventListener('change',filter);document.querySelector('#grid-button').onclick=()=>view('grid');document.querySelector('#list-button').onclick=()=>view('list');view(new URLSearchParams(location.search).get('view')||localStorage.getItem('reference-view')||'grid');filter();
</script>"""
(ROOT / "index.html").write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion reference library</title><style>' + catalog_css + "</style>" + body + catalog_js + "</html>")

detail_js = """<script>const video=document.querySelector('#main-video');document.querySelectorAll('button[data-time]').forEach(button=>button.onclick=()=>{video.currentTime=Number(button.dataset.time);video.play().catch(()=>{});video.scrollIntoView({behavior:'smooth',block:'center'})});</script>"""
for source in ordered:
    card, catalog, base, typical, title, tags, first_idea, search = item_data(source)
    number = number_by_id[source["id"]]
    page = f'<main><a class="back" href="../../index.html">← Reference library</a><section class="hero"><h1>#{number} · {h(title)}</h1><p class="catalog-line">{h(tags)}'
    if catalog.get("video_url"):
        page += f' · <a href="{h(catalog["video_url"])}" target="_blank" rel="noopener">Source</a>'
    page += f'</p><video id="main-video" class="main-video" controls preload="metadata" src="../../{h(source["source_path"])}"></video><p class="summary">{h(card["summary"])}</p>'
    if source["review"]:
        page += f'<div class="note"><b>Review: {h(source["review"]["verdict"])}</b><ul>' + "".join("<li>" + h(note) + "</li>" for note in source["review"]["notes"]) + "</ul></div>"
    if source["ai_spot_check"]:
        qa = source["ai_spot_check"]
        page += f'<div class="note"><b>Visual spot-check: {h(qa["verdict"].replace("_", " "))}</b><p>{h(qa["supported"])}</p><p><b>Limits / corrections:</b> {h(qa["caveat"])}</p></div>'
    page += "</section>"
    for idea in card["ideas"]:
        page += f'<section class="idea"><h2>{h(idea["title"])}</h2><button class="play" data-time="{idea["start_s"]}">Play {idea["start_s"]}–{idea["end_s"]}s</button>'
        for key, label in [("observed_sequence", "Observed"), ("communication_problem", "Communication problem"), ("creative_mechanism", "Creative mechanism"), ("adaptation_example", "Possible adaptation"), ("do_not_transfer", "Do not transfer"), ("interpretation_caveat", "Caveat")]:
            value = idea.get(key, idea.get("observation", "") if key == "observed_sequence" else "")
            page += f'<p><b>{label}:</b> {h(value)}</p>'
        page += '<div class="frames">' + "".join(f'<a href="../references/{h(source["id"])}/{h(frame["path"])}" target="_blank"><img alt="Keyframe at {frame["time_s"]} seconds" src="../references/{h(source["id"])}/{h(frame["path"])}" loading="lazy"><br>{frame["time_s"]}s</a>' for frame in idea.get("evidence_frames", [])) + "</div></section>"
    page += '<section class="support"><details><summary>Motion-design fingerprints</summary>'
    for group, fingerprints in card["fingerprints"].items():
        page += "<h3>" + h(group.replace("_", " ").title()) + "</h3><ul>" + "".join(f'<li><b>{fingerprint["start_s"]}–{fingerprint["end_s"]}s:</b> {h(fingerprint["observation"])} <small>{h(fingerprint["confidence"])} confidence · {h(fingerprint.get("limitation", ""))}</small></li>' for fingerprint in fingerprints) + "</ul>"
    page += '</details><details><summary>Files and uncertainties</summary><ul>' + "".join("<li>" + h(item) + "</li>" for item in card["uncertainties"]) + f'</ul><a href="../references/{h(source["id"])}/card.json">Card JSON</a> · <a href="../references/{h(source["id"])}/card.md">Readable card</a> · <a href="../references/{h(source["id"])}/raw-response.json">Raw response</a></details></section></main>'
    (pages / (source["id"] + ".html")).write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + h(title) + " · Motion reference</title><style>" + detail_css + "</style>" + page + detail_js + "</html>")

print(f"Built catalog and {len(ordered)} individual reference pages")

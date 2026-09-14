import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
notes={
'3619744a80e6':[
'Correct broad organization: hero 0–5s, capabilities/metrics 5–11s, dark closing section 11–16s; corroborated by source HTML and independent source-frame inspection.',
'Layered previews, metric strip and light-to-dark closing shift are plausible reusable mechanisms. Their marketing effectiveness was not measured.',
'Unsupported source-method claims remain (mockups, simulated UI). Do not forward these as facts. The high-detail run calls metrics counters and claims fast progression without a verified count-up; review before reuse.'
],
'a1fb024874f6':[
'Correct broad mechanism: staggered letter entrance, centered hold, sequential rotating downward exit. Useful as an inspiration card.',
'Source HTML defines positive 720-degree rotation (clockwise in CSS), y=400, no x translation, starting at 2.5s with per-letter 0.05s stagger. Entrance is y=-400 to 0, 0.5s duration and 0.08s stagger.',
'Focused HIGH/24 FPS run still asserts counter-clockwise H rotation, opposing sideways/arched paths and a 2.67s onset. Do not treat these as measured facts. Visible onset can lag authored start; exact timing is not established.',
'Physics, collisions and production technique cannot be established from the footage. Descriptions such as domino are metaphors, not evidence of physical interaction.'
],
'd002c0d9d985':[
'Frame inspection supports sparse white uppercase typography, successive phrases, transient word overlaps and a blinking pipe cursor. Source HTML independently corroborates staged entries and cursor animation.',
'HIGH/24 FPS provides more specific visual ideas than the baseline: word assembly and the cursor hold. This is one qualitative comparison, not a repeated statistical result.',
'Audio stream presence is measured, but claimed instruments, exact beat synchronization, whooshes and absence of VO were not independently audited. Do not treat audio detail as verified.',
'Claims about increased viewer engagement or retention are interpretations, not measured outcomes.'
]}
allruns=[]
for p in (ROOT/'library/references').glob('*/source.json'):
 s=json.loads(p.read_text());allruns.append(s)
 if s['status']!='complete':continue
 c=json.loads((p.parent/'card.json').read_text())
 (p.parent/'fingerprints.json').write_text(json.dumps(c['fingerprints'],indent=2)+'\n')
 (p.parent/'ideas.json').write_text(json.dumps(c['ideas'],indent=2)+'\n')
 review={'reviewer':'Codex; source-frame inspection and separately withheld source HTML','verdict':'Useful for ideation; detailed claims need review','human_approved':False,'notes':notes[s['source_sha256'][:12]]}
 (p.parent/'review.json').write_text(json.dumps(review,indent=2)+'\n')
 v=json.loads((p.parent/'validation.json').read_text());v['semantic_review']='reviewed_with_caveats';v['review_file']='review.json';(p.parent/'validation.json').write_text(json.dumps(v,indent=2)+'\n')
 s['review_status']='reviewed_with_caveats';p.write_text(json.dumps(s,indent=2)+'\n')
(root:=ROOT/'validation').mkdir(exist_ok=True)
sources=[]
for name,folder in [('hyperframes-promo','heygen-promo-preview-assets'),('chat','chat'),('gsap-letters-render-compat','gsap-letters-render-compat')]:
 s=next(x for x in allruns if x['original_filename']==name+'.mp4')
 sources.append({'local_alias':f'library/sources/{name}.mp4','source_sha256':s['source_sha256'],'source_url':f'https://media.githubusercontent.com/media/heygen-com/hyperframes/main/packages/producer/tests/{folder}/output/output.mp4','repository_url':f'https://github.com/heygen-com/hyperframes/tree/main/packages/producer/tests/{folder}','retrieved_date':'2026-09-13','kind':'public rendered test fixture; not a commercial performance benchmark','source_code_supplied_to_model':False})
(root/'sources.json').write_text(json.dumps(sources,indent=2)+'\n')

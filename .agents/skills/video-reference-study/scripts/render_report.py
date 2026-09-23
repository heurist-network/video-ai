#!/usr/bin/env python3
"""Render reviewed study JSON into a self-contained HTML page; media stays local."""
import argparse, html, json, math, re
from pathlib import Path
from urllib.parse import urlsplit, quote

def esc(s): return html.escape(str(s), quote=True)
def stamp(t):
    minutes=int(t//60)
    return f'{minutes}:{t%60:05.2f}'.rstrip('0').rstrip('.')
def numeric(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v)
def prose(values): return ''.join(f'<p>{esc(v)}</p>' for v in values)
def validate(d, root):
    def require(ok, msg):
        if not ok: raise ValueError(msg)
    def strings(v, name, nonempty=False):
        require(isinstance(v,list) and all(isinstance(x,str) and x.strip() for x in v),name+' must be a list of nonempty strings')
        if nonempty: require(bool(v), name+' is empty')
    def file(v):
        require(isinstance(v,str) and bool(v),'Missing media path')
        u=urlsplit(v)
        require(not u.scheme and not u.netloc and not u.query and not u.fragment and not Path(v).is_absolute(),'Use a local relative path: '+v)
        p=(root/v).resolve()
        require(p.is_relative_to(root) and p.is_file(),'Missing or outside study root: '+v)
    def span(v, maximum, name):
        a,b=v.get('start_s'),v.get('end_s')
        require(numeric(a) and numeric(b) and 0<=a<b<=maximum+.001,'Invalid range: '+name)
    def identity(v, seen):
        i=v.get('id','');require(isinstance(i,str) and re.fullmatch('[a-z][a-z0-9-]*',i) and i not in seen,'Invalid or repeated id: '+str(i));seen.add(i)
        require(isinstance(v.get('title'),str) and bool(v['title'].strip()),'Missing title: '+i)
    require(isinstance(d,dict),'Expected study object')
    for k in ('title','summary'): require(isinstance(d.get(k),str) and bool(d[k].strip()),'Missing '+k)
    source=d.get('source',{});duration=source.get('duration_s');require(numeric(duration) and duration>0,'Invalid source duration');file(source.get('path'))
    strings(d.get('analysis'),'analysis',True)
    chapters=d.get('chapters');require(isinstance(chapters,list) and bool(chapters),'No chapters')
    seen=set();cursor=0
    for c in chapters:
        identity(c,seen);span(c,duration,c['id']);require(abs(c['start_s']-cursor)<=.05,'Chapter gap/overlap before '+c['id']);cursor=c['end_s'];strings(c.get('analysis'),'chapter analysis',True)
    require(abs(cursor-duration)<=.05,'Chapters do not cover the end of the source')
    require(isinstance(d.get('scenes'),list),'scenes must be a list')
    for s in d['scenes']:
        identity(s,seen);span(s,duration,s['id']);file(s.get('clip'));length=s['end_s']-s['start_s']
        for k in ('selection_reason','prompt'): require(isinstance(s.get(k),str) and bool(s[k].strip()),'Missing scene '+k)
        strings(s.get('analysis'),'scene analysis',True)
        for k in ('overlaps','invariants','limitations'): strings(s.get(k,[]),k)
        require(isinstance(s.get('events'),list) and bool(s['events']),'No scene events')
        for e in s['events']:
            span(e,length,s['id']+' local event')
            for k in ('track','label','change','meaning','attention','still'):require(isinstance(e.get(k),str) and bool(e[k].strip()),'Missing event '+k)
            require(e.get('kind') in ('change','hold'),'Event kind must be change or hold')
        require(isinstance(s.get('frames'),list) and len(s['frames'])>=2,'Need before/during/after evidence, at least two frames')
        last=-1
        for f in s['frames']:
            t=f.get('time_s');require(numeric(t) and s['start_s']<=t<=s['end_s'] and t>last,'Invalid source frame time');last=t;file(f.get('path'))
    require(isinstance(d.get('patterns'),list),'patterns must be a list')
    for p in d['patterns']:
        for k in ('title','body'):require(isinstance(p.get(k),str) and bool(p[k].strip()),'Missing pattern '+k)
        if 'prompt' in p:require(isinstance(p['prompt'],str),'Pattern prompt must be text')
    strings(d.get('method',[]),'method')
    for s in d.get('sources',[]):
        require(isinstance(s.get('label'),str) and isinstance(s.get('url'),str),'Invalid source link')
        u=urlsplit(s['url'])
        if u.scheme:require(u.scheme in ('http','https') and bool(u.netloc),'Unsafe source URL')
        else:file(s['url'])

def media_url(v): return quote(v, safe='/.-_~')
def seek(target,t,label,cls=''):return f'<button class="{cls}" data-target="{esc(target)}" data-seek="{t:.6f}">{esc(label)}</button>'
def prompt(text,id):return f'<div class="prompt"><button class="copy" data-copy="{id}" aria-label="Copy build prompt">Copy prompt</button><pre id="{id}">{esc(text)}</pre></div>'
def render(d):
    parts=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(d['title'])+'</title><style>'+CSS+'</style></head><body><main>']
    parts+=['<header><h1>'+esc(d['title'])+'</h1><p class="lead">'+esc(d['summary'])+'</p></header>',f'<video id="source" controls playsinline preload="metadata" src="{media_url(d["source"]["path"])}"></video>',prose(d['analysis']),'<section class="chapters"><h2>Structure</h2>']
    for c in d['chapters']:
        parts.append('<article class="chapter">'+seek('source',c['start_s'],stamp(c['start_s'])+'–'+stamp(c['end_s']),'time')+'<div><h3>'+esc(c['title'])+'</h3>'+prose(c['analysis'])+'</div></article>')
    parts.append('</section>')
    for s in d['scenes']:
        id=s['id'];vid='video-'+id;length=s['end_s']-s['start_s']
        parts.append(f'<section class="scene" id="{id}"><div class="scene-title"><h2>{esc(s["title"])}</h2>'+seek('source',s['start_s'],stamp(s['start_s'])+'–'+stamp(s['end_s']),'time')+'</div><p>'+esc(s['selection_reason'])+'</p>'+f'<video id="{vid}" controls playsinline preload="metadata" src="{media_url(s["clip"])}"></video>'+prose(s['analysis']))
        parts.append('<div class="timeline-scroll"><div class="timeline">')
        for track in dict.fromkeys(e['track'] for e in s['events']):
            parts.append('<div class="track-name">'+esc(track)+'</div><div class="track">')
            # Multiple events on a track get their own row if they overlap; do not hide simultaneous events.
            lanes=[]
            for e in sorted((x for x in s['events'] if x['track']==track),key=lambda x:x['start_s']):
                lane=next((i for i,end in enumerate(lanes) if end<=e['start_s']),len(lanes))
                if lane==len(lanes):lanes.append(e['end_s'])
                else:lanes[lane]=e['end_s']
                a=e['start_s']/length*100;w=(e['end_s']-e['start_s'])/length*100
                title=f'+{e["start_s"]:.2f}–{e["end_s"]:.2f}s · {e["change"]}'
                parts.append(f'<button class="event {e["kind"]}" data-target="{vid}" data-seek="{e["start_s"]}" style="left:{a:.5f}%;width:{w:.5f}%;top:{lane*36}px" title="{esc(title)}" aria-label="{esc(title)}">{esc(e["label"])}</button>')
            parts.append(f'<div style="height:{max(1,len(lanes))*36}px"></div></div>')
        parts.append(f'<span></span><div class="axis"><span>+0s</span><span>+{length:.2f}s</span></div></div></div>')
        parts.append(prose(s.get('overlaps',[])))
        if s.get('invariants'):parts.append('<p><strong>What persists:</strong> '+esc(' '.join(s['invariants']))+'</p>')
        parts.append('<div class="table-scroll"><table><thead><tr><th>Clip time</th><th>Visible change</th><th>Meaning and attention</th></tr></thead><tbody>')
        for e in sorted(s['events'],key=lambda e:e['start_s']):
            parts.append('<tr><td>'+seek(vid,e['start_s'],f'+{e["start_s"]:.2f}–{e["end_s"]:.2f}s','time')+'</td><td><strong>'+esc(e['track'])+'</strong><p>'+esc(e['change'])+'</p></td><td>'+esc(e['meaning'])+'<p>Attention: '+esc(e['attention'])+'. Still: '+esc(e['still'])+'.</p></td></tr>')
        parts.append('</tbody></table></div><div class="frames">')
        for f in s['frames']:
            parts.append(f'<figure><button class="frame-button" data-target="{vid}" data-seek="{f["time_s"]-s["start_s"]}" aria-label="Play at source {stamp(f["time_s"])}"><img loading="lazy" src="{media_url(f["path"])}" alt="{esc(s["title"])} at {stamp(f["time_s"])}"></button><figcaption>{stamp(f["time_s"])}</figcaption></figure>')
        parts.append('</div>'+prompt(s['prompt'],'prompt-'+id)+prose(s.get('limitations',[]))+'</section>')
    if d['patterns']:
        parts.append('<section class="patterns"><h2>Patterns to borrow</h2>')
        for i,p in enumerate(d['patterns']):parts.append('<article><h3>'+esc(p['title'])+'</h3><p>'+esc(p['body'])+'</p>'+(prompt(p['prompt'],'pattern-'+str(i)) if p.get('prompt') else '')+'</article>')
        parts.append('</section>')
    parts.append('<details><summary>Sources and method</summary>'+prose(d.get('method',[])))
    for s in d.get('sources',[]):parts.append('<p><a href="'+esc(s['url'])+'">'+esc(s['label'])+'</a></p>')
    parts.append('</details></main><script>'+JS+'</script></body></html>')
    return ''.join(parts)

CSS='''*{box-sizing:border-box}body{margin:0;background:#f5f4ef;color:#202722;font:17px/1.6 system-ui,-apple-system,sans-serif}main{max-width:1260px;padding:60px 40px;margin:auto}h1,h2,h3{line-height:1.15;letter-spacing:-.035em;font-weight:550}h1{font-size:clamp(38px,5vw,70px);max-width:1000px;margin:0 0 22px}h2{font-size:34px;margin:0 0 22px}h3{font-size:23px;margin:0 0 12px}.lead{font-size:23px;max-width:970px;margin-bottom:34px}p{max-width:1000px}video{display:block;width:100%;max-height:72vh;background:#151a17;border-radius:8px;margin:22px 0 30px}section{margin-top:64px}.chapter{display:grid;grid-template-columns:150px 1fr;gap:26px;padding:25px 0;border-top:1px solid #d2d9d1}.chapter p{margin:8px 0}.time{font:inherit;font-size:14px;font-variant-numeric:tabular-nums;color:#3c6756;border:0;background:transparent;text-align:left;cursor:pointer;padding:4px 0;white-space:nowrap;align-self:start}.time:hover{text-decoration:underline}.scene{border-top:1px solid #b7c4b9;padding-top:42px}.scene-title{display:flex;justify-content:space-between;gap:24px;align-items:baseline}.scene-title h2{max-width:870px}.timeline-scroll,.table-scroll{overflow-x:auto;margin:26px 0}.timeline{display:grid;grid-template-columns:160px 1fr;gap:9px 14px;min-width:720px}.track-name{font-size:14px;padding:5px 0}.track{position:relative;background:#e3e8e0;border-radius:3px}.event{position:absolute;height:29px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-align:left;border:0;border-radius:3px;padding:3px 8px;cursor:pointer;color:white;background:#315d4c;font:12px system-ui}.event.hold{background:#d5dbd0;color:#394637;border:1px dashed #889982}.axis{display:flex;justify-content:space-between;font-size:12px;color:#627264}table{border-collapse:collapse;min-width:720px;width:100%;font-size:15px}th{text-align:left;font-weight:600;padding:12px;border-bottom:1px solid #a8b7ac}td{vertical-align:top;padding:16px 12px;border-bottom:1px solid #d6ddd4}td p{margin:6px 0 0}.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:28px 0}figure{margin:0}.frame-button{display:block;border:0;padding:0;background:none;cursor:pointer;width:100%}img{display:block;width:100%;border-radius:4px}figcaption{font-size:13px;color:#637368;margin-top:6px}.prompt{background:#e6ebe2;border-radius:8px;padding:24px;margin:26px 0}.copy{float:right;background:#f5f4ef;border:1px solid #b2beb0;border-radius:18px;padding:6px 12px;cursor:pointer;margin:0 0 14px 16px;color:#254a3d}.prompt pre{white-space:pre-wrap;font:inherit;font-size:15px;line-height:1.65;margin:0}.patterns article{padding:20px 0}details{border-top:1px solid #c5d0c6;margin-top:55px;padding:22px 0;color:#56675b;font-size:14px}summary{cursor:pointer;font-size:15px}a{color:#315d4c}button:focus-visible,a:focus-visible{outline:3px solid #759f89;outline-offset:3px}@media(max-width:700px){main{padding:30px 18px}.lead{font-size:20px}.chapter{grid-template-columns:1fr;gap:6px}.scene-title{display:block}.frames{grid-template-columns:1fr}h2{font-size:28px}section{margin-top:42px}.prompt{padding:18px}video{border-radius:4px}}'''
JS='''document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.target){const v=document.getElementById(b.dataset.target);if(v.readyState<1)await new Promise(resolve=>v.addEventListener('loadedmetadata',resolve,{once:true}));document.querySelectorAll('video').forEach(x=>{if(x!==v)x.pause()});v.currentTime=Number(b.dataset.seek);if(v.id==='source')v.scrollIntoView({behavior:'smooth',block:'center'});v.play().catch(()=>{});}if(b.dataset.copy){try{await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).textContent);b.textContent='Copied';}catch{const r=document.createRange();r.selectNodeContents(document.getElementById(b.dataset.copy));const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Select and copy';}}});'''

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('data',type=Path);p.add_argument('--root',type=Path,required=True);args=p.parse_args()
    root=args.root.resolve();d=json.loads(args.data.read_text());validate(d,root);out=root/'index.html';out.write_text(render(d));print(out)
if __name__=='__main__':main()

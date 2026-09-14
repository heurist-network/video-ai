import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import probe from 'ffprobe-static';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
try{process.loadEnvFile(path.join(ROOT,'../.env'));}catch{}
const [command,source,...rest]=process.argv.slice(2);
const option=(name,fallback)=>{const i=rest.indexOf(name);return i<0?fallback:rest[i+1];};
const model=option('--model','gemini-3.8-flash');
const fps=Number(option('--fps','24'));
const question=option('--question','');
const resolution=option('--resolution','high').toUpperCase();
const api='https://generativelanguage.googleapis.com/v1beta';
async function request(url,body,extra={}){
 const r=await fetch(url,{method:body?'POST':'GET',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json',...extra},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(240000)});
 const d=await r.json();if(!r.ok)throw Error(`Gemini HTTP ${r.status}: ${String(d.error?.message||'Request failed').replaceAll(process.env.GEMINI_API_KEY||'UNSET','[REDACTED]')}`);return d;
}
const save=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
export function validate(card,duration){
 const errors=[];
 if(!card||typeof card!=='object'||Array.isArray(card))return ['Expected object'];
 for(const k of ['summary','fingerprints','ideas','uncertainties'])if(!(k in card))errors.push(`Missing ${k}`);
 if(typeof card.summary!=='string'||!Array.isArray(card.uncertainties)||card.uncertainties.some(x=>typeof x!=='string'))errors.push('Invalid summary or uncertainties');
 const names=['narrative','editing','product_presentation','motion','graphics'];
 for(const k of names)if(!Array.isArray(card.fingerprints?.[k]))errors.push(`Missing fingerprint array ${k}`);
 const range=(x,label)=>{if(!Number.isFinite(x.start_s)||!Number.isFinite(x.end_s)||x.start_s<0||x.end_s<=x.start_s||x.end_s>duration+.15)errors.push(`Invalid interval: ${label}`);};
 for(const k of names)for(const f of (Array.isArray(card.fingerprints?.[k])?card.fingerprints[k]:[])){range(f,k);if(!f.observation||!['high','medium','low'].includes(f.confidence))errors.push(`Invalid evidence: ${k}`);}
 if(!Array.isArray(card.ideas)||card.ideas.length>5)errors.push('Expected 0–5 ideas');
 for(const i of (Array.isArray(card.ideas)?card.ideas:[])){range(i,i.title);for(const k of ['title','observed_sequence','communication_problem','creative_mechanism','adaptation_example','do_not_transfer','interpretation_caveat'])if(typeof i[k]!=='string'||!i[k].trim())errors.push(`Missing idea ${k}`);if(!Array.isArray(i.keyframe_times_s)||i.keyframe_times_s.length<2||i.keyframe_times_s.length>6||i.keyframe_times_s.some((t,n,a)=>!Number.isFinite(t)||t<i.start_s||t>i.end_s||(n>0&&t<=a[n-1])))errors.push(`Invalid keyframes ${i.title}`);}
 return errors;
}
async function main(){
 if(command==='check-model'){const d=await request(`${api}/models/${model}`);console.log(JSON.stringify({name:d.name,methods:d.supportedGenerationMethods},null,2));return;}
 if(command!=='analyze'||!source){console.log('Usage: node analyze.mjs analyze /path/video.mp4 [--fps 24] [--resolution high|low|medium|unspecified] [--model gemini-3.8-flash]\n       node analyze.mjs check-model');return;}
 if(!process.env.GEMINI_API_KEY)throw Error('GEMINI_API_KEY missing from ../.env');
 if(!['HIGH','LOW','MEDIUM','UNSPECIFIED'].includes(resolution))throw Error('Invalid resolution');
 if(!(fps>0&&fps<=24))throw Error('fps must be between 0 and 24');
 const sourcePath=path.resolve(source), bytes=fs.readFileSync(sourcePath), hash=createHash('sha256').update(bytes).digest('hex');
 const metadata=JSON.parse(execFileSync(probe.path,['-v','quiet','-show_format','-show_streams','-of','json',sourcePath],{encoding:'utf8'}));
 const duration=Number(metadata.format.duration);if(!Number.isFinite(duration)||duration<=0)throw Error('Invalid video duration');
 const id=option('--run-id',`${hash.slice(0,12)}-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`);
 if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Invalid run ID');
 if(fs.existsSync(path.join(ROOT,'library/references',id)))throw Error('Run ID already exists');
 const dir=path.join(ROOT,'library/references',id);fs.mkdirSync(path.join(dir,'frames'),{recursive:true});
 const stored=path.join(ROOT,'library/sources',hash+path.extname(sourcePath));if(!fs.existsSync(stored))fs.copyFileSync(sourcePath,stored);
 const manifest={id,source_path:path.relative(ROOT,stored),source_sha256:hash,original_filename:path.basename(sourcePath),model,sampling_fps:fps,sample_delta_ms:1000/fps,media_resolution:resolution,duration_s:duration,created_at:new Date().toISOString(),status:'running',review_status:'unreviewed',has_audio:metadata.streams.some(s=>s.codec_type==='audio')};save(path.join(dir,'source.json'),manifest);save(path.join(dir,'media.json'),metadata);
 const prompt=fs.readFileSync(path.join(ROOT,'prompt.txt'),'utf8')+`\nMeasured duration: ${duration} seconds.`+(question?'\nAdditional inspection question: '+question:'');
 fs.writeFileSync(path.join(dir,'prompt.txt'),prompt);
 let uploaded;
 try{
 const mime={'.mp4':'video/mp4','.mov':'video/quicktime','.webm':'video/webm'}[path.extname(sourcePath).toLowerCase()];if(!mime)throw Error('Use MP4, MOV or WebM');
 let video;
 if(bytes.length<14*1024*1024)video={inlineData:{mimeType:mime,data:bytes.toString('base64')}};
 else{
 const r=await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files',{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start','X-Goog-Upload-Header-Content-Length':String(bytes.length),'X-Goog-Upload-Header-Content-Type':mime,'Content-Type':'application/json'},body:JSON.stringify({file:{display_name:hash.slice(0,12)}})});
 if(!r.ok)throw Error(`Upload initialization HTTP ${r.status}`);const url=r.headers.get('x-goog-upload-url');if(!url||new URL(url).hostname!=='generativelanguage.googleapis.com')throw Error('Unexpected upload destination');
 const u=await fetch(url,{method:'POST',headers:{'X-Goog-Upload-Offset':'0','X-Goog-Upload-Command':'upload, finalize'},body:bytes,signal:AbortSignal.timeout(240000)});if(!u.ok)throw Error(`Upload HTTP ${u.status}`);uploaded=(await u.json()).file;
 const deadline=Date.now()+180000;while(uploaded.state==='PROCESSING'&&Date.now()<deadline){await new Promise(r=>setTimeout(r,2000));uploaded=await request(`${api}/${uploaded.name}`);}if(uploaded.state!=='ACTIVE')throw Error('Video processing failed or timed out');video={fileData:{fileUri:uploaded.uri,mimeType:mime}};
 }
 video.videoMetadata={fps};
 console.log(`Analyzing ${duration.toFixed(2)}s at ${fps} FPS / ${resolution} with ${model}…`);
 const started=Date.now();const response=await request(`${api}/models/${model}:generateContent`,{contents:[{role:'user',parts:[video,{text:prompt}]}],generationConfig:{mediaResolution:`MEDIA_RESOLUTION_${resolution}`,responseMimeType:'application/json',temperature:0.2,maxOutputTokens:12000}});
 save(path.join(dir,'raw-response.json'),response);manifest.elapsed_ms=Date.now()-started;manifest.usage=response.usageMetadata;
 const candidate=response.candidates?.[0];if(candidate?.finishReason!=='STOP')throw Error(`Incomplete response: ${candidate?.finishReason}`);
 const text=candidate.content.parts.filter(p=>p.text&&!p.thought).map(p=>p.text).join('');const card=JSON.parse(text);save(path.join(dir,'card.raw.json'),card);
 const normalizations=[];
 for(const [i,idea] of (Array.isArray(card.ideas)?card.ideas:[]).entries()){if(idea&&typeof idea==='object'&&!('observed_sequence' in idea)&&typeof idea.observation==='string'){idea.observed_sequence=idea.observation;delete idea.observation;normalizations.push({path:`ideas[${i}]`,from:'observation',to:'observed_sequence',reason:'Known equivalent field alias; no content changed'});}}
 save(path.join(dir,'normalization.json'),{changes:normalizations,raw_card:'card.raw.json'});save(path.join(dir,'card.json'),card);
 const errors=validate(card,duration);save(path.join(dir,'validation.json'),{structural_errors:errors,semantic_review:'pending',note:'Structural validity does not establish visual accuracy or creative usefulness.'});if(errors.length)throw Error(errors.join('; '));
 for(const [n,idea] of card.ideas.entries()){
 idea.evidence_frames=[];for(const [j,t] of idea.keyframe_times_s.entries()){const filename=`idea-${n+1}-${j+1}-${t.toFixed(3)}s.jpg`;execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(Math.min(t,duration-.05)),'-i',stored,'-frames:v','1','-q:v','2','-y',path.join(dir,'frames',filename)]);idea.evidence_frames.push({time_s:t,path:`frames/${filename}`});}
 }
 save(path.join(dir,'card.json'),card);
 save(path.join(dir,'fingerprints.json'),card.fingerprints);
 save(path.join(dir,'ideas.json'),card.ideas);
 let md=`# ${card.title||'Video reference'}\n\n${card.summary}\n\nModel: ${model}. Duration: ${duration.toFixed(2)}s. Sampling: ${fps} FPS / ${resolution}. Human review: pending.\n\n`;
 for(const [n,i] of card.ideas.entries()){md+=`## ${n+1}. ${i.title} (${i.start_s}–${i.end_s}s)\n\n**Observed:** ${i.observed_sequence}\n\n**Communication problem:** ${i.communication_problem}\n\n**Mechanism:** ${i.creative_mechanism}\n\n**Adaptation:** ${i.adaptation_example}\n\n**Do not transfer:** ${i.do_not_transfer}\n\n**Interpretation caveat:** ${i.interpretation_caveat}\n\n`;for(const f of i.evidence_frames)md+=`![${f.time_s}s](${f.path})\n\n`;}
 md+='## Fingerprints\n\n';for(const [k,v] of Object.entries(card.fingerprints)){md+=`### ${k}\n\n`;for(const f of v)md+=`- ${f.start_s}–${f.end_s}s: ${f.observation} (${f.confidence}; ${f.limitation||'no limitation supplied'})\n`;md+='\n';}md+='## Uncertainties\n\n'+card.uncertainties.map(x=>`- ${x}`).join('\n');fs.writeFileSync(path.join(dir,'card.md'),md);
 manifest.status='complete';console.log(`Saved ${path.relative(ROOT,dir)}`);
 }catch(e){manifest.status='failed';manifest.error=String(e.message).replaceAll(process.env.GEMINI_API_KEY,'[REDACTED]');throw e;}
 finally{save(path.join(dir,'source.json'),manifest);if(uploaded?.name)await fetch(`${api}/${uploaded.name}`,{method:'DELETE',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY}}).catch(()=>{});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(String(e.message).replaceAll(process.env.GEMINI_API_KEY||'UNSET','[REDACTED]'));process.exitCode=1;});

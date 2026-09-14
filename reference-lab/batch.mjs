import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
const opt=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const atomic=(p,x)=>{fs.writeFileSync(p+'.tmp',JSON.stringify(x,null,2)+'\n');fs.renameSync(p+'.tmp',p);};
export const transient=s=>/HTTP (429|5\d\d)\b|fetch failed|network|ECONNRESET|ETIMEDOUT|timed? ?out|TimeoutError/i.test(s);
export const systemic=s=>/Gemini HTTP (401|403|404)\b|Upload(?: initialization)? HTTP (401|403)\b|API.key.not.valid|API_KEY_INVALID|GEMINI_API_KEY missing|models?.*(not found|not supported)/i.test(s);
export function itemsFrom(manifest){const items=Array.isArray(manifest)?manifest:manifest.items;if(!Array.isArray(items)||!items.length)throw Error('Manifest needs a nonempty items array');const ids=new Set();for(const x of items){if(!x.id||!x.title||!x.video_url)throw Error('Each item needs id, title, video_url');if(ids.has(String(x.id)))throw Error('Duplicate manifest ID: '+x.id);ids.add(String(x.id));const u=new URL(x.video_url);if(u.protocol!=='https:')throw Error('Video URLs must use HTTPS');}return items;}
async function main(){
 const manifestPath=opt('--manifest');if(!manifestPath)throw Error('Usage: node batch.mjs --manifest catalog.json [--workers 4] [--dry-run]');
 const items=itemsFrom(read(manifestPath));const workers=Number(opt('--workers','4'));if(!Number.isInteger(workers)||workers<1||workers>4)throw Error('Workers must be 1–4');
 const limit=Number(opt('--limit',String(items.length)));if(!Number.isInteger(limit)||limit<1)throw Error('Limit must be a positive integer');
 const model=opt('--model','gemini-3.8-flash'),fps=10,resolution='HIGH';
 const dir=path.resolve(opt('--batch-dir',path.join(ROOT,'library/batches/hyperframes-100')));
 if(args.includes('--dry-run')){console.log(JSON.stringify({items:items.length,workers,model,fps,resolution,batch_dir:dir},null,2));return;}
 for(const x of ['sources','logs'])fs.mkdirSync(path.join(dir,x),{recursive:true});
 const lock=path.join(dir,'run.lock');let fd;try{fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,JSON.stringify({pid:process.pid,started_at:new Date().toISOString()}));}catch{throw Error('Batch lock exists. Check run.lock PID; remove only after confirming previous process exited.');}
 let stopped=false,stopReason=null;const active=new Set();const onSignal=()=>{stopped=true;stopReason='Interrupted by operator';for(const child of active)child.kill('SIGTERM');};process.on('SIGINT',onSignal);process.on('SIGTERM',onSignal);
 try{
 const statePath=path.join(dir,'state.json'),prompt=fs.readFileSync(path.join(ROOT,'prompt.txt'),'utf8');
 const fingerprint=createHash('sha256').update(JSON.stringify({items,model,fps,resolution,prompt})).digest('hex');
 const state=fs.existsSync(statePath)?read(statePath):{schema_version:1,created_at:new Date().toISOString(),fingerprint,settings:{model,fps,resolution,workers},items:{}};
 if(state.fingerprint!==fingerprint)throw Error('Manifest, prompt or settings changed. Use a new --batch-dir to preserve provenance.');
 atomic(path.join(dir,'manifest.json'),{items});
 const persist=()=>{state.updated_at=new Date().toISOString();state.stopped_reason=stopReason;atomic(statePath,state);};
 const complete=new Map(),running=new Map();const refs=path.join(ROOT,'library/references');
 for(const name of fs.existsSync(refs)?fs.readdirSync(refs):[]){try{const folder=path.join(refs,name),m=read(path.join(folder,'source.json'));if(m.status==='complete'&&m.model===model&&m.sampling_fps===fps&&m.media_resolution===resolution&&fs.readFileSync(path.join(folder,'prompt.txt'),'utf8')===prompt+`\nMeasured duration: ${m.duration_s} seconds.`)complete.set(m.source_sha256,m.id);}catch{}}
 async function retry(fn,entry,label){for(let n=0;n<3;n++){if(stopped)throw Error(stopReason||'Batch stopped');try{return await fn(n);}catch(e){const message=String(e.message);entry.last_error=message;persist();if(systemic(message)){stopped=true;stopReason=message;persist();throw e;}if(!transient(message)||n===2||stopped)throw e;const wait=15000*2**n;entry.retry={phase:label,attempt:n+1,wait_ms:wait};persist();await sleep(wait);}}}
 async function analyze(entry,source,hash){return retry(async attempt=>{
 const id=`${hash.slice(0,12)}-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`;entry.run_ids??=[];entry.run_ids.push(id);entry.status='analyzing';persist();
 const log=path.join(dir,'logs',id+'.log');entry.log_paths??=[];entry.log_paths.push(path.relative(ROOT,log));persist();
 const code=await new Promise((resolve,reject)=>{const out=fs.openSync(log,'w');const child=spawn(process.execPath,[path.join(ROOT,'analyze.mjs'),'analyze',source,'--fps',String(fps),'--resolution','high','--model',model,'--run-id',id],{stdio:['ignore',out,out]});fs.closeSync(out);active.add(child);child.on('error',e=>{active.delete(child);reject(e);});child.on('exit',code=>{active.delete(child);resolve(code);});});
 const mpath=path.join(refs,id,'source.json'),m=fs.existsSync(mpath)?read(mpath):null;if(code!==0||m?.status!=='complete')throw Error(m?.error||fs.readFileSync(log,'utf8').slice(-2000)||'Analyzer failed');return id;
 },entry,'analysis');}
 async function processItem(item){const entry=state.items[item.id]??={provenance:item,status:'pending',run_ids:[]};if(entry.status==='complete'&&entry.reference_id&&complete.get(entry.sha256))return;
 // Non-transient failures stay failed across resume; an explicit --retry-failed enables another attempt.
 if(entry.status==='failed'&&!args.includes('--retry-failed'))return;
 entry.status='downloading';entry.started_at=new Date().toISOString();persist();
 try{
 const safe=createHash('sha256').update(String(item.id)).digest('hex').slice(0,16),ext=path.extname(new URL(item.video_url).pathname).toLowerCase();if(!['.mp4','.webm','.mov'].includes(ext))throw Error('Unsupported video URL extension');const source=path.join(dir,'sources',safe+ext);
 if(!fs.existsSync(source))await retry(async()=>{const res=await fetch(item.video_url,{signal:AbortSignal.timeout(120000)});if(!res.ok)throw Error('Download HTTP '+res.status);if(Number(res.headers.get('content-length'))>200*1024*1024)throw Error('Video exceeds 200 MiB limit');const tmp=source+'.part';let size=0;const fd=fs.openSync(tmp,'w');try{for await(const chunk of res.body){size+=chunk.length;if(size>200*1024*1024)throw Error('Video exceeds 200 MiB limit');fs.writeSync(fd,chunk);}if(!size)throw Error('Empty download');}catch(e){fs.rmSync(tmp,{force:true});throw e;}finally{fs.closeSync(fd);}fs.renameSync(tmp,source);},entry,'download');
 const hash=createHash('sha256').update(fs.readFileSync(source)).digest('hex');entry.sha256=hash;entry.source_path=path.relative(ROOT,source);persist();
 let id=complete.get(hash);if(id){entry.reused=true;}else if(running.has(hash)){id=await running.get(hash);entry.reused=true;}else{const promise=analyze(entry,source,hash);running.set(hash,promise);try{id=await promise;complete.set(hash,id);}finally{running.delete(hash);}}
 entry.reference_id=id;entry.reference_path=path.relative(ROOT,path.join(refs,id));entry.status='complete';entry.completed_at=new Date().toISOString();delete entry.last_error;delete entry.retry;console.log(`Complete ${item.id}: ${id}`);
 }catch(e){entry.status=stopped?'interrupted':'failed';entry.last_error=String(e.message);console.error(`${entry.status} ${item.id}: ${entry.last_error}`);}persist();}
 const selected=items.slice(0,limit);let cursor=0;await Promise.all(Array.from({length:workers},async()=>{while(!stopped&&cursor<selected.length)await processItem(selected[cursor++]);}));
 state.counts={};for(const x of Object.values(state.items))state.counts[x.status]=(state.counts[x.status]||0)+1;persist();console.log(JSON.stringify({counts:state.counts,stopped_reason:stopReason,state_path:statePath},null,2));if(stopped||state.counts.failed||state.counts.interrupted)process.exitCode=1;
 }finally{fs.closeSync(fd);fs.rmSync(lock,{force:true});process.removeListener('SIGINT',onSignal);process.removeListener('SIGTERM',onSignal);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});

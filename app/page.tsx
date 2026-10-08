'use client';
import {useEffect, useMemo, useState} from 'react';
import {Camera,FileText,ShieldCheck,ArrowRight,Upload,CheckCircle2,Trash2,Download,RotateCcw} from 'lucide-react';

type Photo={id:string; name:string; url:string; kind:'before'|'after'};
type Finding={id:string; title:string; detail:string; status:'REVIEW'|'ACTION'|'READY'; confidence?:number};

const findingsFor=(asset:string,before:number,after:number):Finding[]=>[
 {id:'f1',title:'Possible visible change',detail:'Rear-right area should be compared with the corresponding previous capture.',status:'REVIEW'},
 {id:'f2',title:after<3?'Additional evidence recommended':'Evidence coverage captured',detail:after<3?'Add at least one more current photo from a different angle.':'Current evidence includes multiple after-condition angles.',status:after<3?'ACTION':'READY'},
 {id:'f3',title:'Inspection record',detail:`${asset} · ${before} before photo${before===1?'':'s'} · ${after} after photo${after===1?'':'s'}`,status:'READY'}
];

export default function Home(){
 const [asset,setAsset]=useState('CAT 259D3');
 const [assetId,setAssetId]=useState('A-1042');
 const [before,setBefore]=useState<Photo[]>([]);
 const [after,setAfter]=useState<Photo[]>([]);
 const [analyzing,setAnalyzing]=useState(false);
 const [done,setDone]=useState(false);
 const [findings,setFindings]=useState<Finding[]>([]);
 const [saved,setSaved]=useState(false);
 const [reportOpen,setReportOpen]=useState(false);
 const [createdAt,setCreatedAt]=useState('');
 const [analysisMode,setAnalysisMode]=useState<'demo'|'vision'|'fallback'|''>('');
 const [error,setError]=useState('');

 useEffect(()=>{
  try{const raw=localStorage.getItem('inspectai-last'); if(!raw)return; const x=JSON.parse(raw); setAsset(x.asset||'CAT 259D3');setAssetId(x.assetId||'A-1042');setCreatedAt(x.createdAt||'');setDone(!!x.done);setFindings(x.findings||[]);setSaved(true);}catch{}
 },[]);
 const allPhotos=useMemo(()=>[...before,...after],[before,after]);
 const compressImage=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read image'));reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1600;const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);const ctx=c.getContext('2d');if(!ctx)return reject(new Error('Canvas unavailable'));ctx.drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',0.82));};img.onerror=()=>reject(new Error('Could not decode image'));img.src=String(reader.result)};reader.readAsDataURL(file)});
 const addFiles=(files:FileList|null,kind:'before'|'after')=>{if(!files)return;Array.from(files).slice(0,8).forEach(async file=>{if(!file.type.startsWith('image/'))return;try{const url=await compressImage(file);const p={id:crypto.randomUUID(),name:file.name,url,kind};if(kind==='before')setBefore(x=>[...x,p]);else setAfter(x=>[...x,p]);setDone(false);setError('')}catch{setError('One image could not be processed. Please try another photo.')}});};
 const remove=(id:string)=>{setBefore(x=>x.filter(p=>p.id!==id));setAfter(x=>x.filter(p=>p.id!==id));setDone(false)};
 const analyze=async()=>{if(!before.length||!after.length)return;setAnalyzing(true);setDone(false);setError('');try{const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset,before:before.map(({url,name,kind})=>({url,name,kind})),after:after.map(({url,name,kind})=>({url,name,kind}))})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Analysis failed');setFindings(data.findings||[]);setAnalysisMode(data.mode||'demo');setDone(true)}catch(e){setError(e instanceof Error?e.message:'Analysis failed. Please retry.')}finally{setAnalyzing(false)}};
 const save=()=>{const payload={asset,assetId,before:before.map(p=>({name:p.name})),after:after.map(p=>({name:p.name})),findings,done,createdAt:createdAt||new Date().toISOString()};localStorage.setItem('inspectai-last',JSON.stringify(payload));setCreatedAt(payload.createdAt);setSaved(true)};
 const reset=()=>{setBefore([]);setAfter([]);setFindings([]);setDone(false);setSaved(false);setReportOpen(false);setAnalysisMode('');setError('');localStorage.removeItem('inspectai-last');};
 const downloadReport=()=>{setReportOpen(true);setTimeout(()=>window.print(),150)};
 return <main className="shell">
  <nav className="nav"><div className="brand">Inspect<span>AI</span></div><div className="badge">Private beta · Equipment rental</div></nav>
  <section className="hero"><div className="heroCard"><div className="eyebrow">Condition intelligence</div><h1>Know what changed before it becomes a dispute.</h1><p>InspectAI turns guided before/after evidence into a clear, reviewable condition record for equipment and physical assets.</p><div className="actions"><button className="btn primary" onClick={()=>document.getElementById('inspection')?.scrollIntoView({behavior:'smooth'})}>Start an inspection <ArrowRight size={16} style={{verticalAlign:'-3px'}}/></button><button className="btn secondary" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works</button></div></div>
   <div className="panel mock"><div className="mockTop"><span>LIVE INSPECTION</span><span>● Ready</span></div><div className="mockTitle">Asset #{assetId}</div><div className="progress"><i style={{width:`${Math.min(100,Math.max(8,(before.length+after.length)*10))}%`}}/></div><div className="issue"><strong>{done?'Review findings':'Evidence capture'}</strong><small>{done?'AI suggestions are ready for human verification.':`${before.length} before · ${after.length} after photos captured.`}</small></div><div className="row"><span>Current asset</span><b>{asset}</b></div><div className="row"><span>Evidence</span><b>{allPhotos.length} photos</b></div></div></section>
  <section className="stats"><div className="stat"><b>2 min</b><span>target inspection time</span></div><div className="stat"><b>8–12</b><span>guided angles</span></div><div className="stat"><b>1 PDF</b><span>shareable condition report</span></div></section>
  <section className="workspace" id="inspection"><div className="panel"><h2><Camera size={19} style={{verticalAlign:'-4px'}}/> New inspection</h2><p className="sub">Capture evidence first. Analysis stays reviewable by a human.</p><div className="form"><label className="label">Asset name<input className="input" value={asset} onChange={e=>setAsset(e.target.value)} /></label><label className="label">Asset / rental ID<input className="input" value={assetId} onChange={e=>setAssetId(e.target.value)} /></label>
   <div className="uploadGrid"><label className="upload fileBtn"><Upload size={25}/><strong>Before photos</strong><small>{before.length} selected · tap to add</small><input type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files,'before')}/></label><label className="upload fileBtn"><Upload size={25}/><strong>After photos</strong><small>{after.length} selected · tap to add</small><input type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files,'after')}/></label></div>
   {allPhotos.length>0&&<div className="thumbs">{allPhotos.map(p=><div className="thumb" key={p.id}><img src={p.url} alt=""/><button aria-label="Remove photo" onClick={()=>remove(p.id)}><Trash2 size={13}/></button><span>{p.kind}</span></div>)}</div>}
   <div className="actions"><button className="btn primary" onClick={analyze} disabled={analyzing||!before.length||!after.length}>{analyzing?'Analyzing…':'Analyze inspection'}</button><button className="btn secondary" onClick={save}>Save locally</button></div>
   {saved&&<div className="saved"><CheckCircle2 size={15}/> Inspection saved on this device.</div>}
  </div></div>
  <div className="panel"><h2><ShieldCheck size={19} style={{verticalAlign:'-4px'}}/> Review findings</h2><p className="sub">AI suggestions describe visible evidence; they do not determine fault or responsibility.</p>
   {!done&&!analyzing&&<div className="upload"><FileText size={28}/><strong>Your findings will appear here</strong><small>Add at least one before and one after image, then analyze.</small></div>}
   {analyzing&&<div className="upload"><strong>Comparing inspection evidence…</strong><small>Preparing review notes from the captured evidence.</small></div>}
   {error&&<div className="error">{error}</div>}
   {done&&<div className="result">{analysisMode&&<div className="modeNote">Analysis: <b>{analysisMode==='vision'?'AI vision':'review fallback'}</b> · human verification required</div>}{findings.map(f=><div className="finding" key={f.id}><div><b>{f.title}</b><div className="sub">{f.detail}</div></div><span className={`pill ${f.status==='READY'?'green':'amber'}`}>{f.confidence!=null?`${Math.round(f.confidence*100)}% · `:''}{f.status}</span></div>)}<div className="actions"><button className="btn primary" onClick={downloadReport}><Download size={16} style={{verticalAlign:'-3px'}}/> Generate report</button><button className="btn secondary" onClick={reset}><RotateCcw size={15} style={{verticalAlign:'-3px'}}/> New inspection</button></div></div>}
  </div></section>
  <section className="panel how" id="how"><h2>How InspectAI works</h2><div className="steps"><div><b>01 · Capture</b><span>Record the asset and collect before/after images.</span></div><div><b>02 · Compare</b><span>Generate review suggestions from the evidence.</span></div><div><b>03 · Verify</b><span>A person confirms, rejects, or requests more evidence.</span></div><div><b>04 · Report</b><span>Create a clean record that can be saved or shared.</span></div></div></section>
  {reportOpen&&<section className="report printReport"><div className="reportHead"><div><div className="brand">Inspect<span>AI</span></div><h2>Condition Inspection Report</h2></div><div className="reportMeta">{new Date(createdAt||Date.now()).toLocaleString()}</div></div><div className="reportGrid"><div><small>ASSET</small><b>{asset}</b></div><div><small>ASSET / RENTAL ID</small><b>{assetId}</b></div><div><small>EVIDENCE</small><b>{before.length} before · {after.length} after</b></div></div><h3>Review findings</h3>{findings.map(f=><div className="reportFinding" key={f.id}><b>{f.title}</b><span>{f.status}</span><p>{f.detail}</p></div>)}<div className="disclaimer">This report records captured evidence and review suggestions. It does not independently establish causation, fault, or responsibility.</div></section>}
  <div className="footer">InspectAI prototype · Local-first now, cloud/AI integration next.</div>
 </main>;
}

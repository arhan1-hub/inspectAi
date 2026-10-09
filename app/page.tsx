'use client';
import {useEffect, useMemo, useState} from 'react';
import {Activity, ArrowRight, ArrowUpRight, Camera, CheckCircle2, Download, FileCheck2, FileText, GitCompareArrows, RotateCcw, ScanLine, ShieldCheck, Sparkles, Trash2, Upload, Zap} from 'lucide-react';

type Photo={id:string; name:string; url:string; kind:'before'|'after'};
type Finding={id:string; title:string; detail:string; status:'REVIEW'|'ACTION'|'READY'; confidence?:number};

const findingsFor=(asset:string,before:number,after:number):Finding[]=>[
 {id:'f1',title:'Possible visible change',detail:'Rear-right area should be compared with the corresponding previous capture.',status:'REVIEW'},
 {id:'f2',title:after<3?'Additional evidence recommended':'Evidence coverage captured',detail:after<3?'Add at least one more current photo from a different angle.':'Current evidence includes multiple after-condition angles.',status:after<3?'ACTION':'READY'},
 {id:'f3',title:'Inspection record',detail:`${asset} · ${before} before photo${before===1?'':'s'} · ${after} after photo${after===1?'':'s'}`,status:'READY'}
];

const reviews=[
 {quote:'The workflow is built around evidence, not guesswork.',role:'Demo feedback',meta:'Sample review'},
 {quote:'Before and after finally live in one reviewable record.',role:'Demo feedback',meta:'Sample review'},
 {quote:'The human verification step makes the AI feel responsible.',role:'Demo feedback',meta:'Sample review'}
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
 const [reviewIndex,setReviewIndex]=useState(0);

 useEffect(()=>{
  try{const raw=localStorage.getItem('inspectai-last'); if(!raw)return; const x=JSON.parse(raw); setAsset(x.asset||'CAT 259D3');setAssetId(x.assetId||'A-1042');setCreatedAt(x.createdAt||'');setDone(!!x.done);setFindings(x.findings||[]);setSaved(true);}catch{}
 },[]);
 useEffect(()=>{const t=window.setInterval(()=>setReviewIndex(i=>(i+1)%reviews.length),5000);return()=>window.clearInterval(t)},[]);
 const allPhotos=useMemo(()=>[...before,...after],[before,after]);
 const compressImage=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read image'));reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1600;const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);const ctx=c.getContext('2d');if(!ctx)return reject(new Error('Canvas unavailable'));ctx.drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',0.82));};img.onerror=()=>reject(new Error('Could not decode image'));img.src=String(reader.result)};reader.readAsDataURL(file)});
 const addFiles=(files:FileList|null,kind:'before'|'after')=>{if(!files)return;Array.from(files).slice(0,8).forEach(async file=>{if(!file.type.startsWith('image/'))return;try{const url=await compressImage(file);const p={id:crypto.randomUUID(),name:file.name,url,kind};if(kind==='before')setBefore(x=>[...x,p]);else setAfter(x=>[...x,p]);setDone(false);setError('')}catch{setError('One image could not be processed. Please try another photo.')}});};
 const remove=(id:string)=>{setBefore(x=>x.filter(p=>p.id!==id));setAfter(x=>x.filter(p=>p.id!==id));setDone(false)};
 const analyze=async()=>{if(!before.length||!after.length)return;setAnalyzing(true);setDone(false);setError('');try{const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asset,before:before.map(({url,name,kind})=>({url,name,kind})),after:after.map(({url,name,kind})=>({url,name,kind}))})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Analysis failed');setFindings(data.findings||[]);setAnalysisMode(data.mode||'demo');setDone(true)}catch(e){setError(e instanceof Error?e.message:'Analysis failed. Please retry.')}finally{setAnalyzing(false)}};
 const save=()=>{const payload={asset,assetId,before:before.map(p=>({name:p.name})),after:after.map(p=>({name:p.name})),findings,done,createdAt:createdAt||new Date().toISOString()};localStorage.setItem('inspectai-last',JSON.stringify(payload));setCreatedAt(payload.createdAt);setSaved(true)};
 const reset=()=>{setBefore([]);setAfter([]);setFindings([]);setDone(false);setSaved(false);setReportOpen(false);setAnalysisMode('');setError('');localStorage.removeItem('inspectai-last');};
 const downloadReport=()=>{setReportOpen(true);setTimeout(()=>window.print(),150)};
 const evidence=Math.min(100,Math.max(8,(before.length+after.length)*10));
 return <main className="shell">
  <div className="ambient ambientOne"/><div className="ambient ambientTwo"/>
  <nav className="nav reveal"><a className="brand" href="#top">Inspect<span>AI</span></a><div className="navLinks"><a href="#how">How it works</a><a href="#reviews">Reviews</a><a href="#inspection">Product</a></div><div className="badge"><i/> Private beta · Equipment rental</div></nav>

  <section className="hero" id="top">
   <div className="heroCopy reveal delay1">
    <div className="eyebrow"><span className="pulseDot"/> CONDITION INTELLIGENCE</div>
    <h1>Know <em>what changed.</em><br/>Before it becomes a dispute.</h1>
    <p>InspectAI turns guided before/after evidence into a clear, reviewable condition record for equipment and physical assets.</p>
    <div className="actions"><button className="btn primary glow" onClick={()=>document.getElementById('inspection')?.scrollIntoView({behavior:'smooth'})}>Start an inspection <ArrowRight size={16}/></button><button className="btn secondary" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works</button></div>
    <div className="trustLine"><span><ShieldCheck size={15}/> Human verified</span><span><ScanLine size={15}/> Evidence first</span><span><Zap size={15}/> Fast review</span></div>
   </div>
   <div className="heroVisual reveal delay2">
    <div className="scanGrid"/>
    <div className="orbit orbitA"/><div className="orbit orbitB"/>
    <div className="floatingChip chipOne"><span className="chipIcon green"><CheckCircle2 size={15}/></span><div><b>92% evidence</b><small>coverage captured</small></div></div>
    <div className="floatingChip chipTwo"><span className="chipIcon blue"><Activity size={15}/></span><div><b>3 changes</b><small>ready for review</small></div></div>
    <div className="floatingChip chipThree"><span className="chipIcon purple"><Sparkles size={15}/></span><div><b>AI vision</b><small>human verification</small></div></div>
    <div className="inspectionCard">
      <div className="cardTop"><span><span className="liveDot"/> LIVE INSPECTION</span><span>#{assetId}</span></div>
      <div className="machinePreview"><div className="machineGlow"/><div className="machineShape"><div className="cab"/><div className="boom"/><div className="arm"/><div className="bucket"/><div className="track trackOne"/><div className="track trackTwo"/></div><div className="scanLine"/></div>
      <div className="cardBottom"><div><small>Current asset</small><b>{asset}</b></div><div className="miniScore"><b>{evidence}%</b><span>coverage</span></div></div>
    </div>
   </div>
  </section>

  <section className="stats reveal delay2"><div className="stat"><span className="statIcon"><Camera size={17}/></span><div><b>2 min</b><span>target inspection time</span></div></div><div className="stat"><span className="statIcon"><GitCompareArrows size={17}/></span><div><b>Before → After</b><span>same asset, one record</span></div></div><div className="stat"><span className="statIcon"><FileCheck2 size={17}/></span><div><b>1 PDF</b><span>clean condition report</span></div></div></section>

  <section className="sectionIntro reveal"><div><div className="eyebrow">THE DIFFERENCE</div><h2>Evidence that tells a story.</h2></div><p>Not another generic AI dashboard. InspectAI is designed around the moment teams need to compare an asset, understand visible changes, and make a human decision.</p></section>
  <section className="comparison panel reveal">
   <div className="comparisonHead"><div><span className="tinyLabel">BEFORE / AFTER</span><h3>Make the change visible.</h3></div><span className="compareBadge"><span/> Live comparison</span></div>
   <div className="compareStage"><div className="fakePhoto beforePhoto"><div className="photoLabel">BEFORE</div><div className="excavator miniBefore"><div className="miniCab"/><div className="miniBoom"/><div className="miniArm"/><div className="miniBucket"/><div className="miniTrack"/></div></div><div className="compareDivider"><div className="compareArrow"><ArrowRight size={17}/></div></div><div className="fakePhoto afterPhoto"><div className="photoLabel">AFTER</div><div className="excavator miniAfter"><div className="miniCab"/><div className="miniBoom"/><div className="miniArm"/><div className="miniBucket"/><div className="miniTrack"/></div><div className="changeMarker"><span/>Visible change</div></div></div>
   <div className="evidenceStrip"><div><small>VISIBLE CHANGE</small><b>Rear-right area</b></div><div><small>CONFIDENCE</small><b>68% · REVIEW</b></div><div><small>NEXT STEP</small><b>Human verification</b></div></div>
  </section>

  <section className="workspace" id="inspection"><div className="panel reveal"><div className="panelKicker"><span>01</span> CAPTURE EVIDENCE</div><h2><Camera size={19}/> New inspection</h2><p className="sub">Capture evidence first. Analysis stays reviewable by a human.</p><div className="form"><label className="label">Asset name<input className="input" value={asset} onChange={e=>setAsset(e.target.value)} /></label><label className="label">Asset / rental ID<input className="input" value={assetId} onChange={e=>setAssetId(e.target.value)} /></label><div className="uploadGrid"><label className="upload fileBtn"><Upload size={24}/><strong>Before photos</strong><small>{before.length} selected · tap to add</small><input type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files,'before')}/></label><label className="upload fileBtn"><Upload size={24}/><strong>After photos</strong><small>{after.length} selected · tap to add</small><input type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files,'after')}/></label></div>{allPhotos.length>0&&<div className="thumbs">{allPhotos.map(p=><div className="thumb" key={p.id}><img src={p.url} alt=""/><button aria-label="Remove photo" onClick={()=>remove(p.id)}><Trash2 size={13}/></button><span>{p.kind}</span></div>)}</div>}<div className="actions"><button className="btn primary glow" onClick={analyze} disabled={analyzing||!before.length||!after.length}>{analyzing?'Analyzing…':'Analyze inspection'}</button><button className="btn secondary" onClick={save}>Save locally</button></div>{saved&&<div className="saved"><CheckCircle2 size={15}/> Inspection saved on this device.</div>}</div></div>
   <div className="panel reveal delay1"><div className="panelKicker"><span>02</span> REVIEW EVIDENCE</div><h2><ShieldCheck size={19}/> Review findings</h2><p className="sub">AI suggestions describe visible evidence; they do not determine fault or responsibility.</p>{!done&&!analyzing&&<div className="upload emptyState"><FileText size={28}/><strong>Your findings will appear here</strong><small>Add at least one before and one after image, then analyze.</small></div>}{analyzing&&<div className="upload emptyState scanning"><div className="loaderRing"><ScanLine size={20}/></div><strong>Comparing inspection evidence…</strong><small>Preparing review notes from the captured evidence.</small></div>}{error&&<div className="error">{error}</div>}{done&&<div className="result">{analysisMode&&<div className="modeNote"><span className="modePulse"/> Analysis: <b>{analysisMode==='vision'?'AI vision':'review fallback'}</b> · human verification required</div>}{findings.map(f=><div className="finding" key={f.id}><div><b>{f.title}</b><div className="sub">{f.detail}</div></div><span className={`pill ${f.status==='READY'?'green':'amber'}`}>{f.confidence!=null?`${Math.round(f.confidence*100)}% · `:''}{f.status}</span></div>)}<div className="actions"><button className="btn primary" onClick={downloadReport}><Download size={16}/> Generate report</button><button className="btn secondary" onClick={reset}><RotateCcw size={15}/> New inspection</button></div></div>}</div></section>

  <section className="workflow panel reveal" id="how"><div className="sectionTitle"><div><div className="eyebrow">HOW IT WORKS</div><h2>From camera roll to condition record.</h2></div><span className="workflowTag">BUILT FOR REVIEW</span></div><div className="steps"><div className="step active"><span>01</span><b>Capture</b><p>Record the asset and collect matched before/after images.</p></div><div className="step"><span>02</span><b>Compare</b><p>Generate structured suggestions from the evidence.</p></div><div className="step"><span>03</span><b>Verify</b><p>A person confirms, rejects, or requests more evidence.</p></div><div className="step"><span>04</span><b>Report</b><p>Create a clean record that can be saved or shared.</p></div></div></section>

  <section className="reviewSection reveal" id="reviews"><div className="reviewIntro"><div className="eyebrow">EARLY SIGNAL</div><h2>Built to make review easier.</h2><p>Sample product feedback shown for prototype purposes. Replace these with real customer quotes after pilots.</p></div><div className="reviewCard"><div className="stars">★★★★★</div><blockquote>“{reviews[reviewIndex].quote}”</blockquote><div className="reviewMeta"><div className="avatar">IA</div><div><b>{reviews[reviewIndex].role}</b><span>{reviews[reviewIndex].meta}</span></div><div className="reviewDots">{reviews.map((_,i)=><button key={i} className={i===reviewIndex?'active':''} onClick={()=>setReviewIndex(i)} aria-label={`Review ${i+1}`}/>)}</div></div></div></section>

  <section className="finalCta reveal"><div><div className="eyebrow"><Sparkles size={14}/> THE NEXT STEP</div><h2>Turn every handoff into evidence.</h2><p>Start with one asset. Build the evidence trail. Then scale across the fleet.</p></div><button className="btn primary glow" onClick={()=>document.getElementById('inspection')?.scrollIntoView({behavior:'smooth'})}>Create an inspection <ArrowUpRight size={16}/></button></section>

  {reportOpen&&<section className="report printReport"><div className="reportHead"><div><div className="brand">Inspect<span>AI</span></div><h2>Condition Inspection Report</h2></div><div className="reportMeta">{new Date(createdAt||Date.now()).toLocaleString()}</div></div><div className="reportGrid"><div><small>ASSET</small><b>{asset}</b></div><div><small>ASSET / RENTAL ID</small><b>{assetId}</b></div><div><small>EVIDENCE</small><b>{before.length} before · {after.length} after</b></div></div><h3>Review findings</h3>{findings.map(f=><div className="reportFinding" key={f.id}><b>{f.title}</b><span>{f.status}</span><p>{f.detail}</p></div>)}<div className="disclaimer">This report records captured evidence and review suggestions. It does not independently establish causation, fault, or responsibility.</div></section>}
  <footer className="footer"><div className="brand">Inspect<span>AI</span></div><span>Condition intelligence for physical assets.</span><span>Prototype · 2026</span></footer>
 </main>;
}

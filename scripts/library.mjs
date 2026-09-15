import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const ROOT=path.resolve(here,'..');
export const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(root,p,data)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),data);};
const json=(root,p,v)=>write(root,p,JSON.stringify(v,null,2)+'\n');
const indexPath='metadata/paper_index.json', queuePath='review_queue/paper_review_queue.json';
export const doi=v=>v?String(v).trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'').toLowerCase():null;
export const arxiv=v=>v?String(v).trim().replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//i,'').replace(/\.pdf$/i,'').replace(/^arxiv:/i,'').replace(/v\d+$/i,'').toLowerCase():null;
export const title=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const statuses=['registered','screened','review_candidate','queued_for_review','reviewed'];
const fields=['author','title','journal','year','volume','number','pages','doi','url','eprint','archivePrefix','primaryClass'];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
export function duplicates(p,papers){
 const checks=[
  q=>doi(p.doi)&&doi(p.doi)===doi(q.doi),
  q=>arxiv(p.arxiv_id)&&arxiv(p.arxiv_id)===arxiv(q.arxiv_id),
  q=>title(p.title)&&title(p.title)===title(q.title),
  q=>title(p.title)===title(q.title)&&p.authors?.[0]===q.authors?.[0]&&p.year===q.year
 ];
 for(const check of checks){const found=papers.filter(check);if(found.length)return found;}
 return [];
}
export function tex(s){return String(s??'要検討').replace(/[\\{}%&#_$~^]/g,c=>({'\\':'\\textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$','~':'\\textasciitilde{}','^':'\\textasciicircum{}'}[c]));}
const aliases={'building management system':'BMS','building management systems':'BMS','bms':'BMS','bim':'BIM','building information modeling':'BIM','building information modelling':'BIM','iot':'IoT','internet of things':'IoT','hvac':'HVAC','digital twin':'Digital Twin','llm':'LLM','large language model':'LLM','large language models':'LLM'};
function card(p){
 const s=p.screening_review;
 return '\\subsection{'+p.paper_id+' --- '+tex(p.title)+'}\n\\label{paper:'+p.paper_id+'}\n'+
 '\\textbf{Authors:} '+tex(p.authors?.join(', '))+'\\par\n'+
 '\\textbf{Major Category:} '+tex(p.primary_category)+'\\par\n'+
 (p.secondary_categories.length?'\\textbf{Secondary Category:} '+tex(p.secondary_categories.join(', '))+'\\par\n':'')+
 '\\textbf{Keywords:} '+tex(p.keywords.join(', ')||'要検討')+'\\par\n'+
 '\\paragraph{主な主張}\n'+tex(s.main_claim)+' \\cite{'+p.bibtex_key+'}\n'+
 '\\paragraph{新規性}\n'+tex(s.novelty)+'\n\\paragraph{位置付け}\n'+tex(s.positioning)+'\n';
}
function bib(p){
 return '@'+p.bibliography_type+'{'+p.bibtex_key+',\n'+Object.entries(p.bibliography).filter(([,v])=>v!==null&&v!=='').map(([k,v])=>'  '+k+' = {'+tex(v)+'}').join(',\n')+'\n}\n';
}
function checkEvidence(p){
 for(const [k,v] of Object.entries(p.bibliography)){
  assert(fields.includes(k),'Unsupported bibliography field: '+k);
  if(v!==null&&v!=='')assert(p.evidence?.bibliography?.[k]?.source,'Missing bibliographic source: '+k);
 }
 for(const [k,v] of Object.entries(p.screening_review)){
  assert(typeof v==='string'&&v.trim(),'Missing review field: '+k);
  assert(v.length<=600,'Keep reviews short: '+k);
  if(v!=='要検討'){
   const e=p.evidence?.review?.[k];
   assert(e?.source&&e?.locator&&['author_claim','interpretation'].includes(e?.kind),'Missing review evidence / attribution: '+k);
   assert(p.full_text_checked,'Without full text, review fields must be 要検討');
  }
 }
 if(p.primary_category!=='Uncategorized')assert(p.evidence?.classification?.source&&p.evidence.classification.rationale,'Classification needs source and contribution rationale');
}
function prepare(root,input,existing,id){
 const cats=read(root,'metadata/categories.json').map(c=>c.name);
 const p={...input,paper_id:id,bibtex_key:existing?.bibtex_key||input.bibtex_key,
  paper_file:'papers/'+id+'.tex',doi:doi(input.doi),arxiv_id:arxiv(input.arxiv_id),
  authors:input.authors??null,year:input.year??null,source_url:input.source_url??null,local_pdf:input.local_pdf??null,
  primary_category:input.primary_category||'Uncategorized',secondary_categories:input.secondary_categories||[],
  keywords:[...new Set((input.keywords||[]).map(k=>aliases[k.toLowerCase()]||k))],
  review_status:input.review_status||'registered',bibliography_type:input.bibliography_type||'article',
  screening_review:{main_claim:'要検討',novelty:'要検討',positioning:'要検討',...input.screening_review}};
 assert(typeof p.title==='string'&&p.title.trim(),'A verified title is required');
 assert(p.authors===null||(Array.isArray(p.authors)&&p.authors.every(a=>typeof a==='string')),'Authors must be an array or null');
 assert(p.year===null||Number.isInteger(p.year),'Year must be integer or null');
 assert(/^[A-Za-z][A-Za-z0-9:_-]*$/.test(p.bibtex_key),'Invalid BibTeX key');
 assert(['article','misc','inproceedings','techreport'].includes(p.bibliography_type),'Invalid bibliography type');
 assert(cats.includes(p.primary_category)&&p.secondary_categories.every(c=>cats.includes(c)&&c!==p.primary_category),'Invalid category');
 assert(statuses.includes(p.review_status),'Invalid review status');
 assert(p.keywords.length<=8&&(p.keywords.length>=3||p.keyword_exception),'Use 3-8 keywords, or explain keyword_exception');
 const b=p.bibliography||{};
 assert(b.title===p.title,'Bibliographic title must match index');
 assert((b.author??null)===(p.authors?.join(' and ')??null),'Bibliographic authors must match index');
 assert((b.year==null?null:Number(b.year))===p.year,'Bibliographic year must match index');
 assert(doi(b.doi)===p.doi&&arxiv(b.eprint)===p.arxiv_id,'Bibliographic identifiers must match index');
 assert((b.url??null)===p.source_url,'Bibliographic URL must match index');
 checkEvidence(p);
 return p;
}
function transaction(root,fn){
 const lock=path.join(root,'.library.lock');const fd=fs.openSync(lock,'wx');
 const paths=['papers','sections','metadata','review_queue','references.bib'];
 const backup=new Map();
 const collect=p=>{const absolute=path.join(root,p);if(fs.statSync(absolute).isDirectory())for(const n of fs.readdirSync(absolute))collect(p+'/'+n);else backup.set(p,fs.readFileSync(absolute));};
 paths.forEach(collect);
 try{return fn();}catch(e){
  for(const p of paths)fs.rmSync(path.join(root,p),{recursive:true,force:true});
  for(const [p,b]of backup)write(root,p,b);
  throw e;
 }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
function updateSections(root,index){
 for(const c of read(root,'metadata/categories.json')){
  const papers=index.papers.filter(p=>p.primary_category===c.name);
  write(root,'sections/'+c.slug+'.tex','\\section{'+(c.code?c.code+'. ':'')+tex(c.name)+'}\n'+
    (papers.map(p=>'\\input{papers/'+p.paper_id+'}\n').join('')||'% No papers registered.\n'));
 }
 write(root,'metadata/library_state.tex',index.papers.length?'\\def\\LibraryHasPapers{1}\n':'% Empty library; maintained by scripts/library.mjs.\n');
}
export function register(root,input){
 validate(root);
 return transaction(root,()=>{
  const index=read(root,indexPath),matches=duplicates(input,index.papers);
  assert(matches.length<=1,'Ambiguous duplicate; resolve manually');
  const existing=matches[0],id=existing?.paper_id||'P'+String(index.next_paper_id).padStart(3,'0');
  const p=prepare(root,input,existing,id);
  assert(!index.papers.some(q=>q.paper_id!==id&&q.bibtex_key===p.bibtex_key),'Duplicate BibTeX key');
  assert(!existing||!['queued_for_review','reviewed'].includes(existing.review_status),'Update source and existing handoff together after review has started');
  if(existing)index.papers[index.papers.indexOf(existing)]=p;
  else{index.papers.push(p);index.next_paper_id++;}
  write(root,p.paper_file,card(p));
  let b=fs.readFileSync(path.join(root,'references.bib'),'utf8');
  if(existing)b=b.replace(new RegExp('@'+existing.bibliography_type+'\\{'+existing.bibtex_key.replace(/[.*+?^$()|[\]\\]/g,'\\$&')+',[\\s\\S]*?\\n\\}\\n?'),()=>bib(p));
  else b+='\n'+bib(p);
  write(root,'references.bib',b);json(root,indexPath,index);updateSections(root,index);
  validate(root);return p;
 });
}
export function handoff(root,id,request={}){
 validate(root);
 return transaction(root,()=>{
  const index=read(root,indexPath),p=index.papers.find(p=>p.paper_id===id);
  assert(p,'Unknown Paper ID: '+id);
  assert(p.review_status!=='registered','Screen paper before handoff');
  const q={schema_version:'1.0',source_module:'paper-reading-module',target_module:'paper-review-module'};
  for(const k of ['paper_id','title','authors','doi','bibtex_key','source_url','local_pdf','primary_category','secondary_categories','keywords','screening_review'])q[k]=p[k];
  q.review_request={mode:'deep_review',focus:request.focus||[],user_questions:request.user_questions||[]};
  assert([...q.review_request.focus,...q.review_request.user_questions].every(s=>typeof s==='string'),'Focus and questions must be strings');
  json(root,'review_queue/'+id+'.json',q);
  const queue=read(root,queuePath);queue.papers=queue.papers.filter(q=>q.paper_id!==id);
  queue.papers.push({paper_id:id,handoff_file:'review_queue/'+id+'.json'});
  if(p.review_status!=='reviewed')p.review_status='queued_for_review';
  json(root,queuePath,queue);json(root,indexPath,index);validate(root);return q;
 });
}
export function status(root,id,value){
 assert(statuses.includes(value),'Invalid status');
 assert(value!=='queued_for_review','Use handoff to create queue');
 return transaction(root,()=>{
  const index=read(root,indexPath),p=index.papers.find(p=>p.paper_id===id);assert(p,'Unknown Paper ID');
  if(value==='reviewed')assert(fs.existsSync(path.join(root,'review_queue/'+id+'.json')),'Missing handoff');
  p.review_status=value;json(root,indexPath,index);validate(root);return p;
 });
}
export function validate(root){
 const index=read(root,indexPath),queue=read(root,queuePath);
 assert(index.schema_version==='1.0'&&queue.schema_version==='1.0','Schema version mismatch');
 assert(Number.isInteger(index.next_paper_id)&&index.next_paper_id>0,'Invalid next_paper_id');
 const bibtext=fs.readFileSync(path.join(root,'references.bib'),'utf8');
 const bibkeys=[...bibtext.matchAll(/@\w+\s*\{\s*([^,\s]+),/g)].map(m=>m[1]);
 assert(new Set(bibkeys).size===bibkeys.length,'Duplicate BibTeX key');
 const allSections=read(root,'metadata/categories.json').map(c=>({c,text:fs.readFileSync(path.join(root,'sections/'+c.slug+'.tex'),'utf8')}));
 const ids=new Set(), keys=new Set();
 for(const p of index.papers){
  assert(/^P\d{3,}$/.test(p.paper_id)&&!ids.has(p.paper_id),'Invalid / duplicate Paper ID');ids.add(p.paper_id);
  assert(Number(p.paper_id.slice(1))<index.next_paper_id,'ID counter would reuse an ID');
  assert(!keys.has(p.bibtex_key),'Duplicate BibTeX key');keys.add(p.bibtex_key);
  assert(duplicates(p,index.papers.filter(q=>q!==p)).length===0,'Duplicate paper: '+p.paper_id);
  prepare(root,p,p,p.paper_id);
  assert(p.paper_file==='papers/'+p.paper_id+'.tex','Invalid paper path');
  const cardtext=fs.readFileSync(path.join(root,p.paper_file),'utf8');
  assert(cardtext.includes('\\cite{'+p.bibtex_key+'}'),'Missing self citation');
  assert(cardtext===card(p),'Card/index differ; reconcile authoritative TeX and index before building');
  assert(bibtext.includes(bib(p).trim()),'Bibliography/index differ');
  const includes=allSections.flatMap(({c,text})=>[...text.matchAll(/\\input\{papers\/([^}]+)\}/g)].filter(m=>m[1]===p.paper_id).map(()=>c.name));
  assert(includes.length===1&&includes[0]===p.primary_category,'Paper must appear once in its primary section');
  for(const m of cardtext.matchAll(/\\cite\{([^}]+)\}/g))for(const k of m[1].split(','))assert(bibkeys.includes(k),'Undefined citation: '+k);
  if(['queued_for_review','reviewed'].includes(p.review_status))assert(queue.papers.some(q=>q.paper_id===p.paper_id),'Missing queue entry');
 }
 assert(bibkeys.length===index.papers.length,'Unexpected bibliography entries');
 for(const file of fs.readdirSync(path.join(root,'papers')))assert(file==='_template.tex'||ids.has(file.replace(/\.tex$/,''))&&file.endsWith('.tex'),'Unindexed paper: '+file);
 for(const {text} of allSections)for(const m of text.matchAll(/\\input\{papers\/([^}]+)\}/g))assert(ids.has(m[1]),'Unindexed section input');
 assert(new Set(queue.papers.map(q=>q.paper_id)).size===queue.papers.length,'Duplicate queue entry');
 for(const q of queue.papers){
  assert(ids.has(q.paper_id)&&q.handoff_file==='review_queue/'+q.paper_id+'.json','Invalid queue reference');
  const h=read(root,q.handoff_file),p=index.papers.find(p=>p.paper_id===q.paper_id);
  assert(h.source_module==='paper-reading-module'&&h.target_module==='paper-review-module'&&h.schema_version==='1.0','Invalid handoff schema');
  for(const k of ['paper_id','title','authors','doi','bibtex_key','source_url','local_pdf','primary_category','secondary_categories','keywords','screening_review'])assert(JSON.stringify(h[k])===JSON.stringify(p[k]),'Stale handoff: '+k);
 }
 for(const name of fs.readdirSync(path.join(root,'review_queue')))assert(name==='paper_review_queue.json'||queue.papers.some(q=>name===q.paper_id+'.json'),'Unindexed handoff');
 const main=fs.readFileSync(path.join(root,'main.tex'),'utf8');
 assert(main.includes('\\clearpage\n\\input{metadata/library_state.tex}')&&main.includes('\\bibliographystyle{unsrt}'),'References must begin on a new page in citation order');
 assert(!main.includes('\\nocite'),'Unconditional bibliography inclusion is forbidden');
 assert(fs.readFileSync(path.join(root,'metadata/library_state.tex'),'utf8').includes('\\def\\LibraryHasPapers')===Boolean(index.papers.length),'Stale library state');
 return {papers:index.papers.length,next_paper_id:'P'+String(index.next_paper_id).padStart(3,'0'),valid:true};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
 const [command,arg,extra]=process.argv.slice(2);
 let result;
 if(command==='validate')result=validate(ROOT);
 else if(command==='register')result=register(ROOT,JSON.parse(fs.readFileSync(arg,'utf8')));
 else if(command==='duplicates')result=duplicates(JSON.parse(fs.readFileSync(arg,'utf8')),read(ROOT,indexPath).papers);
 else if(command==='handoff')result=handoff(ROOT,arg,extra?JSON.parse(fs.readFileSync(extra,'utf8')):{});
 else if(command==='status')result=status(ROOT,arg,extra);
 else throw new Error('Usage: library.mjs validate | duplicates dossier.json | register dossier.json | status P001 review_candidate | handoff P001 [request.json]');
 console.log(JSON.stringify(result,null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}

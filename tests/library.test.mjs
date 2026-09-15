import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,read,register,validate,handoff,status,duplicates} from '../scripts/library.mjs';
function fixture(){
 const base=path.join(ROOT,'.tmp');fs.mkdirSync(base,{recursive:true});
 const root=fs.mkdtempSync(path.join(base,'test-'));
 for(const name of ['metadata','review_queue','papers','sections','references.bib','main.tex','macro_jsarticle.tex','.latexmkrc'])fs.cpSync(path.join(ROOT,name),path.join(root,name),{recursive:true});
 fs.writeFileSync(path.join(root,'metadata/paper_index.json'),JSON.stringify({schema_version:'1.0',next_paper_id:1,papers:[]}));
 fs.writeFileSync(path.join(root,'review_queue/paper_review_queue.json'),JSON.stringify({schema_version:'1.0',papers:[]}));
 for(const n of fs.readdirSync(path.join(root,'papers')))if(n!=='_template.tex')fs.unlinkSync(path.join(root,'papers',n));
 for(const n of fs.readdirSync(path.join(root,'review_queue')))if(n!=='paper_review_queue.json')fs.unlinkSync(path.join(root,'review_queue',n));
 fs.writeFileSync(path.join(root,'references.bib'),'% Empty test bibliography\n');
 fs.writeFileSync(path.join(root,'metadata/library_state.tex'),'% Empty test library\n');
 for(const c of read(root,'metadata/categories.json'))fs.writeFileSync(path.join(root,'sections',c.slug+'.tex'),'\\section{'+c.name+'}\n');
 return root;
}
function dossier(n=1){
 const title='Synthetic fixture '+n,author='Test Author';
 return {title,authors:[author],year:null,doi:null,arxiv_id:null,bibtex_key:n===1?'ZTest':'ATest'+n,
  source_url:null,primary_category:'Uncategorized',keywords:['BMS','BIM','IoT'],review_status:'screened',full_text_checked:true,
  bibliography:{title,author},evidence:{bibliography:{title:{source:'synthetic test'},author:{source:'synthetic test'}}}};
}
test('empty fixture is strict and actual library is valid',()=>{
 validate(ROOT);const root=fixture();try{assert.deepEqual(validate(root),{papers:0,next_paper_id:'P001',valid:true});}finally{fs.rmSync(root,{recursive:true});}
});
test('register P001, duplicate update without ID advance, handoff focus',()=>{
 const root=fixture();
 try{
  const first=register(root,dossier());assert.equal(first.paper_id,'P001');
  const updated=register(root,{...dossier(),keywords:['Building Management Systems','BIM','IoT']});
  assert.equal(updated.paper_id,'P001');assert.equal(updated.keywords[0],'BMS');
  assert.equal(read(root,'metadata/paper_index.json').next_paper_id,2);
  status(root,'P001','review_candidate');
  const q=handoff(root,'P001',{focus:['methodology'],user_questions:['How?']});
  assert.equal(q.target_module,'paper-review-module');assert.deepEqual(q.review_request.user_questions,['How?']);
  assert.equal(validate(root).papers,1);
 }finally{fs.rmSync(root,{recursive:true});}
});
test('normalized DOI, arxiv versions, title punctuation',()=>{
 assert.equal(duplicates({doi:'https://doi.org/10.1/ABC'},[{doi:'10.1/abc'}]).length,1);
 assert.equal(duplicates({arxiv_id:'https://arxiv.org/abs/2401.01234v2'},[{arxiv_id:'2401.01234v1'}]).length,1);
 assert.equal(duplicates({title:'BIM: A Study'},[{title:'bim a study'}]).length,1);
});
test('evidence rejection rolls back and preserves next ID',()=>{
 const root=fixture();try{
  const bad=dossier();bad.screening_review={main_claim:'Improves by 25%.'};
  assert.throws(()=>register(root,bad),/evidence/);
  assert.equal(validate(root).next_paper_id,'P001');
  assert.deepEqual(fs.readdirSync(path.join(root,'papers')),['_template.tex']);
 }finally{fs.rmSync(root,{recursive:true});}
});
test('conflicting DOI and title matches cannot overwrite either paper',()=>{
 const root=fixture();try{
  const first=dossier();first.doi='10.0000/test-one';first.bibliography.doi=first.doi;
  first.evidence.bibliography.doi={source:'synthetic test'};
  register(root,first);register(root,dossier(2));
  const conflict={...first,title:dossier(2).title,bibliography:{...first.bibliography,title:dossier(2).title}};
  assert.throws(()=>register(root,conflict),/Ambiguous duplicate/);
  assert.equal(validate(root).papers,2);
  assert.equal(read(root,'metadata/paper_index.json').next_paper_id,3);
 }finally{fs.rmSync(root,{recursive:true});}
});
test('abstract-only records cannot be marked screened and handoff requires arrays',()=>{
 const root=fixture();try{
  const p=dossier();p.full_text_checked=false;
  assert.throws(()=>register(root,p),/full-text/);
  p.review_status='registered';register(root,p);
  assert.throws(()=>status(root,'P001','screened'),/full-text/);
  register(root,dossier());
  assert.throws(()=>handoff(root,'P001',{focus:'methodology'}),/arrays/);
  assert.equal(read(root,'review_queue/paper_review_queue.json').papers.length,0);
 }finally{fs.rmSync(root,{recursive:true});}
});
test('counter is honored even when earlier IDs were deleted',()=>{
 const root=fixture();try{
  const idx=read(root,'metadata/paper_index.json');idx.next_paper_id=8;
  fs.writeFileSync(path.join(root,'metadata/paper_index.json'),JSON.stringify(idx));
  assert.equal(register(root,dossier()).paper_id,'P008');
 }finally{fs.rmSync(root,{recursive:true});}
});
test('source drift and duplicate identifiers are rejected',()=>{
 const root=fixture();try{
  register(root,dossier());
  fs.appendFileSync(path.join(root,'papers/P001.tex'),'% unexpected edit\n');
  assert.throws(()=>validate(root),/differ/);
 }finally{fs.rmSync(root,{recursive:true});}
});
test('empty and P001 PDF compile, citation order, handoff',t=>{
 if(spawnSync('latexmk',['-v']).error){t.skip('latexmk unavailable');return;}
 const root=fixture();try{
  const compile=()=>{
   const p=spawnSync('latexmk',['-pdfdvi','-interaction=nonstopmode','-halt-on-error','main.tex'],{cwd:root,encoding:'utf8'});
   assert.equal(p.status,0,p.stdout+'\n'+p.stderr);
   assert.ok(fs.statSync(path.join(root,'main.pdf')).size>1000);
  };
  compile();
  register(root,dossier());compile();
  let bbl=fs.readFileSync(path.join(root,'main.bbl'),'utf8');assert.match(bbl,/\\bibitem\{ZTest\}/);
  register(root,dossier(2));compile();
  bbl=fs.readFileSync(path.join(root,'main.bbl'),'utf8');
  assert.ok(bbl.indexOf('\\bibitem{ZTest}')<bbl.indexOf('\\bibitem{ATest2}'));
  assert.equal(handoff(root,'P001').paper_id,'P001');
 }finally{fs.rmSync(root,{recursive:true});}
});

import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ROOT,validate} from './library.mjs';
console.log(validate(ROOT));
const result=spawnSync('latexmk',['-pdfdvi','-interaction=nonstopmode','-halt-on-error','main.tex'],{cwd:ROOT,stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
const log=fs.readFileSync(ROOT+'/main.log','utf8');
if(/Citation .* undefined|There were undefined references/.test(log))throw new Error('Undefined citations');
const extracted=spawnSync('pdftotext',['-layout',ROOT+'/main.pdf','-'],{encoding:'utf8'});
if(!extracted.error){
 if(extracted.status!==0)throw new Error('PDF text extraction failed');
 const pages=extracted.stdout.split('\f').filter(p=>p.trim());
 const referencePage=pages.findIndex(p=>p.trimStart().startsWith('References'));
 if(referencePage<0)throw new Error('References must start on a new page');
 if(pages.slice(referencePage).some(p=>/P\d{3,}\s+---/.test(p)))throw new Error('Paper cards appear after References');
}
fs.copyFileSync(ROOT+'/main.pdf',ROOT+'/paper-reading-notes.pdf');

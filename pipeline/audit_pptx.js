#!/usr/bin/env node
// audit_pptx.js — list every slide in a .pptx in presentation order with its title,
// section-divider label, and speaker-note length, so we can verify extraction coverage.
// Usage: node audit_pptx.js file.pptx
const { execSync } = require('child_process');
const pptx = process.argv[2];
const U = p => { try { return execSync(`unzip -p ${JSON.stringify(pptx)} ${JSON.stringify(p)}`, {maxBuffer:64*1024*1024}).toString('utf8'); } catch { return ''; } };
const dec = t => t.replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

const pres = U('ppt/presentation.xml');
const rids = [...pres.matchAll(/<p:sldId[^>]*r:id="([^"]+)"/g)].map(m=>m[1]);
const rels = U('ppt/_rels/presentation.xml.rels');
const map = {}; for (const m of rels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) map[m[1]]=m[2];

// pull text from shapes matching a predicate over the shape xml
function shapeText(xml, pred) {
  const out=[];
  for (const sh of xml.split(/<p:sp>/).slice(1)) {
    const body = sh.split('</p:sp>')[0];
    if (!pred(body)) continue;
    const runs=[...body.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>dec(m[1]));
    if (runs.length) out.push(runs.join(''));
  }
  return out;
}
function allText(xml){ return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>dec(m[1])).join(' ').replace(/\s+/g,' ').trim(); }

let total=0, withNotes=0;
console.log(`\n=== ${pptx.split('/').pop()} ===`);
rids.forEach((rid,i)=>{
  const tgt=(map[rid]||'').replace(/^\.\.\//,'');
  if(!/slides\/slide\d+\.xml$/.test(tgt)) return;
  total++;
  const name=tgt.split('/').pop();
  const sx=U(`ppt/slides/${name}`);
  // title = title/ctrTitle placeholder text; fallback first text run
  let title=shapeText(sx, b=>/type="(ctrTitle|title)"/.test(b)).join(' · ').trim();
  if(!title){ const t=allText(sx); title='(no title) '+t.slice(0,50); }
  // note text
  const srel=U(`ppt/slides/_rels/${name}.rels`);
  const nrel=[...srel.matchAll(/Target="([^"]*notesSlide[^"]*)"/g)].map(m=>m[1])[0];
  let noteLen=0, noteHead='';
  if(nrel){
    const nx=U(`ppt/notesSlides/${nrel.split('/').pop()}`);
    const note=shapeText(nx, b=>!/type="sldNum"/.test(b)).join(' ').replace(/\s+/g,' ').trim();
    noteLen=note.length; if(noteLen) withNotes++;
    noteHead=note.slice(0,55);
  }
  console.log(`  S${String(total).padStart(2)} | note:${String(noteLen).padStart(4)}c | ${title.slice(0,46).padEnd(46)} | ${noteHead}`);
});
console.log(`  --> ${total} slides total, ${withNotes} with speaker-notes`);

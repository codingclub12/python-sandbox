#!/usr/bin/env node
// extract_pptx_notes.js — pull per-slide speaker notes out of a .pptx and emit a
// deck JSON ({meta, slides:[{script}]}) compatible with clean_script.js.
// Slides are emitted in presentation order; the slide-number placeholder is skipped.
// Usage: node extract_pptx_notes.js "Slides - Day 1.pptx" --lesson=1.1-day1 --title="..." [--out=deck.json]

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const pptx = args.find(a => !a.startsWith('--'));
const lessonId = (args.find(a => a.startsWith('--lesson=')) || '').split('=')[1] || 'unknown';
const title = (args.find(a => a.startsWith('--title=')) || '').split('=').slice(1).join('=') || '';
const outArg = (args.find(a => a.startsWith('--out=')) || '').split('=')[1];
if (!pptx) { console.error('usage: node extract_pptx_notes.js <file.pptx> --lesson=ID [--title=..] [--out=..]'); process.exit(1); }

const unzip = (path) => execSync(`unzip -p ${JSON.stringify(pptx)} ${JSON.stringify(path)}`, { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
const tryUnzip = (path) => { try { return unzip(path); } catch { return ''; } };
const decode = (t) => t.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// 1) presentation order: rIds in <p:sldId r:id="rIdN"/>
const pres = unzip('ppt/presentation.xml');
const rids = [...pres.matchAll(/<p:sldId[^>]*r:id="([^"]+)"/g)].map(m => m[1]);

// 2) map rId -> slide target
const presRels = unzip('ppt/_rels/presentation.xml.rels');
const ridTarget = {};
for (const m of presRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) ridTarget[m[1]] = m[2];

// extract visible note text from a notesSlide xml, skipping the sldNum placeholder shape
function notesText(xml) {
  if (!xml) return '';
  const shapes = xml.split(/<p:sp>/).slice(1);
  let parts = [];
  for (const sh of shapes) {
    if (/type="sldNum"/.test(sh)) continue;           // skip slide-number placeholder
    const body = sh.split('</p:sp>')[0];
    // join runs paragraph by paragraph
    for (const para of body.split(/<a:p>/).slice(1)) {
      const runs = [...para.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decode(m[1]));
      if (runs.length) parts.push(runs.join(''));
    }
  }
  return parts.join(' ').replace(/\s{2,}/g, ' ').trim();
}

const slides = [];
rids.forEach((rid, idx) => {
  const slideTarget = (ridTarget[rid] || '').replace(/^\.\.\//, '');   // slides/slideN.xml
  if (!/slides\/slide\d+\.xml$/.test(slideTarget)) return;             // skip non-slide parts
  const name = slideTarget.split('/').pop();                           // slideN.xml
  const rels = tryUnzip(`ppt/slides/_rels/${name}.rels`);
  const noteRel = [...rels.matchAll(/Target="([^"]*notesSlide[^"]*)"/g)].map(m => m[1])[0];
  let script = '';
  if (noteRel) script = notesText(tryUnzip(`ppt/notesSlides/${noteRel.split('/').pop()}`));
  slides.push({ script });
});

const deck = { meta: { lessonId, title }, slides };
const outPath = outArg || `deck-${lessonId}.json`;
fs.writeFileSync(outPath, JSON.stringify(deck, null, 2));
const withNotes = slides.filter(s => s.script).length;
console.log(`wrote ${outPath}: ${slides.length} slides, ${withNotes} with notes`);

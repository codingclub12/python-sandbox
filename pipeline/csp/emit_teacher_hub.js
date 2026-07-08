/*
 * emit_teacher_hub.js — the gated "Teacher Resources" hub page for AP CSP.
 * Teachers log in, land here, and download every premium file (decks, guided
 * notes, keys, quizzes, guides) without leaving the site.
 *
 *   node emit_teacher_hub.js [--template=<locked-page-template-suffix>]
 *
 * What it does:
 *  1. Scans out/ for rendered CSP files and copies them into
 *     web_out/site_files/ under canonical, upload-safe names.
 *  2. Generates web_out/ap-csp-teacher-resources.html — one hub page,
 *     organized Big Idea -> Topic -> Day, student-safe files separated from
 *     teacher-only files (keys/guides/teacher decks clearly marked).
 *  3. Appends a gated row (Published=false + Template Suffix) to
 *     web_out/pages.csv for Matrixify MERGE import.
 *
 * Publishing workflow (store side):
 *  - Bulk-upload everything in web_out/site_files/ to Shopify Admin ->
 *    Content -> Files. DO NOT rename: links are /cdn/shop/files/<name>.
 *  - Import pages.csv via Matrixify, apply the access gate, then publish.
 *
 * Re-run after each new topic is authored — the page always lists the
 * current catalog. Idempotent.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUTD = path.join(DIR, 'out');
const WEB = path.join(DIR, 'web_out');
const FILES = path.join(WEB, 'site_files');

const LIVE = JSON.parse(fs.readFileSync(path.join(DIR,'live_handles.json'),'utf8'));
const argv = process.argv.slice(2);
const tmplArg = argv.find(a => a.startsWith('--template='));
const templateSuffix = tmplArg ? tmplArg.split('=')[1] : '';
// --salt=<token>: Shopify CDN files are PUBLIC BY URL even when the page is
// gated. A salt in every filename makes URLs unguessable (security through
// unlinkability). Keep the same salt across re-runs so links stay stable.
const saltArg = argv.find(a => a.startsWith('--salt='));
const salt = saltArg ? saltArg.split('=')[1].replace(/[^A-Za-z0-9]/g,'') : '';
const salted = (name) => salt ? name.replace(/(\.[a-z]+)$/, '_' + salt + '$1') : name;

// ---------- ASCII-only escape (same contract as emit_web.js) ----------
const NAMED = {0x26:'&amp;',0x3c:'&lt;',0x3e:'&gt;',0x22:'&quot;',0x2018:'&lsquo;',0x2019:'&rsquo;',
  0x201c:'&ldquo;',0x201d:'&rdquo;',0x2013:'&ndash;',0x2014:'&mdash;',0x00b7:'&middot;'};
function esc(s){ let o=''; for (const ch of String(s??'')){ const c=ch.codePointAt(0);
  o += NAMED[c]!==undefined?NAMED[c]:(c<128?ch:'&#'+c+';'); } return o; }

// ---------- inventory: dev name -> canonical site file name + labels ----------
const TOPIC_TITLES = { '1.1':'Collaboration', '1.2':'Program Function and Purpose',
  '1.3':'Program Design and Development', '1.4':'Identifying and Correcting Errors',
  '2.1':'Binary Numbers', '2.2':'Data Compression',
  '2.3':'Extracting Information from Data', '2.4':'Using Programs with Data',
  '4.1':'The Internet', '4.2':'Fault Tolerance',
  '4.3':'Parallel and Distributed Computing',
  '5.1':'Beneficial and Harmful Effects', '5.2':'Digital Divide',
  '5.3':'Computing Bias', '5.4':'Crowdsourcing',
  '5.5':'Legal and Ethical Concerns', '5.6':'Safe Computing','0.0':'Course-Wide Resources',
  '1.99':'Big Idea 1 Exam','2.99':'Big Idea 2 Exam','4.99':'Big Idea 4 Exam','5.99':'Big Idea 5 Exam' }; // extend as topics are authored
const BI_NAMES = {0:'Course Resources (Start Here, Pacing, Create Task)',1:'Big Idea 1: Creative Development',2:'Big Idea 2: Data',
  3:'Big Idea 3: Algorithms and Programming',4:'Big Idea 4: Computer Systems and Networks',
  5:'Big Idea 5: Impact of Computing'};

function canonical(f){
  // CSP_2.1_Day1_Deck_teacher_deepdive.pptx / CSP_2.1_Day1_Notes_key_cb.docx /
  // CSP_2.1_Quiz_student.docx / CSP_2.1_TeacherGuide.docx
  let m;
  if ((m = f.match(/^CSP_(\d+\.\d+)_Day(\d+)_Deck_(teacher|student)_(cb|deepdive)\.pptx$/)))
    return { topic:m[1], day:+m[2], kind:'deck', aud:m[3], track:m[4],
      name:`AP-CSP_${m[1].replace('.','-')}_Day${m[2]}_Deck_${m[3]==='teacher'?'TEACHER':'Student'}_${m[4]==='cb'?'CB':'DeepDive'}.pptx`,
      label:`Day ${m[2]} Deck — ${m[3]==='teacher'?'Teacher':'Student'} (${m[4]==='cb'?'CB Standard':'Deep Dive'})` };
  if ((m = f.match(/^CSP_(\d+\.\d+)_Day(\d+)_Notes_(student|key)_(cb|deepdive)\.docx$/)))
    return { topic:m[1], day:+m[2], kind:'notes', aud:m[3]==='key'?'teacher':'student', track:m[4],
      name:`AP-CSP_${m[1].replace('.','-')}_Day${m[2]}_GuidedNotes_${m[3]==='key'?'KEY':'Student'}_${m[4]==='cb'?'CB':'DeepDive'}.docx`,
      label:`Day ${m[2]} Guided Notes — ${m[3]==='key'?'KEY':'Student'} (${m[4]==='cb'?'CB Standard':'Deep Dive'})` };
  if ((m = f.match(/^CSP_(\d+\.\d+)_Quiz_(student|key)\.docx$/)))
    return { topic:m[1], day:0, kind:'quiz', aud:m[2]==='key'?'teacher':'student', track:'',
      name:`AP-CSP_${m[1].replace('.','-')}_Quiz_${m[2]==='key'?'KEY':'Student'}.docx`,
      label:`Topic Quiz — ${m[2]==='key'?'KEY':'Student'}` };
  if ((m = f.match(/^CSP_(\d+\.\d+)_TeacherGuide\.docx$/)))
    return { topic:m[1], day:0, kind:'guide', aud:'teacher', track:'',
      name:`AP-CSP_${m[1].replace('.','-')}_TeacherGuide.docx`, label:'Teacher Guide' };
  if ((m = f.match(/^CSP_(\d+\.\d+)_Exercise(\d)_(student|key)\.docx$/)))
    return { topic:m[1], day:0, kind:'exercise', aud:m[3]==='key'?'teacher':'student', track:'',
      name:`AP-CSP_${m[1].replace('.','-')}_Exercise${m[2]}_${m[3]==='key'?'KEY':'Student'}.docx`,
      label:`Exercise ${m[2]} — ${m[3]==='key'?'KEY':'Student'}` };
  if ((m = f.match(/^CSP_(\d+\.\d+)_Discussion\.docx$/)))
    return { topic:m[1], day:0, kind:'discussion', aud:'teacher', track:'',
      name:`AP-CSP_${m[1].replace('.','-')}_Discussion.docx`, label:'Discussion Guide' };
  if ((m = f.match(/^CSP_(\d+\.\d+)_LessonMap\.docx$/)))
    return { topic:m[1], day:0, kind:'map', aud:'teacher', track:'',
      name:`AP-CSP_${m[1].replace('.','-')}_LessonMap.docx`, label:'Lesson Map' };
  if ((m = f.match(/^CSP_Resource_(.+)\.docx$/)))
    return { topic:'0.0', day:0, kind:'resource', aud:'teacher', track:'',
      name:`AP-CSP_${m[1]}.docx`, label:m[1].replace(/^\d+_/,'').replace(/_/g,' ') };
  if ((m = f.match(/^CSP_Exam_BI(\d)_(student|KEY)\.docx$/)))
    return { topic:m[1]+'.99', day:0, kind:'exam', aud:m[2]==='KEY'?'teacher':'student', track:'',
      name:`AP-CSP_BigIdea${m[1]}_Exam_${m[2]==='KEY'?'KEY':'Student'}.docx`,
      label:`Big Idea ${m[1]} Exam — ${m[2]==='KEY'?'KEY':'Student'}` };
  return null;
}

fs.mkdirSync(FILES, { recursive: true });
const items = [];
for (const f of fs.readdirSync(OUTD)){
  const c = canonical(f);
  if (!c) continue;
  c.name = salted(c.name);
  fs.copyFileSync(path.join(OUTD, f), path.join(FILES, c.name));
  items.push(c);
}
if (!items.length){ console.error('no CSP files found in out/'); process.exit(1); }

// ---------- page ----------
const B = { deep:'#065F46', mid:'#10B981', tint:'#ECFDF5', ink:'#022C22' };
const id = 'apcsp-hub';
const url = (name) => '/cdn/shop/files/' + encodeURIComponent(name);
function style(){ const s='#'+id; return `<style>
.page-title,.article__title,.page__title,.template-page main h1:first-of-type{display:none!important;visibility:hidden!important}
${s}{all:initial!important;display:block!important;box-sizing:border-box!important;max-width:920px!important;margin:0 auto!important;padding:8px 16px 56px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;line-height:1.55!important;font-size:16px!important;background:#fff!important}
${s} *,${s} *::before,${s} *::after{box-sizing:border-box!important}
${s} .hero{background:linear-gradient(135deg,${B.deep},${B.mid})!important;border-radius:16px!important;padding:26px 24px!important;margin:8px 0 22px!important}
${s} .hero .eyebrow{font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:#D1FAE5!important;-webkit-text-fill-color:#D1FAE5!important;margin:0 0 8px!important}
${s} h1{font-size:28px!important;margin:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:800!important}
${s} .hero .sub{font-size:15px!important;margin:10px 0 0!important;color:#ECFDF5!important;-webkit-text-fill-color:#ECFDF5!important}
${s} h2{font-size:22px!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;margin:30px 0 8px!important;font-weight:800!important;border-bottom:3px solid ${B.mid}!important;padding-bottom:6px!important}
${s} .topic{border:1px solid #BBE5D2!important;border-radius:14px!important;padding:16px 18px!important;margin:14px 0!important;background:#fff!important}
${s} h3{font-size:18px!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;margin:0 0 4px!important;font-weight:800!important}
${s} .label{font-size:12px!important;font-weight:800!important;letter-spacing:.05em!important;text-transform:uppercase!important;margin:12px 0 6px!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important}
${s} .label.tonly{color:#92400E!important;-webkit-text-fill-color:#92400E!important}
${s} .files{display:flex!important;flex-wrap:wrap!important;gap:8px!important}
${s} a.f,${s} a.f:link,${s} a.f:visited{display:inline-block!important;background:${B.tint}!important;border:1px solid #BBE5D2!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;text-decoration:none!important;font-weight:600!important;border-radius:9px!important;padding:8px 12px!important;font-size:14px!important}
${s} a.f.key,${s} a.f.key:link,${s} a.f.key:visited{background:#FEF3C7!important;border-color:#F59E0B!important;color:#92400E!important;-webkit-text-fill-color:#92400E!important}
${s} .note{border-left:5px solid #F59E0B!important;background:#FFFBEB!important;border-radius:0 12px 12px 0!important;padding:10px 14px!important;margin:14px 0!important;font-size:14px!important}
${s} .muted{color:#5B7268!important;-webkit-text-fill-color:#5B7268!important;font-size:13px!important}
</style>`; }

const byTopic = {};
items.forEach(it => { (byTopic[it.topic] = byTopic[it.topic] || []).push(it); });
const topics = Object.keys(byTopic).sort((a,b)=>parseFloat(a)-parseFloat(b));

let body = style() + `\n<div id="${id}">`;
body += `<div class="hero"><p class="eyebrow">AP Computer Science Principles &middot; Premium Member Content</p>` +
  `<h1>Teacher Resources</h1>` +
  `<p class="sub">Every file for every topic, always current &mdash; slide decks, guided notes, answer keys, quizzes, and teacher guides. Download what you need for tomorrow and never leave the site.</p></div>`;
body += `<div class="note"><strong>Handle with care:</strong> files marked KEY are answer keys &mdash; for your eyes only. Student-safe files are grouped separately so you can post or print them directly.</div>`;

let lastBI = null;
for (const t of topics){
  const bi = parseInt(t, 10);
  if (bi !== lastBI){ body += `<h2>${esc(BI_NAMES[bi] || ('Big Idea ' + bi))}</h2>`; lastBI = bi; }
  const list = byTopic[t].sort((a,b)=> a.day-b.day || a.label.localeCompare(b.label));
  const student = list.filter(x=>x.aud==='student');
  const teacher = list.filter(x=>x.aud==='teacher');
  const live = LIVE[t];
  body += `<div class="topic"><h3>Topic ${esc(t)} &mdash; ${esc(TOPIC_TITLES[t] || '')}</h3>`;
  if (live) body += `<p class="muted"><a href="/pages/${live}">Lesson page</a> &middot; <a href="/pages/${live}-notes">Guided notes (student digital copy)</a></p>`;
  body += `<p class="label">Student-safe (print / post / hand out)</p><div class="files">` +
    student.map(x=>`<a class="f" href="${url(x.name)}">${esc(x.label)}</a>`).join('') + `</div>`;
  body += `<p class="label tonly">Teacher only (keys, guides, teacher decks)</p><div class="files">` +
    teacher.map(x=>`<a class="f${/KEY/.test(x.name)?' key':''}" href="${url(x.name)}">${esc(x.label)}</a>`).join('') + `</div>`;
  body += `<p class="muted">Tip: CB Standard = required-content track. Deep Dive = same lesson with enrichment sections for longer periods or honors sections.</p></div>`;
}
body += `\n</div>`;

fs.mkdirSync(WEB, { recursive: true });
const handle = 'ap-csp-teacher-resources';
fs.writeFileSync(path.join(WEB, handle + '.html'), body, 'utf8');

// pages.csv row (gated: Published=false + Template Suffix)
const cell = v=>'"'+String(v).replace(/"/g,'""')+'"';
const HEADERS = ['Handle','Title','Body HTML','Template Suffix','Published','Command'];
const csvPath = path.join(WEB,'pages.csv');
let csv;
if (fs.existsSync(csvPath)){
  csv = fs.readFileSync(csvPath,'utf8');
  const re = new RegExp('^"'+handle+'".*\r?\n','m');
  if (re.test(csv)) csv = csv.replace(re,'');
} else {
  csv = '﻿' + HEADERS.map(cell).join(',') + '\r\n';
}
csv += [handle,'AP CSP Teacher Resources (Premium)',body,templateSuffix,'false','MERGE'].map(cell).join(',') + '\r\n';
fs.writeFileSync(csvPath, csv, 'utf8');

const bad = body.match(/[^\x00-\x7F]/);
console.log(`emitted ${handle}.html + pages.csv row`);
console.log(`  topics: ${topics.length} | files staged in site_files/: ${items.length}`);
console.log(`  ascii-clean: ${!bad}`);
console.log(`  gating: Published=false, Template Suffix=${templateSuffix ? JSON.stringify(templateSuffix) : '(none set)'}`);
console.log(`  filename salt: ${salt ? JSON.stringify(salt) : '(NONE -- file URLs are guessable; pass --salt=<random token> before uploading)'}`);
console.log('  Upload site_files/* to Shopify Content->Files WITHOUT renaming; links are /cdn/shop/files/<name>.');
if (bad) process.exit(1);

/*
 * emit_web.js (CSP) — publishes the STUDENT guided notes to the website.
 * One page per topic (all days combined), generated from the same lesson
 * JSON as the decks/docx, with the same student semantics: definitions and
 * key ideas are writing lines, capture cloze gaps are blanks, worked-table
 * blank cells stay blank, misconceptions ask "explain why it's wrong,"
 * Common AP Traps are in-your-own-words, EK codes stripped. Green theme.
 *
 *   node emit_web.js 2.1            -> web_out/ap-csp-topic-2-1-guided-notes.html + pages.csv
 *
 * Output is Shopify-ready (CSS armor, ASCII-only, Matrixify MERGE csv).
 * The printable docx stays the classroom default; this page is the always-
 * findable digital copy (absent students, lost packets, self-study).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { stripEK, upsertPagesCsvRow } = require('./helpers');

const DIR = __dirname;
const OUT = path.join(DIR, 'web_out');
// Live lesson-page handles from the store's Matrixify export (2026-07-08).
// Guided-notes pages join the same family as "<lesson-handle>-notes".
const LIVE = JSON.parse(fs.readFileSync(path.join(DIR,'live_handles.json'),'utf8'));

// ---------- encoding: no raw byte above ASCII 127 reaches Shopify ----------
const NAMED = {
  0x26:'&amp;',0x3c:'&lt;',0x3e:'&gt;',0x22:'&quot;',
  0x2018:'&lsquo;',0x2019:'&rsquo;',0x201c:'&ldquo;',0x201d:'&rdquo;',
  0x2013:'&ndash;',0x2014:'&mdash;',0x2026:'&hellip;',0x2022:'&bull;',
  0x2192:'&rarr;',0x2190:'&larr;',0x00b7:'&middot;',0x00a0:'&nbsp;',
  0x2610:'&#9744;',0x21d2:'&rArr;',0x2194:'&harr;',0x00d7:'&times;',
};
function esc(s){
  if (s === undefined || s === null) return '';
  let out = '';
  for (const ch of String(s)){
    const c = ch.codePointAt(0);
    if (NAMED[c] !== undefined) out += NAMED[c];
    else if (c < 128) out += ch;
    else out += '&#' + c + ';';
  }
  return out;
}
const strip = (s) => (typeof s === 'string' && /\bEK\b/.test(s)) ? stripEK(s) : s;

// ---------- green CSS armor (matches the CSP product theme) ----------
const B = { deep:'#065F46', mid:'#10B981', tint:'#ECFDF5', ink:'#022C22', line:'#A7C4B8' };
function pageStyle(id){
  const s = '#'+id;
  return `<style>
.page-title,.article__title,.page__title,.template-page main h1:first-of-type{display:none!important;visibility:hidden!important}
${s}{all:initial!important;display:block!important;box-sizing:border-box!important;max-width:860px!important;margin:0 auto!important;padding:8px 16px 56px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;line-height:1.6!important;font-size:17px!important;background:#fff!important}
${s} *,${s} *::before,${s} *::after{box-sizing:border-box!important}
${s} .hero{background:linear-gradient(135deg,${B.deep},${B.mid})!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-radius:16px!important;padding:26px 24px!important;margin:8px 0 24px!important}
${s} .hero .eyebrow{font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:#D1FAE5!important;-webkit-text-fill-color:#D1FAE5!important;margin:0 0 8px!important}
${s} h1{font-size:28px!important;line-height:1.2!important;margin:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:800!important}
${s} .hero .sub{font-size:16px!important;margin:10px 0 0!important;color:#ECFDF5!important;-webkit-text-fill-color:#ECFDF5!important}
${s} h2{font-size:23px!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;margin:34px 0 8px!important;font-weight:800!important;border-bottom:3px solid ${B.mid}!important;padding-bottom:6px!important}
${s} h3{font-size:18px!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;margin:22px 0 6px!important;font-weight:700!important}
${s} p{margin:8px 0!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important}
${s} ul,${s} ol{margin:8px 0!important;padding-left:24px!important}
${s} li{margin:6px 0!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important}
${s} .card{border:1px solid #BBE5D2!important;border-radius:14px!important;padding:16px 18px!important;margin:14px 0!important;background:${B.tint}!important}
${s} .warn{border-left:5px solid #DC2626!important;background:#FEF2F2!important;border-radius:0 12px 12px 0!important;padding:12px 16px!important;margin:16px 0!important}
${s} .label{font-size:12px!important;font-weight:800!important;letter-spacing:.05em!important;text-transform:uppercase!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;margin:0 0 4px!important}
${s} .dd{border:1px solid #BFDBFE!important;background:#EFF6FF!important;border-radius:14px!important;padding:16px 18px!important;margin:14px 0!important}
${s} .dd .label{color:#1D4ED8!important;-webkit-text-fill-color:#1D4ED8!important}
${s} table{border-collapse:collapse!important;width:100%!important;margin:12px 0!important;font-size:15px!important}
${s} th{background:${B.deep}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border:1px solid ${B.deep}!important;padding:8px 10px!important;text-align:left!important}
${s} td{border:1px solid #BBE5D2!important;padding:8px 10px!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;vertical-align:top!important}
${s} .wline{display:block!important;border-bottom:1.5px solid ${B.line}!important;height:30px!important;margin:8px 0!important}
${s} .wcell{display:block!important;border-bottom:1.5px solid ${B.line}!important;height:26px!important}
${s} .gap{display:inline-block!important;min-width:170px!important;border-bottom:1.5px solid ${B.line}!important;height:1.1em!important;vertical-align:baseline!important}
${s} .chk{list-style:none!important;padding-left:4px!important}
${s} .chk li{padding-left:0!important}
${s} pre.code{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace!important;font-size:14px!important;background:#F0F7F4!important;border:1px solid #BBE5D2!important;border-radius:10px!important;padding:12px 14px!important;margin:6px 0 12px!important;overflow-x:auto!important;white-space:pre!important;color:#022C22!important;-webkit-text-fill-color:#022C22!important;line-height:1.45!important}
${s} pre.code.out{background:#022C22!important;color:#D1FAE5!important;-webkit-text-fill-color:#D1FAE5!important;border-color:#022C22!important}
${s} .muted{color:#5B7268!important;-webkit-text-fill-color:#5B7268!important;font-size:14px!important}
${s} a,${s} a:link,${s} a:visited{color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;text-decoration:underline!important}
${s} .btn,${s} .btn:link,${s} .btn:visited{display:inline-block!important;background:${B.mid}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;text-decoration:none!important;font-weight:700!important;border-radius:10px!important;padding:10px 16px!important;border:0!important;cursor:pointer!important;font-size:15px!important;margin:4px 8px 4px 0!important}
@media print{${s} .noprint{display:none!important} ${s} .hero{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
</style>`;
}

// ---------- writing surfaces ----------
const lines = (n) => Array.from({length:n},()=> '<span class="wline"></span>').join('');
function cloze(cap){ // capture [{q,a}] -> student blanks
  return '<ul>' + cap.map(c => '<li>' + esc(strip(c.q)).replace(/______/g,'<span class="gap"></span>') + '</li>').join('') + '</ul>';
}

// ---------- per-slide student-notes renderers ----------
function renderSlide(s){
  switch (s.type){
    case 'title': return ''; // handled per-day header
    case 'objectives':
      return `<div class="card"><p class="label">Today&rsquo;s objectives</p><ul>` +
        s.items.map(it=>`<li>${esc(strip(it.text))}</li>`).join('') + `</ul></div>`;
    case 'bell_ringer':
      return `<div class="card"><p class="label">Bell ringer</p><p>${esc(strip(s.prompt))}</p>` +
        (s.subprompt?`<p class="muted">${esc(strip(s.subprompt))}</p>`:'') + lines(4) + `</div>`;
    case 'section_divider':
      return `<h2>${esc(s.number)}. ${esc(strip(s.label))}</h2>`;
    case 'vocab': {
      const rows = s.terms.map(t=>`<tr><td style="width:30%!important"><strong>${esc(t.term)}</strong></td><td><span class="wcell"></span><span class="wcell"></span></td></tr>`).join('');
      return `<h3>${esc(strip(s.heading||'Key vocabulary'))}</h3><table><tr><th>Term</th><th>Definition (write it)</th></tr>${rows}</table>`;
    }
    case 'concept': {
      let h = `<h3>${esc(strip(s.heading||''))}</h3>`;
      if (s.capture) h += cloze(s.capture);
      else h += '<ul>' + (s.bullets||[]).map(b=>`<li>${esc(strip(b))}</li>`).join('') + '</ul>';
      return h;
    }
    case 'two_column': {
      let h = `<h3>${esc(strip(s.heading||''))}</h3>`;
      if (s.capture){
        h += [s.left,s.right].filter(Boolean).map(c=>`<p><strong>${esc(c.title)}</strong></p>`).join('');
        h += cloze(s.capture);
      } else {
        [s.left,s.right].filter(Boolean).forEach(c=>{
          h += `<p><strong>${esc(c.title)}</strong> &mdash; key idea:</p>${lines(1)}`;
        });
      }
      if (s.footer) h += `<div class="card"><p>${esc(strip(s.footer))}</p></div>`;
      return h;
    }
    case 'worked_table': {
      const mark = new Set((s.blanks||[]).map(([r,c])=>r+':'+c));
      const head = '<tr>' + s.columns.map(c=>`<th>${esc(strip(c))}</th>`).join('') + '</tr>';
      const body = s.rows.map((r,ri)=>'<tr>'+r.map((cell,ci)=>
        mark.has(ri+':'+ci) ? '<td><span class="wcell"></span></td>' : `<td>${esc(strip(String(cell)))}</td>`
      ).join('')+'</tr>').join('');
      return `<h3>${esc(strip(s.heading||''))}</h3>` +
        (s.context?`<p class="muted">${esc(strip(s.context))}</p>`:'') +
        ((s.blanks&&s.blanks.length)?`<p class="muted">Complete the empty cells.</p>`:'') +
        `<table>${head}${body}</table>`;
    }
    case 'misconception':
      return `<div class="warn"><p class="label">Watch out &mdash; ${esc(strip(s.heading||'Common misconception'))}</p>` +
        `<p><strong>Myth:</strong> ${esc(strip(s.misconception))}</p>` +
        `<p><strong>Explain why this is wrong:</strong></p>` + lines(2) + `</div>`;
    case 'stop_and_think': {
      let h = `<div class="card"><p class="label">Stop and think</p><ol>`;
      (s.prompts||[]).forEach(pr=>{ h += `<li>${esc(strip(pr))}${lines(2)}</li>`; });
      h += '</ol>' + (s.directions?`<p class="muted">${esc(strip(s.directions))}</p>`:'') + '</div>';
      return h;
    }
    case 'ap_strategy': {
      let h = `<h3>${esc(strip(s.heading||'Common AP Traps'))}</h3>`;
      if (s.subheading) h += `<p class="muted">${esc(strip(s.subheading))}</p>`;
      (s.strategies||[]).forEach(st=>{ h += `<p><strong>${esc(st.name)}</strong> &mdash; in your own words:</p>${lines(1)}`; });
      return h;
    }
    case 'code_block': {
      const pre = (label, code, cls) => `<p class="label">${esc(label)}</p><pre class="code ${cls}">${esc(strip(code||''))}</pre>`;
      let h = `<h3>${esc(strip(s.heading||'Code'))}</h3>`;
      if (s.caption) h += `<p class="muted">${esc(strip(s.caption))}</p>`;
      h += pre('AP Pseudocode (what the exam tests)', s.pseudocode, 'ps');
      h += pre('Python (the runnable version)', s.python, 'py');
      if (s.output) h += `<p class="label">Output</p><pre class="code out">${esc(strip(s.output))}</pre>`;
      h += `<p class="muted">Run and edit this yourself in the coding exercises for this topic.</p>`;
      return h;
    }
    case 'final_summary': {
      let h = `<h3>${esc(strip(s.heading||'In one page'))}</h3><ul>` +
        (s.points||[]).map(pt=>`<li>${esc(strip(pt))}</li>`).join('') + '</ul>';
      if (s.ican && s.ican.length){
        h += `<div class="card"><p class="label">Exit check &mdash; I can&hellip;</p><ul class="chk">` +
          s.ican.map(it=>`<li>&#9744;&nbsp; ${esc(strip(it))}</li>`).join('') + `</ul></div>`;
      }
      return h;
    }
    case 'day_close': {
      let h = `<div class="card"><p class="label">Today in one box</p><ul>` +
        (s.todayPoints||[]).map(pt=>`<li>${esc(strip(pt))}</li>`).join('') + '</ul>';
      if (s.teaser) h += `<p><strong>Before next class:</strong> ${esc(strip(s.teaser))}</p>`;
      return h + '</div>';
    }
    case 'guided_notes_preview':
      return ''; // the page IS the packet
    default:
      return '';
  }
}

function buildTopicNotesPage(dayFiles){
  const datas = dayFiles.map(f=>JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')))
                        .sort((a,b)=>(a.meta.day||1)-(b.meta.day||1));
  const meta = datas[0].meta;
  const id = 'apcsp-notes';
  let body = pageStyle(id) + `\n<div id="${id}">`;
  body += `<div class="hero"><p class="eyebrow">${esc(meta.unit)} &middot; Topic ${esc(meta.lessonId)} &middot; Guided Notes (Student)</p>` +
    `<h1>${esc(meta.lessonTitle)} &mdash; Guided Notes</h1>` +
    `<p class="sub">Fill these in during class or catch up here if you were absent. Print this page or work on paper &mdash; then check yourself with the CFUs on the Topic ${esc(meta.lessonId)} page.</p></div>`;
  body += `<p class="noprint"><a class="btn" href="javascript:window.print()">Print these notes</a>` +
          (liveLesson ? `<a class="btn" href="/pages/${liveLesson}">Topic ${esc(meta.lessonId)} lesson page</a>` : '') +
          `<a class="btn" href="/pages/ap-csp-course">All CSP topics</a></p>`;
  datas.forEach(d=>{
    const t = d.slides.find(s=>s.type==='title') || {};
    if (datas.length > 1) body += `<h2>Day ${d.meta.day}: ${esc(t.title||'')}</h2>`;
    d.slides.forEach(s=>{
      const inner = renderSlide(s);
      if (!inner) return;
      body += (s.track==='enrichment')
        ? `<div class="dd"><p class="label">Deep Dive &middot; Beyond the AP Exam</p>${inner}</div>`
        : inner;
    });
  });
  body += `\n</div>`;
  return { meta, html: body };
}

// ---------- main ----------
const argv = process.argv.slice(2);
const topic = (argv.find(a=>!a.startsWith('--'))||'').trim();
const tmplArg = argv.find(a=>a.startsWith('--template='));
const templateSuffix = tmplArg ? tmplArg.split('=')[1] : '';
if (!topic){ console.error('Usage: node emit_web.js <topicId e.g. 2.1> [--template=<locked-page-template-suffix>]'); process.exit(1); }
const dayFiles = fs.readdirSync(DIR).filter(f=>new RegExp('^lesson-'+topic.replace('.','\\.')+'-day\\d+\\.json$').test(f));
if (!dayFiles.length){ console.error('no day files for topic '+topic); process.exit(1); }
const liveLesson = LIVE[topic];

fs.mkdirSync(OUT, { recursive: true });
const { meta, html } = buildTopicNotesPage(dayFiles);
const handle = liveLesson ? liveLesson + '-notes'
  : 'ap-csp-topic-' + topic.replace('.','-') + '-guided-notes'; // fallback until the topic's live handle is known
fs.writeFileSync(path.join(OUT, handle + '.html'), html, 'utf8');

// Matrixify MERGE csv (UTF-8 BOM, all quoted, never an empty Body HTML)
const cell = v=>'"'+String(v).replace(/"/g,'""')+'"';
const title = `AP CSP Topic ${meta.lessonId} Guided Notes - ${meta.lessonTitle}`;
const csvPath = path.join(OUT,'pages.csv');
// ACCESS CONTROL: these notes are paid product. The row ships Published=false
// and a Template Suffix (gated page template) so a raw Matrixify import is
// never world-readable. Verify the store's access gate before publishing.
const HEADERS = ['Handle','Title','Body HTML','Template Suffix','Published','Command'];
if (!html.trim()) throw new Error('empty body');
upsertPagesCsvRow(csvPath, HEADERS.map(cell), handle,
  [handle,title,html,templateSuffix,'false','MERGE'].map(cell));

// self-check: pure ASCII, no EK codes leaked, no answers from capture
const bad = html.match(/[^\x00-\x7F]/);
const ek = html.match(/\bEK\s+(?:CRD|DAT|AAP|CSN|IOC)-/);
console.log(`emitted ${handle}.html (${Math.round(html.length/1024)}kb) + pages.csv row`);
console.log(`  ascii-clean: ${!bad}  ek-stripped: ${!ek}`);
console.log(`  gating: Published=false, Template Suffix=${templateSuffix ? JSON.stringify(templateSuffix) : '(none set -- pass --template=<suffix> for your locked page template)'}`);
console.log('  IMPORTANT: paid content -- verify the access gate before publishing.');
if (bad || ek) process.exit(1);

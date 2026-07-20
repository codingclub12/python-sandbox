/*
 * emit_web.js — AP Cybersecurity website emitter
 * Sibling to render.js. Reads the same lesson-*.json source (READ-ONLY) and writes
 * Shopify-ready lesson / exercise / quiz / unit-exam pages plus a Matrixify MERGE
 * pages.csv and a redirects.csv. See AP_Cyber_Web_Emitter_Spec.md.
 *
 *   node emit_web.js
 *
 * Output: web_out/ (HTML pages), web_out/pages.csv, web_out/redirects.csv
 * Does NOT modify source JSON or any other emitter; does NOT touch out/.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'web_out');

/* ----------------------------------------------------------------------------
 * Slide-type treatment table (spec section 4). RENDER | TRANSFORM | SUPPRESS.
 * Used by the renderer and by self-validation (every type must be present here).
 * -------------------------------------------------------------------------- */
const TREATMENT = {
  // RENDER
  objectives:'RENDER', section_divider:'RENDER', vocab:'RENDER', concept:'RENDER',
  two_column:'RENDER', misconception:'RENDER', scenario_intro:'RENDER',
  scenario_email:'RENDER', impacts_grid:'RENDER', worked_table:'RENDER',
  case_study:'RENDER', ap_strategy:'RENDER', summary:'RENDER', final_summary:'RENDER',
  real_artifact:'RENDER', red_flag_debrief:'RENDER', scenario_debrief:'RENDER',
  // TRANSFORM
  title:'TRANSFORM', bell_ringer:'TRANSFORM', stop_and_think:'TRANSFORM',
  cfu:'TRANSFORM', your_turn:'TRANSFORM', exit_ticket:'TRANSFORM',
  // SUPPRESS
  guided_notes_preview:'SUPPRESS', work_timer:'SUPPRESS', day_close:'SUPPRESS',
  discussion:'SUPPRESS',
};

/* ----------------------------------------------------------------------------
 * Encoding (spec section 6): HTML-entity-encode all text; no raw byte above
 * ASCII 127 in the output. Faithful (lossless) encoding — em-dashes are kept as
 * &mdash; rather than rephrased, so wording is preserved exactly. (The lossy
 * "remove em-dash" house-style normalization is available behind --strip-emdash.)
 * -------------------------------------------------------------------------- */
const STRIP_EMDASH = process.argv.includes('--strip-emdash');
const NAMED = {
  0x26:'&amp;', 0x3c:'&lt;', 0x3e:'&gt;', 0x22:'&quot;',
  0x2018:'&lsquo;', 0x2019:'&rsquo;', 0x201c:'&ldquo;', 0x201d:'&rdquo;',
  0x2013:'&ndash;', 0x2014:'&mdash;', 0x2026:'&hellip;', 0x2022:'&bull;',
  0x2192:'&rarr;', 0x2190:'&larr;', 0x00b7:'&middot;', 0x00a0:'&nbsp;',
  0x00e9:'&eacute;', 0x00bd:'&frac12;', 0x2122:'&trade;', 0x00ae:'&reg;',
  0x00a9:'&copy;', 0x00d7:'&times;', 0x2009:'&thinsp;', 0x2011:'&#8209;',
};
function esc(s){
  if (s === undefined || s === null) return '';
  s = String(s);
  if (STRIP_EMDASH) s = s.replace(/\s*[–—]\s*/g, ', ');
  let out = '';
  for (const ch of s){
    const c = ch.codePointAt(0);
    if (NAMED[c] !== undefined) out += NAMED[c];
    else if (c < 128) out += ch;
    else out += '&#' + c + ';';
  }
  return out;
}
// Plain-text ASCII fold for page Title cells (not HTML — no entities here).
const ASCII_FOLD = { '‘':"'", '’':"'", '“':'"', '”':'"',
  '–':'-', '—':'-', '…':'...', '•':'-', '→':'->',
  ' ':' ', '·':'-', ' ':' ', '‑':'-' };
function asciiText(s){
  s = String(s).replace(/[‘’“”–—…•→ · ‑]/g, c=>ASCII_FOLD[c]);
  return s.replace(/[^\x00-\x7F]/g,''); // drop any remaining non-ASCII
}
// strip inline "(EK ...)" / "(LO ...)" parentheticals and return {text, tags[]}
function pullTags(s){
  const tags = [];
  const text = String(s).replace(/\((?:EK|LO)\s+[0-9A-Z.–\-,\s]+?\)/g, (m) => {
    m.replace(/(?:EK|LO)\s+\d+\.\d+\.[A-Z](?:\.\d+)?/g, (t) => { tags.push(t); return t; });
    return '';
  }).replace(/\s{2,}/g,' ').replace(/\s+([.,;:])/g,'$1').trim();
  return { text, tags };
}

/* ----------------------------------------------------------------------------
 * Handles (spec section 7). Lesson handle = the ap-cybersecurity-unit-N-* handle
 * the lesson already references in-source when present (keeps existing internal
 * links and live SEO intact), else a deterministic slug of anchor/title.
 * -------------------------------------------------------------------------- */
function slug(s){
  return String(s).toLowerCase()
    .replace(/[‘’“”]/g,'')
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function unitOf(lid){ return lid.split('.')[0]; }
function lessonNum(lid){ return lid.split('.')[1]; }

// Known live handles (only what we can verify; from spec section 7).
const LIVE_HANDLES = {
  '1.1': 'ap-cybersecurity-unit-1-social-engineering',
};

function lessonHandle(meta, referenced){
  const u = unitOf(meta.lessonId);
  if (referenced) return referenced;                       // curated, already-linked
  // Fallback: slug of the lessonTitle (unique course-wide; anchors repeat across
  // lessons, e.g. 5.1/5.2 both "Protecting Sensitive Data"). Title-slugs also
  // reproduce the curated handles for the lessons that lack a self-reference.
  return `ap-cybersecurity-unit-${u}-${slug(meta.lessonTitle)}`;
}
const exHandle = (lid, n) => `ap-cyber-unit-${unitOf(lid)}-lesson-${lessonNum(lid)}-exercise-${n}`;
const quizHandle = (lid) => `ap-cyber-unit-${unitOf(lid)}-lesson-${lessonNum(lid)}-quiz`;
const examHandle = (u) => `ap-cyber-unit-${u}-exam`;

/* ----------------------------------------------------------------------------
 * CSS armor (spec section 5). Scoped under the page id, all:initial on wrapper,
 * !important everywhere, -webkit-text-fill-color beside color, :link/:visited
 * fixes, theme page-title hidden, brand tokens shared with the hub.
 * -------------------------------------------------------------------------- */
const BRAND = { purple:'#6B21A8', mid:'#7C3AED', light:'#A855F7', dark:'#1E1B4B' };
function pageStyle(id){
  const s = '#'+id;
  return `<style>
/* Hide the theme page title - the hero supplies the H1 */
.page-title,.article__title,.page__title,.template-page main h1:first-of-type{display:none!important;visibility:hidden!important}
${s}{all:initial!important;display:block!important;box-sizing:border-box!important;max-width:880px!important;margin:0 auto!important;padding:8px 16px 56px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;color:${BRAND.dark}!important;-webkit-text-fill-color:${BRAND.dark}!important;line-height:1.6!important;font-size:17px!important;background:#fff!important}
${s} *,${s} *::before,${s} *::after{box-sizing:border-box!important}
${s} .hero{background:linear-gradient(135deg,${BRAND.purple},${BRAND.mid})!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-radius:16px!important;padding:28px 26px!important;margin:8px 0 28px!important}
${s} .hero .eyebrow{font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;opacity:.92!important;color:#fff!important;-webkit-text-fill-color:#fff!important;margin:0 0 8px!important}
${s} h1{font-size:30px!important;line-height:1.2!important;margin:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:800!important}
${s} .hero .sub{font-size:18px!important;margin:12px 0 0!important;color:#f3e8ff!important;-webkit-text-fill-color:#f3e8ff!important}
${s} h2{font-size:23px!important;color:${BRAND.purple}!important;-webkit-text-fill-color:${BRAND.purple}!important;margin:34px 0 6px!important;font-weight:800!important;border-bottom:3px solid ${BRAND.light}!important;padding-bottom:6px!important}
${s} h2 .kicker,${s} .kicker{display:block!important;font-size:12px!important;font-weight:700!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:${BRAND.mid}!important;-webkit-text-fill-color:${BRAND.mid}!important;border:0!important;margin-bottom:2px!important}
${s} h3{font-size:19px!important;color:${BRAND.dark}!important;-webkit-text-fill-color:${BRAND.dark}!important;margin:20px 0 6px!important;font-weight:700!important}
${s} p{margin:10px 0!important;color:${BRAND.dark}!important;-webkit-text-fill-color:${BRAND.dark}!important}
${s} ul,${s} ol{margin:10px 0 10px 0!important;padding-left:24px!important}
${s} li{margin:6px 0!important;color:${BRAND.dark}!important;-webkit-text-fill-color:${BRAND.dark}!important}
${s} .pill{display:inline-block!important;background:#f3e8ff!important;color:${BRAND.purple}!important;-webkit-text-fill-color:${BRAND.purple}!important;font-size:12px!important;font-weight:700!important;border-radius:999px!important;padding:2px 10px!important;margin:2px 4px 2px 0!important}
${s} .badge{display:inline-block!important;background:${BRAND.purple}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:11px!important;font-weight:800!important;letter-spacing:.05em!important;border-radius:6px!important;padding:3px 8px!important;margin-left:8px!important;vertical-align:middle!important}
${s} .card{border:1px solid #e9d5ff!important;border-radius:14px!important;padding:18px 20px!important;margin:16px 0!important;background:#faf5ff!important}
${s} .two{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;margin:16px 0!important}
${s} .grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:14px!important;margin:16px 0!important}
${s} .callout{border-left:5px solid ${BRAND.mid}!important;background:#f5f3ff!important;border-radius:0 12px 12px 0!important;padding:14px 18px!important;margin:18px 0!important}
${s} .callout.warn{border-left-color:#dc2626!important;background:#fef2f2!important}
${s} .label{font-size:12px!important;font-weight:800!important;letter-spacing:.05em!important;text-transform:uppercase!important;color:${BRAND.mid}!important;-webkit-text-fill-color:${BRAND.mid}!important;margin:0 0 4px!important}
${s} .email{border:1px solid #d8b4fe!important;border-radius:12px!important;background:#fff!important;margin:16px 0!important;overflow:hidden!important}
${s} .email .head{background:#f3e8ff!important;padding:12px 16px!important;font-size:14px!important}
${s} .email .body{padding:16px!important}
${s} table{border-collapse:collapse!important;width:100%!important;margin:16px 0!important;font-size:15px!important}
${s} th,${s} td{border:1px solid #e9d5ff!important;padding:8px 10px!important;text-align:left!important;color:${BRAND.dark}!important;-webkit-text-fill-color:${BRAND.dark}!important}
${s} th{background:${BRAND.purple}!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
${s} td.hl,${s} th.hl{background:#faf5ff!important}
${s} dl{margin:12px 0!important}
${s} dt{font-weight:700!important;color:${BRAND.purple}!important;-webkit-text-fill-color:${BRAND.purple}!important;margin-top:10px!important}
${s} dd{margin:2px 0 0 0!important}
${s} details{border:1px solid #e9d5ff!important;border-radius:10px!important;padding:10px 14px!important;margin:10px 0!important;background:#fff!important}
${s} summary{cursor:pointer!important;font-weight:700!important;color:${BRAND.mid}!important;-webkit-text-fill-color:${BRAND.mid}!important}
${s} .cta{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))!important;gap:12px!important;margin:18px 0!important}
${s} a.btn,${s} a.btn:link,${s} a.btn:visited{display:block!important;text-align:center!important;background:${BRAND.mid}!important;color:#fff!important;-webkit-text-fill-color:#fff!important;text-decoration:none!important;font-weight:700!important;border-radius:12px!important;padding:14px 16px!important;border:0!important}
${s} a,${s} a:link,${s} a:visited{color:${BRAND.purple}!important;-webkit-text-fill-color:${BRAND.purple}!important;text-decoration:underline!important}
${s} .q{border:1px solid #e9d5ff!important;border-radius:12px!important;padding:16px 18px!important;margin:16px 0!important}
${s} .q .stem{font-weight:700!important}
${s} .q ol{list-style:upper-alpha!important}
${s} .predict{font-style:italic!important;color:${BRAND.mid}!important;-webkit-text-fill-color:${BRAND.mid}!important;margin:8px 0!important}
${s} .kw{font-weight:800!important;text-decoration:underline!important}
${s} .muted{color:#6b7280!important;-webkit-text-fill-color:#6b7280!important;font-size:14px!important}
@media(max-width:640px){${s} .two{grid-template-columns:1fr!important}}
</style>`;
}

/* ----------------------------------------------------------------------------
 * Small HTML helpers
 * -------------------------------------------------------------------------- */
const para = (t) => t ? `<p>${esc(t)}</p>` : '';
const list = (arr) => (Array.isArray(arr) && arr.length) ? `<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : '';
const KW = /\b(NOT|EXCEPT|ALWAYS|NEVER|BEST|LEAST|MOST)\b/g;
const stemHTML = (t) => esc(t).replace(KW, (m)=>`<span class="kw">${m}</span>`);
// render a value that may be a string (paragraph) or array of strings (list)
function flow(v){
  if (!v) return '';
  if (Array.isArray(v)) return v.every(x=>typeof x==='string') ? list(v) : v.map(flow).join('');
  return para(v);
}

/* ----------------------------------------------------------------------------
 * Per-slide-type renderers (lesson body). Return HTML string or '' to suppress.
 * `ctx` carries the lesson handle map for your_turn CTA links.
 * -------------------------------------------------------------------------- */
function renderSlide(s, ctx){
  const t = s.type;
  switch (t){
    /* ---- TRANSFORM ---- */
    case 'title': // hero handled separately; never inline
      return '';
    case 'bell_ringer': // "Consider this" hook, prompt only (drop timing/directions)
      return `<div class="callout"><p class="label">Consider this</p>${para(s.prompt)}</div>`;
    case 'stop_and_think':
    case 'cfu': {
      const prompts = s.prompts || (s.prompt ? [s.prompt] : []);
      return `<div class="card"><p class="label">Check yourself</p>`
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'')
        + `<ol>${prompts.map(p=>`<li>${esc(p)}</li>`).join('')}</ol>`
        + `<details><summary>How to check your answer</summary>`
        + `<p class="muted">Write your reasoning in full sentences, then re-read the section above. A strong answer names the exact concept (and its EK) and explains why, not just what.</p></details></div>`;
    }
    case 'your_turn': { // CTA to this lesson's emitted exercise/quiz pages (once per lesson)
      if (ctx._ytDone) return '';
      ctx._ytDone = true;
      const links = (ctx.ctas||[]).map(c=>`<a class="btn" href="/pages/${esc(c.handle)}">${esc(c.label)}</a>`).join('');
      return `<h2>Keep going</h2>`
        + (s.note?para(s.note):'')
        + (links?`<div class="cta">${links}</div>`:'')
        + `<p class="muted">Everything for this lesson lives on the site &mdash; work the practice, then take the quiz.</p>`;
    }
    case 'exit_ticket': // default SUPPRESS (redundant with quiz)
      return '';

    /* ---- RENDER ---- */
    case 'objectives': {
      const items = (s.items||[]).map(it=>{
        const { text, tags } = pullTags(it.text||'');
        const pills = []
          .concat(it.tag?[it.tag]:[])
          .concat(tags)
          .map(x=>`<span class="pill">${esc(x)}</span>`).join('');
        return `<li>${esc(text)} ${pills}</li>`;
      }).join('');
      return `<h2>${esc(s.heading||'What you will learn')}</h2><ul>${items}</ul>`;
    }
    case 'section_divider':
      return `<h2><span class="kicker">${esc(s.kicker||('Section '+(s.number||'')))}</span>${esc(s.label||'')}</h2>`;
    case 'vocab': {
      const dl = (s.terms||[]).map(x=>`<dt>${esc(x.term)}</dt><dd>${esc(x.definition)}</dd>`).join('');
      return `<h3>${esc(s.heading||'Key vocabulary')}</h3><dl>${dl}</dl>`;
    }
    case 'concept':
      return `<div class="card"><h3>${esc(s.heading||'')}${s.tag?`<span class="badge">${esc(s.tag)}</span>`:''}</h3>${list(s.bullets)}</div>`;
    case 'two_column': {
      const col = (c)=>`<div class="card"><h3>${esc(c.title||'')}${c.ek?`<span class="badge">${esc(c.ek)}</span>`:''}</h3>`
        + (c.definition?`<p><em>${esc(c.definition)}</em></p>`:'') + list(c.examples) + `</div>`;
      return (s.heading?`<h3>${esc(s.heading)}</h3>`:'')
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'')
        + `<div class="two">${col(s.left||{})}${col(s.right||{})}</div>`
        + (s.footer?`<div class="callout"><p>${esc(s.footer)}</p></div>`:'');
    }
    case 'misconception':
      return `<div class="callout warn"><p class="label">Common misconception</p>`
        + `<p><strong>${esc(s.misconception||s.myth||'')}</strong></p>`
        + (s.whyItHappens?`<p><em>Why it happens:</em> ${esc(s.whyItHappens)}</p>`:'')
        + (s.correction?`<p><em>The reality:</em> ${esc(s.correction)}</p>`:'')
        + (s.example?`<p class="muted">${esc(s.example)}</p>`:'') + `</div>`;
    case 'scenario_intro': {
      const job = s.job ? `<p class="label">${esc(s.jobLabel||'Your job')}</p>${para(s.job)}` : '';
      return `<div class="card">`
        + (s.eyebrow?`<p class="kicker">${esc(s.eyebrow)}</p>`:'')
        + `<h3>${esc(s.heading||'Scenario')}</h3>`
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'')
        + flow(s.narrative) + flow(s.context) + flow(s.details) + flow(s.tasks)
        + job + flow(s.note) + (s.footer?`<p class="muted">${esc(s.footer)}</p>`:'') + `</div>`;
    }
    case 'scenario_email': {
      const body = (s.body||[]).map(b=>para(b)).join('');
      return `<div class="email"><div class="head">`
        + `<div><strong>From:</strong> ${esc(s.from)}</div>`
        + `<div><strong>To:</strong> ${esc(s.to)}</div>`
        + `<div><strong>Subject:</strong> ${esc(s.subject)}</div></div>`
        + `<div class="body">${body}</div></div>`
        + (s.callout?`<div class="callout warn"><p>${esc(s.callout)}</p></div>`:'');
    }
    case 'impacts_grid': {
      const cards = (s.items||[]).map(it=>`<div class="card"><h3>${esc(it.title)}${(it.ek||it.ekRef)?`<span class="badge">${esc(it.ek||it.ekRef)}</span>`:''}</h3>${para(it.summary)}</div>`).join('');
      return (s.heading?`<h3>${esc(s.heading)}</h3>`:'')
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'')
        + `<div class="grid">${cards}</div>`;
    }
    case 'worked_table': {
      const hl = (typeof s.highlightCol==='number') ? s.highlightCol : -1;
      const cols = (s.columns||[]).map((c,i)=>`<th${i===hl?' class="hl"':''}>${esc(c)}</th>`).join('');
      const rows = (s.rows||[]).map(r=>`<tr>${r.map((c,i)=>`<td${i===hl?' class="hl"':''}>${esc(c)}</td>`).join('')}</tr>`).join('');
      return (s.heading?`<h3>${esc(s.heading)}</h3>`:'')
        + (s.context?para(s.context):'')
        + `<table><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table>`
        + (s.note?`<p class="muted">${esc(s.note)}</p>`:'')
        + (s.footer?`<p class="muted">${esc(s.footer)}</p>`:'');
    }
    case 'case_study':
      return `<div class="card"><h3>${esc(s.heading||'Case study')}</h3>`
        + (s.scenarioLabel?`<p class="label">${esc(s.scenarioLabel)}</p>`:'') + para(s.scenario)
        + (s.analysisLabel?`<p class="label">${esc(s.analysisLabel)}</p>`:'') + para(s.analysis)
        + (s.trap?`<div class="callout warn"><p><em>Watch the trap:</em> ${esc(s.trap)}</p></div>`:'') + `</div>`;
    case 'ap_strategy': {
      const items = (s.strategies||[]).map(x=>`<li><strong>${esc(x.name)}:</strong> ${esc(x.text)}</li>`).join('');
      return `<div class="callout"><p class="label">AP exam strategy</p><h3>${esc(s.heading||'')}</h3>`
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'') + `<ul>${items}</ul></div>`;
    }
    case 'summary':
    case 'final_summary':
      return `<h2>${esc(s.heading||'Key takeaways')}</h2>${list(s.points)}`
        + (s.next?`<div class="callout"><p><em>What&rsquo;s next:</em> ${esc(s.next)}</p></div>`:'');
    case 'real_artifact': {
      const callouts = (s.callouts||[]).map(c=>`<li><strong>${esc(c.label)}:</strong> ${esc(c.text)}</li>`).join('');
      return `<div class="card">`
        + (s.eyebrow?`<p class="kicker">${esc(s.eyebrow)}</p>`:'')
        + `<h3>${esc(s.heading||'')}</h3>`
        + (s.subheading?`<p class="muted">${esc(s.subheading)}</p>`:'')
        + (s.imagePath?`<img src="/cdn/shop/files/${esc(path.basename(s.imagePath))}" alt="${esc(s.heading||'artifact')}" style="max-width:100%!important;border-radius:10px!important;border:1px solid #e9d5ff!important">`:'')
        + (s.source?`<p class="muted">Source: ${esc(s.source)}</p>`:'')
        + (callouts?`<ul>${callouts}</ul>`:'') + `</div>`;
    }
    case 'red_flag_debrief':
    case 'scenario_debrief': {
      const row = (k,v)=> v?`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`:'';
      return `<div class="card">`
        + (s.eyebrow?`<p class="kicker">${esc(s.eyebrow)}</p>`:'')
        + `<h3>${esc(s.heading||'Debrief')}${s.difficulty?`<span class="badge">${esc(s.difficulty)}</span>`:''}</h3>`
        + `<dl>${row('Incident',s.incident)}${row('Attack type',s.attack)}${row('Adversary skill',s.skill)}${row('CB defense',s.defense)}${row('Deciding factor',s.deciding)}</dl>`
        + (s.trap?`<div class="callout warn"><p><em>Trap:</em> ${esc(s.trap)}</p></div>`:'') + `</div>`;
    }

    /* ---- SUPPRESS ---- */
    case 'guided_notes_preview':
    case 'work_timer':
    case 'day_close':
    case 'discussion':
      return '';

    default:
      throw new Error('UNKNOWN slide type (not in treatment table): ' + t);
  }
}

/* ----------------------------------------------------------------------------
 * Page assembly
 * -------------------------------------------------------------------------- */
function wrap(id, inner){
  return pageStyle(id) + `\n<div id="${id}" class="apcyber">\n${inner}\n</div>`;
}
function hero(s){
  return `<div class="hero">`
    + (s.eyebrow?`<p class="eyebrow">${esc(s.eyebrow)}</p>`:'')
    + `<h1>${esc(s.title)}</h1>`
    + (s.subtitle?`<p class="sub">${esc(s.subtitle)}</p>`:'') + `</div>`;
}

function buildLessonPage(meta, mergedSlides, ctx){
  const heroSlide = mergedSlides.find(s=>s.type==='title');
  let body = heroSlide ? hero(heroSlide) : hero({title:meta.lessonTitle, eyebrow:meta.unit});
  for (const s of mergedSlides){
    if (s.type==='title') continue;        // hero already placed
    body += '\n' + renderSlide(s, ctx);
  }
  return wrap('apcyber-lesson', body);
}

function buildExercisePage(meta, ex){
  let b = hero({ eyebrow:`${meta.unit} &middot; Exercise ${ex.number||''}`, title:ex.title, subtitle:ex.subtitle||'' });
  if (ex.minutes) b += `<p class="muted">${esc(ex.minutes)}${ex.online?` &middot; ${esc(ex.online)}`:''}</p>`;
  b += flow(ex.intro);
  // exercise1 shape
  if (ex.scenarioTitle) b += `<h2>${esc(ex.scenarioTitle)}</h2>`;
  b += flow(ex.narrative);
  if (ex.log && ex.log.columns) {
    const cols = ex.log.columns.map(c=>`<th>${esc(c)}</th>`).join('');
    const rows = (ex.log.rows||[]).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    b += `<table><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  if (ex.scenarioNote) b += `<p class="muted">${esc(ex.scenarioNote)}</p>`;
  if (ex.predict) b += `<div class="callout"><p class="label">Predict first</p>${para(ex.predict)}</div>`;
  const partBlock = (label, intro, parts) => {
    let h = '';
    if (label) h += `<h2>${esc(label)}</h2>`;
    if (intro) h += para(intro);
    (parts||[]).forEach((p,i)=>{
      h += `<div class="q"><p class="stem">${esc((p.q!==undefined?p.q:p))}`
        + (p.pts?` <span class="badge">${esc(p.pts)} pts</span>`:'')
        + (p.ek?` <span class="pill">${esc(p.ek)}</span>`:'') + `</p>`;
      if (p.answer!==undefined) h += `<details><summary>Model answer</summary>${para(p.answer)}</details>`;
      h += `</div>`;
    });
    return h;
  };
  b += partBlock(ex.partALabel, null, ex.partA);
  b += partBlock(ex.partBLabel, ex.partBIntro, ex.partB);
  // exercise2 shape
  if (ex.standard) b += `<div class="callout"><p>${esc(ex.standard)}</p></div>`;
  if (ex.methodHeading) b += `<h2>${esc(ex.methodHeading)}</h2>`;
  if (Array.isArray(ex.method)) {
    b += `<ol>${ex.method.map(m=>`<li>${Array.isArray(m)?m.map(esc).join(' &mdash; '):esc(m)}</li>`).join('')}</ol>`;
  }
  if (Array.isArray(ex.fields) && ex.fields.length) b += `<p class="label">Record for each</p>` + list(ex.fields);
  if (Array.isArray(ex.scenarios)) {
    ex.scenarios.forEach(sc=>{
      b += `<div class="q"><p class="stem">Scenario ${esc(sc.n)}${sc.difficulty?` <span class="badge">${esc(sc.difficulty)}</span>`:''}</p>${para(sc.text)}`;
      if (sc.key && typeof sc.key==='object') {
        const rows = Object.entries(sc.key).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
        b += `<details><summary>Answer key</summary><dl>${rows}</dl></details>`;
      }
      b += `</div>`;
    });
  }
  if (ex.enrichmentHeading) b += `<h2>${esc(ex.enrichmentHeading)}</h2>`;
  if (ex.enrichmentNote) b += para(ex.enrichmentNote);
  return wrap('apcyber-exercise', b);
}

function quizItem(q, n){
  let h = `<div class="q"><p class="stem">${n}. ${stemHTML(q.stem)}</p>`;
  if (q.predictFirst) h += `<p class="predict">Predict first: cover the choices and answer in your head before you read the options.</p>`;
  if (Array.isArray(q.options)) h += `<ol>${q.options.map(o=>`<li>${esc(o)}</li>`).join('')}</ol>`;
  const letter = q.answer;
  h += `<details><summary>Answer &amp; explanation</summary>`
    + (letter?`<p><strong>Correct: ${esc(letter)}</strong>${q.ek?` <span class="pill">${esc(q.ek)}</span>`:''}</p>`:'')
    + (q.rationale?para(q.rationale):'') + `</details></div>`;
  return h;
}
function buildQuizPage(meta, quiz){
  let b = hero({ eyebrow:`${meta.unit} &middot; Lesson ${meta.lessonId} Quiz`, title:quiz.title, subtitle:'' });
  if (quiz.instructions) b += `<p class="muted">${esc(quiz.instructions)}</p>`;
  (quiz.questions||[]).forEach((q,i)=> b += quizItem(q, i+1));
  return wrap('apcyber-quiz', b);
}
function buildExamPage(u, exam){
  const m = exam.meta||{};
  let b = hero({ eyebrow:`${esc(m.unitLabel||('Unit '+u))} &middot; Unit Exam`, title:(m.title||('Unit '+u+' Exam')), subtitle:'' });
  if (exam.timeMinutes) b += `<p class="muted">${esc(exam.timeMinutes)} minutes</p>`;
  if (exam.partI){
    b += `<h2>Part I &mdash; Multiple choice</h2>`;
    if (exam.partI.instructions) b += `<p class="muted">${esc(exam.partI.instructions)}</p>`;
    (exam.partI.questions||[]).forEach((q,i)=> b += quizItem(q, i+1));
  }
  if (exam.partII){
    b += `<h2>Part II &mdash; Free response</h2>`;
    if (exam.partII.instructions) b += `<p class="muted">${esc(exam.partII.instructions)}</p>`;
    (exam.partII.questions||[]).forEach((q,i)=>{
      b += `<div class="q"><p class="stem">FR${i+1}. ${esc(q.prompt)}${q.points?` <span class="badge">${esc(q.points)} pts</span>`:''}</p>`;
      if (Array.isArray(q.parts)) b += `<ul>${q.parts.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
      b += `<details><summary>Sample response &amp; rubric</summary>`;
      if (Array.isArray(q.sample)) b += q.sample.map(para).join('');
      if (Array.isArray(q.rubric)) b += `<p class="label">Rubric</p>` + list(q.rubric);
      if (q.ek) b += `<p class="pill">${esc(q.ek)}</p>`;
      b += `</details></div>`;
    });
  }
  return wrap('apcyber-exam', b);
}

/* ----------------------------------------------------------------------------
 * Day-merge (spec section 3): concat day files by lessonId, drop day-seams.
 * -------------------------------------------------------------------------- */
function mergeDays(dayFiles){
  const datas = dayFiles
    .map(f=>({ f, d: JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')) }))
    .sort((a,b)=>(a.d.meta.day||1)-(b.d.meta.day||1));
  const merged = [];
  let titleSeen = false, bellSeen = false;
  for (const {d} of datas){
    for (const s of (d.slides||[])){
      if (s.type==='day_close') continue;                  // drop seams
      if (s.type==='title'){ if (titleSeen) continue; titleSeen=true; }
      if (s.type==='bell_ringer'){ if (bellSeen) continue; bellSeen=true; }
      merged.push(s);
    }
  }
  const day1 = datas[0].d;                                  // quiz/guide live here
  return { meta: day1.meta, slides: merged, quiz: day1.quiz, day1file: datas[0].f };
}

/* ----------------------------------------------------------------------------
 * Main
 * -------------------------------------------------------------------------- */
function main(){
  fs.rmSync(OUT, { recursive:true, force:true });
  fs.mkdirSync(OUT, { recursive:true });

  const all = fs.readdirSync(DIR);
  const dayFiles = all.filter(f=>/^lesson-\d\.\d+-day\d+\.json$/.test(f));
  const lessonIds = [...new Set(dayFiles.map(f=>f.match(/^lesson-(\d\.\d+)-/)[1]))]
    .sort((a,b)=> (a.split('.').map(Number)[0]-b.split('.').map(Number)[0]) || (a.split('.').map(Number)[1]-b.split('.').map(Number)[1]));

  // referenced ap-cybersecurity-* handles, per lesson (curated/live)
  const referenced = {};
  for (const lid of lessonIds){
    const u = unitOf(lid);
    const set = new Set();
    for (const f of dayFiles.filter(f=>f.startsWith(`lesson-${lid}-`))){
      const txt = fs.readFileSync(path.join(DIR,f),'utf8');
      (txt.match(new RegExp(`ap-cybersecurity-unit-${u}-[a-z0-9\\-]+`,'g'))||[]).forEach(h=>set.add(h));
    }
    referenced[lid] = [...set].sort((a,b)=>b.length-a.length)[0] || null;
  }

  const pages = [];           // {handle,title,html}
  const redirects = [];       // {command,path,target}
  const emittedHandles = new Set();
  const internalLinks = [];   // {from, handle}
  const handleChanges = [];   // reconciliation report
  const lessonHandleMap = {};

  // ---- per-lesson: lesson page, exercises, quiz ----
  for (const lid of lessonIds){
    const dFiles = dayFiles.filter(f=>f.startsWith(`lesson-${lid}-`));
    const { meta, slides, quiz } = mergeDays(dFiles);
    const lh = lessonHandle(meta, referenced[lid]);
    lessonHandleMap[lid] = lh;

    // extras → exercises
    const extrasPath = path.join(DIR, `lesson-${lid}-extras.json`);
    const hasExtras = fs.existsSync(extrasPath);
    const extras = hasExtras ? JSON.parse(fs.readFileSync(extrasPath,'utf8')) : {};

    // CTA targets for your_turn (only pages we actually emit)
    const ctas = [];
    if (extras.exercise1) ctas.push({ handle:exHandle(lid,1), label:`Exercise 1: ${extras.exercise1.title||'Practice'}` });
    if (extras.exercise2) ctas.push({ handle:exHandle(lid,2), label:`Exercise 2: ${extras.exercise2.title||'Practice'}` });
    if (quiz) ctas.push({ handle:quizHandle(lid), label:'Take the lesson quiz' });
    ctas.forEach(c=>internalLinks.push({ from:lh, handle:c.handle }));

    pages.push({ handle:lh, title:`${meta.unit} — ${meta.lessonTitle}`, html:buildLessonPage(meta, slides, { ctas }) });
    emittedHandles.add(lh);

    if (extras.exercise1){ const h=exHandle(lid,1); pages.push({handle:h,title:`Exercise 1 — ${extras.exercise1.title}`,html:buildExercisePage(meta,extras.exercise1)}); emittedHandles.add(h); }
    if (extras.exercise2){ const h=exHandle(lid,2); pages.push({handle:h,title:`Exercise 2 — ${extras.exercise2.title}`,html:buildExercisePage(meta,extras.exercise2)}); emittedHandles.add(h); }
    if (quiz){ const h=quizHandle(lid); pages.push({handle:h,title:quiz.title,html:buildQuizPage(meta,quiz)}); emittedHandles.add(h); }

    // reconciliation vs known live handle
    if (LIVE_HANDLES[lid] && LIVE_HANDLES[lid] !== lh){
      handleChanges.push({ lid, live:LIVE_HANDLES[lid], now:lh });
      redirects.push({ command:'MERGE', path:`/pages/${LIVE_HANDLES[lid]}`, target:`/pages/${lh}` });
    }
  }

  // ---- per-unit: exam pages ----
  const unitFiles = all.filter(f=>/^unittest-u\d\.json$/.test(f)).sort();
  for (const f of unitFiles){
    const u = f.match(/u(\d)\.json$/)[1];
    const exam = JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8'));
    const h = examHandle(u);
    pages.push({ handle:h, title:(exam.meta&&exam.meta.title)||`Unit ${u} Exam`, html:buildExamPage(u,exam) });
    emittedHandles.add(h);
  }

  // ---- collision guard: handles are filenames, must be unique ----
  { const seen=new Set(); for (const p of pages){ if (seen.has(p.handle)) throw new Error('duplicate handle: '+p.handle); seen.add(p.handle); } }

  // ---- write HTML files ----
  for (const p of pages) fs.writeFileSync(path.join(OUT, p.handle + '.html'), p.html, 'utf8');

  // ---- pages.csv (Matrixify MERGE, UTF-8 BOM, all fields quoted) ----
  const csvCell = (v)=>'"'+String(v).replace(/"/g,'""')+'"';
  let csv = '﻿' + ['Handle','Title','Body HTML','Command'].map(csvCell).join(',') + '\r\n';
  for (const p of pages){
    if (!p.html || !p.html.trim()) throw new Error('empty Body HTML for '+p.handle); // never wipe a page
    csv += [p.handle, asciiText(p.title), p.html, 'MERGE'].map(csvCell).join(',') + '\r\n';
  }
  fs.writeFileSync(path.join(OUT,'pages.csv'), csv, 'utf8');

  // ---- redirects.csv (Command, Path, Target) ----
  let rcsv = '﻿' + ['Command','Path','Target'].map(csvCell).join(',') + '\r\n';
  for (const r of redirects) rcsv += [r.command, r.path, r.target].map(csvCell).join(',') + '\r\n';
  fs.writeFileSync(path.join(OUT,'redirects.csv'), rcsv, 'utf8');

  /* ---------------- self-validation (spec section 10) ---------------- */
  const errors = [];
  // (a) every slide type maps to a treatment
  const typesSeen = new Set();
  for (const f of dayFiles) for (const s of (JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')).slides||[])) typesSeen.add(s.type);
  for (const t of typesSeen) if (!TREATMENT[t]) errors.push('slide type not in treatment table: '+t);
  // (b) every emitted internal link resolves to an emitted handle
  for (const l of internalLinks) if (!emittedHandles.has(l.handle)) errors.push(`dead link ${l.handle} (from ${l.from})`);
  // (c) no raw character above ASCII 127 anywhere in output
  for (const p of pages){ const m=p.html.match(/[^\x00-\x7F]/); if (m) errors.push(`non-ASCII byte ${JSON.stringify(m[0])} in ${p.handle}`); }
  { const m=csv.replace(/^﻿/,'').match(/[^\x00-\x7F]/); if (m) errors.push('non-ASCII byte in pages.csv: '+JSON.stringify(m[0])); }

  /* ---------------- report ---------------- */
  const counts = pages.reduce((a,p)=>{ const k=p.handle.includes('-exercise-')?'exercise':p.handle.endsWith('-quiz')?'quiz':p.handle.endsWith('-exam')?'exam':'lesson'; a[k]=(a[k]||0)+1; return a; },{});
  console.log('emit_web complete');
  console.log('  pages:', JSON.stringify(counts), '= total', pages.length);
  console.log('  redirects:', redirects.length);
  console.log('  emdash mode:', STRIP_EMDASH ? 'STRIP (lossy rephrase)' : 'ENCODE (&mdash;, faithful)');
  console.log('  handle changes vs known live:');
  if (!handleChanges.length) console.log('    (none among verifiable live handles)');
  handleChanges.forEach(c=>console.log(`    ${c.lid}: ${c.live}  ->  ${c.now}`));
  if (errors.length){ console.error('\nVALIDATION FAILED:'); errors.forEach(e=>console.error('  '+e)); process.exit(1); }
  console.log('  validation: PASS (all types mapped, all internal links resolve, output is pure ASCII)');
}
main();

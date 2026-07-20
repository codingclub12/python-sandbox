/*
 * emit_code_exercises.js — interactive, Judge0-graded coding-exercise pages for BI3.
 *
 *   node emit_code_exercises.js codeex-3.4.json
 *     -> web_out/ap-csp-<live-handle>-code.html   (gated student widget)
 *     -> out/CSP_3.4_CodeExercises_KEY.docx        (teacher answer key)
 *
 * The student page ships a self-contained widget (no external scripts/CDNs):
 * each problem has a stub editor (NEVER the answer), a Python/JavaScript
 * language toggle, an AP-pseudocode read-only reference, and a Run & Check
 * button that sends the student's code to Judge0, executes it for real,
 * and compares actual stdout to the hidden expected output. The reference
 * solutions live ONLY in the teacher KEY docx.
 *
 * Key handling: judge0.config.json (gitignored) supplies the endpoint + key.
 * If proxyUrl is set, the page calls that and the key never ships to the
 * browser (recommended). Otherwise the key is embedded — acceptable only
 * behind the site gate; a proxy is strongly recommended.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./helpers');
const { p, h2, h3, bullet, callout, titleBlock, buildDoc, save, run, C } = H;

const DIR = __dirname;
const WEB = path.join(DIR, 'web_out');
const OUTD = path.join(DIR, 'out');
const LIVE = JSON.parse(fs.readFileSync(path.join(DIR, 'live_handles.json'), 'utf8'));

const cfgPath = path.join(DIR, 'judge0.config.json');
if (!fs.existsSync(cfgPath)) { console.error('missing judge0.config.json (gitignored) — create it with endpoint + key'); process.exit(1); }
const CFG = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const inFile = process.argv[2];
if (!inFile) { console.error('usage: node emit_code_exercises.js codeex-<topic>.json'); process.exit(1); }
const EX = JSON.parse(fs.readFileSync(path.join(DIR, inFile), 'utf8'));
const topic = EX.meta.topic;
const liveLesson = LIVE[topic] || ('ap-csp-topic-' + topic.replace('.', '-'));
const handle = liveLesson + '-code';

// ---------- ASCII-safe HTML escape ----------
const NAMED = { 0x26:'&amp;',0x3c:'&lt;',0x3e:'&gt;',0x22:'&quot;',0x2018:'&lsquo;',0x2019:'&rsquo;',
  0x201c:'&ldquo;',0x201d:'&rdquo;',0x2013:'&ndash;',0x2014:'&mdash;',0x2026:'&hellip;',0x00b7:'&middot;',0x2022:'&bull;' };
function esc(s){ let o=''; for (const ch of String(s??'')){ const c=ch.codePointAt(0);
  o += NAMED[c]!==undefined?NAMED[c]:(c<128?ch:'&#'+c+';'); } return o; }
// JSON embedded in a <script> must be safe: escape non-ASCII + </ sequences.
function jsonForScript(obj){
  return JSON.stringify(obj).replace(/[-￿]/g, c => '\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))
    .replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
}

// ---------- student page ----------
const GID = 'apcsp-code';
const B = { deep:'#065F46', mid:'#10B981', tint:'#ECFDF5', ink:'#022C22' };
function style(){ const s='#'+GID; return `<style>
.page-title,.article__title,.page__title,.template-page main h1:first-of-type{display:none!important;visibility:hidden!important}
${s}{all:initial!important;display:block!important;box-sizing:border-box!important;max-width:880px!important;margin:0 auto!important;padding:8px 16px 56px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;line-height:1.55!important;font-size:16px!important;background:#fff!important}
${s} *,${s} *::before,${s} *::after{box-sizing:border-box!important}
${s} .hero{background:linear-gradient(135deg,${B.deep},${B.mid})!important;border-radius:16px!important;padding:24px!important;margin:8px 0 22px!important}
${s} .hero .eyebrow{font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:#D1FAE5!important;-webkit-text-fill-color:#D1FAE5!important;margin:0 0 8px!important}
${s} h1{font-size:26px!important;margin:0!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:800!important}
${s} .hero .sub{font-size:15px!important;margin:10px 0 0!important;color:#ECFDF5!important;-webkit-text-fill-color:#ECFDF5!important}
${s} .prob{border:1px solid #BBE5D2!important;border-radius:14px!important;padding:16px 18px!important;margin:16px 0!important;background:#fff!important}
${s} .pn{font-size:12px!important;font-weight:800!important;letter-spacing:.05em!important;text-transform:uppercase!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;margin:0 0 6px!important}
${s} .prompt{font-size:16px!important;margin:0 0 10px!important}
${s} code{font-family:Consolas,Menlo,monospace!important;background:#F0F7F4!important;padding:1px 5px!important;border-radius:4px!important;font-size:14px!important}
${s} details.ref{margin:8px 0!important}
${s} details.ref summary{cursor:pointer!important;font-weight:700!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;font-size:14px!important}
${s} pre.ps{font-family:Consolas,Menlo,monospace!important;background:#F0F7F4!important;border:1px solid #BBE5D2!important;border-radius:8px!important;padding:10px 12px!important;white-space:pre!important;overflow-x:auto!important;font-size:13px!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important;margin:6px 0!important}
${s} .toolbar{display:flex!important;align-items:center!important;gap:8px!important;margin:6px 0!important;flex-wrap:wrap!important}
${s} .toolbar label{font-size:13px!important;color:#5B7268!important;-webkit-text-fill-color:#5B7268!important}
${s} select.lang{font-family:inherit!important;font-size:14px!important;padding:5px 8px!important;border:1px solid #BBE5D2!important;border-radius:8px!important;background:#fff!important;color:${B.ink}!important;-webkit-text-fill-color:${B.ink}!important}
${s} textarea.ed{width:100%!important;min-height:130px!important;font-family:Consolas,Menlo,monospace!important;font-size:14px!important;line-height:1.5!important;background:#022C22!important;color:#D1FAE5!important;-webkit-text-fill-color:#D1FAE5!important;border:1px solid #0B3B2E!important;border-radius:10px!important;padding:12px!important;resize:vertical!important;white-space:pre!important;tab-size:4!important}
${s} button.run,${s} button.hint{font-family:inherit!important;font-weight:700!important;font-size:14px!important;border:0!important;border-radius:9px!important;padding:9px 16px!important;cursor:pointer!important;margin:8px 8px 0 0!important}
${s} button.run{background:${B.mid}!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
${s} button.hint{background:#ECFDF5!important;color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important;border:1px solid #BBE5D2!important}
${s} .result{margin-top:10px!important;border-radius:9px!important;padding:10px 12px!important;font-family:Consolas,Menlo,monospace!important;font-size:13px!important;white-space:pre-wrap!important;display:none!important}
${s} .result.pass{background:#DCFCE7!important;border:1px solid #16A34A!important;color:#14532D!important;-webkit-text-fill-color:#14532D!important;display:block!important}
${s} .result.fail{background:#FEF2F2!important;border:1px solid #DC2626!important;color:#7F1D1D!important;-webkit-text-fill-color:#7F1D1D!important;display:block!important}
${s} .result.wait{background:#F0F7F4!important;border:1px solid #BBE5D2!important;color:#5B7268!important;-webkit-text-fill-color:#5B7268!important;display:block!important}
${s} .hintbox{margin-top:8px!important;background:#FFFBEB!important;border-left:4px solid #F59E0B!important;padding:8px 12px!important;font-size:14px!important;display:none!important}
${s} .hintbox.show{display:block!important}
${s} .flow{background:#ECFDF5!important;border:1px solid #BBE5D2!important;border-left:5px solid ${B.mid}!important;border-radius:0 12px 12px 0!important;padding:12px 16px!important;margin:0 0 18px!important;font-size:15px!important}
${s} .flow b{color:${B.deep}!important;-webkit-text-fill-color:${B.deep}!important}
${s} .muted{color:#5B7268!important;-webkit-text-fill-color:#5B7268!important;font-size:13px!important}
</style>`; }

function problemHTML(pr, i){
  const psRef = pr.reference && pr.reference.pseudocode
    ? `<details class="ref"><summary>Show AP pseudocode reference</summary><pre class="ps">${esc(pr.reference.pseudocode)}</pre></details>` : '';
  return `<div class="prob" data-i="${i}">
  <p class="pn">Problem ${i+1} of ${EX.problems.length}</p>
  <p class="prompt">${pr.promptHtml || esc(pr.prompt)}</p>
  ${pr.expected!==undefined ? `<p class="muted">Expected output: <code>${esc(pr.expected)}</code></p>` : ''}
  ${psRef}
  <div class="toolbar"><label>Language</label>
    <select class="lang"><option value="python">Python</option><option value="javascript">JavaScript</option></select>
  </div>
  <textarea class="ed" spellcheck="false">${esc((pr.starter&&pr.starter.python)||'')}</textarea>
  <div><button class="run">&#9654; Run &amp; Check</button>${pr.hint?`<button class="hint">Hint</button>`:''}</div>
  ${pr.hint?`<div class="hintbox">${esc(pr.hint)}</div>`:''}
  <div class="result"></div>
</div>`;
}

const runtimeCfg = {
  proxyUrl: CFG.proxyUrl || '',
  endpoint: CFG.endpoint || 'https://judge0-ce.p.rapidapi.com',
  host: CFG.rapidApiHost || 'judge0-ce.p.rapidapi.com',
  key: CFG.proxyUrl ? '' : (CFG.rapidApiKey || ''),   // key omitted when a proxy is used
  langIds: { python: 71, javascript: 63 },
};
const starters = EX.problems.map(pr => pr.starter || {});
const expected = EX.problems.map(pr => (pr.expected!==undefined ? String(pr.expected) : null));

const widgetScript = `<script>
(function(){
  var CFG = ${jsonForScript(runtimeCfg)};
  var STARTERS = ${jsonForScript(starters)};
  var EXPECTED = ${jsonForScript(expected)};
  var root = document.getElementById(${JSON.stringify(GID)});
  if(!root) return;
  function norm(s){ return String(s==null?'':s).replace(/\\r/g,'').replace(/[ \\t]+$/gm,'').replace(/\\n+$/,''); }
  function submit(lang, code, cb){
    var body = JSON.stringify({ source_code: code, language_id: CFG.langIds[lang] });
    var url, headers = {'Content-Type':'application/json'};
    if (CFG.proxyUrl){ url = CFG.proxyUrl; }
    else { url = CFG.endpoint + '/submissions?base64_encoded=false&wait=true';
           headers['X-RapidAPI-Key'] = CFG.key; headers['X-RapidAPI-Host'] = CFG.host; }
    fetch(url, { method:'POST', headers: headers, body: body })
      .then(function(r){ return r.json(); })
      .then(function(d){ cb(null, d); })
      .catch(function(e){ cb(e); });
  }
  Array.prototype.forEach.call(root.querySelectorAll('.prob'), function(box){
    var i = +box.getAttribute('data-i');
    var ed = box.querySelector('.ed'), lang = box.querySelector('.lang');
    var res = box.querySelector('.result'), runBtn = box.querySelector('.run');
    var hintBtn = box.querySelector('.hint'), hintBox = box.querySelector('.hintbox');
    lang.addEventListener('change', function(){
      var st = STARTERS[i] || {}; ed.value = st[lang.value] || st.python || ed.value;
    });
    if(hintBtn){ hintBtn.addEventListener('click', function(){ hintBox.classList.toggle('show'); }); }
    runBtn.addEventListener('click', function(){
      res.className = 'result wait'; res.textContent = 'Running your code...';
      submit(lang.value, ed.value, function(err, d){
        if(err){ res.className='result fail'; res.textContent='Could not reach the code runner. Check your connection and try again.'; return; }
        var out = (d.stdout!=null)? d.stdout : '';
        var errText = d.stderr || d.compile_output || '';
        var exp = EXPECTED[i];
        if(errText && !out){ res.className='result fail'; res.textContent='Your code hit an error:\\n'+errText; return; }
        if(exp==null){ res.className='result pass'; res.textContent='Output:\\n'+out; return; }
        if(norm(out)===norm(exp)){ res.className='result pass'; res.textContent='Correct! Output:\\n'+out; }
        else { res.className='result fail'; res.textContent='Not quite.\\nExpected:\\n'+exp+'\\nGot:\\n'+(out||'(no output)')+(errText?('\\n'+errText):''); }
      });
    });
  });
})();
</script>`;

let body = style() + `\n<div id="${GID}">`;
body += `<div class="hero"><p class="eyebrow">${esc(EX.meta.unit||'Big Idea 3: Algorithms and Programming')} &middot; Topic ${esc(topic)} &middot; Coding Practice</p>`
  + `<h1>${esc(EX.meta.title)} &mdash; Code It Yourself</h1>`
  + `<p class="sub">Write real code and check it against the expected output. Pick Python or JavaScript; the AP pseudocode reference is there when you need it.</p></div>`;
if (EX.meta.intro) body += `<div class="flow">${esc(EX.meta.intro)}</div>`;
body += EX.problems.map(problemHTML).join('');
body += `<p class="muted">Your code runs on a secure external service. Answers are checked automatically &mdash; nothing is stored.</p>`;
body += `\n</div>\n` + widgetScript;

fs.mkdirSync(WEB, { recursive: true });
fs.writeFileSync(path.join(WEB, handle + '.html'), body, 'utf8');

// ---------- pages.csv row (gated, Published=false) ----------
const cell = v => '"' + String(v).replace(/"/g, '""') + '"';
const HEADERS = ['Handle','Title','Body HTML','Template Suffix','Published','Command'];
const csvPath = path.join(WEB, 'pages.csv');
H.upsertPagesCsvRow(csvPath, HEADERS.map(cell), handle,
  [handle, 'AP CSP Topic '+topic+' Coding Practice - '+EX.meta.title, body, '', 'false', 'MERGE'].map(cell));

// ---------- teacher answer-key docx (reference solutions live here only) ----------
const k = [];
k.push(...titleBlock('AP Computer Science Principles · Topic ' + topic + ' · ' + EX.meta.title,
  'Coding Practice — Answer Key (Teacher)',
  'Reference solutions for the interactive coding exercises. Students never see these; the site page ships stub starters only.'));
EX.problems.forEach((pr, i) => {
  k.push(h3('Problem ' + (i+1) + ' — expected output: ' + (pr.expected!==undefined?pr.expected:'(open-ended)')));
  k.push(p(pr.prompt));
  const codeLines = (label, code) => { if(!code) return;
    k.push(p([run(label, { bold:true, color:C.PURPLE })]));
    String(code).split('\n').forEach(ln => k.push(new H.Paragraph({ spacing:{after:0}, children:[ run(ln||' ', { font:'Courier New', size:18 }) ] }))); };
  if (pr.reference){ codeLines('AP Pseudocode:', pr.reference.pseudocode);
    codeLines('Python:', pr.reference.python); codeLines('JavaScript:', pr.reference.javascript); }
  if (pr.hint) k.push(p([run('Hint shown to students: ', { italics:true, color:C.GRAY }), run(pr.hint, { italics:true, color:C.GRAY })]));
});
const keyOut = path.join(OUTD, 'CSP_' + topic + '_CodeExercises_KEY.docx');
fs.mkdirSync(OUTD, { recursive: true });
save(buildDoc('Coding Practice Key \u00b7 ' + topic, k, EX.meta.unit || 'Big Idea 3'), keyOut).then(() => {
  const asciiBad = body.match(/[^\x00-\x7F]/);
  console.log('emitted ' + handle + '.html (' + Math.round(body.length/1024) + 'kb) + pages.csv row + KEY docx');
  console.log('  problems: ' + EX.problems.length + ' | ascii-clean: ' + !asciiBad + ' | key-in-page: ' + (!CFG.proxyUrl && !!CFG.rapidApiKey));
  if (!CFG.proxyUrl && CFG.rapidApiKey) console.log('  NOTE: RapidAPI key is embedded in the page JS (extractable). Set proxyUrl in judge0.config.json to hide it.');
});

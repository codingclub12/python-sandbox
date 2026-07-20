// ============================================================================
// emit_extras.js — Lesson Map / Exercise 1 / Exercise 2 / Discussion emitter
// ============================================================================
// Reads a lesson extras JSON (content source) and emits the per-lesson docs
// that complete the delivery folder, matching the Lesson 1.1 REFERENCE pack:
//   node emit_extras.js <extras.json> --doc=map|ex1|ex2|discussion
//                       [--mode=student|key] [--out=path.docx]
// Styling comes from helpers.js so every doc matches the rest of the bundle.
// ============================================================================

const fs = require('fs');
const H = require('./helpers');
const { p, h2, h3, bullet, link, callout, dataTable, titleBlock, buildDoc, save,
        run, C, Paragraph, TextRun } = H;

const args = process.argv.slice(2);
const inputPath = args[0];
let doc = null, mode = 'student', outPath = null;
for (const a of args.slice(1)) {
  if (a.startsWith('--doc=')) doc = a.split('=')[1];
  if (a.startsWith('--mode=')) mode = a.split('=')[1];
  if (a.startsWith('--out=')) outPath = a.split('=')[1];
}
const X = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const meta = X.meta;
const isKey = mode === 'key';

function nameLine() {
  return p([run('Name: __________________________   Period: ______   Date: __________', { color: C.GRAY })]);
}
function blankLines(n) {
  // A clean full-width writing rule per line (paragraph bottom border) — never
  // wraps and never leaves a short leftover stub the way underscore runs do.
  const out = [];
  for (let i = 0; i < n; i++) out.push(new Paragraph({
    spacing: { before: 30, after: 180 },
    border: { bottom: { style: 'single', size: 6, color: '999999', space: 6 } },
    children: [ new TextRun({ text: '', size: 18 }) ],
  }));
  return out;
}
function answerBlock(text) {
  return callout(null, [p([run('KEY: ', { bold: true, color: C.PURPLE }), run(text)])], 'tip');
}
function onlineLine(url) {
  return p([run('Also available online (auto-graded): ', { italics: true, color: C.GRAY }), link(url, 'https://www.' + url)]);
}

// ---------------------------------------------------------------- lesson map
function emitMap() {
  const k = [];
  k.push(...titleBlock('Lesson Map • Lesson ' + meta.lessonId, meta.lessonTitle, X.map.subtitle));
  k.push(p(X.map.intro));
  k.push(h2(X.map.folderHeading));
  X.map.folderItems.forEach(t => k.push(bullet([run(t)])));
  k.push(h2(X.map.websiteHeading));
  X.map.websiteLinks.forEach(w => k.push(bullet([run(w.label + ': ', { bold: true }), link(w.url, 'https://www.' + w.url)])));
  k.push(h2(X.map.surfacesHeading));
  X.map.surfaces.forEach(t => k.push(bullet([run(t)])));
  return k;
}

// ----------------------------------------------------------------- exercises
function exHeader(ex) {
  const k = [];
  k.push(...titleBlock('Exercise ' + ex.number + ' • Lesson ' + meta.lessonId + (isKey ? ' • ANSWER KEY' : ''),
    ex.title, isKey ? 'Teacher copy — answers shown in the green callouts.' : ''));
  if (!isKey) k.push(nameLine());
  k.push(p([run(ex.minutes + (ex.subtitle ? '  •  ' + ex.subtitle : ''), { bold: true, color: C.PURPLE })]));
  k.push(onlineLine(ex.online));
  k.push(p(ex.intro));
  return k;
}

function emitEx1() {
  const ex = X.exercise1;
  const k = exHeader(ex);
  k.push(h2(ex.scenarioTitle));
  k.push(p(ex.narrative));
  const widths = [900, 1900, 1900, 1500, 3680];
  k.push(dataTable(ex.log.columns, ex.log.rows, widths));
  k.push(p([run(ex.scenarioNote, { italics: true, color: C.GRAY, size: 18 })]));
  k.push(callout('Predict first', [p(ex.predict)], 'info'));
  if (!isKey) k.push(...blankLines(1));
  const section = (label, intro, items) => {
    k.push(h2(label));
    if (intro) k.push(p([run(intro, { italics: true, color: C.GRAY })]));
    items.forEach((q, i) => {
      // EK tag is a CB-alignment label for the teacher — show it on the KEY only,
      // never on the student copy (students name techniques, not framework codes).
      const head = [run('Q' + (i + 1) + '  ', { bold: true, color: C.NAVY })];
      if (isKey) head.push(run('[' + q.ek + '] ', { bold: true, color: C.PURPLE }));
      head.push(run('(' + q.pts + ' pts)  ', { color: C.GRAY }), run(q.q));
      k.push(p(head, { after: 100 }));
      if (isKey) k.push(answerBlock(q.answer)); else k.push(...blankLines(3));
    });
  };
  section(ex.partALabel, null, ex.partA);
  section(ex.partBLabel, ex.partBIntro, ex.partB);
  return k;
}

function emitEx2() {
  const ex = X.exercise2;
  const k = exHeader(ex);
  k.push(p([run(ex.standard, { bold: true })]));
  k.push(h2(ex.methodHeading));
  k.push(dataTable(['Step', 'What to do'], ex.method, [2800, 7080]));
  k.push(callout(ex.enrichmentHeading, [p(ex.enrichmentNote)], 'info'));
  ex.scenarios.forEach(s => {
    k.push(h3('Scenario ' + s.n + '     ' + s.difficulty));
    k.push(p(s.text));
    if (isKey) {
      k.push(answerBlock('Sign check: ' + s.key.signs));
      k.push(answerBlock('Mechanism + defense: ' + s.key.mechanism));
      k.push(answerBlock('Enrichment sub-type: ' + s.key.subtype));
    } else {
      ex.fields.forEach(f => {
        k.push(p([run(f + '   ', { bold: true, color: C.NAVY })], { after: 40 }));
        k.push(...blankLines(1));
      });
    }
  });
  return k;
}

// ---------------------------------------------------------------- discussion
function emitDiscussion() {
  const d = X.discussion;
  const k = [];
  k.push(...titleBlock('Discussion • Lesson ' + meta.lessonId, d.title,
    'Name: ______________________   Group: ______________________   Date: __________'));
  k.push(p([run(d.minutes, { bold: true, color: C.PURPLE })]));
  k.push(p(d.overview));
  k.push(dataTable(['Part', 'When & what'], d.parts.map(pt => [pt.name, pt.when]), [3200, 6680]));
  d.parts.forEach(pt => {
    k.push(h2(pt.name + '  (' + pt.when + ')'));
    k.push(p([run(pt.intro, { italics: true, color: C.GRAY })]));
    pt.items.forEach(it => {
      const runs = [];
      if (it.label) runs.push(run(it.label + ' — ', { bold: true, color: C.NAVY }));
      runs.push(run(it.text));
      k.push(p(runs, { after: 100 }));
      k.push(...blankLines(it.lines || 2));
    });
  });
  return k;
}

(async () => {
  let kids, label;
  if (doc === 'map') { kids = emitMap(); label = 'Lesson Map • ' + meta.lessonId; }
  else if (doc === 'ex1') { kids = emitEx1(); label = 'Exercise 1 • ' + meta.lessonId + (isKey ? ' • KEY' : ''); }
  else if (doc === 'ex2') { kids = emitEx2(); label = 'Exercise 2 • ' + meta.lessonId + (isKey ? ' • KEY' : ''); }
  else if (doc === 'discussion') { kids = emitDiscussion(); label = 'Discussion • ' + meta.lessonId; }
  else { console.error('Unknown --doc=' + doc); process.exit(1); }
  const out = outPath || (doc + (isKey ? '_KEY' : '') + '.docx');
  await save(buildDoc(label, kids, meta.unit), out);
  console.log('emitted ' + doc + (doc.startsWith('ex') ? ' (' + mode + ')' : '') + ': ' + out);
})();

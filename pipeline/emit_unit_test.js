// ============================================================================
// emit_unit_test.js — printable Unit Test emitter (Part I MCQ + Part II FRQ)
// ============================================================================
// Reads a unit-test JSON and emits a student copy or an answer key, in the same
// house style as the lesson quizzes. Part I reuses the MCQ audit (balance,
// difficulty, banned phrasing) and BLOCKS emit on hard fails, exactly like the
// per-lesson quizzes.
//   node emit_unit_test.js <unittest.json> --mode=student|key [--out=path.docx]
// ============================================================================
const fs = require('fs');
const H = require('./helpers');
const { p, h2, bullet, callout, spacer, rule, pageBreak, titleBlock, buildDoc, save,
        run, C, Paragraph, stripEK } = H;
function deepStripEK(o) {
  if (typeof o === 'string') return /\bEK\b/.test(o) ? stripEK(o) : o;
  if (Array.isArray(o)) return o.map(deepStripEK);
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = deepStripEK(o[k]); return r; }
  return o;
}
const { auditQuiz, letterToIndex, LETTERS, PREDICT_OK } = require('./quiz_audit');

const args = process.argv.slice(2);
const inputPath = args[0];
let mode = 'student', outPath = null;
for (const a of args.slice(1)) {
  if (a.startsWith('--mode=')) mode = a.split('=')[1];
  if (a.startsWith('--out=')) outPath = a.split('=')[1];
}
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const meta = data.meta;
const isKey = mode === 'key';

// Bold the logical-negation keywords authors write in CAPS (NOT/EXCEPT/LEAST...).
function boldStem(stem) {
  const re = /\b(NOT|EXCEPT|LEAST|ALWAYS|NEVER|BEST|MOST)\b/g;
  const parts = []; let last = 0, m;
  while ((m = re.exec(stem))) {
    if (m.index > last) parts.push(run(stem.slice(last, m.index)));
    parts.push(run(m[0], { bold: true }));
    last = m.index + m[0].length;
  }
  if (last < stem.length) parts.push(run(stem.slice(last)));
  return parts.length ? parts : [run(stem)];
}
function writingLines(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: 'single', size: 4, color: 'BBBBBB' } }, children: [run('')] }));
  return out;
}

function mcqBlocks() {
  const quiz = { questions: data.partI.questions };
  const audit = auditQuiz(quiz);
  console.error('— UNIT-TEST PART I AUDIT (' + meta.unitId + ') —');
  console.error('  key: ' + audit.stats.keySequence + '   dist: ' + JSON.stringify(audit.stats.distribution) +
                '   cap/letter: ' + audit.stats.capPerLetter + '   harder: ' + audit.stats.harderPct + '%');
  audit.warnings.forEach(w => console.error('  WARN  ' + w));
  audit.hardFails.forEach(f => console.error('  FAIL  ' + f));
  if (!audit.pass) { console.error('Refusing to emit: ' + audit.hardFails.length + ' hard failure(s) in Part I.'); process.exit(2); }

  const k = [];
  k.push(h2('Part I — Multiple Choice'));
  if (data.partI.instructions) k.push(p([run(data.partI.instructions, { italics: true, color: C.GRAY })]));
  if (isKey) {
    const seq = audit.stats.keySequence.split('-').map((L, i) => (i + 1) + '-' + L).join('    ');
    k.push(callout('Part I answer key', [
      p([run(seq, { bold: true, color: C.NAVY })]),
      p([run('Distribution  ' + LETTERS.map(L => L + ':' + audit.stats.distribution[L]).join('   ') +
             '   •   cap/letter ' + audit.stats.capPerLetter +
             '   •   harder items ' + audit.stats.harderPct + '%', { size: 18, color: C.GRAY })]),
    ], 'tip'));
  }
  (isKey?data.partI.questions:data.partI.questions.map(deepStripEK)).forEach((q, i) => {
    const ai = letterToIndex(q.answer);
    const kind = (q.kind || 'recall').toLowerCase();
    k.push(p([run((i + 1) + '. ', { bold: true, color: C.NAVY }), ...boldStem(q.stem)], { after: 60 }));
    if (!isKey && q.predictFirst === true && PREDICT_OK.has(kind)) {
      k.push(p([run('Predict first: ', { bold: true, color: C.PURPLE }),
                run('write your answer before reading the choices → ______', { italics: true, color: C.GRAY })], { after: 60 }));
    }
    (q.options || []).forEach((o, oi) => {
      const text = typeof o === 'string' ? o : (o.text || '');
      const correct = isKey && oi === ai;
      const runs = [run(LETTERS[oi] + '.  ', { bold: true, color: correct ? C.PURPLE : '333333' }),
                    run(text, correct ? { bold: true, color: C.PURPLE } : {})];
      if (correct) runs.push(run('   ✓', { bold: true, color: C.PURPLE }));
      k.push(new Paragraph({ children: runs, spacing: { after: 30, line: 268 }, indent: { left: 360 } }));
    });
    if (isKey) {
      const body = [p([run('Why ' + (LETTERS[ai] || '?') + ': ', { bold: true, color: C.PURPLE }), run(q.rationale)])];
      if (q.ek) body.push(p([run('CED: ', { bold: true }), run(q.ek, { color: C.GRAY })]));
      k.push(callout(null, body, 'info'));
    } else {
      k.push(p([run('Answer: ______', { color: '999999' })], { after: 150 }));
    }
  });
  return k;
}

function frqBlocks() {
  const k = [];
  k.push(pageBreak());
  k.push(h2('Part II — Free Response'));
  if (data.partII.instructions) k.push(p([run(data.partII.instructions, { italics: true, color: C.GRAY })]));
  (isKey?data.partII.questions:data.partII.questions.map(deepStripEK)).forEach((q, i) => {
    const head = [run('FR' + (i + 1) + '. ', { bold: true, color: C.NAVY }), ...boldStem(q.prompt)];
    if (q.points) head.push(run('   (' + q.points + ' points)', { color: C.GRAY }));
    k.push(p(head, { after: 80 }));
    (q.parts || []).forEach(part => {
      k.push(p(boldStem(part), { after: 40 }));
      if (!isKey) k.push(...writingLines(q.parts ? 3 : 5));
    });
    if (!q.parts && !isKey) k.push(...writingLines(6));
    if (isKey) {
      const body = [];
      (Array.isArray(q.sample) ? q.sample : [q.sample]).forEach(s => body.push(p([run(s)])));
      k.push(callout('Sample full-credit response', body, 'tip'));
      if (q.rubric && q.rubric.length) {
        k.push(callout('Scoring', q.rubric.map(r => bullet(r)), 'info'));
      }
      if (q.ek) k.push(p([run('CED: ', { bold: true }), run(q.ek, { color: C.GRAY })]));
      k.push(spacer(120));
    }
  });
  return k;
}

(async () => {
  const k = [];
  const mins = data.timeMinutes ? (data.timeMinutes + ' minutes') : '';
  k.push(...titleBlock(
    'Unit Test • ' + meta.unitId + (isKey ? ' • ANSWER KEY' : ''),
    meta.title + ' — Unit Test',
    isKey ? 'Teacher copy — correct answers in purple; sample responses and scoring below each item.'
          : 'Name: __________________________   Period: ______   Date: __________'
  ));
  const np = data.partI.questions.length, nf = data.partII.questions.length;
  k.push(p([run('Part I: ' + np + ' multiple-choice  •  Part II: ' + nf + ' free-response' +
               (mins ? ('  •  ' + mins) : '') + '.  Closed notes unless your teacher says otherwise.',
               { italics: true, color: C.GRAY })]));
  k.push(rule());
  k.push(...mcqBlocks());
  k.push(...frqBlocks());
  const out = outPath || (inputPath.replace(/\.json$/, '') + '_' + (isKey ? 'KEY' : 'STUDENT') + '.docx');
  await save(buildDoc('Unit Test • ' + meta.unitId + (isKey ? ' • KEY' : ''), k, meta.unitLabel || meta.unitId), out);
  console.log('emitted unit test (' + mode + '): ' + out);
})();

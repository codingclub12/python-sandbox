// ============================================================================
// APCSExamPrep Companion-Doc Emitter v1
// ============================================================================
// Reads the SAME lesson JSON that render.js renders to slides, and emits the
// matching Guided Notes packet (student fill-in + key). Single source of truth:
// edit the lesson JSON, regenerate both the decks and these docs.
//
// Usage:
//   node emit_docs.js <lesson.json> --doc=notes --mode=student|key [--out=path.docx]
// ============================================================================

const fs = require('fs');
const H = require('./helpers');
const { p, h1, h2, h3, bullet, numItem, link, callout, dataTable, spacer, rule, pageBreak,
        titleBlock, buildDoc, save, run, C, Paragraph, TextRun, stripEK } = H;

// Deep copy of a slide with every string EK-stripped — used to render STUDENT
// notes (the KEY keeps EK codes; slides themselves keep them too).
function deepStripEK(o) {
  if (typeof o === 'string') return /\bEK\b/.test(o) ? stripEK(o) : o;
  if (Array.isArray(o)) return o.map(deepStripEK);
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = deepStripEK(o[k]); return r; }
  return o;
}
const { auditQuiz, HARDER_KINDS, PREDICT_OK, letterToIndex, LETTERS } = require('./quiz_audit');
const { BorderStyle } = require('docx');

// Bold logical-negation keywords in a stem. Authors write them in CAPS to flag
// them; the emitter renders the CAPS form in bold. (Does not touch lowercase
// "not"/"never" in ordinary prose, which would over-bold.)
function boldStem(stem) {
  const re = /\b(NOT|EXCEPT|LEAST|ALWAYS|NEVER)\b/g;
  const parts = []; let last = 0, m;
  while ((m = re.exec(stem))) {
    if (m.index > last) parts.push(run(stem.slice(last, m.index)));
    parts.push(run(m[0], { bold: true }));
    last = m.index + m[0].length;
  }
  if (last < stem.length) parts.push(run(stem.slice(last)));
  return parts.length ? parts : [run(stem)];
}


// Split a roman-numeral stem ("... I. ... II. ... III. ... Which ...?") into
// lead-in, one block per item, and the trailing question, so the quiz prints
// each numbered statement on its own line.
function stemBlocks(stem) {
  if (!/\bI\.\s/.test(stem) || !/\bII\.\s/.test(stem)) return null;
  const i0 = stem.search(/\bI\.\s/);
  const lead = stem.slice(0, i0).trim();
  const parts = stem.slice(i0).split(/(?=\b(?:IV|III|II|I)\.\s)/).filter(s => s.trim().length);
  let tail = null;
  let last = parts[parts.length - 1];
  for (let j = last.length - 2; j > 0; j--) {
    if (last[j] === '.' && last[j + 1] === ' ') {
      const t = last.slice(j + 2).trim();
      if (/^[A-Z\u201c"]/.test(t) && /\?$/.test(t)) { tail = t; parts[parts.length - 1] = last.slice(0, j + 1); break; }
    }
  }
  return { lead, items: parts.map(s => s.trim()), tail };
}

// ---------- args ----------
const args = process.argv.slice(2);
const inputPath = args[0];
let doc = 'notes', mode = 'student', track = 'deepdive', outPath = null, force = false;
for (const a of args.slice(1)) {
  if (a.startsWith('--doc=')) doc = a.split('=')[1];
  if (a.startsWith('--mode=')) mode = a.split('=')[1];
  if (a.startsWith('--track=')) track = a.split('=')[1];
  if (a.startsWith('--out=')) outPath = a.split('=')[1];
  if (a === '--force') force = true;
}
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const meta = data.meta;
const isKey = mode === 'key';

// ---------- fill-in helper (mirrors the deck's student/teacher split) ----------
function blank(answer) {
  if (isKey) return new TextRun({ text: answer, bold: true, color: C.PURPLE });
  return new TextRun({ text: '_'.repeat(Math.min(90, Math.max(14, answer.length + 2))), color: '999999' });
}

// A standalone answer line: in KEY mode it prints the answer (purple bold); in
// student mode it draws ONE clean full-width writing rule that fills its
// container (cell or content column) exactly once — no underscore wrapping,
// no overflow past the margin. Use wherever a whole line is the answer.
function answerPara(answer, opt = {}) {
  if (isKey) {
    return new Paragraph({ spacing: { after: opt.after != null ? opt.after : 0 },
      children: [ new TextRun({ text: answer, bold: true, color: C.PURPLE }) ] });
  }
  return new Paragraph({
    spacing: { before: 24, after: opt.after != null ? opt.after : 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 4 } },
    children: [ new TextRun({ text: '', size: 18 }) ],
  });
}

// Optional per-slide `capture` [{q, a}]: high-value cloze lines. In the q text,
// "______" marks the gap. STUDENT: the gap renders as a writing line.
// KEY: the answer appears in the gap, purple bold.
function captureParas(cap) {
  const out = [];
  (cap || []).forEach(c => {
    const parts = String(c.q).split('______');
    const runs = [];
    parts.forEach((t, i) => {
      if (t) runs.push(run(t));
      if (i < parts.length - 1) {
        if (isKey) runs.push(run(' ' + c.a + ' ', { bold: true, color: C.PURPLE }));
        else runs.push(run('\u00A0'.repeat(30), { underline: {} }));
      }
    });
    out.push(bullet(runs));
  });
  return out;
}

// ---------- slide -> notes-block transforms ----------
function emitNotes() {
  const k = [];
  const titleSlide = data.slides.find(s => s.type === 'title') || {};
  k.push(...titleBlock(
    'Guided Notes \u2022 Lesson ' + meta.lessonId + ' \u2022 Day ' + meta.day + ' of ' + meta.totalDays + (isKey ? ' \u2022 KEY' : ''),
    (titleSlide.title || meta.lessonTitle),
    isKey ? 'Teacher copy \u2014 answers shown in purple bold.'
          : 'Name: __________________________   Period: ______   Date: __________'
  ));

  let enrichmentHeaderEmitted = false;

  // Mirror render.js: CB track drops enrichment slides entirely.
  let slides = (track === 'cb') ? data.slides.filter(s => s.track !== 'enrichment') : data.slides;
  // STUDENT packet hides EK framework codes; the KEY keeps them for alignment.
  if (!isKey) slides = slides.map(deepStripEK);

  for (const s of slides) {
    // Open an Enrichment section the first time we hit deep-dive-only content
    if (s.track === 'enrichment' && !enrichmentHeaderEmitted) {
      k.push(h2('Enrichment (deep-dive)'));
      enrichmentHeaderEmitted = true;
    }

    switch (s.type) {
      case 'objectives':
        k.push(h2('Today\u2019s objectives'));
        s.items.forEach(it => k.push(bullet([run(it.text)])));
        break;

      case 'bell_ringer':
        k.push(h2('Bell ringer'));
        k.push(p(s.prompt));
        if (s.subprompt) k.push(p([run(s.subprompt, { italics: true, color: C.GRAY })]));
        break;

      case 'section_divider':
        k.push(h2(s.number + '. ' + s.label));
        break;

      case 'vocab': {
        // The EK column is a CB-alignment aid for the teacher: show it on the KEY,
        // drop it from the STUDENT packet (students learn terms, not framework codes).
        const termCell = term => [ new Paragraph({ spacing: { after: 0 }, children: [ new TextRun({ text: term, bold: true, color: C.NAVY, size: 20 }) ] }) ];
        const ekCell = txt => [ new Paragraph({ spacing: { after: 0 }, children: [ new TextRun({ text: txt, color: C.PURPLE, size: 18 }) ] }) ];
        const rows = s.terms.map(t => {
          const eks = (t.definition.match(/\(EK[^)]*\)/g) || []).map(x => x.replace(/^\(|\)$/g, ''));
          const ekText = eks.length ? eks.join('; ') : '\u2014';
          const defText = t.definition.replace(/\s*\(EK[^)]*\)/g, '').replace(/\s+([.;,])/g, '$1').replace(/\s{2,}/g, ' ').trim();
          return isKey
            ? [ termCell(t.term), ekCell(ekText), [ answerPara(defText, { after: 0 }) ] ]
            : [ termCell(t.term), [ answerPara(defText, { after: 0 }) ] ];
        });
        if (isKey) k.push(dataTable(['Term', 'EK', 'Definition'], rows, [2600, 1700, 5580]));
        else       k.push(dataTable(['Term', 'Definition'], rows, [3000, 6880]));
        break;
      }

      case 'two_column': {
        if (s.heading) k.push(h3(s.heading));
        if (s.capture && !isKey) {
          [s.left, s.right].forEach(col => {
            if (!col) return;
            k.push(p([run(col.title + (col.definition ? ' \u2014 ' + col.definition : ''), { bold: true, color: C.PURPLE })]));
          });
          k.push(...captureParas(s.capture));
        } else {
          [s.left, s.right].forEach(col => {
            if (!col) return;
            k.push(p([run(col.title + (col.ek ? '  (' + col.ek + ')' : ''), { bold: true, color: C.PURPLE })]));
            (col.examples || []).forEach(ex => k.push(bullet([run(ex)])));
          });
          if (s.capture) k.push(...captureParas(s.capture));
        }
        if (s.footer) k.push(callout('AP tip', [p(s.footer)], 'tip'));
        break;
      }

      case 'impacts_grid': {
        if (s.subheading) k.push(p([run(s.subheading, { italics: true, color: C.GRAY })]));
        s.items.forEach(it => {
          k.push(p([run((it.ek ? it.ek + ' \u2014 ' : '') + it.title, { bold: true, color: C.NAVY })]));
          k.push(answerPara(it.summary));
        });
        break;
      }

      case 'misconception':
        k.push(callout('Watch out \u2014 ' + (s.heading || 'Common misconception'), [
          p([run('Myth: ', { bold: true }), run(s.misconception)]),
          ...(isKey
            ? [p([run('Reality: ', { bold: true }), run(s.correction)])]
            : [p([run('Explain why this is wrong: ', { bold: true })]), answerPara(''), answerPara('')]),
        ], 'warn'));
        break;

      case 'worked_table': {
        if (s.heading) k.push(h3(s.heading));
        if (s.context) k.push(p(s.context));
        const widths = s.columns.map(() => Math.floor(9880 / s.columns.length));
        // Optional s.blanks [[row,col],...]: those cells become student work
        // (writing line in the packet, purple answer on the KEY).
        let rows = s.rows;
        if (Array.isArray(s.blanks) && s.blanks.length) {
          const mark = new Set(s.blanks.map(([r, c]) => r + ':' + c));
          rows = s.rows.map((r, ri) => r.map((cell, ci) =>
            mark.has(ri + ':' + ci) ? [answerPara(String(cell), { after: 0 })] : cell));
          if (!isKey) k.push(p([run('Complete the empty cells as we work the examples.', { italics: true, color: C.GRAY })]));
        }
        k.push(dataTable(s.columns, rows, widths));
        break;
      }

      case 'scenario_intro':
        k.push(h3(s.heading));
        if (s.narrative) k.push(p(s.narrative));
        if (s.job) k.push(p([run((s.jobLabel || 'Your job:') + ' ', { bold: true }), run(s.job)]));
        break;

      case 'ap_strategy':
        k.push(h2(s.heading || 'AP exam strategy'));
        (s.strategies || []).forEach(st => k.push(bullet([run(st.name + ' \u2014 ', { bold: true }), run(st.text)])));
        break;

      case 'concept':
        if (s.heading) k.push(h3(s.heading));
        if (s.capture && !isKey) {
          k.push(...captureParas(s.capture));
        } else {
          (s.bullets || []).forEach(b => k.push(bullet([run(b)])));
          if (s.capture) k.push(...captureParas(s.capture));
        }
        break;

      case 'stop_and_think':
        k.push(h2('Stop and think'));
        (s.prompts || []).forEach(pr => k.push(numItem(pr)));
        if (s.directions) k.push(p([run(s.directions, { italics: true, color: C.GRAY })]));
        break;

      case 'your_turn':
        k.push(h2('Practice (on the website)'));
        (s.items || []).forEach(it => k.push(bullet([
          run(it.label + ' \u2014 ', { bold: true }), run((it.tail || '') + '  '), link(it.url, 'https://www.' + it.url.replace(/^https?:\/\/(www\.)?/, '')),
        ])));
        break;

      case 'final_summary':
        k.push(h2(s.heading || 'In one page'));
        (s.points || []).forEach(pt => k.push(bullet([run(pt)])));
        if (s.ican && s.ican.length) {
          k.push(p([run('Exit check \u2014 I can\u2026', { bold: true, color: C.NAVY })]));
          s.ican.forEach(it => k.push(bullet([run('\u2610  ' + it)])));
        }
        if (s.next) k.push(p([run('Next: ', { bold: true, color: C.PURPLE }), run(s.next)]));
        break;

      // intentionally not in the packet: title, guided_notes_preview, day_close
      default:
        break;
    }
  }

  const out = outPath || ('/home/claude/gold/out/' + meta.lessonId.replace('.', '-') + '_Day' + meta.day + '_GuidedNotes_' + track + '_' + (isKey ? 'KEY' : 'STUDENT') + '.docx');
  return save(buildDoc('Guided Notes \u2022 ' + meta.lessonId + ' Day ' + meta.day + (isKey ? ' \u2022 KEY' : ''), k, meta.unit), out)
    .then(() => console.log('emitted ' + doc + ' (' + mode + '): ' + out));
}

// ============================================================================
// QUIZ emitter (--doc=quiz --mode=student|key). Audit enforced before emit.
// ============================================================================
function emitQuiz() {
  const quiz = data.quiz;
  if (!quiz) { console.error('No top-level "quiz" block in ' + inputPath); process.exit(1); }

  const audit = auditQuiz(quiz);
  console.error('\u2014 MCQ AUDIT (' + meta.lessonId + ') \u2014');
  console.error('  key: ' + audit.stats.keySequence + '   dist: ' + JSON.stringify(audit.stats.distribution) +
                '   cap/letter: ' + audit.stats.capPerLetter + '   harder: ' + audit.stats.harderPct + '%');
  audit.warnings.forEach(w => console.error('  WARN  ' + w));
  audit.hardFails.forEach(f => console.error('  FAIL  ' + f));
  if (!audit.pass && !force) {
    console.error('Refusing to emit: ' + audit.hardFails.length + ' hard failure(s). Fix the quiz block, or pass --force to override.');
    process.exit(2);
  }
  if (!audit.pass && force) console.error('  (--force) emitting despite ' + audit.hardFails.length + ' hard failure(s).');

  // Audit ran on the original; the STUDENT copy renders with EK codes stripped
  // from stems/options (the KEY keeps them). Answer letters are unaffected.
  const rquiz = isKey ? quiz : deepStripEK(quiz);

  const k = [];
  k.push(...titleBlock(
    'Quiz \u2022 Lesson ' + meta.lessonId + (isKey ? ' \u2022 ANSWER KEY' : ''),
    rquiz.title || (meta.lessonTitle + ' \u2014 Lesson Quiz'),
    isKey ? 'Teacher copy \u2014 correct answer in purple, rationale below each item.'
          : 'Name: __________________________   Period: ______   Date: __________'
  ));
  if (rquiz.instructions) k.push(p([run(rquiz.instructions, { italics: true, color: C.GRAY })]));

  if (isKey) {
    const seq = audit.stats.keySequence.split('-').map((L, i) => (i + 1) + '-' + L).join('    ');
    k.push(callout('Answer key', [
      p([run(seq, { bold: true, color: C.NAVY })]),
      p([run('Distribution  ' + LETTERS.map(L => L + ':' + audit.stats.distribution[L]).join('   ') +
             '   \u2022   cap/letter ' + audit.stats.capPerLetter +
             '   \u2022   harder items ' + audit.stats.harderPct + '%', { size: 18, color: C.GRAY })]),
    ], 'tip'));
  }

  rquiz.questions.forEach((q, i) => {
    const ai = letterToIndex(q.answer);
    const kind = (q.kind || 'recall').toLowerCase();

    const blocks = stemBlocks(q.stem);
    if (blocks) {
      k.push(p([run((i + 1) + '. ', { bold: true, color: C.NAVY }), ...boldStem(blocks.lead)], { after: 40 }));
      blocks.items.forEach(it => k.push(p(boldStem(it), { after: 30 })));
      if (blocks.tail) k.push(p(boldStem(blocks.tail), { after: 60 }));
    } else {
      k.push(p([run((i + 1) + '. ', { bold: true, color: C.NAVY }), ...boldStem(q.stem)], { after: 60 }));
    }

    // Predict-first: never auto-added; honored only on explicit scenario/applied items.
    if (!isKey && q.predictFirst === true && PREDICT_OK.has(kind)) {
      k.push(p([run('Predict first: ', { bold: true, color: C.PURPLE }),
                run('write your answer before reading the choices \u2192 ______', { italics: true, color: C.GRAY })], { after: 60 }));
    }

    (q.options || []).forEach((o, oi) => {
      const text = typeof o === 'string' ? o : (o.text || '');
      const correct = isKey && oi === ai;
      const runs = [run(LETTERS[oi] + '.  ', { bold: true, color: correct ? C.PURPLE : '333333' }),
                    run(text, correct ? { bold: true, color: C.PURPLE } : {})];
      if (correct) runs.push(run('   \u2713', { bold: true, color: C.PURPLE }));
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

  const out = outPath || ('/home/claude/gold/out/' + meta.lessonId.replace('.', '-') + '_Quiz_' + (isKey ? 'KEY' : 'STUDENT') + '.docx');
  return save(buildDoc('Quiz \u2022 ' + meta.lessonId + (isKey ? ' \u2022 KEY' : ''), k, meta.unit), out)
    .then(() => console.log('emitted quiz (' + mode + '): ' + out));
}

// ============================================================================
// TEACHER-GUIDE emitter (--doc=guide). Lesson-scoped.
// ============================================================================
function emitGuide() {
  const g = data.guide;
  if (!g) { console.error('No top-level "guide" block in ' + inputPath); process.exit(1); }

  const k = [];
  k.push(...titleBlock(
    'Teacher Guide \u2022 Lesson ' + meta.lessonId,
    g.title || (meta.lessonTitle + ' \u2014 Teacher Guide'),
    g.subtitle || (meta.unit + '   \u2022   ' + (meta.los || ''))
  ));

  if (g.overview) { k.push(h2('Lesson overview')); (Array.isArray(g.overview) ? g.overview : [g.overview]).forEach(t => k.push(p(t))); }
  if (g.los && g.los.length) { k.push(h2('Learning objectives')); g.los.forEach(t => k.push(bullet([run(t)]))); }
  if (g.eks && g.eks.length) { k.push(h2('Essential knowledge (verbatim from the CED)')); g.eks.forEach(t => k.push(bullet([run(t)]))); }
  if (g.materials && g.materials.length) { k.push(h2('Materials & setup')); g.materials.forEach(t => k.push(bullet([run(t)]))); }
  if (g.prereqs && g.prereqs.length) { k.push(h2('Prerequisites')); g.prereqs.forEach(t => k.push(bullet([run(t)]))); }

  if (g.pacing && g.pacing.length) {
    k.push(h2('Pacing'));
    // If any segment carries a slide range, show a Slides column that maps the
    // deck to each segment (e.g. "1-4", "Handout"). Falls back to Segment|Time.
    const hasSlides = g.pacing.some(d => (d.segments || []).some(s => s.slides));
    g.pacing.forEach(day => {
      // A flex entry is a labeled assessment/extension block, not a numbered prep day.
      k.push(h3(day.flex ? (day.label || 'Flex / Assessment block (no deck)')
                         : ('Day ' + day.day + (day.focus ? ' \u2014 ' + day.focus : ''))));
      if (day.flex && day.focus) k.push(p([run(day.focus, { italics: true, color: C.GRAY })]));
      if (day.segments && day.segments.length) {
        if (hasSlides) {
          k.push(dataTable(['Segment', 'Slides', 'Time'],
            day.segments.map(s => [s.segment, s.slides || '\u2014', String(s.min) + ' min']),
            [6180, 1700, 2000]));   // sums to CONTENT_W (9880)
        } else {
          k.push(dataTable(['Segment', 'Time'], day.segments.map(s => [s.segment, String(s.min) + ' min']), [7380, 2500]));
        }
      }
    });
  }

  if (g.misconceptions && g.misconceptions.length) {
    k.push(h2('Common misconceptions'));
    g.misconceptions.forEach(m => k.push(callout('Watch out \u2014 ' + (m.heading || 'Misconception'), [
      p([run('Myth: ', { bold: true }), run(m.myth)]),
      p([run('Reality: ', { bold: true }), run(m.reality)]),
    ], 'warn')));
  }

  if (g.differentiation) {
    k.push(h2('Differentiation'));
    const d = g.differentiation;
    if (d.support && d.support.length) { k.push(h3('Support')); d.support.forEach(t => k.push(bullet([run(t)]))); }
    if (d.extension && d.extension.length) { k.push(h3('Extension / enrichment')); d.extension.forEach(t => k.push(bullet([run(t)]))); }
  }

  if (g.discussion && g.discussion.length) { k.push(h2('Discussion prompts')); g.discussion.forEach(t => k.push(numItem(t))); }
  if (g.answerKeyNote) { k.push(h2('Answer keys')); k.push(p(g.answerKeyNote)); }

  // Auto-surface the verified quiz key so the guide and quiz can never drift apart.
  if (data.quiz) {
    const a = auditQuiz(data.quiz);
    const seq = a.stats.keySequence.split('-').map((L, i) => (i + 1) + '-' + L).join('    ');
    k.push(callout('Quiz answer key (matches the student quiz exactly)', [
      p([run(seq, { bold: true, color: C.NAVY })]),
    ], 'tip'));
  }

  const out = outPath || ('/home/claude/gold/out/' + meta.lessonId.replace('.', '-') + '_TeacherGuide.docx');
  return save(buildDoc('Teacher Guide \u2022 ' + meta.lessonId, k, meta.unit), out)
    .then(() => console.log('emitted guide: ' + out));
}

(async () => {
  if (doc === 'notes') await emitNotes();
  else if (doc === 'quiz') await emitQuiz();
  else if (doc === 'guide') await emitGuide();
  else { console.error('Unknown --doc=' + doc); process.exit(1); }
})();

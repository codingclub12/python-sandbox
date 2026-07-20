// ============================================================================
// APCSExamPrep Lesson Validator  (validate.js)
// ============================================================================
// Moves the curriculum rules out of HANDOFF.md prose and into enforced checks,
// so a cold author can produce VALID lesson JSON from the repo alone. Same
// philosophy as the MCQ audit: hard-fail loudly, exit non-zero, refuse to let
// an invariant be violated silently.
//
//   node validate.js <lesson.json> [<lesson.json> ...]
//
// Exit 0 = all clean (warnings allowed). Exit 2 = one or more HARD failures.
// MCQ checks are delegated to quiz_audit.js (single source for assessment rules).
// The allowed slide-type set is read live from render.js's dispatch table, so
// this validator can never disagree with the engine about what a slide can be.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { auditQuiz } = require('./quiz_audit');

const REQUIRED_META = ['lessonId', 'lessonTitle', 'course', 'unit', 'day', 'totalDays', 'los', 'author'];
const CANON_AUTHOR = 'AP CS Exam Prep';
const EYEBROW_RE = /^Unit\s+(\d+)\s+\u00b7\s+Lesson\s+(\d+\.\d+)\s+\u00b7\s+Day\s+(\d+)\s+of\s+(\d+)$/;
const LO_RE = /\b(\d+\.\d+\.[A-G])\b/g;          // e.g. 1.1.A
const EK_IN_DEF_RE = /\(EK\s+\d+\.\d+\.[A-G]/;    // an "(EK x.y.Z" citation inside a vocab definition

// ---- allowed slide types: parse render.js's `const builders = { ... };` ----
function allowedSlideTypes() {
  const src = fs.readFileSync(path.join(__dirname, 'render.js'), 'utf8');
  const m = src.match(/const\s+builders\s*=\s*\{([\s\S]*?)\};/);
  if (!m) return null; // signal: couldn't read engine
  const keys = [...m[1].matchAll(/^\s*([a-z_]+)\s*:/gm)].map(x => x[1]);
  return new Set(keys);
}

function parseLOs(str) {
  return [...String(str).matchAll(LO_RE)].map(m => m[1]);
}

// ---------------------------------------------------------------------------
function validateLesson(file) {
  const fails = [];
  const warns = [];
  const F = msg => fails.push(msg);
  const W = msg => warns.push(msg);

  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { file, fails: ['JSON did not parse: ' + e.message], warns: [] }; }

  const meta = data.meta || {};
  const slides = Array.isArray(data.slides) ? data.slides : [];

  // ---- meta ----
  for (const k of REQUIRED_META) {
    if (meta[k] === undefined || meta[k] === '') F(`meta.${k} is missing`);
  }
  if (meta.author && meta.author !== CANON_AUTHOR)
    F(`meta.author must be "${CANON_AUTHOR}" (no personal-name byline); found "${meta.author}"`);
  if (typeof meta.day === 'number' && typeof meta.totalDays === 'number') {
    if (meta.day < 1 || meta.day > meta.totalDays)
      F(`meta.day (${meta.day}) must be between 1 and meta.totalDays (${meta.totalDays})`);
  }
  const metaLOs = parseLOs(meta.los || '');
  const metaLOset = new Set(metaLOs);

  // ---- slide types known to the engine ----
  const allowed = allowedSlideTypes();
  if (!allowed) W('could not read builder set from render.js — slide-type check skipped');

  // ---- no personal-name byline on the title slide ----
  const titleSlide = slides.find(s => s.type === 'title') || {};
  const titleText = [titleSlide.eyebrow, titleSlide.title, titleSlide.subtitle, titleSlide.footerLeft, titleSlide.footerRight, titleSlide.byline]
    .filter(Boolean).join(' \u2022 ');
  if (/built by/i.test(titleText)) F('title slide carries a "Built by" byline \u2014 strip it (creator is "' + CANON_AUTHOR + '")');

  // ---- title slide (first slide) ----
  if (!slides.length) {
    F('lesson has no slides');
  } else {
    const t = slides[0];
    if (t.type !== 'title') {
      F('first slide must be type "title"');
    } else {
      const m = (t.eyebrow || '').match(EYEBROW_RE);
      if (!m) {
        F(`title eyebrow must match "Unit X \u00b7 Lesson Y \u00b7 Day N of M"; found "${t.eyebrow || ''}"`);
      } else {
        const [, , lessonY, dayN, dayM] = m;
        if (meta.lessonId && lessonY !== String(meta.lessonId))
          F(`title eyebrow lesson "${lessonY}" \u2260 meta.lessonId "${meta.lessonId}"`);
        if (meta.day !== undefined && Number(dayN) !== Number(meta.day))
          F(`title eyebrow "Day ${dayN}" \u2260 meta.day ${meta.day}`);
        if (meta.totalDays !== undefined && Number(dayM) !== Number(meta.totalDays))
          F(`title eyebrow "of ${dayM}" \u2260 meta.totalDays ${meta.totalDays}`);
      }
    }
  }

  // ---- per-slide structural + curriculum checks ----
  let objectivesSeen = 0, impactsSeen = 0;
  const enrichmentSlides = [];
  const previewEnrichment = [];

  slides.forEach((s, i) => {
    const tag = `slide[${i}] (${s.type || '?'})`;
    if (!s.type) { F(`${tag}: missing type`); return; }
    if (allowed && !allowed.has(s.type)) F(`${tag}: unknown slide type "${s.type}" (not a render.js builder)`);

    // script required on every slide
    if (!s.script || !String(s.script).trim()) F(`${tag}: missing verbatim "script"`);

    // track values must be undefined or "enrichment"
    if (s.track !== undefined && s.track !== 'enrichment')
      F(`${tag}: track="${s.track}" is invalid (only "enrichment" is recognized)`);
    if (s.track === 'enrichment') enrichmentSlides.push(i);

    switch (s.type) {
      case 'objectives': {
        objectivesSeen++;
        const items = s.items || [];
        if (!items.length) F(`${tag}: objectives has no items`);
        // per-day objectives: every LO cited must be in meta.los
        const citedAll = [];
        items.forEach(it => parseLOs(it.text || '').forEach(lo => citedAll.push(lo)));
        if (metaLOset.size) {
          citedAll.forEach(lo => {
            if (!metaLOset.has(lo)) F(`${tag}: objective cites ${lo}, not in meta.los (${metaLOs.join(', ') || 'none'}) \u2014 objectives must be PER-DAY`);
          });
          // and every meta LO should appear as an objective
          metaLOs.forEach(lo => { if (!citedAll.includes(lo)) W(`${tag}: meta.los lists ${lo} but no objective cites it`); });
        }
        break;
      }
      case 'impacts_grid': {
        impactsSeen++;
        const n = (s.items || []).length;
        if (n < 2 || n > 4) F(`${tag}: impacts_grid must have 2-4 items (renderer lays out one row); found ${n}`);
        (s.items || []).forEach((it, j) => { if (!it.ek) W(`${tag}: item[${j}] has no "ek" badge`); });
        break;
      }
      case 'vocab': {
        const terms = s.terms || [];
        if (!terms.length) F(`${tag}: vocab has no terms`);
        terms.forEach((t2, j) => {
          if (!EK_IN_DEF_RE.test(t2.definition || ''))
            F(`${tag}: term[${j}] "${t2.term || ''}" definition has no "(EK x.y.Z)" citation \u2014 the notes emitter needs it for the EK column`);
        });
        break;
      }
      case 'worked_table': {
        const cols = s.columns || [], rows = s.rows || [];
        if (!cols.length) F(`${tag}: worked_table missing columns`);
        rows.forEach((r, j) => {
          if (!Array.isArray(r) || r.length !== cols.length)
            F(`${tag}: row[${j}] has ${Array.isArray(r) ? r.length : 'non-array'} cells, expected ${cols.length}`);
        });
        if (s.highlightCol !== undefined && (s.highlightCol < 0 || s.highlightCol >= cols.length))
          F(`${tag}: highlightCol ${s.highlightCol} out of range 0..${cols.length - 1}`);
        break;
      }
      case 'guided_notes_preview': {
        (s.sections || []).forEach((sec, j) => {
          if (sec.track === 'enrichment') previewEnrichment.push(`${i}.${j}`);
          else if (sec.track !== undefined) F(`${tag}: section[${j}] track="${sec.track}" invalid`);
        });
        break;
      }
    }
  });

  if (objectivesSeen === 0) W('no objectives slide found');
  if (objectivesSeen > 1) W(`${objectivesSeen} objectives slides found (expected 1)`);

  // enrichment parity: if the deck teaches enrichment content, the preview should advertise it (and vice versa)
  if (enrichmentSlides.length && !previewEnrichment.length)
    W('enrichment slides exist but no guided_notes_preview section is tagged "enrichment" \u2014 CB/deep-dive preview will under-count');
  if (previewEnrichment.length && !enrichmentSlides.length)
    W('a preview section is tagged "enrichment" but no slide is \u2014 CB preview promises a section the deck never teaches');

  // ---- day_close / final eyebrows referencing "Day N of M" ----
  slides.forEach((s, i) => {
    if (typeof s.eyebrow === 'string') {
      const dm = s.eyebrow.match(/Day\s+(\d+)\s+of\s+(\d+)/);
      if (dm) {
        if (Number(dm[1]) !== Number(meta.day)) F(`slide[${i}] (${s.type}): eyebrow "Day ${dm[1]}" \u2260 meta.day ${meta.day}`);
        if (Number(dm[2]) !== Number(meta.totalDays)) F(`slide[${i}] (${s.type}): eyebrow "of ${dm[2]}" \u2260 meta.totalDays ${meta.totalDays}`);
      }
    }
  });

  // ---- lesson-level quiz block (only present on one day) ----
  if (data.quiz) {
    const a = auditQuiz(data.quiz);
    a.hardFails.forEach(h => F('quiz: ' + h));
    a.warnings.forEach(w => W('quiz: ' + w));
  }

  // ---- lesson-level guide block ----
  if (data.guide) {
    (data.guide.los || []).forEach((lo, j) => { if (!/LO\s+\d+\.\d+/.test(lo)) W(`guide.los[${j}] doesn't look like "LO x.y ...": "${lo}"`); });
    (data.guide.eks || []).forEach((ek, j) => { if (!/EK\s+\d+\.\d+\.[A-G]/.test(ek)) W(`guide.eks[${j}] doesn't look like "EK x.y.Z ...": "${ek.slice(0, 40)}..."`); });
    if (Array.isArray(data.guide.misconceptions))
      data.guide.misconceptions.forEach((mc, j) => { if (!mc.myth || !mc.reality) F(`guide.misconceptions[${j}] needs both "myth" and "reality"`); });
  }

  return { file, fails, warns };
}

// ---------------------------------------------------------------------------
const inputs = process.argv.slice(2);
if (!inputs.length) { console.error('usage: node validate.js <lesson.json> [...]'); process.exit(1); }

let anyFail = false;
for (const f of inputs) {
  const r = validateLesson(f);
  const status = r.fails.length ? 'FAIL' : (r.warns.length ? 'PASS (warnings)' : 'PASS');
  console.log(`\n\u2014 ${path.basename(r.file)} \u2014  ${status}`);
  r.fails.forEach(x => console.log('  FAIL  ' + x));
  r.warns.forEach(x => console.log('  warn  ' + x));
  if (r.fails.length) anyFail = true;
}
console.log('');
process.exit(anyFail ? 2 : 0);

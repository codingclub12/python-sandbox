// ============================================================================
// quiz_audit.js  —  MCQ answer-key & difficulty audit (enforced in code)
// ============================================================================
// Single place the "harder MCQ" standards live so they cannot drift back:
//   HARD FAILS (block emit):
//     - every question has exactly 4 options (A-D)
//     - answer letter is valid and in range
//     - no "all of the above" / "none of the above" anywhere
//     - answer-key balance: all four letters present (N>=4); no letter over the
//       cap = max(ceil(N/4), floor(N*0.35))  [5-Q quizzes floor one letter at 40%]
//     - no 3+ consecutive identical answer letters
//     - every question carries a non-empty rationale (the KEY must be complete)
//     - predictFirst is NOT set on I/II/III (multi) or pure-recall items
//   WARNINGS (reported, do not block):
//     - non-parallel options (longest > 2.4x shortest within a question)
//     - rationale-leak heuristic in a student-visible option
//     - low difficulty mix (<50% scenario / multi / code-error items)
// Predict-first is NEVER auto-added; it is honored only when a scenario/applied
// item explicitly sets predictFirst:true.
// ============================================================================

const LETTERS = ['A', 'B', 'C', 'D'];
const HARDER_KINDS = new Set(['scenario', 'multi', 'code-error', 'applied']);
// Predict-first is for scenario/applied items ONLY — never I/II/III (multi) or recall.
const PREDICT_OK = new Set(['scenario', 'applied']);
const BANNED_OPTION = [/\ball of the above\b/i, /\bnone of the above\b/i];
const LEAK_HINTS = [/\bbecause\b/i, /\(correct\)/i, /\bthis is (correct|right)\b/i, /\bwhich is why\b/i];

function letterToIndex(L) { return LETTERS.indexOf(String(L).trim().toUpperCase()); }
function capForN(n) { return Math.max(Math.ceil(n / 4), Math.floor(n * 0.35)); }

function auditQuiz(quiz) {
  const hardFails = [];
  const warnings = [];
  const qs = (quiz && quiz.questions) || [];
  const N = qs.length;

  if (N === 0) {
    return { pass: false, hardFails: ['Quiz has no questions.'], warnings: [], stats: {} };
  }

  // ---- per-question structural checks ----
  const answerLetters = [];
  let harderCount = 0;
  qs.forEach((q, i) => {
    const tag = q.id || ('Q' + (i + 1));
    const opts = q.options || [];

    if (opts.length !== 4) {
      hardFails.push(`${tag}: has ${opts.length} options; AP MCQ require exactly 4 (A-D).`);
    }

    const ai = letterToIndex(q.answer);
    if (ai < 0 || ai > 3) {
      hardFails.push(`${tag}: answer "${q.answer}" is not a valid letter A-D.`);
    } else if (opts.length === 4) {
      answerLetters.push(LETTERS[ai]);
    }

    if (!q.rationale || !String(q.rationale).trim()) {
      hardFails.push(`${tag}: missing rationale (the answer KEY must explain every item).`);
    }

    // banned option phrasing
    opts.forEach((o, oi) => {
      const text = typeof o === 'string' ? o : (o.text || '');
      if (BANNED_OPTION.some(re => re.test(text))) {
        hardFails.push(`${tag} option ${LETTERS[oi] || oi}: uses "all/none of the above" (banned).`);
      }
    });

    // predict-first discipline
    const kind = (q.kind || 'recall').toLowerCase();
    if (q.predictFirst === true && !PREDICT_OK.has(kind)) {
      hardFails.push(`${tag}: predictFirst:true on a "${kind}" item — predict-first is for scenario/applied items only, never multi (I/II/III) or recall.`);
    }
    if (HARDER_KINDS.has(kind)) harderCount++;

    // ---- warnings ----
    const lens = opts.map(o => (typeof o === 'string' ? o : (o.text || '')).trim().length).filter(Boolean);
    if (lens.length >= 2) {
      const lo = Math.min(...lens), hi = Math.max(...lens);
      if (lo > 0 && hi / lo > 2.4) {
        warnings.push(`${tag}: options are not parallel in length (longest ${hi} vs shortest ${lo} chars) — possible giveaway or leaked rationale.`);
      }
    }
    opts.forEach((o, oi) => {
      const text = typeof o === 'string' ? o : (o.text || '');
      if (LEAK_HINTS.some(re => re.test(text))) {
        warnings.push(`${tag} option ${LETTERS[oi] || oi}: looks like it explains itself ("${text.slice(0, 48)}...") — rationale belongs in the KEY only.`);
      }
    });
  });

  // ---- answer-key distribution ----
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  answerLetters.forEach(L => { counts[L]++; });
  const cap = capForN(answerLetters.length || N);

  if ((answerLetters.length || N) >= 4) {
    LETTERS.forEach(L => {
      if (counts[L] === 0) hardFails.push(`Answer key never uses ${L} (all four letters A-D should appear).`);
    });
  }
  LETTERS.forEach(L => {
    if (counts[L] > cap) {
      const pct = Math.round((counts[L] / answerLetters.length) * 100);
      hardFails.push(`Answer key uses ${L} ${counts[L]}/${answerLetters.length} times (${pct}%) — exceeds cap of ${cap}.`);
    }
  });

  // ---- no 3 consecutive identical ----
  let run = 1;
  for (let i = 1; i < answerLetters.length; i++) {
    if (answerLetters[i] === answerLetters[i - 1]) {
      run++;
      if (run >= 3) {
        hardFails.push(`Answer key has 3+ identical answers in a row ending at Q${i + 1} (${answerLetters[i]}).`);
        break;
      }
    } else run = 1;
  }

  // ---- difficulty mix ----
  const harderPct = Math.round((harderCount / N) * 100);
  if (harderPct < 50) {
    warnings.push(`Only ${harderPct}% of items are harder-type (scenario / I-II-III / spot-the-error). Standard wants the bank skewed harder — add more.`);
  }

  const stats = {
    N,
    keySequence: answerLetters.join('-'),
    distribution: counts,
    capPerLetter: cap,
    harderPct,
  };

  return { pass: hardFails.length === 0, hardFails, warnings, stats };
}

module.exports = { auditQuiz, capForN, letterToIndex, LETTERS, HARDER_KINDS, PREDICT_OK };

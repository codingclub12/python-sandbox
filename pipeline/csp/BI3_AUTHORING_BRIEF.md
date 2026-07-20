# Big Idea 3 Authoring Brief (topics 3.2–3.18)

You are authoring ONE AP CSP topic to the frozen gold standard. Your output is
lesson JSON (and, for programming topics, a codeex JSON) written to disk in
`/home/user/python-sandbox/pipeline/csp/`. Consistency beats brilliance: match
the 3.1 pilot exactly in structure and quality.

## READ THESE FIRST (in this order)
1. `GOLD_STANDARD.md` — the full template rules. Non-negotiable. Read all of it.
2. `ced.txt` lines 442–884 — the verbatim AAP framework (Big Idea 3). Every LO/EK
   you cite MUST exist there with the EXACT code and be quoted VERBATIM in
   `guide.eks`, including any `X EXCLUSION` statements.
3. `lesson-3.1-day1.json`, `lesson-3.1-day2.json`, `lesson-3.1-extras.json` —
   the PILOT. Mirror its slide types, field names, script style, quiz shape,
   guide block, and `capture`/`worked_table blanks` usage. This is your template.
4. `codeex-3.1.json` — the coding-exercise schema (if your topic needs one).
5. In `render.js`, find `buildCodeBlock` — the `code_block` slide type. Study its
   fields (`pseudocode`, `python`, optional `output`, `caption`).

## OUTPUT CONTRACT (what you write to disk)
- `lesson-<TOPIC>-day1.json` … `-dayN.json` — one file per teaching day.
  Day 1 carries the `quiz` and `guide` blocks; later days do not.
  Non-final days end with a `day_close` slide; the FINAL day carries the
  "Common AP Traps" `ap_strategy` slide + `final_summary` with `ican[]`.
- `lesson-<TOPIC>-extras.json` — the extras bundle (exercise1, exercise2,
  discussion, lessonmap) exactly like `lesson-3.1-extras.json`.
- `codeex-<TOPIC>.json` — ONLY if your row says codeex=YES (see table).
- Run `node validate.js lesson-<TOPIC>-day1.json lesson-<TOPIC>-day2.json …`
  until every file PASSES before you finish. Report the final validate output.

## DAY-SPLIT RULE
Content dictates length. Split the LOs across days where a single 60-min day
would be overloaded (2 days is typical for multi-LO topics; 1 day for a single
tight LO). Per-day `meta.los` + per-day `objectives`. Never pad or cut to fit.

## BIG IDEA 3 SPECIFICS (in addition to GOLD_STANDARD.md)
- **AP pseudocode is primary on slides.** It MUST match the Exam Reference Sheet
  EXACTLY: `←` assignment, `DISPLAY(expr)`, `IF(cond){ }` / `ELSE { }`,
  `REPEAT n TIMES { }`, `REPEAT UNTIL(cond){ }`, `FOR EACH item IN aList { }`,
  `PROCEDURE name(p1,p2){ }`, `RETURN(expr)`, `aList[i]` **1-indexed**,
  `a MOD b`, relational `= ≠ > < ≥ ≤`, logical `NOT AND OR`, `RANDOM(a,b)`,
  list procs `INSERT/APPEND/REMOVE/LENGTH`, `INPUT()`.
- **Use `code_block` slides** to show pseudocode beside runnable code. Left pane
  = AP pseudocode; right pane = Python (primary runnable). Keep panes short
  (≤ ~10 lines) so they fit; use `output` for the printed result when useful.
- **Runnable JavaScript uses `let`, never `var`.** (Only relevant in codeex.)
- **Paper-then-screen scaffold** (GOLD_STANDARD.md §"Big Idea 3 exercise
  scaffold"): the extras `exercise1`/`exercise2` are PAPER (hand-trace values,
  predict output, spot errors — no typing). `exercise1` ends with the explicit
  hand-off: "You traced these by hand. Now type and run the harder versions on
  the Topic <TOPIC> page." The codeex problems are the SCREEN rung — same
  through-line scenario, TYPED and RUN, ordered easy→hard, first problem close
  to the paper warm-up, last a write-from-scratch.
- **codeex schema** (mirror `codeex-3.1.json`): `meta{topic,title,unit,intro}`
  + `problems[]` each with `prompt`, `promptHtml`, `expected` (exact stdout),
  `starter{python,javascript}` (STUBS with guiding comments — NEVER the answer),
  `reference{pseudocode,python,javascript}` (the worked solution), `hint`.
  `intro` names the paper→screen flow. 4 problems is the norm.

## CAPTURE / STUDENT-WRITING RULES (from GOLD_STANDARD.md — enforce)
- Every `concept` AND every `two_column` slide carries `capture` (2–3 cloze
  lines, ONE `______` gap each, high-value: rules/mechanisms/conclusions — never
  random nouns). The cloze `a` (answer) must NOT appear verbatim elsewhere on
  the same slide (no answer leaks).
- Every `worked_table` sets `blanks: [[row,col], …]` so students complete ≥1 step.
- Every `misconception`: student explains why it's wrong (engine handles it).
- 8–15 writing opportunities spread through the packet, never clustered.

## SLIDE-LANGUAGE RULE (teacher autonomy — enforce)
Visible slide text = STUDENT-FACING TASK ONLY. No timing, no "cold-call," no
"collect," no "independent," no classroom ops on any slide surface. Teacher
coaching lives ONLY in `script` (speaker notes). Scripts are teacher-AGNOSTIC:
no first-person ("I collect…"); use "Guided Notes are collected…", "A few
students are called on…".

## QUIZ RULES
4 options, balanced answer letters (no 3-in-a-row), no all/none-of-the-above,
rationale on every item explaining each distractor from a real misconception,
`predictFirst` only on scenario/applied items, 2–3 items per LO, bank skewed to
harder (scenario/applied/trace/multi) kinds.

## PER-TOPIC ASSIGNMENT TABLE
(TOPIC · Title · LOs → EKs to cover VERBATIM · suggested days · codeex)

- 3.2  Data Abstraction · AAP-1.C (C.1–C.4), AAP-1.D (D.1–D.8; incl EXCLUSION on
  D.6) · 2 days · codeex=YES (lists: build/append/access, 1-indexed)
- 3.3  Mathematical Expressions · AAP-2.A (A.1–A.4), AAP-2.B (B.1–B.7),
  AAP-2.C (C.1–C.4) · 2 days · codeex=YES (arithmetic + MOD; note 17/5→3.4,
  17 MOD 5→2)
- 3.4  Strings · AAP-2.D (D.1–D.2) · 1 day · codeex=YES — **codeex-3.4.json
  ALREADY EXISTS**: read it, keep/refine it, and make your lesson's paper
  exercises feed it (same scenario). Do NOT overwrite it with something weaker.
- 3.5  Boolean Expressions · AAP-2.E (E.1–E.2), AAP-2.F (F.1–F.5) · 2 days ·
  codeex=YES (relational + NOT/AND/OR truth outcomes)
- 3.6  Conditionals · AAP-2.G (G.1), AAP-2.H (H.1–H.3) · 2 days · codeex=YES
  (IF / IF-ELSE)
- 3.7  Nested Conditionals · AAP-2.I (I.1) · 1 day · codeex=YES (nested IF)
- 3.8  Iteration · AAP-2.J (J.1), AAP-2.K (K.1–K.5) · 2 days · codeex=YES
  (REPEAT n TIMES, REPEAT UNTIL; the zero-times and infinite-loop cases)
- 3.9  Developing Algorithms · AAP-2.L (L.1–L.5), AAP-2.M (M.1–M.3) · 2 days ·
  codeex=YES (max/min, sum/average, divisibility via MOD)
- 3.10 Lists · AAP-2.N (N.1–N.2), AAP-2.O (O.1–O.5; incl EXCLUSION on O.1
  parallel traversals) · 2 days · codeex=YES (traverse, sum/max, linear search)
- 3.11 Binary Search · AAP-2.P (P.1–P.3; incl EXCLUSION on P.1) · 1 day ·
  codeex=YES (count iterations / eliminate-half on a SORTED list; requires sorted)
- 3.12 Calling Procedures · AAP-3.A (A.1–A.9) · 2 days · codeex=YES (call a
  procedure, use return value, DISPLAY)
- 3.13 Developing Procedures · AAP-3.B (B.1–B.7), AAP-3.C (C.1–C.2) · 2 days ·
  codeex=YES (write a PROCEDURE with parameters + RETURN; procedural abstraction)
- 3.14 Libraries · AAP-3.D (D.1–D.5) · 1 day · codeex=YES (import & use a library
  procedure; read its API/doc)
- 3.15 Random Values · AAP-3.E (E.1–E.2) · 1 day · codeex=YES (RANDOM(a,b);
  because output varies, grade on a RANGE/property, e.g. print whether result is
  within bounds — expected stdout must be DETERMINISTIC, so have the program
  print a true/false check, not the raw random number)
- 3.16 Simulations · AAP-3.F (F.1–F.8) · 2 days · codeex=YES (a small simulation
  using RANDOM; again make graded stdout deterministic via a property/summary)
- 3.17 Algorithmic Efficiency · AAP-4.A (A.1–A.9; incl EXCLUSIONS on A.3 Big-O
  and A.9 specific heuristics) · 2 days · codeex=NO (conceptual/analysis; paper
  exercises = count-the-operations, reasonable vs unreasonable, heuristic-fit)
- 3.18 Undecidable Problems · AAP-4.B (B.1–B.3; incl EXCLUSION on B.2) · 1 day ·
  codeex=NO (conceptual; paper exercises = decidable vs undecidable sorting,
  explain-why)

## HARD CONSTRAINTS (your work is rejected if any fail)
1. `node validate.js` PASSES for every day file.
2. Every EK you cite exists in `ced.txt` with the exact code; `guide.eks` quotes
   them VERBATIM (incl. exclusions).
3. Every part of every LO covered (e.g. AAP-2.E part a "write" AND part b
   "evaluate"; AAP-1.D part a "develop" AND part b "explain how it manages
   complexity"). Parts are easy to miss.
4. All AP pseudocode matches the reference sheet exactly (1-indexed lists!).
5. No capture-answer leaks (answer text not repeated elsewhere on its slide).
6. No first-person or classroom-ops language on any slide surface.
7. Common AP Traps (exactly 3, exam-specific) + `final_summary.ican[]` (3–5)
   on the final day.

When done, report: files written, final `validate.js` output, day-count with
rationale, and a one-line self-audit against constraints 1–7.

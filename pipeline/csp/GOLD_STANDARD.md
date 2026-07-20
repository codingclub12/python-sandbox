# CSP Gold-Standard Lesson Template (frozen from Topic 2.1 v3)

Every CSP topic is authored to match `lesson-2.1-day1.json` in structure and
quality. Consistency beats brilliance: the goal is every lesson EQUAL to 2.1,
not occasionally better. This file codifies the template, including the
external curriculum audit's adopted recommendations.

## Grounding (non-negotiable)
- `ced.txt` in this directory is the verbatim CED (Effective Fall 2023).
- Every LO/EK cited anywhere must exist in `ced.txt`, with exact codes
  (e.g. `DAT-1.B.3`, not a from-memory guess).
- `guide.eks` lists the topic's EK statements verbatim from the CED,
  including exclusion statements.
- Cover EVERY part of every LO (e.g. DAT-1.C part b "compare and order" —
  parts are easy to miss).
- Run `node validate.js lesson-<id>-day1.json` until PASS before rendering.

## Slide skeleton (order)
0. SIZING IS CONTENT-DRIVEN. A topic takes as many days as it needs (day
   files like Cyber Units 1-2; every teaching day gets a deck); a section
   takes as many slides/pages as it needs. Never cut or pad to fit a mold.
   Multi-day: teach days split the LOs (per-day meta.los + per-day
   objectives); non-final days end with `day_close`; the FINAL day carries
   Common AP Traps + final_summary/I-can; quiz + guide live on day 1.
1. `title` — vivid hook title; eyebrow `Big Idea N · Topic N.N · Day N of M`;
   footerLeft `AP Computer Science Principles · College Board CED (Effective
   Fall 2023)`; footerRight `APCSExamPrep.com`.
2. `objectives` — one CB item per LO, citing `(LO XXX-n.Z)`; multiple items
   always (never a single objective).
3. `bell_ringer` — an experience that makes students INVENT the lesson's
   central idea before it is named (2.1: 8 light switches -> binary,
   overflow, precision). VARY THE OPENER across lessons: puzzle/design task,
   story, data set, code snippet, or a real-AP-style question — same skeleton
   underneath, different entry point (audit: prevents rhythm fatigue).
4. `guided_notes_preview` — sections matching the lesson; enrichment section
   tagged `"track": "enrichment"`.
5. Per LO: `section_divider` then as many content slides as the LO needs
   (typically 2-5) chosen from `vocab` (EK inside each definition),
   `concept`, `two_column`, `worked_table`, `impacts_grid`,
   `misconception`, `case_study`; then a `stop_and_think`.
6. Optional 1-2 `track: "enrichment"` slides — the renderer badges them
   "DEEP DIVE · BEYOND THE AP EXAM" automatically.
7. `ap_strategy` slide titled **"Common AP Traps"** — exactly 3 traps, each an
   exam-specific confusion (not a generic tip). One minute of class, real
   exam payoff.
8. `final_summary` — points recap + `"ican": [...]` exit checklist (renders as
   checkboxes on the slide and in the notes). 3-5 "I can…" statements tied
   to the LOs.

## Rules carried from the Cyber standard
- Every slide has a `script` (2-5 sentence teacher narration). No first-person
  procedural claims ("I collect…", "I will cold-call…") — use teacher-agnostic
  phrasing ("Guided Notes are collected…", "A few students will be called on…").
- Student-facing docs never show EK codes (the emitter strips them); the KEY
  keeps them. LO codes on section kickers are fine.
- Quiz: 4 options, balanced answer letters, no 3-in-a-row, no
  all/none-of-the-above, rationale on every item explaining each distractor
  from a real misconception, 2-3 items per LO.
- **Question STEMS read like a real AP CSP exam question — natural, about the
  topic itself.** (owner's standard, v4)
  - NEVER reference the framework in a stem: no "According to the CED", no
    "EK"/"LO"/EK codes, no "the exam reference sheet provides…", no meta
    language about the curriculum. Ask about the concept directly. (EK codes
    still live on the KEY via the item's `ek` field for teacher alignment —
    just never in the visible `stem`.)
  - **Mix the question TYPES like the real exam.** CSP is vocabulary-heavy:
    include plain definition / concept-recall / "which term…" / read-this-
    short-code items, NOT a multi-sentence real-world scenario every time.
    Rough target per bank: ~40% straightforward concept/vocabulary, ~35%
    short applied/trace, ~25% real-world scenario. Keep real-world examples
    (they're valuable) but trim the heavy reading — most stems ≤ ~35 words.
  - `predictFirst` is OCCASIONAL, not the default: set it ONLY on genuine
    "trace this code / predict the output" items, roughly ≤ 25% of a bank.
    A concept or vocabulary item never gets `predictFirst`.
  - **Difficulty is calibrated to the real AP MCQ, and eased for early
    material.** Big Idea 1 especially should be accessible (foundational,
    low-code) — no trick stems, no dense multi-clause setups; assess the idea
    cleanly. Later/among heavier topics may go harder, but never via reading
    load — via the concept.
  - Run `python3 quiz_style_audit.py <file>` and clear it before shipping a
    quiz/exam.
- Guide block: overview, verbatim `los`/`eks`, materials, prereqs, pacing with
  `QOTD (BIn/Tn.n/Q1) + bell ringer` opener and slide ranges, flex assessment
  block (`"slides": "Handout"`), 3 misconceptions (myth/reality),
  differentiation (support + extension), 3 discussion prompts, canonical
  `answerKeyNote`.

## Student participation rules (guided notes — owner's standard)
1. Every vocabulary section: students write EVERY definition (the emitter
   already blanks definitions in the student packet; the KEY fills them).
2. Every `concept` AND every `two_column` slide carries `capture` (2-3 cloze
   lines). Engine defaults add more student work automatically: two_column
   definitions render as writing lines (KEY purple), every stop_and_think
   prompt gets two ruled answer lines, and Common AP Traps ask students to
   write each trap in their own words.
3. Every worked example (`worked_table`): students complete at least one step
   themselves — set `"blanks": [[row,col], ...]` on the slide; those cells
   become writing lines in the packet and purple answers on the KEY.
4. Every misconception: students explain WHY it's wrong (the emitter renders
   "Explain why this is wrong:" + writing lines for students; the KEY shows
   the reality).
5. Every lesson: 8-15 writing opportunities SPREAD through the packet, never
   clustered at the end. High-value blanks only (rules, mechanisms,
   conclusions, diagnosis) — never random nouns.

## Slide-language rule (teacher autonomy)
Visible slide text is STUDENT-FACING TASK ONLY. No timing, no "independent,"
no "cold-call," no "collect," no classroom operations on any slide surface —
teacher or student deck. The split:
- Slides guide the lesson (task: "Answer in complete sentences.").
- Speaker notes coach the teacher (suggested timing, cold-call moves,
  emphasis, misconception alerts).
- Teacher Guide manages pacing (the segment-by-segment table).
Student decks are generated automatically from the same source (teacher
slides minus speaker notes); because operational language never appears on
slide surfaces, no separate student edit pass is needed. Do not build a
separately designed student deck — the website is the student workspace;
student decks exist for review/absent students.

## Audit-adopted rules (new in v3)
- **Capture blanks**: reading-heavy `concept`/`two_column` slides carry
  `"capture": [{"q": "… ______ …", "a": "…"}]` — 2-3 high-value cloze lines
  per section, ONE gap (`______`) per line. Student packet renders a writing
  line; KEY renders the answer purple-bold. Target ~40% student-generated
  content in the packet. Do NOT cloze random nouns — capture rules,
  conclusions, and mechanisms.
- **Website integration**: every `stop_and_think.directions` ends with
  "Then check yourself with the matching CFUs on the Topic N.N page." The
  `guided_notes_preview.note` points to the Topic Guided Notes page. The
  website is the student workspace; slides are the teacher instrument.
- **Guided notes are FINDABLE ON THE SITE — BUT GATED** (per-topic
  deliverable, paying teachers only): run `node emit_web.js <topic>
  [--template=<locked-suffix>]` to render the student packet as a Shopify
  page body at handle `ap-csp-topic-N-N-guided-notes` (all days combined,
  same student semantics as the docx: blanks/cloze/explain-why,
  EK-stripped, print button, deep-dive badges). The pages.csv row ships
  Published=false + Template Suffix so a raw Matrixify import is never
  world-readable; the store's access gate (locked page template /
  Locksmith / member tag — whatever the class-login system uses) must be
  verified before publishing. Never import paid notes as a public page.
  Link the gated page from the topic lesson page.
- **Teacher Resources hub** (primary premium distribution): `node
  emit_teacher_hub.js --salt=<token> [--template=<suffix>]` regenerates the
  one gated hub page listing every file for every authored topic
  (student-safe vs teacher-only groups; KEYs amber-flagged). Files stage in
  web_out/site_files/ with salted names — Shopify CDN files are public by
  URL, so the salt keeps links unguessable; keep the salt constant across
  re-runs. KEYs must sit behind the TEACHER gate, never the student
  course/name/PIN gate.
- **Enrichment is visually distinct**: handled by the engine badge — authors
  just set `track: "enrichment"`.
- **Common AP Traps + I-can checklist**: required on every lesson (see
  skeleton items 7-8).

## Pacing (see PACING.md)
- Content dictates length; PACING.md day counts are planning estimates,
  reconciled to actuals after authoring. Multi-day topics ship one deck per
  day plus the extras bundle (exercise1/exercise2/discussion/map).
- The course ships BOTH a year-long (60-min, deep-dive track fills the flex
  pool) and a semester-block (90-min, CB track) pacing guide, plus the
  Create PT window (>= 9 mandated class hours), 3 innovation investigations,
  the BI2 data project, and BI3 mini-projects MP1-MP3.

## Geometry / rendering
- `stop_and_think` supports up to 4 prompts (cards auto-shrink, bottom bound
  6.90" — clear of the 7.05" footer).
- After rendering, run the geometric audit (off-slide shapes = 0, overflow
  risks = 0) before delivering.
- Render matrix PER DAY: deck teacher/student × cb/deepdive; notes
  student/key × cb/deepdive. Plus per topic: quiz student/key; guide.

## Big Idea 3 exercise scaffold (paper-then-screen)
Every programming topic's practice is a deliberate two-rung ladder that
shares ONE through-line scenario:
- PAPER first (the docx exercise1/exercise2 Supplements): the low rungs —
  hand-TRACE variable/list values, PREDICT output, and SPOT errors by
  reading. No typing; works offline; low cognitive load. exercise1 ends
  with an explicit hand-off: "You traced these by hand. Now type and run
  the harder versions on the Topic N.N page."
- SCREEN next (codeex-N.N.json -> the gated coding page): the high rungs —
  the student TYPES and RUNS progressively harder versions of the SAME
  scenario, Judge0-graded. The page's meta.intro names the flow: "You
  warmed these up on paper; now build and run them, hardest last."
Order problems easy->hard; the first codeex problem should be close to
what they just did on paper, the last a genuine write-from-scratch.
Keep the scenario/context shared between paper and screen so the paper
prep directly feeds the typed problems.

## Big Idea 3 JavaScript convention
Runnable JavaScript in code_block panes, codeex starters, and codeex
references uses `let` (never `var`). Rationale: `var` is legacy
(function-scoped, hoisting footguns); `let` is the modern idiom AND it
matches AAP-1.B's concept that a variable's value changes through
reassignment. Use `let` uniformly at intro level (avoid mixing in
`const` early). The exam is language-neutral, so this only sets the
habit the runnable code models. Python stays the primary runnable
language; AP pseudocode (left-arrow assignment) stays primary on slides.

## Big Idea 3 note
Topics 3.1-3.18 use the Exam Reference Sheet pseudocode (see the appendix in
`ced.txt`). A `code_block` slide type will be added to the engine when BI3
authoring starts; pseudocode on slides must match the reference sheet exactly
(REPEAT n TIMES, aList[i] 1-indexed, <- assignment, etc.).

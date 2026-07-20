# AP Cybersecurity Website Emitter Spec (emit_web.js)

## Goal
Add one new emitter, emit_web.js, as a sibling to render.js. It reads the same
lesson-*.json source and writes Shopify-ready lesson, exercise, quiz, and unit-exam
pages plus a single Matrixify MERGE CSV. Do not modify the source JSON or any existing
emitter. One source of truth keeps feeding the decks, the docs, and the website.

## Core principle this spec enforces
A slide deck is not a web lesson. The slides[] array is built for projected class
periods: bell ringers, timers, day-close seams, speaker notes, and "your turn" pointers.
The website lesson is one self-paced reading page per topic. So emit_web.js does three
things the deck emitter does not. It merges teaching days into one lesson, it drops
classroom-only slide types, and it reshapes a few slide types into web-native blocks.

## 1. Inputs
- lesson-<U>.<L>-day<N>.json: lesson content (slides). On day-1 files only, also the
  quiz and guide blocks.
- lesson-<U>.<L>-extras.json: map, ex1, ex2, discussion (present on every lesson except 1.1).
- unittest-u<N>.json: unit-test bank.
- Canonical source is these JSON files. Ignore the zips, out/, and out_sample/.

## 2. Pages emitted
Per lesson (merging all day files that share a lessonId):
- Lesson page: curated render of the merged slides.
- Exercise 1 page: from extras.ex1.
- Exercise 2 page: from extras.ex2.
- Quiz page: from the day-1 quiz block. Student version by default. Optionally a
  separate answer-key version.

Per unit:
- Unit exam page: from unittest-u<N>.json.

Teacher-facing, suppressed from student pages:
- The discussion content and the guide block do not go on student lesson pages.
  They can feed a separate teacher resource later if wanted.

GAP to confirm before coding: the live site has a Lab page per lesson, but the report
shows no lab content in extras and no lab emitter. Confirm whether lab content exists
anywhere in the JSON. If it does not, emit_web.js does not generate labs and the
existing lab pages stay as they are. Report the finding.

## 3. Day-merge rule
For each lessonId, concatenate the slides of day1, day2, and so on, in order, into one
lesson page. Remove the day-seam slides so the page reads as one continuous lesson:
- Drop every day_close.
- Keep only the first title slide as the page hero. Drop any later per-day title.
- Keep at most one opening hook for the whole lesson (see bell_ringer below); drop a
  second one that opens day 2.
The quiz lives on the day-1 file and renders to the separate quiz page, never inside the
lesson body.

## 4. Slide-type treatment table
28 types. Each is RENDER (web block, content kept), TRANSFORM (reshaped for web), or
SUPPRESS (omitted from the lesson page).

RENDER:
- objectives: "What you will learn" list. Keep LO and EK tags as small pills.
- section_divider: section heading (H2) inside the lesson, kicker as a small label.
- vocab: key-terms definition list.
- concept: concept block, heading plus bullets. Keep the "CB REQUIRED" badge.
- two_column: two-column comparison card (left and right: title, definition, ek, examples).
- misconception: "Common misconception" callout (myth, why it happens, correction, example).
- scenario_intro: scenario setup block (eyebrow, heading, narrative, job).
- scenario_email: rendered email artifact box (from, to, subject, body, callout).
- impacts_grid: grid of impact cards.
- worked_table: HTML table.
- case_study: case-study block.
- ap_strategy: "AP exam strategy" callout.
- summary and final_summary: lesson summary and key takeaways.
- real_artifact: artifact display block.
- red_flag_debrief and scenario_debrief: debrief block.

TRANSFORM:
- title: lesson hero (eyebrow, H1, subtitle). The page H1 lives here, and the theme page
  title stays hidden (see output contract).
- bell_ringer: opening "Consider this" hook box. Strip the timing and "be ready to share"
  directions. Use only the prompt.
- stop_and_think and cfu: inline self-check with a click-to-reveal answer. Web-native
  engagement instead of "independent writing, 6 minutes."
- your_turn: "Keep going" CTA block linking to this lesson's exercise and quiz pages.
  This is also the internal-linking win, so build real links to the emitted handles.
- exit_ticket: default SUPPRESS (redundant with the quiz). Only render as a short
  end-of-lesson self-check if asked.

SUPPRESS:
- guided_notes_preview: describes the printed notes packet, not relevant on the web.
- work_timer: classroom timer.
- day_close: handled by the day-merge rule.
- discussion: teacher-facing.

Every slide carries a script field (speaker narration). Never render script on the
web. It is presenter audio only.

If implementation finds a slide type that is not in this table, stop and report it rather
than guessing a treatment.

## 5. HTML output contract
- Wrap every page body in a unique id, distinct per page type: #apcyber-lesson,
  #apcyber-exercise, #apcyber-quiz, #apcyber-exam.
- Apply the same CSS armor the course hub uses: all:initial!important on the wrapper,
  every rule scoped under the id, !important on every declaration, and for any colored
  text add -webkit-text-fill-color next to color.
- Every CTA and link needs the :link and :visited fix so Shopify cannot recolor it.
  This is the recurring button and title recolor problem, so it is mandatory.
- Hide the theme page title: reuse the hub selector that hides .page-title,
  .article__title, .page__title, and the first h1 in the page template, since the
  hero supplies the H1.
- Brand tokens match the hub so the lesson pages and the hub look like one course:
  purple #6B21A8, mid #7C3AED, light #A855F7, dark text #1E1B4B.

## 6. Typography and encoding (mojibake prevention)
The source JSON is full of curly quotes, em-dashes, arrows, and bullet glyphs. If those
reach Shopify as raw bytes they render as garbled characters. So:
- HTML-entity-encode all text pulled from the JSON. No raw character above ASCII 127 in
  the output. Curly quotes, the right-arrow, and the bullet all become their named entities.
- Per the house style, normalize em-dashes out of the prose (convert to a period, a
  comma, or a spaced rephrase) rather than emitting an em-dash entity. This lightly
  changes wording, so confirm it is wanted.

## 7. Handle scheme and redirects
- Generate handles deterministically from meta: unit number, lesson id, and a slug of
  the anchor or lesson title.
- Reconcile with what is live now. Example mismatch found: the 1.1 your_turn slide
  points the lesson at ap-cybersecurity-unit-1-understanding-social-engineering, but the
  current live lesson handle is ap-cybersecurity-unit-1-social-engineering. The exercise
  handle ap-cyber-unit-1-lesson-1-exercise-1 already matches live.
- Pick one convention for lesson handles, apply it everywhere, and for any live handle
  that changes, write a redirect so no SEO equity is lost.
- Output a redirects CSV with exactly three columns: Command, Path, Target.

## 8. Matrixify pages CSV
- One CSV, MERGE mode. Columns: Handle, Title, Body HTML, Command (Command is MERGE on
  every row). Add Template Suffix only if a page needs a specific template.
- Body HTML is required on every row here, so including the column is correct. Never emit
  a row with empty Body HTML, since an empty value wipes the page body.
- Never set Published At to the server time. Leave publish state alone on MERGE.
- Write CSV, not xlsx, because page bodies exceed the spreadsheet cell limit and get
  truncated silently. Quote all fields. Encode the file as utf-8 with BOM.

## 9. Quiz and exam rendering
- Honor the per-question predictFirst flag. When true, show the predict-first prompt
  before the options. When the flag is absent or false, do not add predict-first. This
  matches the rule that predict-first is off by default and appears only on the items the
  author flagged (Q1 here is a scenario item flagged true).
- Render options A through D, mark the answer, and put the ek and rationale on a
  click-to-reveal or on a separate key page, not inline on the student version.
- Optional: emphasize stem keywords (not, except, always, never) when present, since the
  house quiz style highlights them.

## 10. Validation
- Extend validate.js or add a small web check: every slide type maps to a treatment,
  every emitted internal link resolves to an emitted handle, and the output contains no
  raw character above ASCII 127.
- Run it before any import.

## 11. Run and deliverables
- Emit to a web_out/ directory. Do not overwrite out/.
- Produce: the per-page HTML, one pages.csv (MERGE), one redirects.csv.
- Report back: the lab gap answer, any slide type not in the treatment table, and the
  list of live handles that will change.

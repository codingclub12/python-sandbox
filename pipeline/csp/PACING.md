# AP CSP Course Pacing — Year-Long and Semester-Block Versions

## Governing principle: CONTENT DICTATES LENGTH
Day counts below are PLANNING ESTIMATES for calendar math, not molds.
Authoring rule: a topic gets as many days, slides, and notes pages as the
content genuinely needs — if a section needs 3 or 4 pages, it gets them; if
a topic needs another teach day, it gets one. Never trim or pad content to
hit a number. The estimate table is RECONCILED to actual authored day
counts after each Big Idea is built, and the printable pacing guides
(`pacing-year` / `pacing-block` in the course-resources phase) are generated
from the actuals. The CED itself says "most topics can be taught in one or
two class periods" and leaves pacing to the teacher — our guides suggest,
never prescribe.

Day-split model (decided): every teaching day gets its own deck, Cyber
Units 1-2 style. Multi-day topics split as day files
(`lesson-<id>-day<N>.json`): teach days carry new instruction (LOs split
across days per meta.los); practice/lab days are lighter decks (retrieval
bell ringer, exercise launches, work timers, debriefs). Quiz + guide blocks
live on the day-1 file. Common AP Traps + the I-can exit check close the
topic's FINAL day; earlier days end with `day_close` teasers.

## Hard College Board constraints (from ced.txt)
- **Create Performance Task: a minimum of 9 hours of dedicated class time**
  (program code + video + Personalized Project Reference). Non-negotiable.
- **Three investigations into computing innovations** across the year
  (beneficial/harmful effects, data use, privacy/security/storage concerns).
- Exam is early May: plan all instruction + review to finish by ~week 32.
- Exam weighting drives time share: BI3 30-35% >> BI5 21-26% > BI2 17-22%
  > BI4 11-15% > BI1 10-13%.

## Day model
A "day" = one 60-minute period. A "block" = one 90-minute period.
Topic quizzes run as the OPENER of the class after the topic closes
(15 min, spaced retrieval) — they consume no extra day.
- **1-day topic**: one deck. Quiz next-class opener.
- **2-day topic**: Day 1 teach deck + Day 2 deck (further instruction and/or
  practice — whatever the content calls for). One deck per day.
- **3+ day topic** (BI3 heavyweights): teach decks with LOs split across
  days + a lab/mini-project day deck. Days are content-driven, never capped.

## Per-topic day ESTIMATES (60-min days; teach + practice, quiz absorbed)
(Initial estimates only — see governing principle. Reconciled after authoring.)
BIG IDEA 1 — Creative Development (7 topic-days)
  1.1 Collaboration 1 · 1.2 Program Function & Purpose 2 ·
  1.3 Program Design & Development 2 · 1.4 Identifying & Correcting Errors 2
BIG IDEA 2 — Data (7) [RECONCILED to authored actuals: 2+1+2+2 = 7 — matches]
  2.1 Binary Numbers 2 · 2.2 Data Compression 1 ·
  2.3 Extracting Information from Data 2 · 2.4 Using Programs with Data 2
BIG IDEA 3 — Algorithms and Programming (34)
  3.1 Variables 2 · 3.2 Data Abstraction 2 · 3.3 Mathematical Expressions 2 ·
  3.4 Strings 1 · 3.5 Boolean Expressions 2 · 3.6 Conditionals 2 ·
  3.7 Nested Conditionals 2 · 3.8 Iteration 3 · 3.9 Developing Algorithms 2 ·
  3.10 Lists 3 · 3.11 Binary Search 1 · 3.12 Calling Procedures 2 ·
  3.13 Developing Procedures 3 · 3.14 Libraries 1 · 3.15 Random Values 1 ·
  3.16 Simulations 2 · 3.17 Algorithmic Efficiency 1 ·
  3.18 Undecidable Problems 1
BIG IDEA 4 — Computer Systems and Networks (4)
  4.1 The Internet 2 · 4.2 Fault Tolerance 1 · 4.3 Parallel & Distributed 1
BIG IDEA 5 — Impact of Computing (7)
  5.1 Beneficial & Harmful Effects 2 · 5.2 Digital Divide 1 ·
  5.3 Computing Bias 1 · 5.4 Crowdsourcing 1 ·
  5.5 Legal & Ethical Concerns 1 · 5.6 Safe Computing 1

## Projects & investigations (where they land)
- **Innovation Investigation #1** (1 day) — end of BI1: pick an innovation,
  identify purpose, program role, and one beneficial/harmful effect.
- **BI2 Data Project** (2 days) — after 2.4: analyze a real dataset in a
  spreadsheet; extract information, visualize, present a claim + its limits.
- **Innovation Investigation #2** (1 day) — inside BI4 (4.1): how an
  Internet-scale innovation moves and gathers data.
- **BI3 mini-projects** (4 days total, woven in):
  MP1 after 3.7 — decision program (input, selection, output);
  MP2 after 3.10 — list-processing program (traversal + accumulation);
  MP3 after 3.16 — random simulation with a question it answers.
  Each mini-project doubles as Create-PT skill scaffolding.
- **Innovation Investigation #3** (folded into 5.1's 2nd day) — full
  Create-adjacent write-up: data, privacy/security/storage, effects.
- **Create PT Practice Task** (3 days) — immediately after BI3 exam: a
  compressed dress rehearsal (small program w/ list + procedure + selection
  + iteration; practice video + practice Personalized Project Reference +
  practice written responses).
- **CREATE PERFORMANCE TASK** (12 days ≥ 9 mandated hours) — after the
  practice task, before BI5 (BI5's lighter reading load pairs well with
  post-PT fatigue if a school prefers swapping; both orders supported).

## YEAR-LONG map (60-min periods, ~150 days to the exam)
  Wk 1        Course launch, accounts, syllabus, collaboration norms   3
  Wk 1-3      BI1 topics (7) + Investigation #1 (1) + review/exam (2) 10
  Wk 3-5      BI2 topics (7) + Data Project (2) + review/exam (2)     11
  Wk 6-16     BI3 topics (34) + mini-projects (4) + review/exam (2)   40
  Wk 17       Create Practice Task                                     3
  Wk 18-20    CREATE PERFORMANCE TASK (mandated ≥9 hrs)               12
  Wk 21-22    BI4 topics (4) + Investigation #2 (1) + review/exam (2)  7
  Wk 23-25    BI5 topics (7, incl. Investigation #3) + review/exam (2) 9
  Wk 26-30    Spiral review: mixed-BI practice sets, Common-AP-Traps
              sweep, 2 full mock exams + item debriefs                12
  ----------------------------------------------------------------- ----
  Core total                                                         107
  Flex pool (~43 days): deep-dive track days, website mastery days,
  extra BI3 lab days, school interruptions. The deep-dive deck/notes
  variants ARE the year-long expansion — CB track fits the core count,
  deep-dive track naturally absorbs 20-30 flex days.

  Note: many schools place Create in Feb-Mar (weeks 24-27) after BI5
  instead; the guide ships both orderings as a one-page "two sequences"
  table. College Board's submission deadline (~April 30) is the only
  hard boundary.

## SEMESTER-BLOCK map (90-min blocks, ~75 blocks to the exam)
CB track only; deep-dive is homework/website enrichment. One block
typically covers a 1-2 day topic; pairs of light topics share a block.
  Launch                                                    1
  BI1 (1.1+1.2 · 1.3 · 1.4) + exam                          4
  BI2 (2.1 · 2.2+2.3 · 2.4 + data mini-lab) + exam          5
  BI3 (3.1+3.2 · 3.3+3.4 · 3.5 · 3.6+3.7 · 3.8 ·
       3.8 lab · 3.9 · 3.10 · 3.10 lab · 3.11+3.12 ·
       3.13 · 3.13 lab · 3.14+3.15 · 3.16 · 3.17+3.18)
       + 2 mini-project blocks + exam                      18
  Create Practice Task                                      2
  CREATE PT (9 hrs = 6 blocks minimum; schedule 7)          7
  BI4 (4.1 · 4.2+4.3) + exam                                3
  BI5 (5.1 · 5.2+5.3 · 5.4+5.5 · 5.6) + exam                5
  Investigations #1-3 (folded into BI1/BI4/BI5 blocks)      0
  Review + 2 mocks                                          6
  --------------------------------------------------------- --
  Core total                                               51
  Flex (~24 blocks): practice, reteach, interruptions.

## Authoring implications (binding for the fan-out)
1. DAY-SPLIT: multi-day topics ship one deck PER DAY (day files, Cyber
   Units 1-2 style). Days are content-driven — never capped, never padded.
   `guide.pacing` carries one table per day.
2. Multi-day topics MUST ship the extras bundle (exercise1, exercise2,
   discussion, lesson map) to furnish practice days.
3. Mini-project specs (MP1-MP3), the Create Practice Task, and the Create
   PT pack (timeline, checkpoints, PPR templates, scoring-row checklist,
   plagiarism/AI policy summary) are course-resource documents, authored
   in the course-resources phase alongside Start Here / How-To /
   pacing-year / pacing-block.
4. Every teacher guide's flex block already carries the quiz; pacing
   guides reference it as "next-class opener" so no topic silently
   consumes an extra day.

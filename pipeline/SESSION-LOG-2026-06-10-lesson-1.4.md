SESSION LOG — AP Cyber Lesson Pipeline — June 10, 2026 (Lesson 1.4)
====================================================================

WHAT WE DID THIS SESSION — AUTHORED LESSON 1.4 ONTO THE PIPELINE
----------------------------------------------------------------
Lesson 1.4 (AI-Based Cybersecurity Attacks) was authored as a 2-day lesson
against the repo + rules + the CED text layer (ced.txt), then validated GREEN
(validate.js exit 0) before any rendering. This is the same portability path
used for Lesson 1.3.

CED SOURCE
----------
Authored directly from the extracted CED text (ced.txt, the verified text layer
of the College Board AP Cybersecurity Course and Exam Description, Effective
Fall 2026). Topic 1.4 "AI-Based Cybersecurity Attacks", Scenario 1D
"AI-Powered Cyberattacks". All ten EK statements (1.4.A.1–A.6, 1.4.B.1–B.4) are
quoted VERBATIM in guide.eks. LOs: 1.4.A (explain how adversaries use AI-powered
tools to augment cyberattacks) and 1.4.B (explain how to protect against some
AI-augmented cyberattacks).

DAY SPLIT
---------
- Day 1 (LO 1.4.A): the six AI attack techniques, organized into two families —
  AI aimed at people (deepfake avatars A.1, native-fluent phishing A.2, AI
  reconnaissance A.5) vs. attacks on/with AI systems (prompt extraction A.3,
  training-data poisoning A.4, AI-assisted malicious coding A.6). Anchored on
  Scenario 1D as a chain (recon A.5 -> voice clone A.1). Carries the lesson-level
  quiz + guide blocks (pipeline convention: canonical quiz lives on the Day-1
  master).
- Day 2 (LO 1.4.B): the four defenses (shared secret word B.1, MFA B.2, withhold
  data from AI tools B.3, verify AI output B.4). Organizing idea: every CB
  defense works WITHOUT detecting the fake. Solves Scenario 1D, then the quiz.

QUIZ
----
5 questions on the Day-1 master. Key B-C-A-D-B (A1 B2 C1 D1, cap 2, all four
letters present, no 3-in-a-row). 100% harder-type items (3 scenario/multi +
applied). quiz_audit.js: PASS, 0 hard fails. Each item carries rationale + EK
refs. Q4 tests the full B.1–B.4 set; Q5 links the A.3 extraction risk to the
B.3 defense.

VALIDATION
----------
  node validate.js lesson-1.4-day1.json lesson-1.4-day2.json
  - day1: PASS (one benign warning: Q1 multi options non-parallel in length —
    the same accepted pattern the gold 1.2 master carries on multi items).
  - day2: PASS (clean).
Enrichment parity satisfied: the Day-1 guided_notes_preview enrichment section
is matched by an enrichment-tagged two_column slide ("Why the Old Tells Stopped
Working").

FILES ADDED THIS SESSION
------------------------
- lesson-1.4-day1.json  (slides + quiz + guide; Day-1 master)
- lesson-1.4-day2.json  (slides)
- this log

NAMING / SITE HANDLES
---------------------
meta.anchor = "AI-Powered Cyberattacks" (Scenario 1D name), consistent with the
1.2 convention of anchoring on the scenario name. Day-2 day_close bridges to
Lesson 1.5 (Leveraging AI in Cyber Defense, Scenario 1E).
CAVEAT — the your_turn / lesson-page / exercise / quiz URLs follow the
established site handle pattern (ap-cybersecurity-unit-1-ai-based-attacks,
ap-cyber-unit-1-lesson-4-exercise-1/2, ap-cyber-unit-1-lesson-4-quiz) but were
NOT fetched to confirm they are live (200). Spot-check in a browser, or adjust
to the real published handles, before posting.

NOT DONE THIS SESSION (deliberate / next)
-----------------------------------------
- Rendering the binaries (decks, guided notes, quiz, teacher guide) was NOT run.
  The JSON masters are the durable asset; render.js + emit_docs.js + emit_extras.js
  regenerate everything and require the npm deps (pptxgenjs, docx). Run the
  pipeline in an environment with those installed to produce the .pptx/.docx.
- Confirm the Lesson 1.4 site handles above.
- Lesson 1.5 (AI in Cyber Defense, Scenario 1E) is the next authoring target;
  then rebuild 2.2 per the prior backlog.

// emit_course_docs.js — top-level course resources: project rubric + pacing guides.
//   node emit_course_docs.js --doc=rubric|pacing-year|pacing-block --out=PATH
const H = require('./helpers');
const { p, h2, h3, bullet, numItem, callout, dataTable, titleBlock, buildDoc, save, run, C } = H;

let doc = 'rubric', out = null;
process.argv.slice(2).forEach(a => {
  if (a.startsWith('--doc=')) doc = a.split('=')[1];
  if (a.startsWith('--out=')) out = a.split('=')[1];
});

// ============================================================ PROJECT RUBRIC
function rubric() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Capstone Project',
    'Threat Defense Report — Rubric',
    'A 20-point cumulative project: analyze an organization, identify its threats, assess the risk, and recommend layered defenses across the CED domains.'));

  k.push(h2('The assignment'));
  k.push(p('Students act as a security analyst for a given organization (a small clinic, a school, or a startup). They produce a Threat Defense Report that (1) identifies the organization’s vulnerabilities, (2) assesses the risk of each, and (3) recommends specific managerial, physical, and technical controls that close each gap. The report pulls across the whole course — social engineering, networks, devices, applications, and data.'));
  k.push(callout('Suggested use', [
    p('Run it as an end-of-course capstone (about one week) or split it across units, adding a section as each unit finishes. Either way it is the natural home for the running case scenarios (1A–1E, 2A) and the High/Moderate/Low risk language from Topic 3.1.C.'),
  ], 'tip'));

  k.push(h2('Scoring — 5 criteria × 4 points = 20'));
  k.push(p([run('Score each criterion 1–4 using the descriptors below. ', { italics: true, color: C.GRAY }),
            run('4 = Exceeds · 3 = Meets · 2 = Approaching · 1 = Beginning.', { italics: true, color: C.GRAY })]));

  const W = [2280, 1900, 1900, 1900, 1900]; // = 9880
  const head = ['Criterion (/4)', 'Exceeds (4)', 'Meets (3)', 'Approaching (2)', 'Beginning (1)'];
  const rows = [
    ['Threats & vulnerabilities identified',
     'All major vulnerabilities named correctly and tied to specific EKs',
     'Most vulnerabilities named correctly; minor gaps',
     'Some vulnerabilities found; several missed or mislabeled',
     'Few/inaccurate; little CED grounding'],
    ['Risk assessment (impact × likelihood)',
     'Every threat rated High/Mod/Low with impact AND likelihood justified',
     'Most threats rated with reasonable justification',
     'Ratings given but thinly or inconsistently justified',
     'Ratings missing or unjustified'],
    ['Defenses recommended',
     'Specific managerial, physical, AND technical controls mapped to each threat',
     'Appropriate controls for most threats; mostly mapped',
     'Generic controls; weak mapping to threats',
     'Few or mismatched controls'],
    ['Security reasoning',
     'Uses CIA triad and defense-in-depth accurately; scenario-true throughout',
     'Sound reasoning with minor slips',
     'Partial reasoning; some inaccuracies',
     'Reasoning unclear or incorrect'],
    ['Communication & evidence',
     'Clear, organized, well-cited (EKs/sources); professional tone',
     'Organized and mostly cited',
     'Understandable but loosely organized or thinly cited',
     'Disorganized; little evidence'],
  ];
  k.push(dataTable(head, rows, W));

  k.push(h2('Converting to a grade'));
  k.push(bullet([run('18–20 ', { bold: true }), run('— Exemplary analyst report (A)')]));
  k.push(bullet([run('15–17 ', { bold: true }), run('— Solid, exam-ready reasoning (B)')]));
  k.push(bullet([run('12–14 ', { bold: true }), run('— Developing; revise the weakest criterion (C)')]));
  k.push(bullet([run('Below 12 ', { bold: true }), run('— Reteach risk assessment and control mapping before moving on')]));

  k.push(callout('CED alignment', [
    p('The five criteria mirror the CED’s analytic skills: identify vulnerabilities, assess and document risk (e.g., 3.1.C, 4.1.D, 5.1.C), and recommend the managerial/physical/technical controls each unit teaches. The report is a direct rehearsal for AP free-response scenario items.'),
  ], 'info'));
  return k;
}

// ============================================================ FULL-YEAR PACING
function pacingYear() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Pacing',
    'Full-Year Pacing Guide',
    '124 instructional days + 5 unit tests across 5 units — paced for a standard ~180-day year with built-in time for the capstone project and AP review.'));

  k.push(h2('At a glance'));
  k.push(p('Daily 45–55 minute periods. Each lesson runs its numbered teaching days plus one assessment day; each unit closes with a cumulative unit test. The running case scenario (1A→1E in Unit 1; 2A in Unit 2) threads the lessons together.'));

  const W = [1450, 3650, 1450, 1650, 1680]; // = 9880
  k.push(dataTable(['Weeks', 'Unit', 'Lessons', 'Class days', 'Assessment'], [
    ['1–4',   'Unit 1 — Introduction to Security',        '1.1–1.5', '19', 'Unit 1 test'],
    ['5–9',   'Unit 2 — Securing Spaces',                 '2.1–2.4', '25', 'Unit 2 test'],
    ['10–14', 'Unit 3 — Securing Networks',               '3.1–3.5', '25', 'Unit 3 test'],
    ['15–18', 'Unit 4 — Securing Devices',                '4.1–4.4', '19', 'Unit 4 test'],
    ['19–25', 'Unit 5 — Securing Applications & Data',    '5.1–5.6', '36', 'Unit 5 test'],
    ['26–28', 'Capstone — Threat Defense Report',         'Project', '~12', 'Project rubric'],
    ['29–34', 'AP review & practice exams',               'Review',  '~28', 'Practice exams'],
    ['35–36', 'AP Exam window + post-exam enrichment',    '—',       '—',  'AP Exam'],
  ], W));

  k.push(h2('Lessons by day count'));
  k.push(dataTable(['Unit', 'Lesson — teaching days (+ quiz)'], [
    ['1', '1.1 (2) · 1.2 (4) · 1.3 (4) · 1.4 (2) · 1.5 (2)  — 14 + 5 quiz = 19'],
    ['2', '2.1 (8) · 2.2 (5) · 2.3 (4) · 2.4 (4)  — 21 + 4 quiz = 25'],
    ['3', '3.1 (6) · 3.2 (3) · 3.3 (2) · 3.4 (2) · 3.5 (7)  — 20 + 5 quiz = 25'],
    ['4', '4.1 (6) · 4.2 (5) · 4.3 (2) · 4.4 (2)  — 15 + 4 quiz = 19'],
    ['5', '5.1 (5) · 5.2 (7) · 5.3 (4) · 5.4 (5) · 5.5 (2) · 5.6 (7)  — 30 + 6 quiz = 36'],
  ], [900, 8980]));

  k.push(callout('Flex built in', [
    p('The content fits in ~26 weeks, leaving roughly 10 weeks for the capstone, AP practice exams, and reteach. Tight on time? Teach the CB Standard (green) track only and treat Deep Dive (blue) days as enrichment — see the block guide for which days compress.'),
  ], 'tip'));
  return k;
}

// ============================================================ BLOCK / SEMESTER PACING
function pacingBlock() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Pacing',
    'Block & Semester Pacing Guide',
    'Two compressed tracks: a 90-minute block schedule (two lesson-days per block) and a single-semester plan that prioritizes the CB-required core.'));

  k.push(h2('Block schedule (90-minute periods)'));
  k.push(p('Combine two consecutive lesson-days into one block; run the assessment as the back half of the block on quiz days. Roughly half the meetings of a daily schedule.'));
  const W = [760, 3140, 980, 2100, 1450, 1450]; // = 9880
  k.push(dataTable(['Unit', 'Title', 'Lessons', 'Class days (teach + quiz)', 'Blocks', 'Test'], [
    ['1', 'Introduction to Security',      '5', '14 + 5 = 19', '~10', '½ block'],
    ['2', 'Securing Spaces',               '4', '21 + 4 = 25', '~13', '½ block'],
    ['3', 'Securing Networks',             '5', '20 + 5 = 25', '~13', '½ block'],
    ['4', 'Securing Devices',              '4', '15 + 4 = 19', '~10', '½ block'],
    ['5', 'Securing Applications & Data',  '6', '30 + 6 = 36', '~18', '½ block'],
  ], W));
  k.push(p([run('Total ≈ 64 blocks of content', { bold: true }), run(' (about 13 teaching weeks on an A/B rotation), leaving room for the capstone and AP review within a typical block year.')]));

  k.push(h2('Single-semester (compressed) track'));
  k.push(p('To fit one semester, teach the CB Standard (green) track and compress the Deep Dive (blue) enrichment. Priorities:'));
  k.push(numItem([run('Keep every assessment day and the running scenario lessons ', { bold: true }), run('— they carry the CB-required skills the exam tests.')]));
  k.push(numItem([run('Compress multi-day single-deck lessons ', { bold: true }), run('(3.1, 3.5, 5.2, 5.6) by merging the enrichment days; the teacher guide marks which segments are Deep Dive.')]));
  k.push(numItem([run('Assign the standalone exercises as homework ', { bold: true }), run('rather than in-class, recovering one day per lesson.')]));
  k.push(numItem([run('Move the capstone to a take-home ', { bold: true }), run('graded by the Threat Defense Report rubric.')]));

  k.push(callout('How to read “compress”', [
    p('Every day’s pacing table tags its segments. Green/CB-required segments stay; blue/Deep-Dive segments are the first to fold into homework or to drop under time pressure. No CB-required EK is ever in a blue-only segment.'),
  ], 'info'));
  return k;
}

// ============================================================ START HERE
function startHere() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Complete Course',
    'Start Here',
    'A 60-second orientation: where everything lives, and the two documents to open first.'));

  k.push(h2('Open these first'));
  k.push(bullet([run('How_To_Use_This_Course.docx ', { bold: true, color: C.NAVY }), run('— the full teaching workflow: what every file is, the two tracks, the daily rhythm, and a before/during/after routine.')]));
  k.push(bullet([run('Course_Resources/ ', { bold: true, color: C.NAVY }), run('— the Full-Year and Block/Semester pacing guides, and the Threat Defense Report project rubric.')]));

  k.push(h2('How the course is organized'));
  k.push(p('Five units, 24 lessons. Each lesson folder contains:'));
  k.push(bullet([run('Slide_Decks/ ', { bold: true }), run('— Day#_Deck_TEACHER.pptx (Deep Dive, with speaker notes) + Day#_Deck_STUDENT.pptx (CB Standard).')]));
  k.push(bullet([run('Guided_Notes/ ', { bold: true }), run('— Day#_Notes_STUDENT.docx (fill-in) + Day#_Notes_KEY.docx (answers).')]));
  k.push(bullet([run('Quiz/ ', { bold: true }), run('— Quiz_STUDENT.docx + Quiz_KEY.docx.')]));
  k.push(bullet([run('Teacher_Guide.docx ', { bold: true }), run('— objectives, the day-by-day pacing table, misconceptions, and the answer key.')]));
  k.push(bullet([run('Supplements/ ', { bold: true }), run('— standalone Exercise 1 & 2 (student + key), a Discussion, and a Lesson Map.')]));
  k.push(p([run('Each unit also ships ', {}), run('_Unit_<N>_Test_STUDENT.docx', { bold: true }), run(' and ', {}), run('_Unit_<N>_Test_KEY.docx', { bold: true }), run('.')]));

  k.push(h2('Three conventions to know'));
  k.push(bullet([run('Two tracks — ', { bold: true }), run('CB Standard (green, exam-required) is the student materials; Deep Dive (blue, enrichment) is the teacher materials.')]));
  k.push(bullet([run('Daily QOTD — ', { bold: true }), run('every day opens with a Question of the Day coded U#/L#.#/Q# (the Q-number is the day number).')]));
  k.push(bullet([run('Pacing “Slides” column — ', { bold: true }), run('a slide range points into the deck; ', {}), run('Handout', { bold: true }), run(' is a printed packet/lab/quiz; ', {}), run('Website', { bold: true }), run(' is the daily page.')]));

  k.push(callout('Quality standard', [
    p('Every quiz and unit test passes an automated MCQ audit (four options, balanced key, majority scenario/applied items, complete rationales, exact EK citations), and all content is grounded in the College Board CED. All files are editable .docx and .pptx.'),
  ], 'tip'));
  return k;
}

const MAP = { 'rubric': rubric, 'pacing-year': pacingYear, 'pacing-block': pacingBlock, 'start-here': startHere };
const LABEL = { 'rubric': 'Threat Defense Report — Rubric', 'pacing-year': 'Full-Year Pacing Guide', 'pacing-block': 'Block & Semester Pacing Guide', 'start-here': 'Start Here' };
if (!MAP[doc]) { console.error('Unknown --doc=' + doc); process.exit(1); }
save(buildDoc(LABEL[doc], MAP[doc](), 'Course Resources'), out || ('/tmp/' + doc + '.docx'))
  .then(p2 => console.log('emitted: ' + p2));

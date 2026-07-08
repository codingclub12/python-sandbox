// emit_csp_resources.js — self-contained course-resources doc emitter for
// AP Computer Science Principles (CSP green theme).
//   node emit_csp_resources.js --doc=<type> --out=PATH
// Doc types: start-here | how-to | pacing-year | pacing-block |
//            create-pack | data-project | investigations
//
// Content grounding:
//   - Pacing docs -> PACING.md (reconciled day counts + year/block maps).
//   - Create pack / investigations -> ced.txt (Create PT requirements, the six
//     scoring rows, WR prompt categories, program components, video specs, PPR
//     rule, plagiarism/AI policy, IOC investigation content). Facts are kept
//     faithful to the CED; nothing about CB requirements is invented here.
const H = require('./helpers');
const { p, h2, h3, bullet, numItem, callout, dataTable, titleBlock,
        buildDoc, save, run, C } = H;

let doc = 'start-here', out = null;
process.argv.slice(2).forEach(a => {
  if (a.startsWith('--doc=')) doc = a.split('=')[1];
  if (a.startsWith('--out=')) out = a.split('=')[1];
});

// small helpers for repeated run styling
const b = (t) => run(t, { bold: true });
const bn = (t) => run(t, { bold: true, color: C.NAVY });
const gray = (t) => run(t, { italics: true, color: C.GRAY });

// ============================================================ START HERE
function startHere() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Complete Course',
    'Start Here',
    'A 60-second orientation to the whole course: what is inside, how the files are organized, how the website layer works, and what to do on day one.'));

  k.push(h2('What is in this course'));
  k.push(p('A complete, College Board CED-aligned AP Computer Science Principles course built around the five Big Ideas. Every topic ships a front-of-room slide deck, fill-in guided notes, a topic quiz, and supplements, plus the course-level resources that carry the year: pacing guides, the Create Performance Task pack, the Big Idea 2 data project, and the three computing-innovation investigations.'));
  k.push(bullet([bn('Big Idea 1 — Creative Development'), run(' (collaboration, program purpose, design, debugging).')]));
  k.push(bullet([bn('Big Idea 2 — Data'), run(' (binary, compression, extracting information, using programs with data).')]));
  k.push(bullet([bn('Big Idea 3 — Algorithms and Programming'), run(' (the largest Big Idea: variables through procedures, iteration, lists, simulations).')]));
  k.push(bullet([bn('Big Idea 4 — Computer Systems and Networks'), run(' (the Internet, fault tolerance, parallel and distributed computing).')]));
  k.push(bullet([bn('Big Idea 5 — Impact of Computing'), run(' (beneficial and harmful effects, the digital divide, bias, safe computing).')]));

  k.push(h2('The file architecture'));
  k.push(p('Everything nests the same way, so any file is easy to find:'));
  k.push(p([b('Big Idea'), run('  >  '), b('Topic'), run('  >  '), b('Slide_Decks / Guided_Notes / Quiz / Supplements')]));
  k.push(dataTable(['Folder', 'What lives there'], [
    ['Slide_Decks/', 'The teaching deck for each day of the topic, with speaker notes. Multi-day topics ship one deck per day.'],
    ['Guided_Notes/', 'The student fill-in packet (print version) plus the answer key. Mirrors the deck section by section.'],
    ['Quiz/', 'The topic quiz and its key. Runs as a short spaced-retrieval opener the class after the topic closes.'],
    ['Supplements/', 'Exercises, discussion prompts, and lesson maps that furnish practice and lab days.'],
  ], [2600, 7280]));

  k.push(h2('Two tracks: CB-Standard vs. Deep-Dive'));
  k.push(bullet([bn('CB-Standard'), run(' — exactly what the AP exam requires. This is the spine of the student-facing materials; nothing here is optional.')]));
  k.push(bullet([bn('Deep-Dive'), run(' — CB-Standard plus enrichment that explains the "why." It lives in the teacher deck and the extended notes, and it is the first thing to fold into homework when time is short.')]));
  k.push(callout('Rule of thumb', [
    p('Teach from the Deep-Dive teacher deck; hand students the CB-Standard packet. Everything CB-Standard is non-negotiable for the exam; everything Deep-Dive is enrichment that absorbs the flex days in the year-long plan.'),
  ], 'tip'));

  k.push(h2('How the website layer works'));
  k.push(p('The classroom materials have a parallel web layer so students can work and recover content online:'));
  k.push(bullet([b('Student PIN gate — '), run('each topic has a guided-notes web page behind a student PIN. Students open the page, complete the guided notes and checks-for-understanding (CFUs) there, and submit them digitally.')]));
  k.push(bullet([b('Teacher gate — '), run('the resource hub (keys, teacher decks, this pack, pacing, the Create tools) sits behind a separate teacher gate and is never exposed on the student-facing pages.')]));

  k.push(h2('The daily workflow'));
  k.push(p('Every teaching day follows the same rhythm:'));
  k.push(numItem([b('Teacher teaches from the deck'), run(' — front of room, section by section, using the speaker notes.')]));
  k.push(numItem([b('Students do the guided notes and CFUs on the site'), run(' — behind the student PIN gate, they fill the matching section as you teach.')]));
  k.push(numItem([b('Topic quiz next class'), run(' — the quiz opens the following class as a 15-minute spaced-retrieval warm-up; it consumes no extra day.')]));

  k.push(h2('Your first day — a 60-second checklist'));
  k.push(numItem('Skim How to Use This Course and the Full-Year Pacing Guide (both in this resource pack).'));
  k.push(numItem('Set the student PIN for the topic 1.1 guided-notes page; set your teacher gate for the hub.'));
  k.push(numItem('Open the topic 1.1 teacher deck in presenter view; print or post the 1.1 guided notes.'));
  k.push(numItem('Confirm students can reach the 1.1 web page and enter the PIN.'));
  k.push(numItem('Teach 1.1 (Collaboration) from the deck; students complete the notes and CFUs on the site.'));
  k.push(numItem('Next class, open with the 1.1 quiz as the retrieval warm-up, then start 1.2.'));

  k.push(callout('Where to go next', [
    p([b('How to Use This Course'), run(' explains running a topic day by day, the two tracks, quizzes as openers, differentiation, and how the Create PT, investigations, and projects fit the year.')]),
  ], 'info'));
  return k;
}

// ============================================================ HOW TO USE
function howTo() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Teacher Onboarding',
    'How to Use This Course',
    'The deeper guide: how to run a topic day by day, use the two tracks and the website, assess with quizzes and Big Idea exams, differentiate, and fit the Create PT, investigations, and projects into the year.'));

  k.push(h2('Running a topic, day by day'));
  k.push(p('A "day" is one 60-minute period. Single-day topics ship one deck; multi-day topics (common in Big Idea 3) ship one deck per day. Teach days carry new instruction; practice or lab days are lighter decks with a retrieval bell-ringer, exercise launches, work timers, and debriefs.'));
  k.push(numItem([b('Open'), run(' — a retrieval bell-ringer (or the prior topic quiz on quiz days) to activate prior knowledge.')]));
  k.push(numItem([b('Instruct by section'), run(' — teach the deck; students fill the matching section of the guided notes on the site.')]));
  k.push(numItem([b('Check for understanding'), run(' — the CFUs on the web page give you a live read before moving on.')]));
  k.push(numItem([b('Close'), run(' — the final day of a topic ends with the Common AP Traps and the "I can" exit check; earlier days end with a day-close teaser.')]));

  k.push(h2('Using the speaker notes'));
  k.push(p('Open the teacher deck in presenter view. The speaker notes carry timing cues, cold-call prompts, misconception alerts at the flagged slides, and the Deep-Dive talking points. The student deck is the same slides with the Deep-Dive enrichment removed, safe to post or share.'));

  k.push(h2('The two tracks in practice'));
  k.push(bullet([bn('CB-Standard'), run(' — the exam-required core. Everything a student needs to pass sits here.')]));
  k.push(bullet([bn('Deep-Dive'), run(' — enrichment that deepens understanding. Under time pressure, assign Deep-Dive segments as homework or on the website rather than dropping the concept entirely.')]));
  k.push(p([gray('No CB-required content ever lives in a Deep-Dive-only segment, so compressing to CB-Standard never removes anything the exam tests.')]));

  k.push(h2('Guided notes: print vs. the gated web page'));
  k.push(bullet([b('Print version — '), run('the fill-in packet in Guided_Notes/. Use it when devices are down or you want a paper artifact to collect.')]));
  k.push(bullet([b('Gated web page — '), run('the same notes behind the student PIN gate, with CFUs students submit digitally. This is the default day-to-day path and it auto-collects the work.')]));
  k.push(p([gray('Answer keys and teacher decks stay behind the teacher gate; only student notes, the student deck, and practice go on student-facing pages.')]));

  k.push(h2('Quizzes as spaced-retrieval openers'));
  k.push(p('Each topic quiz runs as the opener of the class after the topic closes — about 15 minutes, low-stakes, spaced retrieval. It reactivates the prior topic before new instruction and consumes no extra day in the pacing.'));

  k.push(h2('The Big Idea exams'));
  k.push(p('Each Big Idea closes with a cumulative exam that pulls across its topics and mirrors the AP multiple-choice style (single-select, reading-passage, and multi-select items). Use the results to decide whether to spend a flex day reteaching before the next Big Idea.'));

  k.push(h2('Differentiation'));
  k.push(bullet([b('Need more challenge — '), run('assign the Deep-Dive segments and the harder supplement exercises; point students at the extension prompts on the web page.')]));
  k.push(bullet([b('Need more support — '), run('stay on the CB-Standard track, use the guided-notes scaffolds, and reuse the quiz items as additional retrieval practice.')]));
  k.push(bullet([b('Pacing pressure — '), run('multi-day topics are content-driven; a topic that needs another teach day gets one, and the flex pool in the year plan absorbs it.')]));

  k.push(h2('How the Create PT, investigations, and projects fit the year'));
  k.push(p('Four course-level pieces thread through the calendar and are documented in their own packs:'));
  k.push(bullet([b('Create Performance Task — '), run('a mandated minimum of 9 hours of dedicated class time, scheduled as a ~12-day block after Big Idea 3 and a short practice task. See the Create pack.')]));
  k.push(bullet([b('Three computing-innovation investigations — '), run('one at the end of Big Idea 1, one inside 4.1, and one folded into 5.1. See the investigations handout.')]));
  k.push(bullet([b('Big Idea 2 data project — '), run('a 2-day dataset analysis after 2.4 that scaffolds the Create PT. See the data-project handout.')]));
  k.push(bullet([b('Big Idea 3 mini-projects — '), run('woven in after 3.7, 3.10, and 3.16; each doubles as Create-PT skill practice.')]));
  k.push(callout('Two sequences for Create', [
    p('The course supports placing the Create PT in January-February (right after Big Idea 3) or in February-March (after Big Idea 5). The only hard boundary is the College Board submission deadline in late April. The Full-Year Pacing Guide ships both orderings.'),
  ], 'info'));
  return k;
}

// ============================================================ PACING — YEAR
function pacingYear() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Pacing',
    'Full-Year Pacing Guide',
    'For 60-minute daily periods, ~150 days to the early-May exam. Day counts are reconciled to the authored course; content dictates length, so treat every number as a suggestion, not a cap.'));

  k.push(h2('Governing principle'));
  k.push(p('The CED itself says most topics can be taught in one or two class periods and leaves pacing to the teacher. Day counts here are planning estimates reconciled to the actual authored topics — a topic gets as many days as its content genuinely needs. The Deep-Dive track is the year-long expansion: the CB-Standard track fits the core count, and Deep-Dive naturally absorbs the flex days.'));

  k.push(h2('Reconciled days per Big Idea'));
  k.push(dataTable(['Big Idea', 'Topics', 'Topic-days', 'Exam weight (MCQ)'], [
    ['BI1 — Creative Development', '1.1-1.4', '7  (1+2+2+2)', '10-13%'],
    ['BI2 — Data', '2.1-2.4', '7  (2+1+2+2)', '17-22%'],
    ['BI3 — Algorithms & Programming', '3.1-3.18', '~34', '30-35%'],
    ['BI4 — Computer Systems & Networks', '4.1-4.3', '4  (2+1+1)', '11-15%'],
    ['BI5 — Impact of Computing', '5.1-5.6', '8  (2+1+1+1+1+2)', '21-26%'],
  ], [3600, 1500, 2680, 2100]));
  k.push(p([gray('BI5 runs one day over its 7-day estimate: topic 5.6 (Safe Computing) earned a second day for its large Essential-Knowledge load, per the content-dictates-length principle.')]));

  k.push(h2('Year-long map (60-min periods, ~150 days to the exam)'));
  k.push(dataTable(['Weeks', 'Block', 'Includes', 'Days'], [
    ['Wk 1', 'Course launch', 'Accounts, syllabus, collaboration norms', '3'],
    ['Wk 1-3', 'Big Idea 1', 'BI1 topics (7) + Investigation #1 (1) + review/exam (2)', '10'],
    ['Wk 3-5', 'Big Idea 2', 'BI2 topics (7) + Data Project (2) + review/exam (2)', '11'],
    ['Wk 6-16', 'Big Idea 3', 'BI3 topics (34) + mini-projects (4) + review/exam (2)', '40'],
    ['Wk 17', 'Create Practice Task', 'Compressed dress rehearsal of the Create PT', '3'],
    ['Wk 18-20', 'CREATE PERFORMANCE TASK', 'Mandated minimum of 9 hours of class time', '12'],
    ['Wk 21-22', 'Big Idea 4', 'BI4 topics (4) + Investigation #2 (1) + review/exam (2)', '7'],
    ['Wk 23-25', 'Big Idea 5', 'BI5 topics (7, incl. Investigation #3) + review/exam (2)', '9'],
    ['Wk 26-30', 'Spiral review', 'Mixed-BI practice, Common-AP-Traps sweep, 2 mock exams + debriefs', '12'],
  ], [1150, 2200, 5230, 1300]));
  k.push(p([b('Core total 107 days. '), run('Flex pool ~43 days: Deep-Dive track days, website mastery days, extra BI3 lab days, and school interruptions. The Deep-Dive variants are the year-long expansion and absorb 20-30 of the flex days.')]));

  k.push(h2('Where each project, investigation, and exam falls'));
  k.push(dataTable(['Item', 'Days', 'Lands'], [
    ['Innovation Investigation #1', '1', 'End of BI1'],
    ['BI2 Data Project', '2', 'After 2.4'],
    ['BI3 mini-projects (MP1-MP3)', '4', 'After 3.7, after 3.10, after 3.16'],
    ['Innovation Investigation #2', '1', 'Inside BI4 (4.1)'],
    ['Innovation Investigation #3', '1', "Folded into 5.1's 2nd day"],
    ['Create Practice Task', '3', 'Immediately after the BI3 exam'],
    ['Create Performance Task', '12', 'After the practice task, before BI5'],
    ['Big Idea exams', '1 each', 'Close of each Big Idea (in the review/exam allotment)'],
  ], [3400, 1000, 5480]));

  k.push(callout('Two sequences', [
    p([b('Sequence A (default): '), run('Create in January-February, right after Big Idea 3, then Big Ideas 4-5.')]),
    p([b('Sequence B: '), run('teach Big Ideas 4-5 first and run Create in February-March — its lighter reading load pairs well with post-PT fatigue. Both orderings are supported; the College Board submission deadline in late April is the only hard boundary.')]),
  ], 'info'));
  return k;
}

// ============================================================ PACING — BLOCK
function pacingBlock() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Pacing',
    'Semester-Block Pacing Guide',
    'For 90-minute blocks, ~75 blocks to the exam. CB-Standard track only; Deep-Dive runs as homework and website enrichment. One block typically covers a 1-2 day topic, and pairs of light topics share a block.'));

  k.push(h2('How the block schedule compresses'));
  k.push(p('A block is one 90-minute period. On a block schedule the Deep-Dive track becomes homework and website enrichment rather than in-class time, so the core fits comfortably. Topic quizzes still run as the opener of the next block (about 15 minutes) and consume no extra block.'));

  k.push(h2('Semester-block map (90-min blocks)'));
  k.push(dataTable(['Segment', 'Blocks contents', 'Blocks'], [
    ['Launch', 'Accounts, syllabus, collaboration norms', '1'],
    ['Big Idea 1', '1.1+1.2 · 1.3 · 1.4  + exam', '4'],
    ['Big Idea 2', '2.1 · 2.2+2.3 · 2.4 + data mini-lab  + exam', '5'],
    ['Big Idea 3', '3.1+3.2 · 3.3+3.4 · 3.5 · 3.6+3.7 · 3.8 · 3.8 lab · 3.9 · 3.10 · 3.10 lab · 3.11+3.12 · 3.13 · 3.13 lab · 3.14+3.15 · 3.16 · 3.17+3.18  + 2 mini-project blocks + exam', '18'],
    ['Create Practice Task', 'Compressed dress rehearsal', '2'],
    ['CREATE PT', '9 hours = 6 blocks minimum; schedule 7', '7'],
    ['Big Idea 4', '4.1 · 4.2+4.3  + exam', '3'],
    ['Big Idea 5', '5.1 · 5.2+5.3 · 5.4+5.5 · 5.6  + exam', '5'],
    ['Investigations #1-3', 'Folded into the BI1 / BI4 / BI5 blocks', '0'],
    ['Review + 2 mocks', 'Mixed practice and two full mock exams', '6'],
  ], [1900, 6480, 1500]));
  k.push(p([b('Core total 51 blocks. '), run('Flex ~24 blocks: practice, reteach, and interruptions.')]));

  k.push(callout('Reading this guide', [
    p('The three computing-innovation investigations do not consume their own blocks here — they are folded into the Big Idea 1, 4, and 5 blocks. The Create PT is budgeted at 7 blocks so the mandated minimum of 9 hours (6 blocks) has a margin. Under real time pressure, compress the Deep-Dive enrichment first; no CB-required content is ever Deep-Dive-only.'),
  ], 'tip'));
  return k;
}

// ============================================================ CREATE PACK
function createPack() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Performance Task',
    'AP Create Performance Task — Teacher & Student Pack',
    'The single most important resource in the course. Everything needed to run the Create PT: the mandated hours, a day-by-day timeline, the program checklist, the six scoring rows, the written-response prompts, the Personalized Project Reference, the video rules, and the plagiarism and generative-AI policy.'));

  k.push(h2('Overview and the mandated hours'));
  k.push(p('The Create Performance Task is Section II of the AP exam and is worth 30% of the score. Students independently design and build a program of their own choosing, then submit three artifacts: the program code, a video of the program running, and a Personalized Project Reference. In the exam, two written-response questions (four prompts) about the program are answered in 60 minutes.'));
  k.push(callout('Non-negotiable: at least 9 hours of class time', [
    p('The College Board requires a minimum of 9 hours of dedicated class time for students to complete the Create Performance Task (program code, video, and Personalized Project Reference). Build these hours into the calendar; they are not homework hours.'),
  ], 'warn'));

  k.push(h2('Day-by-day timeline (~12 days)'));
  k.push(p('A suggested schedule for 60-minute periods. The 9 mandated hours are the in-class work days; surrounding days set up and close the task.'));
  k.push(dataTable(['Day', 'Focus', 'What happens'], [
    ['1', 'Launch & idea', 'Review requirements and the rubric; brainstorm program ideas that can hit every component; approve topics.'],
    ['2', 'Plan the program', 'Sketch the input, the list, the procedure, and the output; write a development plan.'],
    ['3', 'Build: input & data', 'Implement the input and set up the list (or other collection) that manages complexity.'],
    ['4', 'Build: procedure', 'Write the student-developed procedure with a parameter and an algorithm using sequencing, selection, and iteration.'],
    ['5', 'Build: integration', 'Add calls to the procedure and the output based on input; get an end-to-end first version running.'],
    ['6', 'Test & debug', 'Test with different inputs; find and correct errors; confirm each required component is present.'],
    ['7', 'Refine', 'Improve functionality and clean up; make sure the procedure genuinely manages complexity.'],
    ['8', 'Record the video', 'Capture the program running: input, functionality, and output, under 1 minute, no voice narration.'],
    ['9', 'Personalized Project Reference', 'Capture the two Procedure segments and the two List segments; check no comments or course content appear.'],
    ['10', 'Written responses (draft)', 'Draft answers to the four prompts (WR1, WR2a, WR2b, WR2c) referencing their own code.'],
    ['11', 'Written responses (finalize)', 'Revise the written responses for accuracy; verify every claim matches the submitted program.'],
    ['12', 'Assemble & submit', 'Assemble program code, video, Personalized Project Reference, and responses; verify formats; submit in the Digital Portfolio.'],
  ], [700, 2500, 6680]));

  k.push(h2('Program component checklist'));
  k.push(p('Every submitted program must be student-developed and must include all of the following:'));
  k.push(dataTable(['Component', 'What it means, in plain language'], [
    ['Input', 'The program takes input from the user, a device, an online data stream, or a file — something that can change what the program does.'],
    ['A list (or other collection)', 'At least one list or other collection type used to manage complexity — storing many values under one name instead of many separate variables.'],
    ['A student-developed procedure', 'A procedure the student wrote, with a name, a return type if needed, one or more parameters, and an algorithm that includes sequencing, selection, AND iteration.'],
    ['A call to that procedure', 'The program actually calls the student-developed procedure (not just defines it).'],
    ['Output', 'Output based on the input and the program’s functionality (tactile, audible, visual, or textual).'],
  ], [3000, 6880]));
  k.push(callout('Language note', [
    p('There is no designated programming language, but HTML is not acceptable for the Create task. The Exam Reference Sheet defines the common pseudocode used on the exam.'),
  ], 'info'));

  k.push(h2('The six scoring rows'));
  k.push(p('The Create task is scored on six rubric rows. Each row is tied to a computational-thinking skill code. Design the task so a student can plainly earn all six.'));
  k.push(dataTable(['Row', 'What it assesses', 'Skill', 'How a student earns it'], [
    ['Video', 'The program running end to end', '2.B', 'Submit a video that clearly shows input, functionality, and output of the program.'],
    ['Program Requirements', 'All required components are present', '2.B', 'Program includes input, a list managing complexity, a student-developed procedure, a call to it, and output.'],
    ['WR1', 'Program design, function, and purpose', '1.A', 'In writing, describe the program’s purpose, what it does, and how the video demonstrates a feature.'],
    ['WR2(a)', 'Algorithm development', '4.A', 'Explain how the student-developed procedure’s algorithm works, including its sequencing, selection, and iteration.'],
    ['WR2(b)', 'Errors and testing', '4.C', 'Describe two calls to the procedure with different inputs, the conditions tested, and the results.'],
    ['WR2(c)', 'Data and procedural abstraction', '3.C', 'Explain how the list and the procedure each manage complexity — how the abstraction helps.'],
  ], [900, 2900, 700, 5380]));

  k.push(h2('The four written-response prompts'));
  k.push(bullet([bn('WR1 — Program Design, Function, and Purpose'), run(' — asks what the program does, its intended purpose, and a description of a feature demonstrated in the video.')]));
  k.push(bullet([bn('WR2(a) — Algorithm Development'), run(' — asks students to explain their student-developed procedure and the algorithm inside it (its sequencing, selection, and iteration).')]));
  k.push(bullet([bn('WR2(b) — Errors and Testing'), run(' — asks about calling the procedure with different arguments and the different results, showing testing and reasoning about behavior.')]));
  k.push(bullet([bn('WR2(c) — Data and Procedural Abstraction'), run(' — asks how the list and the procedure each manage complexity, i.e., how abstraction helps the program.')]));

  k.push(h2('Personalized Project Reference (PPR) template'));
  k.push(p('Students submit a Personalized Project Reference alongside the code. It contains exactly four captured code segments and nothing else:'));
  k.push(bullet([b('Procedure segment 1 — '), run('the definition of the student-developed procedure (its header and body).')]));
  k.push(bullet([b('Procedure segment 2 — '), run('a call to that procedure in the program.')]));
  k.push(bullet([b('List segment 1 — '), run('the code that stores data in the list.')]));
  k.push(bullet([b('List segment 2 — '), run('the code that uses the data in that list.')]));
  k.push(callout('Hard rule on the PPR', [
    p('No comments and no course content are allowed on the Personalized Project Reference — only the four captured code segments. Anything beyond the code segments is not permitted on the reference.'),
  ], 'warn'));

  k.push(h2('Video requirements'));
  k.push(bullet('At most 1 minute long.'));
  k.push(bullet('At most 30 MB in size.'));
  k.push(bullet('Shows the program running: input, functionality, and output.'));
  k.push(bullet('No voice narration (audio integral to the program is acceptable; narration explaining the program is not).'));

  k.push(h2('Plagiarism and generative-AI policy'));
  k.push(p('Summarized from the CED, and worth reading aloud to students before day 1:'));
  k.push(bullet([b('Plagiarism scores a 0. '), run('Using another person’s work, or work produced by generative AI, without crediting it, results in a score of 0 on the Create Performance Task.')]));
  k.push(bullet([b('Generative AI is permitted as a supplementary resource. '), run('Students may use it to support their work, but they are responsible for understanding and being able to explain their code. If they cannot explain it, they cannot defend it in the written responses.')]));
  k.push(callout('For the first-year teacher', [
    p('Keep the whole task in class where you can attest it is the student’s own work, require students to talk through their procedure and list before the video, and grade the written responses against the six rows above. If a student cannot explain a code segment, that is the signal to slow down — not to accuse.'),
  ], 'tip'));
  return k;
}

// ============================================================ DATA PROJECT
function dataProject() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Big Idea 2',
    'Big Idea 2 Data Project',
    'A 2-day dataset-analysis project after topic 2.4: extract information from a real dataset, visualize it, and present a claim together with the claim’s limits. It scaffolds the data reasoning the Create PT and Big Idea 5 both demand.'));

  k.push(h2('The task'));
  k.push(p('Working in a spreadsheet, students take a real dataset, use it to answer a question, build a visualization that supports their answer, and present a single claim — along with an honest statement of what the data does and does not let them conclude. The emphasis is on turning raw data into information and being clear about the limits of that information.'));
  k.push(callout('Where it lands', [
    p('Runs across 2 days immediately after topic 2.4 (Using Programs with Data), inside the Big Idea 2 block of the pacing guide.'),
  ], 'info'));

  k.push(h2('Steps'));
  k.push(numItem([b('Choose a dataset and a question — '), run('pick a real, public dataset and a question the data can actually answer.')]));
  k.push(numItem([b('Clean and filter — '), run('remove or flag missing and malformed rows; filter to the relevant records so the analysis is honest.')]));
  k.push(numItem([b('Extract information — '), run('use sorting, filtering, and formulas to pull out the pattern that answers the question.')]));
  k.push(numItem([b('Visualize — '), run('build one clear chart (bar, line, or scatter) whose form fits the data and supports the claim.')]));
  k.push(numItem([b('State the claim and its limits — '), run('write one specific claim the data supports, then name at least two limits: bias in the data source, missing values, sample size, or correlation that is not causation.')]));
  k.push(numItem([b('Present — '), run('a 2-3 minute share-out: the question, the visualization, the claim, and the limits.')]));

  k.push(h2('Simple rubric (12 points)'));
  k.push(dataTable(['Criterion (/3)', 'Exceeds (3)', 'Meets (2)', 'Beginning (1)'], [
    ['Information extracted', 'Correct, relevant information cleanly pulled from the data', 'Mostly correct with minor gaps', 'Little relevant information extracted'],
    ['Visualization', 'Chart form fits the data and clearly supports the claim', 'Readable chart, loosely tied to the claim', 'Chart missing or mismatched'],
    ['Claim', 'One specific claim well grounded in the data', 'A claim, but broad or thinly supported', 'No clear claim'],
    ['Limits of the claim', 'Names two or more real limits (bias, missing data, sample, causation)', 'Names one limit', 'No limits acknowledged'],
  ], [2280, 2900, 2400, 2300]));

  k.push(h2('How it scaffolds the Create PT'));
  k.push(bullet([b('Managing complexity with a collection — '), run('working a dataset in a spreadsheet previews using a list to manage complexity in the Create program.')]));
  k.push(bullet([b('Input to output — '), run('data in, information out mirrors the Create requirement that output be based on input.')]));
  k.push(bullet([b('Honest reasoning — '), run('naming a claim’s limits builds the careful, defensible explanation the Create written responses reward.')]));
  k.push(bullet([b('Impact awareness — '), run('spotting bias and limits in data feeds directly into Big Idea 5 and Investigation #3.')]));
  return k;
}

// ============================================================ INVESTIGATIONS
function investigations() {
  const k = [];
  k.push(...titleBlock('AP Computer Science Principles · Impact of Computing',
    'Computing Innovation Investigations #1-3',
    'The three required investigations into computing innovations, spread across the year. Students examine a real innovation’s purpose, the program at its core, its beneficial and harmful effects, the data it uses, and its privacy, security, and storage concerns.'));

  k.push(h2('Why three investigations'));
  k.push(p('The course requires students to investigate computing innovations across the year: a computing innovation includes a program as an integral part, and students learn to describe its purpose and effects, how it uses data, and the privacy, security, and storage concerns that come with it. Spacing three investigations across the year builds the reasoning the Create task and the Big Idea 5 impact questions both need.'));

  k.push(h2('Where each investigation lands'));
  k.push(dataTable(['Investigation', 'Lands', 'Depth'], [
    ['#1', 'End of Big Idea 1 (1 day)', 'Introductory: pick an innovation; identify its purpose, the program’s role, and one beneficial and one harmful effect.'],
    ['#2', 'Inside Big Idea 4, topic 4.1 (1 day)', 'Internet-scale: how an Internet-based innovation moves and gathers data across a network.'],
    ['#3', "Folded into topic 5.1's second day (1 day)", 'Full Create-adjacent write-up: data use, privacy/security/storage, and beneficial/harmful effects together.'],
  ], [1400, 2900, 5580]));

  k.push(h2('Common template (students fill this in)'));
  k.push(p('Each investigation uses the same template so the skill compounds. Investigation #1 completes the top rows; #2 adds the data-movement rows; #3 completes all of it.'));
  k.push(numItem([b('Innovation & purpose — '), run('name the computing innovation and describe its intended purpose (the program is an integral part of it).')]));
  k.push(numItem([b('Program role — '), run('describe what the program at the core of the innovation actually does.')]));
  k.push(numItem([b('Beneficial effect — '), run('describe at least one beneficial effect on society, the economy, or culture.')]));
  k.push(numItem([b('Harmful effect — '), run('describe at least one harmful effect; note that a single effect can be both beneficial and harmful to different people.')]));
  k.push(numItem([b('Data use — '), run('what data does the innovation consume or produce, and how does it use that data to generate information?')]));
  k.push(numItem([b('Privacy — '), run('what personally identifiable information (PII) could be collected, and how could it be misused?')]));
  k.push(numItem([b('Security & storage — '), run('what are the security and data-storage concerns, and how are users protected (or not)?')]));
  k.push(numItem([b('Unintended use — '), run('how might the innovation be used beyond its intended purpose, for good or harm?')]));

  k.push(callout('Grounding for the effects rows', [
    p('An effect of a computing innovation can be both beneficial and harmful, and innovations often have impact beyond their intended purpose. The privacy rows rest on the idea that personally identifiable information can be aggregated, exploited, or used to harm a person when privacy protections are ignored. Have students name real effects, not framework codes.'),
  ], 'info'));

  k.push(h2('A simple check'));
  k.push(bullet('Investigation #1 is complete when the top four rows are specific and accurate.'));
  k.push(bullet('Investigation #2 adds a clear account of how data moves across the Internet in that innovation.'));
  k.push(bullet('Investigation #3 is complete when every row is filled and the privacy/security/storage analysis is concrete — the rehearsal for explaining a computing innovation’s impact.'));
  return k;
}

// ============================================================ DISPATCH
const MAP = {
  'start-here': startHere,
  'how-to': howTo,
  'pacing-year': pacingYear,
  'pacing-block': pacingBlock,
  'create-pack': createPack,
  'data-project': dataProject,
  'investigations': investigations,
};
const LABEL = {
  'start-here': 'Start Here',
  'how-to': 'How to Use This Course',
  'pacing-year': 'Full-Year Pacing Guide',
  'pacing-block': 'Semester-Block Pacing Guide',
  'create-pack': 'AP Create Performance Task — Teacher & Student Pack',
  'data-project': 'Big Idea 2 Data Project',
  'investigations': 'Computing Innovation Investigations #1-3',
};

if (!MAP[doc]) { console.error('Unknown --doc=' + doc + ' (types: ' + Object.keys(MAP).join(', ') + ')'); process.exit(1); }
save(buildDoc(LABEL[doc], MAP[doc](), 'Course Resources'), out || ('/tmp/res_' + doc + '.docx'))
  .then(pth => console.log('emitted: ' + pth));

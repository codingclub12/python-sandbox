// emit_howto.js — top-level "How to Use This Course" teacher onboarding guide.
const H = require('./helpers');
const { p, h1, h2, h3, bullet, numItem, callout, dataTable, titleBlock, buildDoc, save, run, C } = H;

const k = [];

k.push(...titleBlock(
  'AP Computer Science Principles · Teacher Onboarding',
  'How to Use This Course',
  'A concise workflow for running the AP Computer Science Principles Teacher Superpack — what every file is, the daily rhythm, and how it all maps to your website.'
));

// ---------------------------------------------------------------- overview
k.push(h2('What this course is'));
k.push(p('A complete, College Board CED–aligned AP Computer Science Principles course: 5 units, 24 lessons, each fully resourced with slide decks, fill-in guided notes, a teacher guide, and an assessment. Every Essential Knowledge statement in the CED is taught, and a running case scenario threads through each unit (1A→' +
  '1E in Unit 1; 2A across Unit 2) so skills compound instead of resetting each lesson.'));
k.push(callout('The one idea that ties it together', [
  p([run('Every lesson exists in two parallel forms: the ', {}), run('classroom', { bold: true }), run(' (decks + notes + guide) and the ', {}), run('website', { bold: true }), run(' (a daily page that mirrors the exact same structure). Anything a student misses in class, they can recover from the lesson page — the answer keys and teacher materials stay with you.', {})]),
], 'tip'));

// ---------------------------------------------------------------- files
k.push(h2('What each file is for'));
k.push(dataTable(['File (in every lesson folder)', 'What it is — and when you use it'], [
  ['Teacher_Guide.docx', 'Your lesson plan: objectives, the day-by-day pacing table, common misconceptions, differentiation, and the quiz answer key. Read this first.'],
  ['Slide_Decks/Day#_Deck_TEACHER.pptx', 'Front-of-room deck (Deep Dive track) with speaker notes on every slide — timing cues, cold-call prompts, and misconception alerts.'],
  ['Slide_Decks/Day#_Deck_STUDENT.pptx', 'The student-facing copy (CB Standard track) — enrichment slides removed. Post it or share it for review.'],
  ['Guided_Notes/Day#_Notes_STUDENT.docx', 'The fill-in packet students complete live as you teach the deck. Collect it at the end of class.'],
  ['Guided_Notes/Day#_Notes_KEY.docx', 'The answer key (answers shown in purple). Teacher copy only — never posted to the site.'],
  ['Quiz/Quiz_STUDENT.docx + Quiz_KEY.docx', 'The end-of-lesson assessment and its key. The same key is reprinted at the bottom of the Teacher Guide so they can never drift apart.'],
  ['Supplements/ (where present)', 'Exercises, discussion prompts, and a lesson map — extra practice that the website also hosts.'],
], [3500, 6380]));

// ---------------------------------------------------------------- tracks
k.push(h2('The two tracks: CB Standard vs. Deep Dive'));
k.push(bullet([run('CB Standard (green) — ', { bold: true, color: C.NAVY }), run('exactly what the AP exam requires. The student decks and notes follow this track.')]));
k.push(bullet([run('Deep Dive (blue) — ', { bold: true, color: C.NAVY }), run('CB Standard plus enrichment slides that explain the “why.” The teacher decks and the answer-key notes use this track.')]));
k.push(p([run('Rule of thumb: ', { italics: true, color: C.GRAY }), run('teach from the Deep Dive teacher deck; hand students the CB Standard packet. Short on time? Everything green is non-negotiable; everything blue is optional.', { italics: true, color: C.GRAY })]));

// ---------------------------------------------------------------- daily rhythm
k.push(h2('The daily rhythm (every day follows the same shape)'));
k.push(p('Each numbered day runs about 50 minutes and repeats a predictable structure, so students always know what comes next:'));
k.push(numItem([run('QOTD + bell ringer ', { bold: true }), run('— a Question of the Day (coded U#/L#.#/Q#) and a short hook to activate prior knowledge.')]));
k.push(numItem([run('Guided-notes preview + objectives ', { bold: true }), run('— students see the sections they will fill in and the CB learning objectives.')]));
k.push(numItem([run('Instruction by section ', { bold: true }), run('— you teach the deck; students fill the matching section of their notes.')]));
k.push(numItem([run('Stop and Think ', { bold: true }), run('— independent written response on the packet that mirrors AP free-response phrasing.')]));
k.push(numItem([run('Wrap + Your Turn ', { bold: true }), run('— a one-screen recap and the website practice to assign.')]));

// ---------------------------------------------------------------- reading the pacing table
k.push(h2('Reading the pacing table'));
k.push(p('Each Teacher Guide has a pacing table per day with three columns:'));
k.push(bullet([run('Segment ', { bold: true }), run('— the activity, in order, with the EK numbers it covers.')]));
k.push(bullet([run('Slides ', { bold: true }), run('— where the material lives: a '), run('slide range', { bold: true }), run(' (e.g., 5–7) points into that lesson’s deck; '), run('Handout', { bold: true }), run(' means a printed packet, lab, or quiz; '), run('Website', { bold: true }), run(' means the daily page (the QOTD and day-2+ openers live there).')]));
k.push(bullet([run('Time ', { bold: true }), run('— minutes for that segment; the segments sum to roughly one class period.')]));
k.push(callout('Single-deck units', [
  p('Units 1–2 ship one deck per day. Units 3–5 ship one deck per lesson taught over several days — the pacing table’s day-by-day rows tell you which slides to cover each day. That is why a Slides value can read “Website” once the day’s deck portion is done.'),
], 'info'));

// ---------------------------------------------------------------- workflow
k.push(h2('Recommended workflow'));
k.push(h3('Before class'));
k.push(bullet('Open the Teacher Guide; skim the objectives, the day’s pacing row, and the Common Misconceptions.'));
k.push(bullet('Print (or assign digitally) the Day# student notes and, on assessment days, the quiz.'));
k.push(bullet('Have the Day# TEACHER deck open in presenter view to see the speaker notes.'));
k.push(h3('During class'));
k.push(bullet('Run the QOTD + bell ringer, then teach the deck section by section while students fill the matching notes section.'));
k.push(bullet('Use the speaker-note misconception alerts at the flagged slides; give the Stop and Think its full independent time.'));
k.push(bullet('Close with the wrap slide and point students to the website page for that lesson.'));
k.push(h3('After class'));
k.push(bullet('Collect the guided notes; spot-check against the KEY.'));
k.push(bullet('Re-use the next day’s QOTD as spaced retrieval of today’s content.'));
k.push(bullet('Assess with the lesson quiz, then the cumulative unit test at the end of the unit.'));

// ---------------------------------------------------------------- assessment + scenarios
k.push(h2('Assessment & the case scenarios'));
k.push(bullet([run('Lesson quizzes ', { bold: true }), run('— audited multiple-choice + scenario items; the key is in the quiz folder and at the foot of the Teacher Guide.')]));
k.push(bullet([run('Unit tests ', { bold: true }), run('— cumulative assessments that pull across the whole unit.')]));
k.push(bullet([run('Scenario threads ', { bold: true }), run('— a single story builds across each unit (1A→1B→1C→1D→1E in Unit 1; 2A through Unit 2), so each lesson advances one case rather than starting over.')]));

k.push(callout('Setting up your website to match', [
  p('The pacing tables assume your site has one page per lesson that mirrors this daily structure, plus a QOTD numbered U#/L#.#/Q# where Q# is the day number. Keep answer keys, teacher decks, and KEY notes off the public site; post the student deck, student notes, and practice. Then every “Website” cell in the pacing table has a real destination.'),
], 'tip'));

const out = process.argv[2] || '/tmp/How_To_Use_This_Course.docx';
save(buildDoc('How to Use This Course', k, 'Teacher Onboarding'), out)
  .then(() => console.log('emitted: ' + out));

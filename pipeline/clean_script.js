#!/usr/bin/env node
// clean_script.js — produce a voiceover-ready narration transcript from a lesson file.
// Strips EK codes, learning-objective codes, unit/lesson/day boilerplate, and "cite the EK"
// asides from each slide's teacher script, then tidies the punctuation seams left behind.
// Usage: node clean_script.js lesson-2.1-day1.json [--out=out/U2_2.1_d1_Voiceover.txt]
//        add --classroom to ALSO drop classroom-management lines (collect notes, write URL, etc.)

const fs = require('fs');

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const outArg = (args.find(a => a.startsWith('--out=')) || '').split('=')[1];
const dropClassroom = args.includes('--classroom');
if (!file) { console.error('usage: node clean_script.js <lesson.json> [--out=..] [--classroom]'); process.exit(1); }

function clean(input) {
  let s = ' ' + input + ' ';

  // --- unit / lesson / day boilerplate -> keep just the lesson name ---
  s = s.replace(/Unit \d+,\s*[^,]+,\s*and\s+Lesson \d+\.\d+,\s*/gi, '');     // "Unit 2, Securing Spaces, and Lesson 2.1, "
  s = s.replace(/\s*[—–-]\s*Day \d+ of \d+/gi, '');                          // " — Day 1 of 8"
  s = s.replace(/\bDay \d+ of \d+/gi, '');                                   // bare "Day 1 of 8"
  s = s.replace(/\bThe end-of-lesson quiz[^.]*\bA through [A-Z]\.?/gi, '');  // span-of-topic note

  // --- learning-objective codes ---
  s = s.replace(/\bis\s+learning objective \d+\.\d+\.[A-Z]:?/gi, 'covers');  // "is learning objective 2.1.A:" -> "covers"
  s = s.replace(/\b(all under|under)\s+learning objective \d+\.\d+\.[A-Z]\b,?/gi, ''); // "all under learning objective 2.1.A,"
  s = s.replace(/\b[Ll]earning objective \d+\.\d+\.[A-Z]\b\.?:?/g, '');      // any remaining "Learning objective 2.1.A."
  s = s.replace(/\bStill \d+\.\d+\.[A-Z]\b\.?/g, '');                        // "Still 2.1.A."

  // --- "EK X.x is the ... and EK Y.y is the ..." ordinal phrasing (before code stripping) ---
  s = s.replace(/\b(?:EK )?\d+\.\d+\.[A-Z]\.1\b(?=\s+is\s+the\b)/g, 'the first');
  s = s.replace(/\b(?:EK )?\d+\.\d+\.[A-Z]\.2\b(?=\s+is\s+the\b)/g, 'the second');

  // --- "cite the EK" / "with its EK number" asides (do BEFORE removing the codes) ---
  s = s.replace(/,?\s*(?:and\s+)?cit(?:e|ing)\s+(?:the\s+|each\s+)?EK(?:\s+numbers?)?/gi, '');
  s = s.replace(/,?\s*each\s+(?:tied to its|with its)\s+EK(?:\s+number)?/gi, '');
  s = s.replace(/,?\s*with\s+(?:its|their)\s+EK\s+numbers?/gi, '');
  s = s.replace(/,?\s*and\s+(?:its|their)\s+EK\s+numbers?(\s+cold)?/gi, '$1');
  s = s.replace(/\s+and\s+EK\s+numbers?\b/gi, '');          // "by name and EK number" -> "by name"
  s = s.replace(/\s+with\s+EK\s+numbers?\b/gi, '');
  s = s.replace(/,?\s*label\s+each\s+one\s+with\s+its\s+EK\s+number/gi, ', label each one');
  s = s.replace(/,?\s*name\s+its\s+EK\b/gi, '');
  s = s.replace(/\bWrite both EKs\b/gi, 'Write both');      // "Write both EKs" -> "Write both"
  s = s.replace(/\bboth EKs\b/gi, 'both');
  s = s.replace(/,?\s*(?:and\s+)?(?:say\s+)?which\s+EK\s+(?:that\s+)?illustrates\b/gi, '');
  s = s.replace(/,?\s*(?:every row\s+)?cites?\s+(?:its\s+)?(?:risk\s+)?EK\b/gi, '');
  s = s.replace(/,?\s*(?:their|its)\s+EK\s+numbers?\b/gi, '');   // ", their EK numbers,"
  s = s.replace(/\s+with\s+EKs\b/gi, '');                       // "Both, with EKs."
  s = s.replace(/,?\s*(?:be precise\s+)?with\s+(?:the|every)\s+EK\s+numbers?\b/gi, '');
  s = s.replace(/,?\s*name\s+the\s+EK\b/gi, '');
  s = s.replace(/\bname all (three|four|five) with EKs\b/gi, 'name all $1');

  // --- ordinal codes used as nouns: "A.1 is the why and A.2 is the setup" ---
  s = s.replace(/\b[A-Z]\.1\b(?=\s+is\s+the\b)/g, 'the first');
  s = s.replace(/\b[A-Z]\.2\b(?=\s+is\s+the\b)/g, 'the second');

  // --- EK codes themselves (4-part EK 2.1.A.5 and 3-part topic EK 2.1.B) ---
  s = s.replace(/,\s*EK \d+\.\d+\.[A-Z](?:\.\d+)?\b/g, '');   // ", EK 2.1.A.2" / ", EK 2.1.B" (inline)
  s = s.replace(/\bEK \d+\.\d+\.[A-Z](?:\.\d+)?,\s*/g, '');   // "EK 2.1.A.5, " (label prefix)
  s = s.replace(/\bEK \d+\.\d+\.[A-Z](?:\.\d+)?\b/g, '');     // any remaining "EK 2.1.A.5" / "EK 2.1.B"
  s = s.replace(/\b\d+\.\d+\.[A-Z]\.\d+\b/g, '');             // bare "2.1.A.5"
  s = s.replace(/\b\d+\.\d+\.[A-Z]\b/g, '');                  // bare "2.1.A"
  // bare single-letter EK refs and ranges: "B.2 through B.7", "F.2 and F.3", "G.3"
  s = s.replace(/\b[A-Z]\.\d+\s+through\s+[A-Z]\.\d+\b/g, '');
  s = s.replace(/\b[A-Z]\.\d+\s+and\s+[A-Z]\.\d+\b/g, '');
  s = s.replace(/,?\s*\b[A-Z]\.\d+\b/g, '');

  // --- seam repairs where a code had been used as an appositive/noun ---
  s = s.replace(/,\s*—/g, ' —');           // "bollards, — prevent" -> "bollards — prevent"
  s = s.replace(/\bthe whole of[,.]/gi, 'the whole topic.');
  s = s.replace(/\bcross into\s+and\b/gi, 'cross into');
  s = s.replace(/\breasoning of\s+—/gi, 'reasoning —');
  s = s.replace(/\bwhat\s+is tested on\b/gi, 'what the exam tests');
  s = s.replace(/\bthe trap the exam sets in\b\.?/gi, 'the trap the exam sets.');

  // --- optional: classroom-management lines (only with --classroom) ---
  if (dropClassroom) {
    s = s.replace(/[^.!?]*\bI collect Guided Notes[^.!?]*[.!?]/gi, '');
    s = s.replace(/[^.!?]*\bWrite the lesson page URL[^.!?]*[.!?]/gi, '');
    s = s.replace(/[^.!?]*\bHold your answers[^.!?]*[.!?]/gi, '');
  }

  // --- tidy the seams ---
  s = s.replace(/\s+([,.;:!?])/g, '$1');     // space before punctuation
  s = s.replace(/([,;:])(\s*[,;:])+/g, '$1'); // doubled separators
  s = s.replace(/,\s*\./g, '.');             // ", ." -> "."
  s = s.replace(/\.\s*\.+/g, '.');           // ".." -> "."
  s = s.replace(/:\s*\./g, '.');             // ": ." -> "."
  s = s.replace(/\(\s*\)/g, '');             // empty parens
  s = s.replace(/\s{2,}/g, ' ');
  s = s.replace(/\s+—\s+—\s+/g, ' — ');      // doubled dashes
  // capitalize after sentence end if a lowercase slipped through a removal
  s = s.replace(/([.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
  return s.trim();
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const slides = (data.slides || []).filter(s => s.script);
const lessonId = (data.meta && data.meta.lessonId) || file;
const title = (data.meta && data.meta.title) || '';

let out = `VOICEOVER SCRIPT — Lesson ${lessonId}${title ? ' · ' + title : ''}\n`;
out += '='.repeat(60) + '\n\n';
slides.forEach((s, i) => {
  out += `[Slide ${i + 1}]\n${clean(s.script)}\n\n`;
});

const outPath = outArg || file.replace(/\.json$/, '_Voiceover.txt');
fs.writeFileSync(outPath, out);
console.log(`wrote ${outPath} (${slides.length} slides)`);

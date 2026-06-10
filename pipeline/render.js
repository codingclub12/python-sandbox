// ============================================================================
// APCSExamPrep Slide Renderer v1
// ============================================================================
// Usage:
//   node render.js <lesson.json> [--variant=teacher|student] [--out=path.pptx]
//
// Design tokens are LOCKED in the C, F, and SIZE constants below.
// Edit the JSON to change content. Edit this file to change design.
// ============================================================================

const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

// ---------- LOCKED DESIGN TOKENS ----------
const C = {
  primary:    '6B21A8',  // purple
  primaryAlt: '7C3AED',  // light purple
  bgTint:     'EDE9FE',  // very light purple background
  cardTint:   'F5F0FF',  // card surface
  dark:       '1E1B4B',  // dark indigo (titles, dividers)
  darker:     '0F0A2E',  // even darker for title slide
  body:       '1F2937',  // body text
  muted:      '6B7280',  // muted text
  white:      'FFFFFF',
  amber:      'F59E0B',  // accent for callouts (warm-up / bell ringer circles)
  amberSoft:  'FEF3C7',
  teal:       '0F766E',  // site / practice circles + Your Turn slide
  tealSoft:   'CCFBF1',
  tealDeep:   '0B5C56',
  redSoft:    'FEE2E2',
  red:        'DC2626',
  greenSoft:  'D1FAE5',
  green:      '059669',
  cbGreen:    '047857',  // CB-required tag color
  enrichBlue: '1D4ED8',  // enrichment tag color
  border:     'E5E7EB',
};

const F = {
  header: 'Calibri',
  body:   'Calibri',
  serif:  'Cambria',   // title slide H1, section-divider + final-summary headings (2.x visual standard)
  mono:   'Courier New',  // universally available; avoids character-spacing issues with Consolas
};

// LAYOUT_WIDE: 13.3" x 7.5"
const W = 13.333;
const H = 7.5;

// Margins
const M = {
  edge: 0.5,
  top: 0.5,
  contentTop: 1.1,
  footerY: 7.05,
};

// ---------- PARSE ARGS ----------
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node render.js <lesson.json> [--variant=teacher|student] [--track=cb|deepdive] [--out=path.pptx]');
  process.exit(1);
}
const inputPath = args[0];
let variant = 'teacher';
let track = 'deepdive';  // default: all slides
let outPath = null;
for (const a of args.slice(1)) {
  if (a.startsWith('--variant=')) variant = a.split('=')[1];
  if (a.startsWith('--track=')) track = a.split('=')[1];
  if (a.startsWith('--out=')) outPath = a.split('=')[1];
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const meta = data.meta;
let slides = data.slides;

// Filter by track. A slide is included if:
//   - track === 'deepdive' (everything goes in)
//   - track === 'cb' AND slide has no track field OR slide.track === 'cb'
//   - any slide explicitly marked track: 'enrichment' is EXCLUDED from cb track
if (track === 'cb') {
  slides = slides.filter(s => s.track !== 'enrichment');
}

// Drop teacher-only slides from student renders
if (variant === 'student') {
  slides = slides.filter(s => s.variant !== 'teacher');
}

if (!outPath) {
  const trackLabel = track === 'cb' ? 'CB_Standard' : 'Deep_Dive';
  const dayLabel = meta.day ? `Day_${meta.day}_` : '';
  const base = `${meta.course.replace(/\s+/g, '_')}_Lesson_${meta.lessonId}_${dayLabel}${trackLabel}_${variant}.pptx`;
  outPath = path.join('/mnt/user-data/outputs', base);
}

// ---------- PRESENTATION SETUP ----------
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = `${meta.course} - Lesson ${meta.lessonId}: ${meta.lessonTitle}`;
pres.author = 'AP CS Exam Prep';
pres.company = 'APCSExamPrep.com';
pres.revision = '1';

// ---------- HELPERS ----------
function addFooter(slide, slideNum, totalSlides) {
  // Footer line
  slide.addShape(pres.shapes.LINE, {
    x: M.edge, y: M.footerY - 0.05, w: W - 2 * M.edge, h: 0,
    line: { color: C.border, width: 0.75 },
  });
  // Left: branding (with subtle edition tag for the teacher variant only)
  const editionSuffix = variant === 'teacher' ? '  \u00b7  Teacher Edition' : '';
  slide.addText([
    { text: 'APCSExamPrep.com', options: { color: C.primary, bold: true } },
    { text: `  \u00b7  Lesson ${meta.lessonId}  \u00b7  Slide ${slideNum} of ${totalSlides}${editionSuffix}`, options: { color: C.muted } },
  ], {
    x: M.edge, y: M.footerY, w: 8, h: 0.3,
    fontFace: F.body, fontSize: 9, align: 'left', valign: 'top', margin: 0,
  });
  // Right: AP trademark + license
  slide.addText('AP\u00ae is a trademark of the College Board, which was not involved in the production of this resource.', {
    x: 8.5, y: M.footerY, w: W - 8.5 - M.edge, h: 0.3,
    fontFace: F.body, fontSize: 7.5, color: C.muted, align: 'right', valign: 'top', italic: true, margin: 0,
  });
}

function addTopBar(slide) {
  // Subtle top accent bar (NOT a thick decorative band)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.08,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
}

function tagPill(slide, x, y, tag) {
  // Tag is "CB" or "ENRICH"
  const isCB = tag === 'CB';
  const label = isCB ? 'CB REQUIRED' : 'ENRICHMENT';
  const fill = isCB ? C.greenSoft : 'DBEAFE';
  const color = isCB ? C.cbGreen : C.enrichBlue;
  const w = isCB ? 1.05 : 1.1;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h: 0.25,
    fill: { color: fill }, line: { color: fill, width: 0 }, rectRadius: 0.04,
  });
  slide.addText(label, {
    x, y, w, h: 0.25,
    fontFace: F.body, fontSize: 8, bold: true, color, align: 'center', valign: 'middle', margin: 0,
  });
}

function addSlideHeader(slide, eyebrow, title) {
  if (eyebrow) {
    slide.addText(eyebrow.toUpperCase(), {
      x: M.edge, y: 0.4, w: W - 2 * M.edge, h: 0.3,
      fontFace: F.body, fontSize: 10, bold: true, color: C.primary,
      align: 'left', margin: 0,
    });
  }
  if (title) {
    slide.addText(title, {
      x: M.edge, y: eyebrow ? 0.7 : 0.5, w: W - 2 * M.edge, h: 0.7,
      fontFace: F.header, fontSize: 32, bold: true, color: C.dark,
      align: 'left', valign: 'top', margin: 0,
    });
  }
}

// Color-coded numbered circle (2.x motif): amber=warm-up, teal=site/practice, purple=core.
function numberedCircle(slide, x, y, n, fillHex, d) {
  const dia = d || 0.34;
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: dia, h: dia,
    fill: { color: fillHex }, line: { color: fillHex, width: 0 },
  });
  slide.addText(String(n), {
    x, y, w: dia, h: dia,
    fontFace: F.body, fontSize: 13, bold: true, color: C.white,
    align: 'center', valign: 'middle', margin: 0,
  });
}

// ============================================================================
// SLIDE TYPE BUILDERS
// ============================================================================

function buildTitle(slide, s) {
  slide.background = { color: C.darker };

  // Diagonal accent shape (subtle)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: 0.15,
    fill: { color: C.primaryAlt }, line: { color: C.primaryAlt, width: 0 },
  });

  // Edition tag (top-right) - distinguishes teacher vs student variants visually
  const editionLabel = variant === 'teacher' ? 'TEACHER EDITION' : 'STUDENT EDITION';
  const editionColor = variant === 'teacher' ? C.amber : C.primaryAlt;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: W - M.edge - 2.0, y: 0.45, w: 1.7, h: 0.38,
    fill: { color: editionColor }, line: { color: editionColor, width: 0 }, rectRadius: 0.04,
  });
  slide.addText(editionLabel, {
    x: W - M.edge - 2.0, y: 0.45, w: 1.7, h: 0.38,
    fontFace: F.body, fontSize: 10, bold: true, color: C.white,
    align: 'center', valign: 'middle', margin: 0,
  });

  // Pacing header (top-left) - LESSON-RELATIVE ONLY ("Day N of M"). Never an absolute
  // course-period number: fire drills/snow days make any absolute count wrong.
  if (meta.day && meta.totalDays) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge + 0.5, y: 0.5, w: 1.7, h: 0.38,
      fill: { color: C.dark }, line: { color: C.primaryAlt, width: 1 }, rectRadius: 0.04,
    });
    slide.addText(`DAY ${meta.day} OF ${meta.totalDays}`, {
      x: M.edge + 0.5, y: 0.5, w: 1.7, h: 0.38,
      fontFace: F.body, fontSize: 10, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
  }

  // Eyebrow
  slide.addText(s.eyebrow || meta.unit, {
    x: M.edge + 0.5, y: 2.3, w: W - 2 * (M.edge + 0.5), h: 0.4,
    fontFace: F.body, fontSize: 14, bold: true, color: C.primaryAlt,
    align: 'left', margin: 0,
  });

  // Title (serif - 2.x visual standard)
  slide.addText(s.title, {
    x: M.edge + 0.5, y: 2.8, w: W - 2 * (M.edge + 0.5), h: 1.6,
    fontFace: F.serif, fontSize: 54, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  // Subtitle
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: M.edge + 0.5, y: 4.5, w: W - 2 * (M.edge + 0.5) - 1, h: 0.7,
      fontFace: F.body, fontSize: 18, color: 'D8B4FE', italic: true,
      align: 'left', valign: 'top', margin: 0,
    });
  }

  // Bottom accent
  slide.addShape(pres.shapes.LINE, {
    x: M.edge + 0.5, y: 6.0, w: 4, h: 0,
    line: { color: C.primaryAlt, width: 3 },
  });

  slide.addText(s.footerLeft || `${meta.course} \u00b7 CB V.1 Framework`, {
    x: M.edge + 0.5, y: 6.2, w: 8, h: 0.3,
    fontFace: F.body, fontSize: 11, color: 'A5A0C7', align: 'left', margin: 0,
  });
  slide.addText(s.footerRight || 'APCSExamPrep.com', {
    x: W - 4 - M.edge - 0.5, y: 6.2, w: 4, h: 0.3,
    fontFace: F.body, fontSize: 11, color: 'A5A0C7', align: 'right', margin: 0, bold: true,
  });
  // Speaker notes feature callout (teacher only) - surfaces the hidden value
  if (variant === 'teacher') {
    slide.addText('Speaker notes on every slide: timing cues, cold-call prompts, misconception alerts.', {
      x: M.edge + 0.5, y: 6.95, w: W - 2 * (M.edge + 0.5), h: 0.3,
      fontFace: F.body, fontSize: 10, color: C.amber, italic: true, align: 'left', margin: 0,
    });
  }
}

function buildBellRinger(slide, s) {
  slide.background = { color: C.bgTint };
  addTopBar(slide);
  addSlideHeader(slide, s.eyebrow || 'Bell Ringer', null);

  // Big quote-style prompt card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.2, y: 1.6, w: W - 2.4, h: 4.5,
    fill: { color: C.white }, line: { color: C.border, width: 1 },
    shadow: { type: 'outer', color: '000000', blur: 12, offset: 3, angle: 90, opacity: 0.08 },
  });
  // Left accent bar - amber encodes "warm-up" (2.x color-coding)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.2, y: 1.6, w: 0.12, h: 4.5,
    fill: { color: C.amber }, line: { color: C.amber, width: 0 },
  });

  // Big quote mark
  slide.addText('\u201C', {
    x: 1.5, y: 1.7, w: 1, h: 1.2,
    fontFace: 'Georgia', fontSize: 96, color: C.amber, bold: true, align: 'left', valign: 'top', margin: 0,
  });

  // Main prompt
  slide.addText(s.prompt, {
    x: 2.4, y: 2.2, w: W - 2.4 - 1.5, h: 2.0,
    fontFace: F.header, fontSize: 24, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });

  // Sub-prompt
  if (s.subprompt) {
    slide.addText(s.subprompt, {
      x: 2.4, y: 4.4, w: W - 2.4 - 1.5, h: 0.9,
      fontFace: F.body, fontSize: 17, italic: true, color: C.body,
      align: 'left', valign: 'top', margin: 0,
    });
  }

}

function buildObjectives(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, 'Lesson Objectives', s.heading || 'Today You Will...');

  const startY = 1.7;
  const rowH = 0.75;
  s.items.forEach((item, i) => {
    const y = startY + i * rowH;
    // Checkbox icon
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge + 0.2, y: y + 0.1, w: 0.32, h: 0.32,
      fill: { color: C.cardTint }, line: { color: C.primary, width: 1.5 }, rectRadius: 0.04,
    });
    // Tag pill
    tagPill(slide, M.edge + 0.7, y + 0.13, item.tag);
    // Text
    slide.addText(item.text, {
      x: M.edge + 1.95, y, w: W - M.edge * 2 - 2.0, h: rowH - 0.1,
      fontFace: F.body, fontSize: 15, color: C.body,
      align: 'left', valign: 'middle', margin: 0,
    });
  });
}

function buildRealArtifact(slide, s) {
  // Real-world artifact (screenshot) with annotation callouts on the right
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, s.eyebrow || 'Real Attack Example', s.heading);

  if (s.subheading) {
    slide.addText(s.subheading, {
      x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.4,
      fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'left', margin: 0,
    });
  }

  // Image on the left (vertical phone screenshots: contain into ~4" wide x 5" tall area)
  const imgX = M.edge + 0.2;
  const imgY = 1.95;
  const imgW = 3.6;
  const imgH = 4.7;

  // Image background frame (subtle border so light backgrounds don't bleed)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: imgX - 0.05, y: imgY - 0.05, w: imgW + 0.1, h: imgH + 0.1,
    fill: { color: C.dark }, line: { color: C.dark, width: 0 },
  });

  slide.addImage({
    path: s.imagePath,
    x: imgX, y: imgY, w: imgW, h: imgH,
    sizing: { type: 'contain', w: imgW, h: imgH },
  });

  // Source caption under image
  if (s.source) {
    slide.addText(s.source, {
      x: imgX, y: imgY + imgH + 0.1, w: imgW, h: 0.3,
      fontFace: F.body, fontSize: 9, italic: true, color: C.muted,
      align: 'center', margin: 0,
    });
  }

  // Annotation callouts on the right
  const calX = imgX + imgW + 0.5;
  const calW = W - calX - M.edge;
  const calY = 1.95;
  const calH = 4.7;

  if (s.callouts && s.callouts.length > 0) {
    const cardH = (calH - 0.1 * (s.callouts.length - 1)) / s.callouts.length;
    s.callouts.forEach((c, i) => {
      const y = calY + i * (cardH + 0.1);
      // Card
      slide.addShape(pres.shapes.RECTANGLE, {
        x: calX, y, w: calW, h: cardH,
        fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
      });
      // Left accent (color varies by callout type)
      const accentColor = c.color === 'red' ? C.red : c.color === 'amber' ? C.amber : C.primary;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: calX, y, w: 0.1, h: cardH,
        fill: { color: accentColor }, line: { color: accentColor, width: 0 },
      });
      // Label
      slide.addText(c.label.toUpperCase(), {
        x: calX + 0.25, y: y + 0.1, w: calW - 0.4, h: 0.3,
        fontFace: F.body, fontSize: 10, bold: true, color: accentColor,
        align: 'left', margin: 0,
      });
      // Text
      slide.addText(c.text, {
        x: calX + 0.25, y: y + 0.42, w: calW - 0.4, h: cardH - 0.5,
        fontFace: F.body, fontSize: 13, color: C.body,
        align: 'left', valign: 'top', margin: 0,
      });
    });
  }
}

function buildSectionDivider(slide, s) {
  slide.background = { color: C.dark };

  // Big section number
  slide.addText(s.number, {
    x: M.edge + 0.5, y: 2.0, w: 4, h: 3,
    fontFace: F.header, fontSize: 200, bold: true, color: C.primaryAlt,
    align: 'left', valign: 'top', margin: 0,
  });

  // Vertical divider — thin rectangle (renders cleanly in all viewers)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 2.5, w: 0.04, h: 2.5,
    fill: { color: C.primaryAlt }, line: { color: C.primaryAlt, width: 0 },
  });

  // Section label
  slide.addText('SECTION', {
    x: 5.5, y: 2.6, w: 7, h: 0.4,
    fontFace: F.body, fontSize: 13, bold: true, color: C.primaryAlt,
    align: 'left', margin: 0,
  });
  slide.addText(s.label, {
    x: 5.5, y: 3.0, w: W - 5.5 - M.edge - 0.5, h: 1.8,
    fontFace: F.serif, fontSize: 36, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });
  if (s.kicker) {
    slide.addText(s.kicker, {
      x: 5.5, y: 4.85, w: W - 5.5 - M.edge - 0.5, h: 0.4,
      fontFace: F.body, fontSize: 14, italic: true, color: 'A5A0C7',
      align: 'left', margin: 0,
    });
  }
}

function buildConcept(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, null, s.heading);

  // Tag in header area
  if (s.tag) tagPill(slide, M.edge, 1.4, s.tag);

  // Bullets - use inline bullet character (avoids glyphs escaping the text frame)
  const bulletText = s.bullets.map((b, i) => ({
    text: '\u2022  ' + b,
    options: { breakLine: i < s.bullets.length - 1, paraSpaceAfter: 8 },
  }));

  slide.addText(bulletText, {
    x: M.edge, y: 1.85, w: W - 2 * M.edge, h: 4.8,
    fontFace: F.body, fontSize: 17, color: C.body,
    align: 'left', valign: 'top', margin: 0,
    paraSpaceAfter: 10,
  });
}

function buildVocab(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, null, s.heading || 'Key Vocabulary');

  // Build a 2-column table-like layout
  const startY = 1.6;
  const rowH = 0.85;
  const colW = (W - 2 * M.edge - 0.3) / 2;

  s.terms.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M.edge + col * (colW + 0.3);
    const y = startY + row * rowH;

    // Term card
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: colW, h: rowH - 0.15,
      fill: { color: C.cardTint }, line: { color: C.cardTint, width: 0 },
    });
    // Left accent bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: rowH - 0.15,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    // Term
    slide.addText(t.term, {
      x: x + 0.18, y: y + 0.05, w: colW - 0.25, h: 0.28,
      fontFace: F.body, fontSize: 12, bold: true, color: C.primary,
      align: 'left', valign: 'top', margin: 0,
    });
    // Definition
    slide.addText(t.definition, {
      x: x + 0.18, y: y + 0.32, w: colW - 0.25, h: rowH - 0.5,
      fontFace: F.body, fontSize: 10.5, color: C.body,
      align: 'left', valign: 'top', margin: 0,
    });
  });
}

function buildTwoColumn(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, null, s.heading);

  if (s.subheading) {
    slide.addText(s.subheading, {
      x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.4,
      fontFace: F.body, fontSize: 14, italic: true, color: C.muted, align: 'left', margin: 0,
    });
  }

  const colW = (W - 2 * M.edge - 0.4) / 2;
  const colY = 1.95;
  const colH = 4.4;

  [s.left, s.right].forEach((col, i) => {
    const x = M.edge + i * (colW + 0.4);
    // Card background
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: colY, w: colW, h: colH,
      fill: { color: C.cardTint }, line: { color: C.primary, width: 1.5 },
    });
    // Top header band
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: colY, w: colW, h: 0.7,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    // Title
    slide.addText(col.title, {
      x: x + 0.2, y: colY + 0.05, w: colW - 0.4, h: 0.4,
      fontFace: F.header, fontSize: 22, bold: true, color: C.white, align: 'left', valign: 'top', margin: 0,
    });
    if (col.ek) {
      slide.addText(col.ek, {
        x: x + 0.2, y: colY + 0.45, w: colW - 0.4, h: 0.25,
        fontFace: F.body, fontSize: 10, color: 'E9D5FF', italic: true, align: 'left', margin: 0,
      });
    }
    // Definition
    slide.addText(col.definition, {
      x: x + 0.25, y: colY + 0.85, w: colW - 0.5, h: 0.65,
      fontFace: F.body, fontSize: 14, bold: true, color: C.dark, align: 'left', valign: 'top', margin: 0,
    });
    // Examples - use inline bullet character instead of pptxgenjs bullet system
    // (avoids bullet glyphs escaping the text frame on narrow columns)
    const exampleText = col.examples.map((e, idx) => ({
      text: '\u2022  ' + e,
      options: { breakLine: idx < col.examples.length - 1, paraSpaceAfter: 6 },
    }));
    slide.addText(exampleText, {
      x: x + 0.25, y: colY + 1.55, w: colW - 0.5, h: colH - 1.7,
      fontFace: F.body, fontSize: 12, color: C.body, align: 'left', valign: 'top', margin: 0,
    });
  });

  if (s.footer) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: colY + colH + 0.15, w: W - 2 * M.edge, h: 0.5,
      fill: { color: C.amberSoft }, line: { color: C.amberSoft, width: 0 }, rectRadius: 0.06,
    });
    slide.addText([
      { text: 'AP TIP:  ', options: { bold: true, color: '92400E' } },
      { text: s.footer.replace(/^AP TIP:\s*/i, ''), options: { color: '92400E' } },
    ], {
      x: M.edge + 0.2, y: colY + colH + 0.15, w: W - 2 * M.edge - 0.4, h: 0.5,
      fontFace: F.body, fontSize: 12, align: 'left', valign: 'middle', margin: 0,
    });
  }
}

function buildScenarioEmail(slide, s) {
  slide.background = { color: C.bgTint };
  addTopBar(slide);
  addSlideHeader(slide, 'CB Scenario 1A', s.heading);

  // Context line
  slide.addText(s.context, {
    x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.5,
    fontFace: F.body, fontSize: 12, italic: true, color: C.muted, align: 'left', valign: 'top', margin: 0,
  });

  // Email frame
  const emY = 2.0;
  const emH = 4.2;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: emY, w: W - 2 * M.edge, h: emH,
    fill: { color: C.white }, line: { color: C.border, width: 1 },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 90, opacity: 0.08 },
  });
  // Header band
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: emY, w: W - 2 * M.edge, h: 1.05,
    fill: { color: 'F9FAFB' }, line: { color: 'F9FAFB', width: 0 },
  });
  slide.addShape(pres.shapes.LINE, {
    x: M.edge, y: emY + 1.05, w: W - 2 * M.edge, h: 0,
    line: { color: C.border, width: 0.75 },
  });

  // Email headers
  const headerLines = [
    { label: 'From:', value: s.from, mono: true },
    { label: 'To:', value: s.to, mono: true },
    { label: 'Subject:', value: s.subject, mono: false, bold: true },
  ];
  headerLines.forEach((hl, i) => {
    const ly = emY + 0.1 + i * 0.3;
    slide.addText(hl.label, {
      x: M.edge + 0.2, y: ly, w: 0.85, h: 0.28,
      fontFace: F.body, fontSize: 11, bold: true, color: C.muted, align: 'left', valign: 'middle', margin: 0,
    });
    slide.addText(hl.value, {
      x: M.edge + 1.05, y: ly, w: W - 2 * M.edge - 1.2, h: 0.28,
      fontFace: hl.mono ? F.mono : F.body, fontSize: 11.5, bold: hl.bold || false, color: C.dark,
      align: 'left', valign: 'middle', margin: 0,
    });
  });

  // Email body
  const bodyText = s.body.map((p, i) => ({
    text: p,
    options: { breakLine: i < s.body.length - 1, paraSpaceAfter: 10 },
  }));
  slide.addText(bodyText, {
    x: M.edge + 0.3, y: emY + 1.2, w: W - 2 * M.edge - 0.6, h: emH - 1.35,
    fontFace: F.body, fontSize: 13, color: C.body, align: 'left', valign: 'top', margin: 0,
  });

  // Callout below
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: M.edge, y: 6.35, w: W - 2 * M.edge, h: 0.5,
    fill: { color: C.amber }, line: { color: C.amber, width: 0 }, rectRadius: 0.06,
  });
  slide.addText(s.callout, {
    x: M.edge, y: 6.35, w: W - 2 * M.edge, h: 0.5,
    fontFace: F.body, fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
  });
}

function buildImpactsGrid(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, null, s.heading);

  if (s.subheading) {
    slide.addText(s.subheading, {
      x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.4,
      fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'left', margin: 0,
    });
  }

  const cardW = (W - 2 * M.edge - 0.6) / 3;
  const cardY = 2.0;
  const cardH = 4.5;

  s.items.forEach((item, i) => {
    const x = M.edge + i * (cardW + 0.3);
    // Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
    });
    // Top accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: 0.18,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    // EK badge
    slide.addText(item.ek, {
      x: x + 0.2, y: cardY + 0.35, w: cardW - 0.4, h: 0.3,
      fontFace: F.body, fontSize: 11, bold: true, color: C.primary,
      align: 'left', margin: 0,
    });
    // Title
    slide.addText(item.title, {
      x: x + 0.2, y: cardY + 0.7, w: cardW - 0.4, h: 1.0,
      fontFace: F.header, fontSize: 20, bold: true, color: C.dark,
      align: 'left', valign: 'top', margin: 0,
    });
    // Summary — stop 0.45 from bottom to leave room for ekRef
    slide.addText(item.summary, {
      x: x + 0.2, y: cardY + 1.85, w: cardW - 0.4, h: cardH - 2.55,
      fontFace: F.body, fontSize: 13, color: C.body,
      align: 'left', valign: 'top', margin: 0,
    });
    // Subtle EK reference at bottom of card
    if (item.ekRef) {
      slide.addText(item.ekRef, {
        x: x + 0.2, y: cardY + cardH - 0.38, w: cardW - 0.4, h: 0.3,
        fontFace: F.body, fontSize: 9, italic: true, color: C.muted,
        align: 'right', valign: 'middle', margin: 0,
      });
    }
  });
}

function buildCaseStudy(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, 'Case Study', s.heading);

  const colW = (W - 2 * M.edge - 0.4) / 2;
  const colY = 1.7;
  const colH = s.trap ? 3.95 : 4.7;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: colW, h: colH,
    fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: 0.12, h: colH,
    fill: { color: C.red }, line: { color: C.red, width: 0 },
  });
  slide.addText(s.scenarioLabel || 'What happened', {
    x: M.edge + 0.3, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.red, align: 'left', margin: 0,
  });
  slide.addText(s.scenario, {
    x: M.edge + 0.3, y: colY + 0.6, w: colW - 0.5, h: colH - 0.8,
    fontFace: F.body, fontSize: 14, color: C.body, align: 'left', valign: 'top', margin: 0,
  });

  const rx = M.edge + colW + 0.4;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: colW, h: colH,
    fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: 0.12, h: colH,
    fill: { color: C.green }, line: { color: C.green, width: 0 },
  });
  slide.addText(s.analysisLabel || 'Why it worked', {
    x: rx + 0.3, y: colY + 0.2, w: colW - 0.5, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.green, align: 'left', margin: 0,
  });
  const analysisText = s.analysis.map((a, i) => ({
    text: '\u2022  ' + a,
    options: { breakLine: i < s.analysis.length - 1, paraSpaceAfter: 8 },
  }));
  slide.addText(analysisText, {
    x: rx + 0.3, y: colY + 0.6, w: colW - 0.5, h: colH - 0.8,
    fontFace: F.body, fontSize: 13, color: C.body, align: 'left', valign: 'top', margin: 0,
  });

  if (s.trap) {
    const trapY = colY + colH + 0.18;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: trapY, w: W - 2 * M.edge, h: 0.78,
      fill: { color: C.amberSoft }, line: { color: C.amber, width: 1 }, rectRadius: 0.06,
    });
    slide.addText([
      { text: 'THE TRAP:  ', options: { bold: true, color: '92400E' } },
      { text: s.trap, options: { color: '92400E' } },
    ], {
      x: M.edge + 0.25, y: trapY + 0.05, w: W - 2 * M.edge - 0.5, h: 0.68,
      fontFace: F.body, fontSize: 12, align: 'left', valign: 'middle', margin: 0,
    });
  }
}

function buildDiscussion(slide, s) {
  slide.background = { color: C.dark };

  slide.addText((s.eyebrow || 'Discussion').toUpperCase(), {
    x: M.edge, y: 0.6, w: W - 2 * M.edge, h: 0.4,
    fontFace: F.body, fontSize: 12, bold: true, color: C.primaryAlt, align: 'left', margin: 0,
  });

  slide.addText('\u201C', {
    x: M.edge + 0.3, y: 1.3, w: 1.5, h: 1.5,
    fontFace: 'Georgia', fontSize: 130, color: C.primaryAlt, align: 'left', valign: 'top', margin: 0,
  });

  slide.addText(s.prompt, {
    x: M.edge + 0.5, y: 2.4, w: W - 2 * M.edge - 1, h: 1.8,
    fontFace: F.header, fontSize: 28, bold: true, color: C.white, align: 'left', valign: 'top', margin: 0,
  });

  if (s.subprompt) {
    slide.addText(s.subprompt, {
      x: M.edge + 0.5, y: 4.5, w: W - 2 * M.edge - 1, h: 0.9,
      fontFace: F.body, fontSize: 18, italic: true, color: 'D8B4FE', align: 'left', valign: 'top', margin: 0,
    });
  }

}

function buildCFU(slide, s) {
  const mode = s.mode || 'reveal';
  const showAnswer = (mode === 'reveal');
  const showRationale = (mode === 'reveal' && variant === 'teacher' && s.rationale);

  slide.background = { color: C.white };
  addTopBar(slide);

  const eyebrowText = mode === 'reveal'
    ? `${(s.eyebrow || 'Check For Understanding').toUpperCase()} \u00b7 ANSWER REVEAL`
    : (s.eyebrow || 'Check For Understanding').toUpperCase();
  slide.addText(eyebrowText, {
    x: M.edge, y: 0.4, w: W - 2 * M.edge, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true,
    color: mode === 'reveal' ? C.green : C.primary,
    align: 'left', margin: 0,
  });

  slide.addText(s.stem, {
    x: M.edge, y: 0.75, w: W - 2 * M.edge, h: 1.4,
    fontFace: F.body, fontSize: 16, color: C.dark, align: 'left', valign: 'top', margin: 0,
  });

  const optY = 2.3;
  const optW = (W - 2 * M.edge - 0.3) / 2;
  const optH = 1.0;
  s.options.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M.edge + col * (optW + 0.3);
    const y = optY + row * (optH + 0.2);
    const isAnswer = (showAnswer && opt.letter === s.answer);

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: optW, h: optH,
      fill: { color: isAnswer ? C.greenSoft : C.cardTint },
      line: { color: isAnswer ? C.green : C.border, width: isAnswer ? 2 : 1 },
    });
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6,
      fill: { color: isAnswer ? C.green : C.primary }, line: { color: isAnswer ? C.green : C.primary, width: 0 },
    });
    slide.addText(opt.letter, {
      x: x + 0.2, y: y + 0.2, w: 0.6, h: 0.6,
      fontFace: F.header, fontSize: 22, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0,
    });
    slide.addText(opt.text, {
      x: x + 0.95, y: y + 0.05, w: optW - 1.05, h: optH - 0.1,
      fontFace: F.body, fontSize: 13, color: C.body, align: 'left', valign: 'middle', margin: 0,
    });
  });

  if (mode === 'question') {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: 4.8, w: W - 2 * M.edge, h: 1.5,
      fill: { color: C.cardTint }, line: { color: C.primary, width: 1.5 }, rectRadius: 0.08,
    });
    slide.addText('PREDICT FIRST', {
      x: M.edge + 0.3, y: 4.95, w: W - 2 * M.edge - 0.6, h: 0.35,
      fontFace: F.body, fontSize: 11, bold: true, color: C.primary,
      align: 'left', margin: 0,
    });
    const predictPrompt = s.predictPrompt
      || 'Form your own answer BEFORE reading the choices closely. Then look for your prediction in the options.';
    slide.addText(predictPrompt, {
      x: M.edge + 0.3, y: 5.3, w: W - 2 * M.edge - 0.6, h: 0.9,
      fontFace: F.body, fontSize: 14, color: C.body, italic: true,
      align: 'left', valign: 'top', margin: 0,
    });

    if (variant === 'teacher') {
      slide.addText('\u279C Next slide reveals the answer', {
        x: M.edge, y: 6.4, w: W - 2 * M.edge, h: 0.35,
        fontFace: F.body, fontSize: 10, italic: true, color: C.muted,
        align: 'right', margin: 0,
      });
    }
  } else if (showRationale) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: M.edge, y: 4.7, w: W - 2 * M.edge, h: 1.65,
      fill: { color: C.greenSoft }, line: { color: C.green, width: 1 },
    });
    slide.addText([
      { text: `Answer: ${s.answer}  \u2014  `, options: { bold: true, color: C.green, fontSize: 13 } },
      { text: 'Rationale (Teacher)', options: { bold: true, color: C.green, fontSize: 11 } },
    ], {
      x: M.edge + 0.25, y: 4.8, w: W - 2 * M.edge - 0.5, h: 0.35,
      fontFace: F.body, align: 'left', valign: 'top', margin: 0,
    });
    slide.addText(s.rationale, {
      x: M.edge + 0.25, y: 5.15, w: W - 2 * M.edge - 0.5, h: 1.15,
      fontFace: F.body, fontSize: 12, color: C.body, align: 'left', valign: 'top', margin: 0,
    });
  } else if (mode === 'reveal' && variant === 'student') {
    slide.addText('Discuss your reasoning. The correct answer is highlighted.', {
      x: M.edge, y: 5.0, w: W - 2 * M.edge, h: 0.5,
      fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'center', margin: 0,
    });
  }
}

function buildAPStrategy(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, 'AP Exam Strategies', s.heading);

  if (s.subheading) {
    slide.addText(s.subheading, {
      x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.4,
      fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'left', margin: 0,
    });
  }

  const cardW = (W - 2 * M.edge - 0.6) / 3;
  const cardY = 1.95;
  const cardH = 4.5;

  s.strategies.forEach((st, i) => {
    const x = M.edge + i * (cardW + 0.3);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
    });
    slide.addText(`${i + 1}`, {
      x: x + 0.2, y: cardY + 0.15, w: 1.5, h: 1.4,
      fontFace: F.header, fontSize: 72, bold: true, color: C.primaryAlt, align: 'left', valign: 'top', margin: 0,
    });
    slide.addText(st.name, {
      x: x + 0.2, y: cardY + 1.5, w: cardW - 0.4, h: 0.6,
      fontFace: F.header, fontSize: 19, bold: true, color: C.dark, align: 'left', valign: 'top', margin: 0,
    });
    slide.addText(st.text, {
      x: x + 0.2, y: cardY + 2.2, w: cardW - 0.4, h: cardH - 2.3,
      fontFace: F.body, fontSize: 12.5, color: C.body, align: 'left', valign: 'top', margin: 0,
    });
  });
}

function buildSummary(slide, s) {
  slide.background = { color: C.bgTint };
  addTopBar(slide);
  addSlideHeader(slide, 'Lesson Recap', s.heading);

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: 1.5, w: W - 2 * M.edge, h: 4.9,
    fill: { color: C.white }, line: { color: C.primary, width: 1.5 },
  });

  const text = s.points.map((p, i) => ([
    { text: `${i + 1}.  `, options: { bold: true, color: C.primary, fontSize: 17 } },
    { text: p, options: { color: C.body, fontSize: 16 } },
    { text: '', options: { breakLine: i < s.points.length - 1 } },
  ])).flat();

  slide.addText(text, {
    x: M.edge + 0.4, y: 1.75, w: W - 2 * M.edge - 0.8, h: 4.5,
    fontFace: F.body, align: 'left', valign: 'top', margin: 0,
    paraSpaceAfter: 14,
  });
}

function buildExitTicket(slide, s) {
  slide.background = { color: C.amberSoft };
  addTopBar(slide);

  slide.addText((s.eyebrow || 'Exit Ticket').toUpperCase(), {
    x: M.edge, y: 0.5, w: W - 2 * M.edge, h: 0.4,
    fontFace: F.body, fontSize: 12, bold: true, color: '92400E', align: 'left', margin: 0,
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: 1.2, w: W - 2 * M.edge, h: 4.8,
    fill: { color: C.white }, line: { color: C.amber, width: 2 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: 1.2, w: 0.18, h: 4.8,
    fill: { color: C.amber }, line: { color: C.amber, width: 0 },
  });

  slide.addText(s.prompt, {
    x: M.edge + 0.5, y: 1.6, w: W - 2 * M.edge - 0.7, h: 2.0,
    fontFace: F.header, fontSize: 22, bold: true, color: C.dark, align: 'left', valign: 'top', margin: 0,
  });

  if (s.subprompt) {
    slide.addText(s.subprompt, {
      x: M.edge + 0.5, y: 3.7, w: W - 2 * M.edge - 0.7, h: 1.4,
      fontFace: F.body, fontSize: 16, italic: true, color: C.body, align: 'left', valign: 'top', margin: 0,
    });
  }

}

function buildStopAndThink(slide, s) {
  slide.background = { color: C.cardTint };
  addTopBar(slide);

  slide.addText('STOP AND THINK', {
    x: M.edge, y: 0.4, w: W - 2 * M.edge, h: 0.3,
    fontFace: F.body, fontSize: 11, bold: true, color: C.primary,
    align: 'left', margin: 0,
  });
  slide.addText(s.heading || 'Independent Writing', {
    x: M.edge, y: 0.72, w: W - 2 * M.edge, h: 0.7,
    fontFace: F.header, fontSize: 30, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });
  if (s.subheading) {
    slide.addText(s.subheading, {
      x: M.edge, y: 1.45, w: W - 2 * M.edge, h: 0.35,
      fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'left', margin: 0,
    });
  }

  const startY = 2.0;
  const cardH = 1.7;
  const gap = 0.2;
  s.prompts.forEach((p, i) => {
    const y = startY + i * (cardH + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: M.edge, y, w: W - 2 * M.edge, h: cardH,
      fill: { color: C.white }, line: { color: C.border, width: 1 },
    });
    slide.addShape(pres.shapes.OVAL, {
      x: M.edge + 0.3, y: y + 0.4, w: 0.85, h: 0.85,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    slide.addText(String(i + 1), {
      x: M.edge + 0.3, y: y + 0.4, w: 0.85, h: 0.85,
      fontFace: F.header, fontSize: 32, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
    slide.addText(p, {
      x: M.edge + 1.4, y: y + 0.2, w: W - 2 * M.edge - 1.6, h: cardH - 0.4,
      fontFace: F.body, fontSize: 16, color: C.body,
      align: 'left', valign: 'middle', margin: 0,
    });
  });

}

function buildGuidedNotesPreview(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, 'Guided Notes', s.heading || 'What You\u2019ll Be Filling In');

  const secs = (track === 'cb') ? s.sections.filter(x => x.track !== 'enrichment') : s.sections;
  const hasEnrich = secs.some(x => x.track === 'enrichment');
  const sub = `Your Day ${meta.day} Guided Notes have ${secs.length} sections that match today's lesson. Green = CB required.` + (hasEnrich ? ' Blue = enrichment.' : '');
  slide.addText(sub, {
    x: M.edge, y: 1.4, w: W - 2 * M.edge, h: 0.4,
    fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: 'left', margin: 0,
  });

  const cardCount = secs.length;
  const totalWidth = W - 2 * M.edge;
  const gap = 0.18;
  const cardW = (totalWidth - gap * (cardCount - 1)) / cardCount;
  const cardY = 2.0;
  const cardH = 4.4;

  secs.forEach((sec, i) => {
    const x = M.edge + i * (cardW + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: cardH,
      fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: cardY, w: cardW, h: 0.6,
      fill: { color: C.primary }, line: { color: C.primary, width: 0 },
    });
    slide.addText(`Section ${i + 1}`, {
      x: x + 0.1, y: cardY + 0.1, w: cardW - 0.2, h: 0.4,
      fontFace: F.body, fontSize: 11, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
    slide.addText(sec.title, {
      x: x + 0.15, y: cardY + 0.8, w: cardW - 0.3, h: 1.0,
      fontFace: F.header, fontSize: 14, bold: true, color: C.dark,
      align: 'center', valign: 'top', margin: 0,
    });
    slide.addText(sec.description, {
      x: x + 0.15, y: cardY + 1.9, w: cardW - 0.3, h: cardH - 2.0,
      fontFace: F.body, fontSize: 11, color: C.body,
      align: 'left', valign: 'top', margin: 0,
    });
  });

}

function buildMisconception(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);

  slide.addText('COMMON MISCONCEPTION', {
    x: M.edge, y: 0.4, w: W - 2 * M.edge, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true, color: C.red,
    align: 'left', margin: 0,
  });
  slide.addText(s.heading || 'Don\u2019t Confuse These', {
    x: M.edge, y: 0.72, w: W - 2 * M.edge, h: 0.7,
    fontFace: F.header, fontSize: 30, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });

  const colW = (W - 2 * M.edge - 0.4) / 2;
  const colY = 1.8;
  const colH = 4.6;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: colW, h: colH,
    fill: { color: 'FEE2E2' }, line: { color: C.red, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: colW, h: 0.6,
    fill: { color: C.red }, line: { color: C.red, width: 0 },
  });
  slide.addText('WHAT STUDENTS THINK', {
    x: M.edge + 0.2, y: colY + 0.1, w: colW - 0.4, h: 0.4,
    fontFace: F.body, fontSize: 11, bold: true, color: C.white,
    align: 'left', valign: 'middle', margin: 0,
  });
  slide.addText(`\u201C${s.misconception}\u201D`, {
    x: M.edge + 0.25, y: colY + 0.8, w: colW - 0.5, h: 1.5,
    fontFace: F.header, fontSize: 17, italic: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });
  if (s.whyItHappens) {
    slide.addText([
      { text: 'Why this happens:  ', options: { bold: true, color: C.red, fontSize: 11 } },
      { text: s.whyItHappens, options: { color: C.body, fontSize: 13 } },
    ], {
      x: M.edge + 0.25, y: colY + 2.4, w: colW - 0.5, h: colH - 2.5,
      fontFace: F.body, align: 'left', valign: 'top', margin: 0,
    });
  }

  const rx = M.edge + colW + 0.4;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: colW, h: colH,
    fill: { color: C.greenSoft }, line: { color: C.green, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: colW, h: 0.6,
    fill: { color: C.green }, line: { color: C.green, width: 0 },
  });
  slide.addText('WHAT\u2019S ACTUALLY TRUE', {
    x: rx + 0.2, y: colY + 0.1, w: colW - 0.4, h: 0.4,
    fontFace: F.body, fontSize: 11, bold: true, color: C.white,
    align: 'left', valign: 'middle', margin: 0,
  });
  slide.addText(s.correction, {
    x: rx + 0.25, y: colY + 0.8, w: colW - 0.5, h: 2.2,
    fontFace: F.header, fontSize: 16, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });
  if (s.example) {
    slide.addText([
      { text: 'Example:  ', options: { bold: true, color: C.green, fontSize: 11 } },
      { text: s.example, options: { color: C.body, fontSize: 13 } },
    ], {
      x: rx + 0.25, y: colY + 3.1, w: colW - 0.5, h: colH - 3.2,
      fontFace: F.body, align: 'left', valign: 'top', margin: 0,
    });
  }
}

function buildDayClose(slide, s) {
  slide.background = { color: C.dark };

  slide.addText((s.eyebrow || 'Day Close').toUpperCase(), {
    x: M.edge, y: 0.5, w: W - 2 * M.edge, h: 0.4,
    fontFace: F.body, fontSize: 12, bold: true, color: C.primaryAlt,
    align: 'left', margin: 0,
  });
  slide.addText(s.heading || 'End of Section', {
    x: M.edge, y: 0.95, w: W - 2 * M.edge, h: 0.8,
    fontFace: F.header, fontSize: 36, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  const colW = (W - 2 * M.edge - 0.5) / 2;
  const colY = 2.1;
  const colH = 4.3;

  slide.addText((s.leftLabel || 'TODAY YOU LEARNED').toUpperCase(), {
    x: M.edge, y: colY, w: colW, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.primaryAlt,
    align: 'left', margin: 0,
  });
  const todayText = s.todayPoints.map((p, i) => ({
    text: '\u2022  ' + p,
    options: { breakLine: i < s.todayPoints.length - 1, paraSpaceAfter: 10 },
  }));
  slide.addText(todayText, {
    x: M.edge, y: colY + 0.5, w: colW, h: colH - 0.6,
    fontFace: F.body, fontSize: 15, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  const rx = M.edge + colW + 0.5;
  slide.addText((s.rightLabel || 'UP NEXT').toUpperCase(), {
    x: rx, y: colY, w: colW, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.amber,
    align: 'left', margin: 0,
  });
  const nextPointsArr = s.nextPoints || s.tomorrowPoints || [];
  const tomorrowText = nextPointsArr.map((p, i) => ({
    text: '\u2022  ' + p,
    options: { breakLine: i < nextPointsArr.length - 1, paraSpaceAfter: 10 },
  }));
  slide.addText(tomorrowText, {
    x: rx, y: colY + 0.5, w: colW, h: colH - 0.6,
    fontFace: F.body, fontSize: 15, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  if (s.teaser) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: M.edge, y: 6.55, w: W - 2 * M.edge, h: 0.45,
      fill: { color: C.primaryAlt }, line: { color: C.primaryAlt, width: 0 },
    });
    slide.addText([
      { text: 'TEASER:  ', options: { bold: true, color: C.white } },
      { text: s.teaser, options: { color: C.white, italic: true } },
    ], {
      x: M.edge + 0.2, y: 6.55, w: W - 2 * M.edge - 0.4, h: 0.45,
      fontFace: F.body, fontSize: 13, align: 'left', valign: 'middle', margin: 0,
    });
  }
}

function buildRedFlagDebrief(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);

  slide.addText(`RED FLAG ${s.flagNumber} OF 7`, {
    x: M.edge, y: 0.4, w: 3, h: 0.3,
    fontFace: F.body, fontSize: 11, bold: true, color: C.red,
    align: 'left', margin: 0,
  });

  if (s.vocabTag) {
    const isCB = s.vocabTag === 'CB';
    const fill = isCB ? C.greenSoft : 'DBEAFE';
    const color = isCB ? C.cbGreen : C.enrichBlue;
    const label = isCB ? 'CB REQUIRED' : 'ENRICHMENT';
    const w = isCB ? 1.1 : 1.15;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: W - M.edge - w, y: 0.4, w, h: 0.28,
      fill: { color: fill }, line: { color: fill, width: 0 }, rectRadius: 0.04,
    });
    slide.addText(label, {
      x: W - M.edge - w, y: 0.4, w, h: 0.28,
      fontFace: F.body, fontSize: 8.5, bold: true, color, align: 'center', valign: 'middle', margin: 0,
    });
  }

  slide.addText(s.heading, {
    x: M.edge, y: 0.78, w: W - 2 * M.edge, h: 0.7,
    fontFace: F.header, fontSize: 28, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });

  const leftW = 5.2;
  const rightW = W - 2 * M.edge - leftW - 0.4;
  const colY = 1.7;
  const colH = 4.7;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: leftW, h: colH,
    fill: { color: 'F9FAFB' }, line: { color: C.border, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge, y: colY, w: leftW, h: 0.5,
    fill: { color: C.dark }, line: { color: C.dark, width: 0 },
  });
  slide.addText('THE EMAIL ELEMENT', {
    x: M.edge + 0.2, y: colY, w: leftW - 0.4, h: 0.5,
    fontFace: F.body, fontSize: 11, bold: true, color: C.white,
    align: 'left', valign: 'middle', margin: 0,
  });

  if (s.elementLocation) {
    slide.addText(s.elementLocation, {
      x: M.edge + 0.25, y: colY + 0.7, w: leftW - 0.5, h: 0.3,
      fontFace: F.body, fontSize: 11, bold: true, color: C.muted,
      align: 'left', margin: 0,
    });
  }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: M.edge + 0.25, y: colY + 1.1, w: leftW - 0.5, h: 1.3,
    fill: { color: 'FEF3C7' }, line: { color: C.amber, width: 1.5 },
  });
  slide.addText(s.emailSnippet, {
    x: M.edge + 0.4, y: colY + 1.2, w: leftW - 0.8, h: 1.1,
    fontFace: s.mono ? F.mono : F.body, fontSize: s.mono ? 14 : 13,
    color: C.dark, bold: !s.mono, italic: !s.mono,
    align: 'left', valign: 'middle', margin: 0,
  });

  if (s.whatsWrong) {
    slide.addText('\u2192', {
      x: M.edge + 0.25, y: colY + 2.6, w: leftW - 0.5, h: 0.6,
      fontFace: F.header, fontSize: 36, color: C.red, bold: true,
      align: 'center', valign: 'top', margin: 0,
    });
    slide.addText(s.whatsWrong, {
      x: M.edge + 0.3, y: colY + 3.3, w: leftW - 0.6, h: colH - 3.4,
      fontFace: F.body, fontSize: 12, italic: true, color: C.red, bold: true,
      align: 'center', valign: 'top', margin: 0,
    });
  }

  const rx = M.edge + leftW + 0.4;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: rightW, h: colH,
    fill: { color: C.cardTint }, line: { color: C.primary, width: 1.5 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rx, y: colY, w: rightW, h: 0.5,
    fill: { color: C.primary }, line: { color: C.primary, width: 0 },
  });
  slide.addText('WHY IT\u2019S A RED FLAG', {
    x: rx + 0.2, y: colY, w: rightW - 0.4, h: 0.5,
    fontFace: F.body, fontSize: 11, bold: true, color: C.white,
    align: 'left', valign: 'middle', margin: 0,
  });

  if (s.vocabTerm) {
    slide.addText(s.vocabTerm.toUpperCase(), {
      x: rx + 0.25, y: colY + 0.7, w: rightW - 0.5, h: 0.45,
      fontFace: F.header, fontSize: 22, bold: true, color: C.primary,
      align: 'left', margin: 0,
    });
  }

  slide.addText(s.rationale, {
    x: rx + 0.25, y: colY + 1.25, w: rightW - 0.5, h: colH - 1.7,
    fontFace: F.body, fontSize: 13.5, color: C.body,
    align: 'left', valign: 'top', margin: 0,
  });

  if (s.ekRef) {
    slide.addText(s.ekRef, {
      x: rx + 0.25, y: colY + colH - 0.4, w: rightW - 0.5, h: 0.3,
      fontFace: F.body, fontSize: 9, italic: true, color: C.muted,
      align: 'right', valign: 'middle', margin: 0,
    });
  }
}

function buildWorkTimer(slide, s) {
  slide.background = { color: C.dark };

  slide.addText((s.eyebrow || 'INDEPENDENT WORK').toUpperCase(), {
    x: M.edge, y: 0.5, w: W - 2 * M.edge, h: 0.35,
    fontFace: F.body, fontSize: 12, bold: true, color: C.primaryAlt,
    align: 'left', margin: 0,
  });

  slide.addText(s.heading || 'Work Independently', {
    x: M.edge, y: 0.9, w: W - 2 * M.edge, h: 0.8,
    fontFace: F.header, fontSize: 36, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  const dur = s.duration || '20:00';
  slide.addText(dur, {
    x: M.edge + 0.3, y: 2.3, w: 5.5, h: 2.8,
    fontFace: F.header, fontSize: 160, bold: true, color: C.primaryAlt,
    align: 'left', valign: 'middle', margin: 0,
  });

  slide.addText(s.durationLabel || 'MINUTES', {
    x: M.edge + 0.3, y: 5.1, w: 5.5, h: 0.4,
    fontFace: F.body, fontSize: 14, bold: true, color: 'A5A0C7',
    align: 'left', margin: 0,
  });

  const taskX = 7.2;
  const taskW = W - taskX - M.edge;

  slide.addText('YOUR TASK', {
    x: taskX, y: 2.3, w: taskW, h: 0.35,
    fontFace: F.body, fontSize: 12, bold: true, color: C.amber,
    align: 'left', margin: 0,
  });

  if (s.tasks && s.tasks.length > 0) {
    const taskText = s.tasks.map((t, i) => ({
      text: '\u2022  ' + t,
      options: { breakLine: i < s.tasks.length - 1, paraSpaceAfter: 12 },
    }));
    slide.addText(taskText, {
      x: taskX, y: 2.75, w: taskW, h: 3.5,
      fontFace: F.body, fontSize: 16, color: C.white,
      align: 'left', valign: 'top', margin: 0,
    });
  }
}

function buildScenarioDebrief(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);

  slide.addText((s.eyebrow || 'Scenario \u00b7 Debrief').toUpperCase(), {
    x: M.edge, y: 0.4, w: W - 2 * M.edge - 2.6, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true, color: C.primary, align: 'left', margin: 0,
  });
  slide.addText(s.heading, {
    x: M.edge, y: 0.7, w: W - 2 * M.edge - 2.6, h: 0.7,
    fontFace: F.header, fontSize: 28, bold: true, color: C.dark, align: 'left', valign: 'top', margin: 0,
  });

  if (s.difficulty) {
    const diffMap = {
      'Introductory': { fill: C.greenSoft, color: C.cbGreen },
      'Moderate':     { fill: 'DBEAFE',    color: C.enrichBlue },
      'Challenging':  { fill: C.redSoft,   color: C.red },
    };
    const d = diffMap[s.difficulty] || { fill: C.bgTint, color: C.primary };
    const pw = 1.9;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: W - M.edge - pw, y: 0.45, w: pw, h: 0.34,
      fill: { color: d.fill }, line: { color: d.fill, width: 0 }, rectRadius: 0.05,
    });
    slide.addText(s.difficulty.toUpperCase(), {
      x: W - M.edge - pw, y: 0.45, w: pw, h: 0.34,
      fontFace: F.body, fontSize: 9, bold: true, color: d.color, align: 'center', valign: 'middle', margin: 0,
    });
  }

  const leftX = M.edge;
  const leftW = 5.7;
  const cardY = 1.65;
  const cardH = 4.25;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: leftX, y: cardY, w: leftW, h: cardH,
    fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: leftX, y: cardY, w: 0.12, h: cardH,
    fill: { color: C.red }, line: { color: C.red, width: 0 },
  });
  slide.addText('THE INCIDENT', {
    x: leftX + 0.3, y: cardY + 0.2, w: leftW - 0.5, h: 0.3,
    fontFace: F.body, fontSize: 11, bold: true, color: C.red, align: 'left', margin: 0,
  });
  slide.addText(s.incident, {
    x: leftX + 0.3, y: cardY + 0.6, w: leftW - 0.55, h: cardH - 0.8,
    fontFace: F.body, fontSize: 13.5, color: C.body, align: 'left', valign: 'top', margin: 0,
  });

  const rx = leftX + leftW + 0.4;
  const rw = W - rx - M.edge;
  slide.addText('THE VERDICT', {
    x: rx, y: cardY, w: rw, h: 0.3,
    fontFace: F.body, fontSize: 11, bold: true, color: C.primary, align: 'left', margin: 0,
  });

  const chips = [
    { label: 'ATTACK TYPE', value: s.attack,  accent: C.primary },
    { label: 'ADVERSARY',   value: s.skill,   accent: C.muted },
    { label: 'CB DEFENSE',  value: s.defense, accent: C.green },
  ];
  const chipY0 = cardY + 0.4;
  const chipH = 0.82;
  const chipGap = 0.16;
  chips.forEach((c, i) => {
    const y = chipY0 + i * (chipH + chipGap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: rx, y, w: rw, h: chipH,
      fill: { color: C.cardTint }, line: { color: C.border, width: 1 },
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: rx, y, w: 0.1, h: chipH,
      fill: { color: c.accent }, line: { color: c.accent, width: 0 },
    });
    slide.addText(c.label, {
      x: rx + 0.25, y: y + 0.1, w: rw - 0.4, h: 0.24,
      fontFace: F.body, fontSize: 9.5, bold: true, color: c.accent, align: 'left', margin: 0,
    });
    slide.addText(c.value, {
      x: rx + 0.25, y: y + 0.34, w: rw - 0.4, h: 0.42,
      fontFace: F.body, fontSize: 15, bold: true, color: C.dark, align: 'left', valign: 'top', margin: 0,
    });
  });

  const dfY = chipY0 + 3 * (chipH + chipGap) + 0.05;
  slide.addText([
    { text: 'DECIDING FACTOR:  ', options: { bold: true, color: C.primary, fontSize: 10 } },
    { text: s.deciding, options: { color: C.body, fontSize: 12.5 } },
  ], {
    x: rx, y: dfY, w: rw, h: cardY + cardH - dfY,
    fontFace: F.body, align: 'left', valign: 'top', margin: 0,
  });

  if (s.trap) {
    const trapY = cardY + cardH + 0.18;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: trapY, w: W - 2 * M.edge, h: 0.78,
      fill: { color: C.amberSoft }, line: { color: C.amber, width: 1 }, rectRadius: 0.06,
    });
    slide.addText([
      { text: 'THE TRAP:  ', options: { bold: true, color: '92400E' } },
      { text: s.trap, options: { color: '92400E' } },
    ], {
      x: M.edge + 0.25, y: trapY + 0.05, w: W - 2 * M.edge - 0.5, h: 0.68,
      fontFace: F.body, fontSize: 12, align: 'left', valign: 'middle', margin: 0,
    });
  }
}

// ---------- WORKED TABLE (2.x visual standard) ----------
function buildWorkedTable(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);
  addSlideHeader(slide, s.eyebrow || 'Worked Walkthrough', s.heading);

  let topY = 1.5;
  if (s.context) {
    slide.addText(s.context, {
      x: M.edge, y: 1.45, w: W - 2 * M.edge, h: 0.5,
      fontFace: F.body, fontSize: 12.5, italic: true, color: C.muted,
      align: 'left', valign: 'top', margin: 0,
    });
    topY = 2.05;
  }

  const hi = (typeof s.highlightCol === 'number') ? s.highlightCol : -1;
  const ncol = s.columns.length;

  const header = s.columns.map((c, ci) => ({
    text: c,
    options: {
      fill: { color: C.dark }, color: C.white, bold: true,
      align: ci === 0 ? 'left' : 'center', valign: 'middle',
      fontFace: F.body, fontSize: 12.5,
    },
  }));

  const body = s.rows.map((row, ri) => row.map((cell, ci) => {
    const isHi = ci === hi;
    const zebra = ri % 2 === 1;
    let fill = zebra ? 'F5F0FF' : 'FFFFFF';
    if (isHi) fill = 'EDE9FE';
    return {
      text: cell,
      options: {
        fill: { color: fill },
        color: isHi ? C.primary : C.body,
        bold: isHi,
        align: ci === 0 ? 'left' : 'center', valign: 'middle',
        fontFace: ci === 0 || isHi ? F.body : F.mono,
        fontSize: 12,
      },
    };
  }));

  const totalW = W - 2 * M.edge;
  const firstW = Math.min(2.4, totalW * 0.28);
  const restW = (totalW - firstW) / (ncol - 1);
  const colW = [firstW, ...Array(ncol - 1).fill(restW)];

  const noteH = s.note ? 0.7 : 0;
  const tableH = (M.footerY - 0.25) - topY - noteH;

  slide.addTable([header, ...body], {
    x: M.edge, y: topY, w: totalW, colW,
    rowH: tableH / (body.length + 1),
    border: { type: 'solid', color: C.border, pt: 0.75 },
    valign: 'middle', margin: [2, 4, 2, 4],
  });

  if (s.note) {
    const ny = topY + tableH + 0.12;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: ny, w: totalW, h: 0.55,
      fill: { color: C.amberSoft }, line: { color: C.amber, width: 1 }, rectRadius: 0.04,
    });
    slide.addText(s.note, {
      x: M.edge + 0.2, y: ny, w: totalW - 0.4, h: 0.55,
      fontFace: F.body, fontSize: 12, italic: true, color: '92400E',
      align: 'left', valign: 'middle', margin: 0,
    });
  }
}

// ---------- SCENARIO INTRO (2.x visual standard) ----------
function buildScenarioIntro(slide, s) {
  slide.background = { color: C.dark };

  slide.addText((s.eyebrow || 'Scenario').toUpperCase(), {
    x: M.edge + 0.4, y: 1.6, w: W - 2 * (M.edge + 0.4), h: 0.4,
    fontFace: F.body, fontSize: 13, bold: true, color: C.amber,
    align: 'left', margin: 0,
  });
  slide.addText(s.heading, {
    x: M.edge + 0.4, y: 2.0, w: W - 2 * (M.edge + 0.4), h: 1.0,
    fontFace: F.serif, fontSize: 44, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });
  slide.addText(s.narrative, {
    x: M.edge + 0.4, y: 3.25, w: W - 2 * (M.edge + 0.4), h: 1.8,
    fontFace: F.body, fontSize: 17, color: 'D8D5EC',
    align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.15,
  });
  if (s.job) {
    slide.addText(s.jobLabel || 'Your job in this lesson:', {
      x: M.edge + 0.4, y: 5.15, w: W - 2 * (M.edge + 0.4), h: 0.35,
      fontFace: F.body, fontSize: 14, bold: true, color: C.amber,
      align: 'left', margin: 0,
    });
    slide.addText(s.job, {
      x: M.edge + 0.4, y: 5.5, w: W - 2 * (M.edge + 0.4), h: 1.2,
      fontFace: F.body, fontSize: 16, color: 'D8D5EC', italic: true,
      align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.1,
    });
  }
}

// ---------- YOUR TURN / SITE HANDOFF (2.x visual standard) ----------
function buildYourTurn(slide, s) {
  slide.background = { color: C.white };
  addTopBar(slide);

  slide.addText((s.eyebrow || "Your Turn \u2014 It's All on the Site").toUpperCase(), {
    x: M.edge, y: 0.45, w: W - 2 * M.edge, h: 0.35,
    fontFace: F.body, fontSize: 11, bold: true, color: C.teal,
    align: 'left', margin: 0,
  });
  slide.addText(s.heading || 'Practice', {
    x: M.edge, y: 0.8, w: W - 2 * M.edge, h: 0.7,
    fontFace: F.serif, fontSize: 32, bold: true, color: C.dark,
    align: 'left', valign: 'top', margin: 0,
  });

  const items = s.items || [];
  const startY = 1.85;
  const rowH = Math.min(0.92, (M.footerY - 0.9 - startY) / Math.max(items.length, 1));
  items.forEach((it, i) => {
    const y = startY + i * rowH;
    numberedCircle(slide, M.edge, y, i + 1, C.teal, 0.38);
    const tx = M.edge + 0.6;
    slide.addText([
      { text: it.label, options: { bold: true, color: C.dark, fontSize: 17 } },
      { text: it.tail ? `  \u2014  ${it.tail}` : '', options: { color: C.body, fontSize: 15 } },
    ], {
      x: tx, y: y - 0.04, w: W - tx - M.edge, h: 0.4,
      fontFace: F.body, align: 'left', valign: 'middle', margin: 0,
    });
    if (it.url) {
      const href = 'https://www.' + it.url.replace(/^https?:\/\/(www\.)?/, '');
      slide.addText(it.url, {
        x: tx, y: y + 0.32, w: W - tx - M.edge, h: 0.28,
        fontFace: F.mono, fontSize: 11, color: C.teal,
        align: 'left', valign: 'middle', margin: 0,
        hyperlink: { url: href, tooltip: it.label },
      });
    }
  });

  if (s.note) {
    const ny = M.footerY - 0.72;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: M.edge, y: ny, w: W - 2 * M.edge, h: 0.5,
      fill: { color: C.bgTint }, line: { color: C.primaryAlt, width: 1 }, rectRadius: 0.04,
    });
    slide.addText([
      { text: 'Prefer self-paced?  ', options: { bold: true, color: C.primary } },
      { text: s.note, options: { color: C.body, italic: true } },
    ], {
      x: M.edge + 0.2, y: ny, w: W - 2 * M.edge - 0.4, h: 0.5,
      fontFace: F.body, fontSize: 13, align: 'left', valign: 'middle', margin: 0,
    });
  }
}

// ---------- FINAL SUMMARY (clean 2.x "one slide" recap) ----------
function buildFinalSummary(slide, s) {
  slide.background = { color: C.dark };

  slide.addText(s.heading || 'The foundation, in one slide', {
    x: M.edge + 0.3, y: 0.7, w: W - 2 * (M.edge + 0.3), h: 0.9,
    fontFace: F.serif, fontSize: 34, bold: true, color: C.white,
    align: 'left', valign: 'top', margin: 0,
  });

  const pts = s.points || [];
  const text = pts.map((p, i) => ({
    text: '\u2022  ' + p,
    options: { breakLine: i < pts.length - 1, paraSpaceAfter: 12 },
  }));
  slide.addText(text, {
    x: M.edge + 0.3, y: 1.9, w: W - 2 * (M.edge + 0.3), h: 4.0,
    fontFace: F.body, fontSize: 16.5, color: 'E5E3F2',
    align: 'left', valign: 'top', margin: 0,
  });

  if (s.next) {
    slide.addText([
      { text: 'Next:  ', options: { bold: true } },
      { text: s.next, options: { italic: true } },
    ], {
      x: M.edge + 0.3, y: 6.15, w: W - 2 * (M.edge + 0.3), h: 0.6,
      fontFace: F.body, fontSize: 15, color: C.amber,
      align: 'left', valign: 'top', margin: 0,
    });
  }
}

// ---------- DISPATCH ----------
const builders = {
  title: buildTitle,
  worked_table: buildWorkedTable,
  scenario_intro: buildScenarioIntro,
  your_turn: buildYourTurn,
  final_summary: buildFinalSummary,
  bell_ringer: buildBellRinger,
  real_artifact: buildRealArtifact,
  objectives: buildObjectives,
  section_divider: buildSectionDivider,
  concept: buildConcept,
  vocab: buildVocab,
  two_column: buildTwoColumn,
  scenario_email: buildScenarioEmail,
  impacts_grid: buildImpactsGrid,
  case_study: buildCaseStudy,
  discussion: buildDiscussion,
  cfu: buildCFU,
  ap_strategy: buildAPStrategy,
  summary: buildSummary,
  exit_ticket: buildExitTicket,
  stop_and_think: buildStopAndThink,
  guided_notes_preview: buildGuidedNotesPreview,
  misconception: buildMisconception,
  day_close: buildDayClose,
  red_flag_debrief: buildRedFlagDebrief,
  work_timer: buildWorkTimer,
  scenario_debrief: buildScenarioDebrief,
};

// ---------- BUILD ALL SLIDES ----------
const total = slides.length;
slides.forEach((s, idx) => {
  const builder = builders[s.type];
  if (!builder) {
    console.error(`Unknown slide type: ${s.type}`);
    return;
  }
  const slide = pres.addSlide();
  builder(slide, s);
  if (s.type !== 'title') {
    addFooter(slide, idx + 1, total);
  }
  if (variant === 'teacher' && s.script) {
    slide.addNotes(s.script);
  }
});

// ---------- WRITE ----------
pres.writeFile({ fileName: outPath }).then((f) => {
  console.log(`\u2713 Wrote: ${f}`);
  console.log(`  ${total} slides \u00b7 track=${track} \u00b7 variant=${variant}`);
}).catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});

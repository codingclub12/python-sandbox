#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
U="/root/.claude/uploads/aadb0b88-59f2-5954-a09c-802b5a908567"
D=/tmp/u1deliv
rm -rf "$D"; mkdir -p "$D"/Lesson_1.1 "$D"/Lesson_1.2 "$D"/Lesson_1.3 "$D"/Lesson_1.4 "$D"/Lesson_1.5

echo "### 1.2 — render from full JSON (4 days x teacher/student x cb/deepdive)"
for d in 1 2 3 4; do
  J=lesson-1.2-day$d.json
  for v in teacher student; do for t in cb deepdive; do
    node render.js "$J" --variant=$v --track=$t --out="$D/Lesson_1.2/U1_1.2_d${d}_${v}_${t}.pptx" >/dev/null
  done; done
  for t in cb deepdive; do for m in student key; do
    node emit_docs.js "$J" --doc=notes --mode=$m --track=$t --out="$D/Lesson_1.2/U1_1.2_d${d}_Notes_${m}_${t}.docx" >/dev/null
  done; done
done
node emit_docs.js lesson-1.2-day1.json --doc=quiz --mode=student --out="$D/Lesson_1.2/U1_1.2_Quiz_student.docx" >/dev/null
node emit_docs.js lesson-1.2-day1.json --doc=quiz --mode=key     --out="$D/Lesson_1.2/U1_1.2_Quiz_key.docx" >/dev/null
node emit_docs.js lesson-1.2-day1.json --doc=guide               --out="$D/Lesson_1.2/U1_1.2_TeacherGuide.docx" >/dev/null
# extras
cp "$U/e3fcecb5-lesson1.2extras.json" lesson-1.2-extras.json
node emit_extras.js lesson-1.2-extras.json --doc=map                  --out="$D/Lesson_1.2/U1_1.2_LessonMap.docx" >/dev/null
node emit_extras.js lesson-1.2-extras.json --doc=ex1 --mode=student   --out="$D/Lesson_1.2/U1_1.2_Exercise1_student.docx" >/dev/null
node emit_extras.js lesson-1.2-extras.json --doc=ex1 --mode=key       --out="$D/Lesson_1.2/U1_1.2_Exercise1_key.docx" >/dev/null
node emit_extras.js lesson-1.2-extras.json --doc=ex2 --mode=student   --out="$D/Lesson_1.2/U1_1.2_Exercise2_student.docx" >/dev/null
node emit_extras.js lesson-1.2-extras.json --doc=ex2 --mode=key       --out="$D/Lesson_1.2/U1_1.2_Exercise2_key.docx" >/dev/null
node emit_extras.js lesson-1.2-extras.json --doc=discussion           --out="$D/Lesson_1.2/U1_1.2_Discussion.docx" >/dev/null
echo "  1.2 files: $(ls "$D/Lesson_1.2" | wc -l)"

echo "### 1.4 / 1.5 — reuse current out/ slides+notes+quiz, RE-EMIT guide (out/ guide was stale)"
for L in 1.4 1.5; do
  P=L${L}
  for f in out/${P}_Day*_*.pptx out/${P}_Day*_Notes_*.docx out/${P}_Quiz_*.docx; do
    b=$(basename "$f"); nb=$(echo "$b" | sed -E "s/^L${L}_Day([0-9])/U1_${L}_d\1/; s/^L${L}_/U1_${L}_/")
    cp "$f" "$D/Lesson_${L}/$nb"
  done
  node emit_docs.js lesson-${L}-day1.json --doc=guide --out="$D/Lesson_${L}/U1_${L}_TeacherGuide.docx" >/dev/null
  echo "  ${L} files: $(ls "$D/Lesson_${L}" | wc -l)"
done

echo "### 1.1 — your published REFERENCE pack (full teacher folder + student website versions + clean PDFs)"
TMP11=$(mktemp -d); unzip -q "$U/40c279ec-AP_Cyber_Lesson_1.1_REFERENCE_8.zip" -d "$TMP11"
cp -r "$TMP11"/* "$D/Lesson_1.1/"
echo "  1.1 files: $(find "$D/Lesson_1.1" -type f | wc -l)"

echo "### 1.3 — your uploaded teacher slide decks (d1-4) + teacher docs (notes/quiz/guide)"
cp "$U/4cebb615-"*Day_1*.pptx "$D/Lesson_1.3/U1_1.3_d1_teacher_deepdive.pptx"
cp "$U/cdf0130a-"*Day_2*.pptx "$D/Lesson_1.3/U1_1.3_d2_teacher_deepdive.pptx"
cp "$U/e0b71e6f-"*Day_3*.pptx "$D/Lesson_1.3/U1_1.3_d3_teacher_deepdive.pptx"
cp "$U/9080a978-"*Day_4*.pptx "$D/Lesson_1.3/U1_1.3_d4_teacher_deepdive.pptx"
TMP13=$(mktemp -d); unzip -q "$U/997da8a6-AP_Cyber_Teacher_Docs_1.1_and_1.3.zip" -d "$TMP13"
cp "$TMP13/Lesson 1.3/"*.docx "$D/Lesson_1.3/"
echo "  1.3 files: $(ls "$D/Lesson_1.3" | wc -l)"

echo "### total delivery files: $(find "$D" -type f | wc -l)"

#!/usr/bin/env bash
# render_topic.sh <topic>  — render the full per-topic matrix into out/ with the
# exact filenames pack_course.sh consumes (CSP_<topic>_...).
#   Decks:  Day<N>_Deck_<teacher|student>_<cb|deepdive>.pptx
#   Notes:  Day<N>_Notes_<key|student>_<cb|deepdive>.docx
#   Quiz:   Quiz_<student|key>.docx           (from day1)
#   Guide:  TeacherGuide.docx                 (from day1)
#   Extras: Exercise1/2_<student|key>.docx, Discussion.docx, LessonMap.docx
#   Code:   CodeExercises_KEY.docx + gated web page  (if codeex-<topic>.json)
set -uo pipefail
cd "$(dirname "$0")"
T="${1:?usage: render_topic.sh <topic e.g. 3.2>}"
mkdir -p out
fail=0
run(){ echo "  \$ $*"; "$@" || { echo "  !! FAILED: $*"; fail=1; }; }

days=( $(ls lesson-"$T"-day*.json 2>/dev/null | sort) )
[ ${#days[@]} -eq 0 ] && { echo "no lesson-$T-day*.json found"; exit 1; }
echo "== rendering Topic $T (${#days[@]} day file(s)) =="

for f in "${days[@]}"; do
  n=$(echo "$f" | sed -E "s/lesson-$T-day([0-9]+)\.json/\1/")
  for t in cb deepdive; do
    for v in teacher student; do
      run node render.js "$f" --variant=$v --track=$t --out="out/CSP_${T}_Day${n}_Deck_${v}_${t}.pptx"
    done
    for m in key student; do
      run node emit_docs.js "$f" --doc=notes --mode=$m --track=$t --out="out/CSP_${T}_Day${n}_Notes_${m}_${t}.docx"
    done
  done
done

d1="lesson-$T-day1.json"
run node emit_docs.js "$d1" --doc=quiz --mode=student --out="out/CSP_${T}_Quiz_student.docx"
run node emit_docs.js "$d1" --doc=quiz --mode=key     --out="out/CSP_${T}_Quiz_key.docx"
run node emit_docs.js "$d1" --doc=guide               --out="out/CSP_${T}_TeacherGuide.docx"

ex="lesson-$T-extras.json"
if [ -f "$ex" ]; then
  run node emit_extras.js "$ex" --doc=map                   --out="out/CSP_${T}_LessonMap.docx"
  run node emit_extras.js "$ex" --doc=discussion            --out="out/CSP_${T}_Discussion.docx"
  run node emit_extras.js "$ex" --doc=ex1 --mode=student    --out="out/CSP_${T}_Exercise1_student.docx"
  run node emit_extras.js "$ex" --doc=ex1 --mode=key        --out="out/CSP_${T}_Exercise1_key.docx"
  run node emit_extras.js "$ex" --doc=ex2 --mode=student    --out="out/CSP_${T}_Exercise2_student.docx"
  run node emit_extras.js "$ex" --doc=ex2 --mode=key        --out="out/CSP_${T}_Exercise2_key.docx"
fi

if [ -f "codeex-$T.json" ]; then
  run node emit_code_exercises.js "codeex-$T.json"
fi

echo "== Topic $T render done (fail=$fail) =="
exit $fail

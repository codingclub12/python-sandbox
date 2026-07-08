#!/usr/bin/env bash
# pack_course.sh — package rendered CSP files into the Cyber-style folder tree:
#   AP_CSP_Course/Big_Idea_N_<Name>/Topic_N.N_<Title>/{Slide_Decks,Guided_Notes,Quiz,Supplements}
# Usage: ./pack_course.sh /path/to/output.zip
set -euo pipefail
cd "$(dirname "$0")"
OUTZIP="${1:-/home/user/python-sandbox/AP_CSP_Course.zip}"
STAGE=$(mktemp -d)
python3 - "$STAGE" <<'PY'
import sys,os,re,shutil,json
stage=sys.argv[1]
BI={'1':'Big_Idea_1_Creative_Development','2':'Big_Idea_2_Data',
    '3':'Big_Idea_3_Algorithms_and_Programming','4':'Big_Idea_4_Computer_Systems_and_Networks',
    '5':'Big_Idea_5_Impact_of_Computing'}
def title(topic):
    for f in (f'lesson-{topic}-day1.json',):
        if os.path.exists(f):
            return json.load(open(f))['meta']['lessonTitle']
    return topic
root=os.path.join(stage,'AP_CSP_Course')
for f in sorted(os.listdir('out')):
    m=re.match(r'^CSP_(\d+\.\d+)_(.+)$',f)
    if not m: continue
    topic,rest=m.groups()
    tdir=os.path.join(root,BI[topic.split('.')[0]],
        f"Topic_{topic}_{re.sub(r'[^A-Za-z0-9]+','_',title(topic)).strip('_')}")
    if re.match(r'Day\d+_Deck_',rest): sub='Slide_Decks'
    elif re.match(r'Day\d+_Notes_',rest): sub='Guided_Notes'
    elif rest.startswith('Quiz_'): sub='Quiz'
    else: sub='Supplements'   # TeacherGuide, Exercises, Discussion, LessonMap
    # customer-facing name: mirror hub naming (TEACHER caps, KEY caps, CB/DeepDive)
    n=rest
    n=n.replace('_teacher_','_TEACHER_').replace('_student_','_Student_')
    n=n.replace('_cb.','_CB.').replace('_deepdive.','_DeepDive.')
    n=n.replace('_Notes_key_','_GuidedNotes_KEY_').replace('_Notes_student_','_GuidedNotes_Student_')
    n=n.replace('_key.','_KEY.').replace('_student.','_Student.')
    n=n.replace('_cb_','_CB_').replace('_deepdive_','_DeepDive_')
    dst=os.path.join(tdir,sub); os.makedirs(dst,exist_ok=True)
    shutil.copyfile(os.path.join('out',f),os.path.join(dst,n))
count=sum(len(fs) for _,_,fs in os.walk(root))
print(f"staged {count} files under AP_CSP_Course/")
PY
rm -f "$OUTZIP"
(cd "$STAGE" && zip -q -r -X "$OUTZIP" AP_CSP_Course)
rm -rf "$STAGE"
echo "wrote $OUTZIP"
unzip -l "$OUTZIP" | tail -1

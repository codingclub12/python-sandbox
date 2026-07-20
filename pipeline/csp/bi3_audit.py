#!/usr/bin/env python3
"""bi3_audit.py <topic>  — JSON-level acceptance gauntlet for one CSP topic.

Checks (beyond validate.js):
  1. Verbatim EK: every guide.eks statement's text is a verbatim substring of
     ced.txt (whitespace-normalized), and its EK code exists in ced.txt.
  2. Capture-leak: no capture answer `a` appears verbatim elsewhere on the SAME
     slide (would give the answer away in the student packet).
  3. First-person / classroom-ops language on slide surfaces (not scripts) and
     first-person in scripts.
  4. Common AP Traps (exactly 3) + final_summary.ican present on the LAST day.
Exit 0 = clean, 1 = findings.
"""
import sys, os, re, json, glob

def norm(s): return re.sub(r'\s+', ' ', s or '').strip()

topic = sys.argv[1] if len(sys.argv) > 1 else sys.exit("usage: bi3_audit.py <topic>")
here = os.path.dirname(os.path.abspath(__file__))
ced = norm(open(os.path.join(here, 'ced.txt'), encoding='utf-8').read())
days = sorted(glob.glob(os.path.join(here, f'lesson-{topic}-day*.json')))
if not days: sys.exit(f"no lesson-{topic}-day*.json")

findings = []   # hard fails -> exit 1
warns = []      # advisory -> reported, not failing
def F(msg): findings.append(msg)
def W(msg): warns.append(msg)

EK_CODE = re.compile(r'((?:CRD|DAT|AAP|CSN|IOC)-\d+\.[A-Z](?:\.\d+)?)')

# ---- 1. verbatim EK (guide block lives on day1) ----
for d in days:
    data = json.load(open(d, encoding='utf-8'))
    g = data.get('guide') or {}
    for i, ek in enumerate(g.get('eks', [])):
        codes = EK_CODE.findall(ek)
        if not codes:
            F(f"{os.path.basename(d)} guide.eks[{i}]: no EK code found"); continue
        for c in codes:
            if c not in ced:
                F(f"{os.path.basename(d)} guide.eks[{i}]: code {c} not in ced.txt")
        # statement text = everything after the (last) code, normalized
        stmt = norm(re.sub(r'^.*?' + re.escape(codes[-1]), '', ek))
        stmt = stmt.lstrip(' .:–—-')  # drop leading en/em dash separators
        # tolerate the exam-reference "<-" vs unicode arrow and quote variants
        probe = stmt.replace('←', '<-').replace('’', "'").replace('“','"').replace('”','"')
        cedp = ced.replace('←', '<-').replace('’', "'").replace('“','"').replace('”','"')
        if len(probe) > 25 and probe not in cedp:
            # try a strong 12-word prefix so paraphrase (not verbatim) is caught
            head = ' '.join(probe.split()[:12])
            if head and head not in cedp:
                F(f"{os.path.basename(d)} guide.eks[{i}] ({codes[-1]}): text not verbatim in ced.txt -> \"{stmt[:60]}...\"")

# ---- 2. capture-leak (per slide) ----
def strings_of(o, skip_keys=()):
    out = []
    if isinstance(o, str): out.append(o)
    elif isinstance(o, list):
        for x in o: out += strings_of(x, skip_keys)
    elif isinstance(o, dict):
        for k, v in o.items():
            if k in skip_keys: continue
            out += strings_of(v, skip_keys)
    return out

for d in days:
    data = json.load(open(d, encoding='utf-8'))
    for si, s in enumerate(data.get('slides', [])):
        caps = s.get('capture') or []
        if not caps: continue
        # all slide text EXCEPT the capture answers and the script (speaker notes)
        others = norm(' '.join(strings_of({k: v for k, v in s.items()
                     if k not in ('capture', 'script')}))).lower()
        for ci, cap in enumerate(caps):
            a = norm(cap.get('a', '')).lower()
            if len(a) >= 6 and a in others:
                W(f"{os.path.basename(d)} slide[{si}] capture[{ci}]: answer may leak on slide -> \"{cap.get('a','')[:40]}\"")

# ---- 3. language checks ----
# first-person is case-SENSITIVE on "I" to avoid matching words like "It"
FIRST_PERSON = re.compile(r'\bI\s+(?:collect|will|cold|call|expect|want|like|give|check|walk|circulate|plan|remind)\b|\bI\'ll\b|\bI\'ve\b|\bmy\s+students\b')
# genuine classroom-ops phrases only (Bell Ringer + "independent practice" are
# legitimate student-facing labels and are NOT flagged)
OPS_ON_SLIDE = re.compile(r'\b(cold[- ]call|collect the|turn (?:this|these|it) in|\d+\s*min(?:ute)?s?\b|set a timer|exit ticket in)\b', re.I)
SLIDE_TEXT_KEYS_SKIP = ('script',)
for d in days:
    data = json.load(open(d, encoding='utf-8'))
    for si, s in enumerate(data.get('slides', [])):
        scr = s.get('script', '')
        if FIRST_PERSON.search(scr or ''):
            F(f"{os.path.basename(d)} slide[{si}] script: first-person teacher language -> \"{FIRST_PERSON.search(scr).group(0)}\"")
        surface = ' '.join(strings_of({k: v for k, v in s.items() if k not in SLIDE_TEXT_KEYS_SKIP}))
        m = OPS_ON_SLIDE.search(surface)
        if m:
            W(f"{os.path.basename(d)} slide[{si}] SURFACE may have ops/timing language -> \"{m.group(0)}\"")

# ---- 4. traps + ican on last day ----
last = json.load(open(days[-1], encoding='utf-8'))
slides = last.get('slides', [])
traps = [s for s in slides if s.get('type') == 'ap_strategy']
if not traps:
    F(f"{os.path.basename(days[-1])}: no ap_strategy 'Common AP Traps' slide on final day")
else:
    n = len(traps[0].get('strategies', traps[0].get('traps', traps[0].get('items', []))))
    if n != 3: F(f"{os.path.basename(days[-1])}: Common AP Traps has {n} entries (need exactly 3)")
fs = [s for s in slides if s.get('type') == 'final_summary']
if not fs:
    F(f"{os.path.basename(days[-1])}: no final_summary slide on final day")
elif not fs[0].get('ican'):
    F(f"{os.path.basename(days[-1])}: final_summary missing ican[] checklist")

print(f"=== bi3_audit {topic}: {len(days)} day file(s), {len(findings)} HARD, {len(warns)} warn ===")
for x in findings: print("  FAIL", x)
for x in warns: print("  warn", x)
sys.exit(1 if findings else 0)

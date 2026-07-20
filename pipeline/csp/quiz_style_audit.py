#!/usr/bin/env python3
"""quiz_style_audit.py <lesson-or-exam.json> [...] — enforce v4 quiz-style rules.

HARD fails (exit 1):
  - framework/meta language in a visible stem ("According to the CED", EK/LO
    codes, "the exam reference sheet provides", "the CED", etc.)
  - predictFirst set on more than 25% of items in a bank
  - predictFirst set on a non-trace item (heuristic: stem has no code/output cue)
WARN (reported, non-blocking):
  - stems over 40 words (heavy reading)
  - fewer than ~30% plain concept/vocabulary items (over-reliance on scenarios)
"""
import sys, json, re

BANNED = re.compile(
    r'according to the ced|\bthe ced\b|\bEK\b|\bLO\b|'
    r'(?:CRD|DAT|AAP|CSN|IOC)-\d+\.[A-Z]|'
    r'exam reference sheet provides|the reference sheet provides|'
    r'enduring understanding|learning objective|essential knowledge',
    re.I)
# a trace/predict item legitimately shows code or asks for output
TRACE_CUE = re.compile(r'←|<-|DISPLAY|REPEAT|FOR EACH|IF\s*\(|MOD|APPEND|INSERT|'
                       r'\boutput\b|\bprints?\b|\bdisplays?\b|\breturns?\b|\bevaluate|'
                       r'\btrace\b|value of|after (?:this|the) code|=\s*\[', re.I)
# a plain concept/vocabulary item (short, definitional)
VOCAB_CUE = re.compile(r'\bwhich (?:term|word|of the following (?:best )?(?:defines|describes))|'
                       r'\bwhat is\b|\bbest describes\b|\bdefined as\b|\bdefinition\b|'
                       r'\bwhich statement\b|\bwhat does .* mean\b|\bbest defines\b', re.I)

def qs_of(d):
    if 'partI' in d: return d['partI']['questions'], 'exam'
    q = d.get('quiz')
    if isinstance(q, dict): return q.get('questions', q.get('items', [])), 'quiz'
    if isinstance(q, list): return q, 'quiz'
    return [], 'none'

def audit(path):
    d = json.load(open(path, encoding='utf-8'))
    qs, kind = qs_of(path and d)
    if not qs: return [], []
    hard, warn = [], []
    npf = 0; nvocab = 0
    for i, q in enumerate(qs):
        stem = q.get('stem', q.get('q', '')) or ''
        tag = f"{path} q{i+1}"
        if BANNED.search(stem):
            hard.append(f"{tag}: framework/meta language in stem -> \"{BANNED.search(stem).group(0)}\"")
        pf = bool(q.get('predictFirst'))
        if pf:
            npf += 1
            if not TRACE_CUE.search(stem):
                hard.append(f"{tag}: predictFirst on a non-trace item (no code/output cue)")
        wc = len(stem.split())
        if wc > 40:
            warn.append(f"{tag}: heavy stem ({wc} words)")
        if VOCAB_CUE.search(stem) and wc <= 30:
            nvocab += 1
    n = len(qs)
    if n and npf / n > 0.25:
        hard.append(f"{path}: predictFirst on {npf}/{n} items ({round(100*npf/n)}%) — cap is 25%")
    if n and nvocab / n < 0.25:
        warn.append(f"{path}: only {nvocab}/{n} plain concept/vocabulary items (<25%) — add some")
    return hard, warn

H, W = [], []
for f in sys.argv[1:]:
    h, w = audit(f); H += h; W += w
print(f"=== quiz_style_audit: {len(sys.argv)-1} file(s), {len(H)} HARD, {len(W)} warn ===")
for x in H: print("  FAIL", x)
for x in W: print("  warn", x)
sys.exit(1 if H else 0)

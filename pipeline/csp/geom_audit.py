#!/usr/bin/env python3
"""geom_audit.py <deck.pptx> [more.pptx ...] — geometric slide audit.

Flags shapes that run off-slide or overflow, and content that collides with the
footer band. Slide = 13.333in x 7.5in; footer top ~7.05in. EMU = 914400/in.
Exit 0 clean, 1 findings.
"""
import sys, re, zipfile

EMU = 914400.0
W, H, FOOT = 13.333, 7.5, 7.05
TOLR = 0.03  # inch tolerance

def audit(pptx):
    out = []
    z = zipfile.ZipFile(pptx)
    slides = sorted([n for n in z.namelist()
                     if re.match(r'ppt/slides/slide\d+\.xml$', n)],
                    key=lambda n: int(re.search(r'(\d+)', n).group(1)))
    for n in slides:
        xml = z.read(n).decode('utf-8', 'replace')
        snum = int(re.search(r'slide(\d+)', n).group(1))
        # each sp/pic block: find its <a:off x= y=> and <a:ext cx= cy=>
        for blk in re.findall(r'<p:(?:sp|pic|graphicFrame)\b.*?</p:(?:sp|pic|graphicFrame)>', xml, re.S):
            mo = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"', blk)
            me = re.search(r'<a:ext cx="(\d+)" cy="(\d+)"', blk)
            if not (mo and me): continue
            x, y = int(mo.group(1))/EMU, int(mo.group(2))/EMU
            cx, cy = int(me.group(1))/EMU, int(me.group(2))/EMU
            r, b = x+cx, y+cy
            # is this a footer shape? (short, sitting at the very bottom)
            is_footerish = (y >= FOOT - 0.25) and (cy <= 0.6)
            if x < -TOLR or y < -TOLR:
                out.append(f"{pptx}#s{snum}: shape off top/left (x={x:.2f} y={y:.2f})")
            if r > W + TOLR:
                out.append(f"{pptx}#s{snum}: shape off RIGHT (right={r:.2f} > {W})")
            if b > H + TOLR:
                out.append(f"{pptx}#s{snum}: shape off BOTTOM (bottom={b:.2f} > {H})")
            elif b > FOOT + TOLR and not is_footerish and y < FOOT:
                out.append(f"{pptx}#s{snum}: content crosses FOOTER band (bottom={b:.2f} > {FOOT})")
    return out

allf = []
for f in sys.argv[1:]:
    try: allf += audit(f)
    except Exception as e: allf.append(f"{f}: ERROR {e}")
print(f"=== geom_audit: {len(sys.argv)-1} deck(s), {len(allf)} finding(s) ===")
for x in allf: print("  -", x)
sys.exit(1 if allf else 0)

#!/usr/bin/env python3
from pathlib import Path
import zipfile, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
out=ROOT.parent/'istoria_v15_core_stabilization_FULL_PROJECT.zip'
subprocess.check_call([sys.executable, str(ROOT/'build/validate_project.py')])
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as zf:
    for f in ROOT.rglob('*'):
        if f.is_file(): zf.write(f, f.relative_to(ROOT))
with zipfile.ZipFile(out,'r') as zf:
    bad=zf.testzip()
    if bad: raise SystemExit('Bad zip entry: '+bad)
print(out)

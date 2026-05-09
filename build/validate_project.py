#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'data/app-manifest.json').read_text(encoding='utf-8'))
missing=[f for f in manifest['requiredFiles'] if not (ROOT/f).exists()]
html=list(ROOT.glob('*.html'))
pattern=re.compile("""(?:href|src)=["']([^"'#]+)""")
refs=[]
for f in html:
    txt=f.read_text(encoding='utf-8', errors='ignore')
    refs += [(f.name,m.group(1)) for m in pattern.finditer(txt)]
missing_refs=[]
for owner, ref in refs:
    if ref.startswith(('http:','https:','mailto:','data:','javascript:')): continue
    ref=ref.split('?')[0]
    if not ref or ref.startswith('#'): continue
    if not (ROOT/ref).exists(): missing_refs.append((owner,ref))
print('V15 validation')
print('Required files:', len(manifest['requiredFiles']))
print('Missing required:', len(missing))
for m in missing: print('  MISSING',m)
print('Missing HTML refs:', len(missing_refs))
for owner,ref in missing_refs[:50]: print('  REF',owner,'->',ref)
if missing or missing_refs:
    sys.exit(1)
print('OK')

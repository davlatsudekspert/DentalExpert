"""Fails when two modules differ only in letter case, e.g. Foo.tsx and foo.ts: module
resolution ignores the extension and macOS (the iOS build) ignores case, so the import resolves to the wrong file."""
import os,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOD=('.ts','.tsx','.js','.jsx','.mjs')
bad=[]
for base in ('src','functions'):
    for d,dirs,files in os.walk(os.path.join(ROOT,base)):
        names=[os.path.splitext(f)[0] for f in files if f.endswith(MOD)]
        seen={}
        for n in names:
            k=n.lower()
            if k in seen and seen[k]!=n:bad.append(f'{os.path.relpath(d,ROOT)}: {seen[k]} <> {n}')
            seen.setdefault(k,n)
print('\n'.join(bad) if bad else 'OK: no case-only module clashes');sys.exit(1 if bad else 0)

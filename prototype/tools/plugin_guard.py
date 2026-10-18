"""Fails when code resolves a promise with a Capacitor plugin object, e.g. import('x').then(m=>m.Plugin) or
`return (await import('x')).Plugin`. The plugin proxy answers `then`, so such a promise never settles (this froze
sign-in on iOS). Call the plugin's method inside the callback instead."""
import os,re,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad=[]
pat=[re.compile(r"import\(['\"][^'\"]*capacitor[^'\"]*['\"]\)\.then\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.[A-Z]\w*\s*\)"),
     re.compile(r"return\s*\(await import\(['\"][^'\"]*capacitor[^'\"]*['\"]\)\)\.[A-Z]\w*\s*[;}]")]
for d,_,fs in os.walk(os.path.join(ROOT,'src')):
    for f in fs:
        if f.endswith(('.ts','.tsx')):
            t=open(os.path.join(d,f),encoding='utf-8').read()
            for p in pat:
                for m in p.finditer(t):bad.append(f'{f}: {m.group(0)[:90]}')
print('\n'.join(bad) if bad else 'OK: no promise resolves with a Capacitor plugin');sys.exit(1 if bad else 0)

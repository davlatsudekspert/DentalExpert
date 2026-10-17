"""Render the 1024x500 Google Play feature graphic per language: python3 tools/feature_graphic.py"""
import base64, os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICON = base64.b64encode((ROOT / 'store-assets/ios/app-icon-1024.png').read_bytes()).decode()
OUT = ROOT / 'store-assets/android/feature-graphic'
TEXT = {
 'en': ('Dental Expert', 'Atlas, lessons and tests for dentistry', ['3D atlas', 'Lessons & tests', 'Classroom']),
 'ru': ('Dental Expert', 'Атлас, уроки и тесты по стоматологии', ['3D-атлас', 'Уроки и тесты', 'Класс']),
 'uz': ('Dental Expert', 'Stomatologiya atlasi, darslar va testlar', ['3D atlas', 'Darslar va testlar', 'Sinf']),
}
HTML = """<!doctype html><meta charset=utf-8><style>
*{margin:0;box-sizing:border-box}body{width:1024px;height:500px;overflow:hidden;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;
background:radial-gradient(circle at 24% 50%,#17a6b7 0,#0f97a9 34%,#0b6f86 70%,#10254e 100%);color:#fff;display:flex;align-items:center}
.ic{width:440px;height:500px;flex:none;display:flex;align-items:center;justify-content:center}
.ic img{width:470px;height:470px;-webkit-mask:radial-gradient(circle at center,#000 52%,transparent 70%);mask:radial-gradient(circle at center,#000 52%,transparent 70%)}
.t{padding-right:56px}h1{font-size:68px;font-weight:800;letter-spacing:-1.5px;line-height:1}
p{font-size:30px;margin-top:18px;line-height:1.25;color:#e6f6f8;font-weight:500}
ul{list-style:none;padding:0;display:flex;gap:12px;margin-top:30px;flex-wrap:wrap}
li{font-size:21px;font-weight:600;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35)}
</style><div class=ic><img src='data:image/png;base64,ICON'></div><div class=t><h1>TITLE</h1><p>SUB</p><ul>CHIPS</ul></div>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'))
    pg = b.new_page(viewport={'width': 1024, 'height': 500})
    for lang, (t, s, chips) in TEXT.items():
        pg.set_content(HTML.replace('TITLE', t).replace('SUB', s).replace('CHIPS', ''.join(f'<li>{c}</li>' for c in chips)).replace('ICON', ICON))
        pg.screenshot(path=str(OUT / f'feature-{lang}.png'))
    b.close()

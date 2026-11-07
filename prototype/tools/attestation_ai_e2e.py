"""Parodontologiya is served with AI-derived keys (data/attestation/ai_keys.json): its row is open, labelled as AI-keyed,
the specialty page carries the AI warning in Uzbek, the Russian mode shows no questions for it, and a 20-question test runs.
Usage: DE_PORT=… CHROMIUM_PATH=… python3 tools/attestation_ai_e2e.py (a server serving dist, flag-off build)"""
from playwright.sync_api import sync_playwright
import os
BASE=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}'
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
    for lang,tab_re,row_name,label,note in (('uz','Bilim va malakani baholash','Parodontologiya','AI aniqlagan','sun’iy intellekt'),('ru','Проверка знаний и компетенций','Пародонтология','ИИ','искусственный интеллект')):
        pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(BASE+f'/?screen=courses&lang={lang}&role=student');pg.wait_for_selector('.learn-tabs',timeout=10000)
        pg.get_by_role('button',name=tab_re).first.click();pg.wait_for_selector('.at-row',timeout=8000)
        row=pg.locator('.at-row',has_text=row_name).first
        if lang=='uz':
            check('uz: parodontologiya row exists and is open',row.count()==1 and not row.is_disabled())
            check('uz: row says the key was found by AI',label in row.inner_text())
            row.click();pg.wait_for_selector('.at-warn',timeout=8000)
            check('uz: AI warning shown on the specialty page',note in pg.locator('.at-warn').inner_text() and 'mutaxassis hali tekshirmagan' in pg.locator('.at-warn').inner_text())
            pg.wait_for_function("!document.querySelector('.at-start').disabled",timeout=10000)
            pg.locator('.at-start').click();pg.wait_for_selector('.qr-q, .quiz-run-body',timeout=8000)
            check('uz: a test starts',pg.locator('.quiz-run, .quiz-run-body').count()>=1)
            check('uz: no sideways overflow',not pg.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
        else:
            check('ru: parodontologiya has no Russian questions (row is empty or disabled)',row.count()==0 or row.is_disabled() or ' 0 ' in (' '+row.inner_text()+' ') or '0 вопр' in row.inner_text())
        check(f'{lang}: no browser exceptions',not errs)
        pg.close()
    b.close()
print('PASS',n,'checks')

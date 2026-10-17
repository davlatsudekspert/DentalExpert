"""API auth tests against a local `npm run api:dev` (needs .dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1)."""
import json,urllib.request,urllib.error,http.cookiejar,sys
B='http://127.0.0.1:8788/api'
jar=http.cookiejar.CookieJar();op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path,method='POST',body=None,ct='application/json',origin=None,opener=op):
    h={'content-type':ct} if body is not None else {}
    if origin:h['origin']=origin
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=opener.open(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:
        return e.code,json.loads(e.read() or b'{}')
ok=[]
def check(n,c):
    assert c,n;ok.append(n)
E='test+'+str(__import__('time').time_ns())+'@example.com'
check('bad email 400',call('/auth/request-code',body={'email':'nope'})[0]==400)
check('non-json 415',call('/auth/request-code',body={'email':E},ct='text/plain')[0]==415)
check('cross-origin 403',call('/auth/request-code',body={'email':E},origin='https://evil.example')[0]==403)
s,r=call('/auth/request-code',body={'email':E,'name':'Test User','role':'dentist','cityId':'UZ-TK','countryCode':'UZ','lang':'en'})
check('request ok + dev code',s==200 and len(r.get('devCode',''))==6)
code=r['devCode']
s,r2=call('/auth/request-code',body={'email':E});check('cooldown 429',s==429 and r2['error']=='resend_too_soon')
wrong='000000' if code!='000000' else '111111'
s,r3=call('/auth/verify',body={'email':E,'code':wrong});check('wrong code 400 attemptsLeft',s==400 and r3['attemptsLeft']==4)
check('malformed code 400',call('/auth/verify',body={'email':E,'code':'12ab'})[0]==400)
check('no session before verify',call('/auth/me','GET')[1]['user'] is None)
s,r4=call('/auth/verify',body={'email':E,'code':code});check('correct code ok',s==200 and r4['user']['email']==E and r4['user']['role']=='dentist' and r4['user']['cityId']=='UZ-TK')
check('cookie is HttpOnly',any(c.name=='de_session' and c.has_nonstandard_attr('HttpOnly') for c in jar))
check('me returns user',call('/auth/me','GET')[1]['user']['name']=='Test User')
check('code single-use',call('/auth/verify',body={'email':E,'code':code})[0]==400)
# attempts lock
E2='lock+'+str(__import__('time').time_ns())+'@example.com'
s,r=call('/auth/request-code',body={'email':E2});c2=r['devCode'];bad='000000' if c2!='000000' else '111111'
codes=[call('/auth/verify',body={'email':E2,'code':bad})[0] for _ in range(5)]
check('5 wrong then locked',codes==[400]*5 and call('/auth/verify',body={'email':E2,'code':c2})[0]==429)
# logout
check('logout ok',call('/auth/logout',body={})[0]==200)
check('after logout no user',call('/auth/me','GET')[1]['user'] is None)
# native app: bearer token instead of cookie, cross-origin from the app WebView
NJ=http.cookiejar.CookieJar();nop=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(NJ))
def ncall(path,method='POST',body=None,token=None):
    h={'origin':'https://localhost','x-client':'native'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=nop.open(r);return x.status,json.loads(x.read() or b'{}'),dict(x.headers)
    except urllib.error.HTTPError as e:
        return e.code,json.loads(e.read() or b'{}'),dict(e.headers)
NE='native+'+str(__import__('time').time_ns())+'@example.com'
s,r,h=ncall('/auth/request-code',body={'email':NE,'name':'Native User','role':'student','lang':'en'});check('native request-code allowed',s==200 and 'devCode' in r)
check('native CORS header on auth',h.get('Access-Control-Allow-Origin')=='https://localhost' or h.get('access-control-allow-origin')=='https://localhost')
s,r,h=ncall('/auth/verify',body={'email':NE,'code':r['devCode']});tok=r.get('token')
check('native verify returns a token and no cookie',s==200 and bool(tok) and len(tok)>=20 and not any(c.name=='de_session' for c in NJ) and 'set-cookie' not in {k.lower() for k in h})
check('native me with bearer returns user',ncall('/auth/me','GET',token=tok)[1]['user']['email']==NE)
check('me without token is anonymous',ncall('/auth/me','GET')[1]['user'] is None)
check('garbage token is anonymous',ncall('/auth/me','GET',token='x'*40)[1]['user'] is None)
s,_,h=ncall('/auth/request-code',body={'email':'a@b.co'},token=None)
r=urllib.request.Request(B+'/auth/request-code',data=b'{}',headers={'origin':'https://evil.example','content-type':'application/json'},method='POST')
try: urllib.request.urlopen(r);evil=200
except urllib.error.HTTPError as e: evil=e.code
check('foreign origin still rejected',evil==403)
check('native logout ok',ncall('/auth/logout',body={},token=tok)[0]==200)
check('token dead after logout',ncall('/auth/me','GET',token=tok)[1]['user'] is None)
import time;time.sleep(61)  # resend cooldown
# login again (existing user keeps profile; new signup fields ignored)
s,r=call('/auth/request-code',body={'email':E,'name':'Hacker','role':'patient'})
check('second request ok',s==200)
s,r=call('/auth/verify',body={'email':E,'code':r['devCode']});check('re-login keeps profile',r['user']['name']=='Test User' and r['user']['role']=='dentist')
# delete account: removes user and session, then the same call is unauthorized
check('delete account ok',call('/auth/account','DELETE')[0]==200)
check('session gone after delete',call('/auth/me','GET')[1]['user'] is None)
check('delete without session 401',call('/auth/account','DELETE')[0]==401)
print('PASS',len(ok),'checks')

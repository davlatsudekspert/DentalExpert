"""Server hardening: state-changing calls from a foreign Origin are refused on every classroom DELETE (cookie sessions),
and an oversized JSON body is refused before it is parsed. Local `wrangler pages dev` (AUTH_DEV_ECHO=1)."""
import json,time,urllib.request,urllib.error
from classroom_test_lib import B
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
def raw(path,method='GET',body=None,cookie=None,origin=None,ctype='application/json'):
    h={}
    if body is not None:h['content-type']=ctype
    if cookie:h['cookie']=cookie
    if origin:h['origin']=origin
    r=urllib.request.Request(B+path,data=body if isinstance(body,bytes) else (json.dumps(body).encode() if body is not None else None),headers=h,method=method)
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}'),x.headers
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}'),e.headers
def web_login(role):
    e=f'{role}+{time.time_ns()}@example.com'
    s,r,_=raw('/auth/request-code','POST',{'email':e,'name':'Sec Test','role':role,'lang':'en'})
    s,r,h=raw('/auth/verify','POST',{'email':e,'code':r['devCode']})
    return h['set-cookie'].split(';')[0]
EVIL='https://evil.example'
c=web_login('teacher')
s,g,_=raw('/classroom/groups','POST',{'name':'Sec Group'},c);check('group created',s in(200,201))
gid=g['group']['id'] if 'group' in g else g.get('id')
for path,what in ((f'/classroom/join?groupId={gid}','leaving a group'),(f'/classroom/assignments?assignmentId=x','deleting an assignment'),(f'/classroom/members?groupId={gid}&no=99','removing a member')):
    s,b,_=raw(path,'DELETE',None,c,EVIL);check(f'{what} from a foreign origin is refused',s==403 and b.get('error')=='bad_origin')
s,b,_=raw('/classroom/members?groupId='+gid+'&no=99','DELETE',None,c);check('same-site DELETE still reaches the handler',s==404)
big=json.dumps({'email':'big@example.com','pad':'x'*700_000}).encode()
s,b,_=raw('/auth/request-code','POST',big);check('oversized JSON body is refused with 413',s==413)
s,b,_=raw('/auth/request-code','POST',{'email':f'ok{time.time_ns()}@example.com','role':'student','lang':'en'});check('a normal request is untouched',s==200)
# CORS: the native app (capacitor://localhost, https://localhost) calls every endpoint it uses; other origins get no CORS headers.
base=B.removesuffix('/api')
def cors(path,origin,method='GET'):
    h={'origin':origin}
    if method=='OPTIONS':h.update({'access-control-request-method':'GET','access-control-request-headers':'authorization, x-client'})
    try:x=urllib.request.urlopen(urllib.request.Request(base+path,headers=h,method=method));return x.status,x.headers
    except urllib.error.HTTPError as e:return e.code,e.headers
for path in ('/api/curriculum/key?topicId=zz-00','/api/doctors?city=UZ-TK','/api/institutions','/api/auth/me'):
    s,h=cors(path,'capacitor://localhost');check('native origin allowed on '+path.split('?')[0],h.get('access-control-allow-origin')=='capacitor://localhost')
s,h=cors('/api/curriculum/key?topicId=zz-00','capacitor://localhost','OPTIONS');check('preflight on the curriculum key',s==204)
s,h=cors('/api/doctors?city=UZ-TK','https://evil.example');check('a foreign site gets no CORS header',h.get('access-control-allow-origin') is None)
# Static hosting headers (public/_headers): hashed assets cache for good, pages are not sniffed or framed by other sites.
import re
def get(path):
    x=urllib.request.urlopen(base+path);return x.headers,x.read().decode('utf-8','replace')
h,html=get('/')
check('the page carries nosniff and a frame rule',h.get('x-content-type-options')=='nosniff' and h.get('x-frame-options')=='SAMEORIGIN')
asset=re.search(r'(/assets/[^"\']+\.js)',html);check('the page loads a hashed script',bool(asset))
h,_=get(asset.group(1));check('hashed assets are cached immutably',h.get('cache-control')=='public, max-age=31536000, immutable')
print('PASS',n,'checks')

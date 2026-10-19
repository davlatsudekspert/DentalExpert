"""Profile photo API: PUT/DELETE /api/auth/photo and GET /api/photo. Run against the local `wrangler pages dev` on :8788
(.dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1). Guests and signed-out callers are refused, uploads are checked strictly
(data URL prefix, file signature, 200 KB), and the image is served to everyone only while the dentist's profile is public."""
import base64,json,struct,time,urllib.request,urllib.error,zlib
from classroom_test_lib import B,call,login,legacy_guest
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
def login_in(email,role,name,city='UZ-TK'):
    s,r=call('/auth/request-code','POST',{'email':email,'name':name,'role':role,'lang':'en','cityId':city,'countryCode':'UZ'})
    s,r=call('/auth/verify','POST',{'email':email,'code':r['devCode']});return r['token'],r['user']
def raw(path,token=None,headers=None):
    """GET returning status, headers and body bytes (the photo endpoint answers with an image, not JSON)."""
    h={'x-client':'native','origin':'https://localhost',**(headers or {})}
    if token:h['authorization']='Bearer '+token
    try:x=urllib.request.urlopen(urllib.request.Request(B.removesuffix('/api')+path,headers=h));return x.status,x.headers,x.read()
    except urllib.error.HTTPError as e:return e.code,e.headers,e.read()
def put(image,token,ct='application/json'):
    h={'x-client':'native','origin':'https://localhost','content-type':ct,'authorization':'Bearer '+token} if token else {'content-type':ct}
    r=urllib.request.Request(B+'/auth/photo',data=json.dumps({'image':image}).encode(),headers=h,method='PUT')
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def durl(kind,b):return f'data:image/{kind};base64,'+base64.b64encode(b).decode()
def png():
    chunk=lambda t,d:struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b'\x00\x10\x8e\x8c'))+chunk(b'IEND',b'')
WEBP=b'RIFF'+struct.pack('<I',30)+b'WEBPVP8 '+bytes(range(40))
JPEG=b'\xff\xd8\xff\xe0\x00\x10JFIF\x00'+bytes(64)+b'\xff\xd9'
def doctor(token,name):return [d for d in call('/doctors?city=UZ-TK')[1]['doctors'] if d['fullName']==name]

A,_=login_in('davlatsudekspert@gmail.com','patient','Owner')
name='Dr Photo '+str(time.time_ns())[-6:]
D,du=login_in(f'drphoto+{time.time_ns()}@example.com','dentist',name)
O,_=login('patient','Other Patient')

# Who may upload.
check('signed out refused',put(durl('webp',WEBP),None)[0]==401)
G,_=legacy_guest('Rasm')  # an old class-only guest (no new ones are created)
check('class-only guest refused',put(durl('webp',WEBP),G)[0]==401)
check('guest cannot delete',call('/auth/photo','DELETE',None,G)[0]==401)
check('guest has no photoUrl',not call('/auth/me',token=G)[1]['user'].get('photoUrl'))
check('non-JSON refused',put(durl('webp',WEBP),D,ct='text/plain')[0]==415)

# What may be uploaded.
for label,img in [('gif type',durl('gif',b'GIF89a'+bytes(20))),('svg type','data:image/svg+xml;base64,'+base64.b64encode(b'<svg onload=alert(1)>').decode()),
                  ('no base64 marker','data:image/png,'+base64.b64encode(png()).decode()),('leading space',' '+durl('png',png())),
                  ('broken base64',durl('png',png())[:-3]+'*=='),('not a string',123),('upper-case type',durl('PNG',png()))]:
    check('rejects '+label,put(img,D)==(400,{'error':'bad_image'}))
check('rejects PNG bytes declared as WebP',put(durl('webp',png()),D)==(400,{'error':'type_mismatch'}))
check('rejects HTML declared as JPEG',put(durl('jpeg',b'<html><script>alert(1)</script></html>'),D)==(400,{'error':'type_mismatch'}))
check('rejects over 200 KB',put(durl('jpeg',JPEG[:4]+bytes(201*1024)),D)==(413,{'error':'too_large'}))
check('rejects a huge body before decoding',put('data:image/jpeg;base64,'+'A'*400000,D)==(413,{'error':'too_large'}))
check('nothing stored after refusals',not call('/auth/me',token=D)[1]['user'].get('photoUrl'))

# Upload and read back.
s,r=put(durl('webp',WEBP),D);url=r.get('user',{}).get('photoUrl') or ''
check('upload ok',s==200 and url.startswith('/api/photo?u='+du['id']+'&v='))
check('/auth/me exposes photoUrl',call('/auth/me',token=D)[1]['user']['photoUrl']==url)
s,h,b=raw(url,D);check('owner gets the image',s==200 and b==WEBP and h['content-type']=='image/webp' and h['x-content-type-options']=='nosniff' and 'immutable' in h['cache-control'])
check('private photo is not cached publicly',h['cache-control'].startswith('private'))
check('anonymous gets 404 while profile is private',raw(url)[0]==404)
check('another user gets 404',raw(url,O)[0]==404)
check('admin can see it to verify',raw(url,A)[0]==200)
check('wrong version 404',raw(url.split('&v=')[0]+'&v=x',D)[0]==404)
check('unknown user 404',raw('/api/photo?u=nobody&v=1')[0]==404)
check('admin list shows the photo',[u for u in call('/admin/users?q=Photo',token=A)[1]['users'] if u['id']==du['id']][0]['profile']['photoUrl']==url)

# Public once published and verified.
s,r=call('/auth/profile','PUT',{'name':name,'phone':'+998 90 123 45 67','workplace':'Photo Clinic','specialty':'Therapist','address':'','telegram':'','instagram':'','publicEmail':'','mapUrl':'','bio':'','publishRequested':True},D)
check('profile save keeps photoUrl',s==200 and r['user']['photoUrl']==url)
check('admin verifies',call('/admin/users','PUT',{'id':du['id'],'verified':True},A)[0]==200)
s,h,b=raw(url);check('anyone gets a public photo',s==200 and b==WEBP and h['cache-control']=='public, max-age=31536000, immutable' and h['x-content-type-options']=='nosniff')
d=doctor(D,name);check('doctors list carries photoUrl',len(d)==1 and d[0]['photoUrl']==url)

# A new photo needs a new verification; the old URL stops working.
s,r=put(durl('png',png()),D);url2=r['user']['photoUrl']
check('new PNG upload ok and unverified',s==200 and url2!=url and r['user']['verified'] is False)
check('old version 404',raw(url,D)[0]==404)
check('unlisted until verified again',doctor(D,name)==[] and raw(url2)[0]==404)
s,h,b=raw(url2,D);check('PNG served as image/png',s==200 and h['content-type']=='image/png')
call('/admin/users','PUT',{'id':du['id'],'verified':True},A)
s,r=put(durl('jpeg',JPEG),D);url3=r['user']['photoUrl'];call('/admin/users','PUT',{'id':du['id'],'verified':True},A)
s,h,b=raw(url3);check('JPEG public after verification',s==200 and h['content-type']=='image/jpeg' and b==JPEG)

# Removal.
s,r=call('/auth/photo','DELETE',None,D);check('delete ok',s==200 and r['user']['photoUrl'] is None)
check('deleted photo 404 for everyone',raw(url3)[0]==404 and raw(url3,D)[0]==404)
check('me has no photo',call('/auth/me',token=D)[1]['user']['photoUrl'] is None)
d=doctor(D,name);check('still listed, without photo',len(d)==1 and d[0]['photoUrl'] is None)
check('signed out cannot delete',call('/auth/photo','DELETE')[0]==401)

# Account deletion takes the photo with it.
s,r=put(durl('webp',WEBP),D);url4=r['user']['photoUrl']
check('account deleted',call('/auth/account','DELETE',None,D)[0]==200)
check('photo gone with the account',raw(url4,A)[0]==404)

# Per-user rate limit (20 changes an hour).
R,_=login('dentist','Dr Rate')
codes=[put(durl('webp',WEBP),R)[0] for _ in range(21)]
check('rate limited after 20 changes',codes[:20]==[200]*20 and codes[20]==429)

# The app owner (the verifier) keeps their own verification when they change photo or profile; others lose it.
import os
# CORS: the native app fetches the owner's photo with a bearer token, so /api/photo must answer capacitor://localhost.
s,h,_=raw('/api/photo?u=x&v=y',A,{'origin':'capacitor://localhost'})
check('photo answers CORS for the native origin',h.get('access-control-allow-origin')=='capacitor://localhost')
try:
    r=urllib.request.Request(B.removesuffix('/api')+'/api/photo?u=x&v=y',headers={'origin':'capacitor://localhost','access-control-request-method':'GET','access-control-request-headers':'authorization, x-client'},method='OPTIONS')
    x=urllib.request.urlopen(r);ok=x.status==204 and 'authorization' in x.headers.get('access-control-allow-headers','')
except Exception:ok=False
check('photo preflight allowed',ok)

# Owner account: dentist, listed and verified; a photo change keeps verification, and so does saving the profile with a new bio.
call('/auth/role','PUT',{'role':'dentist'},A)
prof={'name':'Owner','phone':'+998901234567','workplace':'DE','bio':'x','specialty':'Expert','publishRequested':True}
call('/auth/profile','PUT',prof,A)
oid=[x for x in call('/admin/users','GET',None,A)[1]['users'] if x['email']=='davlatsudekspert@gmail.com'][0]['id']
check('owner verified',call('/admin/users','PUT',{'id':oid,'verified':True},A)[0]==200)
s,r=put(durl('webp',WEBP),A);check('owner keeps verification after a new photo',s==200 and r['user']['verified'] is True and call('/auth/me',token=A)[1]['user']['verified'] is True)
s,r=call('/auth/profile','PUT',{**prof,'name':'Owner Two','phone':'+998901111111'},A);check('owner keeps verification after profile change',s==200 and call('/auth/me',token=A)[1]['user']['verified'] is True)
print('PASS',n,'checks')

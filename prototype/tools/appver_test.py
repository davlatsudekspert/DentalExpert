"""Switching old app builds off, against a server started with
MIN_BUILD_ANDROID=1050 MIN_BUILD_IOS=30 UPDATE_URL_ANDROID=https://play.google.com/store/apps/details?id=test.app UPDATE_URL_IOS=http://insecure.example BLOCK_LEGACY_NATIVE=1
(see tools/ci_local_server.sh EXTRA_VARS). Account, class, admin and billing APIs answer 426 to a native build below the minimum (or with no
build number); public reads, the config and the web stay open."""
import json,os,urllib.error,urllib.request
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8804")}/api'
n=0
def check(name,cond,info=''):
    global n
    print(('PASS ' if cond else 'FAIL ')+name+(' '+str(info) if not cond else ''));assert cond,name;n+=1
def call(path,method='GET',body=None,native=True,build=None,platform=None,origin='https://localhost'):
    h={'origin':origin}
    if native:h['x-client']='native'
    if build is not None:h['x-app-build']=str(build)
    if platform:h['x-app-platform']=platform
    if body is not None:h['content-type']='application/json'
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:x=urllib.request.urlopen(r)
    except urllib.error.HTTPError as e:x=e
    raw=x.read();return x.status,(json.loads(raw) if raw else {}),x.headers
s,r,h=call('/app/config',native=False)
check('config is public',s==200 and r['minBuild']=={'android':1050,'ios':30},r)
check('config shows the store link',r['updateUrl']['android']=='https://play.google.com/store/apps/details?id=test.app')
check('a non-https link is dropped',r['updateUrl']['ios'] is None)
check('config is never cached',h.get('cache-control')=='no-store')
s,r,h=call('/app/config',build=10,platform='android')
check('config answers an old build too (it must be readable)',s==200)
check('config has CORS for the native app',h.get('access-control-allow-origin')=='https://localhost')
check('old Android build is refused',call('/auth/me',build=1049,platform='android')[0]==426)
s,r,h=call('/auth/me',build=1049,platform='android')
check('...with a readable reason',r=={'error':'update_required'} and h.get('access-control-allow-origin')=='https://localhost' and h.get('cache-control')=='no-store')
check('minimum Android build is allowed',call('/auth/me',build=1050,platform='android')[0]==200)
check('newer Android build is allowed',call('/auth/me',build=1200,platform='android')[0]==200)
check('platform defaults to Android',call('/auth/me',build=1049)[0]==426 and call('/auth/me',build=1050)[0]==200)
check('old iOS build is refused',call('/auth/me',build=29,platform='ios')[0]==426)
check('minimum iOS build is allowed',call('/auth/me',build=30,platform='ios')[0]==200)
check('Android build 1049 is fine for iOS rules? no: platform decides',call('/auth/me',build=1049,platform='ios')[0]==200)
check('legacy native build (no build number) is refused',call('/auth/me')[0]==426)
check('class API is covered',call('/classroom/groups',build=5,platform='android')[0]==426)
check('admin API is covered',call('/admin/users',build=5,platform='android')[0]==426)
check('billing API is covered',call('/billing/practice','POST',{'n':1},build=5,platform='android')[0]==426)
check('a garbled build header does not lock anyone out',call('/auth/me',build='abc',platform='android')[0]==200)
check('web is never blocked',call('/auth/me',native=False)[0]==200 and call('/auth/me',native=False,build=1,platform='android')[0]==200)
check('public reads stay open for old builds',call('/attestation/status',build=5,platform='android')[0]==200 and call('/doctors?city=UZ-TK',build=5,platform='android')[0]==200)
s,r,h=call('/auth/me',origin='capacitor://localhost',build=1,platform='ios')
check('426 carries CORS for the iOS app origin',s==426 and h.get('access-control-allow-origin')=='capacitor://localhost')
s,r,h=call('/billing/webhook','POST',{},native=False)
check('store webhook is not affected',s!=426,s)
print(f'{n} checks passed')

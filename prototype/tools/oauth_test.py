"""Sign in with Google / Apple (POST /api/auth/oauth) tests. Never calls Google or Apple.

Generates an RSA key pair, starts its own local `wrangler pages dev` servers on free ports (run `npm run build` and
`npx wrangler d1 migrations apply dental-expert --local` first) with the public key as OAUTH_TEST_JWKS
(the server trusts it only with AUTH_DEV_ECHO=1 on localhost, from .dev.vars) and test client IDs, then
signs its own id_tokens. Usage: python3 tools/oauth_test.py
"""
import base64,hashlib,json,os,signal,socket,subprocess,sys,time,urllib.error,urllib.request
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding,rsa
except ImportError:
    sys.exit('needs `pip install cryptography`')

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_ID='8b0734eb-b1db-4bd7-9bbf-60d9db51f658'
GOOGLE_AUD='test-google-web.apps.googleusercontent.com';GOOGLE_AUD2='test-google-ios.apps.googleusercontent.com'
APPLE_AUD='uz.dentalexpert.app'
GOOGLE_ISS='https://accounts.google.com';APPLE_ISS='https://appleid.apple.com'

b64=lambda b:base64.urlsafe_b64encode(b).rstrip(b'=').decode()
def int_b64(n):return b64(n.to_bytes((n.bit_length()+7)//8,'big'))
KEY=rsa.generate_private_key(public_exponent=65537,key_size=2048)
OTHER=rsa.generate_private_key(public_exponent=65537,key_size=2048)  # not in the JWKS
pub=KEY.public_key().public_numbers()
JWKS=json.dumps({'keys':[{'kty':'RSA','kid':'test-1','use':'sig','alg':'RS256','n':int_b64(pub.n),'e':int_b64(pub.e)}]},separators=(',',':'))

def jwt(claims,key=KEY,kid='test-1',alg='RS256'):
    h=b64(json.dumps({'alg':alg,'kid':kid,'typ':'JWT'}).encode());p=b64(json.dumps(claims).encode())
    sig=key.sign(f'{h}.{p}'.encode(),padding.PKCS1v15(),hashes.SHA256())
    return f'{h}.{p}.{b64(sig)}'
RUN=str(time.time_ns())
def claims(provider='google',sub=None,email=None,**over):
    now=int(time.time())
    c={'iss':GOOGLE_ISS if provider=='google' else APPLE_ISS,'aud':GOOGLE_AUD if provider=='google' else APPLE_AUD,
       'sub':sub or provider+'-'+RUN,'email':email or f'oauth+{RUN}@example.com','email_verified':True if provider=='google' else 'true',
       'iat':now,'exp':now+600}
    if provider=='google':c['name']='Google Name'
    c.update(over)
    return {k:v for k,v in c.items() if v is not None}

def d1(sql):
    # Other local servers share the SQLite file, so a busy database is retried.
    for attempt in range(5):
        out=subprocess.run(['npx','wrangler','d1','execute','dental-expert','--local','--json','--command',sql],cwd=ROOT,capture_output=True,text=True)
        if not out.returncode:return json.loads(out.stdout[out.stdout.index('['):])[0]['results']
        time.sleep(1+attempt)
    raise SystemExit('d1 failed: '+(out.stderr or out.stdout)[-800:])

def free_port():
    with socket.socket() as so:so.bind(('127.0.0.1',0));return so.getsockname()[1]
def start(bindings):
    port=free_port()
    cmd=['npx','wrangler','pages','dev','dist','--port',str(port),'--ip','127.0.0.1','--d1','DB='+DB_ID,'--show-interactive-dev-session=false']
    for k,v in bindings.items():cmd+=['--binding',f'{k}={v}']
    log=open(os.path.join(ROOT,f'.wrangler/oauth_test_{port}.log'),'w')
    p=subprocess.Popen(cmd,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
    for _ in range(180):
        if p.poll() is not None:raise SystemExit(f'server on {port} exited, see .wrangler/oauth_test_{port}.log')
        try:urllib.request.urlopen(f'http://127.0.0.1:{port}/api/auth/me',timeout=2);return p,f'http://127.0.0.1:{port}/api'
        except Exception:time.sleep(0.5)
    stop(p);raise SystemExit('server did not start')
def stop(p):
    try:os.killpg(p.pid,signal.SIGTERM);p.wait(15)
    except Exception:
        try:os.killpg(p.pid,signal.SIGKILL)
        except Exception:pass

B=None
def call(path,method='POST',body=None,native=False,cookie=None,token=None,origin=None,ct='application/json'):
    h={}
    if body is not None:h['content-type']=ct
    if native:h.update({'x-client':'native','origin':'https://localhost'})
    if origin:h['origin']=origin
    if cookie:h['cookie']=cookie
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:x=urllib.request.urlopen(r);s,raw,hd=x.status,x.read(),x.headers
    except urllib.error.HTTPError as e:s,raw,hd=e.code,e.read(),e.headers
    try:data=json.loads(raw or b'{}')
    except ValueError:data={'raw':raw[:200].decode(errors='replace')}
    return s,data,hd
def oauth(provider,tok,native=False,**extra):return call('/auth/oauth',body={'provider':provider,'idToken':tok,**extra},native=native)

ok=[]
def check(n,c,info=''):
    if not c:raise AssertionError(f'{n} {info}')
    ok.append(n)

PROFILE_KEYS={'id','email','name','role','countryCode','cityId','phone','workplace','bio','specialty','telegram','instagram','publicEmail','address','mapUrl','publishRequested','verified'}
procs=[]
try:
    # 1) No client IDs configured: the endpoint answers 503 oauth_disabled.
    dv=open(os.path.join(ROOT,'.dev.vars')).read() if os.path.exists(os.path.join(ROOT,'.dev.vars')) else ''
    if 'GOOGLE_CLIENT_IDS' in dv or 'APPLE_CLIENT_IDS' in dv:
        print('skip disabled-config check: .dev.vars sets client IDs')
    else:
        p,B=start({'OAUTH_TEST_JWKS':JWKS});procs.append(p)
        s,r,_=oauth('google',jwt(claims()));check('disabled config 503 oauth_disabled',s==503 and r.get('error')=='oauth_disabled',(s,r))
        s,r,_=oauth('apple',jwt(claims('apple')));check('disabled apple 503',s==503 and r.get('error')=='oauth_disabled',(s,r))
        check('me reports oauth off',call('/auth/me','GET')[1].get('oauth')=={'google':False,'apple':False})
        stop(p);procs.remove(p)

    d1("DELETE FROM rate_limits WHERE bucket LIKE 'oauth:%'")
    p,B=start({'OAUTH_TEST_JWKS':JWKS,'GOOGLE_CLIENT_IDS':f'{GOOGLE_AUD}, {GOOGLE_AUD2}','APPLE_CLIENT_IDS':APPLE_AUD});procs.append(p)
    check('me reports oauth on',call('/auth/me','GET')[1].get('oauth')=={'google':True,'apple':True})

    # 2) Request guards.
    check('invalid provider 400',oauth('facebook','x.y.z')[1].get('error')=='invalid_provider')
    check('non-json 415',call('/auth/oauth',body={'provider':'google','idToken':'x'},ct='text/plain')[0]==415)
    check('foreign origin 403',call('/auth/oauth',body={'provider':'google','idToken':'x'},origin='https://evil.example')[0]==403)
    check('missing idToken bad_token',oauth('google',None)[1].get('error')=='bad_token')

    # 3) Valid Google token, browser: creates the user, sets an HttpOnly cookie, no token in the body.
    EMAIL=f'oauth+{RUN}@example.com'
    s,r,h=oauth('google',jwt(claims()),name='Body Name',role='dentist',countryCode='UZ',cityId='UZ-TK')
    check('google creates user',s==200 and r['user']['email']==EMAIL and r['user']['role']=='dentist' and r['user']['cityId']=='UZ-TK' and r['user']['countryCode']=='UZ',(s,r))
    check('profile shape matches verify',set(r['user'])==PROFILE_KEYS and set(r)=={'user'},r)
    check('body name wins over token name',r['user']['name']=='Body Name')
    UID=r['user']['id'];sc=h.get('set-cookie') or ''
    check('browser gets HttpOnly session cookie',sc.startswith('de_session=') and 'HttpOnly' in sc,sc)
    cookie=sc.split(';')[0]
    check('cookie session resolves in me',call('/auth/me','GET',cookie=cookie)[1]['user']['id']==UID)

    # 4) Same Google account, native: same user, token in body, no cookie, CORS for the app origin.
    s,r,h=oauth('google',jwt(claims()),native=True,role='patient',name='Other')
    check('native gets token, same user',s==200 and r['user']['id']==UID and len(r.get('token',''))>=20,(s,r))
    check('native response has no cookie',not h.get('set-cookie'))
    check('native CORS header',h.get('access-control-allow-origin')=='https://localhost')
    check('existing user keeps profile',r['user']['role']=='dentist' and r['user']['name']=='Body Name')
    NTOK=r['token']
    check('bearer session resolves in me',call('/auth/me','GET',native=True,token=NTOK)[1]['user']['id']==UID)
    check('second google client id accepted',oauth('google',jwt(claims(aud=GOOGLE_AUD2)))[0]==200)
    check('aud array with allowed azp accepted',oauth('google',jwt(claims(aud=[GOOGLE_AUD,'other'],azp=GOOGLE_AUD)))[0]==200)

    # 5) Apple with the same verified email links to the same user; Apple's "true" string and hashed nonce are accepted.
    raw_nonce='n-'+RUN;hashed=hashlib.sha256(raw_nonce.encode()).hexdigest()
    s,r,_=oauth('apple',jwt(claims('apple',nonce=hashed)),native=True,nonce=raw_nonce)
    check('apple same email links to same user',s==200 and r['user']['id']==UID,(s,r))
    check('apple identity stored',d1(f"SELECT COUNT(*) AS n FROM oauth_identities WHERE user_id='{UID}'")[0]['n']==2)
    check('apple raw nonce accepted',oauth('apple',jwt(claims('apple',nonce=raw_nonce)),nonce=raw_nonce)[0]==200)
    check('google raw nonce accepted',oauth('google',jwt(claims(nonce=raw_nonce)),nonce=raw_nonce)[0]==200)
    s,r,_=oauth('apple',jwt(claims('apple',email=f'changed+{RUN}@example.com')),native=True)
    check('known subject wins over a changed email',s==200 and r['user']['id']==UID,(s,r))

    # 6) New Apple private-relay user: Apple sends no name, the app sends it once in the body.
    relay=f'{RUN}@privaterelay.appleid.com'
    s,r,_=oauth('apple',jwt(claims('apple',sub='apple-relay-'+RUN,email=relay,is_private_email='true')),native=True,name='Apple User',role='student')
    check('apple private relay creates user',s==200 and r['user']['email']==relay and r['user']['name']=='Apple User' and r['user']['role']=='student' and r['user']['id']!=UID,(s,r))
    s,r,_=oauth('google',jwt(claims(sub='g-norole-'+RUN,email=f'norole+{RUN}@example.com')),role='admin',cityId='bad city',countryCode='uzb')
    check('invalid role/city/country fall back',s==200 and r['user']['role']=='patient' and r['user']['cityId'] is None and r['user']['countryCode'] is None and r['user']['name']=='Google Name',(s,r))

    # 7) Rejections: every one is 400 and none signs anyone in.
    now=int(time.time())
    def rejected(n,provider,tok,err='bad_token',**extra):
        s,r,h=oauth(provider,tok,**extra)
        check(n,s==400 and r.get('error')==err and not h.get('set-cookie') and 'user' not in r,(s,r))
    rejected('wrong aud','google',jwt(claims(aud='someone-else.apps.googleusercontent.com')))
    rejected('apple aud on google','google',jwt(claims(aud=APPLE_AUD)))
    rejected('aud array without allowed azp','google',jwt(claims(aud=[GOOGLE_AUD,'x'],azp='x')))
    rejected('expired','google',jwt(claims(iat=now-7200,exp=now-3600)))
    rejected('iat in the future','google',jwt(claims(iat=now+3600,exp=now+7200)))
    rejected('missing exp','google',jwt(claims(exp=None)))
    rejected('bad signature (other key)','google',jwt(claims(),key=OTHER))
    t=jwt(claims()).split('.');t[1]=b64(json.dumps(claims(email='evil@example.com')).encode())
    rejected('tampered payload','google','.'.join(t))
    rejected('unknown kid','google',jwt(claims(),kid='nope'))
    rejected('alg none','google',b64(b'{"alg":"none","kid":"test-1"}')+'.'+b64(json.dumps(claims()).encode())+'.x')
    rejected('alg HS256','google',jwt(claims(),alg='HS256'))
    rejected('garbage token','google','not-a-jwt')
    rejected('wrong iss (google)','google',jwt(claims(iss='https://evil.example')))
    rejected('apple iss on google','google',jwt(claims(iss=APPLE_ISS)))
    rejected('google iss on apple','apple',jwt(claims('apple',iss=GOOGLE_ISS)))
    rejected('nonce mismatch','apple',jwt(claims('apple',nonce=hashed)),nonce='different')
    rejected('nonce missing in token','google',jwt(claims()),nonce=raw_nonce)
    rejected('non-string nonce','google',jwt(claims()),nonce=123)
    c=claims(email=f'nosub+{RUN}@example.com');c['sub']=''
    rejected('empty sub','google',jwt(c))
    c.pop('sub');rejected('missing sub','google',jwt(c))
    rejected('unverified email','google',jwt(claims(email_verified=False)),'email_not_verified')
    rejected('unverified email (apple "false")','apple',jwt(claims('apple',email_verified='false')),'email_not_verified')
    rejected('email_verified missing','google',jwt(claims(email_verified=None)),'email_not_verified')
    c=claims(sub='g-noemail-'+RUN);c.pop('email')
    rejected('email missing','google',jwt(c),'email_not_verified')

    # 8) Account deletion removes the identities (FK cascade), and the same Google account then starts fresh.
    DSUB='g-del-'+RUN;DEMAIL=f'del+{RUN}@example.com'
    s,r,_=oauth('google',jwt(claims(sub=DSUB,email=DEMAIL)),native=True);DUID,DTOK=r['user']['id'],r['token']
    oauth('apple',jwt(claims('apple',sub='a-del-'+RUN,email=DEMAIL)),native=True)
    check('two identities before delete',d1(f"SELECT COUNT(*) AS n FROM oauth_identities WHERE user_id='{DUID}'")[0]['n']==2)
    check('delete account ok',call('/auth/account','DELETE',native=True,token=DTOK)[0]==200)
    check('identities gone after delete',d1(f"SELECT COUNT(*) AS n FROM oauth_identities WHERE user_id='{DUID}' OR subject IN ('{DSUB}','a-del-{RUN}')")[0]['n']==0)
    check('token dead after delete',call('/auth/me','GET',native=True,token=DTOK)[1]['user'] is None)
    s,r,_=oauth('google',jwt(claims(sub=DSUB,email=DEMAIL)),native=True)
    check('re-sign-in after delete creates a new user',s==200 and r['user']['id']!=DUID,(s,r))

    # 9) Rate limit per IP: 60 attempts per 10 minutes (cheap garbage tokens count too).
    codes=[oauth('google','x.y.z')[0] for _ in range(65)]
    check('rate limit 429',429 in codes,codes[-10:])
    s,r,_=oauth('google',jwt(claims()));check('valid token also limited',s==429 and r.get('error')=='too_many_requests',(s,r))
    d1("DELETE FROM rate_limits WHERE bucket LIKE 'oauth:%'")
    check('limit lifts when the window resets',oauth('google',jwt(claims()))[0]==200)
finally:
    for p in procs:stop(p)
print('PASS',len(ok),'checks')

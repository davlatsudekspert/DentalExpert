"""Helpers shared by the local API tests. Env: DE_PORT (server port, default 8788), D1_PERSIST (the server's
--persist-to directory, for the tests that change the local database directly)."""
import os
import hashlib,json,secrets,subprocess,urllib.request,urllib.error,time,uuid
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}/api'
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def call(path,method='GET',body=None,token=None,ip=None):
    h={'x-client':'native','origin':'https://localhost'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    if ip:h['cf-connecting-ip']=ip
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def login(role,name):
    e=f'{role}+{time.time_ns()}@example.com'
    s,r=call('/auth/request-code','POST',{'email':e,'name':name,'role':role,'lang':'en'})
    s,r=call('/auth/verify','POST',{'email':e,'code':r['devCode']});return r['token'],e
def sql(q):
    """Runs SQL on the local D1 the server uses (wrangler d1 execute --local [--persist-to D1_PERSIST])."""
    p=os.environ.get('D1_PERSIST')
    cmd=['npx','wrangler','d1','execute','dental-expert','--local','--command',q]+(['--persist-to',p] if p else [])
    return subprocess.run(cmd,cwd=ROOT,capture_output=True,check=True,text=True).stdout
def sql_json(q):
    p=os.environ.get('D1_PERSIST')
    cmd=['npx','wrangler','d1','execute','dental-expert','--local','--json','--command',q]+(['--persist-to',p] if p else [])
    out=subprocess.run(cmd,cwd=ROOT,capture_output=True,check=True,text=True).stdout
    return json.loads(out[out.index('['):])[0]['results']
def legacy_guest(nick):
    """An old class-only guest account (the QR quick test made these before guests were retired) with a live session,
    written straight into the local database, since the API no longer creates them. Returns (token, user id)."""
    uid=str(uuid.uuid4());tok=secrets.token_urlsafe(32)
    sql(f"INSERT INTO users (id,email,name,role,guest,last_seen_at) VALUES ('{uid}','guest-{uid}@guest.invalid','{nick}','student',1,datetime('now'));"
        f"INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ('{hashlib.sha256(tok.encode()).hexdigest()}','{uid}',datetime('now','+180 days'))")
    return tok,uid

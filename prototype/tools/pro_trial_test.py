"""One trial per person, and plans bound to the role (flag ON server). Second account from the same device id, from a
Gmail dot / +tag / googlemail alias, from the same browser cookie or a busy network gets no trial (and still signs up);
deleting an account does not bring the trial back; a role switch never restarts it; a Student plan unlocks nothing for the
same account as a teacher; an admin can reset a claim."""
import http.cookiejar,json,time,urllib.request,urllib.error,uuid
from classroom_test_lib import B,call,sql
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
RUN=str(time.time_ns())[-9:]
def signup(email,role='student',device=None,ip=None,native=True,jar=None):
    """Full sign-up through the real endpoints; returns (token_or_None, verify answer)."""
    h={'content-type':'application/json'}
    if native:h.update({'x-client':'native','origin':'https://localhost'})
    if device:h['x-device-id']=device
    if ip:h['x-test-ip']=ip
    op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar)).open if jar is not None else urllib.request.urlopen
    def post(path,body):
        r=urllib.request.Request(B+path,data=json.dumps(body).encode(),headers=h,method='POST')
        try:x=op(r);return json.loads(x.read() or b'{}')
        except urllib.error.HTTPError as e:return json.loads(e.read() or b'{}')
    r=post('/auth/request-code',{'email':email,'name':'Trial T','role':role,'lang':'en'})
    if 'devCode' not in r:   # this suite signs up far more accounts than a person; lift the per-address limits
        sql("DELETE FROM rate_limits; DELETE FROM auth_codes");r=post('/auth/request-code',{'email':email,'name':'Trial T','role':role,'lang':'en'})
    v=post('/auth/verify',{'email':email,'code':r['devCode']});return v.get('token'),v
def me(t):return call('/auth/me',token=t)[1]['user']
def end_trial(t):sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE id='{me(t)['id']}'")
SECRET='ci-webhook-secret'
def hook(user,typ,product,txn):
    e={'id':f'tv-{time.time_ns()}','type':typ,'app_user_id':user,'product_id':product,'store':'APP_STORE','original_transaction_id':txn,
       'event_timestamp_ms':int(time.time()*1000),'expiration_at_ms':int((time.time()+30*86400)*1000)}
    r=urllib.request.Request(B+'/billing/webhook',data=json.dumps({'event':e}).encode(),headers={'content-type':'application/json','authorization':SECRET},method='POST')
    return urllib.request.urlopen(r).status

# ---- Device id
dev=str(uuid.uuid4())
t1,v1=signup(f'dev1+{RUN}@example.com',device=dev);check('first account on a device gets the trial',me(t1)['pro']['reason']=='trial' and 'trialDenied' not in v1)
t2,v2=signup(f'dev2+{RUN}@example.com',device=dev)
check('second account on the same device still signs up',bool(t2))
p=me(t2)['pro'];check('...but gets no trial (Free tier, flagged)',p['reason']=='free' and p['active'] is False and p['trialUsed'] is True and v2.get('trialDenied')=='device')
check('...and the answer says why',v2['user']['pro']['reason']=='free')
t3,_=signup(f'dev3+{RUN}@example.com',device=str(uuid.uuid4()));check('another device gets a trial',me(t3)['pro']['reason']=='trial')
check('a malformed device id is ignored, not trusted',me(signup(f'dev4+{RUN}@example.com',device='nope')[0])['pro']['reason']=='trial')
check('trial claims store only hashes',all(len(r['hash'])==64 for r in __import__('classroom_test_lib').sql_json("SELECT hash FROM trial_claims ORDER BY id DESC LIMIT 20")))

# ---- E-mail aliases
base=f'jane.doe{RUN}'
a1,_=signup(f'{base}@gmail.com');check('first Gmail address gets the trial',me(a1)['pro']['reason']=='trial')
for alias in [f'janedoe{RUN}@gmail.com',f'j.a.n.e.d.o.e{RUN}@gmail.com',f'{base}+study@gmail.com',f'JaneDoe{RUN}+x@googlemail.com']:
    t,v=signup(alias);check(f'alias {alias} gets no trial',me(t)['pro']['reason']=='free' and v.get('trialDenied')=='email')
o1,_=signup(f'sam{RUN}@outlook.com');o2,v=signup(f'sam{RUN}+b@outlook.com')
check('a +tag on a plus-address provider is the same person',v.get('trialDenied')=='email')
q1,_=signup(f'qq{RUN}+a@example.com');q2,v=signup(f'qq{RUN}+b@example.com')
check('on other domains the tag is part of the address (distinct people)','trialDenied' not in v)
d1,_=signup(f'al.ex{RUN}@example.com');d2,v=signup(f'alex{RUN}@example.com')
check('dots only count for Gmail (other domains keep them distinct)',me(d2)['pro']['reason']=='trial' and 'trialDenied' not in v)
# deleting an account does not return the trial
x,_=signup(f'gone{RUN}@example.com');call('/auth/account','DELETE',None,x)
t,v=signup(f'gone{RUN}@example.com');check('delete and sign up again: no new trial',me(t)['pro']['reason']=='free' and v.get('trialDenied')=='email')

# ---- Web cookie
jar=http.cookiejar.CookieJar()
w1,v=signup(f'web1+{RUN}@example.com',native=False,jar=jar)
check('web: first account gets the trial and a claim cookie',any(c.name=='de_trial' for c in jar) and 'trialDenied' not in v)
w2,v=signup(f'web2+{RUN}@example.com',native=False,jar=jar)
check('web: second account in the same browser gets no trial',v.get('trialDenied')=='cookie')
w3,v=signup(f'web3+{RUN}@example.com',native=False,jar=http.cookiejar.CookieJar())
check('web: a fresh browser gets a trial','trialDenied' not in v)
bad=http.cookiejar.CookieJar();bad.set_cookie(http.cookiejar.Cookie(0,'de_trial','forged.0000',None,False,'127.0.0.1',False,False,'/',False,False,None,True,None,None,{}))
w4,v=signup(f'web4+{RUN}@example.com',native=False,jar=bad)
check('web: a forged cookie is not trusted as a claim (and not as an identity)','trialDenied' not in v)

# ---- Network
ip=f'198.51.{int(RUN)%250}.7'
res=[signup(f'net{i}+{RUN}@example.com',ip=ip)[1].get('trialDenied') for i in range(7)]
check('a busy network: the first 5 get trials, then none',res[:5]==[None]*5 and res[5]=='ip' and res[6]=='ip')
check('requests without a client address (local) are not rate-claimed',signup(f'noip+{RUN}@example.com')[1].get('trialDenied') is None)

# ---- Role switch never restarts the trial
r1,_=signup(f'sw{RUN}@example.com');before=me(r1)['pro']['trialEndsAt']
call('/auth/role','PUT',{'role':'teacher'},r1);call('/auth/role','PUT',{'role':'dentist'},r1);call('/auth/role','PUT',{'role':'student'},r1)
check('switching roles does not extend or restart the trial',me(r1)['pro']['trialEndsAt']==before)
sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE id='{me(r1)['id']}'")
call('/auth/role','PUT',{'role':'teacher'},r1);call('/auth/role','PUT',{'role':'student'},r1)
check('an ended trial stays ended through role switches',me(r1)['pro']['active'] is False)

# ---- Plans are bound to the role
s,_=signup(f'bound{RUN}@example.com');sid=me(s)['id'];end_trial(s)
check('student plan purchase accepted',hook(sid,'INITIAL_PURCHASE','de_student_monthly',f'bound-{RUN}')==200 and me(s)['pro']['reason']=='paid')
check('as a student: unlimited practice and later topics',call('/billing/practice','POST',{'n':20},s)[1]['unlimited'] and call('/curriculum/key?topicId=card-06',token=s)[0]==200)
check('switch to teacher',call('/auth/role','PUT',{'role':'teacher'},s)[0]==200)
p=me(s)['pro'];check('as a teacher the Student plan unlocks nothing, and says which plan is held',p['active'] is False and p['reason']=='free' and p['heldRole']=='student' and p['plan']=='teacher')
check('teacher gates are closed: topic keys',call('/curriculum/key?topicId=card-06',token=s)[0]==402)
g=call('/classroom/groups','POST',{'name':'First'},s);check('teacher gates: first group fine',g[0]==201)
check('teacher gates: second group needs the Teacher plan',call('/classroom/groups','POST',{'name':'Second'},s)[0]==402)
check('teacher gates: general tests closed',call('/classroom/general','POST',{'groupId':g[1]['group']['id'],'sources':['card-01'],'count':3},s)[0]==402)
check('dentist: specialist listing and gates also closed',call('/auth/role','PUT',{'role':'dentist'},s)[0]==200 and me(s)['pro']['active'] is False)
check('back to student the plan works again',call('/auth/role','PUT',{'role':'student'},s)[0]==200 and me(s)['pro']['reason']=='paid')

# ---- Admin reset
s2,v=call('/auth/request-code','POST',{'email':'davlatsudekspert@gmail.com','name':'Owner','role':'patient','lang':'en'});s2,v=call('/auth/verify','POST',{'email':'davlatsudekspert@gmail.com','code':v['devCode']});A=v['token']
rdev=str(uuid.uuid4());e1=f'rs1+{RUN}@example.com';e2=f'rs2+{RUN}@example.com'
signup(e1,device=rdev);t,v=signup(e2,device=rdev);check('setup: second account on the device is denied',v.get('trialDenied')=='device')
check('non-admin cannot reset',call('/admin/trial','POST',{'email':e2},t)[0]==403 and call('/admin/trial','POST',{'email':e2})[0]==401)
check('bad input refused',call('/admin/trial','POST',{'email':'x'},A)[0]==400 and call('/admin/trial','POST',{'email':e2,'deviceId':'zz'},A)[0]==400)
s_,r=call('/admin/trial','POST',{'email':e2,'deviceId':rdev},A);check('admin resets the e-mail and the device',s_==200 and r['account'] is True)
check('the denied account now has its trial',me(t)['pro']['reason']=='trial' and me(t)['pro']['trialUsed'] is False)
t5,v=signup(f'rs3+{RUN}@example.com',device=rdev);check('the device can claim again after the reset',v.get('trialDenied') is None)
log=__import__('classroom_test_lib').sql_json("SELECT admin_email,action,target FROM admin_audit ORDER BY id DESC LIMIT 5")
check('the reset is in the audit log',any(l['action']=='reset_trial' and l['target']==e2 for l in log))
print(f'{n} checks passed')

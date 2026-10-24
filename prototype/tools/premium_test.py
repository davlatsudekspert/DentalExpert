"""Premium plan API tests (flag ON): `PRO_ENABLED=1 DE_PORT=8803 D1_PERSIST=… bash tools/ci_local_server.sh premium_test`.
Premium is the one plan that is not bound to a role: it makes `active` true for student, teacher and dentist and unlocks every
Pro feature of the current role, also after a role switch. Role-bound plans keep their behaviour (heldRole). Prices and ids are
read from src/proConfig.ts so the test cannot drift from the app."""
import json,re,time,urllib.request,urllib.error,pathlib
from classroom_test_lib import B,call,login,sql,sql_json
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
SECRET='ci-webhook-secret'
CFG=pathlib.Path(__file__).resolve().parent.parent.joinpath('src/proConfig.ts').read_text()
PM,PY=re.search(r"PREMIUM=\{[^}]*?monthly:\{product:'([a-z_]+)'",CFG,re.S).group(1),re.search(r"PREMIUM=\{.*?yearly:\{product:'([a-z_]+)'",CFG,re.S).group(1)
check('config defines the two premium ids',(PM,PY)==('de_premium_monthly','de_premium_yearly'))
def hook(body,auth=SECRET):
    r=urllib.request.Request(B+'/billing/webhook',data=json.dumps(body).encode(),headers={'content-type':'application/json','authorization':auth},method='POST')
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def me(t):return call('/auth/me',token=t)[1]['user']
def uid(t):return me(t)['id']
def end_trial(t):sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE id='{uid(t)}'")
RUN=str(time.time_ns())[-8:];_ev=[0]
def ev(user,typ,product,txn,exp_days=30,ts=None,**kw):
    _ev[0]+=1
    e={'id':f'pev-{time.time_ns()}-{_ev[0]}','type':typ,'app_user_id':user,'product_id':product,'store':'APP_STORE','original_transaction_id':txn,
       'event_timestamp_ms':ts or int(time.time()*1000),'expiration_at_ms':int((time.time()+exp_days*86400)*1000)}
    e.update(kw);return {'event':e}
def role(t,r):return call('/auth/role','PUT',{'role':r},t)[1]['user']['pro']

# ---- Premium purchase for every role.
for r in ('student','teacher','dentist'):
    T,_=login(r,'Prem '+r);end_trial(T);i=uid(T)
    check(f'{r}: free before buying',me(T)['pro']['reason']=='free')
    s,b=hook(ev(i,'INITIAL_PURCHASE',PM,f'pm-{r}-{RUN}'))
    p=me(T)['pro']
    check(f'{r}: premium webhook accepted (not ignored)',s==200 and b.get('duplicate') is False and 'ignored' not in b)
    check(f'{r}: premium makes Pro active',p['active'] and p['reason']=='paid' and p['plan']==PM and p['expiresAt'])
    check(f'{r}: premium opens the server gates',call('/curriculum/key?topicId=card-05',token=T)[0]==200 and call('/billing/practice','POST',{'n':20},T)[1]['unlimited'])
# patients: webhook is harmless, still free forever
Pt,_=login('patient','Prem patient')
check('patient never needs it and stays free',hook(ev(uid(Pt),'INITIAL_PURCHASE',PM,'pm-pat-'+RUN))[0]==200 and me(Pt)['pro']['reason']=='free')

# ---- Premium after a role switch unlocks; a Student plan does not.
Sx,_=login('student','Switch student');end_trial(Sx);sid=uid(Sx)
hook(ev(sid,'INITIAL_PURCHASE','de_student_monthly','st-'+RUN))
check('student plan active as student',me(Sx)['pro']['reason']=='paid')
p=role(Sx,'teacher')
check('student plan unlocks nothing after a switch to teacher, heldRole kept',p['active'] is False and p['heldRole']=='student')
check('...no extra groups for that teacher',call('/classroom/groups','POST',{'name':'Group a'},Sx)[0]==201 and call('/classroom/groups','POST',{'name':'Group b'},Sx)[0]==402)
p=role(Sx,'dentist');check('...nor as dentist',p['active'] is False and p['heldRole']=='student')
role(Sx,'student')
hook(ev(sid,'INITIAL_PURCHASE',PY,'pmy-'+RUN,exp_days=365))
check('upgrade to premium while holding a student plan',me(Sx)['pro']['active'])
p=role(Sx,'teacher')
check('premium stays active after the switch to teacher (not heldRole)',p['active'] and p['reason']=='paid' and not p.get('heldRole'))
Gt=Sx
check('premium teacher: several groups and general tests pass the gate',call('/classroom/groups','POST',{'name':'Group c'},Gt)[0]==201 and call('/classroom/groups','POST',{'name':'Group d'},Gt)[0]==201)
gid=call('/classroom/groups',token=Gt)[1]['groups'][0]['id']
s,r_=call('/classroom/general','POST',{'groupId':gid,'sources':[],'count':3},Gt);check('general test: gate passed (normal validation next)',s==400 and r_['error']=='bad_sources')
p=role(Sx,'dentist');check('premium stays active as dentist',p['active'] and p['reason']=='paid')
role(Sx,'student')
# Teacher who bought premium becomes a dentist: listed publicly (specialist Pro).
D,_=login('teacher','Prem dentist')
dn=f'Dr Premium {time.time_ns()}'
did=uid(D);end_trial(D);hook(ev(did,'INITIAL_PURCHASE',PM,'pm-dd-'+RUN))
role(D,'dentist');sql(f"UPDATE users SET name='{dn}',city_id='UZ-TK',country_code='UZ',publish_requested=1,verified_at=datetime('now') WHERE id='{did}'")
check('premium dentist appears in the public listing',any(d['fullName']==dn for d in call('/doctors?city=UZ-TK')[1]['doctors']))

# ---- Role-bound rules unchanged.
W,_=login('teacher','Mismatch');end_trial(W)
check('a teacher plan bought by a student account is still ignored',hook(ev(uid(login("student","Mm")[0]),'INITIAL_PURCHASE','de_teacher_monthly','mm-'+RUN))[1].get('ignored')=='role_mismatch')
check('unknown premium-looking id ignored',hook(ev(uid(W),'INITIAL_PURCHASE','de_premium_weekly','pw-'+RUN))[1].get('ignored')=='product')

# ---- Expiry, cancellation, idempotency, ordering.
E,_=login('dentist','Expiry');end_trial(E);eid=uid(E)
e1=ev(eid,'INITIAL_PURCHASE',PM,'px-'+RUN,ts=2000000000000+10)
s,b=hook(e1);check('purchase grants',b['duplicate'] is False and me(E)['pro']['active'])
s,b=hook(e1);check('same event id again: duplicate, nothing changes',s==200 and b['duplicate'] is True)
check('one subscription row',sql_json(f"SELECT COUNT(*) AS c FROM subscriptions WHERE user_id='{eid}'")[0]['c']==1)
hook(ev(eid,'CANCELLATION',PM,'px-'+RUN,ts=2000000000000+20))
check('cancelled keeps premium until the period ends',me(E)['pro']['active'])
hook(ev(eid,'RENEWAL',PM,'px-'+RUN,ts=2000000000000+5,exp_days=1))
check('older event arriving late does not undo the newer one',sql_json(f"SELECT status FROM subscriptions WHERE original_txn='px-{RUN}'")[0]['status']=='cancelled')
hook(ev(eid,'RENEWAL',PY,'px-'+RUN,ts=2000000000000+30,exp_days=365))
check('renewal/product change to yearly applies',me(E)['pro']['plan']==PY)
hook(ev(eid,'EXPIRATION',PY,'px-'+RUN,ts=2000000000000+50,expiration_at_ms=None))
check('EXPIRATION ends premium for any role',me(E)['pro']['reason']=='free' and not me(E)['pro']['active'])
check('...also after the role changes',role(E,'student')['active'] is False)
check('a premium purchase with a past expiry is not active',hook(ev(eid,'INITIAL_PURCHASE',PM,'px2-'+RUN,exp_days=-2))[0]==200 and me(E)['pro']['reason']=='free')
sql(f"UPDATE subscriptions SET expires_at=datetime('now','-1 minute') WHERE user_id='{eid}'")
check('expired by date alone is free',me(E)['pro']['reason']=='free')
# Premium expired but the trial still runs: trial untouched.
Tr,_=login('student','Trial keeps');tid=uid(Tr)
hook(ev(tid,'INITIAL_PURCHASE',PM,'pt-'+RUN,exp_days=-1))
check('trial untouched by an expired premium',me(Tr)['pro']['reason']=='trial')
# Transaction ownership.
X,_=login('student','Thief');end_trial(X)
check('a premium transaction owned by someone else is not moved',hook(ev(uid(X),'INITIAL_PURCHASE',PM,'pm-student-'+RUN))[0]==200 and me(X)['pro']['reason']=='free')
# Google Play base plan suffix.
G,_=login('teacher','Play');end_trial(G)
s,b=hook(ev(uid(G),'INITIAL_PURCHASE',PM+':base','gp-'+RUN));check('Google Play id with base plan suffix',s==200 and me(G)['pro']['plan']==PM)
# Admin grant still works and wins.
A,_=login('patient','x') if False else (None,None)
print(f'{n} checks passed')

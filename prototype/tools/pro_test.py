"""Pro/Free API tests (flag ON). Needs a server started with PRO_ENABLED=1 and REVENUECAT_WEBHOOK_AUTH=ci-webhook-secret
(`PRO_ENABLED=1 DE_PORT=8803 D1_PERSIST=… bash tools/ci_local_server.sh pro_test`). Covers the trial, the Free tier gates
(topic keys, daily practice cap, groups, general tests, the public dentist listing), the RevenueCat webhook (auth, validation,
idempotency, ordering, role match) and admin grant / revoke."""
import json,time,urllib.request,urllib.error
from classroom_test_lib import B,call,login,sql,sql_json
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
SECRET='ci-webhook-secret'
def hook(body,auth=SECRET,ct='application/json',raw=None):
    h={'content-type':ct}
    if auth is not None:h['authorization']=auth
    r=urllib.request.Request(B+'/billing/webhook',data=raw if raw is not None else json.dumps(body).encode(),headers=h,method='POST')
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def me(t):return call('/auth/me',token=t)[1]['user']
def uid(t):return me(t)['id']
def end_trial(t):sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE id='{uid(t)}'")
_ev=[0]
RUN=str(time.time_ns())[-8:]
def ev(user,typ,product,txn='txn-1',exp_days=30,ts=None,store='APP_STORE',**kw):
    _ev[0]+=1
    e={'id':f'ev-{time.time_ns()}-{_ev[0]}','type':typ,'app_user_id':user,'product_id':product,'store':store,'original_transaction_id':txn,
       'event_timestamp_ms':ts or int(time.time()*1000),'expiration_at_ms':int((time.time()+exp_days*86400)*1000)}
    e.update(kw);return {'event':e}

s,r=call('/auth/me');check('anonymous /me says the flag is on',s==200 and r['proEnabled'] is True and r['user'] is None)

# ---- Trial: new accounts get 30 days; patients are free forever.
S,_=login('student','Stu');p=me(S)['pro']
check('new student is on the trial',p['active'] and p['reason']=='trial' and p['plan']=='student' and p['expiresAt'] is None)
days=(time.mktime(time.strptime(p['trialEndsAt'],'%Y-%m-%dT%H:%M:%SZ'))-time.time()+time.timezone)/86400
check('trial lasts about 30 days',29.5<days<30.5)
P,_=login('patient','Pat');pp=me(P)['pro']
check('patient is free forever, never a plan',pp['active'] and pp['reason']=='free' and pp['plan'] is None)
check('plan follows the role',me(login('teacher','T')[0])['pro']['plan']=='teacher' and me(login('dentist','D')[0])['pro']['plan']=='specialist')
e=f'trialverify+{time.time_ns()}@example.com'
s,r=call('/auth/request-code','POST',{'email':e,'name':'V','role':'student','lang':'en'});s,r=call('/auth/verify','POST',{'email':e,'code':r['devCode']})
check('sign-in answer carries pro',r['user']['pro']['reason']=='trial')
end_trial(S);p=me(S)['pro']
check('after the trial without a subscription: Free',p['active'] is False and p['reason']=='free')

# ---- Gates for a Free student vs a trial student.
T,_=login('student','Trial')
check('free topic key open to anyone',call('/curriculum/key?topicId=card-01')[0]==200 and call('/curriculum/key?topicId=perio-03')[0]==200)
s,r=call('/curriculum/key?topicId=card-04');check('later topic key needs Pro (anonymous)',s==402 and r['error']=='pro_required' and r['feature']=='topics')
check('later topic key refused on Free',call('/curriculum/key?topicId=card-04',token=S)[0]==402)
check('later topic key open on the trial',call('/curriculum/key?topicId=card-04',token=T)[0]==200)
check('unknown topic still 404',call('/curriculum/key?topicId=card-99',token=T)[0]==404)
check('practice: GET shows the allowance',call('/billing/practice',token=S)[1]=={'unlimited':False,'limit':20,'used':0})
check('practice: bad counts rejected',all(call('/billing/practice','POST',{'n':v},S)[0]==400 for v in [0,-1,21,1.5,'5',None]))
s,r=call('/billing/practice','POST',{'n':15},S);check('practice: 15 counted',s==200 and r['used']==15)
s,r=call('/billing/practice','POST',{'n':6},S);check('practice: over the cap refused, nothing counted',s==402 and r['error']=='pro_required' and r['used']==15)
s,r=call('/billing/practice','POST',{'n':5},S);check('practice: exactly the cap fits',s==200 and r['used']==20)
check('practice: 21st refused',call('/billing/practice','POST',{'n':1},S)[0]==402)
check('practice: signed out refused',call('/billing/practice','POST',{'n':1})[0]==401)
s,r=call('/billing/practice','POST',{'n':20},T);check('practice: trial is unlimited and not counted',s==200 and r['unlimited'] is True)
check('practice: other days start fresh',sql(f"UPDATE practice_usage SET day='2000-01-01' WHERE user_id='{uid(S)}'") is not None and call('/billing/practice','POST',{'n':20},S)[0]==200)

# ---- Teacher: one group on Free, several on Pro; general tests are Pro.
FT,_=login('teacher','Free Teacher');end_trial(FT)
PT,_=login('teacher','Pro Teacher')
s,g1=call('/classroom/groups','POST',{'name':'Group one'},FT);check('free teacher: first group created',s==201)
s,r=call('/classroom/groups','POST',{'name':'Group two'},FT);check('free teacher: second group needs Pro',s==402 and r['feature']=='groups')
check('free teacher still lists and keeps the group',len(call('/classroom/groups',token=FT)[1]['groups'])==1)
check('trial teacher: several groups',call('/classroom/groups','POST',{'name':'A one'},PT)[0]==201 and call('/classroom/groups','POST',{'name':'A two'},PT)[0]==201)
gid=g1['group']['id']
s,r=call('/classroom/general','POST',{'groupId':gid,'sources':['card-01'],'count':3},FT);check('general test refused on Free',s==402 and r['feature']=='generalTests')
pg=call('/classroom/groups',token=PT)[1]['groups'][0]['id']
s,r=call('/classroom/general','POST',{'groupId':pg,'sources':[],'count':3},PT);check('general test passes the gate on Pro (then normal validation)',s==400 and r['error']=='bad_sources')
# A student in a Free teacher's class is never paywalled: join, list assignments.
FS,_=login('student','Class Student');end_trial(FS)
s,r=call('/classroom/join','POST',{'code':g1['group']['code']},FS);check('Free student joins a Free teacher\'s class',s in (200,201))
check('Free student sees the class',len(call('/classroom/groups',token=FS)[1]['groups'])==1)

# ---- Public dentist listing needs the specialist Pro.
d_email=f'drpro+{time.time_ns()}@example.com'
s,r=call('/auth/request-code','POST',{'email':d_email,'name':'Dr Listed '+str(time.time_ns())[-6:],'role':'dentist','lang':'en','cityId':'UZ-TK','countryCode':'UZ'})
s,r=call('/auth/verify','POST',{'email':d_email,'code':r['devCode']});D=r['token'];dname=r['user']['name'];did=r['user']['id']
sql(f"UPDATE users SET publish_requested=1,verified_at=datetime('now') WHERE id='{did}'")
listed=lambda:any(d['fullName']==dname for d in call('/doctors?city=UZ-TK')[1]['doctors'])
check('verified dentist is listed during the trial',listed())
end_trial(D);check('lapsed dentist drops out of the listing',not listed())
check('profile of the lapsed dentist is kept',me(D)['verified'] is True)

# ---- Webhook.
W,_=login('student','Buyer');end_trial(W);wid=uid(W)
check('webhook without secret refused',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly'),auth=None)[0]==401)
check('webhook with a wrong secret refused',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly'),auth='nope')[0]==401)
check('webhook needs JSON',hook(None,ct='text/plain',raw=b'x')[0]==415)
check('webhook bad JSON refused',hook(None,raw=b'{bad')[0]==400)
check('webhook without event refused',hook({'x':1})[0]==400)
check('still Free after refused calls',me(W)['pro']['reason']=='free')
check('purchase of another role\'s plan is ignored',hook(ev(wid,'INITIAL_PURCHASE','de_teacher_monthly',txn='t-x-'+RUN))[1].get('ignored')=='role_mismatch' and me(W)['pro']['reason']=='free')
check('unknown product ignored',hook(ev(wid,'INITIAL_PURCHASE','com.evil.pro',txn='t-y-'+RUN))[1].get('ignored')=='product')
check('unknown user ignored (200 so the sender stops retrying)',hook(ev('00000000-0000-4000-8000-000000000000','INITIAL_PURCHASE','de_student_monthly'))[1].get('ignored')=='unknown_user')
check('informational TEST event ignored',hook(ev(wid,'TEST','de_student_monthly'))[1].get('ignored')=='type')
check('bad store refused',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly',store='EVIL'))[0]==400)
check('missing expiry on a purchase refused',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly',expiration_at_ms=None))[0]==400)
check('absurd expiry refused',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly',exp_days=5000))[0]==400)
check('SQL in ids is just refused/ignored',hook(ev("x';DROP TABLE users;--",'INITIAL_PURCHASE','de_student_monthly'))[0]==400)
check('nothing granted by all the refusals',me(W)['pro']['reason']=='free')

e1=ev(wid,'INITIAL_PURCHASE','de_student_monthly',txn='w-1-'+RUN,ts=1000000000000+10)
s,r=hook(e1);check('INITIAL_PURCHASE grants paid Pro',s==200 and r['duplicate'] is False and me(W)['pro']['reason']=='paid' and me(W)['pro']['plan']=='de_student_monthly')
s,r=hook(e1);check('the same event id again changes nothing (idempotent)',s==200 and r['duplicate'] is True)
check('exactly one subscription row',sql_json(f"SELECT COUNT(*) AS c FROM subscriptions WHERE user_id='{wid}'")[0]['c']==1)
check('CANCELLATION keeps Pro until the period ends',hook(ev(wid,'CANCELLATION','de_student_monthly',txn='w-1-'+RUN,ts=1000000000000+20))[0]==200 and me(W)['pro']['active'])
check('an older event arriving late does not undo a newer one',hook(ev(wid,'RENEWAL','de_student_monthly',txn='w-1-'+RUN,ts=1000000000000+5,exp_days=1))[0]==200 and sql_json(f"SELECT status FROM subscriptions WHERE original_txn='w-1-{RUN}'")[0]['status']=='cancelled')
check('RENEWAL extends',hook(ev(wid,'RENEWAL','de_student_yearly',txn='w-1-'+RUN,ts=1000000000000+30,exp_days=365))[0]==200 and me(W)['pro']['plan']=='de_student_yearly')
check('BILLING_ISSUE keeps the grace period',hook(ev(wid,'BILLING_ISSUE','de_student_yearly',txn='w-1-'+RUN,ts=1000000000000+40,expiration_at_ms=None))[0]==200 and me(W)['pro']['active'])
check('paid Pro opens the gates',call('/curriculum/key?topicId=card-05',token=W)[0]==200 and call('/billing/practice','POST',{'n':20},W)[1]['unlimited'])
check('EXPIRATION ends it',hook(ev(wid,'EXPIRATION','de_student_yearly',txn='w-1-'+RUN,ts=1000000000000+50,expiration_at_ms=None))[0]==200 and me(W)['pro']['reason']=='free')
check('Free again after expiry',call('/curriculum/key?topicId=card-05',token=W)[0]==402)
check('a purchase with a past expiry is not active',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly',txn='w-2-'+RUN,exp_days=-3))[0]==200 and me(W)['pro']['reason']=='free')
check('Google Play ids with a base plan suffix work',hook(ev(wid,'INITIAL_PURCHASE','de_student_monthly:base',txn='gp-1-'+RUN,store='PLAY_STORE'))[0]==200 and me(W)['pro']['reason']=='paid')
# A switch of role does not carry the student plan over.
check('changing role does not keep another role\'s plan',call('/auth/role','PUT',{'role':'teacher'},W)[1]['user']['pro']['reason']=='free')
# Another account cannot take over a transaction.
X,_=login('student','Thief');end_trial(X)
check('a transaction id already owned by someone else is not moved',hook(ev(uid(X),'INITIAL_PURCHASE','de_student_monthly',txn='gp-1-'+RUN,store='PLAY_STORE'))[0]==200 and me(X)['pro']['reason']=='free')

# ---- Admin grant / revoke.
A,_=login('patient','Owner') if False else (None,None)
s,r=call('/auth/request-code','POST',{'email':'davlatsudekspert@gmail.com','name':'Owner','role':'patient','lang':'en'});s,r=call('/auth/verify','POST',{'email':'davlatsudekspert@gmail.com','code':r['devCode']});A=r['token']
G,_=login('teacher','Grantee');end_trial(G);gid_=uid(G)
check('non-admin cannot grant',call('/admin/users','PUT',{'id':gid_,'pro':True},G)[0]==403)
check('grant needs a valid length',call('/admin/users','PUT',{'id':gid_,'pro':True,'months':61},A)[0]==400 and call('/admin/users','PUT',{'id':gid_,'pro':True,'months':'x'},A)[0]==400)
check('patients cannot be granted (always free)',call('/admin/users','PUT',{'id':uid(P),'pro':True},A)[0]==400)
check('admin grants Pro',call('/admin/users','PUT',{'id':gid_,'pro':True},A)[0]==200 and me(G)['pro']['reason']=='admin-grant')
users=call('/admin/users?q='+me(G)['email'].replace('+','%2B'),token=A)[1]
check('admin list shows the state and the flag',users['proEnabled'] is True and users['users'][0]['pro']['reason']=='admin-grant')
check('a granted teacher can run many groups',call('/classroom/groups','POST',{'name':'G 1'},G)[0]==201 and call('/classroom/groups','POST',{'name':'G 2'},G)[0]==201)
check('admin revokes Pro',call('/admin/users','PUT',{'id':gid_,'pro':False},A)[0]==200 and me(G)['pro']['reason']=='free')
check('grant for 1 month then expire',call('/admin/users','PUT',{'id':gid_,'pro':True,'months':1},A)[0]==200 and me(G)['pro']['expiresAt'] is not None)
sql(f"UPDATE subscriptions SET expires_at=datetime('now','-1 minute') WHERE original_txn='admin:{gid_}'")
check('expired grant is Free again',me(G)['pro']['reason']=='free')
check('granting twice keeps one row',call('/admin/users','PUT',{'id':gid_,'pro':True},A)[0]==200 and call('/admin/users','PUT',{'id':gid_,'pro':True},A)[0]==200 and sql_json(f"SELECT COUNT(*) AS c FROM subscriptions WHERE user_id='{gid_}'")[0]['c']==1)
check('an admin-granted dentist is listed again',call('/admin/users','PUT',{'id':did,'pro':True},A)[0]==200 and listed())
check('repeated wrong secrets get rate limited',any(hook(ev(wid,'TEST','de_student_monthly'),auth='bad')[0]==429 for _ in range(30)))
check('the right secret still works for the real sender',hook(ev(wid,'TEST','de_student_monthly'))[0]==200)
# ---- Grants by e-mail (Admin panel → Pro): any address, 1/3/6/12 months or unlimited, pending until sign-up, audit log.
def grant(email,months=None,t=None,**kw):return call('/admin/grants','POST',{'email':email,'months':months,**kw},t or A)
def grants():return call('/admin/grants',token=A)[1]['grants']
check('grants: anonymous and non-admin refused',call('/admin/grants')[0]==401 and call('/admin/grants',token=G)[0]==403 and grant('x@example.com',1,G)[0]==403 and call('/admin/grants','DELETE',{'email':'x@example.com'},G)[0]==403)
check('grants: bad email / months refused',all(grant(e,1)[0]==400 for e in ['','nope','a@guest.invalid',None,5]) and all(grant('ok@example.com',m)[0]==400 for m in [0,61,'6',True,-1,1.5]))
H,he=login('student','Existing');end_trial(H)
s,r=grant(he,3);check('grant to an existing account applies now',s==200 and r['applied'] is True and me(H)['pro']['reason']=='admin-grant')
until=[g for g in grants() if g['email']==he][0]
check('list shows email, until and who granted',until['until'] and until['grantedBy']=='davlatsudekspert@gmail.com' and until['registered'] is True)
check('3 months is about 90 days',85<(time.mktime(time.strptime(until['until'],'%Y-%m-%d %H:%M:%S'))-time.time()+time.timezone)/86400<95)
check('revoke removes it',call('/admin/grants','DELETE',{'email':he},A)[0]==200 and me(H)['pro']['reason']=='free' and he not in [g['email'] for g in grants()])
check('revoking an unknown email is a 404',call('/admin/grants','DELETE',{'email':'nobody-here@example.com'},A)[0]==404)
newe=f'later+{time.time_ns()}@example.com'
s,r=grant(newe.upper(),12);check('grant for an email without an account is stored as pending (case-insensitive)',s==200 and r['pending'] is True and [g for g in grants() if g['email']==newe][0]['pending'])
s,r=call('/auth/request-code','POST',{'email':newe,'name':'Later','role':'teacher','lang':'en'});s,r=call('/auth/verify','POST',{'email':newe,'code':r['devCode']})
NT=r['token'];sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{newe}'")
check('the pending grant applies at sign-up',r['user']['pro']['reason']=='admin-grant' and me(NT)['pro']['reason']=='admin-grant' and [g for g in grants() if g['email']==newe][0]['registered'])
check('a 12 month grant lasts about a year',300<(time.mktime(time.strptime(me(NT)['pro']['expiresAt'],'%Y-%m-%dT%H:%M:%SZ'))-time.time()+time.timezone)/86400<370)
rev=f'revoked+{time.time_ns()}@example.com'
grant(rev,1);call('/admin/grants','DELETE',{'email':rev},A)
s,r=call('/auth/request-code','POST',{'email':rev,'name':'R','role':'student','lang':'en'});s,r=call('/auth/verify','POST',{'email':rev,'code':r['devCode']});sql(f"UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='{rev}'")
check('a revoked pending grant is not applied',me(r['token'])['pro']['reason']=='free')
sql(f"UPDATE subscriptions SET expires_at=datetime('now','-1 minute') WHERE original_txn='admin:{uid(NT)}'")
check('the grant duration expires',me(NT)['pro']['reason']=='free')
check('a patient email cannot be granted',grant(me(P)['email'],1)[0]==400)
check('unlimited grant has no end',grant(he,None)[0]==200 and me(H)['pro']['expiresAt'] is None and me(H)['pro']['reason']=='admin-grant')
log=sql_json("SELECT admin_email,action,target FROM admin_audit ORDER BY id DESC LIMIT 40")
check('every change is in the audit log (who, what, target)',any(l['action']=='grant_pro' and l['target']==newe and l['admin_email']=='davlatsudekspert@gmail.com' for l in log) and any(l['action']=='revoke_pro' and l['target']==he for l in log) and any(l['action']=='apply_pending_grant' and l['target']==newe for l in log))

# ---- Free choice of length: N days or N months (not only 1/3/6/12), and the owner always has Pro.
def days_left(email):
    g=[x for x in grants() if x['email']==email][0];return (time.mktime(time.strptime(g['until'],'%Y-%m-%d %H:%M:%S'))-time.time()+time.timezone)/86400
check('days: out of range / not whole refused',all(grant(he,None,days=d)[0]==400 for d in [0,3651,1.5,'5',-3,True]))
check('days: 10 days is about 10 days',grant(he,None,days=10)[0]==200 and 9<days_left(he)<11 and me(H)['pro']['reason']=='admin-grant')
check('days: 1 day works',grant(he,None,days=1)[0]==200 and 0<days_left(he)<1.5)
check('months: any whole number up to 60 (2 months)',grant(he,2)[0]==200 and 55<days_left(he)<65)
d7=f'days+{time.time_ns()}@example.com'
s,r=grant(d7,None,days=7);check('days: pending grant for a new address',s==200 and r['pending'] is True and [g for g in grants() if g['email']==d7][0]['days']==7)
s,r=call('/auth/request-code','POST',{'email':d7,'name':'Days','role':'student','lang':'en'});s,r=call('/auth/verify','POST',{'email':d7,'code':r['devCode']})
check('days: the pending grant starts at sign-up and lasts 7 days',r['user']['pro']['reason']=='admin-grant' and 6<days_left(d7)<8)
# The owner (an admin e-mail) always has Pro: any role, no end date, even when the trial is over.
call('/auth/role','PUT',{'role':'teacher'},A);sql("UPDATE users SET trial_ends_at=datetime('now','-1 day') WHERE email='davlatsudekspert@gmail.com'")
sql("DELETE FROM subscriptions WHERE user_id=(SELECT id FROM users WHERE email='davlatsudekspert@gmail.com')")
o=me(A)['pro'];check('owner: Pro as a teacher with no end date',o['active'] is True and o['reason']=='admin-grant' and o['expiresAt'] is None)
check('owner: can run several groups',call('/classroom/groups','POST',{'name':'Owner G1'},A)[0]==201 and call('/classroom/groups','POST',{'name':'Owner G2'},A)[0]==201)
call('/auth/role','PUT',{'role':'dentist'},A);check('owner: still Pro after switching to dentist',me(A)['pro']['active'] is True)
call('/auth/role','PUT',{'role':'patient'},A)
print(f'{n} checks passed')

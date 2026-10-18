"""QR quick-test API tests: class-only guest accounts, resume, reveal, live roster, limits. Run against the local
`wrangler pages dev` on :8788 (.dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1). Optional env D1_PERSIST: the
--persist-to directory the server uses, so the test can move clocks back (time limit, grace period)."""
import json,os,subprocess,time,urllib.request,urllib.error
from classroom_test_lib import B,call,login
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERSIST=os.environ.get('D1_PERSIST')
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
def sql(q):
    cmd=['npx','wrangler','d1','execute','dental-expert','--local','--command',q]+(['--persist-to',PERSIST] if PERSIST else [])
    subprocess.run(cmd,cwd=ROOT,capture_output=True,check=True)
def web(path,method='GET',body=None,cookie=None,ip=None):
    """Browser-style call (no native header): the guest session comes back as an HttpOnly cookie."""
    h={'origin':'http://127.0.0.1:8788'}
    if body is not None:h['content-type']='application/json'
    if cookie:h['cookie']=cookie
    if ip:h['cf-connecting-ip']=ip
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}'),x.headers.get('set-cookie')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}'),None
def quick(body,token=None):return call('/classroom/quick','POST',body,token)

T,_=login('teacher','Quick Teacher')
s,g=call('/classroom/groups','POST',{'name':'Tezkor test'},T);g=g['group']
s,a=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Karies','deckId':'caries-basics','key':[1,0,2]},T);aid=a['assignment']['id']
s,a2=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Instant','deckId':'caries-basics','key':[0,0],'reveal':'instant'},T);aid2=a2['assignment']['id']

# Joining with the QR code: nickname only, no email.
s,r=quick({'code':g['code'],'nickname':'Lola','assignmentId':aid});check('guest joins with nickname',s==200 and r['user']['guest'] and r['token'] and r['test']['id']==aid)
G1=r['token']
check('guest has no email',call('/auth/me',token=G1)[1]['user']['email']=='')
s,r=quick({'code':g['code'].lower()[:3]+' '+g['code'].lower()[3:],'nickname':'Aziz'});check('code with space and lower case accepted',s==200);G2=r['token']
s,r=quick({'code':g['code'],'nickname':'Nodir','assignmentId':aid});G3=r['token'];check('third student joins',s==200)
check('nickname taken (case-insensitive)',quick({'code':g['code'],'nickname':'lola'})==(409,{'error':'nick_taken'}))
check('profane nickname rejected',quick({'code':g['code'],'nickname':'Сука'})[1].get('error')=='nickname_rejected')
check('reserved numbered nickname rejected',quick({'code':g['code'],'nickname':'Talaba 7'})[1].get('error')=='bad_nickname')
check('nickname required',quick({'code':g['code'],'nickname':''})[1].get('error')=='nickname_required')
check('email-like nickname rejected',quick({'code':g['code'],'nickname':'a@b.uz'})[1].get('error')=='bad_nickname')
check('wrong code 404',quick({'code':'ZZZZZ9','nickname':'Ali'})[0]==404)
check('short code 400',quick({'code':'ABC','nickname':'Ali'})[0]==400)
check('wrong test id 404',quick({'code':g['code'],'nickname':'Ali','assignmentId':'nope'})==(404,{'error':'test_not_found'}))
check('signed-in teacher cannot quick-join',quick({'code':g['code'],'nickname':'Ustoz'},T)[1].get('error')=='teacher_cannot_join')
s,r=quick({'code':g['code'],'nickname':'Lola'},G1);check('same guest scanning again stays one member',s==200 and 'token' not in r)
members=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]['members']
check('roster has exactly three students',len(members)==3)

# A guest session works only in the classroom.
check('guest cannot edit a profile',call('/auth/profile','PUT',{'name':'X'},G1)[0]==401)
check('guest cannot open admin',call('/admin/users',token=G1)[0] in (401,403,404))
check('guest cannot create a group',call('/classroom/groups','POST',{'name':'Mine'},G1)[0]==403)
check('guest cannot read the gradebook',call(f'/classroom/gradebook?groupId={g["id"]}',token=G1)[0]==401)
check('guest cannot create assignments',call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'task','title':'Hi'},G1)[0]==403)
check('guest cannot close a test',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'closed'},G1)[0]==403)
check('guest cannot remove members',call(f'/classroom/members?groupId={g["id"]}&no=1','DELETE',token=G1)[0]==401)
check('guest cannot request an email code for a guest address',call('/auth/request-code','POST',{'email':'guest-x@guest.invalid','lang':'en'})[0]==400)

# Taking the test: resume after closing the app, one attempt, server scoring.
check('start',call('/classroom/start','POST',{'assignmentId':aid},G1)[0]==200)
check('save progress',call('/classroom/progress','POST',{'assignmentId':aid,'answers':[1,None,None]},G1)[0]==200)
check('bad progress rejected',call('/classroom/progress','POST',{'assignmentId':aid,'answers':['x']},G1)[0]==400)
s,r=call('/classroom/start','POST',{'assignmentId':aid},G1);check('reopening resumes with saved answers',s==200 and r.get('resumed') and r['progress']==[1,None,None])
live=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]
lola=[m for m in live['members'] if m['nickname']=='Lola'][0]
check('teacher sees live progress',lola['answer']=='started' and lola['answered']==1 and lola['startedAt'])
check('no question stats while the test is open',live.get('stats') is None)
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,0]},G1);check('submit scores on the server',s==200 and r['score']==2 and r['total']==3 and r.get('review') is None)
check('second submit refused',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},G1)[0]==409)
check('restart after submitting refused',call('/classroom/start','POST',{'assignmentId':aid},G1)==(409,{'error':'already_submitted'}))
call('/classroom/start','POST',{'assignmentId':aid},G2);call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},G2)
call('/classroom/start','POST',{'assignmentId':aid},G3);call('/classroom/submit','POST',{'assignmentId':aid,'answers':[0,1,2]},G3)

# Students never see each other.
s,r=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=G2)
check('student gets no roster even when asking for one',s==200 and r.get('members') is None and r.get('stats') is None)
mine=[x for x in r['assignments'] if x['id']==aid][0]
check('student sees only their own result, no key yet',mine['mine']['score']==3 and mine['mine'].get('review') is None and 'answer_key' not in json.dumps(r))
T2,_=login('teacher','Other Teacher')
check('another teacher cannot read the roster',call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T2)[0]==403)

# Reveal: instant shows the key right after submitting; otherwise after the teacher finishes plus the grace minutes.
call('/classroom/start','POST',{'assignmentId':aid2},G1)
s,r=call('/classroom/submit','POST',{'assignmentId':aid2,'answers':[0,1]},G1)
check('instant reveal returns the key to the submitter',s==200 and r['review']['correct']==[0,0])
check('instant reveal is not given to students still answering',[x for x in call(f'/classroom/assignments?groupId={g["id"]}',token=G2)[1]['assignments'] if x['id']==aid2][0]['mine'] is None)
check('teacher finishes the test',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'closed'},T)[0]==200)
st=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1].get('stats')
check('hardest-question stats after closing',st==[{'right':2,'answered':3},{'right':2,'answered':3},{'right':2,'answered':3}])
check('late submit after closing refused',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},G3)[0]==409)
if PERSIST:
    sql(f"UPDATE class_assignments SET closed_at=datetime('now','-3 minutes') WHERE id='{aid}'")
    r=call(f'/classroom/assignments?groupId={g["id"]}',token=G1)[1]
    check('key visible to the student after the grace period',[x for x in r['assignments'] if x['id']==aid][0]['mine']['review']['correct']==[1,0,2])
    # Time limit on a topic test.
    tid='card-01'
    call('/classroom/topics','POST',{'groupId':g['id'],'topicId':tid,'action':'open'},T)
    s,r=call('/classroom/topics','POST',{'groupId':g['id'],'topicId':tid,'action':'test','questions':[0,1],'minutes':1},T)
    tt=r['testId']
    s,r=quick({'code':g['code'],'nickname':'Lola','assignmentId':tt},G1);check('QR for a topic test resolves while the topic is open',s==200 and r['test']['id']==tt)
    call('/classroom/start','POST',{'assignmentId':tt},G2)
    sql(f"UPDATE class_submissions SET started_at=datetime('now','-5 minutes') WHERE assignment_id='{tt}'")
    check('submit after the time limit refused',call('/classroom/submit','POST',{'assignmentId':tt,'answers':[0,0]},G2)==(409,{'error':'time_up'}))
    check('resume after the time limit refused',call('/classroom/start','POST',{'assignmentId':tt},G2)==(409,{'error':'time_up'}))
else:print('SKIP clock tests (set D1_PERSIST)')

# Web browsers get the guest session as an HttpOnly cookie.
s,r,ck=web('/classroom/quick','POST',{'code':g['code'],'nickname':'Malika'})
check('web guest gets an HttpOnly cookie, no token in the body',s==200 and ck and 'HttpOnly' in ck and 'token' not in r)
cookie=ck.split(';')[0]
check('cookie session works in the classroom',web(f'/classroom/groups',cookie=cookie)[0]==200)

# Teacher removes a student; leaving the last group deletes the guest.
no=[m for m in call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]['members'] if m['nickname']=='Nodir'][0]['no']
check('teacher removes a student',call(f'/classroom/members?groupId={g["id"]}&no={no}','DELETE',token=T)[0]==200)
check('removed guest is gone',call('/auth/me',token=G3)[1]['user'] is None)
s,r=quick({'code':g['code'],'nickname':'Kamola'});G4=r['token']
call(f'/classroom/join?groupId={g["id"]}','DELETE',token=G4)
check('guest leaving the last group is deleted',call('/auth/me',token=G4)[1]['user'] is None)

# Signing in later keeps the results.
e=f'adopt+{time.time_ns()}@example.com'
s,r=call('/auth/request-code','POST',{'email':e,'name':'Aziz K','role':'student','lang':'en'})
s,r=call('/auth/verify','POST',{'email':e,'code':r['devCode']},G2);U=r['token']
grp=call('/classroom/groups',token=U)[1]['groups']
check('signed-in account keeps the group and nickname',len(grp)==1 and grp[0]['myNickname']=='Aziz')
mine=[x for x in call(f'/classroom/assignments?groupId={g["id"]}',token=U)[1]['assignments'] if x['id']==aid][0]['mine']
check('signed-in account keeps the result',mine and mine['score']==3)
check('old guest session no longer works',call('/auth/me',token=G2)[1]['user'] is None)

# A student already in the group cannot keep a better guest attempt under their real name.
S2,se=login('student','Real Student')
call('/classroom/join','POST',{'code':g['code'],'nickname':'Realstu'},S2)
s,r=quick({'code':g['code'],'nickname':'Burner'});GB=r['token']
call('/classroom/start','POST',{'assignmentId':aid2},GB);call('/classroom/submit','POST',{'assignmentId':aid2,'answers':[0,0]},GB)
if PERSIST:sql(f"DELETE FROM auth_codes WHERE email='{se}'")
s,r=call('/auth/request-code','POST',{'email':se,'lang':'en'})
if r.get('devCode'):
    U2=call('/auth/verify','POST',{'email':se,'code':r['devCode']},GB)[1]['token']
    mine=[x for x in call(f'/classroom/assignments?groupId={g["id"]}',token=U2)[1]['assignments'] if x['id']==aid2][0]['mine']
    check('guest attempt is not merged into an account already in the group',mine is None)
    check('that guest is still removed',call('/auth/me',token=GB)[1]['user'] is None)
else:print('SKIP adoption-into-member check (resend timer)')

# Join codes guessed through /classroom/join by several free guests still hit the same per-IP cap.
gip=f'198.51.100.{time.time_ns()%250}'
def native_ip(path,body,token):
    h={'x-client':'native','origin':'https://localhost','content-type':'application/json','authorization':'Bearer '+token,'cf-connecting-ip':gip}
    try:x=urllib.request.urlopen(urllib.request.Request(B+path,data=json.dumps(body).encode(),headers=h,method='POST'));return x.status
    except urllib.error.HTTPError as e:return e.code
codes=[]
for k in range(4):
    s,r=quick({'code':g['code'],'nickname':f'Guess{k}'});codes.append(r['token'])
st=[native_ip('/classroom/join',{'code':f'WWW{i:03d}'},codes[i%4]) for i in range(34)]
check('join-code guessing by many guests is capped per IP',st.count(429)>=3 and st[:30].count(404)==30)

# Guest account deletion (privacy).
check('guest can delete their account',call('/auth/account','DELETE',token=G1)[0]==200 and call('/auth/me',token=G1)[1]['user'] is None)

# Wrong-code guessing is capped per IP, even for a right code afterwards.
ip=f'203.0.113.{time.time_ns()%250}'
for i in range(30):web('/classroom/quick','POST',{'code':f'QQQ{i:03d}','nickname':'Ali'},ip=ip)
check('guessing limit',web('/classroom/quick','POST',{'code':g['code'],'nickname':'Ali'},ip=ip)[0]==429)
print(f'{n} checks passed')

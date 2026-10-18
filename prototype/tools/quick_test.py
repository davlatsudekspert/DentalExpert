"""QR join API tests (POST /api/classroom/quick): registered accounts only, the teacher's own code, nickname on the first
visit, resume, reveal, live roster, the end of class-only guests, limits. Run against the local `wrangler pages dev`
(DE_PORT, default 8788; .dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1). D1_PERSIST: the server's --persist-to
directory, so the test can move clocks back and seed an old guest account."""
import json,os,time,urllib.request,urllib.error
from classroom_test_lib import B,call,login,legacy_guest,sql,sql_json
PERSIST=os.environ.get('D1_PERSIST')
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
def web(path,method='GET',body=None,cookie=None,ip=None):
    """Browser-style call (no native header)."""
    h={'origin':B[:-4]}
    if body is not None:h['content-type']='application/json'
    if cookie:h['cookie']=cookie
    if ip:h['cf-connecting-ip']=ip
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}'),x.headers.get('set-cookie')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}'),None
def quick(body,token=None,ip=None):return call('/classroom/quick','POST',body,token,ip)

T,_=login('teacher','Quick Teacher')
s,g=call('/classroom/groups','POST',{'name':'Tezkor test'},T);g=g['group']
s,a=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Karies','deckId':'caries-basics','key':[1,0,2]},T);aid=a['assignment']['id']
s,a2=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Instant','deckId':'caries-basics','key':[0,0],'reveal':'instant'},T);aid2=a2['assignment']['id']
S1,_=login('student','Lola K');S2,_=login('student','Aziz R');S3,_=login('student','Nodir T')
guests0=sql_json('SELECT COUNT(*) AS n FROM users WHERE guest=1')[0]['n'] if PERSIST else None

# No anonymous or one-time accounts any more.
check('signed out: 401, nothing created',quick({'code':g['code'],'nickname':'Lola','assignmentId':aid})==(401,{'error':'unauthorized'}))
s,r,ck=web('/classroom/quick','POST',{'code':g['code'],'nickname':'Malika'})
check('browser signed out: 401 and no session cookie',s==401 and not ck)

# The group's own teacher: told so, nothing joined.
s,r=quick({'code':g['code'],'assignmentId':aid},T)
check('teacher opening their own code gets role owner (no join)',s==200 and r['role']=='owner' and r['group']['id']==g['id'] and r['test']['id']==aid)
check('own group stays without members',call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]['members']==[])
T2,_=login('teacher','Other Teacher')
check('another teacher cannot join as a student',quick({'code':g['code']},T2)==(400,{'error':'teacher_cannot_join'}))

# First visit: the server asks for a nickname before joining; then the test opens.
s,r=quick({'code':g['code'],'assignmentId':aid},S1)
check('first visit without a nickname: needNickname, not joined',s==200 and r['role']=='none' and r.get('needNickname') and r['group'].get('id') is None and r['test']['title']=='Karies')
check('still not a member',call(f'/classroom/assignments?groupId={g["id"]}',token=S1)[0]==403)
s,r=quick({'code':g['code'],'assignmentId':aid,'nickname':'Lola'},S1)
check('joins with a nickname',s==200 and r['role']=='member' and r['joined'] and r['nickname']=='Lola' and r['test']['id']==aid)
s,r=quick({'code':g['code'],'assignmentId':aid},S1)
check('second scan: already a member, no nickname asked',s==200 and r['role']=='member' and r['joined'] is False and r['nickname']=='Lola')
s,r=quick({'code':g['code'].lower()[:3]+' '+g['code'].lower()[3:],'nickname':'Aziz'},S2);check('code with space and lower case accepted',s==200 and r['joined'])
check('nickname taken (case-insensitive)',quick({'code':g['code'],'nickname':'lola'},S3)==(409,{'error':'nick_taken'}))
check('profane nickname rejected',quick({'code':g['code'],'nickname':'Сука'},S3)[1].get('error')=='nickname_rejected')
check('reserved numbered nickname rejected',quick({'code':g['code'],'nickname':'Talaba 7'},S3)[1].get('error')=='bad_nickname')
check('email-like nickname rejected',quick({'code':g['code'],'nickname':'a@b.uz'},S3)[1].get('error')=='bad_nickname')
check('wrong code 404',quick({'code':'ZZZZZ9','nickname':'Ali'},S3)[0]==404)
check('short code 400',quick({'code':'ABC','nickname':'Ali'},S3)==(400,{'error':'bad_code'}))
check('code with 0/O/1/I is flagged as misread',quick({'code':'G0R1BA','nickname':'Ali'},S3)==(400,{'error':'ambiguous_code'}))
check('wrong test id 404',quick({'code':g['code'],'nickname':'Ali','assignmentId':'nope-nope'},S3)==(404,{'error':'test_not_found'}))
s,r=quick({'code':g['code'],'nickname':'Nodir','assignmentId':aid},S3);check('third student joins',s==200)
members=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]['members']
check('roster has exactly three students, by nickname',sorted(m['nickname'] for m in members)==['Aziz','Lola','Nodir'] and 'email' not in json.dumps(members))

# Taking the test: resume after closing the app, one attempt, server scoring.
check('start',call('/classroom/start','POST',{'assignmentId':aid},S1)[0]==200)
check('save progress',call('/classroom/progress','POST',{'assignmentId':aid,'answers':[1,None,None]},S1)[0]==200)
check('bad progress rejected',call('/classroom/progress','POST',{'assignmentId':aid,'answers':['x']},S1)[0]==400)
s,r=call('/classroom/start','POST',{'assignmentId':aid},S1);check('reopening resumes with saved answers and the server clock',s==200 and r.get('resumed') and r['progress']==[1,None,None] and r['startedAt'].endswith('Z'))
live=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]
lola=[m for m in live['members'] if m['nickname']=='Lola'][0]
check('teacher sees live progress',lola['answer']=='started' and lola['answered']==1 and lola['startedAt'])
check('no question stats while the test is open',live.get('stats') is None)
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,0]},S1);check('submit scores on the server',s==200 and r['score']==2 and r['total']==3 and r.get('review') is None)
check('second submit refused',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},S1)[0]==409)
check('restart after submitting refused',call('/classroom/start','POST',{'assignmentId':aid},S1)==(409,{'error':'already_submitted'}))
call('/classroom/start','POST',{'assignmentId':aid},S2);call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},S2)
call('/classroom/start','POST',{'assignmentId':aid},S3);call('/classroom/submit','POST',{'assignmentId':aid,'answers':[0,1,2]},S3)

# Students never see each other.
s,r=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=S2)
check('student gets no roster even when asking for one',s==200 and r.get('members') is None and r.get('stats') is None)
mine=[x for x in r['assignments'] if x['id']==aid][0]
check('student sees only their own result, no key yet',mine['mine']['score']==3 and mine['mine'].get('review') is None and 'answer_key' not in json.dumps(r))
check('another teacher cannot read the roster',call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T2)[0]==403)

# Reveal: instant shows the key right after submitting; otherwise after the teacher finishes plus the grace minutes.
call('/classroom/start','POST',{'assignmentId':aid2},S1)
s,r=call('/classroom/submit','POST',{'assignmentId':aid2,'answers':[0,1]},S1)
check('instant reveal returns the key to the submitter',s==200 and r['review']['correct']==[0,0])
check('instant reveal is not given to students still answering',[x for x in call(f'/classroom/assignments?groupId={g["id"]}',token=S2)[1]['assignments'] if x['id']==aid2][0]['mine'] is None)
check('teacher finishes the test',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'closed'},T)[0]==200)
st=call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1].get('stats')
check('hardest-question stats after closing',st==[{'right':2,'answered':3},{'right':2,'answered':3},{'right':2,'answered':3}])
check('late submit after closing refused',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[1,0,2]},S3)[0]==409)
s,r=quick({'code':g['code'],'assignmentId':aid},S1);check('QR of a finished test still resolves (the app shows the result)',s==200 and r['test']['ended'] is True)
if PERSIST:
    sql(f"UPDATE class_assignments SET closed_at=datetime('now','-3 minutes') WHERE id='{aid}'")
    r=call(f'/classroom/assignments?groupId={g["id"]}',token=S1)[1]
    check('key visible to the student after the grace period',[x for x in r['assignments'] if x['id']==aid][0]['mine']['review']['correct']==[1,0,2])

    # Old class-only guests: no new ones; existing ones may only read, leave, sign out or delete, until they expire.
    check('this run created no guest accounts',sql_json('SELECT COUNT(*) AS n FROM users WHERE guest=1')[0]['n']==guests0)
    G,gid=legacy_guest('Eski')
    sql(f"INSERT INTO class_members (group_id,user_id,member_no,nickname) VALUES ('{g['id']}','{gid}',90,'Eski')")
    check('old guest still reads its groups',call('/classroom/groups',token=G)[0]==200)
    check('old guest cannot join by QR',quick({'code':g['code'],'nickname':'Yangi'},G)[0]==401)
    check('old guest cannot join by code',call('/classroom/join','POST',{'code':g['code']},G)[0]==401)
    check('old guest cannot start a test',call('/classroom/start','POST',{'assignmentId':aid2},G)[0]==401)
    check('old guest cannot submit or save progress',call('/classroom/submit','POST',{'assignmentId':aid2,'answers':[0,0]},G)[0]==401 and call('/classroom/progress','POST',{'assignmentId':aid2,'answers':[0]},G)[0]==401)
    check('old guest cannot edit a profile',call('/auth/profile','PUT',{'name':'X'},G)[0]==401)
    exp=lambda:sql_json(f"SELECT expires_at FROM sessions WHERE user_id='{gid}'")
    sql(f"UPDATE users SET last_seen_at=datetime('now','-3 days') WHERE id='{gid}'");before=exp()
    call('/classroom/groups',token=G);call(f'/classroom/assignments?groupId={g["id"]}',token=G)
    check('using it no longer extends the guest session',before==exp())
    # Signing in on that device moves the guest's groups to the real account.
    e=f'adopt+{time.time_ns()}@example.com'
    s,r=call('/auth/request-code','POST',{'email':e,'name':'Eski Talaba','role':'student','lang':'en'})
    s,r=call('/auth/verify','POST',{'email':e,'code':r['devCode']},G);U=r['token']
    grp=call('/classroom/groups',token=U)[1]['groups']
    check('signing in keeps the old guest group and nickname',len(grp)==1 and grp[0]['myNickname']=='Eski')
    check('the guest itself is gone',call('/auth/me',token=G)[1]['user'] is None)
    G2,gid2=legacy_guest('Ketdi')
    sql(f"INSERT INTO class_members (group_id,user_id,member_no,nickname) VALUES ('{g['id']}','{gid2}',91,'Ketdi')")
    call(f'/classroom/join?groupId={g["id"]}','DELETE',token=G2)
    check('old guest leaving the last group is deleted',call('/auth/me',token=G2)[1]['user'] is None)
else:print('SKIP clock and old-guest tests (set D1_PERSIST)')

# Teacher removes a student; a registered student keeps their account.
no=[m for m in call(f'/classroom/assignments?groupId={g["id"]}&assignmentId={aid}',token=T)[1]['members'] if m['nickname']=='Nodir'][0]['no']
check('teacher removes a student',call(f'/classroom/members?groupId={g["id"]}&no={no}','DELETE',token=T)[0]==200)
check('the removed student keeps their account',call('/auth/me',token=S3)[1]['user'] is not None and call('/classroom/groups',token=S3)[1]['groups']==[])

# Limits: QR joins per account, wrong codes per IP (shared with /classroom/join).
SX,_=login('student','Limit Student')
st=[quick({'code':g['code']},SX)[0] for _ in range(31)]
check('QR join calls are rate limited per account (30 / 10 min)',st[:30].count(200)==30 and st[30]==429)
ip=f'203.0.113.{time.time_ns()%250}'
SY,_=login('student','Guess One');SZ,_=login('student','Guess Two')
for i in range(30):quick({'code':'QQQ'+'ABCDEFGHJKLMNPQRSTUVWXYZ2345678'[i]+'ZZ'},[SY,SZ][i%2],ip=ip)
check('code guessing limit per IP, even for a right code afterwards',quick({'code':g['code']},SY,ip=ip)[0]==429)
print(f'{n} checks passed')

"""Teacher–student test v2 API suite: nicknames (iPhone apostrophes), join codes, per-student variants (shared vectors and
the live server's draws against the independent Python implementation), permissions, time limit and deadline with the
server's grace period, reveal rules, the 200-member cap and the per-account limits. Run against the local
`wrangler pages dev` (DE_PORT, default 8788; .dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1) with D1_PERSIST set to the
server's --persist-to directory (clocks are moved back and a full group is seeded through the local database)."""
import datetime as dt,json,os,subprocess,sys,uuid
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from classroom_test_lib import ROOT,call,login,sql,sql_json  # noqa: E402
from variant_vectors import draw  # noqa: E402
assert os.environ.get('D1_PERSIST'),'set D1_PERSIST to the server --persist-to directory'
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name,flush=True);assert cond,name;n+=1
keys=json.loads(open(os.path.join(ROOT,'functions/_lib/curriculumKeys.ts')).read().split('}>=',1)[1].rstrip().rstrip(';'))
def me(tok):return call('/auth/me',token=tok)[1]['user']['id']
def topic(g,tid,T,action='open',**kw):return call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':action,**kw},T)
def mine(g,aid,tok):return [x for x in call(f'/classroom/assignments?groupId={g}',token=tok)[1]['assignments'] if x['id']==aid][0]
def iso(minutes):return (dt.datetime.now(dt.timezone.utc)+dt.timedelta(minutes=minutes)).isoformat()
def correct(refs):return [keys[r[:r.rindex(':')]]['c'][int(r[r.rindex(':')+1:])] for r in refs]

# 1. The shared vectors: the Python reference, the TypeScript module (server and app) and this run agree.
subprocess.run([sys.executable,'tools/variant_vectors.py','--check'],cwd=ROOT,check=True)
subprocess.run(['npx','tsx','tools/variant_test.ts'],cwd=ROOT,check=True)
check('shared vectors: Python and TypeScript draws agree',True)

T,_=login('teacher','Ustoz V2');S=[login('student',f'Talaba {k}')[0] for k in 'ABCD']
s,r=call('/classroom/groups','POST',{'name':'Variant guruh'},T);G=r['group'];g=G['id']
check('generated codes never contain 0/O/1/I',not set(G['code'])&set('0O1I'))

# 2. Nicknames: iPhone smart punctuation and Uzbek apostrophes are one and the same plain '.
s,r=call('/classroom/join','POST',{'code':G['code'],'nickname':'G’ayrat'},S[0])
check('G’ayrat (U+2019) accepted',s==200)
check('stored as G\'ayrat',call(f'/classroom/groups',token=S[0])[1]['groups'][0]['myNickname']=="G'ayrat")
check('Gʻayrat (U+02BB) is the same name: taken',call('/classroom/join','POST',{'code':G['code'],'nickname':'Gʻayrat'},S[1])==(409,{'error':'nick_taken'}))
check('O‘tkir accepted',call('/classroom/join','POST',{'code':G['code'],'nickname':'O‘tkir'},S[1])[0]==200)
check('emoji nickname: clear error',call('/classroom/join','POST',{'code':G['code'],'nickname':'😀😀'},S[2])==(400,{'error':'bad_nickname'}))
check('Cyrillic look-alike letters in a typed code are read as Latin',call('/classroom/join','POST',{'code':G['code'].translate(str.maketrans('ABCEHKMPTXY','АВСЕНКМРТХУ')).lower(),'nickname':'Madina'},S[2])[0]==200)
check('0/O/1/I in a typed code: ambiguous_code',call('/classroom/join','POST',{'code':'OOO111','nickname':'Ali'},S[3])==(400,{'error':'ambiguous_code'}))
call('/classroom/join','POST',{'code':G['code'],'nickname':'Diyor'},S[3])
names=['Shahnoza','Dilnoza','Muhammadali','Sardor','Jasur','Gulnora','Oybek','Nilufar','Bekzod','Kamola','Zarina','Ulug‘bek','Shoxrux','Ravshan','Feruza','Asal','Behruz','Mohira','Sanjar','Iroda']
check('common Uzbek names pass the word filter',all(call('/classroom/quick','POST',{'code':'ZZZZZZ','nickname':x},S[3])[1].get('error')=='not_found' for x in names[:12]))

# 3. A variant test: 5 of the topic's 10 questions each (2 × 5 ≤ 10).
tid='perio-03';sub='perio-'
check('teacher opens the topic',topic(g,tid,T)[0]==200)
check('6 per student from 10 is refused (needs a pool of 12)',topic(g,tid,T,'test',variant={'count':6},minutes=10)==(400,{'error':'variant_pool_small','pool':10,'max':5}))
check('student cannot start a topic test',topic(g,tid,S[0],'test',variant={'count':5},minutes=10)[0]==403)
s,r=topic(g,tid,T,'test',variant={'count':5},minutes=10,reveal='closed',title='Variant')
check('variant test with 5 per student starts',s==201 and r['pool']==10);aid=r['testId']
a=mine(g,aid,S[0])
check('students see the pool refs and the count, never a key',a['variant'] and a['items']==[f'{tid}:{i}' for i in range(10)] and a['questionCount']==5 and 'answer_key' not in json.dumps(a) and 'correct' not in json.dumps(a))
sets=[]
for k,tok in enumerate(S):
    s,r=call('/classroom/start','POST',{'assignmentId':aid},tok)
    exp=[a['items'][i] for i in draw(aid,me(tok),a['items'],5,tid)]
    check(f'student {k+1}: server draw = Python reference draw',s==200 and r['questions']==exp and r['total']==5)
    sets.append(tuple(sorted(r['questions'])))
    s,r2=call('/classroom/start','POST',{'assignmentId':aid},tok)
    check(f'student {k+1}: resume keeps the same questions',r2['resumed'] and r2['questions']==r['questions'])
check('the students got different sets (each its own draw; a chance repeat of 5 of 10 is allowed)',len(set(sets))>=3)
q0=call('/classroom/start','POST',{'assignmentId':aid},S[0])[1]['questions']
check('wrong answer count refused',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[0]*4},S[0])[0]==400)
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':correct(q0)},S[0])
check('server scores against the student\'s own questions (5/5), no key before reveal',s==200 and r['score']==5 and r['total']==5 and 'review' not in r)
q1=call('/classroom/start','POST',{'assignmentId':aid},S[1])[1]['questions']
wrong=[(c+1)%4 for c in correct(q1)]
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':wrong[:2]+correct(q1)[2:]},S[1]);check('3/5 for the second student',r['score']==3)
check('a student never gets the roster or stats',call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=S[0])[1].get('members') is None)
check('a student cannot read the topic key',topic(g,tid,S[0])[0]==403 and call(f'/classroom/topics?groupId={g}&key={tid}',token=S[0])[0]==403)
s,r=call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T)
rows={m['nickname']:m for m in r['members']}
check('teacher sees every row: done with score, answering, by nickname',rows["G'ayrat"]['score']==5 and rows['O\'tkir']['score']==3 and rows['Madina']['answer']=='started' and rows['Diyor']['answer']=='started')
check('teacher sees which questions each student got',rows["G'ayrat"]['questions']==q0)
check('gradebook total is the per-student count',[q for q in call(f'/classroom/gradebook?groupId={g}',token=T)[1]['quizzes'] if q['id']==aid][0]['total']==5)

# 4. Permissions: another teacher, a student of another group.
T2,_=login('teacher','Boshqa ustoz');O,_=login('student','Begona')
check('other teacher cannot read the roster',call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T2)[0]==403)
check('other teacher cannot close the test',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'closed'},T2)[0]==403)
check('other teacher cannot finish it through the topic',topic(g,tid,T2,'finish')[0]==403)
check('other teacher cannot read the key',call(f'/classroom/topics?groupId={g}&key={tid}',token=T2)[0]==403)
check('other teacher cannot delete it',call('/classroom/assignments?assignmentId='+aid,'DELETE',token=T2)[0]==200 and mine(g,aid,S[0]) is not None)
check('outsider cannot start or submit',call('/classroom/start','POST',{'assignmentId':aid},O)[0]==403 and call('/classroom/submit','POST',{'assignmentId':aid,'answers':[0]*5},O)[0]==403)
check('member cannot close the test',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'closed'},S[0])[0]==403)

# 5. Reveal after the teacher finishes, plus grace: each student sees only their own questions' answers.
check('teacher finishes',topic(g,tid,T,'finish')[0]==200)
st=call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T)[1]['stats']
check('stats per pool question count only the students who had it',len(st)==10 and sum(x['answered'] for x in st)==10 and sum(x['right'] for x in st)==8)
check('no review during the grace minutes','review' not in mine(g,aid,S[0])['mine'])
sql(f"UPDATE class_assignments SET closed_at=datetime('now','-3 minutes') WHERE id='{aid}'")
rv=mine(g,aid,S[0])['mine']['review']
check('review: own questions, right answers, explanations',rv['questions']==q0 and rv['correct']==correct(q0) and len(rv['explain'])==5 and all(rv['explain']))
m2=mine(g,aid,S[2])['mine']
check('a student who started and never submitted is finished by the server after the grace (no answers → 0)',m2['answer']=='done' and m2['score']==0 and m2['review']['answers']==[-1]*5)

# 6. Pool from topics the group has opened: 8 per student needs 16+ questions.
tid2='perio-04'
topic(g,'perio-01',T);topic(g,'perio-02',T);topic(g,tid2,T)
s,r=topic(g,tid2,T,'test',variant={'count':8,'extra':True},minutes=None,reveal='closed')
check('extra topics make a pool of 40 (4 opened topics)',s==201 and r['pool']==40);aid2=r['testId']
a2=mine(g,aid2,S[0]);check('pool starts with the test topic',a2['items'][:10]==[f'{tid2}:{i}' for i in range(10)] and len(a2['items'])==40)
s,r=call('/classroom/start','POST',{'assignmentId':aid2},S[0])
check('no time limit: no end time without a deadline',s==200 and r['minutes'] is None and r['endsAt'] is None)
check('half the questions come from the test topic',sum(x.startswith(tid2+':') for x in r['questions'])==4 and r['questions']==[a2['items'][i] for i in draw(aid2,me(S[0]),a2['items'],8,tid2)])
check('31 per student is refused outright',topic(g,'perio-05',T)[0]==200 and topic(g,'perio-05',T,'test',variant={'count':31,'extra':True})[1]['error']=='bad_questions')

# 7. Time limit: the server's clock and a 2-minute grace.
tid3='prev-02';topic(g,tid3,T)
s,r=topic(g,tid3,T,'test',questions=[0,1,2],minutes=3);aid3=r['testId']
s,r=call('/classroom/start','POST',{'assignmentId':aid3},S[0]);check('time-limited start returns endsAt = start + 3 min',s==200 and abs((dt.datetime.fromisoformat(r['endsAt'].replace('Z','+00:00'))-dt.datetime.fromisoformat(r['startedAt'].replace('Z','+00:00'))).total_seconds()-180)<2)
call('/classroom/start','POST',{'assignmentId':aid3},S[1])
sql(f"UPDATE class_submissions SET started_at=datetime('now','-4 minutes') WHERE assignment_id='{aid3}' AND user_id='{me(S[0])}'")
k3=[keys[tid3]['c'][i] for i in [0,1,2]]
check('submit inside the grace (limit + 1 min) accepted',call('/classroom/submit','POST',{'assignmentId':aid3,'answers':k3},S[0])[1].get('score')==3)
sql(f"UPDATE class_submissions SET started_at=datetime('now','-6 minutes') WHERE assignment_id='{aid3}' AND user_id='{me(S[1])}'")
check('submit beyond the grace refused',call('/classroom/submit','POST',{'assignmentId':aid3,'answers':k3},S[1])==(409,{'error':'time_up'}))
check('resume after the time limit refused',call('/classroom/start','POST',{'assignmentId':aid3},S[1])==(409,{'error':'time_up'}))

# 8. Deadline: validation, start/submit around it, reveal 'deadline'.
tid4='prev-03';topic(g,tid4,T)
check('deadline in the past refused',topic(g,tid4,T,'test',questions=[0,1],minutes=None,deadline=iso(-5))==(400,{'error':'bad_deadline'}))
check('deadline reveal needs a deadline',topic(g,tid4,T,'test',questions=[0,1],reveal='deadline')==(400,{'error':'reveal_needs_deadline'}))
s,r=topic(g,tid4,T,'test',questions=[0,1],minutes=None,deadline=iso(90),reveal='deadline');aid4=r['testId']
a4=mine(g,aid4,S[0]);check('students see the deadline (UTC ISO) and the reveal rule',s==201 and a4['deadlineAt'].endswith('Z') and a4['reveal']=='deadline' and a4['ended'] is False)
s,r=call('/classroom/start','POST',{'assignmentId':aid4},S[0]);check('no time limit + deadline: endsAt = deadline',r['endsAt'][:16]==a4['deadlineAt'][:16])
call('/classroom/start','POST',{'assignmentId':aid4},S[1])
k4=[keys[tid4]['c'][i] for i in [0,1]]
sql(f"UPDATE class_assignments SET deadline_at=datetime('now','-1 minutes') WHERE id='{aid4}'")
check('after the deadline nobody new can start',call('/classroom/start','POST',{'assignmentId':aid4},S[2])==(409,{'error':'past_due'}))
check('a started student submits within the grace',call('/classroom/submit','POST',{'assignmentId':aid4,'answers':k4},S[0])[1].get('score')==2)
check('the test counts as ended once its deadline passed',mine(g,aid4,S[0])['ended'] is True)
check('no review during the grace after the deadline','review' not in mine(g,aid4,S[0])['mine'])
sql(f"UPDATE class_assignments SET deadline_at=datetime('now','-3 minutes') WHERE id='{aid4}'")
check('beyond the grace a late submit is refused',call('/classroom/submit','POST',{'assignmentId':aid4,'answers':k4},S[1])==(409,{'error':'past_due'}))
check('reveal "deadline": answers open after the deadline without the teacher',mine(g,aid4,S[0])['mine']['review']['correct']==k4)
# The late student who started was finished by the server with no answers, so two attempts count.
check('teacher stats once the deadline passed',call(f'/classroom/assignments?groupId={g}&assignmentId={aid4}',token=T)[1]['stats']==[{'right':1,'answered':2},{'right':1,'answered':2}])

# 9. 200 members at most (198 seeded rows + the 4 students = full at 200).
T3,_=login('teacher','Katta guruh');s,r=call('/classroom/groups','POST',{'name':'200 talaba'},T3);big=r['group']
call('/classroom/join','POST',{'code':big['code'],'nickname':'Birinchi'},S[0])
rows=[];users=[]
for i in range(199):
    uid=str(uuid.uuid4());users.append(f"('{uid}','cap{i}-{uid[:8]}@example.com','Cap {i}','student')");rows.append(f"('{big['id']}','{uid}',{i+2},'Cap{i}')")
sql('INSERT INTO users (id,email,name,role) VALUES '+','.join(users)+';INSERT INTO class_members (group_id,user_id,member_no,nickname) VALUES '+','.join(rows))
check('group now has 200 members',sql_json(f"SELECT COUNT(*) AS n FROM class_members WHERE group_id='{big['id']}'")[0]['n']==200)
check('201st student: group_full',call('/classroom/join','POST',{'code':big['code'],'nickname':'Oxirgi'},S[1])==(409,{'error':'group_full'}))
check('201st by QR: group_full',call('/classroom/quick','POST',{'code':big['code'],'nickname':'Oxirgi'},S[1])==(409,{'error':'group_full'}))
check('a member already in the full group still opens it',call('/classroom/quick','POST',{'code':big['code']},S[0])[1]['role']=='member')

# 10. Per-account limits on start, submit and progress.
R,_=login('student','Limit');call('/classroom/join','POST',{'code':G['code'],'nickname':'Limit'},R)
tid5='prev-04';topic(g,tid5,T);aid5=topic(g,tid5,T,'test',questions=[0,1],minutes=30)[1]['testId']
st=[call('/classroom/start','POST',{'assignmentId':aid5},R)[0] for _ in range(41)]
check('start: 40 per 10 minutes, then 429',st[:40].count(200)==40 and st[40]==429)
pr=[call('/classroom/progress','POST',{'assignmentId':aid5,'answers':[0,None]},R)[0] for _ in range(241)]
check('progress: 240 per 10 minutes, then 429',pr[:240].count(200)==240 and pr[240]==429)
sb=[call('/classroom/submit','POST',{'assignmentId':aid5,'answers':[0]},R)[0] for _ in range(31)]
check('submit: 30 per 10 minutes, then 429',sb[:30].count(400)==30 and sb[30]==429)
print(f'{n} checks passed')

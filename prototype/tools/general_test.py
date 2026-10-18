"""General test API suite (POST /api/classroom/general) and the shared rules it relies on: questions spread evenly over
the chosen sources (round robin, no repeats), caps (50 questions, sources, pool), variants only with a pool ≥ 2 × count,
deck questions scored with the server's key, the open window (deadline), auto-submit of an expired attempt with the
answers saved so far, permissions, and the topic test's custom count. Local `wrangler pages dev` (DE_PORT) with
D1_PERSIST = its --persist-to directory."""
import datetime as dt,json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from classroom_test_lib import ROOT,call,login,sql  # noqa: E402
from variant_vectors import draw  # noqa: E402
assert os.environ.get('D1_PERSIST'),'set D1_PERSIST to the server --persist-to directory'
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name,flush=True);assert cond,name;n+=1
ck=json.loads(open(os.path.join(ROOT,'functions/_lib/curriculumKeys.ts')).read().split('}>=',1)[1].rstrip().rstrip(';'))
dk=json.loads(open(os.path.join(ROOT,'functions/_lib/deckKeys.ts')).read().split('}>=',1)[1].rstrip().rstrip(';'))
def key(ref):
    s,i=ref.rsplit(':',1);i=int(i)
    return dk[s[5:]]['c'][i] if s.startswith('deck.') else ck[s]['c'][i]
def src(ref):return ref.rsplit(':',1)[0]
def iso(minutes):return (dt.datetime.now(dt.timezone.utc)+dt.timedelta(minutes=minutes)).isoformat()
def me(tok):return call('/auth/me',token=tok)[1]['user']['id']
def gen(T,g,**kw):return call('/classroom/general','POST',{'groupId':g,'title':'Umumiy test: sinov',**kw},T)
def mine(g,aid,tok):return [x for x in call(f'/classroom/assignments?groupId={g}',token=tok)[1]['assignments'] if x['id']==aid][0]

T,_=login('teacher','Ustoz Umumiy');S=[login('student',f'Talaba {k}')[0] for k in 'ABC'];O,_=login('student','Begona');T2,_=login('teacher','Boshqa')
s,r=call('/classroom/groups','POST',{'name':'Umumiy guruh'},T);G=r['group'];g=G['id']
NICK=['Ali','Vali','Gani']
for k,tok in enumerate(S):assert call('/classroom/join','POST',{'code':G['code'],'nickname':NICK[k]},tok)[0]==200

# Validation and caps.
three=['perio-01','endo-02','deck.caries-basics']
check('student cannot make a general test',gen(S[0],g,sources=three,count=5)[0]==403)
check('other teacher cannot make one in this group',gen(T2,g,sources=three,count=5)[0]==403)
check('no sources refused',gen(T,g,sources=[],count=5)==(400,{'error':'bad_sources'}))
check('unknown source refused',gen(T,g,sources=['perio-01','nope-99'],count=5)==(400,{'error':'unknown_source'}))
check('more than 50 questions refused (server cap)',gen(T,g,sources=['perio-01','perio-02','perio-03','perio-04','perio-05','perio-06'],count=51)==(400,{'error':'bad_count','max':50}))
check('more questions than the pool refused',gen(T,g,sources=three,count=26)==(400,{'error':'bad_count','max':25}))
check('variants need a pool of 2 × count',gen(T,g,sources=three,count=13,variant=True)==(400,{'error':'variant_pool_small','pool':25,'max':12}))
check('a title is required',call('/classroom/general','POST',{'groupId':g,'title':' ','sources':three,'count':5},T)==(400,{'error':'title_required'}))
check('time limit 1–180',gen(T,g,sources=three,count=5,minutes=181)==(400,{'error':'bad_minutes'}))
check('open window must be in the future',gen(T,g,sources=three,count=5,deadline=iso(-10))==(400,{'error':'bad_deadline'}))
allsrc=json.loads(open(os.path.join(ROOT,'src/curriculum/index.json')).read())['topics']
check('more than 150 sources refused',gen(T,g,sources=[t['id'] for t in allsrc]+[f'deck.{d}' for d in dk]*6,count=5)==(400,{'error':'bad_sources'}))
s,r=gen(T,g,sources=[t['id'] for t in allsrc]+[f'deck.{d}' for d in dk],count=50,variant=True,minutes=20,deadline=iso(24*60))
check('every source at once: a 1230-question pool, 50 per student',s==201 and r['pool']==1230 and r['count']==50);big=r['testId']

# Fixed general test: round robin over the sources, no repeats, one set for everyone.
s,r=gen(T,g,sources=three,count=10,minutes=20,deadline=iso(24*60),reveal='deadline');aid=r['testId']
a=mine(g,aid,S[0])
per={x:sum(1 for q in a['items'] if src(q)==x) for x in three}
check('fixed: 10 questions spread evenly over 3 sources (4/3/3)',len(a['items'])==10 and sorted(per.values())==[3,3,4])
check('fixed: no repeated question',len(set(a['items']))==10)
check('fixed: listed as a general, non-variant test with the window and time',a.get('general') and not a.get('variant') and a['questionCount']==10 and a['minutes']==20 and a['deadlineAt'])
check('students see no key',all(w not in json.dumps(a) for w in ('answer_key','"correct"')))
qs=[]
for tok in S:
    s,r=call('/classroom/start','POST',{'assignmentId':aid},tok);qs.append(r['questions'])
    check('each student gets all 10 fixed questions (own order = the shared draw)',s==200 and sorted(r['questions'])==sorted(a['items']) and r['questions']==[a['items'][i] for i in draw(aid,me(tok),a['items'],10,None)])
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':[key(q) for q in qs[0]]},S[0])
check('deck and topic questions scored with the server keys (10/10)',s==200 and r['score']==10 and r['total']==10)
# Auto-submit: B saved 3 right answers, then the time ran out (time limit + grace) without submitting.
prog=[key(q) for q in qs[1][:3]]+[None]*7
call('/classroom/progress','POST',{'assignmentId':aid,'answers':prog},S[1])
sql(f"UPDATE class_submissions SET started_at=datetime('now','-23 minutes') WHERE assignment_id='{aid}' AND user_id='{me(S[1])}'")
rows={m['nickname']:m for m in call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T)[1]['members']}
check('expired attempt auto-submitted with the saved answers (3/10)',rows['Vali']['answer']=='done' and rows['Vali']['score']==3 and rows['Vali']['answers'][3]==-1)
check('still within its time: C is still answering',rows['Gani']['answer']=='started')
check('the auto-submitted student cannot submit again',call('/classroom/submit','POST',{'assignmentId':aid,'answers':[0]*10},S[1])[0]==409)

# Open window: when it closes nobody can start; started students are finished after the grace; answers open.
D,_=login('student','Kech');call('/classroom/join','POST',{'code':G['code'],'nickname':'Kech'},D)
sql(f"UPDATE class_assignments SET deadline_at=datetime('now','-3 minutes') WHERE id='{aid}'")
check('after the window closes a new student cannot start',call('/classroom/start','POST',{'assignmentId':aid},D)==(409,{'error':'past_due'}))
rows={m['nickname']:m for m in call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T)[1]['members']}
check('after the window + grace, C is auto-submitted (0 answers → 0)',rows['Gani']['answer']=='done' and rows['Gani']['score']==0)
rv=mine(g,aid,S[0])['mine']['review']
check('reveal after the window: own questions, keys, deck explanations too',rv['questions']==qs[0] and rv['correct']==[key(q) for q in qs[0]] and all(rv['explain']))
st=call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T)[1]['stats']
check('per-question stats once over (aligned with the 10 items)',len(st)==10 and all(x['answered']==3 for x in st))

# Variant general test: each student draws 10 from the 25-question pool, round robin over the 3 sources.
s,r=gen(T,g,sources=three,count=10,variant=False,minutes=None,deadline=iso(60));check('no time limit allowed',s==201)
s,r=gen(T,g,sources=['perio-01','endo-02','deck.caries-basics','deck.periodontium'],count=12,variant=True,minutes=15,deadline=iso(60));vid=r['testId']
va=mine(g,vid,S[0]);check('variant: the pool is all 30 questions',va['variant'] and len(va['items'])==30 and va['questionCount']==12)
sets=[]
for tok in S:
    s,r=call('/classroom/start','POST',{'assignmentId':vid},tok);q=r['questions'];sets.append(tuple(sorted(q)))
    cnt=sorted(sum(1 for x in q if src(x)==y) for y in {src(z) for z in va['items']})
    check('variant: server draw = Python draw, 12 distinct, 3 per source',q==[va['items'][i] for i in draw(vid,me(tok),va['items'],12,None)] and len(set(q))==12 and cnt==[3,3,3,3])
check('variant: students get different sets',len(set(sets))==3)

# Permissions on the general test.
check('outsider cannot read it',call(f'/classroom/assignments?groupId={g}&assignmentId={vid}',token=O)[0]==403)
check('outsider cannot start it',call('/classroom/start','POST',{'assignmentId':vid},O)[0]==403)
check('other teacher cannot close it',call('/classroom/assignments','PUT',{'assignmentId':vid,'status':'closed'},T2)[0]==403)
check('a student gets no roster',call(f'/classroom/assignments?groupId={g}&assignmentId={vid}',token=S[0])[1].get('members') is None)
check('owner closes it',call('/classroom/assignments','PUT',{'assignmentId':vid,'status':'closed'},T)[0]==200)

# Topic test: a custom count bounded by its pool; the server caps at 50 per student.
call('/classroom/topics','POST',{'groupId':g,'topicId':'perio-02','action':'open'},T)
check('topic variant count above pool/2 refused',call('/classroom/topics','POST',{'groupId':g,'topicId':'perio-02','action':'test','variant':{'count':6},'minutes':10},T)[1]['error']=='variant_pool_small')
check('topic test with a custom count of 7 fixed questions',call('/classroom/topics','POST',{'groupId':g,'topicId':'perio-02','action':'test','questions':[0,1,2,3,4,5,6],'minutes':12,'deadline':iso(60*24)},T)[0]==201)
print(f'{n} checks passed')

"""Curriculum topic flow against a local `npm run api:dev` (needs .dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1, migration 0012)."""
import json,sys
sys.path.insert(0,'tools')
from classroom_test_lib import call,login  # noqa: E402
ok=[]
def check(n,c):
    assert c,n;ok.append(n)
keys=json.loads(open('functions/_lib/curriculumKeys.ts').read().split('}>=',1)[1].rstrip().rstrip(';'))
tid=sorted(keys)[0];key=keys[tid]['c']
T,_=login('teacher','Dr Topic');S,_=login('student','Stud A');S2,_=login('student','Stud B');O,_=login('student','Outsider')
s,r=call('/classroom/groups','POST',{'name':'Topic group'},T);g=r['group']['id'];code=r['group']['code']
call('/classroom/join','POST',{'code':code,'nickname':'Alpha'},S);call('/classroom/join','POST',{'code':code},S2)
check('outsider cannot list topics',call(f'/classroom/topics?groupId={g}',token=O)[0]==403)
check('student cannot open topic',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'open'},S)[0]==403)
check('unknown topic 400',call('/classroom/topics','POST',{'groupId':g,'topicId':'nope-01','action':'open'},T)[0]==400)
check('stage before open 409',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'lecture'},T)[0]==409)
check('teacher opens topic',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'open'},T)[0]==200)
check('student sees open topic',[x['topicId'] for x in call(f'/classroom/topics?groupId={g}',token=S)[1]['topics']]==[tid])
check('student cannot read key',call(f'/classroom/topics?groupId={g}&key={tid}',token=S)[0]==403)
s,r=call(f'/classroom/topics?groupId={g}&key={tid}',token=T);check('teacher reads key',s==200 and r['correct']==key)
check('lecture done',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'lecture'},T)[0]==200)
check('oral done',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'oral'},T)[0]==200)
row=call(f'/classroom/topics?groupId={g}',token=T)[1]['topics'][0];check('stages recorded',row['lectureDoneAt'] and row['oralDoneAt'])
check('bad questions 400',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'test','questions':[0,0],'minutes':10},T)[0]==400)
check('bad minutes 400',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'test','questions':[0,1],'minutes':0},T)[0]==400)
pick=[0,2,3]
s,r=call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'test','questions':pick,'minutes':10,'title':'Topic test'},T);check('test starts',s==201);aid=r['testId']
check('second test refused',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'test','questions':[1],'minutes':5},T)[0]==409)
s,r=call(f'/classroom/assignments?groupId={g}',token=S);a=[x for x in r['assignments'] if x['id']==aid][0]
check('student sees test meta, no key',a['topicId']==tid and a['questions']==pick and a['minutes']==10 and 'answer_key' not in json.dumps(r) and 'correct' not in json.dumps(r))
s,r=call('/classroom/start','POST',{'assignmentId':aid},S);check('student starts with minutes',s==200 and r['minutes']==10)
ans=[key[i] for i in pick];ans[1]=(ans[1]+1)%4
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':ans},S);check('scored 2/3, no key in reply',s==200 and r['score']==2 and r['total']==3 and 'review' not in r)
s,r=call(f'/classroom/assignments?groupId={g}',token=S);a=[x for x in r['assignments'] if x['id']==aid][0]
check('no review while test open',a['mine']['score']==2 and 'review' not in a['mine'])
call('/classroom/start','POST',{'assignmentId':aid},S2)
check('teacher finishes',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'finish'},T)[0]==200)
s,r=call('/classroom/submit','POST',{'assignmentId':aid,'answers':[key[i] for i in pick]},S2);check('grace: started student can still submit',s==200 and r['score']==3)
s,r=call(f'/classroom/assignments?groupId={g}',token=S);a=[x for x in r['assignments'] if x['id']==aid][0]
check('no review during the grace minutes','review' not in a['mine'])
check('finished topic test cannot be reopened',call('/classroom/assignments','PUT',{'assignmentId':aid,'status':'open'},T)[0]==403)
# Move the finish time past the grace window (local D1 only).
import subprocess
subprocess.run(['npx','wrangler','d1','execute','dental-expert','--local','--command',f"UPDATE class_assignments SET closed_at=datetime('now','-3 minutes') WHERE id='{aid}'"],capture_output=True,check=True)
s,r=call(f'/classroom/assignments?groupId={g}',token=S);a=[x for x in r['assignments'] if x['id']==aid][0]
check('review after finish',a['mine']['review']['correct']==[key[i] for i in pick] and a['mine']['review']['answers']==ans and len(a['mine']['review']['explain'])==3)
s,r=call(f'/classroom/assignments?groupId={g}&assignmentId={aid}',token=T);check('teacher sees answers per student',sorted(m['score'] for m in r['members'])==[2,3] and all(m['answers'] for m in r['members']))
s,r=call(f'/classroom/gradebook?groupId={g}',token=T);check('gradebook',len(r['members'])==2 and r['quizzes'][0]['total']==3 and sorted(m['scores'][aid] for m in r['members'])==[2,3])
check('student cannot read gradebook',call(f'/classroom/gradebook?groupId={g}',token=S)[0]==403)
check('teacher hides topic',call('/classroom/topics','POST',{'groupId':g,'topicId':tid,'action':'close'},T)[0]==200)
check('hidden topic test not listed to students',all(x.get('topicId')!=tid for x in call(f'/classroom/assignments?groupId={g}',token=S)[1]['assignments']))
check('student no longer sees it',call(f'/classroom/topics?groupId={g}',token=S)[1]['topics']==[])
print(f'{len(ok)} checks passed')

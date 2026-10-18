"""Classroom API tests against a local `npm run api:dev` (needs .dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1)."""
import os
import json,urllib.request,urllib.error,time
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}/api'
def call(path,method='GET',body=None,token=None):
    h={'x-client':'native','origin':'https://localhost'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def login(role,name):
    e=f'{role}+{time.time_ns()}@example.com'
    s,r=call('/auth/request-code','POST',{'email':e,'name':name,'role':role,'lang':'en'})
    s,r=call('/auth/verify','POST',{'email':e,'code':r['devCode']});return r['token'],e
ok=[]
def check(n,c):
    assert c,n;ok.append(n)
T,_=login('teacher','Dr Test');S,_=login('student','Stud One');S2,_=login('student','Stud Two');P,_=login('patient','Pat')
check('anonymous 401',call('/classroom/groups')[0]==401)
check('student cannot create group',call('/classroom/groups','POST',{'name':'X1'},S)[0]==403)
check('short name 400',call('/classroom/groups','POST',{'name':'X'},T)[0]==400)
s,r=call('/classroom/groups','POST',{'name':'Terapiya 3-kurs'},T);check('teacher creates group',s==201 and len(r['group']['code'])==6)
g=r['group'];code=g['code']
check('bad code 400',call('/classroom/join','POST',{'code':'abc'},S)[0]==400)
check('unknown code 404',call('/classroom/join','POST',{'code':'ZZZZZZ'},S)[0]==404)
check('teacher cannot join own group',call('/classroom/join','POST',{'code':code},T)[0]==400)
check('student joins (lowercase code ok)',call('/classroom/join','POST',{'code':code.lower()},S)[0]==200)
check('join twice is idempotent',call('/classroom/join','POST',{'code':code},S)[0]==200)
check('bad nickname (email) rejected',call('/classroom/join','POST',{'code':code,'nickname':'a@b.co'},S2)[0]==400)
check('second student joins with nickname',call('/classroom/join','POST',{'code':code,'nickname':'Zebra 2'},S2)[0]==200)
s,r=call('/classroom/groups',token=T);check('teacher sees 2 members, code',r['role']=='owner' and r['groups'][0]['members']==2 and r['groups'][0]['code']==code)
s,r=call('/classroom/groups',token=S);check('student sees group, no code leak, own number',r['role']=='member' and r['groups'][0]['name']=='Terapiya 3-kurs' and 'code' not in r['groups'][0] and r['groups'][0]['teacher']=='Dr Test' and r['groups'][0]['myNo']==1)
check('non-member cannot read assignments',call('/classroom/assignments?groupId='+g['id'],token=P)[0]==403)
check('student cannot create assignment',call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'task','title':'Hi'},S)[0]==403)
check('quiz needs deck and key',call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Quiz','deckId':'caries-basics'},T)[0]==400)
check('bad date 400',call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'task','title':'Task','dueDate':'tomorrow'},T)[0]==400)
s,r=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'task','title':'Describe caries stages','body':'3-5 sentences','dueDate':'2026-11-01'},T);check('teacher creates task',s==201);task=r['assignment']['id']
s,r=call('/classroom/assignments','POST',{'groupId':g['id'],'kind':'quiz','title':'Caries quiz','deckId':'caries-basics','key':[0,1,2]},T);check('teacher creates quiz',s==201);quiz=r['assignment']['id']
s,r=call('/classroom/assignments?groupId='+g['id'],token=S);check('student sees 2 assignments, no key leak',len(r['assignments'])==2 and all(a['mine'] is None for a in r['assignments']) and 'answer_key' not in json.dumps(r) and 'key' not in r['assignments'][0])
codes=[call('/classroom/join','POST',{'code':'ZZZZZZ'},P)[0] for _ in range(12)]
check('join attempts rate limited',codes[-1]==429)
check('empty task answer 400',call('/classroom/submit','POST',{'assignmentId':task,'answer':'  '},S)[0]==400)
check('task submit ok',call('/classroom/submit','POST',{'assignmentId':task,'answer':'Initial, dentin, deep'},S)[0]==200)
check('resubmit updates',call('/classroom/submit','POST',{'assignmentId':task,'answer':'Edited'},S)[0]==200)
check('wrong answer count 400',call('/classroom/submit','POST',{'assignmentId':quiz,'answers':[0]},S)[0]==400)
check('submit before start rejected',call('/classroom/submit','POST',{'assignmentId':quiz,'answers':[0,1,0]},S)[0]==409)
check('student starts quiz',call('/classroom/start','POST',{'assignmentId':quiz},S)[0]==200)
s2,r2=call('/classroom/start','POST',{'assignmentId':quiz},S);check('starting again resumes the same attempt (no fresh try by peeking)',s2==200 and r2.get('resumed') is True)
s,r=call('/classroom/submit','POST',{'assignmentId':quiz,'answers':[0,1,0]},S);check('server scores quiz (2/3)',s==200 and r['score']==2 and r['total']==3)
check('quiz is one attempt',call('/classroom/submit','POST',{'assignmentId':quiz,'answers':[0,1,2]},S)[0]==409)
check('claimed score ignored',call('/classroom/submit','POST',{'assignmentId':quiz,'score':3,'total':3},S2)[0]==400)
call('/classroom/start','POST',{'assignmentId':quiz},S2)
s,r=call(f"/classroom/assignments?groupId={g['id']}&assignmentId={quiz}",token=T);zs={(m['nickname'] or m['no']):m for m in r['members']}
check('abandoned quiz counts as 0',zs['Zebra 2']['score']==0 and zs['Zebra 2']['total']==3 and zs[1]['score']==2)
T2,_=login('teacher','Other Teacher');s,r=call('/classroom/groups','POST',{'name':'Other group'},T2);g2=r['group']
check('teacher cannot join as a member',call('/classroom/join','POST',{'code':code},T2)[0]==400)
s,r=call(f"/classroom/assignments?groupId={g2['id']}&assignmentId={task}",token=T2);check('foreign assignment id yields no roster data',s==200 and all(m['answer'] is None for m in (r['members'] or [])))
check('reserved nickname rejected',call('/classroom/join','POST',{'code':code,'nickname':'Student 01'},S2)[0]==400)
check('outsider cannot submit',call('/classroom/submit','POST',{'assignmentId':task,'answer':'x'},P)[0]==403)
check('teacher cannot submit',call('/classroom/submit','POST',{'assignmentId':task,'answer':'x'},T)[0]==403)
s,r=call('/classroom/assignments?groupId='+g['id'],token=S);mine={a['id']:a['mine'] for a in r['assignments']};check('student sees own results',mine[task]['answer']=='Edited' and mine[quiz]['score']==2 and mine[quiz]['total']==3)
s,r=call(f"/classroom/assignments?groupId={g['id']}&assignmentId={task}",token=T);subs={(m['nickname'] or m['no']):m for m in r['members']}
check('teacher sees who submitted',subs[1]['answer']=='Edited' and subs['Zebra 2']['answer'] is None and 'email' not in json.dumps(r) and r['assignments'][1]['submitted']==1)
s,r=call(f"/classroom/assignments?groupId={g['id']}&assignmentId={task}",token=S);check('student gets no roster',r.get('members') is None)
check('student cannot delete assignment',call('/classroom/assignments?assignmentId='+task,'DELETE',token=S)[0]==200 and len(call('/classroom/assignments?groupId='+g['id'],token=T)[1]['assignments'])==2)
check('student cannot close',call('/classroom/assignments','PUT',{'assignmentId':task,'status':'closed'},S)[0]==403)
check('teacher closes',call('/classroom/assignments','PUT',{'assignmentId':task,'status':'closed'},T)[0]==200)
check('closed task rejects submit',call('/classroom/submit','POST',{'assignmentId':task,'answer':'late'},S)[0]==409)
call('/classroom/assignments','PUT',{'assignmentId':task,'status':'open'},T)
call('/classroom/assignments?assignmentId='+task,'DELETE',token=T);check('teacher deletes assignment',len(call('/classroom/assignments?groupId='+g['id'],token=T)[1]['assignments'])==1)
call('/classroom/join?groupId='+g['id'],'DELETE',token=S2);check('student leaves group and answers go too',call(f"/classroom/assignments?groupId={g['id']}",token=T)[1]['assignments'][0]['submitted']==1);check('student left group',call('/classroom/groups',token=T)[1]['groups'][0]['members']==1)
call('/auth/account','DELETE',token=S);check('deleting a student account removes membership',call('/classroom/groups',token=T)[1]['groups'][0]['members']==0)
import concurrent.futures as cf
with cf.ThreadPoolExecutor(25) as ex:codes=list(ex.map(lambda i:call('/classroom/groups','POST',{'name':f'Burst {i}'},T2)[0],range(25)))
check('group limit holds under parallel requests',codes.count(201)<=19)
print('PASS',len(ok),'checks')

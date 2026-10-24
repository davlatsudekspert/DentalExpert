"""Pro/Free API tests with the flag OFF (the default; production today). Everything stays free, nothing is counted and no
`pro` object is returned, even for an account whose trial is long over. Admin grants are stored but have no effect."""
import time
from classroom_test_lib import call,login,sql
n=0
def check(name,cond):
    global n
    print(('PASS ' if cond else 'FAIL ')+name);assert cond,name;n+=1
s,r=call('/auth/me');check('flag reported off',s==200 and r['proEnabled'] is False)
S,e=login('student','Old');u=call('/auth/me',token=S)[1]['user']
sql(f"UPDATE users SET trial_ends_at=datetime('now','-90 days') WHERE id='{u['id']}'")
check('no pro object in /me',call('/auth/me',token=S)[1]['proEnabled'] is False and 'pro' not in call('/auth/me',token=S)[1]['user'])
check('later topic keys open to everyone',call('/curriculum/key?topicId=card-08')[0]==200 and call('/curriculum/key?topicId=card-08',token=S)[0]==200)
s,r=call('/billing/practice','POST',{'n':20},S);check('practice unlimited and uncounted',s==200 and r['unlimited'] is True)
check('practice still unlimited again',call('/billing/practice','POST',{'n':20},S)[1]['unlimited'] is True)
T,_=login('teacher','Old teacher');tu=call('/auth/me',token=T)[1]['user']
sql(f"UPDATE users SET trial_ends_at=datetime('now','-90 days') WHERE id='{tu['id']}'")
check('teacher with a lapsed trial can create several groups',all(call('/classroom/groups','POST',{'name':f'Group {i}'},T)[0]==201 for i in range(3)))
gid=call('/classroom/groups',token=T)[1]['groups'][0]['id']
s,r=call('/classroom/general','POST',{'groupId':gid,'sources':[],'count':3},T);check('general tests are not gated',s==400 and r['error']=='bad_sources')
d=f'droff+{time.time_ns()}@example.com'
s,r=call('/auth/request-code','POST',{'email':d,'name':'Dr Off '+str(time.time_ns())[-6:],'role':'dentist','lang':'en','cityId':'UZ-TK','countryCode':'UZ'})
s,r=call('/auth/verify','POST',{'email':d,'code':r['devCode']});nm=r['user']['name'];did=r['user']['id']
check('sign-in answer has no pro',('pro' not in r['user']))
sql(f"UPDATE users SET publish_requested=1,verified_at=datetime('now'),trial_ends_at=datetime('now','-90 days') WHERE id='{did}'")
check('verified dentist stays listed without Pro',any(x['fullName']==nm for x in call('/doctors?city=UZ-TK')[1]['doctors']))
s,r=call('/auth/request-code','POST',{'email':'davlatsudekspert@gmail.com','name':'Owner','role':'patient','lang':'en'});s,r=call('/auth/verify','POST',{'email':'davlatsudekspert@gmail.com','code':r['devCode']});A=r['token']
check('admin grant is stored while off',call('/admin/grants','POST',{'email':e,'months':1},A)[0]==200 and call('/admin/grants',token=A)[1]['grants'])
check('...and changes nothing for the user',call('/auth/me',token=S)[1]['user'].get('pro') is None)
print(f'{n} checks passed')

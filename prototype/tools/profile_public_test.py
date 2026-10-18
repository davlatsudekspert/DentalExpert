"""Dentist public profile: edit contacts, request listing, owner verifies, patients see it with the contact links; edits clear verification.
Role switching (PUT /api/auth/role): the four app roles only, never admin; guests and signed-out callers refused; leaving
'dentist' takes the public listing down; a teacher's groups stay theirs after switching; 10 switches a day."""
import os
import json,urllib.parse,urllib.request,urllib.error,time
B=f'http://127.0.0.1:{os.environ.get("DE_PORT","8788")}/api'
def call(path,method='GET',body=None,token=None):
    h={'x-client':'native','origin':'https://localhost'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def login(email,role,name,city='UZ-TK',country='UZ'):
    s,r=call('/auth/request-code','POST',{'email':email,'name':name,'role':role,'lang':'en','cityId':city,'countryCode':country})
    s,r=call('/auth/verify','POST',{'email':email,'code':r['devCode']});return r['token'],r['user']
ok=[]
def check(n,c):
    assert c,n;ok.append(n)
A,_=login('davlatsudekspert@gmail.com','patient','Owner')
D,du=login(f'dr+{time.time_ns()}@example.com','dentist','Dr Public Test')
full={'name':'Dr Public Test','phone':'+998 90 111 22 33','workplace':'Smile Clinic','specialty':'Orthodontist','telegram':'@drpublic','instagram':'drpublic.uz','publicEmail':'dr@example.com','address':'Amir Temur 5','mapUrl':'https://maps.google.com/?q=1','bio':'Braces and aligners','publishRequested':True}
for k,v,e in [('telegram','bad handle!','bad_telegram'),('instagram','a','bad_instagram'),('publicEmail','x','bad_email'),('mapUrl','http://insecure','bad_map'),('phone','abc','bad_phone')]:
    check('rejects '+k,call('/auth/profile','PUT',{**full,k:v},D)[1].get('error')==e)
s,r=call('/auth/profile','PUT',full,D);check('profile saved with contacts',s==200 and r['user']['telegram']=='@drpublic' and r['user']['verified'] is False and r['user']['publishRequested'] is True)
check('not listed before verification',all(d['fullName']!='Dr Public Test' for d in call('/doctors?city=UZ-TK')[1]['doctors']))
check('non-admin cannot verify',call('/admin/users','PUT',{'id':du['id'],'verified':True},D)[0]==403)
check('admin sees profile details',[u for u in call('/admin/users?q='+urllib.parse.quote(du['email']) if False else '/admin/users?q=Public',token=A)[1]['users'] if u['id']==du['id']][0]['profile']['telegram']=='@drpublic')
check('admin verifies',call('/admin/users','PUT',{'id':du['id'],'verified':True},A)[0]==200)
docs=[d for d in call('/doctors?city=UZ-TK')[1]['doctors'] if d['fullName']=='Dr Public Test']
check('listed with contact channels after verification',len(docs)==1 and {c['kind'] for c in docs[0]['contacts']}=={'phone','telegram','instagram','email','map'} and docs[0]['isDemo'] is False)
check('not listed in another city',all(d['fullName']!='Dr Public Test' for d in call('/doctors?city=UZ-AN')[1]['doctors']))
s,r=call('/auth/profile','PUT',{**full,'phone':'+998 90 999 99 99'},D);check('changing the phone clears verification',r['user']['verified'] is False)
check('unverified again => unlisted',all(d['fullName']!='Dr Public Test' for d in call('/doctors?city=UZ-TK')[1]['doctors']))
call('/auth/profile','PUT',{**full,'phone':'+998 90 999 99 99','publishRequested':False},D)
check('cannot verify a profile that was not submitted',call('/admin/users','PUT',{'id':du['id'],'verified':True},A)[0]==400)
P,pu=login(f'pt+{time.time_ns()}@example.com','patient','Patient')
s,r=call('/auth/profile','PUT',{**full},P);check('patient cannot request publishing',r['user']['publishRequested'] is False)
# Role switching.
import sys;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from classroom_test_lib import legacy_guest  # noqa: E402
call('/auth/profile','PUT',{**full,'publishRequested':True},D);call('/admin/users','PUT',{'id':du['id'],'verified':True},A)
check('listed again before switching',any(d['fullName']=='Dr Public Test' for d in call('/doctors?city=UZ-TK')[1]['doctors']))
check('switching to admin is refused',call('/auth/role','PUT',{'role':'admin'},D)==(400,{'error':'bad_role'}))
check('an unknown role is refused',call('/auth/role','PUT',{'role':'owner'},D)[0]==400 and call('/auth/role','PUT',{},D)[0]==400)
check('signed out cannot switch',call('/auth/role','PUT',{'role':'teacher'})[0]==401)
gt,_=legacy_guest('Mehmon');check('a guest cannot switch',call('/auth/role','PUT',{'role':'teacher'},gt)[0] in (401,403))
s,r=call('/auth/role','PUT',{'role':'dentist'},D);check('the same role is a no-op',s==200 and r['user']['role']=='dentist')
s,r=call('/auth/role','PUT',{'role':'teacher'},D)
check('dentist → teacher: switched, listing request and verification cleared',s==200 and r['user']['role']=='teacher' and r['user']['publishRequested'] is False and r['user']['verified'] is False)
check('/auth/me shows the new role',call('/auth/me',token=D)[1]['user']['role']=='teacher')
check('no longer listed for patients',all(d['fullName']!='Dr Public Test' for d in call('/doctors?city=UZ-TK')[1]['doctors']))
s,r=call('/classroom/groups','POST',{'name':'Rol guruhi'},D);check('as a teacher: can create a group',s==200);gid=r['group']['id']
s,r=call('/auth/role','PUT',{'role':'student'},D);check('teacher → student',s==200 and r['user']['role']=='student')
check('as a student: cannot create new groups',call('/classroom/groups','POST',{'name':'Yana'},D)==(403,{'error':'teacher_only'}))
check('as a student: the owned group still answers as its owner',call(f'/classroom/assignments?groupId={gid}',token=D)[1].get('role')=='owner')
s,r=call('/auth/role','PUT',{'role':'dentist'},D)
check('back to dentist: not listed until requested and verified again',s==200 and r['user']['role']=='dentist' and r['user']['publishRequested'] is False and all(d['fullName']!='Dr Public Test' for d in call('/doctors?city=UZ-TK')[1]['doctors']))
check('admin rights do not come from the role',call('/auth/me',token=D)[1]['user']['isAdmin'] is False)
# 3 switches so far; 10 a day in all.
codes=[call('/auth/role','PUT',{'role':['teacher','patient'][i%2]},D)[0] for i in range(8)]
check('role switches are rate limited (10 a day)',codes[:7]==[200]*7 and codes[7]==429)
print('PASS',len(ok),'checks')

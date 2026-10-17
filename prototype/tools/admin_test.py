"""Admin panel API tests against a local `npm run api:dev` (.dev.vars with AUTH_SECRET and AUTH_DEV_ECHO=1)."""
import subprocess,json,urllib.parse,urllib.request,urllib.error,time
B='http://127.0.0.1:8788/api'
def call(path,method='GET',body=None,token=None):
    h={'x-client':'native','origin':'https://localhost'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
def login(email,role='patient',name='T'):
    s,r=call('/auth/request-code','POST',{'email':email,'name':name,'role':role,'lang':'en'})
    s,r=call('/auth/verify','POST',{'email':email,'code':r['devCode']});return r['token'],r['user']
ok=[]
def clear():subprocess.run(['npx','wrangler','d1','execute','dental-expert','--local','--command','DELETE FROM auth_codes;'],capture_output=True)
def check(n,c):
    assert c,n;ok.append(n)
ADMIN,au=login('davlatsudekspert@gmail.com','patient','Owner')
U,uu=login(f'user+{time.time_ns()}@example.com','student','Plain User')
check('me flags the owner as admin',call('/auth/me',token=ADMIN)[1]['user']['isAdmin']is True)
check('me flags others as not admin',call('/auth/me',token=U)[1]['user']['isAdmin']is False)
for path in ['/admin/stats','/admin/users','/admin/reports']:
    check('anonymous 401 '+path,call(path)[0]==401);check('non-admin 403 '+path,call(path,token=U)[0]==403)
check('non-admin cannot change roles',call('/admin/users','PUT',{'id':uu['id'],'role':'teacher'},U)[0]==403)
s,st=call('/admin/stats',token=ADMIN);check('stats shape',s==200 and st['users']['total']>=2 and 'byRole' in st['users'] and 'groups' in st['classroom'] and st['downloads'] is None)
s,r=call('/admin/users?q='+urllib.parse.quote(uu['email']),token=ADMIN);check('user search finds the user, no secrets',s==200 and len(r['users'])==1 and 'token' not in json.dumps(r) and r['users'][0]['admin'] is False)
check('search with LIKE wildcards is escaped',len(call('/admin/users?q=%25',token=ADMIN)[1]['users'])==0)
check('bad role rejected',call('/admin/users','PUT',{'id':uu['id'],'role':'god'},ADMIN)[0]==400)
check('admin changes role',call('/admin/users','PUT',{'id':uu['id'],'role':'teacher'},ADMIN)[0]==200 and call('/auth/me',token=U)[1]['user']['role']=='teacher')
check('cannot suspend an admin',call('/admin/users','PUT',{'id':au['id'],'suspended':True},ADMIN)[0]==400)
check('admin suspends user',call('/admin/users','PUT',{'id':uu['id'],'suspended':True},ADMIN)[0]==200)
check('suspended session stops working',call('/auth/me',token=U)[1]['user'] is None)
# suspended user cannot sign in again
clear()
s,r=call('/auth/request-code','POST',{'email':uu['email'],'lang':'en'});s,r=call('/auth/verify','POST',{'email':uu['email'],'code':r['devCode']})
check('suspended user cannot sign in',s==403 and r['error']=='suspended')
check('admin restores user',call('/admin/users','PUT',{'id':uu['id'],'suspended':False},ADMIN)[0]==200)
clear();U2,_=login(uu['email']);check('restored user signs in again',call('/auth/me',token=U2)[1]['user']['email']==uu['email'])
# reports
check('empty report 400',call('/reports','POST',{'category':'complaint','body':'x'})[0]==400)
s,_=call('/reports','POST',{'category':'complaint','subject':'Dr. Test','body':'The clinic address is wrong','contact':'+998901112233','lang':'uz'},U2);check('signed-in report accepted',s==201)
s,_=call('/reports','POST',{'category':'weird','body':'Anonymous message about a bug'});check('anonymous report accepted, unknown category becomes other',s==201)
s,r=call('/admin/reports',token=ADMIN);mine=[x for x in r['reports'] if x['subject']=='Dr. Test'];check('admin sees the report with reporter email',len(mine)==1 and mine[0]['reporter']==uu['email'] and mine[0]['category']=='complaint')
rid=mine[0]['id']
check('admin resolves with note',call('/admin/reports','PUT',{'id':rid,'status':'resolved','note':'Address fixed'},ADMIN)[0]==200)
check('resolved list has it',any(x['id']==rid and x['note']=='Address fixed' for x in call('/admin/reports?status=resolved',token=ADMIN)[1]['reports']))
check('non-admin cannot read reports',call('/admin/reports',token=U2)[0]==403)
codes=[call('/reports','POST',{'category':'other','body':'spam spam spam'},U2)[0] for _ in range(7)]
check('report rate limit',codes[-1]==429)
print('PASS',len(ok),'checks')

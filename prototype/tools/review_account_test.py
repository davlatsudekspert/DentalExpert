"""Store-review accounts. Start the dev server with --binding REVIEW_ACCOUNTS=... --binding REVIEW_CODE=... (see below); run: python3 tools/review_account_test.py"""
import json,urllib.request,urllib.error,sys
B=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8790/api'
def call(path,method='GET',body=None,token=None):
    h={'x-client':'native','origin':'https://localhost'}
    if body is not None:h['content-type']='application/json'
    if token:h['authorization']='Bearer '+token
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        x=urllib.request.urlopen(r);return x.status,json.loads(x.read() or b'{}')
    except urllib.error.HTTPError as e:return e.code,json.loads(e.read() or b'{}')
ok=[]
def check(n,c):
    assert c,n;ok.append(n)
check('request-code ok without email',call('/auth/request-code','POST',{'email':'reviewer-dentist@review.invalid','lang':'en'})[0]==200)
check('wrong code rejected',call('/auth/verify','POST',{'email':'reviewer-dentist@review.invalid','code':'000000'})[0]==400)
s,r=call('/auth/verify','POST',{'email':'reviewer-dentist@review.invalid','code':'424242'});check('fixed code signs in as dentist',s==200 and r['user']['role']=='dentist' and bool(r.get('token')))
tok=r['token'];check('session works',call('/auth/me',token=tok)[1]['user']['email']=='reviewer-dentist@review.invalid' and call('/auth/me',token=tok)[1]['user']['isAdmin'] is False)
s,r=call('/auth/verify','POST',{'email':'reviewer-student@review.invalid','code':'424242'});check('student account has its own role',r['user']['role']=='student')
check('other addresses cannot use the fixed code',call('/auth/verify','POST',{'email':'someone@example.com','code':'424242'})[0]==400)
check('non-listed review-looking address rejected',call('/auth/verify','POST',{'email':'reviewer-admin@review.invalid','code':'424242'})[0]==400)
print('PASS',len(ok),'checks')

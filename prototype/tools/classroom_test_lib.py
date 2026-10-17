"""Helpers shared by the local API tests."""
import json,urllib.request,urllib.error,time
B='http://127.0.0.1:8788/api'
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

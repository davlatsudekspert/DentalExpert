// Maestro runScript: reads the 6-digit sign-in code that the local API echoed for EMAIL (captured by e2e_proxy.mjs).
// Env: EMAIL (required), E2E_PROXY (default http://127.0.0.1:8789). Sets output.code.
var base = (typeof E2E_PROXY !== 'undefined' && E2E_PROXY) ? E2E_PROXY : 'http://127.0.0.1:8789';
var code = null, last = '';
for (var i = 0; i < 3 && !code; i++) {
  var r = http.get(base + '/__e2e/code?wait=8000&email=' + encodeURIComponent(EMAIL));
  last = r.status + ' ' + r.body;
  if (r.ok) code = json(r.body).code;
}
if (!code || !/^[0-9]{6}$/.test(code)) throw new Error('No sign-in code captured for ' + EMAIL + ' (last answer: ' + last + ')');
output.code = code;
console.log('Got sign-in code for ' + EMAIL);

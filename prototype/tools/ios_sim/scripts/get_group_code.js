// Maestro runScript: reads the join code of the classroom group GROUP_NAME, as the teacher's app received it
// from /api/classroom/groups (captured by e2e_proxy.mjs). Env: GROUP_NAME, E2E_PROXY. Sets output.groupCode.
var base = (typeof E2E_PROXY !== 'undefined' && E2E_PROXY) ? E2E_PROXY : 'http://127.0.0.1:8789';
var r = http.get(base + '/__e2e/group-code?wait=8000&name=' + encodeURIComponent(GROUP_NAME));
if (!r.ok) throw new Error('No join code captured for group "' + GROUP_NAME + '": ' + r.status + ' ' + r.body + ' (did the teacher flow run first?)');
var code = json(r.body).code;
if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Unexpected join code ' + code);
output.groupCode = code;
console.log('Join code for ' + GROUP_NAME + ': ' + code);

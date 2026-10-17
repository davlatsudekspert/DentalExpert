#!/usr/bin/env node
// Test-only reverse proxy for the iOS Simulator sign-in flows (never used in production).
//
// The simulator build calls this proxy (VITE_API_BASE=http://127.0.0.1:8789), which forwards every request unchanged
// to the local `wrangler pages dev` on 8788 (local D1, AUTH_DEV_ECHO=1). Because dev echo is on, the API returns the
// one-time email code as `devCode` in the /api/auth/request-code response; the app ignores that field, this proxy
// remembers it per email. It also remembers classroom join codes from /api/classroom/groups responses.
// Maestro flows read both through runScript (tools/ios_sim/scripts/*.js):
//   GET /__e2e/health
//   GET /__e2e/code?email=<email>[&wait=<ms>]         -> {"code":"123456"}
//   GET /__e2e/group-code?name=<group name>[&wait=<ms>] -> {"code":"ABC123"}
// Listens on 127.0.0.1 only. Usage: node e2e_proxy.mjs [listenPort=8789] [targetPort=8788]
import http from 'node:http';

const LISTEN = Number(process.argv[2] || process.env.PROXY_PORT || 8789);
const TARGET = Number(process.argv[3] || process.env.API_PORT || 8788);
const HOST = '127.0.0.1';
const MAX_WAIT_MS = 8000;

const codes = new Map();      // email -> latest devCode
const groupCodes = new Map(); // group name -> join code

// A '+' left unencoded in a query string arrives as a space; emails never contain spaces, so map it back.
const norm = (e) => String(e || '').trim().toLowerCase().replace(/ /g, '+');
const sendJson = (res, status, obj) => {
  const buf = Buffer.from(JSON.stringify(obj));
  res.writeHead(status, {'content-type': 'application/json', 'content-length': buf.length, 'cache-control': 'no-store'});
  res.end(buf);
};
const parseJson = (buf) => { try { return JSON.parse(buf.toString('utf8')); } catch { return null; } };

async function waitFor(map, key, waitMs) {
  const until = Date.now() + Math.min(Math.max(waitMs, 0), MAX_WAIT_MS);
  while (!map.has(key) && Date.now() < until) await new Promise((r) => setTimeout(r, 200));
  return map.get(key);
}

function remember(path, reqBody, status, resBody) {
  if (status < 200 || status >= 300) return;
  const data = parseJson(resBody);
  if (!data) return;
  if (path === '/api/auth/request-code' && typeof data.devCode === 'string') {
    const email = norm(parseJson(reqBody)?.email);
    if (email) { codes.set(email, data.devCode); console.log(`[e2e] captured sign-in code for ${email}`); }
  }
  if (path === '/api/classroom/groups') {
    const list = Array.isArray(data.groups) ? data.groups : data.group ? [data.group] : [];
    for (const g of list) if (g && typeof g.name === 'string' && typeof g.code === 'string') groupCodes.set(g.name, g.code);
  }
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    const body = Buffer.concat(chunks);
    const url = new URL(req.url || '/', `http://${HOST}:${LISTEN}`);

    if (url.pathname.startsWith('/__e2e/')) {
      const wait = Number(url.searchParams.get('wait') || 0);
      if (url.pathname === '/__e2e/health') return sendJson(res, 200, {ok: true, target: TARGET});
      if (url.pathname === '/__e2e/code') {
        const code = await waitFor(codes, norm(url.searchParams.get('email')), wait);
        return code ? sendJson(res, 200, {code}) : sendJson(res, 404, {error: 'no_code_for_email'});
      }
      if (url.pathname === '/__e2e/group-code') {
        const code = await waitFor(groupCodes, String(url.searchParams.get('name') || ''), wait);
        return code ? sendJson(res, 200, {code}) : sendJson(res, 404, {error: 'no_group_with_that_name'});
      }
      return sendJson(res, 404, {error: 'unknown_e2e_endpoint'});
    }

    const headers = {...req.headers, host: `${HOST}:${TARGET}`};
    delete headers['accept-encoding']; // keep responses uncompressed so they can be inspected
    delete headers['content-length'];
    if (body.length) headers['content-length'] = String(body.length);

    const up = http.request({host: HOST, port: TARGET, method: req.method, path: req.url, headers}, (upRes) => {
      const out = [];
      upRes.on('data', (c) => out.push(c));
      upRes.on('end', () => {
        const resBody = Buffer.concat(out);
        try { remember(url.pathname, body, upRes.statusCode || 0, resBody); } catch (e) { console.error('[e2e] inspect failed', e); }
        const h = {...upRes.headers};
        delete h['transfer-encoding'];
        delete h['content-encoding'];
        h['content-length'] = String(resBody.length);
        res.writeHead(upRes.statusCode || 502, h);
        res.end(resBody);
        console.log(`${new Date().toISOString()} ${req.method} ${url.pathname} -> ${upRes.statusCode} (origin: ${req.headers.origin || '-'})`);
      });
    });
    up.on('error', (e) => {
      console.error(`${new Date().toISOString()} ${req.method} ${url.pathname} -> upstream error ${e.message}`);
      if (!res.headersSent) sendJson(res, 502, {error: 'upstream_unreachable'});
    });
    up.end(body);
  });
});

server.listen(LISTEN, HOST, () => console.log(`[e2e] proxy http://${HOST}:${LISTEN} -> http://${HOST}:${TARGET}`));

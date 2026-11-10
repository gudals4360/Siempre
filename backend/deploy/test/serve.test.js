import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDemoServer } from '../serve.js';

// 임시 "dist" 폴더와 메모리 DB로 한 서버(화면 + API)를 띄워 본다
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-dist-'));
fs.mkdirSync(path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>앱</title>');
fs.writeFileSync(path.join(dist, 'service.html'), '<!doctype html><title>서비스</title>');
fs.writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
fs.writeFileSync(path.join(dist, 'logo.png'), Buffer.from([137, 80, 78, 71]));
fs.writeFileSync(path.join(os.tmpdir(), 'siempre-secret.txt'), 'dist 밖 파일'); // dist 바로 위 폴더에 둔 파일

const { server, db } = createDemoServer({ env: { DATABASE_URL: ':memory:', DEMO_LOGIN: '1', QUIET: '1' }, staticDir: dist });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => {
  server.close();
  db.close();
  fs.rmSync(dist, { recursive: true, force: true });
  fs.rmSync(path.join(os.tmpdir(), 'siempre-secret.txt'), { force: true });
});

test('/ 와 앱 안 주소(/login)는 index.html', async () => {
  for (const p of ['/', '/login', '/signup/account']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    assert.match(await r.text(), /<title>앱<\/title>/, p);
  }
});

test('파일은 종류에 맞게, 해시 assets는 오래 캐시', async () => {
  const js = await fetch(base + '/assets/app-abc123.js');
  assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /javascript/);
  assert.match(js.headers.get('cache-control'), /immutable/);
  const png = await fetch(base + '/logo.png');
  assert.equal(png.headers.get('content-type'), 'image/png');
  const html = await fetch(base + '/service.html');
  assert.equal(html.headers.get('cache-control'), 'no-cache');
});

test('없는 파일은 404, dist 밖 경로와 잘못된 주소는 못 읽는다', async () => {
  assert.equal((await fetch(base + '/missing.js')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e/siempre-secret.txt')).status, 404);
  assert.equal((await fetch(base + '/..%2fsiempre-secret.txt')).status, 404);
  assert.equal((await fetch(base + '/%00')).status, 400);
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
});

test('GET·HEAD만 받는다', async () => {
  assert.equal((await fetch(base + '/', { method: 'POST', body: '{}' })).status, 405);
  const head = await fetch(base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('gzip을 지원하면 압축해서 보낸다', async () => {
  const r = await fetch(base + '/service.html', { headers: { 'accept-encoding': 'gzip' } });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /서비스/); // fetch가 자동으로 풀어 준다
});

test('/api는 백엔드가 답한다 (시연 로그인 설정이 보인다)', async () => {
  const r = await fetch(base + '/api/auth/config');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { demoLogin: true, firebase: false });
  const none = await fetch(base + '/api/nothing'); // /api 아래 없는 주소는 화면(index.html)이 아니라 API의 404
  assert.equal(none.status, 404);
  assert.match(none.headers.get('content-type'), /json/);
});

test('dist가 없으면 503으로 빌드 안내', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-empty-'));
  const { server: s2, db: db2 } = createDemoServer({ env: { DATABASE_URL: ':memory:', QUIET: '1' }, staticDir: empty });
  await new Promise((r) => s2.listen(0, '127.0.0.1', r));
  const r = await fetch(`http://127.0.0.1:${s2.address().port}/`);
  assert.equal(r.status, 503);
  assert.match(await r.text(), /npm run build/);
  s2.close();
  db2.close();
  fs.rmSync(empty, { recursive: true, force: true });
});

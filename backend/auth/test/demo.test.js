// 시연 모드(DEMO_LOGIN=1) 검사: Firebase 설정 없이 관리자 계정으로 로그인한다.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../../shared/server.js';

let clock = Date.now();
const apps = [];

async function start(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-demo-'));
  const app = createApp({ env: { QUIET: '1', DATABASE_URL: path.join(dir, 't.db'), ...env }, now: () => clock });
  await new Promise((r) => app.server.listen(0, r));
  apps.push({ app, dir });
  const base = `http://localhost:${app.server.address().port}`;
  return async (p, { method = 'GET', token, body } = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
  };
}

after(() => {
  for (const { app, dir } of apps) {
    app.server.close();
    app.db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('시연 모드 꺼짐 (기본)', () => {
  let call;
  before(async () => { call = await start({}); });
  test('demo-login은 404, config는 demoLogin false', async () => {
    assert.equal((await call('/api/auth/demo-login', { method: 'POST' })).status, 404);
    assert.deepEqual((await call('/api/auth/config')).body, { demoLogin: false, firebase: false });
  });
});

describe('시연 모드 켜짐 (DEMO_LOGIN=1, Firebase 없음)', () => {
  let call;
  before(async () => { call = await start({ DEMO_LOGIN: '1' }); });

  test('config → demoLogin true, demo-login → 토큰, me → 관리자', async () => {
    assert.deepEqual((await call('/api/auth/config')).body, { demoLogin: true, firebase: false });
    const login = await call('/api/auth/demo-login', { method: 'POST' });
    assert.equal(login.status, 200);
    assert.match(login.body.token, /^demo\./);
    assert.equal(login.body.user.nickname, '관리자');
    const me = await call('/api/auth/me', { token: login.body.token });
    assert.equal(me.status, 200);
    assert.deepEqual(me.body, { user: login.body.user, subscribed: false });
    // 두 번 로그인해도 계정은 하나
    const again = await call('/api/auth/demo-login', { method: 'POST' });
    assert.equal(again.body.user.id, login.body.user.id);
  });

  test('위조·만료 토큰, Firebase 토큰처럼 생긴 값은 거부', async () => {
    const { body } = await call('/api/auth/demo-login', { method: 'POST' });
    const forged = body.token.slice(0, -2) + (body.token.endsWith('AA') ? 'BB' : 'AA');
    assert.equal((await call('/api/auth/me', { token: forged })).status, 401);
    const otherUid = 'demo.' + Buffer.from(JSON.stringify({ uid: 'someone', exp: clock + 1e6 })).toString('base64url') + '.' + body.token.split('.')[2];
    assert.equal((await call('/api/auth/me', { token: otherUid })).status, 401);
    // Firebase 설정이 없으니 일반 토큰은 503
    assert.equal((await call('/api/auth/me', { token: 'a.b.c' })).status, 503);
    clock += 13 * 3600 * 1000; // 12시간이 지나면 만료
    assert.equal((await call('/api/auth/me', { token: body.token })).status, 401);
  });

  test('일반 가입으로는 관리자 닉네임을 쓸 수 없음', async () => {
    assert.deepEqual((await call('/api/auth/check-nickname', { method: 'POST', body: { nickname: '관리자' } })).body, { available: false, reason: 'reserved' });
  });
});

describe('다른 서버의 시연 토큰은 통하지 않음', () => {
  test('서버를 다시 켜면(키가 바뀌면) 이전 토큰 401', async () => {
    const a = await start({ DEMO_LOGIN: '1' });
    const b = await start({ DEMO_LOGIN: '1' });
    const { body } = await a('/api/auth/demo-login', { method: 'POST' });
    assert.equal((await b('/api/auth/me', { token: body.token })).status, 401);
  });
});

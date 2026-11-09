// auth 파트 라우트 등록. shared/server.js에서 한 줄로 부른다. API 표: auth/README.md
// 로그인은 화면이 Firebase Authentication으로 하고, 요청마다 "Authorization: Bearer <Firebase ID 토큰>"을 보낸다.

import { ApiError } from '../shared/errors.js';
import { clientIp, readJson } from '../shared/http.js';
import { RATE_LIMITS } from './config.js';
import { createDemoAuth } from './demo.js';
import { createCertSource, createIdTokenVerifier } from './firebase.js';
import { migrateAuth } from './schema.js';
import { createAuthService } from './service.js';

function createRateLimiter(now) {
  const hits = new Map();
  return function check(name, ip) {
    const { limit, windowMs } = RATE_LIMITS[name];
    const key = `${name}:${ip}`;
    const t = now();
    const recent = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (recent.length >= limit) {
      throw new ApiError(429, 'rate_limited', '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', { retryAfter: Math.ceil((windowMs - (t - recent[0])) / 1000) });
    }
    recent.push(t);
    hits.set(key, recent);
  };
}

export function registerAuthRoutes(router, ctx) {
  const { db, env, now } = ctx;
  migrateAuth(db, { seedDemo: env.SEED_DEMO !== '0', now: now() });
  const svc = createAuthService(db, { now });
  const limit = createRateLimiter(now);
  // 테스트에서는 ctx.getFirebaseCerts로 가짜 공개키를 넣는다
  const verifyFirebase = createIdTokenVerifier({ projectId: env.FIREBASE_PROJECT_ID, getCerts: ctx.getFirebaseCerts ?? createCertSource(fetch, now), now });
  // 시연 모드(DEMO_LOGIN=1): Firebase 없이 관리자 계정 하나로 로그인 (auth/demo.js)
  const demo = createDemoAuth({ db, enabled: env.DEMO_LOGIN === '1', now });
  const verify = async (token) => (demo.isDemoToken(token) ? demo.verify(token) : verifyFirebase(token));

  const bearer = (req) => /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization || ''))?.[1] ?? null;

  /** Firebase 계정 확인. 토큰이 없거나 틀리면 401 login_required */
  async function requireIdentity(req) {
    const token = bearer(req);
    if (!env.FIREBASE_PROJECT_ID && !(demo.enabled && demo.isDemoToken(token))) {
      throw new ApiError(503, 'auth_not_configured', '로그인 설정이 아직 안 됐어요. (FIREBASE_PROJECT_ID)');
    }
    const identity = token ? await verify(token) : null;
    if (!identity) throw new ApiError(401, 'login_required', '로그인이 필요해요.');
    return identity;
  }

  /** 다른 파트에 주는 함수 (shared/README.md 3장). Firebase 확인이 들어가서 async다. */
  const currentUser = async (req) => {
    const token = bearer(req);
    const identity = token ? await verify(token) : null;
    return identity ? svc.userByUid(identity.uid) : null;
  };
  const requireUser = async (req) => {
    const user = await currentUser(req);
    if (!user) throw new ApiError(401, 'login_required', '로그인이 필요해요.');
    return user;
  };

  // 화면이 어떤 로그인 방법을 보여 줄지 정할 때 쓴다
  router.get('/api/auth/config', async () => ({ body: { demoLogin: demo.enabled, firebase: Boolean(env.FIREBASE_PROJECT_ID) } }));

  router.post('/api/auth/demo-login', async (req) => {
    if (!demo.enabled) throw new ApiError(404, 'not_found', '없는 주소예요.');
    limit('signup', clientIp(req));
    return { body: { token: demo.issue(), user: svc.userByUid('demo:admin') } };
  });

  router.post('/api/auth/check-email', async (req) => {
    limit('checkEmail', clientIp(req));
    return { body: svc.checkEmail(await readJson(req)) };
  });

  router.post('/api/auth/check-nickname', async (req) => {
    limit('checkNickname', clientIp(req));
    return { body: svc.checkNickname(await readJson(req)) };
  });

  router.post('/api/auth/signup', async (req) => {
    limit('signup', clientIp(req));
    const identity = await requireIdentity(req);
    return { status: 201, body: svc.signup(identity, await readJson(req)) };
  });

  router.get('/api/auth/me', async (req) => {
    const identity = await requireIdentity(req);
    const user = svc.userByUid(identity.uid);
    // Firebase 계정은 있는데 Siempre 가입(닉네임·약관)을 마치지 않은 경우
    if (!user) throw new ApiError(404, 'profile_missing', '가입을 마저 끝내 주세요.', { email: identity.email });
    return { body: { user, subscribed: ctx.getSubscription(user.id) != null } };
  });

  return { currentUser, requireUser };
}

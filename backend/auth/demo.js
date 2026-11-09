// 시연(데모) 모드: Firebase 연결 없이 MVP를 보여 줄 때 쓰는 관리자 계정 하나.
// backend/.env에 DEMO_LOGIN=1이 있을 때만 켜진다. 운영 배포에서는 절대 켜지 않는다.
// 비밀번호 없이 로그인 화면의 "시연용 관리자로 로그인" 버튼으로만 들어간다.

import crypto from 'node:crypto';
import { nowIso } from '../shared/db.js';

export const DEMO_UID = 'demo:admin';
export const DEMO_EMAIL = 'admin@siempre.demo';
export const DEMO_NICKNAME = '관리자';
const TOKEN_PREFIX = 'demo.';
const TOKEN_TTL_MS = 12 * 3600 * 1000;

export function createDemoAuth({ db, enabled, now = () => Date.now() }) {
  // 서버를 켤 때마다 새 키: 다시 켜면 시연 로그인이 풀린다 (토큰이 밖에서 오래 쓰이지 않게)
  const secret = crypto.randomBytes(32);
  const sign = (body) => crypto.createHmac('sha256', secret).update(body).digest('base64url');

  function ensureUser() {
    const t = nowIso(now());
    // 예약 닉네임('관리자')이라 일반 가입으로는 만들 수 없고, 시연 모드에서만 이렇게 넣는다
    db.prepare(`INSERT INTO users (firebase_uid, email, nickname, marketing, terms_agreed_at, created_at)
                VALUES (?, ?, ?, 0, ?, ?) ON CONFLICT DO NOTHING`).run(DEMO_UID, DEMO_EMAIL, DEMO_NICKNAME, t, t);
  }

  return {
    enabled,
    isDemoToken: (token) => typeof token === 'string' && token.startsWith(TOKEN_PREFIX),

    /** 시연용 관리자 토큰 발급 */
    issue() {
      ensureUser();
      const body = Buffer.from(JSON.stringify({ uid: DEMO_UID, exp: now() + TOKEN_TTL_MS })).toString('base64url');
      return `${TOKEN_PREFIX}${body}.${sign(body)}`;
    },

    /** 토큰이 맞으면 Firebase 확인과 같은 모양 { uid, email }, 아니면 null */
    verify(token) {
      if (!enabled || !this.isDemoToken(token) || token.length > 512) return null;
      const [body, sig] = token.slice(TOKEN_PREFIX.length).split('.');
      if (!body || !sig) return null;
      const expected = sign(body);
      if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      let payload;
      try {
        payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      } catch {
        return null;
      }
      if (payload.uid !== DEMO_UID || !(payload.exp > now())) return null;
      return { uid: DEMO_UID, email: DEMO_EMAIL, emailVerified: true };
    },
  };
}

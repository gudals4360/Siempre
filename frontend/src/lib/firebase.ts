// Firebase 연결. 값은 frontend/.env.local의 VITE_FIREBASE_* (예시: .env.example)
// 이메일·비밀번호 확인과 로그인 상태 유지는 Firebase Authentication이 맡는다.

import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';
import { getDemoToken } from './demo';

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** 로그인에 꼭 필요한 값이 다 있는지 */
export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export const auth: Auth | null = firebaseReady ? getAuth(initializeApp(config)) : null;
// 브라우저를 닫았다 열어도 로그인 유지 (PRD 7-0 "로그인 상태가 유지된다")
if (auth) void setPersistence(auth, browserLocalPersistence);

/** 백엔드 요청 Authorization 헤더에 붙일 토큰: Firebase 계정의 ID 토큰, 없으면 시연 모드 토큰 */
export async function currentIdToken(): Promise<string | null> {
  if (auth?.currentUser) return auth.currentUser.getIdToken();
  return getDemoToken();
}

/** Firebase 오류 코드 → 사용자에게 보여 줄 문장 */
export function firebaseErrorMessage(code: string): { kind: 'exists' | 'credentials' | 'other'; message: string } {
  switch (code) {
    case 'auth/email-already-in-use':
      return { kind: 'exists', message: '이미 가입한 이메일이에요. 로그인해 주세요.' };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return { kind: 'credentials', message: '이메일 또는 비밀번호가 맞지 않아요.' };
    case 'auth/invalid-email':
      return { kind: 'other', message: '이메일 형식을 확인해 주세요.' };
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return { kind: 'other', message: '비밀번호가 너무 쉬워요. 8자 이상, 영문과 숫자를 함께 써 주세요.' };
    case 'auth/too-many-requests':
      return { kind: 'other', message: '시도가 너무 많아요. 잠시 후 다시 해 주세요.' };
    case 'auth/network-request-failed':
      return { kind: 'other', message: '인터넷 연결을 확인해 주세요.' };
    case 'auth/operation-not-allowed':
      return { kind: 'other', message: 'Firebase에서 이메일/비밀번호 로그인이 꺼져 있어요.' };
    default:
      return { kind: 'other', message: '로그인 서비스에서 오류가 났어요. 잠시 후 다시 해 주세요.' };
  }
}

export const firebaseCode = (e: unknown) => (typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '');

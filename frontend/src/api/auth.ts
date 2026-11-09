// backend/auth API 호출. 요청·응답 형식은 backend/auth/README.md 표 그대로.
// 실패 응답: { error: { code, message, ... } } (backend/shared/README.md 2장)
// 로그인이 필요한 요청에는 Firebase ID 토큰을 "Authorization: Bearer"로 붙인다.

import { currentIdToken } from '../lib/firebase';

export interface User { id: number; email: string; nickname: string }
export type EmailStatus = 'new' | 'exists' | 'rejoin';
export interface NicknameCheck { available: boolean; reason?: 'invalid' | 'reserved' | 'taken' }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

async function call<T>(path: string, { body, authed = false }: { body?: unknown; authed?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (authed) {
    const token = await currentIdToken();
    if (!token) throw new ApiError(401, 'login_required', '로그인이 필요해요.');
    headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(path, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'network', '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } & Record<string, unknown> };
  if (!res.ok) {
    const { code = 'server_error', message = '요청을 처리하지 못했어요.', ...extra } = data.error ?? {};
    throw new ApiError(res.status, code, message, extra);
  }
  return data as T;
}

export const authApi = {
  checkEmail: (email: string) => call<{ status: EmailStatus }>('/api/auth/check-email', { body: { email } }),
  checkNickname: (nickname: string) => call<NicknameCheck>('/api/auth/check-nickname', { body: { nickname } }),
  /** Firebase 계정을 만든(또는 로그인한) 뒤 Siempre 회원 정보를 만든다. 이메일은 서버가 토큰에서 읽는다. */
  signup: (input: { nickname: string; agreeTerms: boolean; marketing?: boolean }) =>
    call<{ user: User }>('/api/auth/signup', { body: input, authed: true }),
  me: () => call<{ user: User; subscribed: boolean }>('/api/auth/me', { authed: true }),
  /** 어떤 로그인 방법을 보여 줄지 (시연 모드가 켜졌는지) */
  config: () => call<{ demoLogin: boolean; firebase: boolean }>('/api/auth/config'),
  /** 시연 모드: Firebase 없이 관리자 계정으로 로그인 (백엔드 DEMO_LOGIN=1일 때만) */
  demoLogin: () => call<{ token: string; user: User }>('/api/auth/demo-login', { body: {} }),
};

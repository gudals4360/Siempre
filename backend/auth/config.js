// 회원가입·로그인 규칙 (auth/README.md "규칙" 표, PRD 7-0). 바뀌면 이 파일과 README만 고친다.
// 프런트의 frontend/src/config/auth.ts와 같은 값을 유지한다.
// 비밀번호 확인·로그인 상태 유지는 Firebase Authentication이 맡는다.

export const EMAIL_MAX = 254;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 닉네임: 2~12자, 한글·영문·숫자 */
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9]{2,12}$/;
export const RESERVED_NICKNAMES = ['admin', 'administrator', '운영자', '관리자', 'siempre', '씨엠프레', 'staff', 'root'];

/** IP당 1분 요청 제한 (로그인 시도 제한은 Firebase가 한다) */
export const RATE_LIMITS = {
  checkEmail: { limit: 20, windowMs: 60_000 },
  checkNickname: { limit: 40, windowMs: 60_000 },
  signup: { limit: 10, windowMs: 60_000 },
};

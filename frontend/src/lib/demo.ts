// 시연(데모) 모드 로그인 토큰. 백엔드가 DEMO_LOGIN=1일 때만 발급한다 (Firebase 없이 MVP 발표용).
// 새로고침해도 유지되게 localStorage에 둔다. 토큰은 12시간 뒤, 또는 백엔드를 다시 켜면 무효가 된다.

const KEY = 'siempre:demo-token';

export function getDemoToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setDemoToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // 저장이 막힌 환경이면 이 탭에서만 로그인 상태가 유지되지 않는다
  }
}

export function clearDemoToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

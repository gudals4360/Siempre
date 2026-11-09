import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthState';

/**
 * PRD 7-0: 로그인하지 않은 사용자가 구독·대화·크레딧 화면에 들어오면 로그인 화면으로 보낸다.
 * 그 화면들을 만들 때 <RequireAuth>로 감싸면 된다.
 * (2026-11-09 MVP: 서비스 화면은 둘러보기를 허용하고 "시작"할 때만 로그인을 받으므로 지금은 쓰는 곳이 없다. React로 만든 보호 화면이 생기면 쓴다)
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, pendingEmail } = useAuth();
  const location = useLocation();
  if (user === undefined) {
    return <p role="status" className="p-10 text-center text-sm text-ink-sub">로그인 상태를 확인하고 있어요.</p>;
  }
  if (!user && pendingEmail) return <Navigate to="/signup" replace />; // 가입을 마저 끝내도록
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

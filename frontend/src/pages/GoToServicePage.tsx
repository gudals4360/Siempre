import { useEffect } from 'react';
import { SERVICE_PAGE } from '../config/auth';

/** 서비스 화면(권희수 님 페이지)으로 보낸다. 로그인 여부는 그 페이지의 연결 스크립트가 처리한다. */
export function GoToServicePage() {
  useEffect(() => {
    window.location.replace(SERVICE_PAGE);
  }, []);
  return <p role="status" className="p-10 text-center text-sm text-ink-sub">서비스 화면으로 이동하고 있어요.</p>;
}

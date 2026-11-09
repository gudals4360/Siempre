import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/auth';
import { HOME_PATH } from '../../config/auth';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert, Field, PasswordToggle, PrimaryButton } from '../../components/auth/Controls';
import { isEmail, isHtmlPage, safeNext } from '../../lib/auth';
import { firebaseCode, firebaseErrorMessage } from '../../lib/firebase';
import { useAuth } from '../../state/AuthState';

/** 로그인 (Firebase Authentication). 성공하면 원래 가려던 화면(?next=)이나 홈으로 */
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, pendingEmail, login, firebaseReady, problem, demoAvailable, demoLogin } = useAuth();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get('next'), HOME_PATH);

  if (user) {
    if (isHtmlPage(next)) { window.location.replace(next); return null; }
    return <Navigate to={next} replace />;
  }
  // Firebase 계정은 있지만 Siempre 가입을 마치지 않았으면 가입 화면에서 이어서
  if (pendingEmail) return <Navigate to="/signup" replace />;

  const goNext = () => {
    if (isHtmlPage(next)) window.location.replace(next); // 서비스 화면 같은 별도 HTML 페이지
    else navigate(next, { replace: true });
  };

  async function enterDemo() {
    setBusy(true);
    setError(null);
    try {
      if ((await demoLogin()) === 'ok') goNext();
      else setError('시연용 로그인을 확인하지 못했어요. 백엔드를 다시 켜 보세요.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '시연용 로그인을 하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email) || !password) return;
    setBusy(true);
    setError(null);
    try {
      const r = await login(email.trim(), password);
      if (r === 'ok') goNext();
      else if (r === 'profile_missing') navigate('/signup', { replace: true });
    } catch (err) {
      setError(firebaseErrorMessage(firebaseCode(err)).message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="로그인" sub="가입한 이메일과 비밀번호를 입력해 주세요.">
      {!firebaseReady && !demoAvailable && <Alert>Firebase 설정이 없어요. frontend/.env.local에 VITE_FIREBASE_* 값을 넣고 다시 실행해 주세요.</Alert>}
      {demoAvailable && (
        <div className="mb-6 rounded-2xl border-[1.5px] border-dashed border-brand bg-page px-4 py-4">
          <p className="mb-3 text-sm">
            <b>시연 모드</b>예요. {firebaseReady ? '가입한 계정으로 로그인하거나, ' : 'Firebase 설정 없이 '}관리자 계정으로 바로 들어갈 수 있어요.
          </p>
          <PrimaryButton onClick={enterDemo} disabled={busy}>{busy ? '들어가는 중' : '시연용 관리자로 로그인'}</PrimaryButton>
        </div>
      )}
      {(error || problem) && <Alert>{error ?? problem}</Alert>}
      <form onSubmit={submit} noValidate>
        <Field id="li-email" label="이메일" type="email" inputMode="email" autoComplete="email" placeholder="name@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!email}
          invalid={email.length > 0 && !isEmail(email)} message={email.length > 0 && !isEmail(email) ? '이메일 형식을 확인해 주세요.' : null} messageKind="error" />
        <Field id="li-pw" label="비밀번호" type={show ? 'text' : 'password'} autoComplete="current-password" autoFocus={Boolean(email)}
          value={password} onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />} />
        <PrimaryButton type="submit" className="mt-2" disabled={busy || !firebaseReady || !isEmail(email) || !password}>{busy ? '로그인 중' : '로그인'}</PrimaryButton>
      </form>
      <p className="mt-4 text-center text-sm text-ink-sub">
        처음이세요? <Link to="/signup" className="inline-flex min-h-tap items-center font-bold text-ink underline underline-offset-2">회원가입</Link>
      </p>
    </AuthLayout>
  );
}

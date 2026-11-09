import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError, authApi, type EmailStatus } from '../../api/auth';
import { NICKNAME_HINT, PASSWORD_MAX, PASSWORD_RULE_LABELS } from '../../config/auth';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert, Field, MiniButton, PasswordToggle, PrimaryButton } from '../../components/auth/Controls';
import { CheckIcon } from '../../components/auth/icons';
import { confirmState, isEmail, isNickname, isPassword, passwordRules, type PasswordRule } from '../../lib/auth';
import { useAuth, useSignup } from '../../state/AuthState';

/** 이메일 확인 상태: idle → invalid → checking → new | rejoin | exists */
type EmailUi = { status: 'idle' | 'invalid' | 'checking' | EmailStatus; checked: boolean };
type NickUi = { status: 'idle' | 'invalid' | 'checking' | 'ok' | 'taken'; reason?: string };

/** 1단계: 계정 정보 (이메일·비밀번호·닉네임) */
export function SignupAccountPage() {
  const navigate = useNavigate();
  const { user, pendingEmail, firebaseReady, demoAvailable } = useAuth();
  const { draft, setDraft } = useSignup();
  // Firebase 계정은 있는데 Siempre 가입을 마치지 않은 경우: 이메일·비밀번호는 건너뛰고 닉네임·약관만 받는다
  const resume = Boolean(pendingEmail);
  const [email, setEmail] = useState(draft?.email ?? '');
  const [emailUi, setEmailUi] = useState<EmailUi>(draft && draft.emailStatus !== 'resume' ? { status: draft.emailStatus, checked: true } : { status: 'idle', checked: false });
  const [pw, setPw] = useState(draft?.password ?? '');
  const [pw2, setPw2] = useState(draft?.password ?? '');
  const [pw2Left, setPw2Left] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [nick, setNick] = useState(draft?.nickname ?? '');
  const [nickUi, setNickUi] = useState<NickUi>(draft ? { status: 'ok' } : { status: 'idle' });
  const [apiError, setApiError] = useState<string | null>(null);
  const emailToken = useRef(0);
  const nickToken = useRef(0);

  if (user) return <Navigate to="/" replace />;

  function onEmail(v: string) {
    setEmail(v);
    emailToken.current++; // 값이 바뀌면 진행 중인 응답과 확인 완료를 무효화
    setEmailUi({ status: v && !isEmail(v) ? 'invalid' : 'idle', checked: false });
  }

  async function checkEmail() {
    const t = ++emailToken.current;
    setEmailUi({ status: 'checking', checked: false });
    setApiError(null);
    try {
      const r = await authApi.checkEmail(email.trim());
      if (t !== emailToken.current) return; // 오래된 응답은 버린다
      setEmailUi({ status: r.status, checked: true });
    } catch (e) {
      if (t !== emailToken.current) return;
      setEmailUi({ status: e instanceof ApiError && e.code === 'invalid_email' ? 'invalid' : 'idle', checked: false });
      if (!(e instanceof ApiError && e.code === 'invalid_email')) setApiError(e instanceof ApiError ? e.message : '확인하지 못했어요.');
    }
  }

  function onNick(v: string) {
    // 한글 조합 중 값을 바꾸면 입력이 깨지므로 정리하지 않고 검사만 한다
    setNick(v);
    nickToken.current++;
    setNickUi({ status: v && !isNickname(v) ? 'invalid' : 'idle' });
  }

  async function checkNick() {
    const t = ++nickToken.current;
    setNickUi({ status: 'checking' });
    try {
      const r = await authApi.checkNickname(nick.trim());
      if (t !== nickToken.current) return;
      setNickUi(r.available ? { status: 'ok' } : { status: r.reason === 'invalid' ? 'invalid' : 'taken', reason: r.reason });
    } catch (e) {
      if (t !== nickToken.current) return;
      setNickUi({ status: 'idle' });
      setApiError(e instanceof ApiError ? e.message : '확인하지 못했어요.');
    }
  }

  const rules = passwordRules(pw);
  const c2 = confirmState(pw, pw2, pw2Left);
  const emailOk = resume || (emailUi.checked && (emailUi.status === 'new' || emailUi.status === 'rejoin'));
  const exists = !resume && emailUi.checked && emailUi.status === 'exists';
  const complete = emailOk && (resume || (isPassword(pw) && pw === pw2)) && nickUi.status === 'ok';

  const emailMsg =
    emailUi.status === 'invalid' ? { text: '이메일 형식을 확인해 주세요.', kind: 'error' as const }
    : !emailUi.checked ? null
    : emailUi.status === 'new' ? { text: '사용할 수 있는 이메일이에요.', kind: 'ok' as const }
    : emailUi.status === 'rejoin' ? { text: '탈퇴한 적 있는 이메일이에요. 다시 가입할 수 있어요.', kind: 'ok' as const }
    : null;

  function next() {
    if (!complete) return;
    if (resume && pendingEmail) setDraft({ email: pendingEmail, emailStatus: 'resume', nickname: nick.trim(), password: '' });
    else setDraft({ email: email.trim().toLowerCase(), emailStatus: emailUi.status as 'new' | 'rejoin', nickname: nick.trim(), password: pw });
    navigate('/signup/terms');
  }

  return (
    <AuthLayout step="account" title="Siempre 시작하기" sub="로그인에 쓸 이메일과 대화에서 보일 닉네임을 정해 주세요.">
      {!firebaseReady && (
        <Alert>
          {demoAvailable
            ? <>시연 모드에서는 가입 없이 <Link to="/login" className="font-bold underline">로그인 화면</Link>의 "시연용 관리자로 로그인"을 써 주세요. (가입은 Firebase 설정이 필요해요)</>
            : 'Firebase 설정이 없어요. frontend/.env.local에 VITE_FIREBASE_* 값을 넣고 다시 실행해 주세요.'}
        </Alert>
      )}
      {apiError && <Alert>{apiError}</Alert>}

      {resume ? (
        <div className="mb-5">
          <p className="mb-5 rounded-xl bg-page px-4 py-3 text-sm">로그인은 됐지만 Siempre 가입이 끝나지 않았어요. 닉네임과 약관만 마저 정해 주세요.</p>
          <Field id="su-email" label="이메일" value={pendingEmail ?? ''} readOnly className="bg-page text-ink-sub" />
        </div>
      ) : (<>
      <Field id="su-email" label="이메일" required type="email" inputMode="email" autoComplete="email" placeholder="name@example.com"
        value={email} onChange={(e) => onEmail(e.target.value)}
        onPaste={(e) => { e.preventDefault(); onEmail(e.clipboardData.getData('text').trim()); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && isEmail(email) && !emailUi.checked) void checkEmail(); }}
        invalid={emailUi.status === 'invalid'}
        action={
          <MiniButton done={emailOk} disabled={emailUi.status === 'checking' || !isEmail(email) || emailUi.checked} onClick={checkEmail}>
            {emailUi.status === 'checking' ? '확인 중' : emailOk ? '확인 완료' : exists ? '확인됨' : '이메일 확인'}
          </MiniButton>
        }
        message={exists ? (
          // PRD 7-0: 이미 가입된 이메일은 막지 않고 로그인 화면으로 안내
          <span className="text-ink">
            이미 가입한 이메일이에요.{' '}
            <Link to={`/login?email=${encodeURIComponent(email.trim())}`} className="inline-flex min-h-tap items-center font-bold underline underline-offset-2">로그인하러 가기</Link>
          </span>
        ) : emailMsg?.text}
        messageKind={exists ? 'info' : emailMsg?.kind} />

      <Field id="su-pw" label="비밀번호" required type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="8자 이상, 영문·숫자 포함"
        value={pw} onChange={(e) => setPw(e.target.value)} maxLength={PASSWORD_MAX}
        trailing={<PasswordToggle shown={showPw} onToggle={() => setShowPw((s) => !s)} />}
        extra={
          <ul aria-label="비밀번호 규칙" className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px]">
            {(Object.keys(PASSWORD_RULE_LABELS) as PasswordRule[]).map((k) => (
              <li key={k} className={`inline-flex items-center gap-1 ${rules[k] ? 'font-medium text-success' : 'text-ink-sub'}`}>
                {rules[k] ? <CheckIcon size={12} /> : <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-current" />}
                {PASSWORD_RULE_LABELS[k]}
                <span className="sr-only">{rules[k] ? '충족' : '미충족'}</span>
              </li>
            ))}
          </ul>
        } />
      <Field id="su-pw2" label="비밀번호 확인" required type={showPw ? 'text' : 'password'} autoComplete="new-password"
        value={pw2} onChange={(e) => { setPw2(e.target.value); if (e.target.value.length > pw.length) setPw2Left(true); }}
        onBlur={() => setPw2Left(true)} onFocus={() => setPw2Left(false)} maxLength={PASSWORD_MAX}
        invalid={c2 === 'mismatch'}
        message={c2 === 'match' ? '비밀번호가 일치해요.' : c2 === 'mismatch' ? '비밀번호가 일치하지 않아요.' : null}
        messageKind={c2 === 'match' ? 'ok' : 'error'} />
      </>)}

      <Field id="su-nick" label="닉네임" required autoComplete="nickname" placeholder={NICKNAME_HINT} maxLength={20}
        value={nick} onChange={(e) => onNick(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && isNickname(nick) && nickUi.status !== 'ok') void checkNick(); }}
        invalid={nickUi.status === 'invalid' || nickUi.status === 'taken'}
        action={<MiniButton done={nickUi.status === 'ok'} disabled={nickUi.status === 'ok' || nickUi.status === 'checking' || !isNickname(nick)} onClick={checkNick}>
          {nickUi.status === 'ok' ? '확인 완료' : nickUi.status === 'checking' ? '확인 중' : '중복 확인'}
        </MiniButton>}
        message={nickUi.status === 'ok' ? '사용할 수 있는 닉네임이에요.' : nickUi.status === 'invalid' ? `${NICKNAME_HINT}로 입력해 주세요.` : nickUi.status === 'taken' ? (nickUi.reason === 'reserved' ? '쓸 수 없는 닉네임이에요.' : '이미 쓰고 있는 닉네임이에요.') : null}
        messageKind={nickUi.status === 'ok' ? 'ok' : 'error'} />

      <PrimaryButton className="mt-2" disabled={!complete || !firebaseReady} onClick={next}>다음</PrimaryButton>
      {!resume && <p className="mt-4 text-center text-sm text-ink-sub">
        이미 계정이 있나요? <Link to="/login" className="inline-flex min-h-tap items-center font-bold text-ink underline underline-offset-2">로그인</Link>
      </p>}
    </AuthLayout>
  );
}

import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BENEFITS, SIGNUP_STEPS, type SignupStepId } from '../../config/auth';
import { ArrowLeftIcon, CheckIcon } from './icons';

/**
 * Figma "SU/Aside": 왼쪽 소개 패널.
 * - 소개 카드 3개는 같은 왼쪽 선·같은 너비·같은 색.
 * - 분홍(primary) 바탕 위 글자는 모두 ink (보조 회색은 대비 2.7:1이라 쓰지 않음).
 * - 큰 화면에서도 360px로 고정, 작은 화면에서는 제목만 보이는 띠로 줄어든다.
 */
function AuthAside({ step }: { step?: SignupStepId }) {
  const idx = step ? SIGNUP_STEPS.findIndex((s) => s.id === step) : -1;
  return (
    <aside aria-label="Siempre 소개" className="bg-brand px-4 py-5 text-ink lg:sticky lg:top-6 lg:rounded-xl2 lg:p-7">
      <h1 className="text-[22px] font-black leading-tight tracking-[-0.02em] lg:text-[28px]">
        쓸 AI만 골라 담고,
        <br />한 대화에서 쓰세요
      </h1>
      <p className="mt-2 text-sm font-medium lg:text-[15px]">가입하면 바로 구독 구성을 시작할 수 있어요.</p>

      <ul className="mt-6 hidden flex-col gap-2.5 lg:flex">
        {BENEFITS.map((b, i) => (
          <li key={b.title} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-[15px] font-black">{i + 1}</span>
            <span className="min-w-0">
              <b className="block text-sm font-bold leading-snug">{b.title}</b>
              <span className="block text-[13px] leading-snug text-ink-sub">{b.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      {step && (
        <ol aria-label="가입 단계" className="mt-7 hidden flex-col gap-1 lg:flex">
          {SIGNUP_STEPS.map((s, i) => {
            const done = i < idx;
            const on = i === idx;
            return (
              <li key={s.id} aria-current={on ? 'step' : undefined} className={`flex min-h-[30px] items-center gap-2.5 text-sm ${on ? 'font-black' : 'font-medium'}`}>
                <span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink ${done ? 'bg-surface' : on ? 'bg-ink' : ''}`}>
                  {done ? <CheckIcon size={11} /> : on ? <span className="h-1.5 w-1.5 rounded-full bg-surface" /> : null}
                </span>
                {s.label}
                {done && <span className="sr-only">(완료)</span>}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

/** 회원가입·로그인 공통 틀: 상단바 + 소개 패널 + 입력 카드 */
export function AuthLayout({ step, title, sub, back, children }: { step?: SignupStepId; title: string; sub?: string; back?: boolean; children: ReactNode }) {
  const navigate = useNavigate();
  const idx = step ? SIGNUP_STEPS.findIndex((s) => s.id === step) : -1;

  useEffect(() => {
    document.title = `${title} · Siempre`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="flex min-h-[67px] items-center justify-between gap-3 border-b border-lavender bg-surface px-4 py-3 md:px-10">
        <Link to="/" aria-label="Siempre 홈" className="flex min-h-tap items-center gap-2 text-ink">
          <img src={`${import.meta.env.BASE_URL}brand/siempre-symbol-96.png`} alt="" width={39} height={36} className="h-9 w-auto" />
          <img src={`${import.meta.env.BASE_URL}brand/siempre-wordmark-240.png`} alt="Siempre" width={91} height={28} className="h-7 w-auto" />
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1040px] items-start lg:my-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6 lg:px-6">
        <AuthAside step={step} />
        <section aria-labelledby="auth-title" className="bg-surface px-4 pb-10 pt-6 lg:min-h-[560px] lg:rounded-xl2 lg:border lg:border-lavender lg:px-10 lg:py-10">
          {step && step !== 'done' && (
            <div aria-hidden="true" className="mb-5 flex gap-1.5">
              {SIGNUP_STEPS.slice(0, -1).map((s, i) => (
                <span key={s.id} className={`h-1 flex-1 rounded-full ${i <= idx ? 'bg-brand' : 'bg-lavender'}`} />
              ))}
            </div>
          )}
          {back && (
            <button type="button" onClick={() => navigate(-1)} className="-ml-1 mb-1 inline-flex min-h-tap items-center gap-1 pr-2 text-[15px] text-ink-sub hover:text-ink">
              <ArrowLeftIcon /> 이전
            </button>
          )}
          <h2 id="auth-title" className="text-2xl font-black tracking-[-0.01em]">{title}</h2>
          {sub && <p className="mt-1.5 text-[15px] text-ink-sub">{sub}</p>}
          <div className="mt-7">{children}</div>
        </section>
      </main>
    </div>
  );
}

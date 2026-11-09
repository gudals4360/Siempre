// 로그인 상태. Firebase Authentication이 로그인을 유지하고, Siempre 회원 정보는 /api/auth/me로 받는다.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { ApiError, authApi, type User } from '../api/auth';
import { clearDemoToken, getDemoToken, setDemoToken } from '../lib/demo';
import { auth, firebaseReady } from '../lib/firebase';

type ProfileResult = 'ok' | 'profile_missing' | 'none';

interface AuthState {
  firebaseReady: boolean;
  /** undefined = 확인 중, null = Siempre 회원으로 로그인하지 않음 */
  user: User | null | undefined;
  /** Firebase 계정으로는 로그인했지만 Siempre 가입(닉네임·약관)을 마치지 않은 이메일 */
  pendingEmail: string | null;
  subscribed: boolean;
  /** 서버와 연결이 안 될 때 등 */
  problem: string | null;
  /** 백엔드 시연 모드(DEMO_LOGIN=1)가 켜져 있어 "시연용 관리자로 로그인"을 보여 줄지 */
  demoAvailable: boolean;
  /** 시연 모드: Firebase 없이 관리자 계정으로 로그인 */
  demoLogin: () => Promise<ProfileResult>;
  login: (email: string, password: string) => Promise<ProfileResult>;
  /** Firebase 계정을 만든다 (만들면 바로 로그인 상태). 지울 때 쓰도록 계정을 돌려준다. */
  createAccount: (email: string, password: string) => Promise<FirebaseUser>;
  refresh: () => Promise<ProfileResult>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(firebaseReady || getDemoToken() ? undefined : null);
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<ProfileResult> => {
    const fu = auth?.currentUser ?? null;
    if (!fu && !getDemoToken()) {
      setUser(null); setPendingEmail(null); setSubscribed(false);
      return 'none';
    }
    try {
      const r = await authApi.me();
      setUser(r.user); setSubscribed(r.subscribed); setPendingEmail(null); setProblem(null);
      return 'ok';
    } catch (e) {
      setUser(null); setSubscribed(false);
      if (!fu && e instanceof ApiError && e.status === 401) {
        clearDemoToken(); // 시연 토큰이 만료됐거나 백엔드를 다시 켰다
        setPendingEmail(null); setProblem(null);
        return 'none';
      }
      if (fu && e instanceof ApiError && e.code === 'profile_missing') {
        setPendingEmail(fu.email);
        setProblem(null);
        return 'profile_missing';
      }
      setPendingEmail(null);
      setProblem(e instanceof ApiError ? e.message : '회원 정보를 불러오지 못했어요.');
      return 'none';
    }
  }, []);

  useEffect(() => {
    authApi.config().then((c) => setDemoAvailable(c.demoLogin)).catch(() => setDemoAvailable(false));
    if (!auth) {
      if (getDemoToken()) void refresh();
      return;
    }
    return onAuthStateChanged(auth, () => { void refresh(); });
  }, [refresh]);

  const demoLogin = useCallback(async () => {
    const r = await authApi.demoLogin();
    setDemoToken(r.token);
    return refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('firebase not configured');
    await signInWithEmailAndPassword(auth, email, password);
    return refresh();
  }, [refresh]);

  const createAccount = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('firebase not configured');
    return (await createUserWithEmailAndPassword(auth, email, password)).user;
  }, []);

  const logout = useCallback(async () => {
    clearDemoToken();
    if (auth?.currentUser) await signOut(auth);
    setUser(null); setPendingEmail(null); setSubscribed(false);
  }, []);

  const value = useMemo(
    () => ({ firebaseReady, user, pendingEmail, subscribed, problem, demoAvailable, demoLogin, login, createAccount, refresh, logout }),
    [user, pendingEmail, subscribed, problem, demoAvailable, demoLogin, login, createAccount, refresh, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider 안에서 써야 해요');
  return v;
}

// ── 회원가입 입력값 (메모리에만, 비밀번호를 sessionStorage·localStorage에 저장하지 않음) ──

export interface SignupDraft { email: string; emailStatus: 'new' | 'rejoin' | 'resume'; nickname: string; password: string }
interface SignupState {
  draft: SignupDraft | null;
  setDraft: (d: SignupDraft | null) => void;
  done: { email: string; nickname: string; marketing: boolean } | null;
  setDone: (d: SignupState['done']) => void;
}
const SignupCtx = createContext<SignupState | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  const [done, setDone] = useState<SignupState['done']>(null);
  const value = useMemo(() => ({ draft, setDraft, done, setDone }), [draft, done]);
  return <SignupCtx.Provider value={value}>{children}</SignupCtx.Provider>;
}

export function useSignup() {
  const v = useContext(SignupCtx);
  if (!v) throw new Error('SignupProvider 안에서 써야 해요');
  return v;
}

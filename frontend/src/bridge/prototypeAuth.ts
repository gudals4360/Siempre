// 권희수 님 화면(siempre-figma-prototype.html)과 김형민 로그인을 잇는 연결 스크립트.
// 그 HTML은 고치지 않고, 이 파일을 불러오는 <script> 한 줄만 넣는다.
//
// MVP 흐름: 처음 온 사람도 구독 화면을 바로 본다. 실제로 "시작"할 때만 로그인을 받는다.
// 1. 로그인 안 했으면 상단바에 "로그인 / 회원가입" 버튼, 했으면 닉네임·로그아웃
// 2. 로그인 안 한 사람이 시작(이 구성으로 시작하기 / 무료로 시작하기)하거나 대화·크레딧으로 가면
//    고른 구성(담은 AI·결제 주기)을 저장하고 로그인 화면으로 보낸다
// 3. 로그인하고 돌아오면 고른 구성을 되살리고, 누르려던 동작을 이어서 한다
// 4. Firebase 계정은 있는데 Siempre 가입을 끝내지 않았으면 /signup으로 보낸다
// 5. 시연 모드(백엔드 DEMO_LOGIN=1)로 들어온 관리자 계정도 같은 방식으로 인식한다 (Firebase 없이)

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ApiError, authApi, type User } from '../api/auth';
import { BASE } from '../config/auth';
import { clearDemoToken, getDemoToken } from '../lib/demo';
import { auth } from '../lib/firebase';

const HERE = window.location.pathname;
const PENDING_KEY = 'siempre:pending-start'; // 탭을 닫으면 사라지는 sessionStorage (개인정보 없음: 담은 AI 단계·결제 주기·동작만)

/** 로그인이 필요한 동작: 클릭된 요소에서 찾는다 */
type Action = { kind: 'click'; id: 'start' | 'startFree' } | { kind: 'go'; to: 'chat' | 'credit' };
function actionOf(target: EventTarget | null): Action | null {
  const el = target instanceof Element ? target : null;
  if (!el) return null;
  const btn = el.closest('#start, #startFree');
  if (btn && !(btn as HTMLButtonElement).disabled) return { kind: 'click', id: btn.id as 'start' | 'startFree' };
  const go = el.closest<HTMLElement>('[data-go]');
  if (go && (go.dataset.go === 'chat' || go.dataset.go === 'credit')) return { kind: 'go', to: go.dataset.go };
  // 시연 버튼(E1·E2)은 결제된 상태로 대화를 여니 같이 막는다
  if (el.closest('#d-e1, #d-e2')) return { kind: 'go', to: 'chat' };
  return null;
}

// ── 권희수 님 화면 상태 읽기·되살리기 ──────────────────────
// 그 화면은 전역 `let S`(상태)와 전역 함수 renderSub()를 쓴다. 이름이 바뀌면 조용히 건너뛴다(구성만 초기화).
type ProtoState = { sel: Record<string, number>; cycle: string };
const readState = (): ProtoState | null => {
  try {
    return new Function('return typeof S === "object" && S ? { sel: { ...S.sel }, cycle: S.cycle } : null')() as ProtoState | null;
  } catch {
    return null;
  }
};
const restoreState = (s: ProtoState) => {
  try {
    new Function('saved', 'if (typeof S !== "object" || !S) return; Object.assign(S.sel, saved.sel); S.cycle = saved.cycle; if (typeof renderSub === "function") renderSub();')(s);
  } catch {
    // 화면 구조가 바뀌었으면 되살리지 않는다
  }
};

function savePending(action: Action) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ action, state: readState(), at: Date.now() }));
  } catch {
    // 저장이 막힌 환경이면 로그인 후 처음부터 고른다
  }
}
function takePending(): { action: Action; state: ProtoState | null } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.at > 30 * 60 * 1000) return null; // 30분이 지나면 버린다
    return p;
  } catch {
    return null;
  }
}

function runAction(a: Action) {
  if (a.kind === 'click') document.getElementById(a.id)?.click();
  else document.querySelector<HTMLElement>(`nav [data-go="${a.to}"]`)?.click();
}

// ── 상단바 ──────────────────────────────────────────
const btnStyle = 'min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--line,#ece3ea);background:#fff;color:inherit;font-size:13px;font-weight:600;cursor:pointer';
const primaryStyle = 'min-height:44px;padding:0 14px;border-radius:999px;border:0;background:var(--pink,#f678b6);color:#1b1b22;font-size:13px;font-weight:700;cursor:pointer';

function headerBox() {
  return document.querySelector<HTMLElement>('header .user');
}

function showGuest() {
  const box = headerBox();
  if (!box) return;
  box.querySelectorAll<HTMLElement>(':scope > span, :scope > .avatar').forEach((n) => { n.style.display = 'none'; });
  box.querySelector('[data-auth-member]')?.remove();
  if (box.querySelector('[data-auth-guest]')) return;
  const wrap = document.createElement('div');
  wrap.dataset.authGuest = '';
  wrap.style.cssText = 'display:flex;gap:8px;align-items:center';
  const login = document.createElement('button');
  login.type = 'button';
  login.textContent = '로그인';
  login.style.cssText = btnStyle;
  login.addEventListener('click', () => window.location.assign(`${BASE}login?next=${encodeURIComponent(HERE)}`));
  const signup = document.createElement('button');
  signup.type = 'button';
  signup.textContent = '회원가입';
  signup.style.cssText = primaryStyle;
  signup.addEventListener('click', () => window.location.assign(`${BASE}signup`));
  wrap.append(login, signup);
  box.appendChild(wrap);
}

function showMember(user: User) {
  const box = headerBox();
  if (!box) return;
  box.querySelector('[data-auth-guest]')?.remove();
  const name = box.querySelector<HTMLElement>(':scope > span');
  if (name) { name.style.display = ''; name.textContent = `${user.nickname} 님`; }
  const avatar = box.querySelector<HTMLElement>(':scope > .avatar');
  if (avatar) {
    avatar.style.display = '';
    avatar.textContent = Array.from(user.nickname)[0] ?? '';
    avatar.setAttribute('title', user.email);
    avatar.setAttribute('aria-label', `${user.nickname} (${user.email})`);
  }
  if (box.querySelector('[data-auth-member]')) return;
  const out = document.createElement('button');
  out.type = 'button';
  out.dataset.authMember = '';
  out.textContent = '로그아웃';
  out.style.cssText = btnStyle;
  out.addEventListener('click', async () => {
    out.disabled = true;
    clearDemoToken();
    if (auth?.currentUser) await signOut(auth).catch(() => {});
    window.location.replace(HERE); // 로그아웃해도 구독 화면에 그대로 남는다
  });
  box.appendChild(out);
}

// ── 로그인 상태 ──────────────────────────────────────
let member: User | null = null;
let known = false; // 로그인 확인이 끝났는지

// 로그인 안 한 사람이 시작하려 하면 막고 로그인 화면으로 (권희수 님 화면의 클릭 처리보다 먼저 받는다)
window.addEventListener('click', (e) => {
  if (member) return;
  const action = actionOf(e.target);
  if (!action) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (!known) return; // 확인 중에는 잠깐 무시
  savePending(action);
  window.location.assign(`${BASE}login?next=${encodeURIComponent(HERE)}`);
}, true);

/** 지금 로그인 상태를 확인해 상단바·이어서 할 동작을 정한다 (Firebase 계정 또는 시연 모드 토큰) */
async function check() {
  if (!auth?.currentUser && !getDemoToken()) {
    member = null;
    known = true;
    showGuest();
    return;
  }
  try {
    const { user } = await authApi.me();
    member = user;
    known = true;
    showMember(user);
    const pending = takePending();
    if (pending) {
      if (pending.state) restoreState(pending.state);
      setTimeout(() => runAction(pending.action), 0); // 화면이 다시 그려진 뒤 누르려던 동작을 이어서
    }
  } catch (e) {
    member = null;
    known = true;
    if (auth?.currentUser && e instanceof ApiError && e.code === 'profile_missing') {
      window.location.replace(`${BASE}signup`);
      return;
    }
    if (!auth?.currentUser && e instanceof ApiError && e.status === 401) clearDemoToken(); // 시연 토큰 만료·백엔드 재시작
    showGuest(); // 서버 연결 실패 등이면 둘러보기 상태로 둔다
  }
}

if (auth) onAuthStateChanged(auth, () => { void check(); });
else void check(); // Firebase 설정이 없으면 시연 모드 토큰만 확인한다

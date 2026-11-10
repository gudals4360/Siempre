# frontend

화면 코드를 올리는 폴더입니다.

| 담당 | 화면 |
| --- | --- |
| 권희수 | 홈페이지 전체 흐름, 구독·결제, 대화, 크레딧 |
| 김형민 | 회원가입·로그인 |

같은 프로젝트 안에서 화면(페이지)별로 파일을 나눠, 서로 남의 화면 파일은 고치지 않아요.

## 여기에 올리는 것

- 화면 코드: HTML·CSS·JS, 또는 React 등 프레임워크 프로젝트 전체
- 화면에서 쓰는 이미지·아이콘·글꼴

## 만들 화면 (MVP, `docs/PRD.md` 5장)

- 회원가입·로그인
- 구독 선택(장바구니)과 데모 결제
- 대화 (모델 칩, 선택 이유, 차감 크레딧, 다른 모델로 다시 받기)
- 크레딧 확인

## 올리지 않는 것

- AI 공급사 API 키. 화면은 `backend/`의 API만 부릅니다.
- `node_modules/`, `dist/`, `build/` 같은 설치·빌드 결과물

코드를 올릴 때 실행 방법(설치·실행 명령)을 이 README 아래에 적어 주세요.

---

## 실행 방법 (2026-11-09, 회원가입·로그인)

React 18 + TypeScript + Vite + Tailwind + Firebase Authentication. 회원 정보는 `backend/`의 API로 불러요.

**처음 한 번: Firebase 설정**
1. `frontend/.env.example`을 `frontend/.env.local`로 복사하고, Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)의 `firebaseConfig` 값을 따옴표 없이 넣어요.
2. `backend/.env.example`을 `backend/.env`로 복사하고 `FIREBASE_PROJECT_ID`에 같은 `projectId`를 넣어요.
3. Firebase 콘솔 → Authentication → 로그인 방법에서 **이메일/비밀번호**를 켜요. `.env.local`, `.env`는 커밋하지 않아요.

```bash
# 1. 백엔드 (다른 터미널)
cd backend
npm start                 # http://localhost:8787

# 2. 프런트엔드
cd frontend
npm install
npm run dev               # http://localhost:5173  (/api 요청은 8787로 넘어감)
npm run build             # 타입 검사 + 배포용 빌드
```

| 경로 | 화면 |
| --- | --- |
| `/signup` | 회원가입 1단계: 이메일 확인(새 이메일·탈퇴 이메일·이미 가입 → 로그인 안내), 비밀번호, 닉네임 중복 확인 |
| `/signup/terms` | 2단계: 약관 동의(필수 4개 + 선택 소식 받기) → Firebase 계정 만들기 + Siempre 회원 정보 저장 (바로 로그인 상태) |
| `/signup/done` | 3단계: 가입 완료 |
| `/login` | Firebase 로그인 (`?next=`로 원래 가려던 화면으로 돌아감). 가입을 마치지 않은 계정이면 `/signup`에서 이어서 |
| `/` | 누구나 서비스 화면(구독 선택)으로. `npm run dev` 후 처음 여는 화면 |
| `/siempre-figma-prototype.html` | 서비스 화면 (권희수 님: 구독·대화·크레딧). 둘러보기는 누구나, **시작할 때 로그인** |

- 로그인이 필요한 React 화면은 `<RequireAuth>`로 감싸면 로그인 안 한 사용자를 `/login`으로 보내요 (PRD 7-0).
- **MVP 흐름 (2026-11-09):** 처음 온 사람도 구독 화면부터 봐요. "이 구성으로 시작하기"·"결제 없이 무료로 시작하기"를 누르거나 대화·크레딧으로 가려고 하면
  고른 구성(담은 AI 단계·결제 주기)을 이 탭의 sessionStorage에 잠깐 저장하고 로그인 화면으로 보내요. 로그인(또는 가입)하고 돌아오면 구성을 되살리고 누르려던 동작을 이어서 해요.
  상단바는 로그인 전 "로그인 / 회원가입", 로그인 후 닉네임·로그아웃이에요. 로그아웃해도 구독 화면에 남아요.
- **시연 모드 (MVP 발표):** `backend/.env`에 `DEMO_LOGIN=1`을 넣고 백엔드를 켜면, Firebase 설정(`frontend/.env.local`)이 없어도 로그인 화면의 **"시연용 관리자로 로그인"** 버튼으로 들어갈 수 있어요.
  시연 토큰은 브라우저 localStorage에 있어서 새로고침해도 유지되고, 로그아웃하거나 백엔드를 다시 켜면 풀려요. 운영 배포에서는 켜지 않아요.
- **서비스 화면과 로그인 연결:** `siempre-figma-prototype.html`의 `<head>`에 `src/bridge/prototypeAuth.ts`를 부르는 `<script>` 한 줄만 넣었어요. 이 스크립트가
  로그인 확인(안 했으면 `/login?next=…`, 가입을 안 끝냈으면 `/signup`), 상단바 "도윤 님" 자리에 실제 닉네임, 로그아웃 버튼을 맡아요. 그 HTML의 다른 부분은 건드리지 않아요.
- 빌드하면 페이지 두 개가 나와요 (`vite.config.ts`의 `build.rollupOptions.input`): `index.html`(회원가입·로그인), `siempre-figma-prototype.html`(서비스 화면).
- 바뀔 수 있는 값·문구는 `src/config/auth.ts`, 검사 함수는 `src/lib/auth.ts`, Firebase 연결·오류 문구는 `src/lib/firebase.ts`, API 호출은 `src/api/auth.ts` (로그인 필요 요청에 Firebase ID 토큰을 붙임).
- 색·글꼴 토큰은 `tailwind.config.js` (디자인 명세 2장 색, 글꼴 Pretendard).
- 디자인 시안: Figma `siempre · 확정용 > 회원가입 시안` (https://www.figma.com/design/gBNj0gHsS4457DHLWG7N0O)
## 방문 통계 (Google Analytics 4)

측정 ID는 `G-1SK7P15M93`이고, **`public/analytics.js` 한 곳**에 있어요. 두 페이지(`index.html`, `siempre-figma-prototype.html`)의 `<head>`에서 같은 파일을 불러와요. ID를 바꾸려면 그 파일의 `ID` 값만 고치면 돼요.

- **개발 중에는 보내지 않아요.** `localhost`·`127.0.0.1`에서는 아무것도 전송하지 않아서 개발·시연 연습이 통계에 섞이지 않아요. 지금 켜서 확인하고 싶으면 주소 끝에 `?ga_debug=1`을 붙이고 GA의 **DebugView**에서 봐요(이 방문은 일반 보고서에 합쳐지지 않아요).
- **로그인·가입 앱**: 주소가 바뀔 때마다 GA4 "향상된 측정"이 `page_view`를 자동으로 보내요(데이터 스트림에서 켜져 있어야 해요).
- **서비스 화면**은 주소가 그대로라서 직접 보내는 이벤트가 있어요.

| 이벤트 | 언제 | 같이 보내는 값 |
| --- | --- | --- |
| `view_screen` | 상단 메뉴로 구독·대화·크레딧 화면이 바뀔 때 | `screen_name`: `subscribe` / `chat` / `credit` |
| `cta_start_paid` | "이 구성으로 시작하기"를 누를 때 | 없음 |
| `cta_start_free` | "결제 없이 무료로 시작하기"를 누를 때 | 없음 |
| `payment_submit` | 결제하기 창에서 결제 버튼을 누를 때 (결제 창이 있는 버전에서) | 없음 |
| `credit_charge` | AI별 "충전하기"를 누를 때 | `ai`: 어느 AI인지 |

- 입력한 글, 이메일, 닉네임, 카드 정보 같은 **개인정보는 보내지 않아요.** 버튼 이름과 AI 이름만 보내요.
- 올린 뒤 확인: GA → 보고서 → **실시간**에서 내 방문과 위 이벤트가 보이는지 봐요. 반영까지 몇 분 걸릴 수 있어요.
- 실제 서비스로 열 때는 GA 사용 사실을 개인정보 처리방침에 적고, 필요하면 동의 배너를 붙여요(지금은 동의 배너가 없어요).
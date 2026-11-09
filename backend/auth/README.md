# auth — 회원가입·로그인 (김형민)

PRD 7-0. 이메일과 비밀번호로 가입하고 로그인해요. 소셜 로그인, 비밀번호 찾기 메일은 MVP 범위 밖이에요 (PRD 9장).

> **2026-11-09 변경: 로그인은 Firebase Authentication이 맡아요.** 이메일·비밀번호 확인, 비밀번호 보관, 로그인 유지는 Firebase가 하고,
> 이 파트는 Siempre 회원 정보(닉네임·약관·마케팅 동의)와 이메일·닉네임 확인을 맡아요. 이전 표(직접 비밀번호 저장, `login`·`logout`·세션 쿠키)는 아래 "바뀐 점"에 남겨 뒀어요.

## 흐름

```
[화면] Firebase로 계정 만들기(createUserWithEmailAndPassword) 또는 로그인(signInWithEmailAndPassword)
   → Firebase ID 토큰을 "Authorization: Bearer <토큰>"으로 붙여 백엔드 호출
[백엔드] 토큰 서명을 구글 공개 인증서로 확인(서비스 계정 키 필요 없음) → uid로 users 행 찾기
```

## API

| 메서드 | 주소 | 로그인 토큰 | 요청 | 성공 응답 |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/check-email` | 필요 없음 | `{ email }` | `{ status: "new" \| "exists" \| "rejoin" }` |
| POST | `/api/auth/check-nickname` | 필요 없음 | `{ nickname }` | `{ available: true }` 또는 `{ available: false, reason: "invalid" \| "reserved" \| "taken" }` |
| POST | `/api/auth/signup` | **필요** | `{ nickname, agreeTerms, marketing? }` | 201 `{ user }` |
| GET | `/api/auth/me` | **필요** | — | `{ user, subscribed }` |
| GET | `/api/auth/config` | 필요 없음 | — | `{ demoLogin, firebase }` (화면이 시연 버튼을 보여 줄지 정함) |
| POST | `/api/auth/demo-login` | 필요 없음 | — | `{ token, user }` — **시연 모드(`DEMO_LOGIN=1`)에서만**, 꺼져 있으면 404 |

- `user` = `{ id, email, nickname }`. 이메일은 화면이 보낸 값이 아니라 **토큰 안의 이메일**을 써요.
- 로그인·로그아웃은 화면에서 Firebase로 해요 (`signInWithEmailAndPassword`, `signOut`). 백엔드 주소는 없어요.
- `me`가 404 `profile_missing`이면 Firebase 계정은 있는데 Siempre 가입(닉네임·약관)을 마치지 않은 상태예요. 화면은 가입 화면에서 이어서 받게 해요.

## 시연 모드 (MVP 발표용, 2026-11-09)

Firebase 설정 없이 발표할 수 있게 **관리자 계정 하나**로 들어가는 모드예요.

- `backend/.env`에 `DEMO_LOGIN=1`이면 켜져요. 로그인 화면에 "시연용 관리자로 로그인" 버튼이 생기고, 비밀번호 없이 그 버튼으로만 들어가요.
- 계정: 닉네임 `관리자`, 이메일 `admin@siempre.demo` (예약 닉네임이라 일반 가입으로는 만들 수 없음). 처음 로그인할 때 `users`에 한 줄 생겨요.
- 토큰: `demo.`로 시작, 서버 메모리의 무작위 키로 서명, 12시간 유효. **백엔드를 다시 켜면 무효**가 돼서 다시 버튼을 눌러야 해요.
- Firebase 설정(`FIREBASE_PROJECT_ID`)이 없어도 시연 토큰은 통과해요. Firebase 토큰과 함께 써도 돼요.
- ⚠️ 비밀번호 없이 들어가는 계정이라 **운영 배포에서는 절대 켜지 않아요.** 켜면 서버 시작 로그에 경고가 떠요.

## 규칙

| 항목 | 규칙 |
| --- | --- |
| 이메일 | 앞뒤 공백 제거, 소문자로 저장. 형식이 틀리면 `invalid_email` |
| 닉네임 | 2~12자, 한글·영문·숫자만. 대소문자 구분 없이 하나만. 예약어(admin, 운영자 등) 불가 |
| 비밀번호 | 8자 이상, 영문·숫자 포함 (화면에서 검사). **저장·확인은 Firebase**가 해요. 서버에서도 강제하려면 Firebase 콘솔 → Authentication → 설정 → 비밀번호 정책을 켜요 |
| 약관 | 필수 약관 동의가 없으면 `terms_required` |
| 이미 가입된 이메일 | 막지 않고 로그인 화면으로 안내 (`exists`, Firebase의 `auth/email-already-in-use`도 같은 안내) |
| 요청 제한 | IP당 1분: `check-email` 20회, `check-nickname` 40회, `signup` 10회 (`rate_limited`). 로그인 시도 제한은 Firebase가 해요 |
| 로그 | 요청 본문·토큰을 로그에 남기지 않음 (경로·상태만) |

## 파일

| 파일 | 내용 |
| --- | --- |
| `config.js` | 위 규칙 값 |
| `firebase.js` | Firebase ID 토큰 확인: RS256 서명(구글 공개 인증서, 캐시), `aud`=프로젝트 ID, `iss`, `exp`·`iat`·`auth_time`, `sub` |
| `schema.js` | `users`(firebase_uid·email·nickname·marketing·약관 동의 시각), `withdrawn_members` + 시연용 탈퇴 기록(`rejoin@siempre.test`, `SEED_DEMO=0`이면 안 넣음) |
| `validate.js` | 입력 검증 (저장할 형태로 정리) |
| `service.js` | 이메일·닉네임 확인, 회원 정보 만들기 |
| `routes.js` | API 등록, `currentUser`·`requireUser` 제공 |
| `demo.js` | 시연 모드 관리자 계정·토큰 |
| `test/auth.test.js`, `test/demo.test.js` | 테스트용 RSA 키로 토큰을 만들어 서명 확인까지 시험, 시연 모드 켜짐/꺼짐·위조·만료 (`cd backend && npm test`) |

환경 변수: `FIREBASE_PROJECT_ID` (웹 설정의 `projectId`). 없으면 토큰이 필요한 API는 503 `auth_not_configured`.

## 다루는 테이블

`users`, `withdrawn_members` (소유표: [shared/README.md](../shared/README.md) 4장). `sessions`는 Firebase가 로그인 상태를 맡아서 쓰지 않아요.

## 다른 파트에 주는 것

- `await ctx.currentUser(request)` → 회원 `{ id, email, nickname }` 또는 `null`
- `await ctx.requireUser(request)` → 회원, 없으면 401 `login_required`
- Firebase 토큰 확인이 들어가서 **async**예요. 화면은 모든 로그인 필요 요청에 `Authorization: Bearer <Firebase ID 토큰>`을 붙여요.

## 오류 코드

`invalid_email`, `invalid_nickname`, `exists`, `nickname_taken`, `terms_required`, `login_required`, `profile_missing`, `rate_limited`, `auth_not_configured`, `not_found`(시연 모드 꺼짐) (+ 공통 `invalid_body`)

## 끝났는지 확인

- [x] 새 이메일 가입 → 로그인 → `/api/auth/me`에 닉네임이 나온다 (자동 검사: 가짜 키로 만든 토큰)
- [x] 같은 이메일로 다시 가입하면 `exists`
- [x] 토큰이 없거나 틀리면(만료·다른 프로젝트·위조 서명) 401 `login_required`
- [x] DB에 비밀번호가 없다 (Firebase가 보관)
- [ ] 실제 Firebase 프로젝트로 가입 → 로그인 → 로그아웃 (화면에서 사람이 확인)

## 바뀐 점 (이전 계약 → 지금)

| 이전 | 지금 |
| --- | --- |
| `signup { email, password, nickname, agreeTerms, marketing? }` → 201 `{ ok: true }` | Firebase로 계정을 만든 뒤 `signup { nickname, agreeTerms, marketing? }` + 토큰 → 201 `{ user }` |
| `login`, `logout` + 세션 쿠키 | 화면에서 Firebase로 (백엔드 주소 없음) |
| `weak_password`, `invalid_credentials` | Firebase 오류 코드로 화면에서 안내 |
| `currentUser`·`requireUser`는 동기 함수 | async (Firebase 토큰 확인) |
| 테이블 `sessions` | 쓰지 않음 |

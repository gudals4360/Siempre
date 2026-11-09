# 발표·시연용 배포 안내

서버 **한 개**가 화면(`frontend/dist`)과 API(`/api`)를 같은 주소로 내보냅니다. 화면과 API 주소가 같아서 CORS·프록시 설정이 필요 없습니다.
실제 서비스 오픈용이 아닙니다 (아래 "공개되는 것" 참고).

## 1. 내 컴퓨터에서 먼저 확인

```bash
cd frontend && npm ci && npm run build      # 화면 빌드 → frontend/dist
cd ../backend && DEMO_LOGIN=1 npm run start:demo   # http://localhost:8787
```

Windows PowerShell이면 `$env:DEMO_LOGIN=1; npm run start:demo`. 8787 주소로 로그인 화면이 열리고, "시연용 관리자로 로그인"이 보이면 됩니다.

## 2. 환경변수

| 이름 | 값 | 설명 |
| --- | --- | --- |
| `PORT` | `8787` | 호스팅이 정해 주면 그 값 (대부분 자동) |
| `DATABASE_URL` | `/data/siempre.db` | SQLite 파일. **재시작해도 남는 디스크(볼륨)** 경로여야 함 |
| `DEMO_LOGIN` | `1` 또는 비움 | 1이면 Firebase 없이 "시연용 관리자로 로그인" 버튼이 켜짐 |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | Firebase 로그인을 쓸 때만 |
| `TRUST_PROXY` | `1` | 호스팅 프록시 뒤라면 켬 (요청 제한이 사용자별 IP로 동작) |
| `STATIC_DIR` | 기본 `frontend/dist` | 화면 폴더를 바꿀 때만 |

로그인 방식은 둘 중 하나를 고릅니다.
- **시연 로그인(가장 쉬움)**: `DEMO_LOGIN=1`만 켜면 됩니다. Firebase 설정이 필요 없습니다. 주소를 아는 누구나 관리자로 들어갈 수 있으니 **발표가 끝나면 끄거나 서버를 내리세요.**
- **Firebase 로그인**: 화면을 빌드할 때 `VITE_FIREBASE_*` 6개 값이 필요하고(값이 화면 안에 들어가므로 바뀌면 다시 빌드), 서버에 `FIREBASE_PROJECT_ID`를 넣고, Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 배포 주소를 추가해야 합니다.

## 3. 올리는 방법 (하나 고르기)

**A. Docker를 지원하는 호스팅 (Render, Railway, Fly.io 등)** — 저장소 루트의 `Dockerfile`을 그대로 씁니다.
1. 저장소를 연결하고 서비스 종류를 Docker(웹 서비스)로 만듭니다.
2. 영구 디스크(볼륨)를 `/data`에 붙입니다. 안 붙이면 재시작할 때 회원 정보가 사라집니다.
3. 환경변수 `DEMO_LOGIN=1`을 넣습니다. (Firebase를 쓰면 `FIREBASE_PROJECT_ID`와 빌드 인자 `VITE_FIREBASE_*`도)
4. 인스턴스는 **1개만** 돌립니다 (SQLite 파일 하나를 쓰기 때문).

**B. Docker 없이 Node 서버를 직접 (VPS 등)** — Node 22.13 이상.
1. 위 "1. 내 컴퓨터에서 먼저 확인"의 빌드까지 한 뒤 `backend`에서 `npm run start:demo`로 실행합니다.
2. 앞에 nginx나 Caddy를 두어 HTTPS를 붙이고 8787로 넘깁니다. 프로세스는 pm2나 systemd로 유지합니다.

**C. 발표 당일 임시 공개** — 내 컴퓨터에서 1번대로 실행하고 터널 도구(cloudflared, ngrok 등)로 8787을 공개합니다. 컴퓨터가 켜져 있는 동안만 열립니다.

## 4. 올린 뒤 확인

- 주소를 열면 구독 화면이 보이고, "시작하기"를 누르면 로그인 화면으로 갑니다.
- `/api/auth/config`가 `{"demoLogin":true,"firebase":false}`(시연 로그인) 또는 `firebase:true`로 나옵니다.
- 로그인 → 서비스 화면 → 결제 데모까지 한 번 끝까지 눌러 봅니다.
- 서버를 재시작해도 가입한 계정이 남는지 확인합니다 (영구 디스크 확인).

## 공개되는 것

- 대화·크레딧·구독 백엔드는 아직 없습니다. 서비스 화면의 답변, 크레딧, 결제는 **화면 안의 가짜 데이터**입니다.
- 서비스 화면 맨 위에 검은 **시연 바**가 있습니다.
- "AI 연결"(Groq)은 방문자가 자기 API 키를 브라우저에 직접 넣어야 동작합니다. 키는 서버로 오지 않습니다.
- 실제 결제를 받거나 개인정보를 모으려면 결제 연동, 개인정보 처리방침, 환불 규정이 먼저 필요합니다.

## 검증 상태

- 확인함: 정적 파일·SPA 주소·`/api` 분기·경로 이탈 차단 테스트(`backend/deploy/test`), 빌드한 화면을 한 서버로 띄워 보기.
- **확인 못 함**: `Dockerfile`로 이미지를 실제로 빌드해 보는 것 (작업 PC에 Docker가 없음). 처음 올릴 때 빌드 로그를 한 번 봐 주세요.

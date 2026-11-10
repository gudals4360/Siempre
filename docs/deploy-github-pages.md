# GitHub Pages로 배포하기

화면(`frontend/`)을 GitHub 서버에서 빌드해 `https://<계정>.github.io/<저장소 이름>/`에 올립니다. 무료이고 항상 켜져 있으며 카드가 필요 없습니다.
이 저장소 주소는 `https://gudals4360.github.io/Siempre/`입니다. (워크플로: `.github/workflows/pages.yml`)

## 켜는 방법 (저장소 소유자가 한 번만)

1. GitHub 저장소 → **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿉니다.
   지금은 `main`의 맨 위 폴더를 Jekyll로 그리는 방식(README 페이지)이라, 바꾸면 그 페이지는 우리 앱으로 대체됩니다.
2. `main`에 이 변경이 합쳐지면 자동으로 빌드·배포됩니다. 바로 해 보려면 **Actions 탭 → Pages → Run workflow**.
3. 배포가 끝나면 Actions 실행 화면의 `deploy` 단계에 주소가 나옵니다.

다른 브랜치에 올리면 **빌드가 되는지만** 확인하고 배포는 하지 않습니다 (Actions 탭에서 확인).

## 선택: Firebase 로그인 값 넣기

로그인을 Firebase로 쓸 때만 필요합니다. **Settings → Secrets and variables → Actions → Variables**에 아래 6개를 추가하면 빌드할 때 화면에 들어갑니다. (웹 설정값은 화면에 그대로 보이는 공개값이라 Variables에 둬도 됩니다.)

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 `gudals4360.github.io`를 추가해야 로그인이 됩니다.

## 지금 되는 것 / 안 되는 것

| | |
| --- | --- |
| 되는 것 | 구독 선택, 결제 데모, 대화·크레딧 화면(모두 브라우저 안의 가짜 데이터), 방문 통계 |
| 안 되는 것 | **회원가입·로그인·시연용 관리자 로그인.** 이 앱의 `backend/`(서버)가 Pages에는 없어서, 가입 정보 저장과 회원 확인이 안 됩니다 |

"이 구성으로 시작하기"를 누르면 로그인 화면으로 가는데 거기서 진행되지 않습니다. 로그인 없이 체험하게 하려면 별도로 체험 모드가 필요합니다.

## 주소와 새로고침

- 사이트가 `/Siempre/` 아래에 놓이므로 빌드할 때 `VITE_BASE=/Siempre/`가 들어갑니다(워크플로가 저장소 이름으로 자동 설정). 저장소 이름이 `<계정>.github.io`이면 맨 위 주소(`/`)로 열립니다.
- Pages에는 서버가 없어서 `/Siempre/login` 같은 주소를 바로 열면 404가 납니다. 그래서 빌드 결과의 404 화면을 앱(`index.html`)으로 바꿔 두었습니다. 앱이 이어받아 화면을 그리며, 주소창에는 정상으로 보이지만 브라우저는 404 상태로 받습니다.

## 한도와 주의

- 사이트 1GB, 대역폭 월 100GB(소프트 한도), 배포 10분 제한.
- GitHub Pages는 **카드번호·비밀번호 같은 민감 정보를 보내는 용도로 쓰면 안 됩니다.** 결제 데모의 카드 입력칸은 공개 체험판에서는 "입력하지 마세요" 안내를 넣거나 빼는 것을 권합니다.
- 공개 저장소의 Pages는 누구나 열 수 있습니다.

## 내 계정에서 따로 올리려면

저장소를 내 계정으로 복사(Fork)하고 위 "켜는 방법"을 그 저장소에서 하면 됩니다. 주소는 `https://<내 계정>.github.io/Siempre/`가 됩니다.

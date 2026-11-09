# 날짜별 변경 의도 기록

큰 작업마다 "왜 하는지(intent) → 무엇을 만족해야 하는지(spec) → 어떻게 하고 무엇을 확인했는지(plan)"를 남겨요.

| 폴더 | 날짜 | 내용 | 상태 |
| --- | --- | --- | --- |
| [20261109-signup-flow](20261109-signup-flow/intent.md) | 2026-11-09 | 회원가입·로그인 화면(`frontend/`)과 auth API(`backend/auth`) | PR #9 병합 |
| [20261109-prototype-auth](20261109-prototype-auth/intent.md) | 2026-11-09 | 로그인 ↔ 권희수 님 서비스 화면 연결 | PR #13 병합 |
| [20261109-guest-subscribe-first](20261109-guest-subscribe-first/intent.md) | 2026-11-09 | MVP: 구독 화면부터 보여 주고 시작할 때 로그인 + 시연용 관리자 계정(Firebase 없이) | 로컬 구현·검증 / PR 미승인 |

## 작성 규칙

- 한국 시간 작업 시작일로 폴더를 만들어요: 범위가 크면 `YYYYMMDD/`, 작으면 `YYYYMMDD-짧은-주제/`.
- 폴더마다 `intent.md`(의도), `spec.md`(수용 기준), `plan.md`(실행·검증 기록)를 둬요.
- 실제 Git·코드·검사 결과만 완료로 적어요. 사람의 승인·배포·운영은 증거 없이 적지 않아요.
- 담당자는 실제로 정해지기 전까지 "미배정"으로 둬요.
- 기획과 다른 결정은 [`PRD.md`](../PRD.md) 9장 "열린 질문"에 적어요.

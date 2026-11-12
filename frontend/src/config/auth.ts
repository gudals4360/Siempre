// 회원가입·로그인에서 바뀔 수 있는 값과 문구.
// 규칙은 backend/auth/config.js와 같은 값을 유지한다 (근거: backend/auth/README.md, PRD 7-0).

export const SIGNUP_STEPS = [
  { id: 'account', path: '/signup', label: '계정 정보' },
  { id: 'terms', path: '/signup/terms', label: '약관 동의' },
  { id: 'done', path: '/signup/done', label: '가입 완료' },
] as const;
export type SignupStepId = (typeof SIGNUP_STEPS)[number]['id'];

/** 왼쪽 소개 카드 */
export const BENEFITS = [
  { title: '쓸 AI만 골라 담기', desc: '안 쓰는 AI엔 0원' },
  { title: '크레딧 지갑 하나로', desc: '담은 AI 사용량을 한곳에서 확인' },
  { title: '모델은 자동으로', desc: '요청에 맞는 AI가 답해요' },
];

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,12}$/;
export const NICKNAME_HINT = '한글·영문·숫자 2~12자';
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;
export const PASSWORD_RULE_LABELS = { length: `${PASSWORD_MIN}자 이상`, letter: '영문', number: '숫자' } as const;

/** 필수 약관 (모두 체크해야 agreeTerms: true). 문구는 임시 값이며 법무 검토 후 확정한다. */
export const REQUIRED_TERMS = [
  { key: 'tos', label: '서비스 이용약관', detail: '구독 구성, 크레딧 충전·차감, 환불 기준 같은 서비스 이용 조건이에요. (임시 문구)' },
  { key: 'privacy', label: '개인정보 수집·이용', detail: '이메일·닉네임을 회원 확인과 서비스 안내에 쓰고, 탈퇴 후 관계 법령에 따른 기간이 지나면 지워요. (임시 문구)' },
  { key: 'age14', label: '만 14세 이상이에요' },
  { key: 'aiTransfer', label: '외부 AI 제공사로 대화 전달', detail: '알맞은 답을 위해 입력한 대화를 담은 AI 제공사로 보내요. (임시 문구)' },
] as const;
export type RequiredTermKey = (typeof REQUIRED_TERMS)[number]['key'];

/** 선택 약관 (marketing) */
export const MARKETING_LABEL = '할인·새 AI 입점 소식 받기';

/** 로그인 후 기본으로 갈 화면 (React 라우트). "/"는 아래 서비스 화면으로 넘겨 준다. */
export const HOME_PATH = '/';

/** 로그인한 사람이 쓰는 서비스 화면: 권희수 님의 구독·대화·크레딧 페이지 (React 밖의 별도 HTML) */
export const SERVICE_PAGE = '/siempre-figma-prototype.html';

/** 사이트 주소. 검색엔진에 알리는 대표 주소(canonical)를 만들 때 쓴다. */
export const SITE_URL = 'https://startling-bavarois-ac36bd.netlify.app';

/**
 * 화면별 검색 노출 정보. 핵심 검색어: 로그인 → "Siempre 로그인", 회원가입 → "Siempre 회원가입".
 * 약관·가입 완료 화면은 혼자 들어와서 볼 화면이 아니라 검색 결과에 안 나오게(noindex) 한다.
 */
export const PAGE_META: Record<string, { title: string; description: string; noindex?: boolean }> = {
  '/login': {
    title: 'Siempre 로그인 | AI 통합 구독',
    description:
      'Siempre 로그인. 가입한 이메일과 비밀번호로 로그인하면 담아 둔 AI와 이번 주 남은 크레딧을 바로 확인하고 대화를 이어갈 수 있어요. 크레딧은 매주 새로 채워져요. 아직 계정이 없다면 이메일과 닉네임만으로 1분 만에 회원가입하세요.',
  },
  '/signup': {
    title: 'Siempre 회원가입 | 쓸 AI만 골라 담는 구독',
    description:
      'Siempre 회원가입. 이메일과 닉네임만 정하면 1분 만에 가입이 끝나요. 가입하면 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI만 골라 담고, 한 대화창에서 대본·번역·음성·이미지 작업을 이어갈 수 있어요. 무료 사용량으로 먼저 써 보세요.',
  },
  '/signup/terms': {
    title: 'Siempre 약관 동의',
    description:
      'Siempre 회원가입 약관 동의 단계예요. 서비스 이용약관, 개인정보 수집·이용, 만 14세 이상 확인, 외부 AI 제공사로 대화 전달에 동의하면 가입이 끝나요. 할인·새 AI 입점 소식 받기는 선택이에요.',
    noindex: true,
  },
  '/signup/done': {
    title: 'Siempre 가입 완료',
    description:
      'Siempre 가입이 끝났어요. 이제 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI를 골라 나만의 구독을 만들고, 한 대화창에서 써 보세요.',
    noindex: true,
  },
};

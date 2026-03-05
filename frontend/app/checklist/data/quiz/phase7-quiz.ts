import type { QuizQuestion } from './types'

export const phase7Quiz: QuizQuestion[] = [
  // ── Task 7-1: CI/BI 디자인 ──
  {
    id: 'q-7-1-a',
    taskId: '7-1',
    type: 'multiple_choice',
    question: '의원 로고 디자인을 합리적인 가격에 의뢰할 수 있는 플랫폼은?',
    choices: [
      { id: 'a', text: '무료 로고 자동생성 사이트' },
      { id: 'b', text: '크몽, 숨고 등 프리랜서 플랫폼' },
      { id: 'c', text: '대형 광고대행사' },
      { id: 'd', text: '해외 디자인 경매 사이트' },
    ],
    correctId: 'b',
    explanation:
      '크몽, 숨고 등 프리랜서 플랫폼에서 합리적 가격에 전문 디자인을 받을 수 있습니다. 무료 로고 제작 사이트는 저작권 문제가 있을 수 있으므로 주의해야 합니다. 간판, 명함, 모바일 모두에서 잘 보이는 심플한 로고가 좋습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-7-1-b',
    taskId: '7-1',
    type: 'ox',
    question:
      '무료 로고 제작 사이트에서 만든 로고를 의원 간판과 인쇄물에 그대로 사용해도 저작권 문제가 없다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '무료 로고 제작 사이트에서 만든 로고는 저작권 문제가 있을 수 있습니다. 상업적 사용 시 라이선스 조건을 반드시 확인해야 하며, 의원의 브랜드 아이덴티티를 위해서는 전문 디자이너에게 의뢰하여 독점적 저작권을 확보하는 것이 안전합니다.',
    difficulty: 'medium',
  },

  // ── Task 7-2: 홈페이지/블로그 ──
  {
    id: 'q-7-2-a',
    taskId: '7-2',
    type: 'multiple_choice',
    question: '개원 마케팅에서 가장 필수적인 온라인 등록은?',
    choices: [
      { id: 'a', text: '페이스북 페이지 개설' },
      { id: 'b', text: '네이버 스마트플레이스 등록' },
      { id: 'c', text: '트위터 계정 개설' },
      { id: 'd', text: '링크드인 프로필 등록' },
    ],
    correctId: 'b',
    explanation:
      '네이버 플레이스 등록은 개원 필수 중의 필수입니다. 대부분의 환자가 네이버에서 의원을 검색하므로, 정확한 정보(진료시간, 위치, 전화번호)를 등록해야 합니다. 블로그는 개원 1~2개월 전부터 건강 정보를 포스팅하는 것이 좋습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-7-2-b',
    taskId: '7-2',
    type: 'scenario',
    question:
      'G 원장은 블로그에 "치료 전후 비교 사진"과 "우리 의원 치료 성공률 99%"라는 문구를 게시했습니다. 이 행위의 문제점은?',
    choices: [
      { id: 'a', text: '사진 화질이 낮아서 효과가 적다' },
      { id: 'b', text: '치료 전후 사진과 과장 문구는 의료법 위반이다' },
      { id: 'c', text: '블로그보다 인스타그램이 효과적이다' },
      { id: 'd', text: '환자 동의를 받으면 문제없다' },
    ],
    correctId: 'b',
    explanation:
      '치료 전후 사진과 과장 문구는 의료법 위반입니다. 의료광고 사전심의 대상 여부를 확인해야 하며, 객관적이고 사실에 기반한 정보만 게시해야 합니다. 홈페이지는 모바일 반응형 필수이며, 카카오맵/구글맵에도 정보를 등록하세요.',
    difficulty: 'medium',
  },

  // ── Task 7-3: SNS 채널 개설 ──
  {
    id: 'q-7-3-a',
    taskId: '7-3',
    type: 'multiple_choice',
    question: '의원 SNS 마케팅에서 인스타그램에 가장 효과적인 콘텐츠 유형은?',
    choices: [
      { id: 'a', text: '의학 논문 요약 게시' },
      { id: 'b', text: '의원 인테리어, 일상, 건강 팁 위주의 콘텐츠' },
      { id: 'c', text: '타 의원 비교 리뷰' },
      { id: 'd', text: '장비 가격표 공개' },
    ],
    correctId: 'b',
    explanation:
      '인스타그램은 의원 인테리어, 일상, 건강 팁 위주의 시각적 콘텐츠가 효과적입니다. 카카오톡 채널은 예약/문의 채널로 활용도가 높으며, 개원 전부터 콘텐츠를 쌓아두면 개원 시 신뢰도가 올라갑니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-7-3-b',
    taskId: '7-3',
    type: 'ox',
    question:
      'SNS에 환자 사례를 게시할 때 환자 본인의 동의를 받았다면 의료광고 규제를 받지 않는다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '환자 동의를 받았더라도 SNS 의료광고는 의료법 규제를 받습니다. 환자 사진/사례 게시 시 동의는 기본이지만, 게시 내용 자체가 의료광고 심의 기준에 부합해야 하며, 과장이나 허위 내용은 동의 여부와 관계없이 위법합니다.',
    difficulty: 'hard',
  },

  // ── Task 7-4: 지역 마케팅 ──
  {
    id: 'q-7-4-a',
    taskId: '7-4',
    type: 'multiple_choice',
    question: '아파트 단지 대상 지역 마케팅에서 가장 효과적인 방법은?',
    choices: [
      { id: 'a', text: '우편함에 전단지를 넣는다' },
      { id: 'b', text: '엘리베이터 광고를 설치한다' },
      { id: 'c', text: '건물 옥상에 현수막을 설치한다' },
      { id: 'd', text: '자동차 앞유리에 전단지를 놓는다' },
    ],
    correctId: 'b',
    explanation:
      '아파트 우편함 전단지보다 엘리베이터 광고가 훨씬 효과적입니다. 엘리베이터에서는 자연스럽게 광고를 보게 되지만, 우편함 전단지는 대부분 버려집니다. 인근 약국과 좋은 관계를 유지하면 환자 소개로 이어지는 효과도 큽니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-7-4-b',
    taskId: '7-4',
    type: 'ox',
    question:
      '현수막은 구청 허가 없이 자유롭게 설치할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '현수막 설치는 관할 구청의 허가가 필요합니다. 무허가 설치 시 과태료가 부과되며, 철거 비용도 부담해야 합니다. 또한 과도한 무료 진료 이벤트는 의료법상 제한될 수 있으므로 주의해야 합니다.',
    difficulty: 'easy',
  },

  // ── Task 7-5: 온라인 광고 셋업 ──
  {
    id: 'q-7-5-a',
    taskId: '7-5',
    type: 'scenario',
    question:
      'H 원장은 개원 초기 온라인 광고 예산을 월 300만 원으로 설정하고, 전국 단위 키워드("내과", "감기 치료")에 집중 투자했습니다. 이 전략의 문제점은?',
    choices: [
      { id: 'a', text: '예산이 너무 적다' },
      { id: 'b', text: '전국 키워드는 클릭 단가가 높아 예산이 빠르게 소진되고 전환율이 낮다' },
      { id: 'c', text: '네이버 광고보다 구글 광고가 효과적이다' },
      { id: 'd', text: '검색 광고는 의원에 효과가 없다' },
    ],
    correctId: 'b',
    explanation:
      '초기에는 네이버 검색광고에 집중하는 것이 효율적이며, "OO동 내과", "OO역 피부과" 등 지역 키워드가 전환율이 높습니다. 전국 단위 키워드는 클릭 단가가 높아 예산이 빠르게 소진됩니다. 초기 월 50~100만 원 규모로 시작하여 주간 단위로 성과를 모니터링하세요.',
    difficulty: 'hard',
  },
  {
    id: 'q-7-5-b',
    taskId: '7-5',
    type: 'multiple_choice',
    question: '개원 초기 온라인 광고 예산으로 권장되는 월 금액은?',
    choices: [
      { id: 'a', text: '10~30만 원' },
      { id: 'b', text: '50~100만 원' },
      { id: 'c', text: '200~300만 원' },
      { id: 'd', text: '500만 원 이상' },
    ],
    correctId: 'b',
    explanation:
      '개원 초기에는 월 50~100만 원 규모의 네이버 검색광고가 권장됩니다. 지역명 + 진료과 조합의 키워드를 선정하고, 주간 단위로 광고 성과를 모니터링하여 예산을 최적화해야 합니다. 광고 문구도 의료광고 심의 대상이 될 수 있으니 주의하세요.',
    difficulty: 'easy',
  },

  // ── Task 7-6: 사전 예약 시스템 ──
  {
    id: 'q-7-6-a',
    taskId: '7-6',
    type: 'multiple_choice',
    question: '예약 부도율을 줄이기 위한 가장 효과적인 방법은?',
    choices: [
      { id: 'a', text: '예약금을 받는다' },
      { id: 'b', text: '전일 알림 메시지(SMS/카톡)를 발송한다' },
      { id: 'c', text: '예약 취소 시 위약금을 부과한다' },
      { id: 'd', text: '예약 없이 당일 접수만 운영한다' },
    ],
    correctId: 'b',
    explanation:
      '예약 부도율을 줄이려면 전일 알림 메시지를 보내는 것이 가장 효과적입니다. 네이버 예약은 무료이며 환자 유입에 매우 효과적이고, 예약 → 알림 → 내원 → 후속 안내의 전체 흐름을 설계해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-7-6-b',
    taskId: '7-6',
    type: 'ox',
    question:
      '예약 시스템 도입 시 EMR과의 연동 여부는 중요하지 않다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '예약 시스템이 EMR과 연동되지 않으면 수동으로 예약 정보를 입력해야 하므로 업무 효율이 크게 떨어집니다. 또한 예약 시 환자 개인정보를 수집하므로 개인정보 수집/이용 동의를 반드시 받아야 합니다.',
    difficulty: 'medium',
  },
]

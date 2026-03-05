import type { QuizQuestion } from './types'

export const phase2Quiz: QuizQuestion[] = [
  // ── Task 2-1: 상권 분석 ──
  {
    id: 'q-2-1-a',
    taskId: '2-1',
    type: 'scenario',
    question:
      'C 원장은 하루 유동인구 5만 명인 역세권 상가를 발견했습니다. 그런데 유동인구 대부분이 20대 직장인이고, C 원장의 진료과는 소아청소년과입니다. 이 입지를 어떻게 평가해야 할까요?',
    choices: [
      { id: 'a', text: '유동인구가 충분하므로 좋은 입지이다' },
      { id: 'b', text: '역세권은 모든 진료과에 유리하므로 선택해야 한다' },
      { id: 'c', text: '유동인구가 많아도 타깃 환자군과 불일치하므로 부적합하다' },
      { id: 'd', text: '20대 직장인도 소아과를 방문할 수 있으므로 괜찮다' },
    ],
    correctId: 'c',
    explanation:
      '유동인구가 많아도 타깃 환자군과 불일치하면 의미가 없습니다. 소아과는 아파트 밀집 지역(저녁/주말 환자가 많은 곳)이 더 적합합니다. 평일/주말 2회 이상 현장 방문하여 실제 인구 특성을 확인해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-2-1-b',
    taskId: '2-1',
    type: 'multiple_choice',
    question:
      '상권 분석 시 현장 방문의 권장 빈도와 방법은?',
    choices: [
      { id: 'a', text: '1회 방문으로 충분, 온라인 데이터가 더 중요' },
      { id: 'b', text: '평일/주말 최소 2회 이상, 시간대별 유동인구 직접 확인' },
      { id: 'c', text: '부동산 중개사의 설명만으로 판단' },
      { id: 'd', text: '상가 분양 광고의 유동인구 수치로 판단' },
    ],
    correctId: 'b',
    explanation:
      '평일/주말 최소 2회 이상 방문하여 시간대별 실제 유동인구를 직접 확인해야 합니다. 상가 분양 광고의 유동인구 수치는 과장된 경우가 많으므로 직접 확인이 필수입니다.',
    difficulty: 'easy',
  },

  // ── Task 2-2: 후보지 리스트업 ──
  {
    id: 'q-2-2-a',
    taskId: '2-2',
    type: 'multiple_choice',
    question:
      '2~3층 매물을 검토할 때 가장 중요하게 확인해야 할 요소는?',
    choices: [
      { id: 'a', text: '건물의 준공 연도' },
      { id: 'b', text: '월 관리비 금액' },
      { id: 'c', text: '간판 가시성과 엘리베이터 유무' },
      { id: 'd', text: '주차장 넓이' },
    ],
    correctId: 'c',
    explanation:
      '1층이 가장 좋지만 임대료가 비쌉니다. 2~3층을 선택할 경우 도로에서 간판이 잘 보이는지가 관건이며, 엘리베이터가 없으면 노인/장애인 환자가 방문을 꺼릴 수 있습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-2-2-b',
    taskId: '2-2',
    type: 'ox',
    question:
      '같은 건물에 동일 진료과가 이미 있어도 의료법상 문제없이 개설할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '같은 건물에 동일 진료과가 있으면 의료법상 문제가 될 수 있습니다. 후보지 선정 시 의료기관 개설 가능 여부(용도, 층수)를 반드시 사전에 확인해야 합니다.',
    difficulty: 'medium',
  },

  // ── Task 2-3: 건물 실사 ──
  {
    id: 'q-2-3-a',
    taskId: '2-3',
    type: 'multiple_choice',
    question:
      '건물 실사 시 전기 용량이 부족할 경우 예상되는 추가 비용은?',
    choices: [
      { id: 'a', text: '수만 원 수준' },
      { id: 'b', text: '수십만 원 수준' },
      { id: 'c', text: '수백만 원 수준' },
      { id: 'd', text: '수천만 원 수준' },
    ],
    correctId: 'c',
    explanation:
      '전기 용량이 부족하면 증설 비용이 수백만 원 추가됩니다. 건물 실사 시 전기 용량, 급/배수, 환기 시스템을 사전에 점검하여 예상치 못한 비용을 방지해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-2-3-b',
    taskId: '2-3',
    type: 'scenario',
    question:
      'D 원장이 관리비 월 50만 원이라는 건물주의 말만 듣고 계약을 진행하려 합니다. 반드시 추가로 확인해야 할 사항은?',
    choices: [
      { id: 'a', text: '관리비에 인터넷 비용이 포함되는지' },
      { id: 'b', text: '관리비에 냉난방비가 포함되는지 여부' },
      { id: 'c', text: '관리비 납부 기한' },
      { id: 'd', text: '관리비 할인 가능 여부' },
    ],
    correctId: 'b',
    explanation:
      '관리비에 냉난방비가 포함되는지 반드시 확인해야 합니다. 포함되지 않는 경우 여름/겨울철 실제 관리비가 예상보다 크게 증가할 수 있습니다. 또한 구축 건물은 석면, 누수 등의 하자 문제도 전문가와 함께 점검해야 합니다.',
    difficulty: 'medium',
  },

  // ── Task 2-4: 임대차 계약 ──
  {
    id: 'q-2-4-a',
    taskId: '2-4',
    type: 'multiple_choice',
    question:
      '임대차 계약 시 특약으로 반드시 명시해야 할 사항은?',
    choices: [
      { id: 'a', text: '인근 맛집 추천 목록' },
      { id: 'b', text: '임대료 인상률 상한 (연 5% 이내)' },
      { id: 'c', text: '건물 외관 색상 변경 권한' },
      { id: 'd', text: '주차장 전용 사용 권한' },
    ],
    correctId: 'b',
    explanation:
      '임대료 인상률 상한(연 5% 이내)을 특약으로 넣어야 합니다. 구두 약속은 법적 효력이 없으므로 프리렌트, 인테리어 원상복구 면제 등 모든 합의 사항은 반드시 특약에 기재해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-2-4-b',
    taskId: '2-4',
    type: 'ox',
    question:
      '건물주와 구두로 합의한 사항은 법적으로 동일한 효력이 있으므로 별도 특약 기재가 필요 없다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '구두 약속은 법적 효력이 없습니다. 프리렌트, 인테리어 원상복구 면제, 임대료 인상률 상한 등 모든 합의 사항은 반드시 계약서 특약에 기재해야 향후 분쟁을 방지할 수 있습니다.',
    difficulty: 'easy',
  },

  // ── Task 2-5: 법률 검토 ──
  {
    id: 'q-2-5-a',
    taskId: '2-5',
    type: 'multiple_choice',
    question:
      '등기부등본상 근저당 설정 금액이 건물 시세의 몇 %를 넘으면 위험한가?',
    choices: [
      { id: 'a', text: '30%' },
      { id: 'b', text: '50%' },
      { id: 'c', text: '70%' },
      { id: 'd', text: '90%' },
    ],
    correctId: 'c',
    explanation:
      '근저당 설정 금액이 건물 시세의 70%를 넘으면 위험합니다. 이 경우 건물이 경매로 넘어가면 보증금을 돌려받지 못할 수 있으므로, 계약 전 반드시 등기부등본을 확인해야 합니다.',
    difficulty: 'hard',
  },
  {
    id: 'q-2-5-b',
    taskId: '2-5',
    type: 'scenario',
    question:
      'E 원장은 1주일 전에 받은 등기부등본으로 계약 당일 서명하려고 합니다. 이 행동의 위험성은?',
    choices: [
      { id: 'a', text: '등기부등본 발급 수수료를 절약할 수 있으므로 합리적이다' },
      { id: 'b', text: '1주일 사이 근저당/가압류가 추가되었을 수 있으므로 계약 당일 재발급해야 한다' },
      { id: 'c', text: '등기부등본은 1년간 유효하므로 문제없다' },
      { id: 'd', text: '건축물대장만 재발급하면 된다' },
    ],
    correctId: 'b',
    explanation:
      '등기부등본은 계약 당일 기준으로 다시 한번 발급받아 확인해야 합니다. 단 며칠 사이에도 근저당이나 가압류가 추가될 수 있으며, 법률 검토 비용(10~20만 원)은 향후 분쟁 방지를 위해 반드시 투자해야 합니다.',
    difficulty: 'hard',
  },
]

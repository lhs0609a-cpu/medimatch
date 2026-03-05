import type { QuizQuestion } from './types'

export const phase6Quiz: QuizQuestion[] = [
  // ── Task 6-1: 직원 채용 계획 ──
  {
    id: 'q-6-1-a',
    taskId: '6-1',
    type: 'multiple_choice',
    question: '소규모 의원 개원 시 인건비가 매출 대비 차지해야 하는 적정 비율은?',
    choices: [
      { id: 'a', text: '10~15%' },
      { id: 'b', text: '15~25%' },
      { id: 'c', text: '25~35%' },
      { id: 'd', text: '40~50%' },
    ],
    correctId: 'c',
    explanation:
      '인건비 총액은 매출 대비 25~35%가 적정합니다. 인건비는 고정비의 가장 큰 비중을 차지하므로 신중히 결정해야 하며, 최저임금, 주휴수당, 퇴직금을 반드시 포함하여 계산해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-6-1-b',
    taskId: '6-1',
    type: 'scenario',
    question:
      'E 원장은 개원과 동시에 간호조무사 3명, 원무 2명, 물리치료사 1명을 채용하려고 합니다. 소규모 내과 의원인 경우 이 인력 계획에 대한 조언으로 가장 적절한 것은?',
    choices: [
      { id: 'a', text: '더 많이 채용하여 환자 서비스를 극대화해야 한다' },
      { id: 'b', text: '최소 인원(간호조무사 1~2명 + 원무 1명)으로 시작하고 환자 증가에 맞춰 충원한다' },
      { id: 'c', text: '인건비를 아끼기 위해 직원 없이 혼자 운영한다' },
      { id: 'd', text: '파트타임 직원만 채용하여 비용을 최소화한다' },
    ],
    correctId: 'b',
    explanation:
      '소규모 의원의 기본 인력 구성은 간호조무사 1~2명 + 원무 1명입니다. 초기에는 최소 인원으로 시작하고, 환자 증가에 맞춰 충원하는 것이 인건비 부담을 줄이면서도 안정적으로 운영하는 방법입니다.',
    difficulty: 'medium',
  },

  // ── Task 6-2: 채용 공고 게시 ──
  {
    id: 'q-6-2-a',
    taskId: '6-2',
    type: 'ox',
    question:
      '채용공고에 "여성 우대", "30세 이하" 같은 조건을 명시해도 법적 문제가 없다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '채용공고에 성별, 나이 제한을 명시하면 「남녀고용평등법」 및 「고용상 연령차별금지법」 위반으로 법적 문제가 될 수 있습니다. 직무 관련 자격 요건만 기재하고, 급여 범위를 명시하면 오히려 지원율이 높아집니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-6-2-b',
    taskId: '6-2',
    type: 'multiple_choice',
    question: '의원 채용공고 게시 시 지원율을 높이는 가장 효과적인 방법은?',
    choices: [
      { id: 'a', text: '급여를 "면접 후 결정"이라고 적는다' },
      { id: 'b', text: '급여 범위를 명시하고 복리후생을 구체적으로 안내한다' },
      { id: 'c', text: '자격 요건을 최대한 높게 설정한다' },
      { id: 'd', text: '근무 시간을 명시하지 않는다' },
    ],
    correctId: 'b',
    explanation:
      '급여 범위를 명시하면 지원율이 높아집니다. 또한 의원 인근 거주자를 우대하면 출퇴근 이슈를 줄일 수 있으며, 의료 전문 구인사이트(메디잡, 닥터잡 등)와 지역 커뮤니티(맘카페, 지역 밴드)를 동시에 활용하면 효과적입니다.',
    difficulty: 'easy',
  },

  // ── Task 6-3: 면접 및 최종 채용 ──
  {
    id: 'q-6-3-a',
    taskId: '6-3',
    type: 'multiple_choice',
    question: '의원 직원 면접 시 "기술"보다 더 중요하게 평가해야 할 요소는?',
    choices: [
      { id: 'a', text: '학력과 출신 학교' },
      { id: 'b', text: '인성과 서비스 마인드' },
      { id: 'c', text: '자격증 보유 개수' },
      { id: 'd', text: '이전 직장의 규모' },
    ],
    correctId: 'b',
    explanation:
      '의원은 소수 인원이 함께 일하므로 기술보다 인성이 더 중요합니다. 팀워크, 환자 응대 태도, 서비스 마인드를 중점적으로 평가하고, 수습 기간(3개월)을 두어 상호 적응 기간을 가지는 것이 좋습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-6-3-b',
    taskId: '6-3',
    type: 'ox',
    question:
      '면접 시 지원자의 결혼 여부나 출산 계획을 물어보는 것은 합법적이다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '면접 시 결혼, 출산 계획 등 개인정보 관련 질문은 「남녀고용평등법」에 의해 금지되어 있으며, 위반 시 과태료가 부과될 수 있습니다. 직무 역량과 인성 관련 질문에 집중하고, 채용 확정 전 건강검진 결과를 확인하는 것이 적절합니다.',
    difficulty: 'medium',
  },

  // ── Task 6-4: 근로계약서 작성 ──
  {
    id: 'q-6-4-a',
    taskId: '6-4',
    type: 'multiple_choice',
    question: '근로계약서 미작성 시 사용자에게 부과될 수 있는 과태료는?',
    choices: [
      { id: 'a', text: '100만 원 이하' },
      { id: 'b', text: '300만 원 이하' },
      { id: 'c', text: '500만 원 이하' },
      { id: 'd', text: '1,000만 원 이하' },
    ],
    correctId: 'c',
    explanation:
      '근로계약서 미작성 시 과태료 500만 원 이하가 부과됩니다. 표준 근로계약서를 기반으로 급여, 근무시간, 휴일, 수습 기간, 복리후생을 명시하고, 환자 개인정보 보호를 위한 비밀유지 조항도 반드시 포함해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-6-4-b',
    taskId: '6-4',
    type: 'scenario',
    question:
      'F 원장은 근로계약서에 비밀유지 조항을 넣지 않고 직원을 채용했습니다. 이후 퇴사한 직원이 환자 개인정보를 유출했을 때 발생할 수 있는 문제는?',
    choices: [
      { id: 'a', text: '민사 손해배상만 청구 가능하다' },
      { id: 'b', text: '근로계약이 소급 무효가 된다' },
      { id: 'c', text: '환자 개인정보 유출로 원장과 직원 모두 형사 처벌을 받을 수 있다' },
      { id: 'd', text: '보건소에 경고만 받는다' },
    ],
    correctId: 'c',
    explanation:
      '환자 개인정보 유출 시 형사 처벌까지 받을 수 있으므로, 비밀유지 조항은 근로계약서에 필수입니다. 노무사의 법률 검토를 받아 최신 근로기준법에 맞는 계약서를 작성하고, 급여 구성(기본급, 식대, 상여금)도 명확히 기재해야 합니다.',
    difficulty: 'hard',
  },

  // ── Task 6-5: 직원 교육 ──
  {
    id: 'q-6-5-a',
    taskId: '6-5',
    type: 'multiple_choice',
    question: '개원 전 직원 교육에서 법적으로 반드시 포함해야 하는 교육은?',
    choices: [
      { id: 'a', text: '마케팅 및 SNS 운영 교육' },
      { id: 'b', text: '소방 안전 교육 및 감염 관리 교육' },
      { id: 'c', text: '외국어 응대 교육' },
      { id: 'd', text: '재무제표 분석 교육' },
    ],
    correctId: 'b',
    explanation:
      '소방 안전 교육은 법적 의무사항이며, 감염 관리 교육도 의료기관에서 필수적으로 실시해야 합니다. EMR 교육, 친절 응대 교육은 서비스 품질을 위해 중요하지만, 소방 안전과 감염 관리는 법적 요건입니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-6-5-b',
    taskId: '6-5',
    type: 'ox',
    question:
      'EMR 시스템 교육은 유료로 별도 계약해야만 받을 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      'EMR 교육은 업체에서 무료로 제공하는 경우가 많습니다. 개원 전 1주일간 리허설을 통해 실전 감각을 기르고, 매뉴얼을 문서로 만들어두면 향후 신규 직원 교육에도 활용할 수 있습니다. 역할극(롤플레이)도 효과적인 교육 방법입니다.',
    difficulty: 'easy',
  },
]

import type { QuizQuestion } from './types'

export const phase1Quiz: QuizQuestion[] = [
  // ── Task 1-1: 개원 목표/비전 설정 ──
  {
    id: 'q-1-1-a',
    taskId: '1-1',
    type: 'multiple_choice',
    question: '개원 목표 설정 시 가장 먼저 명확히 해야 할 것은?',
    choices: [
      { id: 'a', text: '인테리어 콘셉트와 예산' },
      { id: 'b', text: '진료 철학과 타깃 환자군' },
      { id: 'c', text: '장비 구매 목록과 가격' },
      { id: 'd', text: '직원 채용 인원과 급여' },
    ],
    correctId: 'b',
    explanation:
      '개원 목표 설정의 첫 단계는 본인의 진료 철학을 정리하고, 타깃 환자군(연령, 질환, 지역)을 구체적으로 설정하는 것입니다. 이후 모든 의사결정의 기준이 됩니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-1-1-b',
    taskId: '1-1',
    type: 'ox',
    question:
      '진료과 트렌드를 따라가면 자연스럽게 경쟁 우위를 확보할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '트렌드만 쫓으면 레드오션에 빠질 수 있습니다. 본인만의 차별화 포인트를 3가지 이상 도출하고, 5년 후 비전까지 설정하는 것이 중요합니다.',
    difficulty: 'easy',
  },

  // ── Task 1-2: 진료과/세부전공 결정 ──
  {
    id: 'q-1-2-a',
    taskId: '1-2',
    type: 'multiple_choice',
    question: '진료과 결정 시 확인해야 할 객관적 데이터로 적절하지 않은 것은?',
    choices: [
      { id: 'a', text: '건강보험 청구 통계 (심평원 공개 데이터)' },
      { id: 'b', text: '해당 진료과 개원의 수 5년간 추이' },
      { id: 'c', text: '인스타그램 인기 해시태그 순위' },
      { id: 'd', text: '비급여 진료 비중과 수가 구조' },
    ],
    correctId: 'c',
    explanation:
      'SNS 해시태그는 객관적 시장 분석 데이터가 아닙니다. 심평원 청구 통계, 개원의 수 추이, 비급여 비중 등 공신력 있는 데이터를 기반으로 판단해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-1-2-b',
    taskId: '1-2',
    type: 'ox',
    question:
      '비급여 비중이 높은 진료과일수록 초기 마케팅 비용이 적게 든다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '비급여 비중이 높은 진료과는 환자가 직접 비용을 부담하므로, 환자 유치를 위해 초기 마케팅 비용이 오히려 증가합니다.',
    difficulty: 'medium',
  },

  // ── Task 1-3: 사업타당성 분석 ──
  {
    id: 'q-1-3-a',
    taskId: '1-3',
    type: 'scenario',
    question:
      'A 원장은 경쟁 의원의 일평균 환자수 50명을 그대로 자기 의원 예상치로 적용하여 사업계획서를 작성했습니다. 이 접근의 문제점은?',
    choices: [
      { id: 'a', text: '환자수가 너무 적게 잡혔기 때문' },
      { id: 'b', text: '신규 개원 의원은 기존 의원 수치를 그대로 적용할 수 없기 때문' },
      { id: 'c', text: '비급여 환자를 포함하지 않았기 때문' },
      { id: 'd', text: '주말 환자를 제외했기 때문' },
    ],
    correctId: 'b',
    explanation:
      '경쟁 의원의 평균 환자수를 자기 의원에 그대로 적용하면 안 됩니다. 신규 개원 의원은 인지도가 없어 초기 6개월은 목표의 40~60% 수준이 일반적이며, 보수적 시나리오 기준으로 자금 계획을 세워야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-1-3-b',
    taskId: '1-3',
    type: 'multiple_choice',
    question:
      '사업타당성 분석 시 빠뜨리기 쉬운 비용 항목은?',
    choices: [
      { id: 'a', text: '임대료' },
      { id: 'b', text: '인건비' },
      { id: 'c', text: '의료 장비 감가상각비' },
      { id: 'd', text: '수도 요금' },
    ],
    correctId: 'c',
    explanation:
      '의료 장비 감가상각비는 월 고정비 산출 시 빠뜨리는 경우가 많습니다. 고가 장비일수록 감가상각비가 수익성에 큰 영향을 미칩니다.',
    difficulty: 'medium',
  },

  // ── Task 1-4: 자금 계획 수립 ──
  {
    id: 'q-1-4-a',
    taskId: '1-4',
    type: 'multiple_choice',
    question:
      '개원 자금 계획 수립 시 권장되는 자기자본 비율은?',
    choices: [
      { id: 'a', text: '10% 이상' },
      { id: 'b', text: '20% 이상' },
      { id: 'c', text: '30% 이상' },
      { id: 'd', text: '50% 이상' },
    ],
    correctId: 'c',
    explanation:
      '총 투자비 대비 자기자본 30% 이상이 권장됩니다. 나머지는 의사 전용 대출(일반 대출보다 0.5~1%p 낮은 금리)과 장비 리스/렌탈을 활용하여 조달합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-1-4-b',
    taskId: '1-4',
    type: 'scenario',
    question:
      'B 원장은 대출 한도가 10억까지 가능하다는 말에 최고급 인테리어와 최신 장비를 도입하기로 결정했습니다. 이 판단의 위험성은?',
    choices: [
      { id: 'a', text: '대출 자체가 불가능할 수 있다' },
      { id: 'b', text: '인테리어가 과도하면 환자가 오히려 부담을 느낀다' },
      { id: 'c', text: '월 상환 부담이 커져 운영자금 부족으로 이어질 수 있다' },
      { id: 'd', text: '장비가 최신이면 AS 비용이 더 든다' },
    ],
    correctId: 'c',
    explanation:
      '대출 한도만 보고 과잉 투자하면 월 상환 부담이 커집니다. 또한 인테리어비는 견적보다 10~20% 초과되는 것이 일반적이므로, 보수적으로 자금 계획을 세우고 6개월치 운영자금을 별도 확보해야 합니다.',
    difficulty: 'hard',
  },

  // ── Task 1-5: 개원 컨설팅 상담 ──
  {
    id: 'q-1-5-a',
    taskId: '1-5',
    type: 'multiple_choice',
    question:
      '무료 개원 컨설팅의 수익 구조로 가장 일반적인 것은?',
    choices: [
      { id: 'a', text: '정부 보조금으로 운영' },
      { id: 'b', text: '장비/인테리어 업체 연결 마진으로 수익' },
      { id: 'c', text: '개원 후 매출의 일정 비율을 수수료로 수령' },
      { id: 'd', text: '세미나 참가비로 수익' },
    ],
    correctId: 'b',
    explanation:
      '무료 컨설팅은 장비/인테리어 업체를 연결하고 마진을 받는 구조입니다. 따라서 특정 업체만 추천하면 의심해야 합니다. 중립적 조언을 원한다면 유료 컨설팅이 유리합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-1-5-b',
    taskId: '1-5',
    type: 'ox',
    question:
      '개원 컨설팅 업체를 선정할 때 레퍼런스 체크(해당 업체를 통해 개원한 의원 방문)는 선택사항이다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '레퍼런스 체크는 선택이 아닌 필수입니다. 해당 업체를 통해 개원한 의원을 직접 방문하여 실제 만족도를 확인해야 하며, 컨설팅 범위와 수수료, 실적도 꼼꼼히 비교해야 합니다.',
    difficulty: 'easy',
  },
]

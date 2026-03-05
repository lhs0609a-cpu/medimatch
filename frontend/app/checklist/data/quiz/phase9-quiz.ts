import type { QuizQuestion } from './types'

export const phase9Quiz: QuizQuestion[] = [
  // 9-1: 1개월 경영 점검
  {
    id: 'q-9-1-a',
    taskId: '9-1',
    type: 'multiple_choice',
    question: '개원 첫 달 매출이 목표의 30%에 불과할 때 가장 적절한 대응은?',
    choices: [
      { id: 'a', text: '즉시 광고비를 3배로 늘린다' },
      { id: 'b', text: '시스템 안정화에 집중하고 최소 2~3개월 관찰한다' },
      { id: 'c', text: '직원 수를 줄여 비용을 절감한다' },
      { id: 'd', text: '진료 시간을 야간까지 확대한다' },
    ],
    correctId: 'b',
    explanation: '개원 첫 달 매출이 목표의 30~50%인 것은 정상입니다. 시스템 안정화에 집중하고 최소 2~3개월 추이를 관찰한 후 대응하는 것이 바람직합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-9-1-b',
    taskId: '9-1',
    type: 'ox',
    question: '개원 첫 달에는 환자수보다 EMR 숙련도와 동선 안정화가 더 중요하다.',
    choices: [
      { id: 'o', text: 'O' },
      { id: 'x', text: 'X' },
    ],
    correctId: 'o',
    explanation: '첫 달은 직원의 EMR 숙련도, 환자 동선, 진료 프로세스 안정화가 우선입니다. 이것이 갖춰져야 환자가 늘어도 품질을 유지할 수 있습니다.',
    difficulty: 'easy',
  },

  // 9-2: 3개월 손익 분석
  {
    id: 'q-9-2-a',
    taskId: '9-2',
    type: 'multiple_choice',
    question: '건강보험 청구 후 실제 입금까지 걸리는 시간은 약 얼마인가?',
    choices: [
      { id: 'a', text: '7~14일' },
      { id: 'b', text: '15~30일' },
      { id: 'c', text: '45~60일' },
      { id: 'd', text: '90일 이상' },
    ],
    correctId: 'c',
    explanation: '건강보험 청구에서 입금까지 약 45~60일이 소요됩니다. 이 시차를 현금흐름 관리에 반드시 반영해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-9-2-b',
    taskId: '9-2',
    type: 'multiple_choice',
    question: '개원 3개월차 매출이 목표의 60%일 때 이는 어떤 상태인가?',
    choices: [
      { id: 'a', text: '심각한 적자 상태로 즉시 대응 필요' },
      { id: 'b', text: '정상 성장 궤도 범위 내' },
      { id: 'c', text: '목표 달성에 실패한 상태' },
      { id: 'd', text: '평균 이상의 우수한 성과' },
    ],
    correctId: 'b',
    explanation: '3개월차 매출 달성률 50~70%는 정상 성장 궤도입니다. BEP 도달은 일반적으로 6~18개월이 소요됩니다.',
    difficulty: 'easy',
  },

  // 9-3: 직원 이탈 대응
  {
    id: 'q-9-3-a',
    taskId: '9-3',
    type: 'multiple_choice',
    question: '의원 직원 이탈의 가장 큰 원인은?',
    choices: [
      { id: 'a', text: '급여 수준' },
      { id: 'b', text: '근무 환경과 원장과의 관계' },
      { id: 'c', text: '근무 시간' },
      { id: 'd', text: '복리후생 부족' },
    ],
    correctId: 'b',
    explanation: '급여보다 "근무 환경"과 "원장과의 관계"가 직원 이탈 원인 1위입니다. 주 1회 짧은 1:1 대화만으로도 이직률을 크게 줄일 수 있습니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-9-3-b',
    taskId: '9-3',
    type: 'ox',
    question: '소규모 의원에서 성과 인센티브 제도를 도입하면 이직률이 30~40% 감소한다.',
    choices: [
      { id: 'o', text: 'O' },
      { id: 'x', text: 'X' },
    ],
    correctId: 'o',
    explanation: '성과 기반 인센티브 제도 도입 시 이직률이 30~40% 감소하는 효과가 있습니다. 금액보다 "인정받는 느낌"이 중요합니다.',
    difficulty: 'easy',
  },

  // 9-4: 환자 리텐션
  {
    id: 'q-9-4-a',
    taskId: '9-4',
    type: 'multiple_choice',
    question: '신환 1명을 유치하는 비용은 기존 환자 1명을 유지하는 비용의 약 몇 배인가?',
    choices: [
      { id: 'a', text: '2~3배' },
      { id: 'b', text: '5~7배' },
      { id: 'c', text: '10배 이상' },
      { id: 'd', text: '비슷하다' },
    ],
    correctId: 'b',
    explanation: '신환 유치 비용은 기존 환자 유지 비용의 5~7배입니다. 리텐션 전략에 마케팅 예산의 30%를 배분하는 것이 효율적입니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-9-4-b',
    taskId: '9-4',
    type: 'multiple_choice',
    question: '환자 리텐션을 위해 가장 효과적인 방법은?',
    choices: [
      { id: 'a', text: '진료비 할인 이벤트' },
      { id: 'b', text: '이름을 불러주고 지난 진료를 기억하는 것' },
      { id: 'c', text: '고급 인테리어' },
      { id: 'd', text: '대기 시간 무제한 단축' },
    ],
    correctId: 'b',
    explanation: '환자 리텐션의 결정적 요인은 "기억되는 경험"입니다. 이름을 불러주고 지난 진료 내용을 기억하는 것이 가장 효과적입니다.',
    difficulty: 'easy',
  },

  // 9-5: BEP 도달 점검
  {
    id: 'q-9-5-a',
    taskId: '9-5',
    type: 'multiple_choice',
    question: '의원의 평균 BEP(손익분기점) 도달 기간은?',
    choices: [
      { id: 'a', text: '1~3개월' },
      { id: 'b', text: '3~6개월' },
      { id: 'c', text: '6~18개월' },
      { id: 'd', text: '18~24개월' },
    ],
    correctId: 'c',
    explanation: '의원의 BEP 도달은 일반적으로 6~18개월입니다. 6개월 이내 도달하면 상위 30% 성과입니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-9-5-b',
    taskId: '9-5',
    type: 'multiple_choice',
    question: 'BEP 미달 시 가장 바람직하지 않은 대응은?',
    choices: [
      { id: 'a', text: '비급여 서비스 확대를 검토한다' },
      { id: 'b', text: '마케팅 채널별 효과를 분석한다' },
      { id: 'c', text: '인건비 삭감을 위해 직원 수를 줄인다' },
      { id: 'd', text: '진료 시간 최적화를 시도한다' },
    ],
    correctId: 'c',
    explanation: '인건비 삭감으로 직원 수를 줄이면 서비스 품질 저하 → 환자 이탈 → 매출 감소 악순환에 빠집니다. 매출 증대와 효율화가 우선입니다.',
    difficulty: 'medium',
  },

  // 9-6: 마케팅 ROI 분석
  {
    id: 'q-9-6-a',
    taskId: '9-6',
    type: 'multiple_choice',
    question: '의원의 적정 월 광고비는 월 매출의 약 몇 %인가?',
    choices: [
      { id: 'a', text: '1~3%' },
      { id: 'b', text: '5~10%' },
      { id: 'c', text: '15~20%' },
      { id: 'd', text: '25% 이상' },
    ],
    correctId: 'b',
    explanation: '적정 월 광고비는 월 매출의 5~10%입니다. 개원 초기에는 최대 15%까지 투자할 수 있으나, 안정기에는 5~10%로 조정합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-9-6-b',
    taskId: '9-6',
    type: 'ox',
    question: '마케팅의 궁극적 목표는 광고비를 계속 늘려서 환자수를 늘리는 것이다.',
    choices: [
      { id: 'o', text: 'O' },
      { id: 'x', text: 'X' },
    ],
    correctId: 'x',
    explanation: '마케팅의 궁극적 목표는 "광고 없이도 환자가 오는 상태"입니다. 리뷰, 입소문, 재방문이 충분해지면 광고비를 줄여도 매출이 유지됩니다.',
    difficulty: 'easy',
  },

  // 9-7: 1년 종합 리뷰
  {
    id: 'q-9-7-a',
    taskId: '9-7',
    type: 'multiple_choice',
    question: '1년차 의원의 정상적인 목표 매출 달성률은?',
    choices: [
      { id: 'a', text: '50~60%' },
      { id: 'b', text: '70~90%' },
      { id: 'c', text: '100%' },
      { id: 'd', text: '120% 이상' },
    ],
    correctId: 'b',
    explanation: '1년차 목표 매출 달성률 70~90%가 정상 범위입니다. 보수적 시나리오 기준으로, 2년차에 100% 이상 달성을 목표로 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-9-7-b',
    taskId: '9-7',
    type: 'multiple_choice',
    question: '1년 리뷰에서 가장 중요한 질문은?',
    choices: [
      { id: 'a', text: '"얼마나 벌었나?"' },
      { id: 'b', text: '"비용을 얼마나 아꼈나?"' },
      { id: 'c', text: '"다시 개원한다면 무엇을 다르게 할 것인가?"' },
      { id: 'd', text: '"경쟁 의원은 얼마나 벌고 있나?"' },
    ],
    correctId: 'c',
    explanation: '1년 리뷰의 핵심 질문은 "다시 개원한다면 무엇을 다르게 할 것인가?"입니다. 이 질문의 답이 2년차 전략의 핵심이 됩니다.',
    difficulty: 'medium',
  },
]

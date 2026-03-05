import type { QuizQuestion } from './types'

export const phase3Quiz: QuizQuestion[] = [
  // ── Task 3-1: 의료기관 개설 신고 ──
  {
    id: 'q-3-1-a',
    taskId: '3-1',
    type: 'ox',
    question:
      '의료기관 개설 신고 전이라도 급한 환자는 진료할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '개설 신고 전에 환자를 진료하면 안 됩니다. 무허가 진료 시 의료법 위반으로 면허 정지까지 가능하므로, 반드시 보건소에 개설 신고 후 허가증을 발급받은 뒤 진료를 시작해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-3-1-b',
    taskId: '3-1',
    type: 'multiple_choice',
    question:
      '의료기관 개설 신고를 한 번에 통과하기 위한 최적의 시점은?',
    choices: [
      { id: 'a', text: '임대차 계약 직후' },
      { id: 'b', text: '사업자등록 완료 직후' },
      { id: 'c', text: '인테리어 도면이 완성된 후' },
      { id: 'd', text: '장비 구매 완료 후' },
    ],
    correctId: 'c',
    explanation:
      '인테리어 도면이 완성된 후 신고하면 평면도와 시설 기준이 정확히 반영되어 수정 없이 한 번에 통과할 수 있습니다. 보건소 사전 상담 시 필요 서류 목록을 정확히 받아오는 것도 중요합니다.',
    difficulty: 'medium',
  },

  // ── Task 3-2: 사업자등록 ──
  {
    id: 'q-3-2-a',
    taskId: '3-2',
    type: 'multiple_choice',
    question:
      '의원 사업자등록 시 주의해야 할 점은?',
    choices: [
      { id: 'a', text: '과세사업자로만 등록하면 된다' },
      { id: 'b', text: '면세사업자로 등록하되, 비급여 매출이 있으면 과세 겸업 등록이 필요하다' },
      { id: 'c', text: '사업자등록은 개원 후 1개월 이내에 하면 된다' },
      { id: 'd', text: '개인 계좌를 사업용으로 함께 사용해도 무방하다' },
    ],
    correctId: 'b',
    explanation:
      '의료업은 면세사업자로 등록하지만, 비급여 매출이 있으면 과세사업자 겸업 등록이 필요합니다. 또한 개인 계좌와 사업용 계좌는 반드시 분리하여 세무 관리를 투명하게 해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-3-2-b',
    taskId: '3-2',
    type: 'ox',
    question:
      '홈택스 온라인으로 사업자등록을 신청하면 당일~3일 내에 처리된다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'o',
    explanation:
      '홈택스 온라인 신청이 가장 빠르며 당일~3일 처리가 가능합니다. 사업자등록증이 있어야 장비 구매, 카드 발급 등이 가능하므로 빠른 처리가 중요합니다.',
    difficulty: 'easy',
  },

  // ── Task 3-3: 요양기관 지정 신청 ──
  {
    id: 'q-3-3-a',
    taskId: '3-3',
    type: 'scenario',
    question:
      'F 원장은 개원일을 2주 후로 잡고, 아직 요양기관 지정 신청을 하지 않았습니다. 이 상황에서 가장 큰 문제는?',
    choices: [
      { id: 'a', text: '요양기관 지정은 당일 처리가 가능하므로 문제없다' },
      { id: 'b', text: '지정까지 2~3주 소요되므로 개원일에 건강보험 청구가 불가능할 수 있다' },
      { id: 'c', text: '요양기관 지정 없이도 비급여 진료는 가능하므로 문제없다' },
      { id: 'd', text: '심평원에 급행 처리를 요청하면 된다' },
    ],
    correctId: 'b',
    explanation:
      '요양기관 지정까지 보통 2~3주가 소요됩니다. 개원일을 역산하여 미리 신청해야 하며, 요양기관 지정 없이 건강보험을 청구하면 불법입니다. 신청 전 심평원 담당자와 사전 통화하면 누락 서류를 방지할 수 있습니다.',
    difficulty: 'hard',
  },
  {
    id: 'q-3-3-b',
    taskId: '3-3',
    type: 'ox',
    question:
      '요양기관 지정을 받지 않은 상태에서도 건강보험 청구를 할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '요양기관 지정 없이 건강보험을 청구하면 불법입니다. 심평원에서 요양기관 기호를 부여받아야 비로소 건강보험 청구가 가능합니다.',
    difficulty: 'easy',
  },

  // ── Task 3-4: 의료폐기물 위탁 계약 ──
  {
    id: 'q-3-4-a',
    taskId: '3-4',
    type: 'multiple_choice',
    question:
      '의료폐기물 관리에 대한 설명으로 올바른 것은?',
    choices: [
      { id: 'a', text: '일반 쓰레기와 함께 배출해도 소량이면 괜찮다' },
      { id: 'b', text: '의료폐기물 관리 대장 작성은 선택사항이다' },
      { id: 'c', text: '전용 용기에 분리하고 관리 대장을 반드시 작성해야 한다' },
      { id: 'd', text: '의사 개인이 직접 소각 처리할 수 있다' },
    ],
    correctId: 'c',
    explanation:
      '의료폐기물은 전용 용기에 보관하고, 관리 대장을 반드시 작성해야 합니다. 무단 처리 시 과태료와 행정 처분을 받으며, 위탁 처리업체와 계약을 체결하여 정기적으로 수거해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-3-4-b',
    taskId: '3-4',
    type: 'ox',
    question:
      '인근 의원과 의료폐기물 처리 업체를 공동 계약하면 비용을 절감할 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'o',
    explanation:
      '인근 의원과 공동 계약하면 수거 비용을 절감할 수 있습니다. 초기에는 진료량이 적으므로 수거 횟수를 최소로 시작하고, 이후 진료량에 따라 조절하는 것이 효율적입니다.',
    difficulty: 'easy',
  },

  // ── Task 3-5: 방사선 발생장치 신고 ──
  {
    id: 'q-3-5-a',
    taskId: '3-5',
    type: 'multiple_choice',
    question:
      '방사선 발생장치(X-ray 등) 차폐 공사의 최적 시점은?',
    choices: [
      { id: 'a', text: '개원 직전에 별도로 진행' },
      { id: 'b', text: '인테리어 시공과 동시에 진행' },
      { id: 'c', text: '개원 후 장비 설치 시 진행' },
      { id: 'd', text: '요양기관 지정 후 진행' },
    ],
    correctId: 'b',
    explanation:
      '방사선 차폐 공사는 인테리어 시 함께 진행하면 비용을 절약할 수 있습니다. 별도로 진행하면 벽체 해체와 재시공이 필요하여 비용과 시간이 배로 들 수 있습니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-3-5-b',
    taskId: '3-5',
    type: 'scenario',
    question:
      'G 원장은 X-ray 장비를 설치하고 바로 사용하려 합니다. 방사선 발생장치 설치 신고를 하지 않으면 어떤 문제가 발생할까요?',
    choices: [
      { id: 'a', text: '별도의 문제가 없다' },
      { id: 'b', text: '벌금 및 행정 처분 대상이 되며, 3년마다 정기 안전검사도 받아야 한다' },
      { id: 'c', text: '환자에게 고지만 하면 사용 가능하다' },
      { id: 'd', text: '장비 제조사가 대신 신고해준다' },
    ],
    correctId: 'b',
    explanation:
      '방사선 장비를 미신고 상태로 사용하면 벌금 및 행정 처분 대상입니다. 설치 신고서 제출, 방사선 안전관리자 지정, 차폐 시설 검사를 모두 마쳐야 하며, 이후 3년마다 정기 안전검사를 받아야 합니다.',
    difficulty: 'hard',
  },

  // ── Task 3-6: 세무사/노무사 계약 ──
  {
    id: 'q-3-6-a',
    taskId: '3-6',
    type: 'multiple_choice',
    question:
      '의원 전문 세무사의 일반적인 월 기장료 수준은?',
    choices: [
      { id: 'a', text: '월 5~10만 원' },
      { id: 'b', text: '월 20~50만 원' },
      { id: 'c', text: '월 100~200만 원' },
      { id: 'd', text: '월 300만 원 이상' },
    ],
    correctId: 'b',
    explanation:
      '세무사 기장료는 월 20~50만 원 수준이 일반적입니다. 의원 전문 세무사가 절세 노하우가 많으며, 계약 시 실시간 소통 가능 여부를 확인하는 것이 좋습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-3-6-b',
    taskId: '3-6',
    type: 'scenario',
    question:
      'H 원장은 직원을 채용했지만 "나중에 하면 되겠지" 하며 4대보험 가입을 미루고 있습니다. 이 경우 발생할 수 있는 문제는?',
    choices: [
      { id: 'a', text: '3개월 내에만 가입하면 문제없다' },
      { id: 'b', text: '과태료와 소급 납부 부담이 발생한다' },
      { id: 'c', text: '직원이 동의하면 가입하지 않아도 된다' },
      { id: 'd', text: '세무사가 알아서 처리해준다' },
    ],
    correctId: 'b',
    explanation:
      '4대보험 미가입 시 과태료와 소급 납부 부담이 발생합니다. 또한 종합소득세 신고를 놓치면 가산세가 부과되므로, 개원 초기부터 세무사/노무사와 계약하여 체계적으로 관리해야 합니다.',
    difficulty: 'medium',
  },
]

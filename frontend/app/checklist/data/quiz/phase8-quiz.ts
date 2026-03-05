import type { QuizQuestion } from './types'

export const phase8Quiz: QuizQuestion[] = [
  // ── Task 8-1: 리허설 운영 ──
  {
    id: 'q-8-1-a',
    taskId: '8-1',
    type: 'multiple_choice',
    question: '개원 전 리허설 운영 시 가장 중요한 점검 항목은?',
    choices: [
      { id: 'a', text: '대기실 음악 볼륨 테스트' },
      { id: 'b', text: '접수 → 대기 → 진료 → 수납 전체 동선 점검' },
      { id: 'c', text: '주차장 라인 도색 확인' },
      { id: 'd', text: '직원 유니폼 디자인 최종 확인' },
    ],
    correctId: 'b',
    explanation:
      '리허설에서 가장 중요한 것은 접수 → 대기 → 진료 → 수납의 전체 동선을 실제처럼 점검하는 것입니다. 가족/지인을 대상으로 전화 예약부터 수납까지 실제 상황처럼 진행하고, 비상 상황(정전, 시스템 오류) 대응도 연습해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-8-1-b',
    taskId: '8-1',
    type: 'ox',
    question:
      '리허설 중 발견된 동선 문제는 개원 후에 천천히 수정해도 된다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '리허설 중 발견된 동선 문제는 개원 전에 반드시 수정해야 합니다. 개원 후에는 환자를 보면서 동선을 변경하기 어렵고, 첫인상이 중요한 초기 환자들에게 불편한 경험을 줄 수 있습니다. EMR 입력, 처방, 청구 프로세스도 반복 실습하세요.',
    difficulty: 'easy',
  },

  // ── Task 8-2: 소방/안전 점검 ──
  {
    id: 'q-8-2-a',
    taskId: '8-2',
    type: 'scenario',
    question:
      'I 원장은 개원일이 다가와 바쁘다는 이유로 소방 점검을 개원 후로 미루기로 했습니다. 이 결정의 문제점은?',
    choices: [
      { id: 'a', text: '소방서에 벌금을 내면 된다' },
      { id: 'b', text: '소방 점검 미통과 시 영업 자체가 불가하다' },
      { id: 'c', text: '환자가 불편해할 수 있다' },
      { id: 'd', text: '직원들의 사기가 떨어진다' },
    ],
    correctId: 'b',
    explanation:
      '소방 점검 미통과 시 영업이 불가합니다. 소방 점검은 개원 2주 전에 미리 신청해야 하며, 소화기, 비상구, 피난 유도등의 위치와 상태를 확인하고, 비상구를 물건으로 막아두면 안 됩니다. 직원 소방 안전 교육도 필수입니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-8-2-b',
    taskId: '8-2',
    type: 'multiple_choice',
    question: '소방 점검은 개원 전 언제까지 신청하는 것이 권장되는가?',
    choices: [
      { id: 'a', text: '개원 전날' },
      { id: 'b', text: '개원 1주 전' },
      { id: 'c', text: '개원 2주 전' },
      { id: 'd', text: '개원 1개월 전' },
    ],
    correctId: 'c',
    explanation:
      '소방 점검은 개원 2주 전에 미리 신청하는 것이 권장됩니다. 소방서 일정에 따라 점검이 지연될 수 있고, 미비 사항이 발견되면 보완 후 재점검을 받아야 하므로 충분한 시간적 여유가 필요합니다.',
    difficulty: 'easy',
  },

  // ── Task 8-3: 건강보험 청구 테스트 ──
  {
    id: 'q-8-3-a',
    taskId: '8-3',
    type: 'multiple_choice',
    question: '건강보험 청구 테스트 전에 반드시 사전 발급 받아야 하는 것은?',
    choices: [
      { id: 'a', text: '네이버 스마트플레이스 인증서' },
      { id: 'b', text: '심평원 EDI 인증서' },
      { id: 'c', text: '의사협회 회원증' },
      { id: 'd', text: '세무사 기장 계약서' },
    ],
    correctId: 'b',
    explanation:
      '심평원 EDI 인증서를 사전에 발급받아야 건강보험 청구 테스트가 가능합니다. EDI 테스트는 영업일 기준 1~2일 내 결과를 확인할 수 있으며, 자주 쓰는 상병코드와 처치코드를 미리 세트로 만들어두면 개원 초기 진료 효율이 높아집니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-8-3-b',
    taskId: '8-3',
    type: 'ox',
    question:
      '청구 테스트 없이 개원해도 첫 달 건강보험 청구에는 큰 문제가 없다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '청구 테스트 없이 개원하면 첫 달 청구 누락/오류가 발생합니다. EMR에서 테스트 환자로 진료 기록을 작성하고, 청구 파일 생성 후 심평원 전송 테스트를 거쳐야 합니다. 청구 오류는 매출 손실로 직결되므로 반드시 사전에 테스트하세요.',
    difficulty: 'easy',
  },

  // ── Task 8-4: 오픈 이벤트 기획 ──
  {
    id: 'q-8-4-a',
    taskId: '8-4',
    type: 'multiple_choice',
    question: '개원 오픈 이벤트로 가장 효과적이면서 안전한 방법은?',
    choices: [
      { id: 'a', text: '모든 진료 50% 할인 행사' },
      { id: 'b', text: '고가 경품(TV, 노트북) 추첨 행사' },
      { id: 'c', text: '무료 건강 상담, 혈압/혈당 체크 이벤트' },
      { id: 'd', text: '현금 캐시백 이벤트' },
    ],
    correctId: 'c',
    explanation:
      '무료 건강 상담, 혈압/혈당 체크 등 가벼운 이벤트가 효과적입니다. 과도한 할인이나 경품은 의료법 위반 소지가 있으며, 개원 첫 주는 예약을 여유 있게 잡아 시스템 안정화에 집중하는 것이 중요합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-8-4-b',
    taskId: '8-4',
    type: 'ox',
    question:
      '개원 이벤트에서 과도한 할인이나 고가 경품을 제공하는 것은 의료법 위반 소지가 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'o',
    explanation:
      '과도한 할인이나 경품은 의료법 위반 소지가 있습니다. 의료법은 환자 유인 행위를 금지하고 있으므로, 적절한 수준의 건강 상담이나 기본 검사 제공 정도가 안전합니다. 이벤트 기간 중에도 진료 품질을 유지하는 것이 핵심입니다.',
    difficulty: 'medium',
  },

  // ── Task 8-5: 정식 개원 ──
  {
    id: 'q-8-5-a',
    taskId: '8-5',
    type: 'multiple_choice',
    question: '개원 첫날 가장 집중해야 할 것은?',
    choices: [
      { id: 'a', text: '최대한 많은 환자를 진료하는 것' },
      { id: 'b', text: '프로세스 안정화와 첫 환자 경험 관리' },
      { id: 'c', text: 'SNS에 개원 소식 실시간 업로드' },
      { id: 'd', text: '인근 의원에 인사 방문' },
    ],
    correctId: 'b',
    explanation:
      '첫날은 환자수에 욕심내지 말고 프로세스 안정화에 집중해야 합니다. 첫 환자에게 특별한 경험을 제공하면 입소문에 도움되며, 저녁에 하루를 복기하고 개선점을 정리하는 것이 중요합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-8-5-b',
    taskId: '8-5',
    type: 'scenario',
    question:
      'J 원장은 개원 첫날 EMR 시스템에 장애가 발생했습니다. 사전에 수동 처리 방안을 마련하지 않았다면 어떤 문제가 생기는가?',
    choices: [
      { id: 'a', text: '환자에게 다음날 다시 오라고 안내한다' },
      { id: 'b', text: '진료 기록 작성, 처방, 수납 모두 중단되어 환자 진료가 불가능해진다' },
      { id: 'c', text: '자동으로 백업 시스템이 가동된다' },
      { id: 'd', text: 'EMR 업체가 즉시 원격 복구한다' },
    ],
    correctId: 'b',
    explanation:
      '개원 첫날 시스템 오류에 대비한 수동 처리 방안을 반드시 마련해야 합니다. EMR 장애 시 수기 진료 기록지, 수기 처방전, 현금/카드 수동 처리 등의 비상 절차가 없으면 진료가 완전히 중단됩니다. 장비, 소모품, 약품 재고도 개원 당일 아침에 최종 확인하세요.',
    difficulty: 'hard',
  },

  // ── Task 8-6: 개원 후 1개월 점검 ──
  {
    id: 'q-8-6-a',
    taskId: '8-6',
    type: 'multiple_choice',
    question: '개원 후 경영 안정화를 위해 가장 중요한 시기는?',
    choices: [
      { id: 'a', text: '개원 후 1주일' },
      { id: 'b', text: '개원 후 1개월' },
      { id: 'c', text: '개원 후 3개월' },
      { id: 'd', text: '개원 후 1년' },
    ],
    correctId: 'c',
    explanation:
      '개원 후 3개월이 가장 중요한 시기입니다. 이 기간에 환자수 추이, 만족도(리뷰), 직원 적응도, 매출/비용 실적을 면밀히 분석하고, 필요 시 마케팅 및 운영 전략을 수정해야 합니다. 네이버 리뷰 관리(답글 필수)도 적극적으로 해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-8-6-b',
    taskId: '8-6',
    type: 'ox',
    question:
      '개원 후 환자수가 기대에 못 미치면 즉시 비용을 절감하여 수익성을 확보해야 한다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '환자수가 기대에 못 미쳐도 3~6개월은 기다려야 합니다. 초기 비용 절감을 위해 서비스 품질을 낮추면 오히려 환자 이탈이 가속화됩니다. 일/주/월 단위로 환자수 추이를 모니터링하며 마케팅 전략을 조정하는 것이 올바른 접근입니다.',
    difficulty: 'medium',
  },
]

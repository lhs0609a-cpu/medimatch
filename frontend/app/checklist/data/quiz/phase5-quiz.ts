import type { QuizQuestion } from './types'

export const phase5Quiz: QuizQuestion[] = [
  // ── Task 5-1: 필수 의료장비 구매 ──
  {
    id: 'q-5-1-a',
    taskId: '5-1',
    type: 'multiple_choice',
    question: '고가 의료장비(CT, 초음파 등)의 초기 자금 부담을 줄이기 위한 가장 효과적인 방법은?',
    choices: [
      { id: 'a', text: '중고 장비를 무조건 구매한다' },
      { id: 'b', text: '리스를 활용하여 분할 비용으로 도입한다' },
      { id: 'c', text: '개원 후 환자가 늘면 그때 구매한다' },
      { id: 'd', text: '해외 직구로 저렴하게 구매한다' },
    ],
    correctId: 'b',
    explanation:
      '고가 장비(CT, 초음파 등)는 리스를 활용하면 초기 자금 부담을 크게 줄일 수 있습니다. 중고 장비는 30~50% 저렴하지만 AS 조건을 반드시 확인해야 하며, 가격만 보고 결정하지 말고 AS 네트워크와 소모품 비용도 함께 고려해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-5-1-b',
    taskId: '5-1',
    type: 'scenario',
    question:
      'C 원장은 가장 저렴한 견적을 제출한 업체에서 모든 장비를 구매하기로 결정했습니다. 이 접근에서 간과한 중요한 요소는?',
    choices: [
      { id: 'a', text: '장비 색상이 인테리어와 맞지 않을 수 있다' },
      { id: 'b', text: 'AS 네트워크와 소모품 비용을 고려하지 않았다' },
      { id: 'c', text: '할부 결제가 불가능할 수 있다' },
      { id: 'd', text: '장비 크기가 진료실에 맞지 않을 수 있다' },
    ],
    correctId: 'b',
    explanation:
      '장비 구매 시 가격만 보고 결정하면 안 됩니다. AS 네트워크가 약한 업체를 선택하면 고장 시 수리에 오랜 시간이 걸려 진료에 차질이 생기고, 소모품 비용이 비싸면 장기적으로 총비용이 더 높아질 수 있습니다. 최소 3곳의 견적을 비교하되 종합적으로 판단해야 합니다.',
    difficulty: 'hard',
  },

  // ── Task 5-2: 진료 소모품 구매 ──
  {
    id: 'q-5-2-a',
    taskId: '5-2',
    type: 'multiple_choice',
    question: '개원 시 초도 소모품 발주량으로 가장 적절한 기준은?',
    choices: [
      { id: 'a', text: '6개월분을 넉넉하게 확보한다' },
      { id: 'b', text: '1~2개월분을 확보한다' },
      { id: 'c', text: '1주일분만 최소한으로 확보한다' },
      { id: 'd', text: '1년분을 도매가로 대량 구매한다' },
    ],
    correctId: 'b',
    explanation:
      '초도 소모품은 1~2개월분이면 충분합니다. 유통기한 관리를 고려하면 과다 발주는 폐기 비용을 발생시키며, 자주 쓰는 소모품은 정기 배송 계약을 통해 효율적으로 관리하는 것이 좋습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-5-2-b',
    taskId: '5-2',
    type: 'ox',
    question:
      '마약류 및 향정신성의약품은 일반 소모품과 동일한 방식으로 관리하면 된다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '마약류/향정신성의약품은 별도의 관리 규정이 있습니다. 일반 소모품과 분리 보관해야 하며, 별도 관리 대장을 작성하고 법적 요건을 충족해야 합니다. 위반 시 형사 처벌까지 받을 수 있습니다.',
    difficulty: 'medium',
  },

  // ── Task 5-3: EMR 시스템 도입 ──
  {
    id: 'q-5-3-a',
    taskId: '5-3',
    type: 'multiple_choice',
    question: '클라우드형 EMR이 설치형 EMR보다 유리한 점으로 적절하지 않은 것은?',
    choices: [
      { id: 'a', text: '유지보수가 편리하다' },
      { id: 'b', text: '자동 업데이트가 가능하다' },
      { id: 'c', text: '인터넷 없이도 안정적으로 작동한다' },
      { id: 'd', text: '원격 접속이 가능하다' },
    ],
    correctId: 'c',
    explanation:
      '클라우드형 EMR은 유지보수, 업데이트, 원격 접속에 유리하지만, 인터넷 연결이 필수적이므로 네트워크 장애 시 사용이 어려울 수 있습니다. 따라서 유선 LAN 등 안정적인 네트워크 환경 구축이 중요합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-5-3-b',
    taskId: '5-3',
    type: 'scenario',
    question:
      'D 원장은 EMR 시스템을 도입하면서 계약서에 해지 조건과 데이터 이관 방법을 확인하지 않았습니다. 이후 발생할 수 있는 문제는?',
    choices: [
      { id: 'a', text: 'EMR 사용법이 어려워진다' },
      { id: 'b', text: '처방 세트를 만들 수 없다' },
      { id: 'c', text: '업체 변경 시 기존 진료 데이터를 이관하지 못하거나 높은 위약금이 발생한다' },
      { id: 'd', text: '심평원 청구가 불가능해진다' },
    ],
    correctId: 'c',
    explanation:
      'EMR 계약 시 해지 조건과 데이터 이관 방법을 반드시 확인해야 합니다. 이를 확인하지 않으면 업체 변경 시 기존 환자 진료 데이터를 가져올 수 없거나, 예상치 못한 위약금이 발생할 수 있습니다. 데이터 백업 정책도 반드시 점검하세요.',
    difficulty: 'hard',
  },

  // ── Task 5-4: 가구/집기 구매 ──
  {
    id: 'q-5-4-a',
    taskId: '5-4',
    type: 'multiple_choice',
    question: '의원 대기실 의자 재질로 가장 추천되는 것은?',
    choices: [
      { id: 'a', text: '천(패브릭) 소파' },
      { id: 'b', text: '레자/인조가죽 소재' },
      { id: 'c', text: '원목 벤치' },
      { id: 'd', text: '메쉬 사무용 의자' },
    ],
    correctId: 'b',
    explanation:
      '대기실 의자는 청소가 쉬운 레자/인조가죽 재질이 추천됩니다. 의원은 감염 관리와 위생이 중요하므로, 소독이 용이하고 오염에 강한 재질을 선택해야 합니다. 패브릭 소파는 세균 번식 우려가 있습니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-5-4-b',
    taskId: '5-4',
    type: 'ox',
    question: '가구 배치 후에는 동선이 좁아지지 않는지 반드시 점검해야 한다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'o',
    explanation:
      '도면상으로는 여유로워 보여도, 실제 가구를 배치하면 동선이 예상보다 좁아지는 경우가 많습니다. 특히 휠체어, 유모차 이동이 가능한지, 진료 침대의 내하중과 높낮이 조절 기능도 함께 확인해야 합니다.',
    difficulty: 'easy',
  },

  // ── Task 5-5: 장비 설치 및 검수 ──
  {
    id: 'q-5-5-a',
    taskId: '5-5',
    type: 'multiple_choice',
    question: '의료장비 설치 전 반드시 확인해야 할 환경 요소가 아닌 것은?',
    choices: [
      { id: 'a', text: '전압 사양 (220V/380V)' },
      { id: 'b', text: '실내 습도 조건' },
      { id: 'c', text: '바닥 하중 (무거운 장비 대비)' },
      { id: 'd', text: '창문 방향과 일조량' },
    ],
    correctId: 'd',
    explanation:
      '의료장비 설치 전에는 전압, 습도, 바닥 하중 등이 장비 사양에 맞는지 반드시 확인해야 합니다. 전압이 맞지 않으면 장비 고장, 바닥 하중이 부족하면 안전 사고가 발생할 수 있습니다. 창문 방향과 일조량은 일반적으로 장비 설치 요건이 아닙니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-5-5-b',
    taskId: '5-5',
    type: 'ox',
    question:
      '장비 납품 후 별도 검수 없이 인수해도 하자 발생 시 업체에 책임을 물을 수 있다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '검수 없이 인수하면 하자 발생 시 책임 소재가 불명확해집니다. 설치 완료 후 반드시 장비별 작동 테스트를 실시하고, 교정/검정 성적서를 발급받아야 합니다. AS 연락처, 보증 기간, 소모품 교체 주기도 정리해두세요.',
    difficulty: 'medium',
  },
]

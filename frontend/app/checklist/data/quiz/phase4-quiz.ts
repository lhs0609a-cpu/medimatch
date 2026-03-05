import type { QuizQuestion } from './types'

export const phase4Quiz: QuizQuestion[] = [
  // ── Task 4-1: 인테리어 업체 선정 ──
  {
    id: 'q-4-1-a',
    taskId: '4-1',
    type: 'multiple_choice',
    question:
      '인테리어 업체 선정 시 가장 중요한 기준은?',
    choices: [
      { id: 'a', text: '가장 낮은 견적을 제시한 업체' },
      { id: 'b', text: '가장 유명한 인테리어 브랜드' },
      { id: 'c', text: '의료 전문 경험이 있고 가성비가 좋은 업체' },
      { id: 'd', text: '지인이 추천한 업체' },
    ],
    correctId: 'c',
    explanation:
      '최저가 업체가 아니라 가성비 좋은 업체를 선택해야 합니다. 의료 전문 업체는 의료법상 시설 기준을 잘 알고 있어 설계 오류를 줄일 수 있습니다. 최소 3곳의 비교 견적을 받되, 견적 항목을 동일하게 맞춰야 정확한 비교가 가능합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-4-1-b',
    taskId: '4-1',
    type: 'ox',
    question:
      '인테리어 견적을 비교할 때 항목을 동일하게 맞추지 않아도 총액만 비교하면 된다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '견적 항목을 동일하게 맞춰야 정확한 비교가 가능합니다. 총액만 비교하면 포함/미포함 항목의 차이를 알 수 없어, 시공 중 추가 비용이 발생할 수 있습니다.',
    difficulty: 'easy',
  },

  // ── Task 4-2: 설계 도면 확정 ──
  {
    id: 'q-4-2-a',
    taskId: '4-2',
    type: 'multiple_choice',
    question:
      '의원 설계 시 가장 먼저 고려해야 할 요소는?',
    choices: [
      { id: 'a', text: '인테리어 디자인 콘셉트' },
      { id: 'b', text: '환자 동선과 직원 동선의 분리' },
      { id: 'c', text: '대기실 TV 크기' },
      { id: 'd', text: '벽지 색상과 재질' },
    ],
    correctId: 'b',
    explanation:
      '진료 동선(환자 동선/직원 동선)을 먼저 설계해야 합니다. 환자 동선과 직원 동선이 교차하지 않는 것이 이상적이며, 이를 기반으로 진료실, 대기실, 처치실 등의 배치를 결정합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-4-2-b',
    taskId: '4-2',
    type: 'scenario',
    question:
      'I 원장은 도면이 확정된 후 진료실을 하나 더 추가하고 싶어졌습니다. 이 변경이 초래할 문제는?',
    choices: [
      { id: 'a', text: '도면 변경은 자유로우므로 문제없다' },
      { id: 'b', text: '추가 비용과 공사 기간 지연이 발생한다' },
      { id: 'c', text: '인테리어 업체가 무료로 수정해준다' },
      { id: 'd', text: '진료실 추가는 벽만 세우면 되므로 간단하다' },
    ],
    correctId: 'b',
    explanation:
      '도면 확정 후 변경하면 추가 비용과 공기 지연이 발생합니다. 전기/배관 위치까지 재설계해야 하므로 비용이 크게 증가합니다. 향후 장비 추가를 고려하여 처음부터 여유 공간을 확보하는 것이 바람직합니다.',
    difficulty: 'medium',
  },

  // ── Task 4-3: 인테리어 시공 ──
  {
    id: 'q-4-3-a',
    taskId: '4-3',
    type: 'multiple_choice',
    question:
      '인테리어 시공 중 원장이 반드시 해야 할 일은?',
    choices: [
      { id: 'a', text: '업체에 전적으로 맡기고 완공 시 방문' },
      { id: 'b', text: '매일 현장에서 직접 감독' },
      { id: 'c', text: '주 1~2회 현장 방문하여 진행 상황 확인 및 사진 기록' },
      { id: 'd', text: '전화 통화로만 확인' },
    ],
    correctId: 'c',
    explanation:
      '주 1~2회 현장을 직접 방문하여 진행 상황을 확인해야 합니다. 공사 중 사진 기록을 남기면 하자 분쟁 시 증거가 됩니다. 바닥재는 청소가 쉽고 소독이 가능한 재질을 선택하세요.',
    difficulty: 'easy',
  },
  {
    id: 'q-4-3-b',
    taskId: '4-3',
    type: 'ox',
    question:
      '인테리어비는 보통 최초 견적 금액 그대로 완공되는 것이 일반적이다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '인테리어비는 견적 대비 10~20% 초과가 일반적입니다. 설계 변경, 자재 업그레이드, 예상치 못한 하자 보수 등으로 추가 비용이 발생하므로, 처음부터 여유 예산을 잡아야 합니다.',
    difficulty: 'medium',
  },

  // ── Task 4-4: 의료가스 공사 ──
  {
    id: 'q-4-4-a',
    taskId: '4-4',
    type: 'multiple_choice',
    question:
      '의료가스 배관 공사를 반드시 인테리어 마감 전에 완료해야 하는 이유는?',
    choices: [
      { id: 'a', text: '비용이 더 저렴해서' },
      { id: 'b', text: '법적으로 동시 시공이 의무여서' },
      { id: 'c', text: '배관 매립 후에는 수정이 어렵기 때문' },
      { id: 'd', text: '가스 업체가 마감 후에는 시공을 거부해서' },
    ],
    correctId: 'c',
    explanation:
      '의료가스 배관은 인테리어 마감 전에 완료해야 합니다. 배관이 벽체 내부에 매립된 후에는 수정이 매우 어렵고, 벽을 다시 뜯어야 하므로 위치를 신중히 결정해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-4-4-b',
    taskId: '4-4',
    type: 'ox',
    question:
      '의료가스 배관 공사는 인테리어 업체와 별도로 진행해도 일정 조율이 필요 없다.',
    choices: [
      { id: 'o', text: 'O (맞다)' },
      { id: 'x', text: 'X (틀리다)' },
    ],
    correctId: 'x',
    explanation:
      '인테리어 업체와 의료가스 업체가 협업해야 하므로 반드시 일정을 맞춰야 합니다. 배관 위치가 인테리어 설계와 충돌하면 양쪽 모두 재시공이 필요할 수 있습니다.',
    difficulty: 'easy',
  },

  // ── Task 4-5: 전기/통신 공사 ──
  {
    id: 'q-4-5-a',
    taskId: '4-5',
    type: 'scenario',
    question:
      'J 원장은 비용 절감을 위해 EMR 네트워크를 WiFi로만 구성하려 합니다. 이 결정의 위험성은?',
    choices: [
      { id: 'a', text: 'WiFi가 유선보다 속도가 빠르므로 문제없다' },
      { id: 'b', text: 'WiFi는 간섭과 끊김이 있어 EMR 안정성이 떨어지므로 유선 LAN을 병행해야 한다' },
      { id: 'c', text: 'WiFi 6 이상이면 유선과 동일하므로 괜찮다' },
      { id: 'd', text: '환자가 많지 않으면 WiFi만으로 충분하다' },
    ],
    correctId: 'b',
    explanation:
      'WiFi만 의존하면 간섭, 끊김 등으로 EMR 시스템의 안정성이 떨어질 수 있습니다. EMR처럼 중요한 시스템은 유선 LAN을 병행하여 안정적인 네트워크 환경을 구축해야 합니다.',
    difficulty: 'medium',
  },
  {
    id: 'q-4-5-b',
    taskId: '4-5',
    type: 'multiple_choice',
    question:
      'CCTV 설치 시 주의해야 할 사항은?',
    choices: [
      { id: 'a', text: '진료실에도 반드시 설치해야 한다' },
      { id: 'b', text: '대기실과 출입구는 필수이나, 진료실은 환자 사생활 침해 소지가 있다' },
      { id: 'c', text: 'CCTV는 모든 공간에 설치하는 것이 법적 의무이다' },
      { id: 'd', text: 'CCTV 설치는 선택사항이므로 안 해도 된다' },
    ],
    correctId: 'b',
    explanation:
      'CCTV는 대기실, 출입구에는 필수이지만, 진료실 설치는 환자 사생활 침해 소지가 있으므로 주의해야 합니다. 진료실 설치 시 반드시 환자 동의가 필요합니다.',
    difficulty: 'medium',
  },

  // ── Task 4-6: 간판 제작/설치 ──
  {
    id: 'q-4-6-a',
    taskId: '4-6',
    type: 'multiple_choice',
    question:
      '간판 설치 전 반드시 거쳐야 하는 행정 절차는?',
    choices: [
      { id: 'a', text: '보건소 사전 승인' },
      { id: 'b', text: '관할 구청 옥외광고물 허가' },
      { id: 'c', text: '소방서 안전 점검' },
      { id: 'd', text: '심평원 디자인 심사' },
    ],
    correctId: 'b',
    explanation:
      '관할 구청에 옥외광고물 허가를 신청해야 합니다. 허가 없이 간판을 설치하면 과태료가 부과됩니다. 또한 간판 문구는 의료광고 규정(의료법 제56조)을 준수해야 합니다.',
    difficulty: 'easy',
  },
  {
    id: 'q-4-6-b',
    taskId: '4-6',
    type: 'scenario',
    question:
      'K 원장은 "지역 최고 명의", "100% 치료 보장" 문구를 간판에 넣으려 합니다. 이 결정의 문제점은?',
    choices: [
      { id: 'a', text: '글자 수가 너무 많아 가독성이 떨어진다' },
      { id: 'b', text: '의료법 제56조 의료광고 규정에 위배되어 사용 불가하다' },
      { id: 'c', text: 'LED 간판에는 긴 문구를 넣을 수 있으므로 괜찮다' },
      { id: 'd', text: '간판 문구는 자유롭게 작성할 수 있다' },
    ],
    correctId: 'b',
    explanation:
      '"최고", "100% 보장" 등의 과장 문구는 의료법 제56조 의료광고 규정에 위배됩니다. 간판 디자인은 CI/BI와 통일감 있게 제작하되, 의료광고 규정을 반드시 준수해야 합니다. 야간 LED 간판은 가시성이 높아 비용 대비 효과적입니다.',
    difficulty: 'hard',
  },
]

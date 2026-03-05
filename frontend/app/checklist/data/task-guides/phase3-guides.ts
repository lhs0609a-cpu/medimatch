import type { TaskGuide } from './types'

export const phase3Guides: Record<string, TaskGuide> = {
  '3-1': {
    steps: [
      '관할 보건소 담당자에게 사전 상담을 받습니다',
      '의료기관 개설 신고서를 작성합니다',
      '필요 서류를 준비하여 보건소에 제출합니다',
      '현장 확인 후 개설 허가증을 발급받습니다',
    ],
    tips: [
      '보건소 사전 상담 시 필요 서류 목록을 정확히 받아오세요',
      '인테리어 도면이 완성된 후 신고하면 수정 없이 한 번에 통과됩니다',
      '오프라인 제출 전 정부24에서 온라인 사전 확인이 가능합니다',
    ],
    warnings: [
      '무허가 진료 시 의료법 위반으로 면허 정지까지 가능합니다',
      '개설 신고 전에 환자를 진료하면 안 됩니다',
    ],
    documents: [
      '의료기관 개설 신고서',
      '의사 면허증 사본',
      '건물 임대차계약서 사본',
      '시설/장비 목록',
      '평면도',
    ],
    resources: [
      { name: '정부24', url: 'https://www.gov.kr', description: '의료기관 개설 신고 온라인 접수 가능', type: 'government' },
      { name: '관할 보건소', description: '사전 상담 필수 — 관할 보건소 의료기관팀 방문', type: 'government' },
      { name: '의료기관 개설 신고서 양식', description: '보건소 또는 정부24에서 다운로드 가능', type: 'template' },
    ],
    benchmarks: [
      { label: '처리 기간', value: '7~14일', note: '보건소 현장 실사 포함' },
      { label: '현장 실사 통과율', value: '약 90%', note: '미통과 사유: 시설 기준 미달, 서류 미비' },
      { label: '수수료', value: '무료', note: '신고 자체는 무료' },
    ],
    timeline: {
      recommendedStart: '인테리어 완공 2주 전',
      duration: '7~14일',
      deadline: '개원일 전 반드시 완료',
      durationRange: [7, 14],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    subChecklists: [
      {
        label: '의료기관 시설 기준 (보건소 점검 항목)',
        items: [
          '진료실 면적 10㎡ 이상',
          '대기실 확보',
          '소독 시설 구비',
          '의료 폐기물 보관 장소',
          '화장실 (환자용)',
          '적정 조명 및 환기',
          '비상구 확보',
        ],
      },
    ],
    expertAdvice: '보건소 사전 상담은 "필수"입니다. 담당자에 따라 요구 사항이 미세하게 다를 수 있으므로, 도면 확정 전에 방문하여 시설 기준을 직접 확인받으세요.',
    regulations: [
      '의료법 제33조: 의료기관 개설 신고 의무',
      '의료법 제36조: 의료기관 시설 기준',
      '의료법 시행규칙 별표3: 의료기관 종류별 시설 기준',
    ],
    failureCases: [
      {
        title: '개설 신고 전 진료 시작',
        description: '인테리어 완료 후 신고 전에 지인 대상 진료',
        consequence: '무허가 의료행위로 의료법 위반, 벌금 500만원 이하',
        prevention: '반드시 보건소 개설 신고 수리 후 진료 시작',
      },
      {
        title: '시설 기준 미달로 실사 불합격',
        description: '진료실 면적, 소독 시설 등 법정 기준 미충족',
        consequence: '개원일 지연 2~4주, 보완 공사 비용 추가 발생',
        prevention: '보건소 사전 상담에서 시설 기준을 정확히 확인하고 인테리어에 반영',
      },
    ],
    contacts: [
      { organization: '관할 보건소', department: '의료기관 관리과', description: '의료기관 개설 신고 접수 및 안내' },
      { organization: '보건복지부 콜센터', phone: '129', url: 'https://www.mohw.go.kr', description: '보건의료 관련 민원 상담' },
    ],
    legalRisks: [
      '무허가 의료행위 시 의료법 제87조에 의거 5년 이하 징역 또는 5천만원 이하 벌금',
      '개설 신고 없이 진료 시 건강보험 청구 불가, 기 청구분 환수 처분',
      '시설 기준 미달 상태 운영 시 행정처분(업무정지) 가능',
    ],
  },
  '3-2': {
    steps: [
      '홈택스 또는 관할 세무서에서 사업자등록을 신청합니다',
      '면세사업자(의료업)로 등록합니다',
      '사업자등록증을 발급받습니다',
      '사업용 계좌를 개설합니다',
    ],
    tips: [
      '홈택스 온라인 신청이 가장 빠릅니다 (당일~3일 처리)',
      '사업자등록증이 있어야 장비 구매, 카드 발급 등이 가능합니다',
      '개인 계좌와 사업용 계좌를 반드시 분리하세요',
    ],
    warnings: [
      '비급여 매출이 있으면 과세사업자 겸업 등록이 필요할 수 있습니다',
    ],
    documents: [
      '사업자등록 신청서',
      '의료기관 개설 허가증/신고증',
      '임대차계약서 사본',
      '대표자 신분증',
    ],
    resources: [
      { name: '홈택스', url: 'https://www.hometax.go.kr', description: '사업자등록 온라인 신청 (가장 빠름)', type: 'government' },
      { name: '관할 세무서', description: '오프라인 방문 신청도 가능 (신분증 지참)', type: 'government' },
    ],
    benchmarks: [
      { label: '처리 기간 (온라인)', value: '당일~3일', note: '홈택스 신청 기준' },
      { label: '처리 기간 (오프라인)', value: '당일', note: '세무서 방문 기준' },
      { label: '수수료', value: '무료' },
    ],
    timeline: {
      recommendedStart: '의료기관 개설 신고 직후',
      duration: '1~3일',
      deadline: '장비 구매/카드 발급 전 완료',
      durationRange: [1, 3],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    expertAdvice: '비급여 매출(예: 피부과 시술, 건강검진)이 예상되면 과세/면세 겸업 사업자로 등록하세요. 나중에 변경하면 소급 세금 문제가 생길 수 있습니다.',
    regulations: [
      '부가가치세법 제8조: 사업자등록 의무 (개업일로부터 20일 이내)',
      '소득세법: 의료업은 면세사업, 비급여는 과세 대상일 수 있음',
    ],
    failureCases: [
      {
        title: '면세/과세 구분 오류',
        description: '비급여 매출이 있는데 면세사업자로만 등록',
        consequence: '부가세 미신고 가산세, 소급 세금 추징, 세무조사 대상',
        prevention: '비급여 진료(시술, 건강검진 등)가 예상되면 과세/면세 겸업으로 등록',
      },
    ],
    contacts: [
      { organization: '관할 보건소', department: '의료기관 관리과', description: '의료기관 개설 신고 접수 및 안내' },
      { organization: '보건복지부 콜센터', phone: '129', url: 'https://www.mohw.go.kr', description: '보건의료 관련 민원 상담' },
    ],
  },
  '3-3': {
    steps: [
      '건강보험심사평가원 홈페이지에서 요양기관 지정 신청서를 다운로드합니다',
      '필요 서류를 첨부하여 심평원에 제출합니다',
      '심평원 현장 실사에 대비합니다',
      '요양기관 기호를 부여받으면 건강보험 청구가 가능합니다',
    ],
    tips: [
      '요양기관 지정까지 보통 2~3주 소요되므로 개원일 역산하여 신청하세요',
      '신청 전에 심평원 담당자와 사전 통화하면 누락 서류를 방지할 수 있습니다',
    ],
    warnings: [
      '요양기관 지정 없이 건강보험 청구하면 불법입니다',
      '시설 기준 미달 시 지정이 거부될 수 있으니 미리 확인하세요',
    ],
    documents: [
      '요양기관 지정 신청서',
      '의료기관 개설 신고증 사본',
      '사업자등록증 사본',
      '시설 및 인력 현황 서류',
    ],
    resources: [
      { name: '건강보험심사평가원', url: 'https://www.hira.or.kr', description: '요양기관 지정 신청 및 안내', type: 'government' },
      { name: '요양기관 업무포털', url: 'https://medicare.hira.or.kr', description: '요양기관 지정 후 업무 처리 포털', type: 'government' },
    ],
    benchmarks: [
      { label: '처리 기간', value: '2~3주', note: '서류 심사 + 현장 실사' },
      { label: '요양기관 기호 부여', value: '지정 후 즉시', note: '기호 부여 후 바로 청구 가능' },
      { label: '수수료', value: '무료' },
    ],
    timeline: {
      recommendedStart: '개원 1개월 전',
      duration: '2~3주',
      deadline: '개원일 전 반드시 완료',
      durationRange: [14, 21],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    expertAdvice: '요양기관 지정은 개원일을 역산하여 최소 3주 전에 신청하세요. 서류 보완이 필요한 경우 추가 1주가 걸릴 수 있습니다.',
    regulations: [
      '국민건강보험법 제42조: 요양기관 지정 요건',
      '국민건강보험법 시행규칙 제15조: 요양기관 시설·인력 기준',
    ],
    failureCases: [
      {
        title: '요양기관 미지정 상태에서 건강보험 청구',
        description: '개원 후 요양기관 지정 완료 전에 건강보험 진료비 청구',
        consequence: '불법 청구로 환수 처분, 행정 처분(업무정지) 가능',
        prevention: '요양기관 기호 부여 확인 후 건강보험 청구 시작',
      },
      {
        title: '신청 지연으로 개원일 차질',
        description: '요양기관 지정 신청을 개원 1주 전에야 진행',
        consequence: '개원 후 2~3주간 건강보험 청구 불가, 환자 이탈',
        prevention: '개원 최소 4주 전에 신청하여 서류 보완 기간까지 확보',
      },
    ],
    contacts: [
      { organization: '관할 보건소', department: '의료기관 관리과', description: '의료기관 개설 신고 접수 및 안내' },
      { organization: '보건복지부 콜센터', phone: '129', url: 'https://www.mohw.go.kr', description: '보건의료 관련 민원 상담' },
      { organization: '건강보험심사평가원', department: '요양기관 관리부', phone: '1644-2000', url: 'https://www.hira.or.kr', description: '요양기관 지정 신청 및 심사 문의' },
    ],
    legalRisks: [
      '요양기관 미지정 상태에서 건강보험 청구 시 사기죄 적용 가능',
      '허위 서류 제출 시 요양기관 지정 취소 및 형사 처벌',
    ],
  },
  '3-4': {
    steps: [
      '지역 내 의료폐기물 처리업체 2~3곳에 견적을 요청합니다',
      '수거 주기, 비용, 계약 조건을 비교합니다',
      '위탁 계약을 체결합니다',
      '의료폐기물 전용 용기를 설치합니다',
    ],
    tips: [
      '월 수거 횟수는 진료량에 따라 조절 가능하니 초기에는 최소로 시작하세요',
      '인근 의원과 공동 계약하면 비용을 절감할 수 있습니다',
    ],
    warnings: [
      '의료폐기물 무단 처리 시 과태료와 행정 처분을 받습니다',
      '의료폐기물 관리 대장을 반드시 작성해야 합니다',
    ],
    documents: [
      '의료폐기물 위탁 계약서',
      '폐기물 관리 대장',
    ],
    resources: [
      { name: '올바로시스템', url: 'https://www.allbaro.or.kr', description: '의료폐기물 관리 시스템 (배출/수거/처리 추적)', type: 'government' },
      { name: '지역 의료폐기물 처리업체', description: '관할 구청에서 허가 업체 목록 확인 가능', type: 'website' },
    ],
    benchmarks: [
      { label: '월 처리 비용', value: '5~20만원', note: '수거 주기·진료량에 따라 차이' },
      { label: '수거 주기', value: '주 1~2회', note: '초기에는 주 1회로 충분' },
      { label: '전용 용기 비용', value: '1~3만원/개', note: '업체에서 제공하기도 함' },
    ],
    timeline: {
      recommendedStart: '개원 1개월 전',
      duration: '3~5일',
      deadline: '개원일 전 계약 완료',
      durationRange: [3, 5],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    expertAdvice: '의료폐기물 처리는 법적 의무입니다. 올바로시스템에 반드시 가입하고, 폐기물 관리 대장을 매일 기록하세요. 점검 시 가장 많이 적발되는 항목입니다.',
    regulations: [
      '폐기물관리법 제18조: 의료폐기물 위탁 처리 의무',
      '폐기물관리법 시행규칙: 의료폐기물 전용 용기 사용 의무',
      '위반 시 과태료 100만~1,000만원',
    ],
    failureCases: [
      {
        title: '의료폐기물 일반쓰레기로 처리',
        description: '비용 절감을 위해 의료폐기물을 일반 폐기물과 혼합 처리',
        consequence: '과태료 최대 1,000만원, 의료기관 행정처분(업무정지)',
        prevention: '반드시 허가된 의료폐기물 전문 처리업체와 위탁 계약 체결',
      },
    ],
  },
  '3-5': {
    steps: [
      'X-ray 등 방사선 장비 구매 계약 시 신고 절차를 확인합니다',
      '관할 지자체에 진단용 방사선 발생장치 설치 신고서를 제출합니다',
      '방사선 안전관리자를 지정합니다',
      '방사선 차폐 시설 검사를 받습니다',
    ],
    tips: [
      '방사선 차폐 공사는 인테리어 시 함께 진행하면 비용을 절약할 수 있습니다',
      '방사선 장비가 없는 진료과는 이 단계를 건너뛰세요',
    ],
    warnings: [
      '방사선 장비 미신고 사용 시 벌금 및 행정 처분 대상입니다',
      '정기 안전검사(3년마다)를 놓치면 안 됩니다',
    ],
    documents: [
      '방사선 발생장치 설치 신고서',
      '방사선 안전관리자 지정서',
      '차폐 시설 검사 성적서',
    ],
    resources: [
      { name: '식품의약품안전처', url: 'https://www.mfds.go.kr', description: '진단용 방사선 장비 신고 및 안전관리', type: 'government' },
      { name: '원자력안전위원회', url: 'https://www.nssc.go.kr', description: '방사선 안전 규제 정보', type: 'government' },
      { name: '한국원자력안전재단', url: 'https://www.kins.re.kr', description: '방사선 안전교육, 검사 안내', type: 'government' },
    ],
    benchmarks: [
      { label: '차폐 공사 비용', value: '500~2,000만원', note: '납(Pb) 차폐, 방 크기에 따라 차이' },
      { label: '정기 안전검사 주기', value: '3년마다', note: '식약처 인정 검사기관에서 실시' },
      { label: '안전관리자 교육', value: '신규 8시간, 보수 4시간', note: '온라인 교육 가능' },
      { label: '검사 비용', value: '30~50만원/회', note: '장비 수에 따라 차이' },
    ],
    timeline: {
      recommendedStart: '인테리어 착공 시 (차폐 공사)',
      duration: '2~4주',
      deadline: '장비 설치 전 차폐 완료 + 검사 통과',
      durationRange: [14, 28],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    expertAdvice: '차폐 공사는 반드시 인테리어와 동시에 진행하세요. 완공 후 차폐 공사를 하면 벽체 재시공이 필요해 비용이 2배로 늘어납니다.',
    regulations: [
      '진단용 방사선 발생장치의 안전관리에 관한 규칙',
      '의료법 시행규칙 제34조: 방사선 장비 신고 의무',
      '미신고 운영 시 1년 이하 징역 또는 1천만원 이하 벌금',
    ],
    failureCases: [
      {
        title: '차폐 공사 누락 후 장비 설치',
        description: '인테리어 완공 후 차폐 공사 없이 X-ray 장비 설치',
        consequence: '방사선 안전검사 불합격, 벽체 재시공 비용 2배 발생, 개원 4~6주 지연',
        prevention: '인테리어 착공 시 차폐 공사를 동시에 포함하여 설계',
      },
      {
        title: '방사선 장비 미신고 운영',
        description: '장비 설치 후 관할 지자체에 신고하지 않고 사용',
        consequence: '1년 이하 징역 또는 1천만원 이하 벌금, 장비 사용 중지 명령',
        prevention: '장비 구매 계약 시점부터 신고 절차를 병행하여 진행',
      },
    ],
    legalRisks: [
      '미신고 방사선 장비 운영 시 1년 이하 징역 또는 1천만원 이하 벌금',
      '방사선 안전관리자 미지정 시 과태료 부과',
      '정기 안전검사 미이행 시 시정명령 및 과태료',
    ],
  },
  '3-6': {
    steps: [
      '의원 전문 세무사 2~3곳에 상담을 받습니다',
      '기장 대행 범위와 월 수수료를 비교합니다',
      '노무사에게 4대보험, 근로계약서 자문을 의뢰합니다',
      '세무사/노무사와 계약을 체결합니다',
    ],
    tips: [
      '의원 전문 세무사가 절세 노하우가 많습니다',
      '세무사 기장료는 월 20~50만 원 수준이 일반적입니다',
      '세무사 선정 시 실시간 소통 가능 여부를 확인하세요',
    ],
    warnings: [
      '종합소득세 신고를 놓치면 가산세가 부과됩니다',
      '4대보험 미가입 시 과태료와 소급 납부 부담이 발생합니다',
    ],
    documents: [
      '세무 기장 계약서',
      '노무 자문 계약서',
    ],
    resources: [
      { name: '한국세무사회', url: 'https://www.kacpta.or.kr', description: '세무사 찾기, 세무 상담 안내', type: 'community' },
      { name: '한국공인노무사회', url: 'https://www.cpla.or.kr', description: '노무사 찾기, 노동 상담', type: 'community' },
      { name: '홈택스', url: 'https://www.hometax.go.kr', description: '세금 신고/납부, 전자세금계산서', type: 'government' },
      { name: '4대사회보험 정보연계센터', url: 'https://www.4insure.or.kr', description: '4대보험 가입/신고 통합 처리', type: 'government' },
    ],
    benchmarks: [
      { label: '세무사 월 기장료', value: '20~50만원', note: '매출 규모, 직원 수에 따라 차이' },
      { label: '노무사 월 자문료', value: '10~30만원', note: '직원 5인 이하 소규모 기준' },
      { label: '종합소득세율 (과세표준)', value: '6~45%', source: '소득세법', note: '누진세율, 의원 매출 규모에 따라 적용' },
      { label: '4대보험 사업주 부담', value: '약 9.5%', note: '국민연금 4.5%, 건보 3.5%, 고용 0.9%, 산재 0.6%' },
    ],
    timeline: {
      recommendedStart: '개원 2개월 전',
      duration: '1~2주',
      deadline: '직원 채용 전 노무사 확보',
      durationRange: [7, 14],
      regionalVariation: '서울/경기 처리기간 7~14일, 지방 3~7일',
    },
    subChecklists: [
      {
        label: '세무사 선정 체크리스트',
        items: [
          '의원/병원 전문 세무사인지 확인',
          '기장 범위 (부가세, 종소세, 원천세, 4대보험)',
          '카카오톡/전화 실시간 소통 가능 여부',
          '절세 전략 제안 경험',
          '월 기장료 및 결산료',
          '추가 비용 항목 (신고 대행, 세무조사 대응 등)',
        ],
      },
    ],
    expertAdvice: '세무사는 "가격"보다 "소통"이 중요합니다. 개원 초기에는 세무 관련 질문이 매우 많은데, 카톡/전화로 바로 답변해주는 세무사가 시간과 비용을 아껴줍니다.',
    regulations: [
      '소득세법: 종합소득세 확정신고 (5월)',
      '부가가치세법: 분기별 부가세 신고 (과세 매출 있는 경우)',
      '근로기준법: 임금대장 작성 의무',
      '4대보험 관련 법: 직원 채용 시 14일 이내 가입 신고',
    ],
    failureCases: [
      {
        title: '세무사 없이 직접 세무 처리',
        description: '비용 절감을 위해 세무사 없이 직접 기장 및 신고 시도',
        consequence: '종합소득세 신고 오류로 가산세 20% 추가 부과, 세무조사 대상',
        prevention: '월 20~50만원의 기장료는 절세 효과와 시간 절약을 고려하면 필수 투자',
      },
      {
        title: '4대보험 미가입 상태로 직원 채용',
        description: '비용 부담으로 직원 4대보험 가입을 미루거나 누락',
        consequence: '소급 납부 + 과태료, 직원 산재 사고 시 사업주 전액 부담',
        prevention: '직원 채용 14일 이내 4대보험 가입 신고 — 노무사 활용으로 누락 방지',
      },
    ],
  },
}

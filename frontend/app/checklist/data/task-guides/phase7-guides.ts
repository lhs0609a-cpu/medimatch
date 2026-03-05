import type { TaskGuide } from './types'

export const phase7Guides: Record<string, TaskGuide> = {
  '7-1': {
    steps: [
      '의원의 브랜드 콘셉트(색상, 톤, 이미지)를 결정합니다',
      '로고 디자인을 전문 디자이너에게 의뢰합니다',
      '명함, 진료카드, 봉투, 처방전 양식을 디자인합니다',
      '통일된 CI/BI를 모든 인쇄물과 온라인에 적용합니다',
    ],
    tips: [
      '크몽, 숨고 등 플랫폼에서 합리적 가격에 디자인을 받을 수 있습니다',
      '로고는 간판, 명함, 모바일 모두에서 잘 보이는 심플한 디자인이 좋습니다',
      '진료과 특성에 맞는 색상을 선택하세요 (소아과: 밝은색, 정형외과: 안정적 색)',
    ],
    warnings: [
      '무료 로고 제작 사이트는 저작권 문제가 있을 수 있습니다',
    ],
    resources: [
      { name: '크몽', url: 'https://kmong.com', description: '프리랜서 디자이너 매칭 (로고 5~50만원)', type: 'website' },
      { name: '숨고', url: 'https://soomgo.com', description: '지역 디자이너 매칭 서비스', type: 'website' },
      { name: '캔바', url: 'https://www.canva.com', description: '간단한 명함, 포스터 직접 제작 도구', type: 'tool', lastVerified: '2025-12-01' },
      { name: 'CI/BI 가이드 템플릿', description: '브랜드 가이드라인 작성 양식', type: 'template' },
    ],
    benchmarks: [
      { label: '로고 디자인 (프리랜서)', value: '5~50만원', note: '크몽/숨고 기준' },
      { label: '로고 디자인 (전문 에이전시)', value: '100~300만원', note: 'CI 패키지 포함' },
      { label: 'CI 패키지 (로고+명함+봉투+서식)', value: '30~200만원', note: '범위에 따라 차이' },
      { label: '명함 인쇄 (200매)', value: '1~3만원', note: '일반 용지 기준' },
    ],
    timeline: {
      recommendedStart: '개원 3개월 전',
      duration: '1~2주',
      deadline: '간판/인쇄물 제작 전 완료',
      durationRange: [7, 14],
    },
    expertAdvice: '로고는 "심플한 것"이 최고입니다. 간판에서도, 명함에서도, 카카오톡 프로필에서도 잘 보여야 합니다. 복잡한 로고는 축소 시 알아보기 어렵습니다.',
    failureCases: [
      {
        title: '저작권 문제 있는 로고 사용',
        description: '무료 로고 생성 사이트나 이미지 사이트에서 가져온 이미지를 로고로 사용',
        consequence: '저작권 침해 소송, 간판/인쇄물 전량 교체 비용, 브랜드 이미지 실추',
        prevention: '전문 디자이너에게 의뢰하고, 저작권 양도 계약서를 반드시 수령',
      },
    ],
  },
  '7-2': {
    steps: [
      '네이버 스마트플레이스에 의원 정보를 등록합니다',
      '홈페이지를 제작합니다 (간단한 소개, 진료 안내, 위치)',
      '네이버 블로그를 개설하고 건강 정보 콘텐츠를 준비합니다',
      '카카오맵, 구글맵에도 정보를 등록합니다',
    ],
    tips: [
      '네이버 플레이스 등록은 개원 필수 중의 필수입니다',
      '블로그는 개원 1~2개월 전부터 건강 정보를 포스팅하세요',
      '홈페이지는 모바일 반응형이 필수입니다',
    ],
    warnings: [
      '의료광고 사전심의 대상 여부를 확인하세요',
      '치료 전후 사진, 과장 문구는 의료법 위반입니다',
    ],
    documents: [
      '네이버 스마트플레이스 등록 가이드',
      '의료광고 심의 체크리스트',
    ],
    resources: [
      { name: '네이버 스마트플레이스', url: 'https://smartplace.naver.com', description: '네이버 지도 사업장 등록 (무료, 필수)', type: 'website', lastVerified: '2025-12-01' },
      { name: '아임웹', url: 'https://imweb.me', description: '의원 홈페이지 쉽게 제작 (월 1~3만원)', type: 'tool' },
      { name: '워드프레스', url: 'https://wordpress.com', description: '홈페이지 제작 (자유도 높음)', type: 'tool' },
      { name: '네이버 블로그', url: 'https://blog.naver.com', description: '블로그 개설 (무료, SEO 유리)', type: 'website' },
      { name: '카카오맵 사업장 등록', url: 'https://place.map.kakao.com', description: '카카오맵에 의원 정보 등록', type: 'website' },
      { name: '구글 비즈니스 프로필', url: 'https://business.google.com', description: '구글 지도에 사업장 등록', type: 'website', lastVerified: '2025-11-15' },
    ],
    benchmarks: [
      { label: '홈페이지 제작비 (템플릿)', value: '50~150만원', note: '아임웹, 워드프레스 등' },
      { label: '홈페이지 제작비 (맞춤)', value: '200~500만원', note: '에이전시 제작' },
      { label: '블로그 효과 발현 기간', value: '3~6개월', note: 'SEO 반영까지 시간 필요' },
      { label: '네이버 플레이스 등록', value: '무료', note: '사업자등록증 필요' },
    ],
    timeline: {
      recommendedStart: '개원 2개월 전',
      duration: '1~3주',
      deadline: '개원 1주 전까지 완료',
      durationRange: [7, 21],
    },
    subChecklists: [
      {
        label: '온라인 프레즌스 체크리스트',
        items: [
          '네이버 스마트플레이스 등록',
          '카카오맵 사업장 등록',
          '구글 비즈니스 프로필 등록',
          '홈페이지 제작 (모바일 반응형)',
          '네이버 블로그 개설 + 5개 이상 포스팅',
          '의원 대표 사진 촬영 (외관/내부/의료진)',
          '진료 시간, 주차, 위치 안내 정확히 기재',
        ],
      },
    ],
    expertAdvice: '네이버 플레이스는 "무조건 등록"하세요. 환자의 80% 이상이 네이버에서 의원을 검색합니다. 등록 후 진료 시간, 사진, 소개를 정성껏 작성하면 그 자체가 최고의 마케팅입니다.',
    regulations: [
      '의료법 제56조: 의료광고 제한 (과장, 비교, 보장 광고 금지)',
      '의료법 제57조: 의료광고 사전심의 (일부 항목 의무)',
    ],
    failureCases: [
      {
        title: '네이버 플레이스 미등록',
        description: '홈페이지만 만들고 네이버 스마트플레이스 미등록',
        consequence: '네이버 지도 검색에서 노출 안 됨, 초기 환자 유입 급감',
        prevention: '개원 최소 2주 전 네이버 스마트플레이스 등록 완료',
      },
      {
        title: '모바일 미대응 홈페이지',
        description: 'PC 전용 홈페이지를 제작하여 모바일에서 깨짐',
        consequence: '환자의 80%가 모바일 검색 — 이탈률 급증, 신뢰도 하락',
        prevention: '반드시 모바일 반응형 홈페이지 제작, 모바일에서 먼저 테스트',
      },
    ],
    legalRisks: [
      '의료광고 사전심의 대상 확인 필수 (의료법 제56조)',
      '치료 전후 사진 게시 시 환자 동의서 필수',
    ],
  },
  '7-3': {
    steps: [
      '인스타그램 비즈니스 계정을 개설합니다',
      '카카오톡 채널을 개설하고 자동 응답을 설정합니다',
      '필요 시 유튜브 채널을 개설합니다',
      '주 2~3회 콘텐츠 발행 계획을 수립합니다',
    ],
    tips: [
      '인스타그램은 의원 인테리어, 일상, 건강 팁 위주가 효과적입니다',
      '카카오톡 채널은 예약/문의 채널로 활용도가 높습니다',
      '개원 전부터 콘텐츠를 쌓아두면 개원 시 신뢰도가 올라갑니다',
    ],
    warnings: [
      'SNS 의료광고도 의료법 규제를 받습니다',
      '환자 사진/사례 게시 시 반드시 동의를 받으세요',
    ],
    resources: [
      { name: '인스타그램 비즈니스', url: 'https://business.instagram.com', description: '비즈니스 계정 전환 및 인사이트 제공', type: 'website', lastVerified: '2025-12-01' },
      { name: '카카오톡 채널', url: 'https://center-pf.kakao.com', description: '카카오톡 비즈니스 채널 개설', type: 'website' },
      { name: '유튜브 스튜디오', url: 'https://studio.youtube.com', description: '유튜브 채널 관리 도구', type: 'website' },
      { name: 'SNS 콘텐츠 캘린더 템플릿', description: '주간/월간 콘텐츠 발행 계획표', type: 'template', lastVerified: '2025-11-01' },
    ],
    benchmarks: [
      { label: '적정 콘텐츠 게시 빈도', value: '주 2~3회', note: '일관성이 중요' },
      { label: '인스타그램 팔로워 100명 도달', value: '1~2개월', note: '꾸준한 포스팅 시' },
      { label: '카카오톡 채널 개설', value: '무료', note: '자동 응답, 예약 기능 포함' },
      { label: '콘텐츠 외주 제작비', value: '5~20만원/건', note: '사진+텍스트 기준' },
    ],
    timeline: {
      recommendedStart: '개원 2개월 전',
      duration: '지속 운영',
      deadline: '개원 전 최소 10개 콘텐츠 확보',
      durationRange: [14, 60],
      seasonalImpact: ['1~2월: 새해 건강 다짐 콘텐츠 반응 좋음', '환절기(3~4월, 9~10월): 건강 관련 콘텐츠 조회수 증가'],
    },
    expertAdvice: 'SNS는 "판매"가 아니라 "신뢰 구축"입니다. 의원 일상, 의료진 소개, 건강 정보를 진정성 있게 올리면 자연스럽게 환자가 찾아옵니다. 광고성 게시물은 역효과입니다.',
    failureCases: [
      {
        title: 'SNS 개설 후 방치',
        description: '인스타그램/카카오톡 채널을 개설만 하고 콘텐츠를 올리지 않음',
        consequence: '빈 계정은 오히려 신뢰도 하락, "폐업한 곳인가?" 인상',
        prevention: '주 2~3회 콘텐츠 발행 계획 수립, 1개월분 콘텐츠를 미리 제작해 예약 발행',
      },
      {
        title: '의료법 위반 콘텐츠 게시',
        description: 'SNS에 환자 동의 없이 시술 전후 사진 게시, "최고", "유일" 등 과장 표현 사용',
        consequence: '의료법 위반으로 과태료, 심의 위반 시 광고 중단 명령',
        prevention: 'SNS 게시 전 의료광고 가이드라인 체크, 환자 동의서 확보, 과장 표현 자제',
      },
    ],
    legalRisks: [
      'SNS 의료광고도 의료법 적용 — "최고", "유일" 등 표현 금지',
      '환자 후기 대가성 작성 적발 시 의료법 위반',
    ],
    specialtyOverrides: {
      'dermatology': {
        tips: [
          '인스타그램이 핵심 채널 — 비포/애프터 콘텐츠 필수',
          '릴스(Reels) 활용 시 도달률 3~5배 증가',
          '시술 과정 타임랩스 콘텐츠 인기',
        ],
      },
      'plastic-surgery': {
        tips: [
          '유튜브 수술 브이로그 효과적',
          '카카오톡 상담 연동 필수',
        ],
      },
      'pediatrics': {
        tips: [
          '맘카페/육아커뮤니티가 핵심',
          '카카오톡 알림톡으로 예방접종 리마인더',
        ],
      },
      'internal': {
        tips: [
          '네이버 블로그 건강정보 콘텐츠가 핵심',
          '건강검진 패키지 비교 콘텐츠 효과적',
        ],
      },
    },
  },
  '7-4': {
    steps: [
      '의원 반경 2km 내 아파트, 오피스 밀집 지역을 파악합니다',
      '전단지, 현수막, 엘리베이터 광고 등을 기획합니다',
      '지역 맘카페, 주민센터 게시판을 활용합니다',
      '인근 약국, 다른 진료과 의원과 협력 관계를 구축합니다',
    ],
    tips: [
      '아파트 우편함 전단지보다 엘리베이터 광고가 효과적입니다',
      '개원 축하 화환 대신 인근 주민 무료 검진 이벤트가 더 효과적입니다',
      '약국과 좋은 관계를 유지하면 환자 소개가 이어집니다',
    ],
    warnings: [
      '현수막 설치는 구청 허가가 필요합니다',
      '과도한 무료 진료 이벤트는 의료법상 제한될 수 있습니다',
    ],
    resources: [
      { name: '포커스미디어', url: 'https://www.focusmedia.co.kr', description: '아파트 엘리베이터 광고 1위 업체', type: 'website' },
      { name: '비스타프린트', url: 'https://www.vistaprint.co.kr', description: '전단지, 명함, 현수막 온라인 인쇄', type: 'website' },
      { name: '지역 맘카페 (네이버)', description: '지역별 육아/생활 커뮤니티 광고', type: 'community' },
      { name: '당근마켓 동네광고', url: 'https://www.daangn.com', description: '지역 기반 광고 플랫폼', type: 'website', lastVerified: '2025-11-20' },
    ],
    benchmarks: [
      { label: '전단지 인쇄 (1,000매)', value: '3~5만원', note: 'A4 양면 기준' },
      { label: '엘리베이터 광고', value: '월 10~30만원/대', note: '아파트 단지 규모에 따라' },
      { label: '현수막 제작+설치', value: '5~15만원/개', note: '구청 허가 필요' },
      { label: '당근마켓 동네광고', value: '일 5,000원~', note: '노출 기반 과금' },
      { label: '지역 마케팅 월 예산 (초기)', value: '30~100만원' },
    ],
    timeline: {
      recommendedStart: '개원 1개월 전',
      duration: '1~2주 (기획+제작)',
      deadline: '개원 1주 전부터 배포 시작',
      durationRange: [7, 14],
    },
    costBreakdown: [
      { label: '전단지 (디자인+인쇄 1,000매)', value: '10~20만원' },
      { label: '현수막 (제작+설치 3개)', value: '15~45만원' },
      { label: '엘리베이터 광고 (3개월)', value: '90~270만원', note: '3대 기준' },
      { label: '지역 커뮤니티 광고', value: '무료~10만원' },
      { label: '개원 이벤트 비용', value: '50~200만원' },
    ],
    expertAdvice: '지역 마케팅의 핵심은 "약국 관계"입니다. 인근 약국 약사와 좋은 관계를 형성하면, 약국을 찾는 환자에게 자연스럽게 소개받을 수 있습니다. 개원 인사 시 약국을 꼭 방문하세요.',
    failureCases: [
      {
        title: '전단지에만 의존한 마케팅',
        description: '아파트 우편함에 전단지 대량 배포만 진행',
        consequence: '대부분 바로 폐기됨, 비용 대비 환자 유입 미미',
        prevention: '전단지는 보조 수단으로만 활용, 엘리베이터 광고/당근마켓/맘카페 병행',
      },
    ],
  },
  '7-5': {
    steps: [
      '네이버 검색광고(파워링크) 계정을 개설합니다',
      '핵심 키워드(지역명 + 진료과)를 선정합니다',
      '월 광고 예산을 설정합니다 (초기 50~100만 원 권장)',
      '광고 성과를 주간 단위로 모니터링합니다',
    ],
    tips: [
      '초기에는 네이버 검색광고에 집중하는 것이 효율적입니다',
      '"OO동 내과", "OO역 피부과" 등 지역 키워드가 전환율이 높습니다',
      '메디플라톤 마케팅 비용 분석으로 ROI를 추적하세요',
    ],
    warnings: [
      '광고 문구도 의료광고 심의 대상이 될 수 있습니다',
      '클릭 단가가 높은 키워드는 예산이 빠르게 소진됩니다',
    ],
    resources: [
      { name: '네이버 검색광고', url: 'https://searchad.naver.com', description: '파워링크 광고 (CPC 과금)', type: 'tool', lastVerified: '2025-12-01' },
      { name: '카카오 모먼트', url: 'https://moment.kakao.com', description: '카카오 디스플레이 광고', type: 'tool' },
      { name: '당근마켓 비즈프로필', url: 'https://www.daangn.com', description: '동네 기반 광고 (저비용)', type: 'website' },
      { name: '메디플라톤 마케팅 분석', description: 'ROI 추적, 광고 효과 분석 도구', type: 'tool' },
    ],
    benchmarks: [
      { label: 'CPC (의료 키워드)', value: '500~3,000원', note: '진료과/지역별 차이 큼' },
      { label: '초기 월 광고 예산', value: '50~100만원', note: '네이버 검색광고 기준' },
      { label: '광고 전환율 (클릭→예약)', value: '3~8%', note: '랜딩페이지 품질에 따라' },
      { label: '월 예산 대비 신환 유입', value: '10~30명', note: 'CPC 1,000원, 전환율 5% 가정' },
    ],
    timeline: {
      recommendedStart: '개원 2주 전',
      duration: '지속 운영',
      deadline: '개원일에 광고 라이브',
      durationRange: [14, 90],
    },
    subChecklists: [
      {
        label: '온라인 광고 세팅 체크리스트',
        items: [
          '네이버 검색광고 계정 개설',
          '핵심 키워드 20개 이상 선정',
          '광고 문구 작성 (의료법 준수)',
          '일 예산 설정 (초기 2~3만원/일)',
          '랜딩페이지 준비 (네이버 플레이스 or 홈페이지)',
          '전환 추적 설정 (전화, 예약)',
          '주간 성과 리포트 확인 루틴 수립',
        ],
      },
    ],
    expertAdvice: '온라인 광고의 핵심은 "키워드 선택"입니다. "내과" 같은 빅키워드는 비용만 들고, "강남역 내과 야간진료"처럼 구체적인 롱테일 키워드가 실제 환자를 데려옵니다.',
    regulations: [
      '의료법 제56조: 의료광고 제한 규정',
      '의료법 제57조: 일부 의료광고 사전심의 의무',
    ],
    failureCases: [
      {
        title: '광고비 과다 지출',
        description: '개원 첫 달부터 월 500만원 이상 온라인 광고 집행',
        consequence: 'ROI 분석 없이 예산 소진, 광고 의존도 과다',
        prevention: '첫 3개월은 월 100~200만원으로 테스트, 채널별 전환율 분석 후 증액',
      },
      {
        title: '빅키워드만 집행',
        description: '"피부과", "내과" 등 대형 키워드에만 광고 집행',
        consequence: 'CPC 3,000원 이상으로 예산 빠르게 소진, 전환율 낮음',
        prevention: '"OO동 피부과", "OO역 내과 야간진료" 등 지역+세부 롱테일 키워드 위주로 집행',
      },
    ],
    legalRisks: [
      '키워드 광고에 "100% 치료" 등 보장 문구 사용 불가',
      '비급여 가격 허위 표시 시 과태료',
    ],
  },
  '7-6': {
    steps: [
      '네이버 예약 시스템을 연동합니다',
      '카카오톡 예약 기능을 활성화합니다',
      '전화 예약 프로세스를 정립합니다',
      '예약 → 알림(SMS/카톡) → 내원 → 후속 안내 흐름을 설계합니다',
    ],
    tips: [
      '네이버 예약은 무료이며 환자 유입에 매우 효과적입니다',
      '예약 부도율을 줄이려면 전일 알림 메시지를 보내세요',
      '초진 환자 문진표를 온라인으로 미리 작성하게 하면 효율적입니다',
    ],
    warnings: [
      '예약 시스템이 EMR과 연동되는지 확인하세요',
      '개인정보 수집/이용 동의를 받아야 합니다',
    ],
    resources: [
      { name: '네이버 예약', url: 'https://booking.naver.com', description: '네이버 플레이스 연동 무료 예약 시스템', type: 'tool', lastVerified: '2025-12-01' },
      { name: '카카오 예약', description: '카카오톡 채널을 통한 예약 기능', type: 'tool' },
      { name: '똑닥', url: 'https://www.ddocdoc.com', description: '의원 전용 비대면 접수/예약 앱', type: 'website', lastVerified: '2025-11-20' },
      { name: '예약 프로세스 플로우차트', description: '예약→알림→내원→후속 안내 흐름도', type: 'template' },
    ],
    benchmarks: [
      { label: '네이버 예약 비용', value: '무료', note: '네이버 플레이스 등록 필수' },
      { label: '똑닥 이용료', value: '월 5~15만원', note: '기능 범위에 따라' },
      { label: '예약 부도율 (알림 미발송)', value: '15~20%', note: '전일 알림 시 5~10%로 감소' },
      { label: '온라인 예약 비율 (안정기)', value: '30~50%', note: '나머지는 전화/당일 방문' },
    ],
    timeline: {
      recommendedStart: '개원 2주 전',
      duration: '3~5일',
      deadline: '개원일에 예약 오픈',
      durationRange: [3, 5],
    },
    expertAdvice: '네이버 예약은 "필수"입니다. 환자의 60% 이상이 "지금 예약 가능한 병원"을 찾습니다. 네이버 플레이스에서 바로 예약 버튼이 보이면 전환율이 3배 이상 올라갑니다.',
    failureCases: [
      {
        title: '예약 시스템 미연동',
        description: '네이버 예약과 EMR이 연동되지 않아 수동으로 예약 관리',
        consequence: '이중 예약, 시간대 겹침, 환자 대기 시간 증가, 직원 업무 과중',
        prevention: 'EMR 선정 시 네이버 예약 연동 지원 여부 확인, 연동 가능한 예약 시스템 선택',
      },
    ],
  },
}

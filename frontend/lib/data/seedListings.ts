/**
 * 시드 데이터 - 매물 목록
 * 플랫폼이 활성화되어 보이도록 대량의 가짜 매물 데이터
 */

// 지역 데이터
const regions = [
  { code: 'seoul-gangnam', name: '서울 강남구', subAreas: ['역삼동', '삼성동', '청담동', '논현동', '신사동', '압구정동', '대치동', '도곡동'] },
  { code: 'seoul-seocho', name: '서울 서초구', subAreas: ['서초동', '방배동', '반포동', '잠원동', '양재동'] },
  { code: 'seoul-songpa', name: '서울 송파구', subAreas: ['잠실동', '신천동', '삼전동', '석촌동', '송파동', '방이동', '오금동'] },
  { code: 'seoul-mapo', name: '서울 마포구', subAreas: ['합정동', '상수동', '서교동', '연남동', '망원동', '공덕동'] },
  { code: 'seoul-yeongdeungpo', name: '서울 영등포구', subAreas: ['여의도동', '당산동', '영등포동', '문래동'] },
  { code: 'seoul-gangdong', name: '서울 강동구', subAreas: ['천호동', '길동', '명일동', '고덕동', '암사동'] },
  { code: 'seoul-jongno', name: '서울 종로구', subAreas: ['종로동', '혜화동', '명륜동', '삼청동'] },
  { code: 'seoul-jung', name: '서울 중구', subAreas: ['명동', '을지로', '충무로', '회현동'] },
  { code: 'gyeonggi-seongnam', name: '경기 성남시', subAreas: ['분당구', '수정구', '중원구'] },
  { code: 'gyeonggi-suwon', name: '경기 수원시', subAreas: ['영통구', '권선구', '장안구', '팔달구'] },
  { code: 'gyeonggi-yongin', name: '경기 용인시', subAreas: ['수지구', '기흥구', '처인구'] },
  { code: 'gyeonggi-goyang', name: '경기 고양시', subAreas: ['일산동구', '일산서구', '덕양구'] },
  { code: 'busan-haeundae', name: '부산 해운대구', subAreas: ['해운대동', '우동', '중동', '좌동'] },
  { code: 'busan-suyeong', name: '부산 수영구', subAreas: ['광안동', '수영동', '민락동'] },
  { code: 'daegu-suseong', name: '대구 수성구', subAreas: ['범어동', '수성동', '황금동', '지산동'] },
  { code: 'incheon-yeonsu', name: '인천 연수구', subAreas: ['송도동', '연수동', '청학동'] },
]

const hospitalTypes = ['내과', '정형외과', '피부과', '치과', '한의원', '이비인후과', '안과', '산부인과', '소아청소년과', '비뇨기과', '신경외과', '재활의학과']
const pharmacyTypes = ['일반약국', '조제전문', '한약', '병원내약국']

// 랜덤 유틸리티
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

// 건물 매물 생성
export interface BuildingListing {
  id: string
  title: string
  region: string
  regionCode: string
  address: string
  floor: string
  areaPyeong: number
  deposit: number // 만원
  monthlyRent: number // 만원
  maintenanceFee: number // 만원
  premium: number // 만원
  preferredTenants: string[]
  nearbyHospitals: string[]
  hasParking: boolean
  hasElevator: boolean
  buildingAge: number
  status: 'ACTIVE' | 'RESERVED' | 'CONTRACTED'
  viewCount: number
  inquiryCount: number
  createdAt: string
  isVerified: boolean
  thumbnailIndex: number
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  currentViewers: number
  lastInquiryTime: string
  urgencyTag?: string
}

export function generateBuildingListings(count: number = 120): BuildingListing[] {
  const listings: BuildingListing[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const region = randomChoice(regions)
    const subArea = randomChoice(region.subAreas)
    const areaPyeong = randomInt(15, 80)
    const isGoodLocation = Math.random() > 0.6
    const createdHoursAgo = randomInt(0, 60 * 24) // 0~60일 전
    const isNew = createdHoursAgo < 24 // 24시간 이내
    const isHot = Math.random() > 0.75

    // 긴급성 태그
    const urgencyTags = ['오늘 마감', '이번 주 계약 예정', '급매', '협의 가능', '선착순']
    const hasUrgency = Math.random() > 0.8

    listings.push({
      id: `bld-${generateId()}`,
      title: `${subArea} ${isGoodLocation ? '역세권 ' : ''}${randomChoice(['메디컬빌딩', '상가', '오피스텔', '빌딩'])} ${randomInt(1, 10)}층`,
      region: region.name,
      regionCode: region.code,
      address: `${region.name} ${subArea}`,
      floor: `${randomInt(1, 15)}층`,
      areaPyeong,
      deposit: randomInt(3000, 30000),
      monthlyRent: randomInt(150, 800),
      maintenanceFee: randomInt(10, 50),
      premium: Math.random() > 0.3 ? randomInt(1000, 15000) : 0,
      preferredTenants: randomChoices(hospitalTypes, randomInt(2, 4)),
      nearbyHospitals: randomChoices(hospitalTypes, randomInt(1, 3)),
      hasParking: Math.random() > 0.3,
      hasElevator: Math.random() > 0.2,
      buildingAge: randomInt(1, 25),
      status: Math.random() > 0.85 ? 'RESERVED' : 'ACTIVE',
      viewCount: randomInt(50, 500),
      inquiryCount: randomInt(3, 30),
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isVerified: Math.random() > 0.4,
      thumbnailIndex: randomInt(1, 8),
      isHot,
      isNew,
      currentViewers: isHot ? randomInt(3, 15) : randomInt(0, 5),
      lastInquiryTime: getRelativeTime(randomInt(1, 180)), // 1~180분 전
      urgencyTag: hasUrgency ? randomChoice(urgencyTags) : undefined,
    })
  }

  // 최신순 정렬
  return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 익명 약국 매물 생성
export interface PharmacyListing {
  id: string
  anonymousId: string
  region: string
  regionCode: string
  pharmacyType: string
  nearbyHospitals: string[]
  monthlyRevenueMin: number // 만원
  monthlyRevenueMax: number // 만원
  monthlyRxCount: number
  premiumMin: number // 만원
  premiumMax: number // 만원
  monthlyRent: number // 만원
  deposit: number // 만원
  operationYears: number
  transferReason: string
  hasAutoDispenser: boolean
  hasParking: boolean
  floorInfo: string
  status: 'ACTIVE' | 'PAUSED' | 'MATCHED'
  viewCount: number
  interestCount: number
  matchScore?: number
  createdAt: string
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  currentViewers: number
  lastInterestTime: string
  urgencyTag?: string
  competitionLevel: 'low' | 'medium' | 'high'
}

const transferReasons = ['은퇴', '이주', '건강', '진로변경', '가족사정', '기타']

export function generatePharmacyListings(count: number = 80): PharmacyListing[] {
  const listings: PharmacyListing[] = []
  const now = Date.now()
  let idCounter = 1

  for (let i = 0; i < count; i++) {
    const region = randomChoice(regions)
    const baseRevenue = randomInt(3000, 15000)
    const createdHoursAgo = randomInt(0, 45 * 24)
    const isNew = createdHoursAgo < 24
    const isHot = Math.random() > 0.7
    const interestCount = randomInt(5, 40)

    const urgencyTags = ['관심자 다수', '협의 진행중', '급양도', '우대조건 있음']
    const hasUrgency = Math.random() > 0.75

    listings.push({
      id: `phm-${generateId()}`,
      anonymousId: `${region.name.slice(0, 2)}-2024-${String(idCounter++).padStart(3, '0')}`,
      region: region.name,
      regionCode: region.code,
      pharmacyType: randomChoice(pharmacyTypes),
      nearbyHospitals: randomChoices(hospitalTypes, randomInt(2, 5)),
      monthlyRevenueMin: baseRevenue - randomInt(500, 1500),
      monthlyRevenueMax: baseRevenue + randomInt(500, 1500),
      monthlyRxCount: randomInt(800, 4000),
      premiumMin: randomInt(5000, 20000),
      premiumMax: randomInt(20000, 50000),
      monthlyRent: randomInt(200, 600),
      deposit: randomInt(5000, 20000),
      operationYears: randomInt(3, 20),
      transferReason: randomChoice(transferReasons),
      hasAutoDispenser: Math.random() > 0.4,
      hasParking: Math.random() > 0.3,
      floorInfo: Math.random() > 0.7 ? '1층' : `${randomInt(2, 5)}층`,
      status: Math.random() > 0.9 ? 'MATCHED' : 'ACTIVE',
      viewCount: randomInt(30, 300),
      interestCount,
      matchScore: randomInt(65, 98),
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isHot,
      isNew,
      currentViewers: isHot ? randomInt(2, 12) : randomInt(0, 4),
      lastInterestTime: getRelativeTime(randomInt(1, 120)),
      urgencyTag: hasUrgency ? randomChoice(urgencyTags) : undefined,
      competitionLevel: interestCount > 25 ? 'high' : interestCount > 15 ? 'medium' : 'low',
    })
  }

  return listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 커뮤니티 게시글 생성
export interface CommunityPost {
  id: string
  category: string
  title: string
  content: string
  authorType: 'doctor' | 'pharmacist' | 'landlord' | 'expert'
  authorName: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  isPinned: boolean
  tags: string[]
  // 새로운 필드들
  isHot: boolean
  isNew: boolean
  lastCommentTime?: string
  authorBadge?: string
}

const postCategories = ['개원정보', '약국운영', '매물후기', '질문답변', '업계소식', '세무/법률', '장비/인테리어']

const sampleTitles = [
  { category: '개원정보', titles: [
    '강남역 근처 개원 3개월차 후기 공유합니다',
    '정형외과 개원 비용 정리 (실제 견적 포함)',
    '피부과 개원 시 꼭 알아야 할 5가지',
    '첫 개원, 입지 선정 어떻게 하셨나요?',
    '개원 자금 대출 후기 (시중은행 vs 의사전용)',
    '40평대 내과 개원 인테리어 비용 공개',
    '신도시 vs 구도심, 개원 입지 고민입니다',
    '개원 1년차, 월 매출 3억 달성 후기',
    '소아과 개원, 예상보다 어려웠던 점들',
    '내과 개원 준비 체크리스트 공유합니다',
  ]},
  { category: '약국운영', titles: [
    '조제료 수익 극대화 노하우 공유',
    '약국 직원 관리 꿀팁 (5년차 경험담)',
    '자동조제기 도입 후기 - 생각보다 만족',
    '일일 처방전 200건 넘기는 비결',
    '약국 위치 선정, 병원 종류별 차이점',
    '온라인 판매 시작했는데 수익 괜찮네요',
    '약국 인수 vs 신규 개국, 뭐가 나을까요?',
    '편의점 약국 가능할까요? 경험담',
    '약국 마케팅, SNS 활용법 공유',
    '직원 채용 시 꼭 확인해야 할 것들',
  ]},
  { category: '매물후기', titles: [
    '여기서 매물 보고 계약했습니다 (솔직후기)',
    '3개월 만에 좋은 자리 찾았어요!',
    '매물 문의 팁 공유 (이렇게 하면 답변 빨리 옴)',
    '서초구 약국 인수 완료 - 과정 공유',
    '메디컬빌딩 입주 후기 (장단점)',
    '권리금 협상 성공 노하우',
    '건물주와 직거래 vs 중개 어떤게 나을까요',
    '강남 메디컬빌딩 비교 후기',
    '분당 약국 인수 성공기',
    '송파구 개원 후기 - 6개월 차',
  ]},
  { category: '질문답변', titles: [
    '처음 개원하는데 보증보험 꼭 필요한가요?',
    '약국 권리금 적정 수준이 어느 정도인가요?',
    '의료기기 리스 vs 구매 뭐가 유리할까요?',
    '간호사 채용 어디서 하시나요?',
    '처방전 예상 매출 계산하는 방법 있나요?',
    'EMR 프로그램 추천 부탁드립니다',
    '개원 전 수련 기간 얼마나 필요할까요?',
    '약국 POS 시스템 추천해주세요',
    '의료광고 규정 질문드립니다',
    '건물 계약 시 주의사항이 뭔가요?',
  ]},
  { category: '업계소식', titles: [
    '2024년 수가 인상 소식 정리',
    '비급여 진료 트렌드 변화 분석',
    '신규 메디컬빌딩 입점 정보 모음',
    '의료광고 규제 변경 사항 안내',
    '약사 인력난 심각해지고 있네요',
    '원격의료 관련 최신 동향',
    '건강보험 정책 변화가 개원에 미치는 영향',
    '의원급 폐업률 통계 분석',
    '약국 수가 인상 논의 현황',
    'AI 진료 보조 시스템 도입 사례',
  ]},
  { category: '세무/법률', titles: [
    '개원의 절세 전략 총정리 (세무사 칼럼)',
    '약국 사업자등록 절차 A to Z',
    '의료기관 개설 신고 시 주의사항',
    '공동개원 계약서 체크포인트',
    '임대차 계약 시 꼭 확인해야 할 조항들',
    '의료분쟁 예방을 위한 법적 조언',
    '약국 권리금 계약서 작성 가이드',
    '종합소득세 신고 팁 (의사편)',
    '부가세 환급 극대화하는 방법',
    '의료법인 설립 절차 안내',
  ]},
  { category: '장비/인테리어', titles: [
    '내과 필수 의료장비 리스트 및 가격대',
    '약국 인테리어 비용 절감 꿀팁',
    '조제실 동선 최적화 사례 공유',
    '진료실 인테리어 트렌드 2024',
    '중고 의료장비 구매 후기 (주의사항)',
    'LED 조명 교체 전후 비교 (사진有)',
    '대기실 설계, 이것만은 꼭 고려하세요',
    '의료장비 AS 업체 추천',
    '약국 디스플레이 최적화 팁',
    '스마트 진료실 구축 사례',
  ]},
]

const authorNames = {
  doctor: ['강남내과의사', '정형외과개원의', '피부과원장', '치과의사A', '개원준비중의사', '서울의사', '병원장B', '외과전문의', '내과3년차', '피부과개원의'],
  pharmacist: ['약사김OO', '10년차약사', '분당약국장', '조제약사', '약국인수희망', '서초약사', '개국준비약사', '약국원장', '체인약국장', '조제실장'],
  landlord: ['메디컬빌딩관리자', '강남건물주', '상가임대인', '부동산전문', '빌딩관리사', '상가분양담당'],
  expert: ['의료컨설턴트', '세무사박OO', '인테리어전문가', '의료법률전문', '병원마케팅전문', '개원컨설팅', '약국컨설턴트', '의료경영전문'],
}

const authorBadges = ['베스트 작성자', '전문가 인증', '10년+ 경력', '활발한 기여자', '인기 작성자']

export function generateCommunityPosts(count: number = 150): CommunityPost[] {
  const posts: CommunityPost[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const categoryData = randomChoice(sampleTitles)
    const title = randomChoice(categoryData.titles)
    const authorType = randomChoice(['doctor', 'pharmacist', 'landlord', 'expert'] as const)
    const isPopular = Math.random() > 0.8
    const createdHoursAgo = randomInt(0, 90 * 24)
    const isNew = createdHoursAgo < 12
    const commentCount = isPopular ? randomInt(15, 80) : randomInt(2, 15)

    posts.push({
      id: `post-${generateId()}`,
      category: categoryData.category,
      title: title + (Math.random() > 0.7 ? ` (${randomInt(1, 5)}탄)` : ''),
      content: '내용은 로그인 후 확인하실 수 있습니다.',
      authorType,
      authorName: randomChoice(authorNames[authorType]),
      viewCount: isPopular ? randomInt(500, 3000) : randomInt(50, 500),
      likeCount: isPopular ? randomInt(30, 150) : randomInt(5, 30),
      commentCount,
      createdAt: new Date(now - createdHoursAgo * 60 * 60 * 1000).toISOString(),
      isPinned: i < 3,
      tags: randomChoices(['꿀팁', '후기', '질문', '정보공유', '경험담', '추천', '필독'], randomInt(1, 3)),
      isHot: isPopular,
      isNew,
      lastCommentTime: commentCount > 0 ? getRelativeTime(randomInt(1, 60)) : undefined,
      authorBadge: Math.random() > 0.7 ? randomChoice(authorBadges) : undefined,
    })
  }

  // 고정글 먼저, 그 다음 최신순
  return posts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

// 상대 시간 생성 (예: "3분 전", "1시간 전")
function getRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return '방금 전'
  if (minutesAgo < 60) return `${minutesAgo}분 전`
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}시간 전`
  return `${Math.floor(minutesAgo / 1440)}일 전`
}

// 통계 데이터 (더 인상적인 숫자들)
export const platformStats = {
  totalListings: 1247,
  activePharmacyListings: 384,
  activeBuildingListings: 863,
  monthlyMatches: 127,
  totalMembers: 18742,
  todayNewListings: randomInt(12, 28),
  weeklyInquiries: randomInt(380, 520),
  successfulMatches: 2847,
  averageMatchTime: '9.5일',
  todayActiveUsers: randomInt(340, 580),
  onlineNow: randomInt(45, 120),
  todayPosts: randomInt(25, 45),
  weeklyNewMembers: randomInt(120, 200),
}

// 실시간 활동 피드
export interface ActivityFeed {
  id: string
  type: 'new_listing' | 'inquiry' | 'match' | 'new_member' | 'new_post'
  message: string
  region?: string
  timeAgo: string
}

export function generateActivityFeed(count: number = 20): ActivityFeed[] {
  const activities: ActivityFeed[] = []
  const messages = {
    new_listing: [
      '새로운 매물이 등록되었습니다',
      '신규 약국 매물이 추가되었습니다',
      '메디컬빌딩 매물이 등록되었습니다',
    ],
    inquiry: [
      '매물 문의가 접수되었습니다',
      '관심 표시가 등록되었습니다',
      '상세 정보 요청이 있습니다',
    ],
    match: [
      '매칭이 성사되었습니다',
      '계약이 진행 중입니다',
      '성공적으로 매칭되었습니다',
    ],
    new_member: [
      '새로운 회원이 가입했습니다',
      '의사 회원이 가입했습니다',
      '약사 회원이 가입했습니다',
    ],
    new_post: [
      '새 게시글이 등록되었습니다',
      '질문글이 올라왔습니다',
      '후기가 공유되었습니다',
    ],
  }

  const types: ActivityFeed['type'][] = ['new_listing', 'inquiry', 'match', 'new_member', 'new_post']

  for (let i = 0; i < count; i++) {
    const type = randomChoice(types)
    const region = randomChoice(regions)

    activities.push({
      id: `activity-${generateId()}`,
      type,
      message: randomChoice(messages[type]),
      region: type !== 'new_member' ? region.name : undefined,
      timeAgo: getRelativeTime(randomInt(1, 120)),
    })
  }

  return activities
}

// 최근 매칭 성공 사례 (더 많은 스토리)
export const recentSuccessStories = [
  { region: '서울 강남구', type: '약국', days: 8, date: '2024.01.25', testimonial: '빠른 매칭에 감사드립니다!' },
  { region: '경기 분당구', type: '내과', days: 15, date: '2024.01.24', testimonial: '원하던 조건 그대로였어요' },
  { region: '서울 송파구', type: '약국', days: 11, date: '2024.01.23', testimonial: '익명 시스템이 좋았습니다' },
  { region: '부산 해운대구', type: '피부과', days: 22, date: '2024.01.22', testimonial: '상담이 정말 친절했어요' },
  { region: '서울 마포구', type: '약국', days: 6, date: '2024.01.21', testimonial: '일주일만에 계약!' },
  { region: '인천 연수구', type: '치과', days: 18, date: '2024.01.20', testimonial: '검증된 매물이라 안심됐어요' },
  { region: '경기 수원시', type: '약국', days: 14, date: '2024.01.19', testimonial: '권리금 협상도 도와주셨어요' },
  { region: '서울 서초구', type: '정형외과', days: 9, date: '2024.01.18', testimonial: '완벽한 입지였습니다' },
  { region: '대구 수성구', type: '약국', days: 12, date: '2024.01.17', testimonial: '지방도 매물이 많아서 좋아요' },
  { region: '서울 영등포구', type: '내과', days: 7, date: '2024.01.16', testimonial: '여의도 개원 성공!' },
  { region: '경기 고양시', type: '약국', days: 10, date: '2024.01.15', testimonial: '일산 좋은 자리 잡았습니다' },
  { region: '서울 강동구', type: '한의원', days: 16, date: '2024.01.14', testimonial: '상세한 매물 정보가 도움됐어요' },
]

// 회원 후기/추천글
export interface Testimonial {
  id: string
  authorType: 'doctor' | 'pharmacist'
  authorName: string
  content: string
  rating: number
  region: string
  date: string
  verified: boolean
}

export const memberTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    authorType: 'doctor',
    authorName: '김OO 원장',
    content: '개원 준비 중에 여기서 좋은 매물을 찾았습니다. 익명으로 문의할 수 있어서 부담 없이 여러 곳을 알아볼 수 있었어요.',
    rating: 5,
    region: '서울 강남구',
    date: '2024.01.20',
    verified: true,
  },
  {
    id: 'test-2',
    authorType: 'pharmacist',
    authorName: '이OO 약사',
    content: '약국 인수 과정이 순조로웠습니다. 권리금 협상부터 계약까지 전문적인 도움을 받았어요.',
    rating: 5,
    region: '경기 분당구',
    date: '2024.01.18',
    verified: true,
  },
  {
    id: 'test-3',
    authorType: 'doctor',
    authorName: '박OO 원장',
    content: '커뮤니티에서 실제 개원 선배들의 조언을 많이 얻었습니다. 정말 유용한 정보가 많아요.',
    rating: 5,
    region: '서울 서초구',
    date: '2024.01.15',
    verified: true,
  },
  {
    id: 'test-4',
    authorType: 'pharmacist',
    authorName: '최OO 약사',
    content: 'AI 매칭 시스템이 정말 편리했어요. 제 조건에 맞는 매물만 추천받을 수 있었습니다.',
    rating: 5,
    region: '부산 해운대구',
    date: '2024.01.12',
    verified: true,
  },
  {
    id: 'test-5',
    authorType: 'doctor',
    authorName: '정OO 원장',
    content: '메디컬빌딩 비교가 한눈에 되어서 좋았습니다. 결국 여기서 본 매물로 개원했어요.',
    rating: 5,
    region: '인천 연수구',
    date: '2024.01.10',
    verified: true,
  },
]

// 오늘의 인기 매물 (Hot Listings)
export function getHotListings(buildings: BuildingListing[], pharmacies: PharmacyListing[]) {
  const hotBuildings = buildings.filter(b => b.isHot).slice(0, 5)
  const hotPharmacies = pharmacies.filter(p => p.isHot).slice(0, 5)
  return { hotBuildings, hotPharmacies }
}

// 새로 등록된 매물 (New Listings)
export function getNewListings(buildings: BuildingListing[], pharmacies: PharmacyListing[]) {
  const newBuildings = buildings.filter(b => b.isNew).slice(0, 10)
  const newPharmacies = pharmacies.filter(p => p.isNew).slice(0, 10)
  return { newBuildings, newPharmacies }
}

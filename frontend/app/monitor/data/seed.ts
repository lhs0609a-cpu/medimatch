export interface CompetitorChange {
  id: string
  type: 'open' | 'close' | 'move' | 'expand'
  facilityName: string
  specialty: string
  address: string
  date: string
  details: string
}

export interface RegionStats {
  region: string
  totalClinics: number
  openedThisMonth: number
  closedThisMonth: number
  netChange: number
  competitionIndex: number // 0~100
  population: number
  clinicsPer10k: number
}

export interface WatchRegion {
  id: string
  name: string
  specialty: string
  enabled: boolean
}

export const recentChanges: CompetitorChange[] = [
  { id: 'c1', type: 'open', facilityName: '미소내과의원', specialty: '내과', address: '서울 강남구 역삼동 823-5', date: '2024-12-28', details: '내시경 전문, 건강검진 특화' },
  { id: 'c2', type: 'close', facilityName: '행복정형외과', specialty: '정형외과', address: '서울 강남구 논현동 112-3', date: '2024-12-25', details: '임대 만료로 폐업' },
  { id: 'c3', type: 'open', facilityName: '클리어피부과', specialty: '피부과', address: '서울 서초구 서초동 1305-7', date: '2024-12-22', details: '레이저 특화, 대규모 장비 투자' },
  { id: 'c4', type: 'move', facilityName: '강남이비인후과', specialty: '이비인후과', address: '서울 강남구 삼성동 → 대치동', date: '2024-12-20', details: '학원가 근처로 이전' },
  { id: 'c5', type: 'open', facilityName: '튼튼소아과', specialty: '소아청소년과', address: '서울 마포구 상암동 1602', date: '2024-12-18', details: '야간 진료 (22시까지)' },
  { id: 'c6', type: 'close', facilityName: '서초안과', specialty: '안과', address: '서울 서초구 방배동 445-2', date: '2024-12-15', details: '원장 은퇴' },
  { id: 'c7', type: 'expand', facilityName: '분당메디컬센터', specialty: '내과', address: '경기 성남시 분당구 정자동', date: '2024-12-12', details: '2층 → 3층 확장, 내시경/초음파 추가' },
  { id: 'c8', type: 'open', facilityName: '해피치과', specialty: '치과', address: '서울 송파구 잠실동 178-3', date: '2024-12-10', details: '교정 전문, 투명교정 특화' },
  { id: 'c9', type: 'close', facilityName: '우리한의원', specialty: '한의원', address: '서울 강동구 천호동 221', date: '2024-12-08', details: '매출 부진으로 폐업' },
  { id: 'c10', type: 'open', facilityName: '마포정신건강의학과', specialty: '정신건강의학과', address: '서울 마포구 합정동 358', date: '2024-12-05', details: '우울증/불안장애 전문' },
  { id: 'c11', type: 'move', facilityName: '명동성형외과', specialty: '성형외과', address: '서울 중구 명동 → 강남구 신사동', date: '2024-12-03', details: '강남 상권으로 이전' },
  { id: 'c12', type: 'open', facilityName: '건강가정의학과', specialty: '가정의학과', address: '경기 용인시 수지구 죽전동', date: '2024-12-01', details: '건강검진 + 비만클리닉' },
  { id: 'c13', type: 'close', facilityName: '동작재활의학과', specialty: '재활의학과', address: '서울 동작구 사당동 335-1', date: '2024-11-28', details: '타 지역 이전 (폐업 후 재개원)' },
  { id: 'c14', type: 'open', facilityName: '일산비뇨기과', specialty: '비뇨의학과', address: '경기 고양시 일산서구 주엽동', date: '2024-11-25', details: '남성 전문 클리닉' },
  { id: 'c15', type: 'open', facilityName: '판교산부인과', specialty: '산부인과', address: '경기 성남시 분당구 판교동', date: '2024-11-22', details: '산전관리 + 난임 특화' },
]

export const regionStats: RegionStats[] = [
  { region: '서울 강남구', totalClinics: 1245, openedThisMonth: 18, closedThisMonth: 12, netChange: 6, competitionIndex: 92, population: 570000, clinicsPer10k: 21.8 },
  { region: '서울 서초구', totalClinics: 785, openedThisMonth: 11, closedThisMonth: 8, netChange: 3, competitionIndex: 85, population: 430000, clinicsPer10k: 18.3 },
  { region: '서울 송파구', totalClinics: 620, openedThisMonth: 9, closedThisMonth: 7, netChange: 2, competitionIndex: 72, population: 670000, clinicsPer10k: 9.3 },
  { region: '서울 마포구', totalClinics: 480, openedThisMonth: 7, closedThisMonth: 5, netChange: 2, competitionIndex: 68, population: 380000, clinicsPer10k: 12.6 },
  { region: '경기 성남시 분당구', totalClinics: 520, openedThisMonth: 8, closedThisMonth: 4, netChange: 4, competitionIndex: 75, population: 490000, clinicsPer10k: 10.6 },
  { region: '경기 용인시 수지구', totalClinics: 310, openedThisMonth: 5, closedThisMonth: 3, netChange: 2, competitionIndex: 55, population: 360000, clinicsPer10k: 8.6 },
  { region: '서울 영등포구', totalClinics: 410, openedThisMonth: 6, closedThisMonth: 6, netChange: 0, competitionIndex: 65, population: 400000, clinicsPer10k: 10.3 },
  { region: '경기 고양시 일산서구', totalClinics: 280, openedThisMonth: 4, closedThisMonth: 2, netChange: 2, competitionIndex: 48, population: 310000, clinicsPer10k: 9.0 },
]

export const defaultWatchRegions: WatchRegion[] = [
  { id: 'w1', name: '서울 강남구', specialty: '전체', enabled: true },
  { id: 'w2', name: '서울 서초구', specialty: '전체', enabled: true },
  { id: 'w3', name: '경기 성남시 분당구', specialty: '전체', enabled: false },
]

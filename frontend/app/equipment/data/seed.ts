export interface Equipment {
  id: string
  name: string
  category: string
  brand: string
  model: string
  condition: 'new' | 'like-new' | 'good' | 'fair'
  price: number // 만원
  originalPrice?: number
  yearMade?: number
  usageMonths?: number
  location: string
  seller: string
  sellerType: 'dealer' | 'hospital' | 'manufacturer'
  description: string
  features: string[]
  imageUrl?: string
  createdAt: string
  viewCount: number
  isHot?: boolean
  warranty?: string
}

export const categories = [
  '전체', '영상진단', '초음파', '내시경', '치과장비', '안과장비',
  '물리치료', 'EMR/IT', '수술장비', '검사장비', '가구/집기', '기타'
]

export const conditionLabels: Record<string, { label: string; color: string }> = {
  new: { label: '신품', color: '#10B981' },
  'like-new': { label: '준신품', color: '#3B82F6' },
  good: { label: '상태 양호', color: '#F59E0B' },
  fair: { label: '사용감 있음', color: '#6B7280' },
}

export const equipmentList: Equipment[] = [
  { id: 'eq-1', name: 'GE LOGIQ E10s 초음파', category: '초음파', brand: 'GE Healthcare', model: 'LOGIQ E10s', condition: 'new', price: 8500, originalPrice: 9500, location: '서울 강남구', seller: '메디텍 코리아', sellerType: 'dealer', description: '최신형 범용 초음파 진단장비. 탁월한 해상도와 직관적인 UI.', features: ['cSound Architecture', '22인치 터치스크린', 'Wi-Fi 연결', '3년 무상 보증'], createdAt: '2024-12-20', viewCount: 342, isHot: true, warranty: '3년' },
  { id: 'eq-2', name: 'OLYMPUS CV-190 내시경 시스템', category: '내시경', brand: 'OLYMPUS', model: 'CV-190', condition: 'like-new', price: 4200, originalPrice: 6800, yearMade: 2023, usageMonths: 8, location: '경기 성남시', seller: '분당내과의원', sellerType: 'hospital', description: '사용 8개월, 정기 점검 완료. 이전으로 인한 매각.', features: ['HD 화질', '광각 렌즈', 'NBI 기능', '세척기 포함'], createdAt: '2024-12-18', viewCount: 289, warranty: '남은 보증 2년' },
  { id: 'eq-3', name: 'SHIMADZU RADspeed Pro', category: '영상진단', brand: 'SHIMADZU', model: 'RADspeed Pro', condition: 'good', price: 3800, originalPrice: 7200, yearMade: 2021, usageMonths: 36, location: '서울 서초구', seller: '서초정형외과', sellerType: 'hospital', description: 'X-ray 디지털 촬영 장비. 3년 사용, 정상 작동.', features: ['디지털 DR', '자동 노출 제어', '벽걸이형 가능', '납차폐 장치 포함'], createdAt: '2024-12-15', viewCount: 198 },
  { id: 'eq-4', name: 'CEREC Primescan 구강스캐너', category: '치과장비', brand: 'Dentsply Sirona', model: 'CEREC Primescan', condition: 'like-new', price: 3500, originalPrice: 5500, yearMade: 2023, usageMonths: 6, location: '서울 강남구', seller: '강남치과의원', sellerType: 'hospital', description: '6개월 사용. 의원 통합으로 매각. 소프트웨어 라이선스 이전 가능.', features: ['AI 스캔', 'Full-arch 스캔', 'CEREC 연동', '포터블'], createdAt: '2024-12-14', viewCount: 256, isHot: true },
  { id: 'eq-5', name: 'BTL-6000 체외충격파', category: '물리치료', brand: 'BTL', model: 'BTL-6000 SWT', condition: 'new', price: 2800, location: '서울 영등포구', seller: '메디프로 장비', sellerType: 'dealer', description: '정형외과/재활의학과 필수 장비. 정품 보증.', features: ['포커스+방사형', '7인치 컬러 터치', '400만 샷 보증', '이동형 카트 포함'], createdAt: '2024-12-12', viewCount: 175, warranty: '2년' },
  { id: 'eq-6', name: 'TOPCON TRC-NW400 안저카메라', category: '안과장비', brand: 'TOPCON', model: 'TRC-NW400', condition: 'good', price: 1800, originalPrice: 3200, yearMade: 2022, usageMonths: 24, location: '경기 수원시', seller: '수원안과', sellerType: 'hospital', description: '비산동 자동 안저카메라. 2년 사용.', features: ['자동 정렬', '무산동 촬영', '12.3MP 해상도', 'DICOM 호환'], createdAt: '2024-12-10', viewCount: 145 },
  { id: 'eq-7', name: '리안 EMR 클라우드', category: 'EMR/IT', brand: 'LIAN', model: 'Cloud Pro', condition: 'new', price: 600, location: '전국 (원격설치)', seller: '리안소프트', sellerType: 'manufacturer', description: '클라우드 기반 EMR. 월 구독료 별도. 내과/가정의학과 최적화.', features: ['클라우드 기반', '건보 청구 연동', '예약 관리', '통계 대시보드'], createdAt: '2024-12-08', viewCount: 412, isHot: true },
  { id: 'eq-8', name: 'HILL-ROM 전동 진료대', category: '가구/집기', brand: 'HILL-ROM', model: 'Exam 405', condition: 'new', price: 380, location: '서울 강남구', seller: '메디퍼니처', sellerType: 'dealer', description: '전동 높이조절 진료대. 다양한 진료과에 범용.', features: ['전동 높이조절', '메모리폼 쿠션', '페이퍼 롤 홀더', '3색 선택'], createdAt: '2024-12-06', viewCount: 95, warranty: '1년' },
  { id: 'eq-9', name: 'CUTERA excel V+ 레이저', category: '수술장비', brand: 'CUTERA', model: 'excel V+', condition: 'like-new', price: 12000, originalPrice: 18000, yearMade: 2023, usageMonths: 12, location: '서울 강남구', seller: '강남피부과', sellerType: 'hospital', description: '혈관/색소 레이저. 1년 사용, 장비 업그레이드로 매각.', features: ['532nm + 1064nm', '쿨링 시스템', 'Green Genesis', '스팟 사이즈 다양'], createdAt: '2024-12-04', viewCount: 321, isHot: true },
  { id: 'eq-10', name: 'Sysmex XN-550 혈구분석기', category: '검사장비', brand: 'Sysmex', model: 'XN-550', condition: 'new', price: 2200, location: '대전 서구', seller: '한국시스멕스', sellerType: 'manufacturer', description: '소형 자동혈구분석기. 개원의원 최적. 설치 교육 포함.', features: ['CBC+DIFF', '분당 60검체', '소량 검체 가능', '원격 QC'], createdAt: '2024-12-02', viewCount: 187, warranty: '2년' },
  { id: 'eq-11', name: '피지오메드 TMS 자기자극기', category: '수술장비', brand: 'Physiomed', model: 'TMS Pro', condition: 'new', price: 4500, location: '서울 마포구', seller: '뉴로메디컬', sellerType: 'dealer', description: '정신건강의학과 TMS 치료장비. FDA 승인.', features: ['Figure-8 코일', '네비게이션 연동', 'rTMS 프로토콜', '연구 모드'], createdAt: '2024-11-30', viewCount: 134 },
  { id: 'eq-12', name: '대기실 소파세트 (5인)', category: '가구/집기', brand: '메디퍼니처', model: 'Comfort Series', condition: 'new', price: 180, location: '경기 일산시', seller: '메디퍼니처', sellerType: 'dealer', description: '의원 대기실 전용 소파. 항균 인조가죽, 쿠션 교체 가능.', features: ['항균 소재', '5인 벤치형', '컬러 선택 (7색)', '설치 무료'], createdAt: '2024-11-28', viewCount: 223 },
  { id: 'eq-13', name: 'SAMSUNG HS40 초음파', category: '초음파', brand: 'Samsung Medison', model: 'HS40', condition: 'good', price: 2800, originalPrice: 5000, yearMade: 2022, usageMonths: 30, location: '부산 해운대구', seller: '해운대산부인과', sellerType: 'hospital', description: '산부인과용 초음파. 3D/4D 탐촉자 포함.', features: ['3D/4D 이미징', 'CrystalLive', 'ElastoScan', '프린터 연동'], createdAt: '2024-11-25', viewCount: 167 },
  { id: 'eq-14', name: 'A-DEC 500 치과 유니트체어', category: '치과장비', brand: 'A-DEC', model: '500', condition: 'like-new', price: 2500, originalPrice: 3800, yearMade: 2023, usageMonths: 10, location: '서울 송파구', seller: '송파치과', sellerType: 'hospital', description: '10개월 사용. 의원 이전으로 매각. 풀옵션.', features: ['LED 무영등', '전동 시린지', '스케일러 내장', '환자 모니터'], createdAt: '2024-11-22', viewCount: 198 },
  { id: 'eq-15', name: 'Mindray BC-700 혈구분석기', category: '검사장비', brand: 'Mindray', model: 'BC-700', condition: 'new', price: 1500, location: '서울 강서구', seller: '메디랩 코리아', sellerType: 'dealer', description: '가성비 좋은 자동혈구분석기. 내과/소아과 추천.', features: ['5-Part DIFF', '분당 70검체', '터치스크린', 'LIS 연동'], createdAt: '2024-11-20', viewCount: 143, warranty: '2년' },
]

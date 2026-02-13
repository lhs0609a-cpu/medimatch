export interface NearbyHospital {
  id: string
  name: string
  specialty: string
  distance: number // meters
  dailyPatients: number
  prescriptionRate: number // % of patients getting prescriptions
  isChain: boolean
}

export interface LocationData {
  id: string
  address: string
  population: number
  pharmacyCount: number
  hospitalCount: number
  avgDailyPrescriptions: number
  hospitals: NearbyHospital[]
}

export const prescriptionRateBySpecialty: Record<string, number> = {
  내과: 85,
  소아청소년과: 90,
  이비인후과: 80,
  정형외과: 60,
  피부과: 55,
  가정의학과: 75,
  비뇨의학과: 70,
  산부인과: 65,
  정신건강의학과: 90,
  안과: 50,
  한의원: 40,
  치과: 20,
}

export const avgPrescriptionValue = 8500 // 원 (조제료 + 약제비 평균)
export const avgOTCSalesPerDay = 250000 // 원 (일반의약품 + 건강기능식품)

export const sampleLocations: LocationData[] = [
  {
    id: 'gangnam-1',
    address: '서울 강남구 역삼동',
    population: 42000,
    pharmacyCount: 28,
    hospitalCount: 95,
    avgDailyPrescriptions: 180,
    hospitals: [
      { id: 'h1', name: '역삼내과의원', specialty: '내과', distance: 50, dailyPatients: 55, prescriptionRate: 85, isChain: false },
      { id: 'h2', name: '강남소아과', specialty: '소아청소년과', distance: 80, dailyPatients: 45, prescriptionRate: 90, isChain: false },
      { id: 'h3', name: '역삼이비인후과', specialty: '이비인후과', distance: 120, dailyPatients: 50, prescriptionRate: 80, isChain: false },
      { id: 'h4', name: '강남정형외과', specialty: '정형외과', distance: 200, dailyPatients: 40, prescriptionRate: 60, isChain: false },
      { id: 'h5', name: '역삼피부과', specialty: '피부과', distance: 150, dailyPatients: 30, prescriptionRate: 55, isChain: false },
      { id: 'h6', name: '메디컬가정의학과', specialty: '가정의학과', distance: 300, dailyPatients: 35, prescriptionRate: 75, isChain: false },
      { id: 'h7', name: '강남비뇨기과', specialty: '비뇨의학과', distance: 250, dailyPatients: 25, prescriptionRate: 70, isChain: false },
      { id: 'h8', name: '역삼안과의원', specialty: '안과', distance: 180, dailyPatients: 35, prescriptionRate: 50, isChain: false },
    ],
  },
  {
    id: 'seocho-1',
    address: '서울 서초구 서초동',
    population: 38000,
    pharmacyCount: 22,
    hospitalCount: 72,
    avgDailyPrescriptions: 150,
    hospitals: [
      { id: 'h9', name: '서초내과', specialty: '내과', distance: 60, dailyPatients: 50, prescriptionRate: 85, isChain: false },
      { id: 'h10', name: '서초소아과', specialty: '소아청소년과', distance: 100, dailyPatients: 40, prescriptionRate: 90, isChain: false },
      { id: 'h11', name: '서초정형외과', specialty: '정형외과', distance: 150, dailyPatients: 45, prescriptionRate: 60, isChain: false },
      { id: 'h12', name: '법원사거리이비인후과', specialty: '이비인후과', distance: 200, dailyPatients: 42, prescriptionRate: 80, isChain: false },
      { id: 'h13', name: '서초가정의학과', specialty: '가정의학과', distance: 130, dailyPatients: 30, prescriptionRate: 75, isChain: false },
      { id: 'h14', name: '서초한의원', specialty: '한의원', distance: 250, dailyPatients: 20, prescriptionRate: 40, isChain: false },
    ],
  },
  {
    id: 'mapo-1',
    address: '서울 마포구 합정동',
    population: 28000,
    pharmacyCount: 15,
    hospitalCount: 45,
    avgDailyPrescriptions: 110,
    hospitals: [
      { id: 'h15', name: '합정내과의원', specialty: '내과', distance: 70, dailyPatients: 40, prescriptionRate: 85, isChain: false },
      { id: 'h16', name: '합정이비인후과', specialty: '이비인후과', distance: 90, dailyPatients: 35, prescriptionRate: 80, isChain: false },
      { id: 'h17', name: '마포소아과', specialty: '소아청소년과', distance: 200, dailyPatients: 35, prescriptionRate: 90, isChain: false },
      { id: 'h18', name: '합정피부과', specialty: '피부과', distance: 150, dailyPatients: 25, prescriptionRate: 55, isChain: false },
      { id: 'h19', name: '마포가정의학과', specialty: '가정의학과', distance: 300, dailyPatients: 30, prescriptionRate: 75, isChain: false },
    ],
  },
  {
    id: 'bundang-1',
    address: '경기 성남시 분당구 정자동',
    population: 35000,
    pharmacyCount: 20,
    hospitalCount: 65,
    avgDailyPrescriptions: 140,
    hospitals: [
      { id: 'h20', name: '분당내과', specialty: '내과', distance: 50, dailyPatients: 50, prescriptionRate: 85, isChain: false },
      { id: 'h21', name: '정자소아과', specialty: '소아청소년과', distance: 100, dailyPatients: 45, prescriptionRate: 90, isChain: false },
      { id: 'h22', name: '분당정형외과', specialty: '정형외과', distance: 150, dailyPatients: 40, prescriptionRate: 60, isChain: false },
      { id: 'h23', name: '정자이비인후과', specialty: '이비인후과', distance: 120, dailyPatients: 48, prescriptionRate: 80, isChain: false },
      { id: 'h24', name: '분당산부인과', specialty: '산부인과', distance: 200, dailyPatients: 25, prescriptionRate: 65, isChain: false },
      { id: 'h25', name: '정자가정의학과', specialty: '가정의학과', distance: 180, dailyPatients: 35, prescriptionRate: 75, isChain: false },
      { id: 'h26', name: '분당안과', specialty: '안과', distance: 250, dailyPatients: 30, prescriptionRate: 50, isChain: false },
    ],
  },
]

export const calculatePrescriptions = (hospital: NearbyHospital, pharmacyCount: number) => {
  const totalPrescriptions = Math.round(hospital.dailyPatients * (hospital.prescriptionRate / 100))
  const distanceFactor = hospital.distance <= 100 ? 0.35 : hospital.distance <= 200 ? 0.2 : hospital.distance <= 300 ? 0.1 : 0.05
  const captureRate = distanceFactor / Math.max(1, pharmacyCount * 0.15)
  const myPrescriptions = Math.round(totalPrescriptions * Math.min(captureRate, 0.5))
  return { totalPrescriptions, captureRate: Math.min(captureRate * 100, 50), myPrescriptions }
}

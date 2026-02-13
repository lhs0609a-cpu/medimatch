'use client'

import { useState } from 'react'
import { ArrowLeft, Layout, ChevronRight, Lightbulb, Maximize2, Users, Stethoscope, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Zone {
  name: string
  color: string
  percentage: number
  description: string
}

interface SpecialtyConfig {
  id: string
  name: string
  icon: string
  zones: Zone[]
  patientFlow: string[]
  staffFlow: string[]
  principles: string[]
  areaTable: { room: string; recommended: string }[]
  totalRecommended: string
}

const specialties: SpecialtyConfig[] = [
  {
    id: 'internal',
    name: '내과',
    icon: '🫀',
    zones: [
      { name: '대기실', color: 'bg-blue-500/40', percentage: 20, description: '20~30석 규모, 접수 데스크 인접' },
      { name: '접수/수납', color: 'bg-green-500/40', percentage: 8, description: '환자 동선의 시작과 끝' },
      { name: '진료실', color: 'bg-primary/40', percentage: 15, description: '2~3개, 내시경실 연결 고려' },
      { name: '처치실', color: 'bg-amber-500/40', percentage: 12, description: '주사, 수액실 겸용' },
      { name: '검사실', color: 'bg-red-500/40', percentage: 15, description: '채혈, 심전도, 폐기능 검사' },
      { name: '내시경실', color: 'bg-purple-500/40', percentage: 10, description: '별도 동선, 회복실 인접' },
      { name: '상담실', color: 'bg-cyan-500/40', percentage: 5, description: '결과 상담, 건강검진 상담' },
      { name: '직원공간', color: 'bg-gray-500/40', percentage: 10, description: '탈의실, 휴게실, 사무공간' },
      { name: '화장실', color: 'bg-stone-500/40', percentage: 5, description: '환자용 2개, 직원용 1개' },
    ],
    patientFlow: ['출입구', '접수', '대기실', '진료실', '검사실/내시경실', '처치실', '대기실', '수납', '출구'],
    staffFlow: ['직원출입구', '탈의실', '간호스테이션', '진료실/검사실', '직원 휴게실'],
    principles: [
      '검사실은 진료실과 가까이 배치하여 환자 이동 최소화',
      '내시경실은 별도 동선으로 분리하고 회복 공간 확보',
      '수액실(처치실)은 대기실 인근에 배치하여 환자 모니터링 용이하게',
      '채혈실은 진료실에서 접근이 쉬운 위치에 배치',
      '건강검진 동선과 일반진료 동선을 가능하면 분리',
    ],
    areaTable: [
      { room: '대기실', recommended: '10~12평' },
      { room: '접수/수납', recommended: '4~5평' },
      { room: '진료실 (2개)', recommended: '8~10평' },
      { room: '처치실/수액실', recommended: '6~8평' },
      { room: '검사실', recommended: '7~9평' },
      { room: '내시경실+회복', recommended: '5~7평' },
      { room: '상담실', recommended: '2~3평' },
      { room: '직원공간', recommended: '5~6평' },
      { room: '화장실 (3개)', recommended: '3평' },
    ],
    totalRecommended: '50~63평',
  },
  {
    id: 'orthopedic',
    name: '정형외과',
    icon: '🦴',
    zones: [
      { name: '대기실', color: 'bg-blue-500/40', percentage: 18, description: '휠체어 대기 공간 포함' },
      { name: '접수/수납', color: 'bg-green-500/40', percentage: 8, description: '넓은 카운터, 휠체어 접근 고려' },
      { name: '진료실', color: 'bg-primary/40', percentage: 12, description: '2개, 진찰대 높이 조절 가능' },
      { name: '처치실', color: 'bg-amber-500/40', percentage: 10, description: '깁스, 부목, 주사 처치' },
      { name: 'X-ray실', color: 'bg-red-500/40', percentage: 10, description: '납 차폐, 탈의 공간' },
      { name: '재활치료실', color: 'bg-purple-500/40', percentage: 22, description: '물리치료, 도수치료, 운동치료' },
      { name: '상담실', color: 'bg-cyan-500/40', percentage: 5, description: '수술 상담, 보험 상담' },
      { name: '직원공간', color: 'bg-gray-500/40', percentage: 10, description: '탈의실, 휴게실' },
      { name: '화장실', color: 'bg-stone-500/40', percentage: 5, description: '장애인 화장실 포함' },
    ],
    patientFlow: ['출입구', '접수', '대기실', '진료실', 'X-ray실', '처치실', '재활치료실', '수납', '출구'],
    staffFlow: ['직원출입구', '탈의실', '간호스테이션', '진료실/X-ray실/재활치료실'],
    principles: [
      '재활치료실을 가장 넓게 확보 (전체의 20% 이상)',
      '모든 동선은 휠체어 통행 가능하도록 복도 폭 1.5m 이상',
      'X-ray실은 진료실 인접 배치, 납 차폐 기준 준수',
      '재활치료실은 소음이 대기실에 전달되지 않도록 배치',
      '출입구에 경사로 필수 설치, 문턱 제거',
    ],
    areaTable: [
      { room: '대기실', recommended: '10~12평' },
      { room: '접수/수납', recommended: '4~5평' },
      { room: '진료실 (2개)', recommended: '7~8평' },
      { room: '처치실', recommended: '5~6평' },
      { room: 'X-ray실', recommended: '5~6평' },
      { room: '재활치료실', recommended: '13~16평' },
      { room: '상담실', recommended: '3평' },
      { room: '직원공간', recommended: '5~6평' },
      { room: '화장실', recommended: '3평' },
    ],
    totalRecommended: '55~65평',
  },
  {
    id: 'dermatology',
    name: '피부과',
    icon: '✨',
    zones: [
      { name: '대기실', color: 'bg-blue-500/40', percentage: 15, description: '프리미엄 인테리어, 프라이버시' },
      { name: '접수/수납', color: 'bg-green-500/40', percentage: 8, description: '상담 예약 데스크 포함' },
      { name: '진료실', color: 'bg-primary/40', percentage: 12, description: '2개, 피부 확대경 비치' },
      { name: '시술실', color: 'bg-amber-500/40', percentage: 25, description: '레이저실 2~3개, 개별 파티션' },
      { name: '상담실', color: 'bg-cyan-500/40', percentage: 10, description: '시술 전후 상담, 프라이버시 확보' },
      { name: '회복실', color: 'bg-purple-500/40', percentage: 10, description: '시술 후 쿨링, 개별 공간' },
      { name: '파우더룸', color: 'bg-pink-500/40', percentage: 5, description: '세안, 메이크업' },
      { name: '직원공간', color: 'bg-gray-500/40', percentage: 10, description: '탈의실, 장비 보관' },
      { name: '화장실', color: 'bg-stone-500/40', percentage: 5, description: '환자용 2개 (세안 가능)' },
    ],
    patientFlow: ['출입구', '접수', '대기실', '상담실', '시술실', '회복실', '파우더룸', '수납', '출구'],
    staffFlow: ['직원출입구', '탈의실', '간호스테이션', '시술실/진료실'],
    principles: [
      '시술실 동선과 진료 동선을 완전히 분리',
      '시술실은 개별 파티션으로 환자 간 프라이버시 확보',
      '회복실은 시술실 바로 옆에 배치',
      '파우더룸을 출구 인근에 배치하여 시술 후 정리 가능',
      '고가 레이저 장비 보관 및 전력 용량 사전 확인 필수',
      'VIP 동선을 별도로 구성하면 프리미엄 고객 만족도 향상',
    ],
    areaTable: [
      { room: '대기실', recommended: '8~10평' },
      { room: '접수/수납', recommended: '4~5평' },
      { room: '진료실 (2개)', recommended: '6~8평' },
      { room: '시술실 (3개)', recommended: '14~16평' },
      { room: '상담실 (2개)', recommended: '5~6평' },
      { room: '회복실', recommended: '5~6평' },
      { room: '파우더룸', recommended: '3평' },
      { room: '직원공간', recommended: '5~6평' },
      { room: '화장실', recommended: '3평' },
    ],
    totalRecommended: '53~63평',
  },
  {
    id: 'ophthalmology',
    name: '안과',
    icon: '👁️',
    zones: [
      { name: '대기실', color: 'bg-blue-500/40', percentage: 18, description: '밝은 조명, 넓은 공간' },
      { name: '접수/수납', color: 'bg-green-500/40', percentage: 8, description: '시력검사 결과 안내 포함' },
      { name: '진료실', color: 'bg-primary/40', percentage: 12, description: '2개, 세극등 현미경 배치' },
      { name: '검사실', color: 'bg-red-500/40', percentage: 20, description: '시력, 안압, OCT, 시야 검사' },
      { name: '암실', color: 'bg-violet-500/40', percentage: 8, description: '산동 검사, 형광안저 촬영' },
      { name: '처치실', color: 'bg-amber-500/40', percentage: 10, description: '레이저 시술, 소수술' },
      { name: '상담실', color: 'bg-cyan-500/40', percentage: 5, description: '수술 상담, 콘택트렌즈 상담' },
      { name: '직원공간', color: 'bg-gray-500/40', percentage: 10, description: '장비 관리, 휴게' },
      { name: '화장실', color: 'bg-stone-500/40', percentage: 5, description: '산동 후 시야 확보 배려 (손잡이)' },
      { name: '안경/렌즈 코너', color: 'bg-teal-500/40', percentage: 4, description: '처방 안경, 렌즈 판매' },
    ],
    patientFlow: ['출입구', '접수', '대기실', '검사실', '암실', '진료실', '처치실', '수납', '출구'],
    staffFlow: ['직원출입구', '탈의실', '검사실 운영', '진료실/암실 보조'],
    principles: [
      '검사실을 가장 넓게 확보하고 장비 배치 동선 최적화',
      '암실은 외부 빛이 완전히 차단되도록 이중문 설치',
      '검사실 → 암실 → 진료실 순서로 일렬 배치 권장',
      '산동 검사 후 눈이 부신 환자를 위한 대기 공간 확보',
      '고가 검사 장비(OCT, 시야계 등)의 전력과 네트워크 사전 확인',
    ],
    areaTable: [
      { room: '대기실', recommended: '10~12평' },
      { room: '접수/수납', recommended: '4~5평' },
      { room: '진료실 (2개)', recommended: '7~8평' },
      { room: '검사실', recommended: '12~14평' },
      { room: '암실', recommended: '4~5평' },
      { room: '처치실', recommended: '5~6평' },
      { room: '상담실', recommended: '3평' },
      { room: '직원공간', recommended: '5~6평' },
      { room: '화장실', recommended: '3평' },
      { room: '안경/렌즈 코너', recommended: '2~3평' },
    ],
    totalRecommended: '55~67평',
  },
  {
    id: 'dental',
    name: '치과',
    icon: '🦷',
    zones: [
      { name: '대기실', color: 'bg-blue-500/40', percentage: 15, description: '편안한 분위기, 소아 공간' },
      { name: '접수/수납', color: 'bg-green-500/40', percentage: 8, description: '보험 상담 공간 포함' },
      { name: '진료실', color: 'bg-primary/40', percentage: 30, description: '유닛체어 4~6대, 파티션 분리' },
      { name: 'X-ray실', color: 'bg-red-500/40', percentage: 8, description: '파노라마, CT 장비' },
      { name: '상담실', color: 'bg-cyan-500/40', percentage: 8, description: '치료 계획 상담, 모니터 설치' },
      { name: '기공실', color: 'bg-amber-500/40', percentage: 8, description: '기공물 수리, 임시 보철' },
      { name: '소독실', color: 'bg-purple-500/40', percentage: 8, description: '기구 세척, 멸균, 포장' },
      { name: '직원공간', color: 'bg-gray-500/40', percentage: 10, description: '탈의실, 휴게실' },
      { name: '화장실', color: 'bg-stone-500/40', percentage: 5, description: '양치 가능 세면대 구비' },
    ],
    patientFlow: ['출입구', '접수', '대기실', 'X-ray실', '상담실', '진료실(유닛체어)', '수납', '출구'],
    staffFlow: ['직원출입구', '탈의실', '소독실', '진료실/기공실'],
    principles: [
      '유닛체어 배치가 핵심: 의사 동선 최소화를 위해 방사형 또는 일렬 배치',
      '소독실은 진료실 인접하되 환자 눈에 보이지 않도록',
      'X-ray실은 진료실에서 바로 접근 가능한 위치',
      '상담실은 대기실과 진료실 사이에 배치',
      '파티션은 1.5m 이상으로 환자 간 프라이버시 확보',
      '컴프레서, 석션 등 장비실은 소음 격리 필수',
    ],
    areaTable: [
      { room: '대기실', recommended: '8~10평' },
      { room: '접수/수납', recommended: '4~5평' },
      { room: '진료실 (유닛 5대)', recommended: '16~20평' },
      { room: 'X-ray실', recommended: '4~5평' },
      { room: '상담실', recommended: '4~5평' },
      { room: '기공실', recommended: '4~5평' },
      { room: '소독실', recommended: '4~5평' },
      { room: '직원공간', recommended: '5~6평' },
      { room: '화장실', recommended: '3평' },
    ],
    totalRecommended: '52~64평',
  },
]

const designTips = [
  '환자 동선과 직원 동선은 반드시 분리 설계하세요',
  '복도 폭은 최소 1.2m, 휠체어 통행이 필요한 곳은 1.5m 이상 확보하세요',
  '감염 관리를 위해 청결 구역과 오염 구역을 명확히 구분하세요',
  '장애인 편의시설(경사로, 넓은 화장실)을 반드시 포함하세요',
  '전기 용량은 의료장비 전력 소비를 고려해 일반 사무실의 2~3배로 설계하세요',
  '소방법상 피난 동선과 비상구 위치를 사전에 확인하세요',
  '냉난방 구역을 세분화하여 에너지 비용을 절감하세요',
  '환자 프라이버시를 위해 진료실 방음에 신경 쓰세요',
  '자연채광을 최대한 활용하되, 직사광선이 장비에 닿지 않도록 주의하세요',
  '청소와 유지보수가 쉬운 바닥재와 벽재를 선택하세요',
]

export default function FloorPlanPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState('internal')

  const spec = specialties.find((s) => s.id === selectedSpecialty)!

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Layout className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">동선 설계 가이드</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Specialty Selector */}
        <div className="card p-5 mb-6">
          <label className="text-sm font-medium text-foreground mb-3 block">진료과 선택</label>
          <div className="flex flex-wrap gap-2">
            {specialties.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSelectedSpecialty(sp.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedSpecialty === sp.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{sp.icon}</span>
                {sp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Floor Plan Diagram */}
        <div className="card p-5 mb-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-primary" />
            {spec.name} 공간 배치도
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 mb-4">
            {spec.zones.map((zone) => {
              const cols = zone.percentage >= 20 ? 'col-span-2' : zone.percentage >= 15 ? 'col-span-2 md:col-span-2' : 'col-span-1'
              const height = zone.percentage >= 20 ? 'h-28' : zone.percentage >= 10 ? 'h-24' : 'h-20'
              return (
                <div
                  key={zone.name}
                  className={`${zone.color} ${cols} ${height} rounded-lg p-2 flex flex-col justify-between border border-white/10 hover:border-primary/50 transition-colors group`}
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">{zone.name}</span>
                    <span className="text-[10px] text-foreground/70">{zone.percentage}%</span>
                  </div>
                  <span className="text-[9px] text-foreground/60 hidden group-hover:block">{zone.description}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            * 블록 크기는 권장 면적 비율을 시각적으로 표현한 것이며, 실제 배치는 공간 형태에 따라 달라질 수 있습니다.
          </p>
        </div>

        {/* Patient & Staff Flow */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              환자 동선
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              {spec.patientFlow.map((step, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                    i === 0 || i === spec.patientFlow.length - 1
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-foreground'
                  }`}>
                    {step}
                  </span>
                  {i < spec.patientFlow.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              환자가 접수부터 수납까지 자연스럽게 이동할 수 있도록 일방향 동선을 설계하세요.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              직원 동선
            </h3>
            <div className="flex flex-wrap items-center gap-1">
              {spec.staffFlow.map((step, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                    i === 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-muted text-foreground'
                  }`}>
                    {step}
                  </span>
                  {i < spec.staffFlow.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              직원 동선은 환자 동선과 분리하여 효율적인 업무 흐름을 만드세요.
            </p>
          </div>
        </div>

        {/* Design Principles */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            {spec.name} 설계 핵심 포인트
          </h3>
          <div className="space-y-2">
            {spec.principles.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Area Recommendation Table */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-primary" />
            {spec.name} 공간별 권장 면적
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 font-semibold text-foreground">공간</th>
                  <th className="text-right p-3 font-semibold text-foreground">권장 면적</th>
                  <th className="text-right p-3 font-semibold text-foreground">비율</th>
                </tr>
              </thead>
              <tbody>
                {spec.areaTable.map((row, i) => {
                  const zone = spec.zones.find((z) => row.room.startsWith(z.name))
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-muted/30">
                      <td className="p-3 text-foreground">
                        <div className="flex items-center gap-2">
                          {zone && <div className={`w-3 h-3 rounded ${zone.color}`} />}
                          {row.room}
                        </div>
                      </td>
                      <td className="p-3 text-right text-foreground font-medium">{row.recommended}</td>
                      <td className="p-3 text-right text-muted-foreground">
                        {zone ? `${zone.percentage}%` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30">
                  <td className="p-3 font-bold text-foreground">합계 (권장)</td>
                  <td className="p-3 text-right font-bold text-primary text-lg">{spec.totalRecommended}</td>
                  <td className="p-3 text-right text-muted-foreground">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Zone Distribution Bar */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-foreground mb-3">공간 비율 한눈에 보기</h3>
          <div className="flex rounded-lg overflow-hidden h-10 mb-3">
            {spec.zones.map((zone) => (
              <div
                key={zone.name}
                className={`${zone.color} flex items-center justify-center border-r border-background/30 last:border-r-0 transition-all`}
                style={{ width: `${zone.percentage}%` }}
                title={`${zone.name}: ${zone.percentage}%`}
              >
                {zone.percentage >= 8 && (
                  <span className="text-[10px] font-bold text-foreground truncate px-0.5">{zone.name}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {spec.zones.map((zone) => (
              <div key={zone.name} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded ${zone.color}`} />
                <span className="text-xs text-muted-foreground">{zone.name} {zone.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* General Design Tips */}
        <div className="card p-5 mb-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            동선 설계 시 체크포인트
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {designTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                <span className="text-xs font-bold text-primary bg-primary/20 w-5 h-5 rounded flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pb-8">
          본 가이드는 참고용이며, 실제 설계는 인테리어 전문 업체와 협의하세요.
          의료법, 소방법, 장애인편의법 등 관련 법규를 반드시 확인하시기 바랍니다.
        </p>
      </main>
    </div>
  )
}

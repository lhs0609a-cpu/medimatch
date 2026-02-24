'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Search,
  User,
  Phone,
  Calendar,
  Pill,
  FileText,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Shield,
  Heart,
  Activity,
  MessageSquare,
  Printer,
  Send,
  History,
  Sparkles,
  Brain,
  Building2,
  X,
  Info,
  Check,
  Copy,
  Star,
  BookOpen,
} from 'lucide-react'

/* ─── 타입 ─── */
interface MedicationRecord {
  date: string
  clinic: string
  doctor: string
  drugs: { name: string; dose: string; frequency: string; days: number }[]
  copay: number
  note?: string
}

interface DURHistory {
  date: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  drug: string
  message: string
  action: string
}

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  allergies: string[]
  chronicConditions: string[]
  lastVisit: string
  totalVisits: number
  primaryClinic: string
  medications: MedicationRecord[]
  durHistory: DURHistory[]
  notes: string[]
}

/* ─── 더미 데이터 ─── */
const patients: Patient[] = [
  {
    id: 'P001',
    name: '최은지',
    age: 52,
    gender: '여',
    phone: '010-4567-8901',
    allergies: [],
    chronicConditions: ['고혈압', '당뇨', '고지혈증'],
    lastVisit: '2024-01-21',
    totalVisits: 48,
    primaryClinic: '메디매치내과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '메디매치내과',
        doctor: '김원장',
        drugs: [
          { name: '메트포르민정 500mg', dose: '500mg', frequency: '1일 2회 식후', days: 30 },
          { name: '암로디핀정 5mg', dose: '5mg', frequency: '1일 1회', days: 30 },
          { name: '아토르바스타틴정 20mg', dose: '20mg', frequency: '1일 1회 취침전', days: 30 },
          { name: '오메프라졸캡슐 20mg', dose: '20mg', frequency: '1일 1회 식전', days: 14 },
        ],
        copay: 13680,
      },
      {
        date: '2023-12-21',
        clinic: '메디매치내과',
        doctor: '김원장',
        drugs: [
          { name: '메트포르민정 500mg', dose: '500mg', frequency: '1일 2회 식후', days: 30 },
          { name: '암로디핀정 5mg', dose: '5mg', frequency: '1일 1회', days: 30 },
          { name: '아토르바스타틴정 20mg', dose: '20mg', frequency: '1일 1회 취침전', days: 30 },
        ],
        copay: 11200,
      },
    ],
    durHistory: [
      { date: '2024-01-21', type: '중복투여', severity: 'warning', drug: '비타민D 1000IU', message: '타 약국에서 동일 성분 조제 이력 확인', action: '처방의 확인 후 조제' },
    ],
    notes: ['혈당 수첩 매일 기록 중', '메트포르민 위장장애 호소 → 식후 복용 강조'],
  },
  {
    id: 'P002',
    name: '정대현',
    age: 67,
    gender: '남',
    phone: '010-5678-9012',
    allergies: ['아스피린'],
    chronicConditions: ['퇴행성관절염', '골다공증'],
    lastVisit: '2024-01-21',
    totalVisits: 32,
    primaryClinic: '강남정형외과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '강남정형외과',
        doctor: '박원장',
        drugs: [
          { name: '셀레콕시브캡슐 200mg', dose: '200mg', frequency: '1일 2회 식후', days: 7 },
          { name: '에페리손정 50mg', dose: '50mg', frequency: '1일 3회 식후', days: 7 },
          { name: '레바미피드정 100mg', dose: '100mg', frequency: '1일 3회 식후', days: 7 },
        ],
        copay: 5940,
      },
    ],
    durHistory: [],
    notes: ['아스피린 알레르기 → NSAIDs 교차반응 주의', 'COX-2 선택적 억제제 사용 중'],
  },
  {
    id: 'P003',
    name: '한소영',
    age: 41,
    gender: '여',
    phone: '010-6789-0123',
    allergies: [],
    chronicConditions: [],
    lastVisit: '2024-01-21',
    totalVisits: 5,
    primaryClinic: '메디매치내과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '메디매치내과',
        doctor: '김원장',
        drugs: [
          { name: '타이레놀정 500mg', dose: '500mg', frequency: '1일 3회 식후', days: 3 },
          { name: '슈다페드정', dose: '60mg', frequency: '1일 2회', days: 3 },
        ],
        copay: 2520,
      },
    ],
    durHistory: [],
    notes: [],
  },
  {
    id: 'P004',
    name: '오민수',
    age: 8,
    gender: '남',
    phone: '010-7890-1234',
    allergies: [],
    chronicConditions: [],
    lastVisit: '2024-01-21',
    totalVisits: 12,
    primaryClinic: '하나이비인후과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '하나이비인후과',
        doctor: '이원장',
        drugs: [
          { name: '아목시실린시럽 250mg/5ml', dose: '5ml', frequency: '1일 3회 식후', days: 5 },
          { name: '이부프로펜시럽 100mg/5ml', dose: '5ml', frequency: '발열 시', days: 3 },
        ],
        copay: 2760,
        note: '소아 체중 25kg 기준 용량 설정',
      },
    ],
    durHistory: [
      { date: '2024-01-21', type: '연령주의', severity: 'info', drug: '아목시실린시럽', message: '소아 용량 적정 확인 (체중 25kg)', action: '용량 적정 확인 완료' },
    ],
    notes: ['보호자: 오정미 (어머니) 010-7890-1234', '시럽 맛에 예민 - 오렌지맛 선호'],
  },
  {
    id: 'P005',
    name: '강지원',
    age: 72,
    gender: '여',
    phone: '010-8901-2345',
    allergies: ['세팔로스포린', '페니실린'],
    chronicConditions: ['만성기관지염', '고혈압'],
    lastVisit: '2024-01-21',
    totalVisits: 56,
    primaryClinic: '메디매치내과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '메디매치내과',
        doctor: '김원장',
        drugs: [
          { name: '카르보시스테인정 500mg', dose: '500mg', frequency: '1일 3회', days: 7 },
        ],
        copay: 3200,
        note: '세프디니르 → 알레르기 금기로 처방 변경',
      },
    ],
    durHistory: [
      { date: '2024-01-21', type: '알레르기', severity: 'critical', drug: '세프디니르캡슐 100mg', message: '세팔로스포린 알레르기 환자 - 투약 금기', action: '처방의 연락 → 대체약으로 변경' },
    ],
    notes: ['세팔로스포린 + 페니실린 교차알레르기', '마크로라이드계 항생제 대체 사용 권고'],
  },
  {
    id: 'P006',
    name: '김영수',
    age: 45,
    gender: '남',
    phone: '010-1234-5678',
    allergies: ['페니실린'],
    chronicConditions: [],
    lastVisit: '2024-01-21',
    totalVisits: 8,
    primaryClinic: '메디매치내과',
    medications: [
      {
        date: '2024-01-21',
        clinic: '메디매치내과',
        doctor: '김원장',
        drugs: [
          { name: '아목시실린캡슐 500mg', dose: '500mg', frequency: '1일 3회', days: 5 },
          { name: '이부프로펜정 200mg', dose: '200mg', frequency: '1일 3회 식후', days: 5 },
        ],
        copay: 3750,
      },
    ],
    durHistory: [
      { date: '2024-01-21', type: '병용주의', severity: 'warning', drug: '이부프로펜정 200mg', message: '아스피린과 병용 시 위장관 출혈 위험 증가', action: '확인 후 조제 진행' },
    ],
    notes: ['페니실린 알레르기 있으나 아목시실린은 처방의 판단 하 사용'],
  },
]

/* ─── 유틸 ─── */
const durSeverityConfig = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', label: '금기' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: '주의' },
  info: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: '정보' },
}

export default function PharmacyPatientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<'medications' | 'dur' | 'guide' | 'notes'>('medications')
  const [showGuideModal, setShowGuideModal] = useState(false)

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return patients
    const q = searchQuery.toLowerCase()
    return patients.filter(p =>
      p.name.includes(q) ||
      p.phone.includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.chronicConditions.some(c => c.includes(q))
    )
  }, [searchQuery])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">복약지도/환자기록</h1>
          <p className="text-sm text-muted-foreground mt-1">환자별 조제이력, DUR 기록, AI 복약지도</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
            총 <span className="font-semibold text-foreground">{patients.length}</span>명 등록
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 환자 목록 */}
        <div className="card lg:col-span-1">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="이름, 전화번호, 질환..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 py-2 text-sm w-full"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
            {filtered.map(patient => (
              <button
                key={patient.id}
                onClick={() => { setSelectedPatient(patient); setActiveTab('medications') }}
                className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${selectedPatient?.id === patient.id ? 'bg-purple-50 dark:bg-purple-900/10 border-l-2 border-purple-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${patient.allergies.length > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    <span className={`text-sm font-bold ${patient.allergies.length > 0 ? 'text-red-600' : 'text-purple-600'}`}>
                      {patient.name[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{patient.name}</span>
                      <span className="text-2xs text-muted-foreground">{patient.gender}/{patient.age}세</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {patient.chronicConditions.slice(0, 2).map(c => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-secondary text-2xs text-muted-foreground">{c}</span>
                      ))}
                      {patient.chronicConditions.length > 2 && (
                        <span className="text-2xs text-muted-foreground">+{patient.chronicConditions.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xs text-muted-foreground">{patient.lastVisit}</div>
                    <div className="text-2xs text-muted-foreground">{patient.totalVisits}회</div>
                  </div>
                </div>
                {patient.allergies.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-2xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    알레르기: {patient.allergies.join(', ')}
                  </div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">검색 결과 없음</p>
              </div>
            )}
          </div>
        </div>

        {/* 환자 상세 */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-4">
              {/* 환자 프로필 카드 */}
              <div className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${selectedPatient.allergies.length > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    <span className={`text-2xl font-bold ${selectedPatient.allergies.length > 0 ? 'text-red-600' : 'text-purple-600'}`}>
                      {selectedPatient.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                      <span className="text-sm text-muted-foreground">{selectedPatient.gender} / {selectedPatient.age}세</span>
                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-2xs font-medium text-purple-600">ID: {selectedPatient.id}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedPatient.phone}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {selectedPatient.primaryClinic}</span>
                      <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" /> {selectedPatient.totalVisits}회 방문</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {selectedPatient.chronicConditions.map(c => (
                        <span key={c} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 font-medium">{c}</span>
                      ))}
                      {selectedPatient.allergies.map(a => (
                        <span key={a} className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="btn-sm text-xs bg-secondary text-foreground">
                      <Phone className="w-3 h-3" /> 연락
                    </button>
                    <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }} onClick={() => setShowGuideModal(true)}>
                      <Sparkles className="w-3 h-3" /> AI 복약지도
                    </button>
                  </div>
                </div>
              </div>

              {/* 탭 */}
              <div className="flex items-center gap-1 border-b border-border">
                {[
                  { key: 'medications', label: '조제이력', icon: Pill },
                  { key: 'dur', label: 'DUR기록', icon: Shield },
                  { key: 'guide', label: '복약지도', icon: BookOpen },
                  { key: 'notes', label: '메모', icon: MessageSquare },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.key === 'dur' && selectedPatient.durHistory.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-2xs flex items-center justify-center">
                        {selectedPatient.durHistory.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 탭 콘텐츠 */}
              <div className="card">
                {/* 조제이력 */}
                {activeTab === 'medications' && (
                  <div className="divide-y divide-border">
                    {selectedPatient.medications.map((med, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{med.date}</div>
                              <div className="text-2xs text-muted-foreground">{med.clinic} · {med.doctor}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">₩{med.copay.toLocaleString()}</div>
                            <div className="text-2xs text-muted-foreground">본인부담</div>
                          </div>
                        </div>
                        <div className="space-y-2 ml-11">
                          {med.drugs.map((drug, di) => (
                            <div key={di} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                              <div className="flex items-center gap-2">
                                <Pill className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-sm font-medium">{drug.name}</span>
                              </div>
                              <div className="text-2xs text-muted-foreground">
                                {drug.dose} · {drug.frequency} · {drug.days}일
                              </div>
                            </div>
                          ))}
                          {med.note && (
                            <div className="text-2xs text-muted-foreground italic ml-1">
                              * {med.note}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-11 mt-3">
                          <button className="btn-sm text-2xs bg-secondary text-foreground">
                            <Printer className="w-3 h-3" /> 복약지도 출력
                          </button>
                          <button className="btn-sm text-2xs bg-secondary text-foreground">
                            <Copy className="w-3 h-3" /> 처방전 복사
                          </button>
                        </div>
                      </div>
                    ))}
                    {selectedPatient.medications.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Pill className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">조제이력이 없습니다</p>
                      </div>
                    )}
                  </div>
                )}

                {/* DUR 기록 */}
                {activeTab === 'dur' && (
                  <div className="divide-y divide-border">
                    {selectedPatient.durHistory.length > 0 ? (
                      selectedPatient.durHistory.map((dur, i) => {
                        const dc = durSeverityConfig[dur.severity]
                        return (
                          <div key={i} className={`p-4 ${dc.bg}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dur.severity === 'critical' ? 'bg-red-200 dark:bg-red-800/50' : dur.severity === 'warning' ? 'bg-amber-200 dark:bg-amber-800/50' : 'bg-blue-200 dark:bg-blue-800/50'}`}>
                                {dur.severity === 'critical' ? <AlertCircle className="w-4 h-4 text-red-600" /> : dur.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Info className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-2xs font-bold ${dc.color} ${dc.bg}`}>{dur.type}</span>
                                  <span className={`text-2xs font-semibold ${dc.color}`}>{dc.label}</span>
                                  <span className="text-2xs text-muted-foreground">{dur.date}</span>
                                </div>
                                <div className="text-sm font-medium mt-1">{dur.drug}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{dur.message}</div>
                                <div className="text-xs mt-2 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 font-medium">조치: {dur.action}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Shield className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">DUR 이력이 없습니다</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 복약지도 */}
                {activeTab === 'guide' && (
                  <div className="p-5">
                    {selectedPatient.medications.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                          <Brain className="w-5 h-5 text-purple-500" />
                          <div>
                            <div className="text-sm font-semibold text-purple-600">AI 복약지도 생성</div>
                            <div className="text-2xs text-purple-500">최근 처방 기준으로 환자 맞춤 복약지도를 자동 생성합니다</div>
                          </div>
                          <button className="ml-auto btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }} onClick={() => setShowGuideModal(true)}>
                            <Sparkles className="w-3 h-3" /> 생성
                          </button>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">현재 복용 중인 약물</h4>
                          {selectedPatient.medications[0].drugs.map((drug, di) => (
                            <div key={di} className="p-4 rounded-xl border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <Pill className="w-4 h-4 text-purple-500" />
                                <span className="font-semibold text-sm">{drug.name}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground ml-6">
                                <div>
                                  <div className="text-2xs text-muted-foreground">복용량</div>
                                  <div className="font-medium text-foreground">{drug.dose}</div>
                                </div>
                                <div>
                                  <div className="text-2xs text-muted-foreground">복용법</div>
                                  <div className="font-medium text-foreground">{drug.frequency}</div>
                                </div>
                                <div>
                                  <div className="text-2xs text-muted-foreground">기간</div>
                                  <div className="font-medium text-foreground">{drug.days}일</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedPatient.chronicConditions.length > 0 && (
                          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                            <div className="text-xs font-semibold text-blue-600 mb-1">만성질환 관리 포인트</div>
                            <ul className="text-xs text-blue-600 space-y-1">
                              {selectedPatient.chronicConditions.includes('당뇨') && <li>• 혈당 정기 측정 및 기록, 저혈당 증상 교육</li>}
                              {selectedPatient.chronicConditions.includes('고혈압') && <li>• 혈압 정기 측정, 저염식 권고</li>}
                              {selectedPatient.chronicConditions.includes('고지혈증') && <li>• 스타틴 취침 전 복용, 근육통 모니터링</li>}
                              {selectedPatient.chronicConditions.includes('퇴행성관절염') && <li>• 위장장애 증상 모니터링, 필요시 위장약 병용</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">처방이력이 없어 복약지도를 생성할 수 없습니다</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 메모 */}
                {activeTab === 'notes' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="새 메모 입력..."
                        className="input py-2 text-sm flex-1"
                      />
                      <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                        추가
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedPatient.notes.length > 0 ? (
                        selectedPatient.notes.map((note, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 text-sm">{note}</div>
                            <button className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-sm text-muted-foreground">메모가 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">환자를 선택해주세요</p>
              <p className="text-sm">왼쪽 목록에서 환자를 선택하면 상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* AI 복약지도 모달 */}
      {showGuideModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGuideModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI 복약지도
              </h3>
              <button onClick={() => setShowGuideModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-purple-600">{selectedPatient.name}님 맞춤 복약지도</div>
                <div className="text-2xs text-purple-500 mt-0.5">AI가 환자의 처방이력, 알레르기, 질환을 분석하여 생성했습니다</div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <h4 className="text-sm font-bold mb-2">복용 안내</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {selectedPatient.medications[0]?.drugs.map((drug, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-2xs flex-shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <span className="font-medium text-foreground">{drug.name}</span>
                          <div>{drug.frequency}, {drug.days}일간 복용하세요.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPatient.allergies.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <h4 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> 알레르기 주의
                    </h4>
                    <p className="text-xs text-red-600">
                      {selectedPatient.allergies.join(', ')} 성분에 알레르기가 있습니다.
                      약 복용 후 발진, 두드러기, 호흡곤란 등의 증상이 나타나면 즉시 복용을 중단하고 의료진에게 연락하세요.
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <h4 className="text-sm font-bold text-amber-700 mb-1">주의사항</h4>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• 처방된 용법·용량을 정확히 지켜 복용하세요</li>
                    <li>• 증상이 호전되더라도 처방 기간을 완수하세요</li>
                    <li>• 음주는 약물 효과에 영향을 줄 수 있으니 삼가세요</li>
                    <li>• 이상반응 발생 시 즉시 약사 또는 의사와 상담하세요</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn-sm text-xs flex-1" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                  <Printer className="w-3 h-3" /> 인쇄
                </button>
                <button className="btn-sm text-xs flex-1 bg-secondary text-foreground">
                  <Send className="w-3 h-3" /> 카카오톡 전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

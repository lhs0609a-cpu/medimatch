'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  Mic,
  FileText,
  Pill,
  Activity,
  Heart,
  Thermometer,
  Droplets,
  Scale,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Syringe,
  Eye,
  MessageSquare,
  Send,
  Clipboard,
  TrendingUp,
  TrendingDown,
  User,
  Shield,
  Tag,
  History,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 더미 환자 데이터 ─── */
const patient = {
  id: 1,
  chartNo: 'C-20230101',
  name: '김영수',
  age: 45,
  gender: 'M',
  birthDate: '1980-03-15',
  phone: '010-1234-5678',
  address: '서울시 강남구 역삼동 123-45',
  insurance: '건강보험',
  rrn: '800315-1******',
  registeredAt: '2023-01-01',
  tags: ['정기검진', 'VIP', '고혈압'],
  allergies: ['페니실린'],
  currentMeds: ['암로디핀 5mg 1일1회', '아스피린 100mg 1일1회'],
  memo: '직장인, 평일 오전 선호. 혈압약 복용 중.',
}

const vitals = [
  { date: '2025-02-21', bp: '130/85', hr: 72, temp: 36.5, weight: 78, height: 175 },
  { date: '2025-01-21', bp: '135/88', hr: 75, temp: 36.6, weight: 78.5, height: 175 },
  { date: '2024-12-20', bp: '128/82', hr: 70, temp: 36.4, weight: 79, height: 175 },
  { date: '2024-11-15', bp: '140/92', hr: 78, temp: 36.5, weight: 80, height: 175 },
]

const visitHistory = [
  {
    id: 1,
    date: '2025-02-21',
    time: '10:30',
    type: '외래',
    cc: '정기 혈압 체크',
    pi: '고혈압으로 투약 중. 최근 혈압 안정적. 두통, 어지러움 없음. 가슴 답답함 없음.',
    dx: [{ code: 'I10', name: '본태성 고혈압' }],
    rx: [
      { name: '암로디핀 5mg', dose: '1일 1회', days: 30, qty: 30 },
      { name: '아스피린 100mg', dose: '1일 1회', days: 30, qty: 30 },
    ],
    vitals: { bp: '130/85', hr: 72 },
    doctor: '김원장',
    claimStatus: 'claimed',
    pharmacyStatus: 'completed',
  },
  {
    id: 2,
    date: '2025-01-21',
    time: '11:00',
    type: '외래',
    cc: '혈압약 처방 + 감기 증상',
    pi: '3일 전부터 기침, 콧물. 발열 없음. 혈압약 복용 잘 하고 있음. 식사 잘 함.',
    dx: [
      { code: 'I10', name: '본태성 고혈압' },
      { code: 'J06.9', name: '급성 상기도감염' },
    ],
    rx: [
      { name: '암로디핀 5mg', dose: '1일 1회', days: 30, qty: 30 },
      { name: '아스피린 100mg', dose: '1일 1회', days: 30, qty: 30 },
      { name: '덱스트로메토판 15mg', dose: '1일 3회', days: 5, qty: 15 },
      { name: '슈도에페드린 60mg', dose: '1일 3회', days: 5, qty: 15 },
    ],
    vitals: { bp: '135/88', hr: 75 },
    doctor: '김원장',
    claimStatus: 'claimed',
    pharmacyStatus: 'completed',
  },
  {
    id: 3,
    date: '2024-12-20',
    time: '09:30',
    type: '외래',
    cc: '정기 검진',
    pi: '혈압 안정적. 혈액검사 결과 정상 범위. LDL 콜레스테롤 경계치(135mg/dL).',
    dx: [{ code: 'I10', name: '본태성 고혈압' }],
    rx: [
      { name: '암로디핀 5mg', dose: '1일 1회', days: 30, qty: 30 },
      { name: '아스피린 100mg', dose: '1일 1회', days: 30, qty: 30 },
    ],
    vitals: { bp: '128/82', hr: 70 },
    doctor: '김원장',
    claimStatus: 'claimed',
    pharmacyStatus: 'completed',
  },
]

const labResults = [
  {
    date: '2024-12-20',
    category: '혈액검사',
    items: [
      { name: 'WBC', value: '6,800', unit: '/uL', range: '4,000-10,000', status: 'normal' },
      { name: 'Hb', value: '14.2', unit: 'g/dL', range: '13.0-17.0', status: 'normal' },
      { name: 'PLT', value: '245,000', unit: '/uL', range: '150,000-400,000', status: 'normal' },
      { name: 'FBS', value: '98', unit: 'mg/dL', range: '70-100', status: 'normal' },
      { name: 'HbA1c', value: '5.8', unit: '%', range: '4.0-5.6', status: 'high' },
      { name: 'Total Chol', value: '210', unit: 'mg/dL', range: '0-200', status: 'high' },
      { name: 'LDL', value: '135', unit: 'mg/dL', range: '0-130', status: 'high' },
      { name: 'HDL', value: '48', unit: 'mg/dL', range: '40-60', status: 'normal' },
      { name: 'Creatinine', value: '0.9', unit: 'mg/dL', range: '0.7-1.3', status: 'normal' },
      { name: 'AST', value: '25', unit: 'IU/L', range: '0-40', status: 'normal' },
      { name: 'ALT', value: '30', unit: 'IU/L', range: '0-40', status: 'normal' },
    ],
  },
]

type TabKey = 'chart' | 'vitals' | 'labs' | 'prescription' | 'memo'

export default function PatientDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('chart')
  const [expandedVisit, setExpandedVisit] = useState<number | null>(1)

  const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
    { key: 'chart', label: '진료기록', icon: FileText },
    { key: 'vitals', label: '바이탈', icon: Activity },
    { key: 'labs', label: '검사결과', icon: Droplets },
    { key: 'prescription', label: '처방이력', icon: Pill },
    { key: 'memo', label: '메모', icon: MessageSquare },
  ]

  const claimStatusMap: Record<string, { label: string; class: string }> = {
    pending: { label: '미청구', class: 'badge-warning' },
    claimed: { label: '청구완료', class: 'badge-success' },
    rejected: { label: '삭감', class: 'badge-danger' },
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 상단 네비 ───── */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/emr/patients" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          환자 목록
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold">{patient.name}</span>
      </div>

      {/* ───── 환자 프로필 헤더 ───── */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* 기본 정보 */}
          <div className="flex items-start gap-4">
            <div className="avatar avatar-xl bg-primary/10 text-primary flex-shrink-0">
              <span className="text-xl font-bold">{patient.name[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{patient.name}</h1>
                <span className="text-sm text-muted-foreground">{patient.age}세 {patient.gender === 'M' ? '남' : '여'}</span>
                <span className="text-xs text-muted-foreground font-mono">{patient.chartNo}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {patient.tags.map((tag) => (
                  <span key={tag} className="badge-primary text-2xs">{tag}</span>
                ))}
                {patient.allergies.length > 0 && (
                  <span className="badge-danger text-2xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    알레르기: {patient.allergies.join(', ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {patient.birthDate}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  {patient.phone}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  {patient.insurance}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <History className="w-3.5 h-3.5" />
                  초진 {patient.registeredAt}
                </div>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn-outline btn-sm">
              <Printer className="w-3.5 h-3.5" />
              출력
            </button>
            <button className="btn-outline btn-sm">
              <Edit3 className="w-3.5 h-3.5" />
              편집
            </button>
            <Link href="/emr/chart/new" className="btn-primary btn-sm">
              <Mic className="w-3.5 h-3.5" />
              AI 진료 시작
            </Link>
          </div>
        </div>

        {/* 현재 투약 */}
        {patient.currentMeds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold">현재 투약</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.currentMeds.map((med, i) => (
                <span key={i} className="badge-default text-xs">{med}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ───── 탭 네비게이션 ───── */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ───── 탭 콘텐츠 ───── */}

      {/* 진료기록 탭 */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          {visitHistory.map((visit) => {
            const isExpanded = expandedVisit === visit.id
            const claimSt = claimStatusMap[visit.claimStatus]
            return (
              <div key={visit.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/30 transition-colors"
                >
                  {/* 날짜 */}
                  <div className="flex-shrink-0 text-center w-16">
                    <div className="text-lg font-bold">{new Date(visit.date).getDate()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(visit.date).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' })}
                    </div>
                  </div>

                  <div className="w-px h-10 bg-border flex-shrink-0" />

                  {/* 요약 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{visit.cc}</span>
                      <span className={`text-2xs ${claimSt.class}`}>{claimSt.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {visit.dx.map(d => `${d.code} ${d.name}`).join(' / ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{visit.time}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 animate-fade-in-down">
                    <div className="h-px bg-border" />

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* 좌: 차트 내용 */}
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">C/C (주호소)</div>
                          <div className="text-sm">{visit.cc}</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">P/I (현병력)</div>
                          <div className="text-sm leading-relaxed">{visit.pi}</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">진단 (Dx)</div>
                          <div className="space-y-1">
                            {visit.dx.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{d.code}</span>
                                <span>{d.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">바이탈</div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-400" />
                              BP {visit.vitals.bp}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-blue-400" />
                              HR {visit.vitals.hr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 우: 처방 */}
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">처방 (Rx)</div>
                        <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                          {visit.rx.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Pill className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                <span className="font-medium">{r.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {r.dose} · {r.days}일분
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>담당: {visit.doctor}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            {visit.pharmacyStatus === 'completed' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                조제완료
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-500" />
                                조제대기
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 바이탈 탭 */}
      {activeTab === 'vitals' && (
        <div className="card">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold">바이탈 기록</h3>
            <button className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              기록 추가
            </button>
          </div>

          {/* 바이탈 트렌드 카드 */}
          <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-border">
            {[
              { label: '혈압', value: vitals[0].bp, icon: Heart, color: 'text-red-500', trend: 'down', prev: vitals[1].bp },
              { label: '심박수', value: `${vitals[0].hr} bpm`, icon: Activity, color: 'text-blue-500', trend: 'down', prev: `${vitals[1].hr} bpm` },
              { label: '체온', value: `${vitals[0].temp}°C`, icon: Thermometer, color: 'text-amber-500', trend: 'same', prev: `${vitals[1].temp}°C` },
              { label: '체중', value: `${vitals[0].weight} kg`, icon: Scale, color: 'text-emerald-500', trend: 'down', prev: `${vitals[1].weight} kg` },
              { label: '키', value: `${vitals[0].height} cm`, icon: User, color: 'text-purple-500', trend: 'same', prev: `${vitals[1].height} cm` },
            ].map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-secondary/30 text-center">
                <v.icon className={`w-5 h-5 ${v.color} mx-auto mb-2`} />
                <div className="text-lg font-bold">{v.value}</div>
                <div className="text-2xs text-muted-foreground">{v.label}</div>
              </div>
            ))}
          </div>

          {/* 바이탈 히스토리 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 font-semibold text-xs text-muted-foreground">날짜</th>
                  <th className="text-center p-3 font-semibold text-xs text-muted-foreground">혈압</th>
                  <th className="text-center p-3 font-semibold text-xs text-muted-foreground">심박수</th>
                  <th className="text-center p-3 font-semibold text-xs text-muted-foreground">체온</th>
                  <th className="text-center p-3 font-semibold text-xs text-muted-foreground">체중</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vitals.map((v, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-medium">{v.date}</td>
                    <td className="p-3 text-center">
                      <span className={parseInt(v.bp.split('/')[0]) >= 140 ? 'text-red-500 font-semibold' : ''}>
                        {v.bp}
                      </span>
                    </td>
                    <td className="p-3 text-center">{v.hr}</td>
                    <td className="p-3 text-center">{v.temp}°C</td>
                    <td className="p-3 text-center">{v.weight} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 검사결과 탭 */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labResults.map((lab, li) => (
            <div key={li} className="card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{lab.category}</h3>
                  <div className="text-xs text-muted-foreground">{lab.date}</div>
                </div>
                <button className="btn-outline btn-sm">
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-3 font-semibold text-xs text-muted-foreground">검사항목</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">결과</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">단위</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">참고치</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">판정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lab.items.map((item, i) => (
                      <tr key={i} className={`hover:bg-secondary/30 transition-colors ${item.status === 'high' ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className={`p-3 text-center font-semibold ${item.status === 'high' ? 'text-red-500' : item.status === 'low' ? 'text-blue-500' : ''}`}>
                          {item.value}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{item.unit}</td>
                        <td className="p-3 text-center text-muted-foreground text-xs">{item.range}</td>
                        <td className="p-3 text-center">
                          {item.status === 'normal' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />}
                          {item.status === 'high' && <TrendingUp className="w-4 h-4 text-red-500 mx-auto" />}
                          {item.status === 'low' && <TrendingDown className="w-4 h-4 text-blue-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 처방이력 탭 */}
      {activeTab === 'prescription' && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold">처방 이력</h3>
          </div>

          <div className="divide-y divide-border">
            {visitHistory.map((visit) => (
              <div key={visit.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold">{visit.date}</span>
                  <span className="text-xs text-muted-foreground">{visit.dx.map(d => d.name).join(', ')}</span>
                </div>
                <div className="space-y-1.5">
                  {visit.rx.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-secondary/30 rounded-lg px-3 py-2">
                      <Pill className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="font-medium flex-1">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.dose}</span>
                      <span className="text-xs text-muted-foreground">{r.days}일분</span>
                      <span className="text-xs font-medium">x{r.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메모 탭 */}
      {activeTab === 'memo' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">환자 메모</h3>
            <button className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />
              메모 추가
            </button>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">김원장 · 2025-02-21</span>
            </div>
            <p className="text-sm">{patient.memo}</p>
          </div>

          <textarea
            className="textarea"
            placeholder="새 메모를 입력하세요..."
            rows={3}
          />
          <div className="flex justify-end">
            <button className="btn-primary btn-sm">
              <Send className="w-3.5 h-3.5" />
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

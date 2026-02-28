'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Sparkles,
  Loader2,
  Info,
  Plus,
  Trash2,
  Save,
  Send,
  FileText,
  Pill,
  Stethoscope,
  Shield,
  X,
  Clock,
} from 'lucide-react'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 타입 ─── */
interface Patient {
  id: string
  chart_no: string
  name: string
  age: number
  gender: string
  phone?: string
}

interface DiagnosisCode {
  code: string
  name: string
  category?: string
}

interface TreatmentItem {
  id: string
  code: string
  name: string
  item_type: 'fee' | 'drug'
  quantity: number
  unit_price: number
  total_price: number
  dur_warning?: string | null
}

interface AIReviewResult {
  risk_score: number
  pass_probability: number
  issues: { item_code: string; severity: string; message: string }[]
  suggestions: string[]
  optimized_amount: number
}

/* ─── 데모 데이터 ─── */
const demoPatients: Patient[] = [
  { id: 'P001', chart_no: 'C2024-0001', name: '강지원', age: 45, gender: 'M', phone: '010-1234-5678' },
  { id: 'P002', chart_no: 'C2024-0002', name: '이미경', age: 38, gender: 'F', phone: '010-2345-6789' },
  { id: 'P003', chart_no: 'C2024-0003', name: '박준호', age: 62, gender: 'M', phone: '010-3456-7890' },
  { id: 'P004', chart_no: 'C2024-0004', name: '김영수', age: 55, gender: 'M', phone: '010-4567-8901' },
  { id: 'P005', chart_no: 'C2024-0005', name: '한상우', age: 29, gender: 'M', phone: '010-5678-9012' },
]

const demoDiagnoses: DiagnosisCode[] = [
  { code: 'J06.9', name: '급성 상기도감염, 상세불명', category: '호흡기' },
  { code: 'J20.9', name: '급성 기관지염, 상세불명', category: '호흡기' },
  { code: 'K29.5', name: '만성 위염, 상세불명', category: '소화기' },
  { code: 'I10', name: '본태성(원발성) 고혈압', category: '순환기' },
  { code: 'E11.9', name: '합병증을 동반하지 않은 2형 당뇨병', category: '내분비' },
  { code: 'M54.5', name: '요통', category: '근골격' },
  { code: 'R51', name: '두통', category: '증상' },
]

const demoTreatments: Omit<TreatmentItem, 'id' | 'quantity' | 'total_price'>[] = [
  { code: 'AA157', name: '초진 진찰료', item_type: 'fee', unit_price: 18400, dur_warning: null },
  { code: 'C5211', name: '일반 혈액검사 (CBC)', item_type: 'fee', unit_price: 4800, dur_warning: null },
  { code: 'C3811', name: 'CRP 정량', item_type: 'fee', unit_price: 5600, dur_warning: null },
  { code: 'E6541', name: '흉부 X-ray (2방향)', item_type: 'fee', unit_price: 15200, dur_warning: null },
  { code: 'EB411', name: '심전도 (12유도)', item_type: 'fee', unit_price: 12400, dur_warning: null },
  { code: 'J1201', name: '아세트아미노펜정 500mg', item_type: 'drug', unit_price: 120, dur_warning: null },
  { code: 'J1301', name: '아목시실린캡슐 250mg', item_type: 'drug', unit_price: 85, dur_warning: null },
  { code: 'J2101', name: '이부프로펜정 200mg', item_type: 'drug', unit_price: 95, dur_warning: '위장관 출혈 위험 — 위장질환 이력 확인 필요' },
  { code: 'D2711', name: '갑상선 기능검사 (TSH)', item_type: 'fee', unit_price: 8900, dur_warning: null },
]

const demoAIReview: AIReviewResult = {
  risk_score: 82,
  pass_probability: 94.2,
  issues: [
    { item_code: 'EB411', severity: 'medium', message: '초진 환자에 대한 심전도 검사의 의학적 필요성 소견 필요' },
    { item_code: 'D2711', severity: 'high', message: '주호소와 갑상선 검사의 관련성이 부족합니다' },
  ],
  suggestions: [
    '흉부 X-ray와 심전도를 동시 청구할 경우 호흡기 증상과 순환기 증상을 각각 차트에 기재하세요.',
    '갑상선 기능검사(TSH)는 주호소와의 관련성이 부족하면 삭감 가능성이 높습니다. 관련 증상 기록을 추가하거나 해당 항목을 제외하세요.',
    '진료 기록에 "~로 인해" 등 의학적 사유를 명시하면 통과율이 향상됩니다.',
  ],
  optimized_amount: 270800,
}

/* ─── 스텝 정의 ─── */
const steps = [
  { num: 1, label: '환자 선택', icon: Users },
  { num: 2, label: '진단 입력', icon: FileText },
  { num: 3, label: '처치/약제', icon: Pill },
  { num: 4, label: 'AI 검토', icon: Brain },
]

let itemIdCounter = 0
function nextItemId() {
  itemIdCounter += 1
  return `item-${itemIdCounter}`
}

export default function NewClaimPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  /* Step 1: Patient */
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>(demoPatients)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  /* Step 2: Diagnosis */
  const [diagSearch, setDiagSearch] = useState('')
  const [diagResults, setDiagResults] = useState<DiagnosisCode[]>([])
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisCode[]>([])

  /* Step 3: Treatments */
  const [treatSearch, setTreatSearch] = useState('')
  const [treatResults, setTreatResults] = useState<Omit<TreatmentItem, 'id' | 'quantity' | 'total_price'>[]>([])
  const [items, setItems] = useState<TreatmentItem[]>([])

  /* Step 4: AI Review */
  const [aiReview, setAiReview] = useState<AIReviewResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  /* ─── 총액 ─── */
  const totalAmount = items.reduce((s, i) => s + i.total_price, 0)

  /* ─── 환자 검색 ─── */
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true
    const q = patientSearch.toLowerCase()
    return p.name.includes(q) || p.chart_no.toLowerCase().includes(q)
  })

  /* ─── 진단 코드 검색 ─── */
  useEffect(() => {
    if (!diagSearch || diagSearch.length < 1) {
      setDiagResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(`/hira-codes/disease?q=${encodeURIComponent(diagSearch)}`)
        setDiagResults(res.data || [])
      } catch {
        const q = diagSearch.toLowerCase()
        setDiagResults(demoDiagnoses.filter((d) => d.code.toLowerCase().includes(q) || d.name.includes(q)))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [diagSearch])

  /* ─── 처치/약제 검색 ─── */
  useEffect(() => {
    if (!treatSearch || treatSearch.length < 1) {
      setTreatResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const [feeRes, drugRes] = await Promise.all([
          fetchApi(`/hira-codes/fee?q=${encodeURIComponent(treatSearch)}`),
          fetchApi(`/hira-codes/drug?q=${encodeURIComponent(treatSearch)}`),
        ])
        setTreatResults([...(feeRes.data || []), ...(drugRes.data || [])])
      } catch {
        const q = treatSearch.toLowerCase()
        setTreatResults(demoTreatments.filter((t) => t.code.toLowerCase().includes(q) || t.name.includes(q)))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [treatSearch])

  /* ─── 항목 추가 ─── */
  const addItem = (t: Omit<TreatmentItem, 'id' | 'quantity' | 'total_price'>) => {
    if (items.find((i) => i.code === t.code)) return
    setItems((prev) => [
      ...prev,
      { ...t, id: nextItemId(), quantity: 1, total_price: t.unit_price },
    ])
    setTreatSearch('')
    setTreatResults([])
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty, total_price: i.unit_price * qty } : i))
    )
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  /* ─── 자동 저장 ─── */
  const autoSave = useCallback(async () => {
    if (!selectedPatient || items.length === 0) return
    setSaving(true)
    try {
      await fetchApi('/claims/', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          diagnoses: selectedDiagnoses.map((d) => d.code),
          items: items.map((i) => ({ code: i.code, quantity: i.quantity, unit_price: i.unit_price })),
          status: 'DRAFT',
        }),
      })
      setLastSaved(new Date().toLocaleTimeString('ko-KR'))
    } catch {
      // Silent fail for auto-save
    } finally {
      setSaving(false)
    }
  }, [selectedPatient, selectedDiagnoses, items])

  useEffect(() => {
    if (currentStep >= 3 && items.length > 0) {
      const timer = setTimeout(autoSave, 5000)
      return () => clearTimeout(timer)
    }
  }, [items, currentStep, autoSave])

  /* ─── AI 검토 ─── */
  const runAIReview = async () => {
    setAiLoading(true)
    try {
      const res = await fetchApi('/claims/ai-review', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatient?.id,
          diagnoses: selectedDiagnoses.map((d) => d.code),
          items: items.map((i) => ({ code: i.code, quantity: i.quantity, unit_price: i.unit_price })),
        }),
      })
      setAiReview(res)
    } catch {
      setAiReview(demoAIReview)
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (currentStep === 4 && !aiReview) {
      runAIReview()
    }
  }, [currentStep])

  /* ─── 최종 제출 ─── */
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetchApi('/claims/', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatient?.id,
          diagnoses: selectedDiagnoses.map((d) => d.code),
          items: items.map((i) => ({ code: i.code, quantity: i.quantity, unit_price: i.unit_price })),
          status: 'READY',
        }),
      })
      router.push('/emr/claims')
    } catch {
      alert('청구 제출에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ─── 스텝 이동 가능 여부 ─── */
  const canNext = () => {
    if (currentStep === 1) return !!selectedPatient
    if (currentStep === 2) return selectedDiagnoses.length > 0
    if (currentStep === 3) return items.length > 0
    return false
  }

  const scoreColor = (score: number) =>
    score >= 90 ? 'text-emerald-600' : score >= 75 ? 'text-amber-600' : 'text-red-600'
  const scoreTrack = (score: number) =>
    score >= 90 ? 'stroke-emerald-500' : score >= 75 ? 'stroke-amber-500' : 'stroke-red-500'

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">새 보험청구 작성</h1>
          <p className="text-sm text-muted-foreground mt-1">
            4단계 마법사로 간편하게 보험청구를 생성합니다
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> 저장 중...
            </span>
          )}
          {lastSaved && !saving && (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" /> 마지막 저장: {lastSaved}
            </span>
          )}
        </div>
      </div>

      {/* ───── 스텝 인디케이터 ───── */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const StepIcon = step.icon
            const isActive = currentStep === step.num
            const isDone = currentStep > step.num
            return (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-2xs mt-1.5 font-medium ${
                      isActive ? 'text-primary' : isDone ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                      currentStep > step.num ? 'bg-emerald-400' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ───── 스텝 1: 환자 선택 ───── */}
      {currentStep === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> 환자 선택
          </h2>

          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="환자 이름 또는 차트번호로 검색..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>

          {selectedPatient && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold">{selectedPatient.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedPatient.chart_no} · {selectedPatient.age}세 · {selectedPatient.gender === 'M' ? '남' : '여'}
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="btn-outline btn-sm text-xs">
                <X className="w-3 h-3" /> 변경
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filteredPatients.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedPatient?.id === p.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">{p.name[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.chart_no} · {p.age}세 · {p.gender === 'M' ? '남' : '여'}
                    {p.phone && ` · ${p.phone}`}
                  </div>
                </div>
                {selectedPatient?.id === p.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── 스텝 2: 진단 입력 ───── */}
      {currentStep === 2 && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> 진단 코드 입력
          </h2>

          <div className="relative">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="진단코드 또는 질병명 검색 (예: J06, 감기)..."
                value={diagSearch}
                onChange={(e) => setDiagSearch(e.target.value)}
                className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
              />
            </div>

            {diagResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 card shadow-xl max-h-[300px] overflow-y-auto divide-y divide-border">
                {diagResults.map((d) => (
                  <div
                    key={d.code}
                    onClick={() => {
                      if (!selectedDiagnoses.find((sd) => sd.code === d.code)) {
                        setSelectedDiagnoses((prev) => [...prev, d])
                      }
                      setDiagSearch('')
                      setDiagResults([])
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer"
                  >
                    <span className="text-xs font-mono text-primary font-bold">{d.code}</span>
                    <span className="text-sm">{d.name}</span>
                    {d.category && (
                      <span className="text-2xs px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground ml-auto">
                        {d.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDiagnoses.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">선택된 진단 ({selectedDiagnoses.length})</div>
              {selectedDiagnoses.map((d, idx) => (
                <div key={d.code} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <span className="text-xs font-bold text-primary w-6">{idx === 0 ? '주' : '부'}</span>
                  <span className="text-xs font-mono text-muted-foreground">{d.code}</span>
                  <span className="text-sm flex-1">{d.name}</span>
                  <button
                    onClick={() => setSelectedDiagnoses((prev) => prev.filter((sd) => sd.code !== d.code))}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedDiagnoses.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              진단 코드를 검색하여 추가하세요
            </div>
          )}
        </div>
      )}

      {/* ───── 스텝 3: 처치/약제 ───── */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" /> 처치 및 약제 입력
            </h2>

            <div className="relative">
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="수가코드, 약품명, 처치명 검색..."
                  value={treatSearch}
                  onChange={(e) => setTreatSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
                />
              </div>

              {treatResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 card shadow-xl max-h-[300px] overflow-y-auto divide-y divide-border">
                  {treatResults.map((t) => (
                    <div
                      key={t.code}
                      onClick={() => addItem(t)}
                      className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer"
                    >
                      <span
                        className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${
                          t.item_type === 'drug'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        }`}
                      >
                        {t.item_type === 'drug' ? '약제' : '수가'}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{t.code}</span>
                      <span className="text-sm flex-1">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.unit_price.toLocaleString()}원</span>
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 항목 테이블 */}
          {items.length > 0 && (
            <div className="card overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
                <div className="col-span-1">구분</div>
                <div className="col-span-2">코드</div>
                <div className="col-span-3">항목명</div>
                <div className="col-span-2">단가</div>
                <div className="col-span-1">수량</div>
                <div className="col-span-2">금액</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id}>
                    {/* 데스크톱 */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/20 transition-colors">
                      <div className="col-span-1">
                        <span
                          className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${
                            item.item_type === 'drug'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          }`}
                        >
                          {item.item_type === 'drug' ? '약제' : '수가'}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs font-mono text-muted-foreground">{item.code}</div>
                      <div className="col-span-3 text-sm">{item.name}</div>
                      <div className="col-span-2 text-sm">{item.unit_price.toLocaleString()}원</div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center text-sm bg-secondary/50 rounded-lg py-1 outline-none focus:ring-1 ring-primary"
                        />
                      </div>
                      <div className="col-span-2 text-sm font-semibold">{item.total_price.toLocaleString()}원</div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 모바일 */}
                    <div className="md:hidden p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-2xs px-2 py-0.5 rounded-lg font-bold ${
                              item.item_type === 'drug'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            }`}
                          >
                            {item.item_type === 'drug' ? '약제' : '수가'}
                          </span>
                          <span className="text-sm font-semibold">{item.name}</span>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.code} · {item.unit_price.toLocaleString()}원</span>
                        <div className="flex items-center gap-2">
                          <span>x</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center text-xs bg-secondary/50 rounded-lg py-1 outline-none"
                          />
                          <span className="font-semibold text-foreground">{item.total_price.toLocaleString()}원</span>
                        </div>
                      </div>

                      {/* DUR Warning */}
                      {item.dur_warning && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-2xs text-amber-700 dark:text-amber-300">{item.dur_warning}</span>
                        </div>
                      )}
                    </div>

                    {/* DUR Warning (desktop) */}
                    {item.dur_warning && (
                      <div className="hidden md:flex items-start gap-2 px-4 pb-3 -mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-2xs text-amber-700 dark:text-amber-300">DUR: {item.dur_warning}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="card p-8 text-center">
              <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-sm text-muted-foreground">처치 또는 약제를 검색하여 추가하세요</div>
            </div>
          )}

          {/* 합계 */}
          {items.length > 0 && (
            <div className="card p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                총 {items.length}개 항목
              </div>
              <div className="text-lg font-bold">
                합계: <span className="text-primary">{totalAmount.toLocaleString()}</span>원
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── 스텝 4: AI 검토 ───── */}
      {currentStep === 4 && (
        <div className="space-y-4">
          {aiLoading && (
            <div className="card p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <div className="font-semibold">AI가 청구 내역을 분석하고 있습니다...</div>
              <div className="text-sm text-muted-foreground mt-1">심평원 기준으로 통과율을 예측합니다</div>
            </div>
          )}

          {aiReview && !aiLoading && (
            <>
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 통과율 */}
                <div className="card p-6 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 mb-3">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                      <circle
                        cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
                        className={scoreTrack(aiReview.pass_probability)}
                        strokeDasharray={`${aiReview.pass_probability * 3.14} ${314 - aiReview.pass_probability * 3.14}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-black ${scoreColor(aiReview.pass_probability)}`}>
                        {aiReview.pass_probability}%
                      </span>
                      <span className="text-2xs text-muted-foreground">예상 통과율</span>
                    </div>
                  </div>
                </div>

                {/* 금액 분석 */}
                <div className="card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> 금액 분석
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">총 청구금액</span>
                    <span className="font-bold">{totalAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-600">예상 인정금액</span>
                    <span className="font-bold text-emerald-600">{aiReview.optimized_amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-500">예상 삭감금액</span>
                    <span className="font-bold text-red-500">
                      -{(totalAmount - aiReview.optimized_amount).toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 리스크 요약 */}
                <div className="card p-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> 리스크 요약
                  </h3>
                  <div className="text-2xl font-bold text-center">
                    <span className={aiReview.issues.length === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                      {aiReview.issues.length}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">건 주의 항목</span>
                  </div>
                  <div className="space-y-1">
                    {aiReview.issues.length === 0 ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">모든 항목 적정</span>
                      </div>
                    ) : (
                      aiReview.issues.map((issue, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded-lg ${
                            issue.severity === 'high'
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : 'bg-amber-50 dark:bg-amber-900/10'
                          }`}
                        >
                          <AlertCircle
                            className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                            }`}
                          />
                          <div>
                            <span className="text-2xs font-mono text-muted-foreground">{issue.item_code}</span>
                            <div className="text-xs">{issue.message}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* AI 제안 */}
              {aiReview.suggestions.length > 0 && (
                <div className="card p-5 border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">AI 최적화 제안</span>
                  </div>
                  <div className="space-y-2">
                    {aiReview.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-card rounded-xl">
                        <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 환자 & 진단 요약 */}
              <div className="card p-5">
                <h3 className="text-sm font-bold mb-3">청구 요약</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">환자</span>
                    <div className="font-semibold">
                      {selectedPatient?.name} ({selectedPatient?.chart_no})
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">진단</span>
                    <div className="font-semibold">
                      {selectedDiagnoses.map((d) => `${d.code} ${d.name}`).join(', ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">항목 수</span>
                    <div className="font-semibold">{items.length}개</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">총 청구금액</span>
                    <div className="font-semibold text-primary">{totalAmount.toLocaleString()}원</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ───── 하단 네비게이션 ───── */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep((s) => s - 1)} className="btn-outline btn-sm">
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 합계 표시 */}
          {items.length > 0 && (
            <div className="hidden sm:block text-sm text-muted-foreground">
              합계: <span className="font-bold text-foreground">{totalAmount.toLocaleString()}원</span>
            </div>
          )}

          {currentStep < 4 ? (
            <button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canNext()} className="btn-primary btn-sm">
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || aiLoading} className="btn-primary btn-sm">
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? '제출 중...' : '청구 제출'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users2, TrendingUp, TrendingDown, DollarSign, Shield, Brain,
  BarChart3, UserCheck, Clock, Lightbulb, ChevronRight,
  AlertTriangle, CheckCircle2, Info, Plus, Trash2, Edit2, X, Save,
} from 'lucide-react'

type StaffType = 'DOCTOR' | 'NURSE' | 'ADMIN' | 'TECH'
type EmpType = '정규직' | '파트타임' | '계약직'

interface Staff {
  id: string
  name: string
  type: StaffType
  empType: EmpType
  base: number      // 기본급
  overtime: number  // 야근수당
  insurance: number // 4대보험 (사업자 부담)
}

const DEMO_STAFF: Staff[] = [
  { id: 'd1', name: '김원장',   type: 'DOCTOR', empType: '정규직',  base: 8_000_000, overtime: 0,       insurance: 1_420_000 },
  { id: 'd2', name: '이간호사', type: 'NURSE',  empType: '정규직',  base: 3_200_000, overtime: 380_000, insurance: 580_000 },
  { id: 'd3', name: '박간호사', type: 'NURSE',  empType: '정규직',  base: 3_000_000, overtime: 250_000, insurance: 540_000 },
  { id: 'd4', name: '정방사선', type: 'TECH',   empType: '정규직',  base: 3_100_000, overtime: 420_000, insurance: 560_000 },
  { id: 'd5', name: '최데스크', type: 'ADMIN',  empType: '정규직',  base: 2_800_000, overtime: 180_000, insurance: 500_000 },
  { id: 'd6', name: '한파트',   type: 'NURSE',  empType: '파트타임', base: 1_800_000, overtime: 0,       insurance: 320_000 },
]

const LS_KEY = 'staffCost.v1'
const LS_REVENUE_KEY = 'staffCost.monthlyRevenue.v1'

/* ─── 유틸 ─── */
const safeNum = (n: number | undefined | null): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : 0
const fmt = (n: number | undefined | null) =>
  safeNum(n).toLocaleString() + '원'
const fmtMan = (n: number | undefined | null) =>
  (safeNum(n) / 10000).toFixed(0) + '만'

/* ─── 탭 ─── */
type TabKey = 'breakdown' | 'insurance' | 'benchmark' | 'ai'
const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'breakdown', label: '직원별 분석', icon: Users2 },
  { key: 'insurance', label: '4대보험 최적화', icon: Shield },
  { key: 'benchmark', label: '벤치마크', icon: TrendingUp },
  { key: 'ai', label: 'AI 권고', icon: Brain },
]

const typeColors: Record<StaffType, string> = {
  DOCTOR: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  NURSE:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  ADMIN:  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  TECH:   'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}
const typeLabels: Record<StaffType, string> = { DOCTOR: '의사', NURSE: '간호사', ADMIN: '행정', TECH: '기사' }

export default function StaffCostPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0)
  const [isReal, setIsReal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('breakdown')
  const [editorOpen, setEditorOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // LocalStorage에서 실측 데이터 로드 (SSR hydration mismatch 방지)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Staff[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaff(parsed)
          setIsReal(true)
        } else {
          setStaff(DEMO_STAFF)
        }
      } else {
        setStaff(DEMO_STAFF)
      }
      const rev = localStorage.getItem(LS_REVENUE_KEY)
      if (rev) setMonthlyRevenue(Number(rev) || 0)
    } catch {
      setStaff(DEMO_STAFF)
    }
    setHydrated(true)
  }, [])

  // KPI 자동 계산
  const kpi = useMemo(() => {
    const totalCost = staff.reduce(
      (s, p) => s + safeNum(p.base) + safeNum(p.overtime) + safeNum(p.insurance), 0
    )
    const insuranceTotal = staff.reduce((s, p) => s + safeNum(p.insurance), 0)
    const fullTime = staff.filter(p => p.empType === '정규직').length
    const partTime = staff.filter(p => p.empType === '파트타임').length
    const contract = staff.filter(p => p.empType === '계약직').length
    const revenueRatio = monthlyRevenue > 0 ? (totalCost / monthlyRevenue) * 100 : 0
    return { totalCost, insuranceTotal, fullTime, partTime, contract, revenueRatio, count: staff.length }
  }, [staff, monthlyRevenue])

  // 직원별 합계·점유율 (null-safe)
  const employeesWithStats = useMemo(() => {
    return staff.map(p => {
      const total = safeNum(p.base) + safeNum(p.overtime) + safeNum(p.insurance)
      const share = kpi.totalCost > 0 ? (total / kpi.totalCost) * 100 : 0
      return { ...p, total, share }
    })
  }, [staff, kpi.totalCost])

  // 4대보험 분석 (실데이터 기준)
  const insuranceItems = useMemo(() => {
    const t = kpi.insuranceTotal
    if (t === 0) return []
    return [
      { name: '국민연금',  current: Math.round(t * 0.393), optimal: Math.round(t * 0.369), savings: Math.round(t * 0.024), note: '두루누리 지원 대상 확인' },
      { name: '건강보험',  current: Math.round(t * 0.301), optimal: Math.round(t * 0.291), savings: Math.round(t * 0.010), note: '보수월액 재산정' },
      { name: '고용보험',  current: Math.round(t * 0.165), optimal: Math.round(t * 0.150), savings: Math.round(t * 0.015), note: '지원금 활용 가능' },
      { name: '산재보험',  current: Math.round(t * 0.141), optimal: Math.round(t * 0.131), savings: Math.round(t * 0.010), note: '업종 재분류 검토' },
    ]
  }, [kpi.insuranceTotal])

  const saveAll = (next: Staff[], rev?: number) => {
    setStaff(next)
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      if (rev !== undefined) {
        localStorage.setItem(LS_REVENUE_KEY, String(rev))
      }
    } catch {}
    setIsReal(next.length > 0)
  }

  const resetToDemo = () => {
    if (!confirm('내 인건비 데이터를 모두 삭제하고 데모로 돌아갈까요?')) return
    try {
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem(LS_REVENUE_KEY)
    } catch {}
    setStaff(DEMO_STAFF)
    setMonthlyRevenue(0)
    setIsReal(false)
  }

  if (!hydrated) return null

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 헤더 + 데이터 모드 토글 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">인건비 최적화</h1>
            {isReal ? (
              <span className="text-2xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                내 데이터
              </span>
            ) : (
              <span className="text-2xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                데모 데이터
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            직원별 급여·4대보험을 분석하고 절감 기회를 찾아드립니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isReal && (
            <button onClick={resetToDemo} className="btn-secondary btn-sm">
              데모로 초기화
            </button>
          )}
          <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
            <Edit2 className="w-4 h-4" /> 내 데이터 입력
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground">총 인건비</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.totalCost)}</div>
          <div className="text-xs mt-1 text-muted-foreground">
            기본 + 야근 + 4대보험
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-muted-foreground">매출 대비</span>
          </div>
          {monthlyRevenue > 0 ? (
            <>
              <div className="text-2xl font-bold">{kpi.revenueRatio.toFixed(1)}%</div>
              <div className="text-xs mt-1 text-muted-foreground">권장: 25~30%</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground/50">—</div>
              <div className="text-xs mt-1 text-muted-foreground">월 매출 입력 시 표시</div>
            </>
          )}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-xs text-muted-foreground">4대보험 합계</span>
          </div>
          <div className="text-2xl font-bold">{fmtMan(kpi.insuranceTotal)}</div>
          <div className="text-xs mt-1 text-muted-foreground">사업자 부담분</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">직원 수</span>
          </div>
          <div className="text-2xl font-bold">{kpi.count}명</div>
          <div className="text-xs mt-1 text-muted-foreground">
            정규 {kpi.fullTime} / 파트 {kpi.partTime}
            {kpi.contract > 0 ? ` / 계약 ${kpi.contract}` : ''}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 직원별 분석 */}
      {activeTab === 'breakdown' && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
            <div className="col-span-2">직원명</div>
            <div className="col-span-1">유형</div>
            <div className="col-span-1">고용형태</div>
            <div className="col-span-2 text-right">기본급</div>
            <div className="col-span-2 text-right">야근수당</div>
            <div className="col-span-2 text-right">4대보험</div>
            <div className="col-span-1 text-right">합계</div>
            <div className="col-span-1">점유율</div>
          </div>
          {employeesWithStats.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-4">등록된 직원이 없습니다</p>
              <button onClick={() => setEditorOpen(true)} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> 첫 직원 추가
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {employeesWithStats.map((emp) => (
                <div key={emp.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{emp.name}</span>
                      <span className="font-bold text-sm">{fmtMan(emp.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${typeColors[emp.type]}`}>{typeLabels[emp.type]}</span>
                      <span>{emp.empType}</span>
                    </div>
                  </div>
                  <div className="hidden md:block col-span-2 font-semibold text-sm">{emp.name}</div>
                  <div className="hidden md:block col-span-1">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${typeColors[emp.type]}`}>{typeLabels[emp.type]}</span>
                  </div>
                  <div className="hidden md:block col-span-1 text-xs text-muted-foreground">{emp.empType}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{fmt(emp.base)}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{emp.overtime > 0 ? fmt(emp.overtime) : '-'}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{fmt(emp.insurance)}</div>
                  <div className="hidden md:block col-span-1 text-right font-bold text-sm">{fmtMan(emp.total)}</div>
                  <div className="hidden md:flex col-span-1 items-center gap-1">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${emp.share}%` }} />
                    </div>
                    <span className="text-2xs text-muted-foreground w-10">{emp.share.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4대보험 */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          {insuranceItems.length === 0 ? (
            <div className="card p-12 text-center text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>직원과 4대보험 데이터 입력 시 분석이 표시됩니다</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insuranceItems.map((item) => (
                  <div key={item.name} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">{item.name}</h4>
                      {item.savings > 0 && (
                        <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          -{fmtMan(item.savings)} 절감 가능
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">현재</span>
                        <span className="font-semibold">{fmt(item.current)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">최적</span>
                        <span className="font-semibold text-emerald-600">{fmt(item.optimal)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${item.current > 0 ? (item.optimal / item.current) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{item.note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">총 절감 가능액</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  월 {fmt(insuranceItems.reduce((s, i) => s + i.savings, 0))}
                  <span className="text-base font-normal text-muted-foreground ml-2">
                    (연 {fmt(insuranceItems.reduce((s, i) => s + i.savings, 0) * 12)})
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 벤치마크 */}
      {activeTab === 'benchmark' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              지역·진료과별 평균 벤치마크는 추가 데이터 연동 후 제공됩니다
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-xs text-muted-foreground mb-1">총 인건비 (내 의원)</div>
              <div className="text-xl font-bold">{fmtMan(kpi.totalCost)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-muted-foreground mb-1">매출 대비</div>
              <div className="text-xl font-bold">
                {monthlyRevenue > 0 ? `${kpi.revenueRatio.toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-muted-foreground mb-1">평균 1인당</div>
              <div className="text-xl font-bold">
                {kpi.count > 0 ? fmtMan(kpi.totalCost / kpi.count) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 권고 */}
      {activeTab === 'ai' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-bold">AI 권고</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isReal
              ? '입력하신 인건비 데이터를 기반으로 AI 분석을 준비 중입니다. 매출·근태 데이터를 추가 연동하면 더 정확한 권고를 받아보실 수 있습니다.'
              : '실제 직원 데이터를 입력하시면 AI가 야근수당·파트타임 전환·4대보험 지원사업 등 절감 기회를 분석해드립니다.'}
          </p>
        </div>
      )}

      {/* 모드 안내 배너 */}
      {!isReal && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              데모 데이터로 표시 중입니다. <b>"내 데이터 입력"</b>을 누르시면 실제 인건비 분석으로 전환됩니다.
            </span>
          </div>
        </div>
      )}

      {/* 직원 편집 모달 */}
      {editorOpen && (
        <StaffEditor
          initial={isReal ? staff : []}
          initialRevenue={monthlyRevenue}
          onClose={() => setEditorOpen(false)}
          onSave={(next, rev) => {
            saveAll(next, rev)
            setEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   직원 편집 모달
   ════════════════════════════════════════════════════════════ */
interface EditorProps {
  initial: Staff[]
  initialRevenue: number
  onClose: () => void
  onSave: (next: Staff[], revenue: number) => void
}

function StaffEditor({ initial, initialRevenue, onClose, onSave }: EditorProps) {
  const [rows, setRows] = useState<Staff[]>(initial)
  const [revenue, setRevenue] = useState<number>(initialRevenue)

  const addRow = () => {
    setRows([...rows, {
      id: `n${Date.now()}`,
      name: '',
      type: 'NURSE',
      empType: '정규직',
      base: 0, overtime: 0, insurance: 0,
    }])
  }

  const updateRow = (idx: number, patch: Partial<Staff>) => {
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    // 빈 이름 제거
    const cleaned = rows.filter(r => r.name.trim().length > 0)
    onSave(cleaned, revenue)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">내 인건비 데이터 입력</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              브라우저에 저장됩니다 (다른 기기에서는 다시 입력 필요)
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 월 매출 입력 */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">월 평균 매출 (선택)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={revenue || ''}
                onChange={(e) => setRevenue(Number(e.target.value) || 0)}
                placeholder="예: 96000000"
                className="input flex-1"
              />
              <span className="text-sm text-muted-foreground">원/월</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              입력하시면 매출 대비 인건비 비율(권장 25~30%)을 계산해드립니다
            </p>
          </div>

          {/* 직원 리스트 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">직원 ({rows.length}명)</label>
              <button onClick={addRow} className="btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> 직원 추가
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                직원이 없습니다. 위 "직원 추가"를 눌러 등록하세요.
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((r, idx) => (
                  <div key={r.id} className="grid grid-cols-12 gap-2 items-center p-3 border border-border rounded-xl">
                    <input
                      className="input col-span-3 text-sm"
                      placeholder="이름"
                      value={r.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                    />
                    <select
                      className="input col-span-2 text-sm"
                      value={r.type}
                      onChange={(e) => updateRow(idx, { type: e.target.value as StaffType })}
                    >
                      <option value="DOCTOR">의사</option>
                      <option value="NURSE">간호사</option>
                      <option value="ADMIN">행정</option>
                      <option value="TECH">기사</option>
                    </select>
                    <select
                      className="input col-span-2 text-sm"
                      value={r.empType}
                      onChange={(e) => updateRow(idx, { empType: e.target.value as EmpType })}
                    >
                      <option value="정규직">정규직</option>
                      <option value="파트타임">파트타임</option>
                      <option value="계약직">계약직</option>
                    </select>
                    <input
                      className="input col-span-2 text-sm text-right"
                      type="number"
                      inputMode="numeric"
                      placeholder="기본급"
                      value={r.base || ''}
                      onChange={(e) => updateRow(idx, { base: Number(e.target.value) || 0 })}
                    />
                    <input
                      className="input col-span-1 text-sm text-right"
                      type="number"
                      inputMode="numeric"
                      placeholder="야근"
                      value={r.overtime || ''}
                      onChange={(e) => updateRow(idx, { overtime: Number(e.target.value) || 0 })}
                    />
                    <input
                      className="input col-span-1 text-sm text-right"
                      type="number"
                      inputMode="numeric"
                      placeholder="4대보험"
                      value={r.insurance || ''}
                      onChange={(e) => updateRow(idx, { insurance: Number(e.target.value) || 0 })}
                    />
                    <button
                      onClick={() => removeRow(idx)}
                      className="col-span-1 btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 mx-auto"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 px-3 text-2xs text-muted-foreground">
                  <span className="col-span-3">이름</span>
                  <span className="col-span-2">유형</span>
                  <span className="col-span-2">고용형태</span>
                  <span className="col-span-2 text-right">기본급(월)</span>
                  <span className="col-span-1 text-right">야근수당</span>
                  <span className="col-span-1 text-right">4대보험</span>
                  <span className="col-span-1" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 풋터 */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            * 모든 금액은 월 기준 / 원 단위
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary btn-sm">취소</button>
            <button onClick={handleSave} className="btn-primary btn-sm">
              <Save className="w-3.5 h-3.5" /> 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

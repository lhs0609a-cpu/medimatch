'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Calendar, MapPin, Wallet,
  Loader2, Rocket, Sparkles,
  Stethoscope, Eye, Ear, Baby, Brain, Home, Scissors, Leaf, Zap,
  Activity, HeartPulse, SmilePlus, Bone, Accessibility,
} from 'lucide-react'
import { openingProjectService } from '@/lib/api/services'
import { specialtyTemplates, getTemplateByName } from '@/app/checklist/data/specialty-templates'

// Lucide icon map
const iconMap: Record<string, React.ElementType> = {
  Stethoscope, Sparkles, Eye, Ear, Baby, Brain, Home, Scissors, Leaf, Zap,
  Activity, HeartPulse, SmilePlus, Bone, Accessibility,
}

interface WizardData {
  specialty: string
  templateId: string
  targetMonths: number | null
  targetDate: string
  budgetTotal: number | null
  budgetRange: [number, number]
  locationAddress: string
  regionCode: string
}

const DEFAULT_DATA: WizardData = {
  specialty: '',
  templateId: '',
  targetMonths: null,
  targetDate: '',
  budgetTotal: null,
  budgetRange: [0, 0],
  locationAddress: '',
  regionCode: '',
}

const MONTH_PRESETS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '9개월', value: 9 },
  { label: '12개월', value: 12 },
]

function getTargetDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function generatePhaseDeadlines(targetDate: string): Record<number, string> {
  const target = new Date(targetDate)
  const now = new Date()
  const totalDays = Math.max(1, Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // Phase proportions (approximate)
  const proportions = [0.08, 0.15, 0.10, 0.20, 0.15, 0.12, 0.12, 0.08]
  const deadlines: Record<number, string> = {}
  let cumulativeDays = 0

  proportions.forEach((p, i) => {
    cumulativeDays += Math.round(totalDays * p)
    const d = new Date(now)
    d.setDate(d.getDate() + cumulativeDays)
    deadlines[i + 1] = d.toISOString().split('T')[0]
  })

  return deadlines
}

function formatBudget(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}억원`
  return `${v.toLocaleString()}만원`
}

export default function OpeningWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(DEFAULT_DATA)
  const [creating, setCreating] = useState(false)
  const totalSteps = 5

  const update = useCallback((partial: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }, [])

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!data.specialty
      case 2: return !!data.targetDate
      case 3: return data.budgetTotal !== null && data.budgetTotal > 0
      case 4: return !!data.locationAddress
      case 5: return true
      default: return false
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const phaseDeadlines = generatePhaseDeadlines(data.targetDate)
      const proj = await openingProjectService.create({
        title: `${data.specialty} 개원 프로젝트`,
        specialty: data.specialty,
        target_date: data.targetDate,
        budget_total: data.budgetTotal,
        location_address: data.locationAddress,
      } as any)

      // Apply template
      try {
        await openingProjectService.applyTemplate(proj.id, {
          template_id: data.templateId,
          specialty: data.specialty,
          budget_total: data.budgetTotal ?? undefined,
          phase_deadlines: phaseDeadlines,
          region_code: data.regionCode || undefined,
        })
      } catch {
        // Template apply is optional, project already created
      }

      router.push('/emr/opening')
    } catch (err: any) {
      if (err?.response?.status === 400) {
        // Project already exists
        router.push('/emr/opening')
      } else {
        alert('프로젝트 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">개원 프로젝트 시작하기</h1>
          <p className="text-sm text-muted-foreground">5단계로 맞춤형 개원 계획을 세워드립니다</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <button
            key={s}
            onClick={() => s < step && setStep(s)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${s === step ? 'bg-primary scale-125' : s < step ? 'bg-primary/50 cursor-pointer' : 'bg-border'}
            `}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card rounded-2xl border border-border p-6">

        {/* Step 1: 진료과 선택 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">어떤 진료과를 개원하시나요?</h2>
              <p className="text-sm text-muted-foreground mt-1">진료과에 맞는 장비, 예산, 인력 템플릿을 자동으로 설정합니다</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {specialtyTemplates.map(t => {
                const Icon = iconMap[t.icon] || Stethoscope
                const selected = data.specialty === t.name
                return (
                  <button
                    key={t.id}
                    onClick={() => update({
                      specialty: t.name,
                      templateId: t.id,
                      budgetTotal: t.averageBudget,
                      budgetRange: t.budgetRange,
                    })}
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                      ${selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selected ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-medium ${selected ? 'text-primary' : ''}`}>{t.name}</span>
                  </button>
                )
              })}
            </div>
            {data.specialty && (
              <div className="bg-secondary/30 rounded-xl p-3 text-sm">
                <span className="font-medium">{data.specialty}</span> 평균 개원 비용: <span className="font-semibold text-primary">{formatBudget(data.budgetRange[0])} ~ {formatBudget(data.budgetRange[1])}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 개원 목표일 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">언제 개원을 목표로 하시나요?</h2>
              <p className="text-sm text-muted-foreground mt-1">목표일에 맞춰 단계별 데드라인을 자동 계산합니다</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MONTH_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => {
                    const td = getTargetDate(p.value)
                    update({ targetMonths: p.value, targetDate: td })
                  }}
                  className={`
                    flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all
                    ${data.targetMonths === p.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                    }
                  `}
                >
                  <Calendar className={`w-5 h-5 ${data.targetMonths === p.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${data.targetMonths === p.value ? 'text-primary' : ''}`}>{p.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">또는 직접 날짜 입력</label>
              <input
                type="date"
                value={data.targetDate}
                onChange={(e) => update({ targetDate: e.target.value, targetMonths: null })}
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {data.targetDate && (
              <div className="bg-secondary/30 rounded-xl p-3 text-sm">
                목표 개원일: <span className="font-semibold text-primary">{new Date(data.targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: 예산 설정 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">총 예산은 얼마인가요?</h2>
              <p className="text-sm text-muted-foreground mt-1">{data.specialty} 평균 예산을 기준으로 설정되어 있습니다</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">총 투자 예산</label>
                <span className="text-lg font-bold text-primary">{data.budgetTotal ? formatBudget(data.budgetTotal) : '-'}</span>
              </div>
              <input
                type="range"
                min={data.budgetRange[0] * 0.5}
                max={data.budgetRange[1] * 1.5}
                step={1000}
                value={data.budgetTotal || data.budgetRange[0]}
                onChange={(e) => update({ budgetTotal: parseInt(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatBudget(Math.round(data.budgetRange[0] * 0.5))}</span>
                <span className="text-primary font-medium">평균 {formatBudget(Math.round((data.budgetRange[0] + data.budgetRange[1]) / 2))}</span>
                <span>{formatBudget(Math.round(data.budgetRange[1] * 1.5))}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">또는 직접 입력 (만원)</label>
              <input
                type="number"
                value={data.budgetTotal || ''}
                onChange={(e) => update({ budgetTotal: parseInt(e.target.value) || null })}
                placeholder="예: 30000 (= 3억)"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {data.budgetTotal && (
              <div className="bg-secondary/30 rounded-xl p-3">
                <div className="text-sm font-medium mb-2">예상 Phase별 예산 배분</div>
                <div className="space-y-1.5">
                  {(() => {
                    const tmpl = getTemplateByName(data.specialty)
                    if (!tmpl) return null
                    const phaseNames = ['사업계획', '입지선정', '인허가', '인테리어', '장비', '채용', '마케팅', '개원']
                    return Object.entries(tmpl.budgetByPhase).map(([k, pct]) => {
                      const amount = Math.round((data.budgetTotal! * pct) / 100)
                      return (
                        <div key={k} className="flex items-center gap-2 text-xs">
                          <span className="w-16 text-muted-foreground">{phaseNames[parseInt(k) - 1]}</span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-20 text-right font-medium">{formatBudget(amount)} ({pct}%)</span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 지역 선택 */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">어디서 개원하시나요?</h2>
              <p className="text-sm text-muted-foreground mt-1">지역 경쟁 현황과 비용 벤치마크를 제공합니다</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">개원 예정 지역 (시/구/동)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={data.locationAddress}
                  onChange={(e) => update({ locationAddress: e.target.value })}
                  placeholder="예: 서울시 강남구 역삼동"
                  className="w-full text-sm bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {data.locationAddress && (
              <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                <div className="text-sm font-medium">지역 참고 정보</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">-</div>
                    <div className="text-xs text-muted-foreground">주변 {data.specialty}</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">-</div>
                    <div className="text-xs text-muted-foreground">예상 유동인구</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">* 프로젝트 생성 후 상세한 경쟁 분석을 확인할 수 있습니다</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: 요약 & 생성 */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">프로젝트 요약</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">진료과</span>
                  <span className="font-medium">{data.specialty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">목표 개원일</span>
                  <span className="font-medium">{data.targetDate ? new Date(data.targetDate).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">총 예산</span>
                  <span className="font-medium text-primary">{data.budgetTotal ? formatBudget(data.budgetTotal) : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">지역</span>
                  <span className="font-medium">{data.locationAddress}</span>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="text-sm font-medium text-primary mb-2">자동으로 설정되는 항목</div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    8단계 개원 체크리스트 (44개 태스크)
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {data.specialty} 맞춤 장비 목록 및 예산 배분
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    단계별 데드라인 자동 계산
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    진행 속도 기반 AI 타임라인 예측
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    예산 벤치마크 비교 (진료과 × 지역)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/emr/opening')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 1 ? '이전' : '취소'}
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary flex items-center gap-1.5"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                프로젝트 시작
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

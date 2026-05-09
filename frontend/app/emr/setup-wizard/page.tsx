'use client'

/**
 * 5분 셋업 마법사 — 진료 첫날부터 EMR이 작동하도록.
 *
 * 단계:
 *   1. 의원명 + 운영시간
 *   2. 진료과 선택 (1주 진료 표준)
 *   3. 미리보기 (진단·수가·약물 프리셋)
 *   4. 의사명 입력 (1~3명)
 *   5. 완료 → 차트로
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Clock, Stethoscope, Sparkles, Check, ArrowRight, ArrowLeft,
  PartyPopper, Loader2, X, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  clinicSetupService, SpecialtyMeta, SpecialtyTemplate,
} from '@/lib/api/clinicSetup'

const STEPS = ['의원 기본', '진료과', '템플릿 미리보기', '의사 명단', '완료'] as const

export default function SetupWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)

  // 폼
  const [clinicName, setClinicName] = useState('')
  const [hoursOpen, setHoursOpen] = useState('09:00')
  const [hoursClose, setHoursClose] = useState('18:00')
  const [lunchOpen, setLunchOpen] = useState('13:00')
  const [lunchClose, setLunchClose] = useState('14:00')
  const [weekday, setWeekday] = useState<'mon-fri' | 'mon-sat'>('mon-fri')
  const [specialty, setSpecialty] = useState<string>('')
  const [doctors, setDoctors] = useState<string[]>([''])

  // 템플릿
  const [specialties, setSpecialties] = useState<SpecialtyMeta[]>([])
  const [previewTpl, setPreviewTpl] = useState<SpecialtyTemplate | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cur, tpls] = await Promise.all([
          clinicSetupService.get(),
          clinicSetupService.templates(),
        ])
        if (cancelled) return
        // 기존 저장값 복원
        setClinicName(cur.clinic_name || '')
        setHoursOpen(cur.hours_open || '09:00')
        setHoursClose(cur.hours_close || '18:00')
        setLunchOpen(cur.lunch_open || '13:00')
        setLunchClose(cur.lunch_close || '14:00')
        setWeekday((cur.weekday_pattern as any) || 'mon-fri')
        setSpecialty(cur.primary_specialty || '')
        setDoctors(cur.doctor_names && cur.doctor_names.length > 0 ? cur.doctor_names : [''])
        setSpecialties(tpls.specialties)
        if (cur.completed_at) {
          // 이미 완료된 경우 마지막 단계로
          setStep(STEPS.length - 1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // 진료과 변경 시 미리보기 fetch
  useEffect(() => {
    if (!specialty || step < 2) return
    let cancelled = false
    setPreviewLoading(true)
    clinicSetupService.template(specialty).then((t) => {
      if (!cancelled) setPreviewTpl(t)
    }).finally(() => {
      if (!cancelled) setPreviewLoading(false)
    })
    return () => { cancelled = true }
  }, [specialty, step])

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep((s) => Math.max(s - 1, 0))

  const onSaveStep = async (addStep: string, partial: Record<string, any>) => {
    try {
      await clinicSetupService.update({ ...partial, add_completed_step: addStep })
    } catch (e: any) {
      // 실패해도 다음으로 진행 (사용자 흐름 끊지 않음)
      console.warn(e)
    }
  }

  const onChooseSpecialty = async (code: string) => {
    setSpecialty(code)
    try {
      await clinicSetupService.applyTemplate(code)
    } catch {}
    next()
  }

  const onComplete = async () => {
    setSubmitting(true)
    try {
      await clinicSetupService.update({
        clinic_name: clinicName,
        hours_open: hoursOpen,
        hours_close: hoursClose,
        lunch_open: lunchOpen,
        lunch_close: lunchClose,
        weekday_pattern: weekday,
        doctor_names: doctors.filter((d) => d.trim()),
        add_completed_step: 'doctors',
      })
      await clinicSetupService.complete()
      toast.success('셋업 완료! 진료를 시작하세요.')
      router.push('/emr/dashboard')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '저장 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const onSkip = async () => {
    if (!confirm('나중에 사이드바 "설정"에서 다시 진행할 수 있어요. 지금 건너뛸까요?')) return
    try { await clinicSetupService.skip() } catch {}
    router.push('/emr/dashboard')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-xs text-blue-700 font-semibold tracking-wider mb-2">5분 셋업 마법사</div>
          <h1 className="text-2xl font-bold">개원 첫날 = 진료 첫날</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {STEPS.length}단계만 채우면 EMR이 진료과에 맞춰 즉시 가동돼요.
          </p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div
                className={`shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  i < step ? 'bg-emerald-500 text-white'
                    : i === step ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 본문 */}
        <div className="card p-6 space-y-5">
          {step === 0 && (
            <>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">의원 정보 + 운영시간</h2>
              </div>
              <div>
                <label className="text-xs text-slate-600">의원명</label>
                <input
                  className="input mt-1"
                  placeholder="예: 메디매치 내과"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600">진료 시작</label>
                  <input type="time" className="input mt-1" value={hoursOpen} onChange={(e) => setHoursOpen(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">진료 종료</label>
                  <input type="time" className="input mt-1" value={hoursClose} onChange={(e) => setHoursClose(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">점심 시작</label>
                  <input type="time" className="input mt-1" value={lunchOpen} onChange={(e) => setLunchOpen(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-600">점심 종료</label>
                  <input type="time" className="input mt-1" value={lunchClose} onChange={(e) => setLunchClose(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600">진료 요일</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setWeekday('mon-fri')}
                    className={`py-2 rounded-lg border text-sm font-medium ${
                      weekday === 'mon-fri'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >월 ~ 금</button>
                  <button
                    type="button"
                    onClick={() => setWeekday('mon-sat')}
                    className={`py-2 rounded-lg border text-sm font-medium ${
                      weekday === 'mon-sat'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >월 ~ 토</button>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">진료과 선택</h2>
              </div>
              <p className="text-sm text-slate-500">선택하면 진료과에 맞는 진단·수가·약물이 자동 적용됩니다.</p>
              <div className="grid grid-cols-2 gap-3">
                {specialties.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => onChooseSpecialty(s.code)}
                    className={`text-left p-4 rounded-xl border-2 transition-all hover:border-blue-400 ${
                      specialty === s.code
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="font-semibold">{s.label}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{s.summary}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h2 className="font-semibold">{previewTpl?.label} 프리셋 미리보기</h2>
              </div>
              {previewLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : previewTpl ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-violet-50/40 border border-violet-100 p-3">
                    <div className="text-xs font-semibold text-violet-800 mb-1">
                      진단 ({previewTpl.diagnoses.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {previewTpl.diagnoses.map((d) => (
                        <span key={d.code} className="text-[11px] px-2 py-0.5 rounded bg-white border border-violet-200">
                          <code className="text-violet-600">{d.code}</code> {d.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50/40 border border-blue-100 p-3">
                    <div className="text-xs font-semibold text-blue-800 mb-1">
                      수가/시술 ({previewTpl.procedures.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {previewTpl.procedures.map((p) => (
                        <span key={p.code} className="text-[11px] px-2 py-0.5 rounded bg-white border border-blue-200">
                          {p.name} <span className="text-blue-600">({p.unit_price.toLocaleString()}원)</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-3">
                    <div className="text-xs font-semibold text-emerald-800 mb-1">
                      약물 ({previewTpl.drugs.length})
                    </div>
                    <ul className="space-y-1 text-xs">
                      {previewTpl.drugs.map((d, i) => (
                        <li key={i} className="text-emerald-900">
                          • <b>{d.drug_name}</b>
                          <span className="text-emerald-700"> · 1일 {d.frequency_per_day}회 × {d.duration_days}일</span>
                          <span className="text-emerald-600"> · {d.usage_note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">의사 명단</h2>
              </div>
              <p className="text-sm text-slate-500">차트·처방·청구에 표시됩니다. 1~3명 입력하세요.</p>
              {doctors.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder={`예: 김원장${i > 0 ? '' : ''}`}
                    value={name}
                    onChange={(e) => {
                      const arr = [...doctors]
                      arr[i] = e.target.value
                      setDoctors(arr)
                    }}
                  />
                  {doctors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDoctors(doctors.filter((_, idx) => idx !== i))}
                      className="text-rose-500 p-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {doctors.length < 5 && (
                <button
                  type="button"
                  onClick={() => setDoctors([...doctors, ''])}
                  className="text-xs text-blue-700 inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 의사 추가
                </button>
              )}
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <PartyPopper className="w-14 h-14 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold mt-4">셋업 완료!</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                <b>{clinicName || '의원'}</b>의 EMR이 <b>{previewTpl?.label || specialty || '일반'}</b> 진료에 맞춰 준비됐어요.<br />
                지금 바로 차트를 작성하실 수 있습니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 text-xs">
                <Stat label="진단 코드" value={`${previewTpl?.diagnoses.length || 0}개`} />
                <Stat label="수가/시술" value={`${previewTpl?.procedures.length || 0}개`} />
                <Stat label="약물 프리셋" value={`${previewTpl?.drugs.length || 0}개`} />
              </div>
            </div>
          )}
        </div>

        {/* 하단 네비 */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && step < STEPS.length - 1 && (
              <button onClick={prev} className="btn-ghost text-sm">
                <ArrowLeft className="w-4 h-4" /> 이전
              </button>
            )}
            {step === 0 && (
              <button onClick={onSkip} className="btn-ghost text-xs text-slate-500">
                나중에 하기
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 && (
              <button
                onClick={async () => {
                  await onSaveStep('basic', {
                    clinic_name: clinicName, hours_open: hoursOpen, hours_close: hoursClose,
                    lunch_open: lunchOpen, lunch_close: lunchClose, weekday_pattern: weekday,
                  })
                  next()
                }}
                disabled={!clinicName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                다음 <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button onClick={next} className="btn-primary">
                좋아요, 적용 <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={onComplete}
                disabled={submitting || !doctors.some((d) => d.trim())}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                셋업 완료
              </button>
            )}
            {step === 4 && (
              <button
                onClick={() => router.push('/emr/dashboard')}
                className="btn-primary"
              >
                대시보드로 <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  )
}

'use client'

/**
 * 환자용 사전문진 페이지 (Public, magic-link 토큰)
 *
 * - 인증 없음, 토큰만 검증
 * - 모바일 우선 — 한 화면 한 컬럼, 큰 입력창
 * - 제출 후 "감사합니다" 화면
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, ShieldCheck, Loader2, AlertOctagon } from 'lucide-react'
import {
  publicQuestionnaireService,
  QuestionnaireTemplate,
} from '@/lib/api/questionnaire'

export default function QuestionnairePage() {
  const params = useParams()
  const token = params?.token as string

  const [tpl, setTpl] = useState<QuestionnaireTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const t = await publicQuestionnaireService.get(token)
        if (cancelled) return
        setTpl(t)
        if (t.status === 'SUBMITTED' || t.status === 'CONSUMED') {
          setSubmitted(true)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e.response?.data?.detail || '문진 정보를 불러올 수 없습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const onChange = (key: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async () => {
    if (!tpl) return
    // 필수 검증
    const missing = tpl.questions
      .filter((q) => q.required)
      .filter((q) => !String(answers[q.key] ?? '').trim())
      .map((q) => q.label)
    if (missing.length > 0) {
      setError(`다음 항목은 필수입니다: ${missing.join(', ')}`)
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await publicQuestionnaireService.submit(token, answers)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.response?.data?.detail || '제출 실패. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
      </main>
    )
  }

  if (error && !tpl) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-xl font-semibold mt-4">{error}</h1>
          <p className="text-sm text-slate-500 mt-2">병원에 문의해 새 링크를 받아주세요.</p>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-semibold mt-4">제출 완료, 감사합니다.</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            답변해주신 내용은 진료 시 선생님께 자동으로 전달됩니다.<br />
            진료 시간을 더 충분히 사용하실 수 있어요.
          </p>
          {tpl?.clinic_name && (
            <p className="text-xs text-slate-400 mt-6">— {tpl.clinic_name}</p>
          )}
        </div>
      </main>
    )
  }

  if (!tpl) return null

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-5 py-6">
          {tpl.clinic_name && (
            <div className="text-xs text-slate-500 mb-1">{tpl.clinic_name}</div>
          )}
          <h1 className="text-2xl font-bold leading-tight">{tpl.title}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{tpl.subtitle}</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            진료 목적 외에는 사용되지 않으며, 안전하게 보관됩니다.
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">
        {tpl.questions.map((q) => (
          <div key={q.key} className="bg-white rounded-xl p-4 shadow-sm">
            <label className="block text-[15px] font-medium leading-snug mb-3">
              {q.label}
              {q.required && <span className="text-rose-500 ml-1">*</span>}
            </label>

            {q.type === 'text' && (
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={q.placeholder}
                value={answers[q.key] ?? ''}
                onChange={(e) => onChange(q.key, e.target.value)}
              />
            )}

            {q.type === 'textarea' && (
              <textarea
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                placeholder={q.placeholder}
                value={answers[q.key] ?? ''}
                onChange={(e) => onChange(q.key, e.target.value)}
              />
            )}

            {q.type === 'choice' && q.options && (
              <div className="grid grid-cols-3 gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(q.key, opt)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      answers[q.key] === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'scale' && (
              <ScaleInput
                value={answers[q.key]}
                onChange={(v) => onChange(q.key, v)}
                min={q.min ?? 0}
                max={q.max ?? 10}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-xl mx-auto">
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </main>
  )
}

function ScaleInput({
  value, onChange, min, max,
}: { value: any; onChange: (v: number) => void; min: number; max: number }) {
  const v = typeof value === 'number' ? value : null
  return (
    <div>
      <div className="grid grid-cols-11 gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`aspect-square rounded-lg border text-sm font-medium transition-colors ${
              v === n
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 px-0.5">
        <span>없음</span>
        <span>참을 수 없음</span>
      </div>
    </div>
  )
}

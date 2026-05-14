'use client'

/**
 * 사전문진 prefill 배너
 *
 * 환자가 선택되면 가장 최근 SUBMITTED 문진 응답을 조회해
 * "사전문진 답변 있음 — 1클릭으로 차트에 채우기" 배너 노출.
 * 클릭 시 부모 onApply 콜백으로 chief_complaint/subjective 전달 + consume API.
 */
import { useEffect, useState } from 'react'
import { Sparkles, MessageSquareText, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  questionnaireService,
  QuestionnairePrefill,
} from '@/lib/api/questionnaire'

interface Props {
  patientId?: string
  patientPhone?: string
  onApply: (data: { chief_complaint: string; subjective: string }) => void
  className?: string
}

export default function QuestionnairePrefillBanner({
  patientId, patientPhone, onApply, className = '',
}: Props) {
  const [data, setData] = useState<QuestionnairePrefill | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    setData(null)
    setDismissed(false)
    if (!patientId && !patientPhone) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await questionnaireService.prefill({
          patient_id: patientId,
          patient_phone: patientPhone,
        })
        if (!cancelled && r.found) setData(r)
      } catch {
        // 조용히 무시 — 없으면 안 보여주는 게 정상
      }
    })()
    return () => { cancelled = true }
  }, [patientId, patientPhone])

  const apply = async () => {
    if (!data || !data.questionnaire_id) return
    try {
      setApplying(true)
      onApply({
        chief_complaint: data.chief_complaint || '',
        subjective: data.subjective || '',
      })
      await questionnaireService.consume(data.questionnaire_id)
      toast.success('사전문진 답변을 차트에 반영했어요.')
      setDismissed(true)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '반영 실패')
    } finally {
      setApplying(false)
    }
  }

  if (!data || dismissed) return null

  const submittedAt = data.submitted_at
    ? new Date(data.submitted_at).toLocaleString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <div className={`rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 rounded-lg p-2 shrink-0">
          <MessageSquareText className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-amber-900 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            사전문진 답변이 도착해 있어요
            {submittedAt && <span className="text-xs font-normal text-amber-700">· {submittedAt}</span>}
          </div>
          {data.chief_complaint && (
            <p className="text-sm text-amber-900 mt-1.5">
              <span className="text-amber-700">주증상: </span>
              <span className="font-medium">{data.chief_complaint}</span>
            </p>
          )}
          {data.subjective && (
            <pre className="text-xs text-amber-800 mt-1.5 whitespace-pre-wrap leading-relaxed font-sans line-clamp-4">
              {data.subjective}
            </pre>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={apply}
              disabled={applying}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60 inline-flex items-center gap-1"
            >
              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              차트에 채우기
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="px-2 py-1 text-xs text-amber-700 hover:text-amber-900"
            >
              나중에
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-700 shrink-0"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

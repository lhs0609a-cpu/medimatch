'use client'

/**
 * 사전문진 발송 버튼
 *
 * - 예약(appointmentId) 또는 환자(patientId) 둘 중 하나를 받아 즉시 알림톡 발송
 * - 환자 폰 정보가 백엔드에서 자동 보강됨
 */
import { useState } from 'react'
import { MessageSquareText, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { questionnaireService } from '@/lib/api/questionnaire'

interface Props {
  appointmentId?: string
  patientId?: string
  patientPhone?: string
  patientName?: string
  templateCode?: string
  /** 좁은 공간 (예: 예약 행) — 아이콘+짧은 텍스트 */
  compact?: boolean
  className?: string
}

export default function QuestionnaireSendButton({
  appointmentId, patientId, patientPhone, patientName,
  templateCode = 'GENERAL_V1',
  compact = false,
  className = '',
}: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const send = async () => {
    if (!appointmentId && !patientId && !patientPhone) {
      toast.error('환자 또는 예약 정보가 필요합니다.')
      return
    }
    try {
      setSending(true)
      await questionnaireService.send({
        appointment_id: appointmentId,
        patient_id: patientId,
        patient_phone: patientPhone,
        patient_name: patientName,
        template_code: templateCode,
      })
      setSent(true)
      toast.success('사전문진을 카톡으로 발송했어요.')
      setTimeout(() => setSent(false), 4000)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '발송 실패')
    } finally {
      setSending(false)
    }
  }

  const Icon = sent ? Check : sending ? Loader2 : MessageSquareText

  return (
    <button
      type="button"
      onClick={send}
      disabled={sending}
      className={`inline-flex items-center gap-1.5 ${
        compact
          ? 'px-2 py-1 text-xs rounded-md'
          : 'px-3 py-2 text-sm rounded-lg'
      } font-medium transition-colors ${
        sent
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      } disabled:opacity-60 ${className}`}
      title="환자에게 사전문진 카톡 발송"
    >
      <Icon className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
      {sent ? '발송 완료' : compact ? '문진 발송' : '사전문진 카톡 발송'}
    </button>
  )
}

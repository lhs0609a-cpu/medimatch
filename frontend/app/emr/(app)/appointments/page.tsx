'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, X, Clock, Phone, User, Check, Loader2, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { appointmentService, Appointment } from '@/lib/api/emr'
import PatientPicker from '@/components/emr/PatientPicker'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    SCHEDULED: { color: 'bg-blue-100 text-blue-700', label: '예약' },
    CONFIRMED: { color: 'bg-indigo-100 text-indigo-700', label: '확정' },
    ARRIVED: { color: 'bg-amber-100 text-amber-700', label: '도착' },
    IN_PROGRESS: { color: 'bg-purple-100 text-purple-700', label: '진료중' },
    COMPLETED: { color: 'bg-green-100 text-green-700', label: '완료' },
    NO_SHOW: { color: 'bg-rose-100 text-rose-700', label: '노쇼' },
    CANCELLED: { color: 'bg-muted text-muted-foreground', label: '취소' },
  }
  const s = map[status] || map.SCHEDULED
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
}

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [showForm, setShowForm] = useState(false)
  const searchParams = useSearchParams()
  const newPatientId = searchParams?.get('new_patient_id')
  const newPatientName = searchParams?.get('patient_name')
  const newPatientPhone = searchParams?.get('patient_phone')

  useEffect(() => {
    if (newPatientId && !showForm) setShowForm(true)
  }, [newPatientId])

  const dateFrom = `${selectedDate}T00:00:00`
  const dateTo = `${selectedDate}T23:59:59`

  const { data: appts, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentService.list({ date_from: dateFrom, date_to: dateTo }),
  })

  const { data: stats } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: () => appointmentService.todayStats(),
  })

  const checkInMut = useMutation({
    mutationFn: (id: string) => appointmentService.checkIn(id),
    onSuccess: () => {
      toast.success('환자 도착 처리 완료')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['appointment-stats'] })
    },
  })

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentService.cancel(id, reason),
    onSuccess: () => {
      toast.success('예약 취소')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const completeMut = useMutation({
    mutationFn: (id: string) => appointmentService.update(id, { status: 'COMPLETED' }),
    onSuccess: () => {
      toast.success('진료 완료')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">예약 관리</h1>
            <p className="text-sm text-muted-foreground">시간대 충돌 자동 검증 + 체크인 + 노쇼 추적</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 신규 예약
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4"><div className="text-xs text-muted-foreground">오늘 총 예약</div><div className="text-2xl font-bold">{stats?.total ?? '-'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">대기</div><div className="text-2xl font-bold">{stats?.scheduled ?? '-'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">도착</div><div className="text-2xl font-bold text-amber-600">{stats?.arrived ?? '-'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">완료</div><div className="text-2xl font-bold text-green-600">{stats?.completed ?? '-'}</div></div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <input type="date" className="input w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          <span className="text-xs text-muted-foreground">{appts?.length ?? 0}건</span>
        </div>

        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        {!isLoading && (appts?.length ?? 0) === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">선택한 날짜에 예약이 없습니다.</p>
        )}
        <div className="space-y-2">
          {appts?.map((a: Appointment) => (
            <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-center min-w-[60px]">
                <Clock className="w-3 h-3 mx-auto text-muted-foreground" />
                <div className="text-sm font-bold">{a.start_time.slice(11, 16)}</div>
                <div className="text-[10px] text-muted-foreground">{a.duration_min}분</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.patient_name}</span>
                  <StatusBadge status={a.status} />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {a.appointment_type === 'INITIAL' ? '초진' : a.appointment_type === 'REVISIT' ? '재진' : '검진'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  {a.patient_phone && <span><Phone className="w-3 h-3 inline" /> {a.patient_phone}</span>}
                  {a.chief_complaint && <span className="truncate">· {a.chief_complaint}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {a.status === 'SCHEDULED' && (
                  <button onClick={() => checkInMut.mutate(a.id)} className="btn-secondary text-xs">
                    <User className="w-3 h-3" /> 체크인
                  </button>
                )}
                {(a.status === 'ARRIVED' || a.status === 'IN_PROGRESS') && (
                  <a
                    href={`/emr/chart/new?${a.patient_id ? `patient_id=${a.patient_id}&` : ''}cc=${encodeURIComponent(a.chief_complaint || '')}`}
                    className="btn-primary text-xs"
                    title="진료 시작 — 미리 채워진 차트 작성"
                  >
                    <Stethoscope className="w-3 h-3" /> 진료 시작
                  </a>
                )}
                {(a.status === 'ARRIVED' || a.status === 'IN_PROGRESS') && (
                  <button onClick={() => completeMut.mutate(a.id)} className="btn-ghost text-xs">
                    <Check className="w-3 h-3" /> 완료
                  </button>
                )}
                {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                  <button onClick={() => cancelMut.mutate({ id: a.id, reason: '취소' })} className="btn-ghost text-xs text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <NewAppointmentModal
          prefillPatientId={newPatientId || undefined}
          prefillPatientName={newPatientName || undefined}
          prefillPatientPhone={newPatientPhone || undefined}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['appointments'] })
            qc.invalidateQueries({ queryKey: ['appointment-stats'] })
          }}
        />
      )}
    </div>
  )
}

interface NewAppointmentModalProps {
  onClose: () => void
  onSuccess: () => void
  prefillPatientId?: string
  prefillPatientName?: string
  prefillPatientPhone?: string
}

function NewAppointmentModal({ onClose, onSuccess, prefillPatientId, prefillPatientName, prefillPatientPhone }: NewAppointmentModalProps) {
  const [patient, setPatient] = useState<{ id: string; name: string; phone?: string } | null>(
    prefillPatientId && prefillPatientName ? { id: prefillPatientId, name: prefillPatientName, phone: prefillPatientPhone } : null
  )
  const [name, setName] = useState(prefillPatientName || '')
  const [phone, setPhone] = useState(prefillPatientPhone || '')
  const [start, setStart] = useState('')
  const [duration, setDuration] = useState(15)
  const [type, setType] = useState('INITIAL')
  const [complaint, setComplaint] = useState('')
  const [memo, setMemo] = useState('')

  const createMut = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => {
      toast.success('예약 생성')
      onSuccess()
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || '예약 실패')
    },
  })

  const onSubmit = () => {
    const finalName = patient?.name || name
    const finalPhone = patient?.phone || phone
    if (!finalName || !start) {
      toast.error('환자·예약시간 필수')
      return
    }
    createMut.mutate({
      patient_id: patient?.id,
      patient_name: finalName,
      patient_phone: finalPhone || undefined,
      start_time: new Date(start).toISOString(),
      duration_min: duration,
      appointment_type: type,
      chief_complaint: complaint || undefined,
      memo: memo || undefined,
      channel: 'PHONE',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">신규 예약</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label text-xs mb-1 block">기존 환자 선택</label>
            <PatientPicker value={patient} onChange={setPatient} />
          </div>
          <div className="text-[11px] text-muted-foreground">또는 신규 환자 직접 입력 ↓</div>
          <div><label className="label text-xs">환자명</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!!patient} /></div>
          <div><label className="label text-xs">전화번호</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!patient} /></div>
          <div><label className="label text-xs">예약 시간 *</label><input type="datetime-local" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label text-xs">소요 시간 (분)</label><input type="number" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            <div><label className="label text-xs">진료 구분</label><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option value="INITIAL">초진</option><option value="REVISIT">재진</option><option value="CHECKUP">검진</option></select></div>
          </div>
          <div><label className="label text-xs">주소</label><input className="input" value={complaint} onChange={(e) => setComplaint(e.target.value)} /></div>
          <div><label className="label text-xs">메모</label><input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} /></div>
        </div>
        <button onClick={onSubmit} disabled={createMut.isPending} className="btn-primary w-full">
          {createMut.isPending ? '예약 중...' : '예약 생성'}
        </button>
      </div>
    </div>
  )
}

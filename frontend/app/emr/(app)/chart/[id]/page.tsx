'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Stethoscope, Loader2, Check, Trash2, Receipt, Pill, Edit3, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { visitService, prescriptionService, billService } from '@/lib/api/emr'
import NewPrescriptionModal from '@/components/emr/NewPrescriptionModal'

export default function VisitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const id = params.id as string
  const [showRxModal, setShowRxModal] = useState(false)

  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitService.get(id),
    enabled: !!id,
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['visit-prescriptions', id],
    queryFn: () => prescriptionService.list({ visit_id: id }),
    enabled: !!id,
  })

  const { data: bills } = useQuery({
    queryKey: ['visit-bills', id],
    queryFn: () => billService.list().then((all) => all.filter((b: any) => b.visit_id === id)),
    enabled: !!id,
  })

  const completeMut = useMutation({
    mutationFn: () => visitService.complete(id),
    onSuccess: () => {
      toast.success('진료 완료 처리')
      qc.invalidateQueries({ queryKey: ['visit', id] })
      qc.invalidateQueries({ queryKey: ['visits'] })
    },
  })

  const deleteMut = useMutation({
    mutationFn: () => visitService.remove(id),
    onSuccess: () => {
      toast.success('삭제 완료')
      router.push('/emr/chart')
    },
  })

  const billMut = useMutation({
    mutationFn: () => visitService.createBill(id),
    onSuccess: (bill) => {
      toast.success(`청구서 발행 완료 (${bill.bill_no.slice(-12)})`)
      router.push('/emr/billing')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || '청구서 발행 실패')
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }
  if (!visit) {
    return <div className="p-6 text-center text-muted-foreground">진료 기록을 찾을 수 없습니다.</div>
  }

  const procTotal = visit.procedures.reduce((s, p) => s + (p.total_price || 0), 0)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emr/chart" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Stethoscope className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">진료 기록</h1>
            <p className="text-xs text-muted-foreground font-mono">{visit.visit_no}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            visit.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
            'bg-muted text-muted-foreground'
          }`}>
            {visit.status === 'COMPLETED' ? '완료' : visit.status === 'IN_PROGRESS' ? '진행중' : visit.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/emr/chart/${id}/edit`} className="btn-ghost" title="수정">
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setShowRxModal(true)}
            className="btn-secondary"
            title="이 진료에 처방전 발행"
          >
            <Pill className="w-4 h-4" /> 처방전
          </button>
          <button
            onClick={() => billMut.mutate()}
            disabled={billMut.isPending}
            className="btn-secondary"
            title="이 진료의 시술 항목으로 청구서 자동 발행"
          >
            <Receipt className="w-4 h-4" />
            {billMut.isPending ? '발행 중...' : '청구서 발행'}
          </button>
          {visit.status !== 'COMPLETED' && (
            <button onClick={() => completeMut.mutate()} disabled={completeMut.isPending} className="btn-secondary">
              <Check className="w-4 h-4" /> 진료 완료
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('이 진료 기록을 삭제하시겠습니까?')) deleteMut.mutate()
            }}
            disabled={deleteMut.isPending}
            className="btn-ghost text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="font-semibold mb-3">기본 정보</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">차트번호</dt><dd className="font-mono">{visit.chart_no || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">진료일</dt><dd>{visit.visit_date}</dd></div>
          <div><dt className="text-xs text-muted-foreground">구분</dt><dd>{visit.visit_type === 'INITIAL' ? '초진' : visit.visit_type === 'REVISIT' ? '재진' : '검진'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">담당의</dt><dd>{visit.doctor_name || '-'}</dd></div>
        </dl>
      </section>

      {(visit.vital_systolic || visit.vital_hr || visit.vital_temp) && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3">활력징후</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {visit.vital_systolic && <div><dt className="text-xs text-muted-foreground">혈압</dt><dd>{visit.vital_systolic}/{visit.vital_diastolic} mmHg</dd></div>}
            {visit.vital_hr && <div><dt className="text-xs text-muted-foreground">맥박</dt><dd>{visit.vital_hr} bpm</dd></div>}
            {visit.vital_temp && <div><dt className="text-xs text-muted-foreground">체온</dt><dd>{visit.vital_temp}°C</dd></div>}
            {visit.vital_spo2 && <div><dt className="text-xs text-muted-foreground">SpO₂</dt><dd>{visit.vital_spo2}%</dd></div>}
            {visit.vital_weight && <div><dt className="text-xs text-muted-foreground">체중</dt><dd>{visit.vital_weight}kg</dd></div>}
            {visit.vital_height && <div><dt className="text-xs text-muted-foreground">신장</dt><dd>{visit.vital_height}cm</dd></div>}
            {visit.vital_bmi && <div><dt className="text-xs text-muted-foreground">BMI</dt><dd>{visit.vital_bmi}</dd></div>}
          </dl>
        </section>
      )}

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">SOAP</h2>
        <div className="text-sm">
          <div className="text-xs text-muted-foreground">주소 (Chief Complaint)</div>
          <p className="bg-muted/30 rounded p-2 mt-1">{visit.chief_complaint || '-'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {visit.subjective && <div><div className="text-xs text-muted-foreground">S — 주관</div><p className="bg-muted/30 rounded p-2 mt-1 whitespace-pre-wrap">{visit.subjective}</p></div>}
          {visit.objective && <div><div className="text-xs text-muted-foreground">O — 객관</div><p className="bg-muted/30 rounded p-2 mt-1 whitespace-pre-wrap">{visit.objective}</p></div>}
          {visit.assessment && <div><div className="text-xs text-muted-foreground">A — 평가</div><p className="bg-muted/30 rounded p-2 mt-1 whitespace-pre-wrap">{visit.assessment}</p></div>}
          {visit.plan && <div><div className="text-xs text-muted-foreground">P — 계획</div><p className="bg-muted/30 rounded p-2 mt-1 whitespace-pre-wrap">{visit.plan}</p></div>}
        </div>
      </section>

      {visit.diagnoses.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3">진단</h2>
          <ul className="space-y-1.5">
            {visit.diagnoses.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-blue-600 text-xs">{d.code}</span>
                <span>{d.name}</span>
                {d.is_primary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">주진단</span>}
                {d.note && <span className="text-xs text-muted-foreground">· {d.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {visit.procedures.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3">시술 · 검사</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-1.5">코드</th><th>명칭</th><th>구분</th>
                <th className="text-right">수량</th><th className="text-right">단가</th><th className="text-right">합계</th>
              </tr>
            </thead>
            <tbody>
              {visit.procedures.map((p) => (
                <tr key={p.id} className="border-b border-border/30">
                  <td className="py-1.5 font-mono text-blue-600 text-xs">{p.code}</td>
                  <td>{p.name}</td>
                  <td className="text-xs">{p.category}</td>
                  <td className="text-right">{p.quantity}</td>
                  <td className="text-right">{p.unit_price.toLocaleString()}</td>
                  <td className="text-right font-medium">{(p.total_price || 0).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-semibold">
                <td colSpan={5} className="py-2 text-right">합계</td>
                <td className="text-right">{procTotal.toLocaleString()}원</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {visit.next_visit_date && (
        <div className="card p-3 bg-blue-50/50 dark:bg-blue-950/20 text-sm">
          다음 진료 예정: <b>{visit.next_visit_date}</b>
        </div>
      )}

      {/* 이 진료의 처방전 */}
      {prescriptions && prescriptions.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-purple-600" /> 이 진료의 처방전</h2>
          <div className="space-y-2">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="border border-border rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{rx.prescription_no.slice(-12)}</span>
                    {rx.dur_warnings.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600">
                        <AlertTriangle className="w-3 h-3" /> DUR {rx.dur_warnings.length}건
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{rx.total_amount.toLocaleString()}원</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {rx.items.map((it) => `${it.drug_name}(${it.dose_per_time}${it.dose_unit}×${it.frequency_per_day}회×${it.duration_days}일)`).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 이 진료의 청구서 */}
      {bills && bills.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-600" /> 이 진료의 청구서</h2>
          <div className="space-y-2">
            {bills.map((b: any) => (
              <Link key={b.id} href="/emr/billing" className="block border border-border rounded p-3 text-sm hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{b.bill_no.slice(-12)}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    b.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    b.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{b.status === 'PAID' ? '완납' : b.status === 'PARTIAL' ? '부분수납' : '발행'}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-muted-foreground">총 {b.final_amount.toLocaleString()}원 / 수납 {b.paid_amount.toLocaleString()}원</span>
                  {b.balance > 0 && <span className="text-amber-600 font-medium">잔액 {b.balance.toLocaleString()}원</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showRxModal && (
        <NewPrescriptionModal
          visitId={visit.id}
          patientId={visit.patient_id || undefined}
          onClose={() => setShowRxModal(false)}
        />
      )}
    </div>
  )
}

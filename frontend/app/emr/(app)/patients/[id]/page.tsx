'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, User, Phone, Calendar, Loader2,
  Stethoscope, Pill, Receipt, AlertTriangle, Plus,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { visitService, prescriptionService, billService } from '@/lib/api/emr'

interface PatientDetail {
  id: string
  chart_no?: string
  name: string
  phone?: string
  gender?: string
  birth_date?: string
  region?: string
  inflow_date?: string
  inflow_path?: string
  symptoms?: string
  diagnosis_name?: string
  consultation_summary?: string
  appointment_date?: string
  inbound_status?: string
  manager_name?: string
  is_demo?: boolean
}

export default function PatientDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => (await apiClient.get(`/emr/patients/${id}`)).data as PatientDetail,
    enabled: !!id,
  })

  const { data: visits } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: () => visitService.list({ patient_id: id, page_size: 50 }),
    enabled: !!id && !patient?.is_demo,
  })

  const { data: prescriptions } = useQuery({
    queryKey: ['patient-rx', id],
    queryFn: () => prescriptionService.list({ patient_id: id }),
    enabled: !!id && !patient?.is_demo,
  })

  const { data: bills } = useQuery({
    queryKey: ['patient-bills', id],
    queryFn: () => billService.list({ patient_id: id }),
    enabled: !!id && !patient?.is_demo,
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!patient) return <div className="p-6 text-center text-muted-foreground">환자를 찾을 수 없습니다.</div>

  const totalUnpaid = (bills || []).reduce((s: number, b: any) => s + (b.balance || 0), 0)
  const totalPaid = (bills || []).reduce((s: number, b: any) => s + (b.paid_amount || 0), 0)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emr/patients" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <User className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">{patient.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{patient.chart_no || '차트번호 미등록'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/emr/chart/new?patient_id=${id}`} className="btn-primary">
            <Plus className="w-4 h-4" /> 신규 진료
          </Link>
        </div>
      </div>

      {patient.is_demo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          데모 환자 데이터입니다 — 실제 환자 등록 후 사용하세요.
        </div>
      )}

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">기본 정보</h2>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">성별·생년월일</dt><dd>{patient.gender || '-'} · {patient.birth_date || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">전화</dt><dd>{patient.phone ? <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span> : '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">유입 경로</dt><dd>{patient.inflow_path || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">유입일</dt><dd>{patient.inflow_date || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">담당 실장</dt><dd>{patient.manager_name || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">상태</dt><dd>{patient.inbound_status || '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">예약</dt><dd>{patient.appointment_date ? <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {patient.appointment_date.slice(0, 10)}</span> : '-'}</dd></div>
          <div><dt className="text-xs text-muted-foreground">지역</dt><dd>{patient.region || '-'}</dd></div>
        </dl>
        {patient.symptoms && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">증상·주소</div>
            <p className="bg-muted/30 rounded p-2 text-sm whitespace-pre-wrap">{patient.symptoms}</p>
          </div>
        )}
      </section>

      {!patient.is_demo && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4"><div className="text-xs text-muted-foreground">총 진료</div><div className="text-2xl font-bold">{visits?.length ?? 0}건</div></div>
            <div className="card p-4"><div className="text-xs text-muted-foreground">누적 수납</div><div className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString()}원</div></div>
            <div className="card p-4"><div className="text-xs text-muted-foreground">미수금</div><div className={`text-2xl font-bold ${totalUnpaid > 0 ? 'text-amber-600' : ''}`}>{totalUnpaid.toLocaleString()}원</div></div>
          </div>

          <section className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-600" /> 진료 이력</h2>
            {(visits?.length ?? 0) === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">진료 이력 없음</p>
            ) : (
              <div className="space-y-2">
                {visits?.map((v: any) => (
                  <Link key={v.id} href={`/emr/chart/${v.id}`} className="block border border-border rounded p-3 text-sm hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{v.visit_date}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{v.visit_type === 'INITIAL' ? '초진' : '재진'}</span>
                      </div>
                      <span className="text-xs">{(v.total_amount || 0).toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {v.chief_complaint && <span>· {v.chief_complaint}</span>}
                      {v.primary_diagnosis && <span className="ml-2">· {v.primary_diagnosis}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {prescriptions && prescriptions.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Pill className="w-4 h-4 text-purple-600" /> 처방 이력</h2>
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="border border-border rounded p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rx.prescribed_date}</span>
                        {rx.dur_warnings.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-600">
                            <AlertTriangle className="w-3 h-3" /> DUR {rx.dur_warnings.length}
                          </span>
                        )}
                      </div>
                      <span className="text-xs">{rx.total_amount.toLocaleString()}원</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rx.items.map((it) => it.drug_name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {bills && bills.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-600" /> 청구·수납 이력</h2>
              <div className="space-y-2">
                {bills.map((b: any) => (
                  <div key={b.id} className="border border-border rounded p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{b.bill_date}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        b.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        b.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{b.status === 'PAID' ? '완납' : b.status === 'PARTIAL' ? '부분수납' : '발행'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">총 {b.final_amount.toLocaleString()}원 / 수납 {b.paid_amount.toLocaleString()}원</span>
                      {b.balance > 0 && <span className="text-amber-600 font-medium">잔액 {b.balance.toLocaleString()}원</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

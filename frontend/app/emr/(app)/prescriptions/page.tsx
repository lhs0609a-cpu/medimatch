'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pill, Plus, AlertTriangle, Loader2, ShieldCheck, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { prescriptionService, Prescription, PrescriptionItem } from '@/lib/api/emr'
import NewPrescriptionModal from '@/components/emr/NewPrescriptionModal'

export default function PrescriptionsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: () => prescriptionService.list(),
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="w-7 h-7 text-purple-600" />
          <div>
            <h1 className="text-2xl font-semibold">처방전</h1>
            <p className="text-sm text-muted-foreground">DUR 자동 안전 체크 — 임신·연령·병용금기·중복 처방</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 신규 처방
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> 처방 이력</h2>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        {!isLoading && (prescriptions?.length ?? 0) === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">처방전이 없습니다.</p>
        )}
        <div className="space-y-3">
          {prescriptions?.map((rx: Prescription) => (
            <div key={rx.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{rx.prescription_no.slice(-12)}</span>
                  <span className="ml-2 text-sm">{rx.prescribed_date}</span>
                  {rx.dur_warnings.length > 0 ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-rose-600">
                      <AlertTriangle className="w-3 h-3" /> DUR 경고 {rx.dur_warnings.length}건
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-green-600">
                      <ShieldCheck className="w-3 h-3" /> 안전
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{rx.total_amount.toLocaleString()}원</span>
                  <Link
                    href={`/emr/prescriptions/${rx.id}/print`}
                    target="_blank"
                    className="btn-ghost text-xs"
                    title="처방전 인쇄/PDF"
                  >
                    <Printer className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {rx.items.map((it: PrescriptionItem) => (
                  <div key={it.id} className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{it.drug_name}</span>
                    <span className="text-muted-foreground">{it.dose_per_time}{it.dose_unit} × {it.frequency_per_day}회/일 × {it.duration_days}일</span>
                    {it.warning && (
                      <span className="text-[10px] text-rose-600 inline-flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> {it.warning}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && <NewPrescriptionModal onClose={() => setShowForm(false)} onSuccess={() => {
        qc.invalidateQueries({ queryKey: ['prescriptions'] })
      }} />}
    </div>
  )
}

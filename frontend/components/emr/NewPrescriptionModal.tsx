'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Plus, X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { prescriptionService, PrescriptionItem } from '@/lib/api/emr'
import HiraCodePicker from './HiraCodePicker'

interface Props {
  visitId?: string
  patientId?: string
  onClose: () => void
  onSuccess?: () => void
}

export default function NewPrescriptionModal({ visitId, patientId, onClose, onSuccess }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [prescribedDate, setPrescribedDate] = useState(today)
  const [pharmacyName, setPharmacyName] = useState('')
  const [patientNote, setPatientNote] = useState('')
  const [items, setItems] = useState<Omit<PrescriptionItem, 'id' | 'warning'>[]>([
    { drug_code: '', drug_name: '', ingredient: '', dose_per_time: 1, dose_unit: '정', frequency_per_day: 3, duration_days: 3, total_quantity: 9, unit_price: 0, total_price: 0, usage_note: '식후 30분' },
  ])
  const [durResult, setDurResult] = useState<{ warnings: any[]; item_warnings: Record<number, string> } | null>(null)

  const durMut = useMutation({
    mutationFn: () => prescriptionService.durCheck({
      visit_id: visitId,
      patient_id: patientId,
      prescribed_date: prescribedDate,
      items: items.map((it) => ({
        ...it,
        total_quantity: it.dose_per_time * it.frequency_per_day * it.duration_days,
      })),
    }),
    onSuccess: (r) => {
      setDurResult(r)
      if (r.warnings.length === 0) {
        toast.success('DUR 안전 — 처방 가능')
      } else {
        toast.warning(`DUR 경고 ${r.warnings.length}건`)
      }
    },
  })

  const createMut = useMutation({
    mutationFn: () => prescriptionService.create({
      visit_id: visitId,
      patient_id: patientId,
      prescribed_date: prescribedDate,
      pharmacy_name: pharmacyName || undefined,
      patient_note: patientNote || undefined,
      items: items.map((it) => {
        const total_qty = it.dose_per_time * it.frequency_per_day * it.duration_days
        return {
          ...it,
          total_quantity: total_qty,
          total_price: it.unit_price * total_qty,
        }
      }),
    }),
    onSuccess: () => {
      toast.success('처방전 발행 완료')
      onSuccess?.()
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '발행 실패'),
  })

  const update = (i: number, p: Partial<typeof items[0]>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  const add = () => setItems([...items, { drug_code: '', drug_name: '', ingredient: '', dose_per_time: 1, dose_unit: '정', frequency_per_day: 3, duration_days: 3, total_quantity: 9, unit_price: 0, total_price: 0, usage_note: '식후 30분' }])
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-xl max-w-3xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">신규 처방전{visitId && ' (진료 연결)'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="label text-xs">처방일</label><input type="date" className="input" value={prescribedDate} onChange={(e) => setPrescribedDate(e.target.value)} /></div>
          <div><label className="label text-xs">조제 약국</label><input className="input" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} placeholder="(선택)" /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label text-xs">약품 처방</label>
            <div className="flex gap-2">
              <button onClick={() => durMut.mutate()} disabled={durMut.isPending} className="btn-secondary text-xs">
                <ShieldCheck className="w-3 h-3" /> DUR 체크
              </button>
              <button onClick={add} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 약품 추가</button>
            </div>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="border border-border rounded p-2 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <HiraCodePicker
                      type="drug"
                      value={it.drug_name}
                      onChange={(name) => update(i, { drug_name: name })}
                      onSelect={(item) => update(i, {
                        drug_code: item.code,
                        drug_name: item.name,
                        unit_price: item.unit_price ?? it.unit_price,
                      })}
                      placeholder="약품명 검색"
                    />
                  </div>
                  <input className="input col-span-3" placeholder="성분" value={it.ingredient || ''} onChange={(e) => update(i, { ingredient: e.target.value })} />
                  <input className="input col-span-2" type="number" placeholder="단가" value={it.unit_price} onChange={(e) => update(i, { unit_price: Number(e.target.value) })} />
                  <button onClick={() => remove(i)} className="text-rose-500 col-span-1"><X className="w-4 h-4 mx-auto" /></button>
                </div>
                <div className="grid grid-cols-12 gap-2 text-xs">
                  <div className="col-span-3 flex gap-1 items-center">
                    <input className="input flex-1" type="number" step="0.5" value={it.dose_per_time} onChange={(e) => update(i, { dose_per_time: Number(e.target.value) })} />
                    <select className="input" value={it.dose_unit} onChange={(e) => update(i, { dose_unit: e.target.value })}>
                      <option>정</option><option>캡슐</option><option>ml</option><option>포</option>
                    </select>
                  </div>
                  <div className="col-span-2"><input className="input" type="number" placeholder="회/일" value={it.frequency_per_day} onChange={(e) => update(i, { frequency_per_day: Number(e.target.value) })} title="1일 횟수" /></div>
                  <div className="col-span-2"><input className="input" type="number" placeholder="일수" value={it.duration_days} onChange={(e) => update(i, { duration_days: Number(e.target.value) })} title="총 일수" /></div>
                  <input className="input col-span-5" placeholder="복용 안내 (식후 30분)" value={it.usage_note || ''} onChange={(e) => update(i, { usage_note: e.target.value })} />
                </div>
                {durResult?.item_warnings[i] && (
                  <div className="text-xs text-rose-600 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> {durResult.item_warnings[i]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {durResult && durResult.warnings.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
            <div className="font-semibold text-rose-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> DUR 경고</div>
            {durResult.warnings.map((w, i) => (
              <div key={i} className="text-rose-600">· {w.message}</div>
            ))}
          </div>
        )}

        <textarea className="input" placeholder="환자 안내 메모" value={patientNote} onChange={(e) => setPatientNote(e.target.value)} />

        <button
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending || items.filter((it) => it.drug_name).length === 0}
          className="btn-primary w-full"
        >
          {createMut.isPending ? '발행 중...' : '처방전 발행'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Save, Plus, X, Stethoscope, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { visitService, Diagnosis, Procedure } from '@/lib/api/emr'
import HiraCodePicker from '@/components/emr/HiraCodePicker'

export default function EditVisitPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitService.get(id),
    enabled: !!id,
  })

  const [chiefComplaint, setChiefComplaint] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [systolic, setSystolic] = useState<number | ''>('')
  const [diastolic, setDiastolic] = useState<number | ''>('')
  const [hr, setHr] = useState<number | ''>('')
  const [temp, setTemp] = useState<number | ''>('')
  const [spo2, setSpo2] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [nextVisit, setNextVisit] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!visit) return
    setChiefComplaint(visit.chief_complaint || '')
    setSubjective(visit.subjective || '')
    setObjective(visit.objective || '')
    setAssessment(visit.assessment || '')
    setPlan(visit.plan || '')
    setSystolic(visit.vital_systolic ?? '')
    setDiastolic(visit.vital_diastolic ?? '')
    setHr(visit.vital_hr ?? '')
    setTemp(visit.vital_temp ?? '')
    setSpo2(visit.vital_spo2 ?? '')
    setWeight(visit.vital_weight ?? '')
    setHeight(visit.vital_height ?? '')
    setDiagnoses(visit.diagnoses.length > 0 ? visit.diagnoses : [{ code: '', name: '', is_primary: true, note: '' }])
    setProcedures(visit.procedures || [])
    setNextVisit(visit.next_visit_date || '')
    setNotes(visit.visit_notes || '')
  }, [visit])

  const updateMut = useMutation({
    mutationFn: () => visitService.update(id, {
      chief_complaint: chiefComplaint,
      subjective, objective, assessment, plan,
      vital_systolic: systolic === '' ? undefined : Number(systolic),
      vital_diastolic: diastolic === '' ? undefined : Number(diastolic),
      vital_hr: hr === '' ? undefined : Number(hr),
      vital_temp: temp === '' ? undefined : Number(temp),
      vital_spo2: spo2 === '' ? undefined : Number(spo2),
      vital_weight: weight === '' ? undefined : Number(weight),
      vital_height: height === '' ? undefined : Number(height),
      next_visit_date: nextVisit || undefined,
      visit_notes: notes || undefined,
      diagnoses: diagnoses.filter((d) => d.code && d.name),
      procedures: procedures.filter((p) => p.name).map((p) => ({
        ...p,
        total_price: (p.unit_price || 0) * (p.quantity || 1),
      })),
    }),
    onSuccess: () => {
      toast.success('수정 완료')
      router.push(`/emr/chart/${id}`)
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '수정 실패'),
  })

  const updateD = (i: number, p: Partial<Diagnosis>) => setDiagnoses(diagnoses.map((d, idx) => (idx === i ? { ...d, ...p } : d)))
  const updateP = (i: number, p: Partial<Procedure>) => setProcedures(procedures.map((x, idx) => (idx === i ? { ...x, ...p } : x)))

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!visit) return <div className="p-6 text-center text-muted-foreground">진료 기록을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/emr/chart/${id}`} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <Stethoscope className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">진료 기록 수정</h1>
            <p className="text-xs text-muted-foreground font-mono">{visit.visit_no}</p>
          </div>
        </div>
        <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending} className="btn-primary">
          <Save className="w-4 h-4" /> {updateMut.isPending ? '저장 중...' : '저장'}
        </button>
      </div>

      <section className="card p-5 space-y-4">
        <h2 className="font-semibold">활력징후</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label text-xs">수축기</label><input type="number" className="input" value={systolic} onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">이완기</label><input type="number" className="input" value={diastolic} onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">맥박</label><input type="number" className="input" value={hr} onChange={(e) => setHr(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">체온</label><input type="number" step="0.1" className="input" value={temp} onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">SpO₂</label><input type="number" className="input" value={spo2} onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">체중</label><input type="number" step="0.1" className="input" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">신장</label><input type="number" step="0.1" className="input" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} /></div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-semibold">SOAP</h2>
        <div><label className="label text-xs">주소 *</label><input className="input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label text-xs">S — 주관</label><textarea className="input min-h-[100px]" value={subjective} onChange={(e) => setSubjective(e.target.value)} /></div>
          <div><label className="label text-xs">O — 객관</label><textarea className="input min-h-[100px]" value={objective} onChange={(e) => setObjective(e.target.value)} /></div>
          <div><label className="label text-xs">A — 평가</label><textarea className="input min-h-[100px]" value={assessment} onChange={(e) => setAssessment(e.target.value)} /></div>
          <div><label className="label text-xs">P — 계획</label><textarea className="input min-h-[100px]" value={plan} onChange={(e) => setPlan(e.target.value)} /></div>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">진단</h2>
          <button onClick={() => setDiagnoses([...diagnoses, { code: '', name: '', is_primary: false }])} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 추가</button>
        </div>
        {diagnoses.map((d, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <input className="input col-span-2" placeholder="코드" value={d.code} onChange={(e) => updateD(i, { code: e.target.value })} />
            <div className="col-span-5">
              <HiraCodePicker type="disease" value={d.name} onChange={(name) => updateD(i, { name })} onSelect={(item) => updateD(i, { code: item.code, name: item.name })} />
            </div>
            <input className="input col-span-3" placeholder="비고" value={d.note || ''} onChange={(e) => updateD(i, { note: e.target.value })} />
            <label className="flex items-center gap-1 text-xs col-span-1 mt-2"><input type="checkbox" checked={d.is_primary} onChange={(e) => updateD(i, { is_primary: e.target.checked })} /> 주</label>
            <button onClick={() => setDiagnoses(diagnoses.filter((_, idx) => idx !== i))} className="text-rose-500 col-span-1"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">시술 · 검사</h2>
          <button onClick={() => setProcedures([...procedures, { code: '', name: '', category: '진찰', quantity: 1, unit_price: 0, insurance_covered: true }])} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 추가</button>
        </div>
        {procedures.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <input className="input col-span-2" placeholder="수가" value={p.code} onChange={(e) => updateP(i, { code: e.target.value })} />
            <div className="col-span-3">
              <HiraCodePicker type="fee" value={p.name} onChange={(name) => updateP(i, { name })} onSelect={(item) => updateP(i, { code: item.code, name: item.name, unit_price: item.unit_price ?? p.unit_price })} />
            </div>
            <select className="input col-span-1" value={p.category || '진찰'} onChange={(e) => updateP(i, { category: e.target.value })}>
              <option value="진찰">진찰</option><option value="검사">검사</option><option value="시술">시술</option><option value="주사">주사</option><option value="처치">처치</option>
            </select>
            <input className="input col-span-1" type="number" min={1} value={p.quantity} onChange={(e) => updateP(i, { quantity: Number(e.target.value) })} />
            <input className="input col-span-2" type="number" placeholder="단가" value={p.unit_price} onChange={(e) => updateP(i, { unit_price: Number(e.target.value) })} />
            <div className="col-span-2 self-center text-sm text-right">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString()}원</div>
            <button onClick={() => setProcedures(procedures.filter((_, idx) => idx !== i))} className="text-rose-500 col-span-1"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">추가</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label text-xs">다음 진료일</label><input type="date" className="input" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} /></div>
          <div><label className="label text-xs">메모</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
      </section>
    </div>
  )
}

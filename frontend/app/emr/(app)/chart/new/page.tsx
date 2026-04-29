'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Save, Plus, X, Stethoscope, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { visitService, Diagnosis, Procedure } from '@/lib/api/emr'
import PatientPicker from '@/components/emr/PatientPicker'
import HiraCodePicker from '@/components/emr/HiraCodePicker'
import { apiClient } from '@/lib/api/client'

export default function NewChartPage() {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  const [patient, setPatient] = useState<{ id: string; chart_no?: string; name: string } | null>(null)

  const handlePatientChange = (p: { id: string; chart_no?: string; name: string } | null) => {
    setPatient(p)
    if (p?.chart_no && !chartNo) setChartNo(p.chart_no)
  }

  // ?patient_id=... 쿼리 파라미터로 환자 자동 로드
  const searchParams = useSearchParams()
  const queryPatientId = searchParams?.get('patient_id')
  useEffect(() => {
    if (!queryPatientId || patient) return
    apiClient.get(`/emr/patients/${queryPatientId}`).then((r) => {
      const p = r.data
      if (p && p.id) {
        handlePatientChange({ id: p.id, chart_no: p.chart_no, name: p.name })
      }
    }).catch(() => {})
  }, [queryPatientId])
  const [chartNo, setChartNo] = useState('')
  const [visitDate, setVisitDate] = useState(today)
  const [visitType, setVisitType] = useState('INITIAL')
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

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([
    { code: '', name: '', is_primary: true, note: '' },
  ])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [nextVisit, setNextVisit] = useState('')
  const [notes, setNotes] = useState('')

  const createMut = useMutation({
    mutationFn: visitService.create,
    onSuccess: (visit) => {
      toast.success(`진료기록 저장 완료 (${visit.visit_no})`)
      router.push('/emr/chart')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || '저장 실패')
    },
  })

  const addDiagnosis = () =>
    setDiagnoses([...diagnoses, { code: '', name: '', is_primary: false, note: '' }])
  const removeDiagnosis = (i: number) =>
    setDiagnoses(diagnoses.filter((_, idx) => idx !== i))
  const updateDiagnosis = (i: number, patch: Partial<Diagnosis>) =>
    setDiagnoses(diagnoses.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))

  const addProcedure = () =>
    setProcedures([
      ...procedures,
      { code: '', name: '', category: '진찰', quantity: 1, unit_price: 0, insurance_covered: true },
    ])
  const removeProcedure = (i: number) =>
    setProcedures(procedures.filter((_, idx) => idx !== i))
  const updateProcedure = (i: number, patch: Partial<Procedure>) =>
    setProcedures(procedures.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  const totalAmount = procedures.reduce(
    (s, p) => s + (p.unit_price || 0) * (p.quantity || 1),
    0,
  )

  const onSubmit = () => {
    if (!chiefComplaint.trim()) {
      toast.error('주소(C/C)를 입력해주세요')
      return
    }
    const validDiagnoses = diagnoses.filter((d) => d.code && d.name)
    const validProcedures = procedures.filter((p) => p.name)
    createMut.mutate({
      patient_id: patient?.id,
      chart_no: chartNo || patient?.chart_no || undefined,
      visit_date: visitDate,
      visit_type: visitType,
      chief_complaint: chiefComplaint,
      subjective: subjective || undefined,
      objective: objective || undefined,
      assessment: assessment || undefined,
      plan: plan || undefined,
      vital_systolic: systolic === '' ? undefined : Number(systolic),
      vital_diastolic: diastolic === '' ? undefined : Number(diastolic),
      vital_hr: hr === '' ? undefined : Number(hr),
      vital_temp: temp === '' ? undefined : Number(temp),
      vital_spo2: spo2 === '' ? undefined : Number(spo2),
      vital_weight: weight === '' ? undefined : Number(weight),
      vital_height: height === '' ? undefined : Number(height),
      next_visit_date: nextVisit || undefined,
      visit_notes: notes || undefined,
      diagnoses: validDiagnoses,
      procedures: validProcedures.map((p) => ({
        ...p,
        total_price: (p.unit_price || 0) * (p.quantity || 1),
      })),
    })
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emr/chart" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Stethoscope className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-semibold">신규 진료 기록</h1>
        </div>
        <button
          onClick={onSubmit}
          disabled={createMut.isPending}
          className="btn-primary"
        >
          <Save className="w-4 h-4" />
          {createMut.isPending ? '저장 중...' : '저장'}
        </button>
      </div>

      <section className="card p-5 space-y-4">
        <h2 className="font-semibold">기본 정보</h2>
        <div>
          <label className="label text-xs mb-1 block">환자 (선택)</label>
          <PatientPicker value={patient} onChange={handlePatientChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label text-xs">차트번호 (수동)</label>
            <input className="input" value={chartNo} onChange={(e) => setChartNo(e.target.value)} placeholder={patient?.chart_no || 'C-001234'} />
          </div>
          <div>
            <label className="label text-xs">진료일</label>
            <input type="date" className="input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">진료 구분</label>
            <select className="input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
              <option value="INITIAL">초진</option>
              <option value="REVISIT">재진</option>
              <option value="CHECKUP">검진</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-semibold">활력징후 (Vital Signs)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label text-xs">수축기 (mmHg)</label><input type="number" className="input" value={systolic} onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">이완기 (mmHg)</label><input type="number" className="input" value={diastolic} onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">맥박 (bpm)</label><input type="number" className="input" value={hr} onChange={(e) => setHr(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">체온 (°C)</label><input type="number" step="0.1" className="input" value={temp} onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">SpO₂ (%)</label><input type="number" className="input" value={spo2} onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">체중 (kg)</label><input type="number" step="0.1" className="input" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div><label className="label text-xs">신장 (cm)</label><input type="number" step="0.1" className="input" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))} /></div>
          <div className="text-xs text-muted-foreground self-end">
            BMI: <b className="text-foreground">{weight && height ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1) : '-'}</b>
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h2 className="font-semibold">SOAP 기록</h2>
        <div>
          <label className="label text-xs">주소 (Chief Complaint) *</label>
          <input className="input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="예: 두통 3일째" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label text-xs">S — 주관 (환자 호소)</label><textarea className="input min-h-[100px]" value={subjective} onChange={(e) => setSubjective(e.target.value)} /></div>
          <div><label className="label text-xs">O — 객관 (소견·검사)</label><textarea className="input min-h-[100px]" value={objective} onChange={(e) => setObjective(e.target.value)} /></div>
          <div><label className="label text-xs">A — 평가 (Assessment)</label><textarea className="input min-h-[100px]" value={assessment} onChange={(e) => setAssessment(e.target.value)} /></div>
          <div><label className="label text-xs">P — 계획 (Plan)</label><textarea className="input min-h-[100px]" value={plan} onChange={(e) => setPlan(e.target.value)} /></div>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">진단 (KCD-8 / ICD-10)</h2>
          <button onClick={addDiagnosis} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 추가</button>
        </div>
        {diagnoses.map((d, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <input className="input col-span-2" placeholder="코드 (R51)" value={d.code} onChange={(e) => updateDiagnosis(i, { code: e.target.value })} />
            <div className="col-span-5">
              <HiraCodePicker
                type="disease"
                value={d.name}
                onChange={(name) => updateDiagnosis(i, { name })}
                onSelect={(item) => updateDiagnosis(i, { code: item.code, name: item.name })}
                placeholder="진단명 또는 KCD 코드 검색"
              />
            </div>
            <input className="input col-span-3" placeholder="비고" value={d.note || ''} onChange={(e) => updateDiagnosis(i, { note: e.target.value })} />
            <label className="flex items-center gap-1 text-xs col-span-1 mt-2">
              <input type="checkbox" checked={d.is_primary} onChange={(e) => updateDiagnosis(i, { is_primary: e.target.checked })} /> 주
            </label>
            <button onClick={() => removeDiagnosis(i)} className="text-muted-foreground hover:text-rose-500 col-span-1 mt-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">시술 · 검사</h2>
          <button onClick={addProcedure} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 추가</button>
        </div>
        {procedures.length === 0 && <p className="text-xs text-muted-foreground">+ 추가 버튼으로 시술/검사 항목을 입력하세요</p>}
        {procedures.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start">
            <input className="input col-span-2" placeholder="수가코드" value={p.code} onChange={(e) => updateProcedure(i, { code: e.target.value })} />
            <div className="col-span-3">
              <HiraCodePicker
                type="fee"
                value={p.name}
                onChange={(name) => updateProcedure(i, { name })}
                onSelect={(item) => updateProcedure(i, {
                  code: item.code, name: item.name,
                  unit_price: item.unit_price ?? p.unit_price,
                })}
                placeholder="명칭 검색"
              />
            </div>
            <select className="input col-span-1" value={p.category || '진찰'} onChange={(e) => updateProcedure(i, { category: e.target.value })}>
              <option value="진찰">진찰</option><option value="검사">검사</option><option value="시술">시술</option><option value="주사">주사</option><option value="처치">처치</option>
            </select>
            <input className="input col-span-1" type="number" min={1} value={p.quantity} onChange={(e) => updateProcedure(i, { quantity: Number(e.target.value) })} />
            <input className="input col-span-2" type="number" placeholder="단가" value={p.unit_price} onChange={(e) => updateProcedure(i, { unit_price: Number(e.target.value) })} />
            <div className="col-span-2 self-center text-sm text-right">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString()}원</div>
            <label className="flex items-center gap-1 text-[10px] col-span-1 mt-2">
              <input type="checkbox" checked={p.insurance_covered ?? true} onChange={(e) => updateProcedure(i, { insurance_covered: e.target.checked })} /> 급여
            </label>
            <button onClick={() => removeProcedure(i)} className="text-muted-foreground hover:text-rose-500 col-span-12 md:col-span-1 mt-2 justify-self-end"><X className="w-4 h-4" /></button>
          </div>
        ))}
        {procedures.length > 0 && <div className="text-right text-sm border-t border-border pt-2">합계: <b>{totalAmount.toLocaleString()}원</b></div>}
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">추가 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label text-xs">다음 진료 예정일</label><input type="date" className="input" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} /></div>
          <div><label className="label text-xs">진료 메모</label><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
      </section>
    </div>
  )
}

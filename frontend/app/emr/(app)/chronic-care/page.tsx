'use client'

/**
 * 만성질환관리(만관제) 페이지.
 *
 * - 통계 카드 (조건별 환자 수, 누수 환자)
 * - 필터 (조건·상태·누수만)
 * - 환자 행 — 다음 회차, 지난 측정값, 1클릭 회차 추가
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HeartPulse, Plus, Filter, RefreshCw, AlertTriangle, Phone,
  CalendarPlus, CheckCircle2, Loader2, X, MessageSquareText,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  chronicCareService, ChronicCondition, ChronicProgram,
  conditionIcon, conditionDefaults,
} from '@/lib/api/chronicCare'
import ModuleHeader from '@/components/emr/ModuleHeader'

const ALL: 'ALL' = 'ALL'

export default function ChronicCarePage() {
  const qc = useQueryClient()
  const [condFilter, setCondFilter] = useState<ChronicCondition | typeof ALL>(ALL)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [visitFor, setVisitFor] = useState<ChronicProgram | null>(null)

  const { data: stats } = useQuery({
    queryKey: ['cc-stats'],
    queryFn: chronicCareService.stats,
    refetchInterval: 30000,
  })
  const { data: items, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cc-list', condFilter, overdueOnly],
    queryFn: () => chronicCareService.list({
      condition: condFilter === ALL ? undefined : condFilter,
      overdue_only: overdueOnly || undefined,
    }),
  })

  return (
    <div>
      <ModuleHeader
        moduleKey="chronic-care"
        maxWidthClass="max-w-6xl"
        meta={
          stats && stats.overdue_count > 0 ? (
            <span className="font-medium text-rose-600">누수 {stats.overdue_count}명</span>
          ) : null
        }
        actions={
          <>
            <button onClick={() => refetch()} className="btn-ghost text-sm" disabled={isFetching}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> 환자 등록
            </button>
          </>
        }
      />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 통계 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            label="누수 (회차 지남)"
            value={stats.overdue_count}
            highlight={stats.overdue_count > 0}
            color="rose"
            onClick={() => { setOverdueOnly(true); setCondFilter(ALL) }}
          />
          {(['HYPERTENSION', 'DIABETES', 'DYSLIPIDEMIA', 'OBESITY'] as ChronicCondition[]).map((c) => {
            const counts = stats.by_condition[c] || {}
            return (
              <StatCard
                key={c}
                label={`${conditionIcon[c]} ${stats.labels[c] || c}`}
                value={counts.ACTIVE || 0}
                color="slate"
                onClick={() => { setCondFilter(c); setOverdueOnly(false) }}
              />
            )
          })}
        </div>
      )}

      {/* 필터 */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <Chip active={condFilter === ALL} onClick={() => setCondFilter(ALL)}>전체</Chip>
        {(['HYPERTENSION', 'DIABETES', 'DYSLIPIDEMIA', 'OBESITY'] as ChronicCondition[]).map((c) => (
          <Chip key={c} active={condFilter === c} onClick={() => setCondFilter(c)}>
            {conditionIcon[c]} {stats?.labels?.[c] || c}
          </Chip>
        ))}
        <span className="ml-auto" />
        <Chip active={overdueOnly} onClick={() => setOverdueOnly(!overdueOnly)}>
          {overdueOnly ? '✓ ' : ''}누수만
        </Chip>
      </div>

      {/* 리스트 */}
      <div className="card divide-y divide-border">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">
            등록된 만관제 환자가 없습니다. 우상단 "환자 등록"을 눌러 시작하세요.
          </div>
        ) : (
          items.map((p) => (
            <ProgramRow
              key={p.id}
              p={p}
              onAddVisit={() => setVisitFor(p)}
            />
          ))
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['cc-list'] })
            qc.invalidateQueries({ queryKey: ['cc-stats'] })
            setShowCreate(false)
          }}
        />
      )}

      {visitFor && (
        <AddVisitModal
          program={visitFor}
          onClose={() => setVisitFor(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['cc-list'] })
            qc.invalidateQueries({ queryKey: ['cc-stats'] })
            setVisitFor(null)
          }}
        />
      )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, highlight, color = 'slate', onClick,
}: { label: string; value: number; highlight?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card p-4 text-left transition-shadow hover:shadow ${
        highlight ? 'ring-2 ring-rose-300' : ''
      }`}
    >
      <div className={`text-xs ${color === 'rose' ? 'text-rose-600' : 'text-slate-500'}`}>{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </button>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function ProgramRow({ p, onAddVisit }: { p: ChronicProgram; onAddVisit: () => void }) {
  const next = p.next_visit_at ? new Date(p.next_visit_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'
  return (
    <div className={`p-4 flex items-start gap-4 ${p.is_overdue ? 'bg-rose-50/40' : ''}`}>
      <div className="text-2xl">{conditionIcon[p.condition]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{p.patient_name || '환자'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
            {p.condition_label}
          </span>
          {p.is_overdue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-medium inline-flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> {p.days_overdue}일 누수
            </span>
          )}
          <span className="text-[10px] text-slate-500">총 {p.total_visits}회 · 교육 {p.total_education_count}회</span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-1">
          {p.patient_phone && <span><Phone className="w-3 h-3 inline" /> {p.patient_phone}</span>}
          <span>다음 회차: <b className="text-slate-700">{next}</b> ({p.interval_days}일 간격)</span>
          {p.target_systolic && <span>목표 BP: ≤ {p.target_systolic}/{p.target_diastolic ?? '-'}</span>}
          {p.target_hba1c && <span>목표 HbA1c: ≤ {p.target_hba1c}%</span>}
          {p.target_ldl && <span>목표 LDL: ≤ {p.target_ldl}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button onClick={onAddVisit} className="btn-primary text-xs px-3 py-1.5">
          <CalendarPlus className="w-3 h-3" /> 회차 +
        </button>
        {p.is_overdue && p.patient_phone && (
          <a
            href={`sms:${p.patient_phone}?body=${encodeURIComponent(
              `[${p.condition_label}] 다음 진료 시기가 지났어요. 편하실 때 방문 부탁드립니다.`
            )}`}
            className="btn-ghost text-xs"
          >
            <MessageSquareText className="w-3 h-3" /> SMS
          </a>
        )}
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [patientId, setPatientId] = useState('')
  const [condition, setCondition] = useState<ChronicCondition>('HYPERTENSION')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const targets = conditionDefaults[condition]

  const submit = async () => {
    if (!patientId.trim()) {
      toast.error('환자 ID를 입력하세요 (UUID).')
      return
    }
    setSubmitting(true)
    try {
      await chronicCareService.create({
        patient_id: patientId.trim(),
        condition,
        target_systolic: targets.targets.systolic,
        target_diastolic: targets.targets.diastolic,
        target_hba1c: targets.targets.hba1c,
        target_fbs: targets.targets.fbs,
        target_ldl: targets.targets.ldl,
        interval_days: targets.intervalDays,
        memo: memo || undefined,
      })
      toast.success('만관제 환자 등록 완료')
      onCreated()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '등록 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">만관제 환자 등록</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-xs text-slate-600">환자 ID (UUID)</label>
          <input
            className="input mt-1 font-mono text-xs"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="환자관리에서 복사"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">/emr/patients 에서 환자 ID를 복사해 붙여넣으세요.</p>
        </div>
        <div>
          <label className="text-xs text-slate-600">조건</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['HYPERTENSION', 'DIABETES', 'DYSLIPIDEMIA', 'OBESITY'] as ChronicCondition[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                className={`p-3 rounded-lg border text-left text-sm ${
                  condition === c
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="text-xl">{conditionIcon[c]}</div>
                <div className="font-medium mt-0.5">{
                  c === 'HYPERTENSION' ? '고혈압' :
                  c === 'DIABETES' ? '당뇨' :
                  c === 'DYSLIPIDEMIA' ? '이상지질혈증' : '비만'
                }</div>
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
          기본 회차 간격: <b>{targets.intervalDays}일</b>
          {Object.entries(targets.targets).length > 0 && (
            <span> · 기본 목표값 자동 설정</span>
          )}
        </div>
        <div>
          <label className="text-xs text-slate-600">메모 (선택)</label>
          <textarea
            className="input mt-1 min-h-[60px]"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">취소</button>
          <button onClick={submit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            등록
          </button>
        </div>
      </div>
    </div>
  )
}

function AddVisitModal({
  program, onClose, onSaved,
}: { program: ChronicProgram; onClose: () => void; onSaved: () => void }) {
  const [systolic, setSystolic] = useState<number | ''>('')
  const [diastolic, setDiastolic] = useState<number | ''>('')
  const [fbs, setFbs] = useState<number | ''>('')
  const [hba1c, setHba1c] = useState<number | ''>('')
  const [ldl, setLdl] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [educationTopic, setEducationTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [kind, setKind] = useState<'VISIT' | 'EDUCATION' | 'PHONE'>('VISIT')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await chronicCareService.addVisit(program.id, {
        kind,
        systolic: systolic === '' ? undefined : Number(systolic),
        diastolic: diastolic === '' ? undefined : Number(diastolic),
        fbs: fbs === '' ? undefined : Number(fbs),
        hba1c: hba1c === '' ? undefined : Number(hba1c),
        ldl: ldl === '' ? undefined : Number(ldl),
        weight: weight === '' ? undefined : Number(weight),
        education_topic: educationTopic || undefined,
        notes: notes || undefined,
      })
      toast.success('회차 기록 완료. 다음 회차가 자동으로 잡혔어요.')
      onSaved()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '저장 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldsForCondition: Record<string, string[]> = {
    HYPERTENSION: ['systolic', 'diastolic'],
    DIABETES: ['fbs', 'hba1c'],
    DYSLIPIDEMIA: ['ldl'],
    OBESITY: ['weight'],
    OTHER: [],
  }
  const visibleFields: string[] = fieldsForCondition[program.condition] || []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {conditionIcon[program.condition]} {program.patient_name} — 회차 추가
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['VISIT', 'EDUCATION', 'PHONE'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`py-2 rounded-lg border text-sm font-medium ${
                kind === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {k === 'VISIT' ? '내원' : k === 'EDUCATION' ? '교육' : '전화'}
            </button>
          ))}
        </div>

        {visibleFields.includes('systolic') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600">수축기 BP</label>
              <input type="number" className="input mt-1" value={systolic} onChange={(e) => setSystolic(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">이완기 BP</label>
              <input type="number" className="input mt-1" value={diastolic} onChange={(e) => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        )}
        {visibleFields.includes('fbs') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600">FBS (공복혈당)</label>
              <input type="number" className="input mt-1" value={fbs} onChange={(e) => setFbs(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-slate-600">HbA1c (%)</label>
              <input type="number" step="0.1" className="input mt-1" value={hba1c} onChange={(e) => setHba1c(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        )}
        {visibleFields.includes('ldl') && (
          <div>
            <label className="text-xs text-slate-600">LDL</label>
            <input type="number" className="input mt-1" value={ldl} onChange={(e) => setLdl(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        )}
        {visibleFields.includes('weight') && (
          <div>
            <label className="text-xs text-slate-600">체중 (kg)</label>
            <input type="number" step="0.1" className="input mt-1" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
        )}

        {kind === 'EDUCATION' && (
          <div>
            <label className="text-xs text-slate-600">교육 주제</label>
            <input className="input mt-1" placeholder="예: 저염 식단" value={educationTopic} onChange={(e) => setEducationTopic(e.target.value)} />
          </div>
        )}

        <div>
          <label className="text-xs text-slate-600">메모</label>
          <textarea className="input mt-1 min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">취소</button>
          <button onClick={submit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

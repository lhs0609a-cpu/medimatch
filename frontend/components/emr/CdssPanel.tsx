'use client'

/**
 * CdssPanel — 사전심사 9종 점검 사이드패널
 *
 * 진단·시술·처방·환자정보를 props로 받아 디바운스 자동 호출.
 * 우측 sticky 사이드바로 사용 (chart/edit, prescriptions/new 등).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ShieldCheck, AlertTriangle, AlertOctagon, Info,
  CheckCircle2, Receipt, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import {
  cdssService,
  CdssDiagnosisIn, CdssDrugIn, CdssProcedureIn, CdssPatientIn,
  CdssPreScreenResponse, CdssIssue,
  gradeColor, severityClass, severityLabel,
} from '@/lib/api/cdss'

interface Props {
  patient?: CdssPatientIn
  diagnoses?: CdssDiagnosisIn[]
  procedures?: CdssProcedureIn[]
  drugs?: CdssDrugIn[]
  visitType?: string
  /** 디바운스 ms (default 600) */
  debounceMs?: number
  /** 사용자가 디버그용으로 강제 트리거 */
  triggerKey?: number
  className?: string
  /** 점수가 변할 때마다 부모로 보고 (예: 헤더 배지) */
  onScore?: (r: CdssPreScreenResponse) => void
}

export default function CdssPanel({
  patient,
  diagnoses = [],
  procedures = [],
  drugs = [],
  visitType = 'INITIAL',
  debounceMs = 600,
  triggerKey = 0,
  className = '',
  onScore,
}: Props) {
  const [data, setData] = useState<CdssPreScreenResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({})
  const seqRef = useRef(0)

  // 입력값 시그니처 — 같은 입력은 다시 호출 안 함
  const sig = useMemo(() => JSON.stringify({
    p: patient,
    d: diagnoses.filter(d => d.code).map(d => ({ c: d.code, n: d.name, pri: d.is_primary })),
    pr: procedures.filter(p => p.name).map(p => ({ c: p.code, n: p.name, q: p.quantity, u: p.unit_price, cat: p.category })),
    rx: drugs.filter(x => x.drug_name).map(x => ({
      n: x.drug_name, i: x.ingredient,
      dpt: x.dose_per_time, fpd: x.frequency_per_day, dd: x.duration_days,
    })),
    vt: visitType,
    t: triggerKey,
  }), [patient, diagnoses, procedures, drugs, visitType, triggerKey])

  useEffect(() => {
    const hasContent =
      (diagnoses && diagnoses.some(d => d.code)) ||
      (procedures && procedures.some(p => p.name)) ||
      (drugs && drugs.some(d => d.drug_name))
    if (!hasContent) {
      setData(null)
      return
    }
    const mySeq = ++seqRef.current
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const r = await cdssService.preScreen({
          patient,
          diagnoses: diagnoses.filter(d => d.code),
          procedures: procedures.filter(p => p.name),
          drugs: drugs.filter(d => d.drug_name),
          visit_type: visitType,
        })
        if (mySeq !== seqRef.current) return
        setData(r)
        onScore?.(r)
      } catch (e: any) {
        if (mySeq !== seqRef.current) return
        setError(e.response?.data?.detail || '점검 호출 실패')
      } finally {
        if (mySeq === seqRef.current) setLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  if (!data && !loading && !error) {
    return (
      <aside className={`card p-5 space-y-3 ${className}`}>
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-semibold">사전심사 (CDSS)</h3>
        </div>
        <p className="text-xs text-slate-500">
          진단·시술·처방을 입력하면 9종 점검 결과와 예상 청구액을 자동으로 보여줍니다.
        </p>
      </aside>
    )
  }

  if (error) {
    return (
      <aside className={`card p-5 ${className}`}>
        <div className="flex items-center gap-2 text-rose-600">
          <AlertOctagon className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className={`card p-5 space-y-4 ${className}`}>
      {/* 헤더: 점수 + 등급 + 로딩 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold">사전심사 (CDSS)</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        {data && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${gradeColor(data.grade)}`}>
            {data.grade}
          </span>
        )}
      </div>

      {data && (
        <>
          {/* 점수 + 패스 카운트 */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold tabular-nums">{data.score}</div>
              <div className="text-[11px] text-slate-500">삭감예방 점수 / 100</div>
            </div>
            <div className="text-right text-xs">
              <div className="text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3 inline" /> {data.passed.length}/9 통과
              </div>
              {data.cross_checked_meds > 0 && (
                <div className="text-slate-500 mt-0.5">
                  기존 복용약 {data.cross_checked_meds}건 cross-check
                </div>
              )}
            </div>
          </div>

          {/* 예상 청구액 */}
          <div className="rounded-lg bg-slate-50 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Receipt className="w-3.5 h-3.5" /> 예상 청구액
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums">
                {data.estimate.subtotal.toLocaleString()}<span className="text-sm text-slate-500">원</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div>공단부담</div>
              <div className="text-right tabular-nums">{data.estimate.insurance_amount.toLocaleString()}원</div>
              <div>본인부담</div>
              <div className="text-right tabular-nums font-medium">{data.estimate.patient_amount.toLocaleString()}원</div>
              {data.estimate.consultation_fee > 0 && (
                <>
                  <div className="text-slate-400">진찰료</div>
                  <div className="text-right tabular-nums text-slate-400">{data.estimate.consultation_fee.toLocaleString()}원</div>
                </>
              )}
              {data.estimate.procedure_total > 0 && (
                <>
                  <div className="text-slate-400">시술·검사</div>
                  <div className="text-right tabular-nums text-slate-400">{data.estimate.procedure_total.toLocaleString()}원</div>
                </>
              )}
              {data.estimate.prescription_fee > 0 && (
                <>
                  <div className="text-slate-400">처방료</div>
                  <div className="text-right tabular-nums text-slate-400">{data.estimate.prescription_fee.toLocaleString()}원</div>
                </>
              )}
            </div>
          </div>

          {/* 이슈 요약 배지 */}
          {(data.summary.HIGH + data.summary.MEDIUM + data.summary.LOW > 0) ? (
            <div className="flex gap-2 text-xs">
              {data.summary.HIGH > 0 && (
                <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 font-medium">
                  위험 {data.summary.HIGH}
                </span>
              )}
              {data.summary.MEDIUM > 0 && (
                <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                  주의 {data.summary.MEDIUM}
                </span>
              )}
              {data.summary.LOW > 0 && (
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
                  참고 {data.summary.LOW}
                </span>
              )}
              {data.blocking_count > 0 && (
                <span className="px-2 py-1 rounded bg-rose-600 text-white font-medium">
                  ⛔ 청구 차단 {data.blocking_count}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" />
              모든 점검 통과 — 안전하게 청구 가능합니다.
            </div>
          )}

          {/* 이슈 리스트 */}
          {data.issues.length > 0 && (
            <ul className="space-y-2">
              {data.issues.map((it, i) => (
                <IssueRow
                  key={i}
                  issue={it}
                  open={!!openHints[i]}
                  onToggle={() => setOpenHints({ ...openHints, [i]: !openHints[i] })}
                />
              ))}
            </ul>
          )}

          {/* 통과한 카테고리 */}
          {data.passed.length > 0 && (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-700">
                통과한 점검 보기 ({data.passed.length})
              </summary>
              <div className="flex flex-wrap gap-1 pt-2">
                {data.passed.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    ✓ {labelOf(c)}
                  </span>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </aside>
  )
}

function IssueRow({ issue, open, onToggle }: { issue: CdssIssue; open: boolean; onToggle: () => void }) {
  const Icon = issue.severity === 'HIGH' ? AlertOctagon
    : issue.severity === 'MEDIUM' ? AlertTriangle
    : Info
  return (
    <li className={`rounded-lg border p-2.5 text-sm ${severityClass(issue.severity)}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {issue.category_label} · {severityLabel(issue.severity)}
            </span>
            {issue.blocking && (
              <span className="text-[10px] px-1 rounded bg-rose-600 text-white font-bold">청구차단</span>
            )}
          </div>
          <div className="font-medium leading-snug">{issue.title}</div>
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{issue.message}</p>
          {issue.fix_hint && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 text-[11px] font-medium opacity-80 hover:opacity-100 inline-flex items-center gap-1"
            >
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              해결 방법
            </button>
          )}
          {open && issue.fix_hint && (
            <p className="mt-1 text-xs bg-white/60 rounded px-2 py-1.5 leading-relaxed">
              💡 {issue.fix_hint}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

function labelOf(c: string): string {
  const map: Record<string, string> = {
    DIAG_REQUIRED: '인정상병',
    DRUG_INTERACTION: '병용금기',
    DRUG_DUPLICATE: '중복투약',
    DOSAGE: '투여량',
    FEE_MISSING: '수가누락',
    PHYS_THERAPY: '물리치료',
    SEX_AGE: '성별·연령',
    SPEC_NOTE: '특정내역',
    PEDI_DOSE: '소아용량',
  }
  return map[c] || c
}

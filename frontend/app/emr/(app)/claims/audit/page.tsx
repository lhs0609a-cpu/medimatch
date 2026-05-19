'use client'

/**
 * 잃어버린 돈 찾기 — 기존 EMR 청구 임포트 + 누락 검출 대시보드.
 *
 * 빈 상태: "기존 EMR 청구 가져오면 놓친 돈을 찾아드립니다"
 * 데이터 있음: "지난 N개월 놓친 돈 ₩XXX,XXX" + findings 리스트.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Upload, FileSpreadsheet, Loader2, ShieldAlert, AlertTriangle,
  CheckCircle2, Sparkles, TrendingUp, ArrowRight, Info, X, RotateCcw,
  DollarSign, Search, Calendar, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import ModuleHeader from '@/components/emr/ModuleHeader'

interface Finding {
  claim_id: string
  rule: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  detail: string
  potential_amount: number
  confidence: number
  suggested_action: string
  suggested_code: string | null
  patient_chart_no: string | null
  service_date: string | null
  claim_number?: string
  patient_name_masked?: string
  primary_dx_code?: string
  claim_total?: number
}

interface RuleAgg {
  count: number
  potential: number
  title: string
}

interface FindingsResponse {
  total_findings: number
  total_potential: number
  high_confidence_potential: number
  by_rule: Record<string, RuleAgg>
  findings: Finding[]
}

interface ScanResponse {
  total_claims: number
  findings_count: number
  high_confidence_count: number
  total_potential: number
  high_confidence_potential: number
  by_rule: Record<string, RuleAgg>
  scanned_at: string
  message: string
}

interface ImportResponse {
  batch_id: string
  imported_count: number
  skipped_duplicate: number
  skipped_invalid: number
  total_rows: number
  total_groups: number
  message: string
}

const SEVERITY_COLOR: Record<string, string> = {
  HIGH: 'bg-rose-100 text-rose-700 border-rose-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-blue-100 text-blue-700 border-blue-200',
}

const CONFIDENCE_LABEL = (c: number) =>
  c >= 80 ? '높음' : c >= 60 ? '보통' : '낮음'

const formatKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`

export default function ClaimAuditPage() {
  const [loading, setLoading] = useState(true)
  const [findings, setFindings] = useState<FindingsResponse | null>(null)
  const [importing, setImporting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [sourceEmr, setSourceEmr] = useState('manual_csv')
  const [minConfidence, setMinConfidence] = useState(0)
  const [ruleFilter, setRuleFilter] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get<FindingsResponse>('/claims/audit/findings', {
        params: { min_confidence: minConfidence, ...(ruleFilter ? { rule: ruleFilter } : {}) },
      })
      setFindings(r.data)
    } catch (e: any) {
      setFindings(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [minConfidence, ruleFilter])

  const hasData = (findings?.total_findings ?? 0) > 0

  const handleFile = (f: File | null) => {
    if (!f) return
    if (f.size > 30 * 1024 * 1024) {
      toast.error('파일이 너무 큽니다 (최대 30MB)')
      return
    }
    setFile(f)
  }

  const runImportAndScan = async () => {
    if (!file) {
      toast.error('파일을 선택하세요')
      return
    }
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('source_emr', sourceEmr)
      fd.append('skip_duplicates', 'true')
      const impRes = await apiClient.post<ImportResponse>('/claims/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(impRes.data.message)

      setImporting(false)
      setScanning(true)

      const sfd = new FormData()
      sfd.append('batch_id', impRes.data.batch_id)
      const scanRes = await apiClient.post<ScanResponse>('/claims/audit/scan', sfd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(scanRes.data.message)
      setFile(null)
      await refresh()
    } catch (e: any) {
      toast.error('처리 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setImporting(false)
      setScanning(false)
    }
  }

  const rescanAll = async () => {
    setScanning(true)
    try {
      const fd = new FormData()
      fd.append('months', '12')
      const r = await apiClient.post<ScanResponse>('/claims/audit/scan', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(r.data.message)
      await refresh()
    } catch (e: any) {
      toast.error('스캔 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div>
      <ModuleHeader
        moduleKey="claims"
        title="잃어버린 돈 찾기"
        subtitle="기존 EMR 청구내역을 분석해 누락된 진찰료·처치료·저청구를 자동 검출합니다"
        breadcrumbs={[{ label: '청구', href: '/emr/claims' }, { label: '누락 검출' }]}
        actions={
          hasData && (
            <button
              onClick={rescanAll}
              disabled={scanning}
              className="btn-secondary text-sm"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              지난 12개월 다시 스캔
            </button>
          )
        }
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : !hasData ? (
          <EmptyStateUpload
            file={file}
            sourceEmr={sourceEmr}
            setSourceEmr={setSourceEmr}
            importing={importing}
            scanning={scanning}
            onFile={handleFile}
            onRun={runImportAndScan}
            inputRef={fileInputRef}
          />
        ) : (
          <ResultDashboard
            data={findings!}
            minConfidence={minConfidence}
            setMinConfidence={setMinConfidence}
            ruleFilter={ruleFilter}
            setRuleFilter={setRuleFilter}
          />
        )}
      </div>
    </div>
  )
}


function EmptyStateUpload({
  file, sourceEmr, setSourceEmr, importing, scanning, onFile, onRun, inputRef,
}: {
  file: File | null
  sourceEmr: string
  setSourceEmr: (s: string) => void
  importing: boolean
  scanning: boolean
  onFile: (f: File | null) => void
  onRun: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="space-y-6">
      {/* 히어로 */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" /> 베타 진료과: 내과
        </div>
        <h1 className="text-3xl font-bold mb-3">
          지난 6개월,<br />
          <span className="text-rose-600">놓치고 있던 청구액</span>을 찾아드립니다
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          기존 EMR(의사랑·닥터팔레트·굿닥 등)의 청구내역 파일만 올리면, <br />
          누락된 진찰료·처치료·저청구 의심 건을 자동으로 찾아냅니다.
        </p>
      </div>

      {/* 업로드 */}
      <div className="card p-6">
        <label
          className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files?.[0] || null)
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div>
              <FileSpreadsheet className="w-10 h-10 mx-auto text-green-600 mb-2" />
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFile(null) }}
                className="text-xs text-rose-600 mt-2 underline"
              >다른 파일 선택</button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">청구내역 파일을 끌어다 놓거나 클릭해서 선택</p>
              <p className="text-xs text-muted-foreground mt-1">
                .csv .xlsx .xls .txt(EDI) · 최대 30MB · 한 번에 최대 1만건
              </p>
            </>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">출처 EMR</label>
            <select
              className="input"
              value={sourceEmr}
              onChange={(e) => setSourceEmr(e.target.value)}
            >
              <option value="manual_csv">직접 업로드 (manual_csv)</option>
              <option value="usarang">의사랑</option>
              <option value="docpalette">닥터팔레트</option>
              <option value="bit">비트</option>
              <option value="goodoc">굿닥</option>
              <option value="smartdoctor">SmartDoctor</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onRun}
            disabled={!file || importing || scanning}
            className="btn-primary"
          >
            {importing && <><Loader2 className="w-4 h-4 animate-spin" /> 임포트 중...</>}
            {scanning && <><Loader2 className="w-4 h-4 animate-spin" /> 누락 스캔 중...</>}
            {!importing && !scanning && <><ArrowRight className="w-4 h-4" /> 임포트 + 즉시 분석</>}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Receipt, title: '진찰료 누락', detail: '재방문에 진찰료 청구가 빠진 건을 자동 검출' },
          { icon: AlertTriangle, title: '저청구 의심', detail: '상병별 표준 대비 30% 이상 낮은 청구 찾기' },
          { icon: TrendingUp, title: '회수 추정액', detail: '항목별 회수 가능 금액 합계 자동 계산' },
        ].map((c, i) => (
          <div key={i} className="card p-4">
            <c.icon className="w-5 h-5 text-blue-600 mb-2" />
            <p className="font-semibold text-sm">{c.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.detail}</p>
          </div>
        ))}
      </div>

      {/* 면책 */}
      <div className="card p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            검출된 누락은 <strong>의심</strong>이지 확정이 아닙니다. 실제 정정청구 전 의사·청구 담당자가 확인해야 합니다.
            특히 신뢰도 60% 미만 항목은 환자 상태에 따라 정상일 수 있으므로 신중히 검토하세요.
          </p>
        </div>
      </div>
    </div>
  )
}


function ResultDashboard({
  data, minConfidence, setMinConfidence, ruleFilter, setRuleFilter,
}: {
  data: FindingsResponse
  minConfidence: number
  setMinConfidence: (n: number) => void
  ruleFilter: string | null
  setRuleFilter: (r: string | null) => void
}) {
  return (
    <div className="space-y-6">
      {/* 히어로 숫자 */}
      <div className="card p-8 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border-rose-200">
        <p className="text-sm text-muted-foreground mb-2">지난 12개월 누락 검출</p>
        <p className="text-5xl font-bold text-rose-600">
          {formatKRW(data.total_potential)}
        </p>
        <p className="text-sm mt-2">
          전체 {data.total_findings}건 · 그중 확실한 누락(신뢰도 80+) {' '}
          <span className="font-semibold text-rose-700">{formatKRW(data.high_confidence_potential)}</span>
        </p>
      </div>

      {/* 룰별 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(data.by_rule).map(([rule, agg]) => {
          const active = ruleFilter === rule
          return (
            <button
              key={rule}
              onClick={() => setRuleFilter(active ? null : rule)}
              className={`card p-4 text-left transition ${active ? 'ring-2 ring-blue-500' : 'hover:bg-muted/30'}`}
            >
              <p className="text-xs text-muted-foreground">{agg.title}</p>
              <p className="text-xl font-semibold mt-1">{agg.count}건</p>
              <p className="text-xs text-rose-600 font-medium mt-1">{formatKRW(agg.potential)}</p>
            </button>
          )
        })}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">신뢰도 필터:</span>
        {[
          { label: '전체', v: 0 },
          { label: '보통 이상 (60+)', v: 60 },
          { label: '확실한 누락 (80+)', v: 80 },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => setMinConfidence(opt.v)}
            className={`px-3 py-1 rounded-full text-xs ${
              minConfidence === opt.v ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >{opt.label}</button>
        ))}
        {ruleFilter && (
          <button
            onClick={() => setRuleFilter(null)}
            className="text-xs text-muted-foreground underline ml-2"
          >룰 필터 해제</button>
        )}
      </div>

      {/* findings 리스트 */}
      <div className="space-y-3">
        {data.findings.length === 0 ? (
          <div className="card p-12 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <p>해당 조건의 검출 결과가 없습니다.</p>
          </div>
        ) : (
          data.findings.map((f, i) => (
            <FindingCard key={`${f.claim_id}-${i}`} f={f} />
          ))
        )}
      </div>

      <div className="card p-3 text-xs text-muted-foreground text-center">
        💡 정정청구는 의료법상 진료일로부터 <strong>5년 이내</strong> 가능합니다.
        검출된 항목 중 의사 확인이 끝난 건은 <Link href="/emr/tax-correction" className="text-blue-600 underline">경정청구 모듈</Link>에서 일괄 진행하세요.
      </div>
    </div>
  )
}


function FindingCard({ f }: { f: Finding }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_COLOR[f.severity]}`}>
              {f.severity}
            </span>
            <span className="text-xs text-muted-foreground">
              신뢰도 {CONFIDENCE_LABEL(f.confidence)} ({f.confidence}%)
            </span>
            <span className="text-xs text-muted-foreground">
              · {f.patient_chart_no || '—'} · {f.service_date || '—'} · {f.primary_dx_code || '—'}
            </span>
          </div>
          <p className="font-semibold mb-1">{f.title}</p>
          <p className="text-sm text-muted-foreground">{f.detail}</p>
          <div className="mt-3 text-sm bg-muted/40 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">제안 행동</p>
            <p>{f.suggested_action}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground">회수 추정</p>
          <p className="text-xl font-bold text-rose-600">
            {f.potential_amount > 0 ? formatKRW(f.potential_amount) : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

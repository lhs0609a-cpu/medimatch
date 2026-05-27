'use client'

/**
 * 환자 데이터 임포트 — 3-step 마법사.
 *
 * 1) 파일 업로드 (CSV/엑셀, 어떤 EMR이든)
 * 2) 자동 매핑 결과 확인 + 사용자 수정
 * 3) 커밋 결과 리포트 (배치 단위 롤백 가능)
 */

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Upload, ArrowLeft, ArrowRight, FileSpreadsheet, CheckCircle2, AlertTriangle,
  Loader2, Download, RotateCcw, ShieldAlert, Info, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import ModuleHeader from '@/components/emr/ModuleHeader'

type Step = 'upload' | 'mapping' | 'result'

interface PreviewResp {
  filename: string
  encoding?: string
  sheet?: string
  warnings: string[]
  total_rows: number
  preview_rows: Array<{
    fields: Record<string, any>
    external_meta_keys: string[]
    issues: string[]
    valid: boolean
  }>
  mapping: Record<string, string>          // 원본 헤더 → canonical
  confidence: Record<string, number>
  unmapped_headers: string[]
  detected_emr: string
  notes: string[]
  valid_count_in_preview: number
}

interface ImportResp {
  batch_id: string
  imported_count: number
  skipped_invalid: number
  skipped_duplicate: number
  total_in_file: number
  source_emr: string
  mapping: Record<string, string>
  unmapped_headers: string[]
  issues: Array<{ row: number; kind: string; detail?: any; external_id?: string }>
  warnings: string[]
  notes: string[]
  message: string
}

const CANONICAL_FIELDS: Array<{ value: string; label: string; required?: boolean }> = [
  { value: '', label: '— 매핑 안 함 (external_meta로 보존) —' },
  { value: 'external_id', label: '차트번호/환자코드 (external_id)', required: true },
  { value: 'name', label: '이름 (name)', required: true },
  { value: 'phone', label: '전화번호 (phone)' },
  { value: 'gender', label: '성별 (gender)' },
  { value: 'birth_date', label: '생년월일 (birth_date)' },
  { value: 'region', label: '지역 (region)' },
  { value: 'inflow_date', label: '유입일 (inflow_date)' },
  { value: 'inflow_path', label: '유입경로 (inflow_path)' },
  { value: 'search_keywords', label: '검색키워드 (search_keywords)' },
  { value: 'symptoms', label: '증상 (symptoms)' },
  { value: 'diagnosis_name', label: '진단명 (diagnosis_name)' },
  { value: 'consultation_summary', label: '상담요약 (consultation_summary)' },
  { value: 'appointment_date', label: '예약일시 (appointment_date)' },
  { value: 'appointment_path', label: '예약경로 (appointment_path)' },
  { value: 'inbound_status', label: '내원상태 (inbound_status)' },
  { value: 'cancellation_reason', label: '취소사유 (cancellation_reason)' },
  { value: 'manager_name', label: '담당실장 (manager_name)' },
  { value: 'consent_examination', label: '검사동의 (consent_examination)' },
  { value: 'consent_treatment', label: '치료동의 (consent_treatment)' },
  { value: 'db_quality', label: 'DB등급 (db_quality)' },
  { value: 'staff_assessment', label: '실무자판단 (staff_assessment)' },
  { value: 'seq_no', label: '순번 (seq_no)' },
]

const FIELD_KO_LABEL: Record<string, string> = Object.fromEntries(
  CANONICAL_FIELDS.filter((f) => f.value).map((f) => [f.value, f.label.split(' (')[0]]),
)

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [sourceEmr, setSourceEmr] = useState('manual_csv')
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [preview, setPreview] = useState<PreviewResp | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({}) // 사용자 override 매핑
  const [importing, setImporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [result, setResult] = useState<ImportResp | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalHeaders = useMemo(
    () => preview ? Object.keys(preview.mapping).length + preview.unmapped_headers.length : 0,
    [preview],
  )
  const mappedCount = useMemo(
    () => Object.values(mapping).filter((v) => v).length,
    [mapping],
  )

  const onSelectFile = (f: File | null) => {
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      toast.error('파일이 너무 큽니다 (최대 20MB)')
      return
    }
    setFile(f)
  }

  const runPreview = async () => {
    if (!file) {
      toast.error('파일을 선택하세요')
      return
    }
    setPreviewing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await apiClient.post<PreviewResp>('/emr/patients/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview(r.data)
      // 자동 매핑 결과를 사용자 매핑 기본값으로
      const initial: Record<string, string> = {}
      Object.entries(r.data.mapping).forEach(([h, f]) => { initial[h] = f })
      r.data.unmapped_headers.forEach((h) => { initial[h] = '' })
      setMapping(initial)
      setStep('mapping')
      if (r.data.warnings.length) {
        r.data.warnings.forEach((w) => toast.warning(w))
      }
    } catch (e: any) {
      toast.error('미리보기 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setPreviewing(false)
    }
  }

  const runImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('source_emr', sourceEmr || 'manual_csv')
      fd.append('skip_duplicates', String(skipDuplicates))
      // 빈 매핑은 보내지 않음 (auto 그대로)
      const cleaned: Record<string, string> = {}
      Object.entries(mapping).forEach(([h, f]) => { if (f) cleaned[h] = f })
      fd.append('manual_mapping', JSON.stringify(cleaned))
      const r = await apiClient.post<ImportResp>('/emr/patients/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(r.data)
      setStep('result')
      toast.success(r.data.message)
    } catch (e: any) {
      toast.error('임포트 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setImporting(false)
    }
  }

  const rollback = async () => {
    if (!result) return
    if (!confirm('이번 배치로 임포트된 환자를 모두 삭제(soft delete)합니다. 계속하시겠습니까?')) return
    try {
      const r = await apiClient.post(`/emr/patients/import/rollback/${result.batch_id}`)
      toast.success(`${r.data.rolled_back}건 롤백 완료`)
      setResult(null)
      setPreview(null)
      setFile(null)
      setMapping({})
      setStep('upload')
    } catch (e: any) {
      toast.error('롤백 실패: ' + (e.response?.data?.detail || e.message))
    }
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setMapping({})
    setResult(null)
  }

  const downloadTemplate = async () => {
    try {
      const r = await apiClient.get('/emr/patients/import/template.xlsx', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'medimatch_patients_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error('템플릿 다운로드 실패')
    }
  }

  return (
    <div>
      <ModuleHeader
        moduleKey="patients"
        title="환자 데이터 일괄 임포트"
        subtitle="기존 EMR/CRM의 CSV·엑셀을 그대로 올리면 자동으로 매핑됩니다"
        breadcrumbs={[{ label: '환자', href: '/emr/patients' }, { label: '임포트' }]}
        actions={
          <button onClick={downloadTemplate} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> 표준 템플릿
          </button>
        }
      />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* 진행 표시 */}
        <div className="flex items-center gap-2 text-sm">
          {(['upload', 'mapping', 'result'] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === s ? 'bg-blue-600 text-white' :
                ['upload', 'mapping', 'result'].indexOf(step) > idx ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>{idx + 1}</div>
              <span className={step === s ? 'font-semibold' : 'text-muted-foreground'}>
                {s === 'upload' ? '업로드' : s === 'mapping' ? '매핑 확인' : '결과'}
              </span>
              {idx < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">어떤 EMR/CRM에서 export한 파일이든 호환됩니다.</p>
                  <p className="text-muted-foreground">
                    의사랑·닥터팔레트·비트·두번째뇌·굿닥·SmartDoctor·Afterdoc 등의 CSV/엑셀을
                    그대로 올려주세요. 컬럼명은 시스템이 자동으로 인식합니다.
                  </p>
                </div>
              </div>

              <label
                className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  onSelectFile(e.dataTransfer.files?.[0] || null)
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm"
                  onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div>
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-green-600 mb-2" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null) }}
                      className="text-xs text-rose-600 mt-2 underline"
                    >다른 파일 선택</button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">파일을 끌어다 놓거나 클릭해서 선택</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      .csv .tsv .xlsx .xls (최대 20MB · 한 번에 최대 2,000명)
                    </p>
                  </>
                )}
              </label>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">출처 EMR (재동기화 키)</label>
                  <select
                    className="input"
                    value={sourceEmr}
                    onChange={(e) => setSourceEmr(e.target.value)}
                  >
                    <option value="manual_csv">직접 업로드 (manual_csv)</option>
                    <option value="usarang">의사랑</option>
                    <option value="docpalette">닥터팔레트</option>
                    <option value="bit">비트</option>
                    <option value="second_brain">두번째뇌</option>
                    <option value="goodoc">굿닥</option>
                    <option value="smartdoctor">SmartDoctor</option>
                    <option value="afterdoc">Afterdoc</option>
                    <option value="vegas">Vegas</option>
                    <option value="uno">UnoCRM</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">중복 차트번호 처리</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />
                    <span className="text-sm">같은 출처에서 이미 임포트한 차트번호는 건너뜀</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card p-4 bg-rose-50 dark:bg-rose-950/20 border-rose-200">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-700 dark:text-rose-300">
                  <p className="font-medium mb-1">개인정보·정통망법 안내</p>
                  <p>
                    알림톡 수신 동의는 파일에 '동의'라고 적혀 있어도 모두 <strong>'미확인'</strong>으로 등록됩니다.
                    의료광고는 사람이 직접 받은 동의만 인정되므로, 임포트 후 환자 화면에서 출처 확인 후 일괄 수정해주세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/emr/patients" className="btn-secondary">
                <ArrowLeft className="w-4 h-4" /> 취소
              </Link>
              <button onClick={runPreview} disabled={!file || previewing} className="btn-primary">
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                미리보기 + 자동 매핑
              </button>
            </div>
          </div>
        )}

        {step === 'mapping' && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">총 행 수</p>
                <p className="text-xl font-semibold">{preview.total_rows.toLocaleString()}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">자동 매핑된 컬럼</p>
                <p className="text-xl font-semibold text-green-600">{Object.keys(preview.mapping).length} / {totalHeaders}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">미리보기 유효</p>
                <p className="text-xl font-semibold">{preview.valid_count_in_preview} / {preview.preview_rows.length}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">파일 정보</p>
                <p className="text-xs">{preview.encoding || preview.sheet || preview.filename}</p>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                컬럼 매핑 ({mappedCount}/{totalHeaders} 매핑됨)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                자동 추론 결과를 검토하고 필요하면 수정하세요. 매핑하지 않은 컬럼은 <code className="bg-muted px-1 rounded">external_meta</code>에 손실 없이 보존됩니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 px-2">원본 헤더</th>
                      <th className="py-2 px-2">신뢰도</th>
                      <th className="py-2 px-2">매핑할 필드</th>
                      <th className="py-2 px-2">샘플 값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(mapping).map((h) => {
                      const conf = preview.confidence[h] ?? 0
                      const sample = preview.preview_rows[0]?.fields[mapping[h]] ?? ''
                      return (
                        <tr key={h} className="border-b border-border/40">
                          <td className="py-2 px-2 font-mono text-xs">{h}</td>
                          <td className="py-2 px-2">
                            {conf > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                conf >= 90 ? 'bg-green-100 text-green-700' :
                                conf >= 75 ? 'bg-amber-100 text-amber-700' :
                                'bg-muted text-muted-foreground'
                              }`}>{conf}%</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <select
                              className="input text-xs"
                              value={mapping[h] || ''}
                              onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                            >
                              {CANONICAL_FIELDS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-xs text-muted-foreground truncate max-w-[200px]">
                            {String(sample ?? '')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {preview.notes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">자동 매핑 메모</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {preview.notes.map((n, i) => <li key={i}>· {n}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-semibold mb-3">미리보기 (처음 {preview.preview_rows.length}행)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-1.5 px-2">유효</th>
                      <th className="py-1.5 px-2">이름</th>
                      <th className="py-1.5 px-2">차트번호</th>
                      <th className="py-1.5 px-2">전화</th>
                      <th className="py-1.5 px-2">생년월일</th>
                      <th className="py-1.5 px-2">유입일</th>
                      <th className="py-1.5 px-2">진단</th>
                      <th className="py-1.5 px-2">미매핑 컬럼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, idx) => (
                      <tr key={idx} className="border-b border-border/40">
                        <td className="py-1.5 px-2">
                          {r.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <span title={r.issues.join(', ')}>
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">{r.fields.name || '—'}</td>
                        <td className="py-1.5 px-2 font-mono text-[10px]">{r.fields.external_id || '—'}</td>
                        <td className="py-1.5 px-2 font-mono text-[10px]">{r.fields.phone || '—'}</td>
                        <td className="py-1.5 px-2">{r.fields.birth_date || '—'}</td>
                        <td className="py-1.5 px-2">{r.fields.inflow_date || '—'}</td>
                        <td className="py-1.5 px-2 truncate max-w-[140px]">{r.fields.diagnosis_name || '—'}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">
                          {r.external_meta_keys.length > 0 ? `${r.external_meta_keys.length}개` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <button onClick={() => setStep('upload')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4" /> 이전
              </button>
              <button onClick={runImport} disabled={importing} className="btn-primary">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {preview.total_rows.toLocaleString()}명 임포트 실행
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="card p-6 bg-green-50 dark:bg-green-950/20 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                    임포트 완료
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">{result.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    배치 ID: <code className="font-mono">{result.batch_id}</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">전체 행</p>
                <p className="text-xl font-semibold">{result.total_in_file.toLocaleString()}</p>
              </div>
              <div className="card p-3 bg-green-50 dark:bg-green-950/20">
                <p className="text-xs text-muted-foreground">등록됨</p>
                <p className="text-xl font-semibold text-green-700">{result.imported_count.toLocaleString()}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">중복 건너뜀</p>
                <p className="text-xl font-semibold text-amber-600">{result.skipped_duplicate.toLocaleString()}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-muted-foreground">불완전 건너뜀</p>
                <p className="text-xl font-semibold text-rose-600">{result.skipped_invalid.toLocaleString()}</p>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  이슈 리포트 (최대 50건)
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-1.5 px-2">행</th>
                        <th className="py-1.5 px-2">종류</th>
                        <th className="py-1.5 px-2">상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.issues.map((iss, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-1.5 px-2 font-mono">{iss.row}</td>
                          <td className="py-1.5 px-2">
                            {iss.kind === 'invalid' && <span className="text-rose-600">불완전</span>}
                            {iss.kind === 'duplicate' && <span className="text-amber-600">중복</span>}
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">
                            {iss.kind === 'duplicate' ? `이미 등록된 차트번호: ${iss.external_id}` : (iss.detail || []).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <button onClick={rollback} className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50">
                <RotateCcw className="w-4 h-4" /> 이번 배치 전체 롤백
              </button>
              <div className="flex gap-2">
                <button onClick={reset} className="btn-secondary">
                  새 파일 임포트
                </button>
                <Link href="/emr/patients" className="btn-primary">
                  환자 목록으로 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

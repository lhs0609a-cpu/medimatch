'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Upload,
  FileText,
  Image,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Brain,
  Sparkles,
  X,
  ChevronDown,
  Loader2,
  Info,
  FolderOpen,
  Grid3X3,
  List,
  RefreshCw,
  ArrowLeft,
  Check,
  Tag,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 타입 ─── */
type DocStatus = 'uploading' | 'uploaded' | 'ocr_processing' | 'ocr_done' | 'classified' | 'verified'
type DocType = 'receipt' | 'certificate' | 'statement' | 'contract' | 'other'

interface TaxDocument {
  id: string
  file_name: string
  file_type: string
  file_size: number
  doc_type: DocType
  doc_type_label: string
  tax_year: number
  correction_id: string | null
  correction_number: string | null
  status: DocStatus
  ocr_result: string | null
  ai_classification: string | null
  uploaded_at: string
  thumbnail_url: string | null
}

interface CorrectionChecklist {
  correction_number: string
  correction_id: string
  tax_year: number
  documents: { name: string; required: boolean; uploaded: boolean }[]
}

/* ─── 설정 ─── */
const statusConfig: Record<DocStatus, { label: string; color: string; bg: string }> = {
  uploading: { label: '업로드중', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/20' },
  uploaded: { label: '업로드됨', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/20' },
  ocr_processing: { label: 'OCR 처리중', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  ocr_done: { label: 'OCR 완료', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  classified: { label: 'AI 분류됨', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  verified: { label: '검증완료', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
}

const docTypeConfig: Record<DocType, { label: string; icon: typeof FileText }> = {
  receipt: { label: '영수증', icon: FileText },
  certificate: { label: '증명서', icon: CheckCircle2 },
  statement: { label: '내역서', icon: List },
  contract: { label: '계약서', icon: FileText },
  other: { label: '기타', icon: FolderOpen },
}

/* ─── 데모 데이터 ─── */
const demoDocuments: TaxDocument[] = [
  { id: 'D01', file_name: 'IRP_납입확인서_2024.pdf', file_type: 'application/pdf', file_size: 245000, doc_type: 'certificate', doc_type_label: '퇴직연금 납입확인서', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'verified', ocr_result: 'IRP 납입금액: 5,000,000원, 기간: 2024.01-2024.12', ai_classification: '세액공제 증빙 - 퇴직연금', uploaded_at: '2025-03-10', thumbnail_url: null },
  { id: 'D02', file_name: '의료비_영수증_서울대병원.pdf', file_type: 'application/pdf', file_size: 380000, doc_type: 'receipt', doc_type_label: '의료비 영수증', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'verified', ocr_result: '총 의료비: 2,450,000원, 환자: 김OO', ai_classification: '의료비 세액공제 증빙', uploaded_at: '2025-03-10', thumbnail_url: null },
  { id: 'D03', file_name: '안경구입_영수증.jpg', file_type: 'image/jpeg', file_size: 520000, doc_type: 'receipt', doc_type_label: '안경구입 영수증', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'classified', ocr_result: '안경 구입비: 350,000원', ai_classification: '의료비 세액공제 - 안경구입비', uploaded_at: '2025-03-10', thumbnail_url: null },
  { id: 'D04', file_name: '교육비_납입증명서_서울대.pdf', file_type: 'application/pdf', file_size: 190000, doc_type: 'certificate', doc_type_label: '교육비 납입증명서', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'ocr_done', ocr_result: '등록금: 2,400,000원', ai_classification: null, uploaded_at: '2025-03-11', thumbnail_url: null },
  { id: 'D05', file_name: '기부금_영수증_종교단체.pdf', file_type: 'application/pdf', file_size: 145000, doc_type: 'receipt', doc_type_label: '기부금 영수증', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'verified', ocr_result: '기부금: 1,200,000원, 기부처: OO성당', ai_classification: '기부금 세액공제 - 지정기부금', uploaded_at: '2025-03-11', thumbnail_url: null },
  { id: 'D06', file_name: '카드사용내역_2024_국민카드.pdf', file_type: 'application/pdf', file_size: 890000, doc_type: 'statement', doc_type_label: '카드 사용내역서', tax_year: 2024, correction_id: '1', correction_number: 'TAX-2024-0001', status: 'verified', ocr_result: '전통시장: 1,800,000원, 대중교통: 960,000원', ai_classification: '신용카드 소득공제 증빙', uploaded_at: '2025-03-12', thumbnail_url: null },
  { id: 'D07', file_name: '보험료_납입증명서_삼성생명.pdf', file_type: 'application/pdf', file_size: 210000, doc_type: 'certificate', doc_type_label: '보험료 납입증명서', tax_year: 2024, correction_id: null, correction_number: null, status: 'uploaded', ocr_result: null, ai_classification: null, uploaded_at: '2025-03-12', thumbnail_url: null },
  { id: 'D08', file_name: '임대차계약서.pdf', file_type: 'application/pdf', file_size: 1200000, doc_type: 'contract', doc_type_label: '임대차계약서', tax_year: 2024, correction_id: null, correction_number: null, status: 'ocr_processing', ocr_result: null, ai_classification: null, uploaded_at: '2025-03-13', thumbnail_url: null },
]

const demoChecklists: CorrectionChecklist[] = [
  {
    correction_number: 'TAX-2024-0001',
    correction_id: '1',
    tax_year: 2024,
    documents: [
      { name: 'IRP 납입확인서', required: true, uploaded: true },
      { name: '의료비 납입확인서', required: true, uploaded: true },
      { name: '의료비 영수증 (안경/치과)', required: true, uploaded: true },
      { name: '교육비 납입증명서', required: true, uploaded: true },
      { name: '기부금 영수증', required: true, uploaded: true },
      { name: '카드 사용내역서', required: true, uploaded: true },
      { name: '보험료 납입증명서', required: true, uploaded: false },
      { name: '주민등록등본', required: true, uploaded: false },
      { name: '임대차계약서', required: false, uploaded: true },
    ],
  },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

type ViewMode = 'grid' | 'list' | 'checklist'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<TaxDocument[]>([])
  const [checklists, setChecklists] = useState<CorrectionChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<DocType | 'all'>('all')
  const [filterYear, setFilterYear] = useState<number | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<TaxDocument | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    try {
      const res = await fetchApi('/tax-correction/documents')
      setDocuments(res.data || [])
      setChecklists(res.checklists || [])
      setIsDemo(res.is_demo || false)
    } catch {
      setDocuments(demoDocuments)
      setChecklists(demoChecklists)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleUploadFiles(files)
  }

  const handleUploadFiles = (files: File[]) => {
    const newDocs: TaxDocument[] = files.map((file, i) => ({
      id: `NEW_${Date.now()}_${i}`,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      doc_type: 'other' as DocType,
      doc_type_label: '미분류',
      tax_year: new Date().getFullYear() - 1,
      correction_id: null,
      correction_number: null,
      status: 'uploading' as DocStatus,
      ocr_result: null,
      ai_classification: null,
      uploaded_at: new Date().toISOString().split('T')[0],
      thumbnail_url: null,
    }))
    setDocuments(prev => [...newDocs, ...prev])

    // Simulate upload + OCR pipeline
    newDocs.forEach(doc => {
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'uploaded' as DocStatus } : d))
      }, 1000)
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'ocr_processing' as DocStatus } : d))
      }, 2000)
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'ocr_done' as DocStatus, ocr_result: 'OCR 데이터 추출 완료' } : d))
      }, 4000)
      setTimeout(() => {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'classified' as DocStatus, ai_classification: 'AI 자동 분류 완료' } : d))
      }, 6000)
    })
  }

  const filteredDocs = documents
    .filter(d => filterType === 'all' || d.doc_type === filterType)
    .filter(d => filterYear === 'all' || d.tax_year === filterYear)
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .filter(d => !searchQuery || d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.doc_type_label || '').includes(searchQuery))

  const uniqueYears = Array.from(new Set(documents.map(d => d.tax_year))).sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터입니다.
          </span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">증빙서류 관리</h1>
            <p className="text-sm text-muted-foreground">경정청구에 필요한 서류를 업로드하고 관리합니다</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary btn-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            파일 업로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => {
              if (e.target.files) handleUploadFiles(Array.from(e.target.files))
            }}
          />
        </div>
      </div>

      {/* ───── 업로드 영역 ───── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card p-8 border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground/30'}`} />
        <div className="font-semibold text-sm">
          {isDragging ? '여기에 파일을 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          PDF, JPG, PNG 형식 지원 (복수 파일 가능)
        </p>
      </div>

      {/* ───── 필터 ───── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="파일명, 서류 유형으로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as DocType | 'all')}
              className="input py-1.5 text-sm"
            >
              <option value="all">전체 유형</option>
              {Object.entries(docTypeConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="input py-1.5 text-sm"
            >
              <option value="all">전체 연도</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as DocStatus | 'all')}
              className="input py-1.5 text-sm"
            >
              <option value="all">전체 상태</option>
              {Object.entries(statusConfig).filter(([k]) => k !== 'uploading').map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            {/* 뷰 모드 */}
            <div className="flex items-center rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('checklist')}
                className={`p-2 ${viewMode === 'checklist' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───── 그리드 뷰 ───── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const ds = statusConfig[doc.status]
            const isImage = doc.file_type.startsWith('image/')
            return (
              <div
                key={doc.id}
                className="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                {/* 썸네일 */}
                <div className="h-32 bg-secondary/30 flex items-center justify-center">
                  {isImage ? (
                    <Image className="w-12 h-12 text-muted-foreground/30" />
                  ) : (
                    <FileText className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-sm font-semibold truncate">{doc.file_name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs text-muted-foreground">{doc.doc_type_label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${ds.color} ${ds.bg}`}>
                      {doc.status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin inline mr-0.5" />}
                      {ds.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-2xs text-muted-foreground">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>{doc.tax_year}년</span>
                  </div>
                  {doc.ai_classification && (
                    <div className="text-2xs text-purple-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {doc.ai_classification}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ───── 리스트 뷰 ───── */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
            <div className="col-span-4">파일명</div>
            <div className="col-span-2">유형</div>
            <div className="col-span-1">연도</div>
            <div className="col-span-1">크기</div>
            <div className="col-span-2">상태</div>
            <div className="col-span-2">경정청구</div>
          </div>
          <div className="divide-y divide-border">
            {filteredDocs.map(doc => {
              const ds = statusConfig[doc.status]
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer items-center"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{doc.file_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${ds.color} ${ds.bg}`}>{ds.label}</span>
                    </div>
                    <div className="text-2xs text-muted-foreground">{doc.doc_type_label} | {doc.tax_year}년 | {formatFileSize(doc.file_size)}</div>
                  </div>

                  <div className="hidden md:flex col-span-4 items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{doc.file_name}</span>
                  </div>
                  <div className="hidden md:block col-span-2 text-xs text-muted-foreground">{doc.doc_type_label}</div>
                  <div className="hidden md:block col-span-1 text-xs">{doc.tax_year}</div>
                  <div className="hidden md:block col-span-1 text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</div>
                  <div className="hidden md:block col-span-2">
                    <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${ds.color} ${ds.bg}`}>{ds.label}</span>
                  </div>
                  <div className="hidden md:block col-span-2 text-xs text-muted-foreground">
                    {doc.correction_number || '-'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ───── 체크리스트 뷰 ───── */}
      {viewMode === 'checklist' && (
        <div className="space-y-4">
          {checklists.map(cl => {
            const uploaded = cl.documents.filter(d => d.uploaded).length
            const required = cl.documents.filter(d => d.required).length
            const requiredUploaded = cl.documents.filter(d => d.required && d.uploaded).length
            return (
              <div key={cl.correction_id} className="card overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
                  <div>
                    <span className="font-semibold text-sm">{cl.correction_number}</span>
                    <span className="text-xs text-muted-foreground ml-2">{cl.tax_year}년</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${requiredUploaded === required ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {uploaded}/{cl.documents.length} 완료
                    </span>
                    {requiredUploaded === required && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {cl.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      {doc.uploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : doc.required ? (
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />
                      )}
                      <span className={`text-sm flex-1 ${doc.uploaded ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {doc.name}
                        {doc.required && <span className="text-red-500 text-xs ml-1">*</span>}
                      </span>
                      {!doc.uploaded && (
                        <button className="btn-outline btn-sm text-xs">
                          <Upload className="w-3 h-3" />
                          업로드
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 빈 상태 */}
      {filteredDocs.length === 0 && viewMode !== 'checklist' && (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <div className="font-semibold text-muted-foreground mb-2">서류가 없습니다</div>
          <p className="text-sm text-muted-foreground">파일을 드래그하거나 업로드 버튼을 클릭하세요</p>
        </div>
      )}

      {/* ───── 서류 상세 모달 ───── */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="font-bold text-lg truncate pr-4">{selectedDoc.file_name}</h3>
              <button onClick={() => setSelectedDoc(null)} className="btn-icon flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* 미리보기 */}
              <div className="h-48 bg-secondary/30 rounded-xl flex items-center justify-center">
                {selectedDoc.file_type.startsWith('image/') ? (
                  <Image className="w-16 h-16 text-muted-foreground/30" />
                ) : (
                  <FileText className="w-16 h-16 text-muted-foreground/30" />
                )}
              </div>

              {/* 정보 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-2xs text-muted-foreground">파일 유형</div>
                  <div className="font-medium">{selectedDoc.file_type}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">파일 크기</div>
                  <div className="font-medium">{formatFileSize(selectedDoc.file_size)}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">업로드일</div>
                  <div className="font-medium">{selectedDoc.uploaded_at}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted-foreground">상태</div>
                  <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${statusConfig[selectedDoc.status].color} ${statusConfig[selectedDoc.status].bg}`}>
                    {statusConfig[selectedDoc.status].label}
                  </span>
                </div>
              </div>

              {/* OCR 결과 */}
              {selectedDoc.ocr_result && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                  <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" /> OCR 추출 데이터
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">{selectedDoc.ocr_result}</div>
                </div>
              )}

              {/* AI 분류 */}
              {selectedDoc.ai_classification && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10">
                  <div className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI 분류 결과
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300">{selectedDoc.ai_classification}</div>
                </div>
              )}

              {/* 재분류 */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">서류 유형 변경</label>
                <select className="input py-2 w-full text-sm">
                  {Object.entries(docTypeConfig).map(([key, val]) => (
                    <option key={key} value={key} selected={key === selectedDoc.doc_type}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button className="btn-outline btn-sm text-xs flex-1">
                  <Download className="w-3 h-3" />
                  다운로드
                </button>
                <button className="btn-outline btn-sm text-xs flex-1 text-red-600 hover:text-red-700">
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

/**
 * 차트 첨부 갤러리 + 폰 업로드 토큰 발급 모달.
 *
 * - 첨부 사진/문서 그리드
 * - "폰으로 촬영" 버튼 → 토큰 발급 → QR 모달 (의사 폰으로 카메라 즉시)
 * - "파일 선택" 버튼 → 데스크탑 직접 업로드
 * - 1분마다 목록 자동 새로고침 (폰에서 올라온 사진 즉시 반영)
 */
import { useEffect, useRef, useState } from 'react'
import {
  Camera, QrCode, Upload, Trash2, X, Copy, Loader2, ImagePlus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  attachmentService, AttachmentOut, UploadTokenResponse, fullFileUrl,
} from '@/lib/api/attachments'

interface Props {
  visitId: string
  className?: string
}

export default function AttachmentGallery({ visitId, className = '' }: Props) {
  const [items, setItems] = useState<AttachmentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<UploadTokenResponse | null>(null)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<AttachmentOut | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const r = await attachmentService.list(visitId)
      setItems(r)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // 토큰 활성화 시 짧은 폴링, 아닐 때는 30초
    const id = setInterval(load, tokenOpen ? 4000 : 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId, tokenOpen])

  const onCreateToken = async () => {
    try {
      setCreating(true)
      const t = await attachmentService.createToken(visitId, {
        label: '진료 사진',
        expires_in_minutes: 30,
        max_uploads: 20,
      })
      setTokenInfo(t)
      setTokenOpen(true)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '토큰 발급 실패')
    } finally {
      setCreating(false)
    }
  }

  const onDirectUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const f of Array.from(files)) {
        await attachmentService.uploadDirect(visitId, f)
      }
      toast.success(`${files.length}장 업로드 완료`)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '업로드 실패')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onDelete = async (a: AttachmentOut) => {
    if (!confirm('이 첨부를 삭제할까요?')) return
    try {
      await attachmentService.remove(visitId, a.id)
      setItems((prev) => prev.filter((x) => x.id !== a.id))
      toast.success('삭제했어요')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '삭제 실패')
    }
  }

  return (
    <section className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">첨부 (사진·문서)</h2>
          <span className="text-xs text-slate-500">{items.length}건</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateToken}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-60"
            title="폰으로 촬영해서 차트에 첨부"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            폰으로 촬영
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-medium disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            파일 선택
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => onDirectUpload(e.target.files)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500">
          아직 첨부된 사진이 없어요. 폰으로 촬영하거나 파일을 선택하세요.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="relative aspect-square rounded-lg bg-slate-100 overflow-hidden group cursor-pointer"
              onClick={() => setPreview(a)}
            >
              {a.mime_type?.startsWith('image/') ? (
                <img
                  src={fullFileUrl(a.thumbnail_url || a.file_url)}
                  alt={a.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs p-2 break-all">
                  {a.file_name}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(a) }}
                className="absolute top-1 right-1 bg-rose-600/90 text-white rounded p-0.5 opacity-0 group-hover:opacity-100"
                aria-label="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 토큰/QR 모달 */}
      {tokenOpen && tokenInfo && (
        <TokenModal
          tokenInfo={tokenInfo}
          onClose={() => setTokenOpen(false)}
          onUploaded={load}
        />
      )}

      {/* 사진 확대 미리보기 */}
      {preview && (
        <PreviewModal a={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  )
}

function TokenModal({
  tokenInfo, onClose, onUploaded,
}: { tokenInfo: UploadTokenResponse; onClose: () => void; onUploaded: () => void }) {
  const url = tokenInfo.upload_url
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
  const expiresMin = Math.max(0, Math.floor((new Date(tokenInfo.expires_at).getTime() - Date.now()) / 60000))

  // 폴링 — 모달 열려있는 동안 부모가 갱신되도록
  useEffect(() => {
    const id = setInterval(onUploaded, 3000)
    return () => clearInterval(id)
  }, [onUploaded])

  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success('링크를 복사했어요'),
      () => toast.error('복사 실패'),
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">폰으로 촬영하기</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-slate-600 leading-relaxed mb-3">
          본인 폰 카메라로 아래 QR을 스캔하면 바로 촬영 화면이 열려요.
          찍은 사진은 <b className="text-slate-900">이 차트</b>에 자동으로 반영됩니다.
        </div>

        <div className="bg-slate-50 rounded-xl p-4 flex justify-center mb-3">
          <img src={qrSrc} alt="업로드 링크 QR" className="w-60 h-60" />
        </div>

        <div className="text-xs text-slate-500 text-center mb-2">
          만료까지 <b className="text-slate-700">{expiresMin}분</b> · 최대 <b className="text-slate-700">{tokenInfo.max_uploads}장</b>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-2">
          <code className="text-[10px] text-slate-700 truncate flex-1 px-1">{url}</code>
          <button
            type="button"
            onClick={copy}
            className="p-1 text-slate-500 hover:text-slate-900"
            aria-label="링크 복사"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ a, onClose }: { a: AttachmentOut; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>
        {a.mime_type?.startsWith('image/') ? (
          <img src={fullFileUrl(a.file_url)} alt={a.file_name} className="max-w-full max-h-[85vh] object-contain rounded" />
        ) : (
          <a
            href={fullFileUrl(a.file_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl p-6 text-blue-600"
          >
            {a.file_name} 열기 →
          </a>
        )}
      </div>
    </div>
  )
}

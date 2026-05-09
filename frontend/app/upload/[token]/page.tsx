'use client'

/**
 * 폰 카메라 업로드 페이지 (Public, magic-link 토큰)
 *
 * 의사가 차트에서 토큰을 발급해 자기 폰으로 보낸 링크.
 * 폰에서 열면 카메라가 즉시 작동 → 환부/검사지 촬영 → 차트 자동 첨부.
 *
 * 환자 동의서·신분증 등도 같은 페이지로.
 */
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Camera, Loader2, AlertOctagon, CheckCircle2, X, RefreshCw, Image as ImageIcon,
} from 'lucide-react'
import {
  publicAttachmentService, TokenInfo, AttachmentOut, fullFileUrl,
} from '@/lib/api/attachments'

export default function UploadPage() {
  const params = useParams()
  const token = params?.token as string

  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<AttachmentOut[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const t = await publicAttachmentService.getToken(token)
        if (!cancelled) setInfo(t)
      } catch (e: any) {
        if (!cancelled) setError(e.response?.data?.detail || '잘못된 링크입니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const promises: Promise<AttachmentOut>[] = []
      for (const f of Array.from(files)) {
        promises.push(publicAttachmentService.upload(token, f))
      }
      const results = await Promise.all(promises)
      setUploaded((prev) => [...results, ...prev])
      // 토큰 정보 재조회 (used_count 갱신)
      try {
        const t = await publicAttachmentService.getToken(token)
        setInfo(t)
      } catch {}
    } catch (e: any) {
      setError(e.response?.data?.detail || '업로드 실패')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
      </main>
    )
  }

  if (!info || !info.valid) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-xl font-semibold mt-4">{info?.error || error || '잘못된 링크'}</h1>
          <p className="text-sm text-slate-500 mt-2">차트에서 새 링크를 발급해 주세요.</p>
        </div>
      </main>
    )
  }

  const remaining = (info.max_uploads || 0) - (info.used_count || 0)
  const expiresIn = info.expires_at ? new Date(info.expires_at).getTime() - Date.now() : 0
  const expiresMin = Math.max(0, Math.floor(expiresIn / 60000))

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-5 py-5">
          {info.clinic_name && <div className="text-xs text-slate-500">{info.clinic_name}</div>}
          <h1 className="text-xl font-bold mt-0.5">차트 사진 업로드</h1>
          {info.patient_name && (
            <div className="text-sm text-slate-700 mt-1">환자: <b>{info.patient_name}</b></div>
          )}
          {info.label && (
            <div className="text-xs text-violet-700 mt-0.5">메모: {info.label}</div>
          )}
          <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap gap-2">
            <span>남은 업로드: <b className="text-slate-700">{remaining}장</b></span>
            <span>만료: <b className="text-slate-700">{expiresMin}분 남음</b></span>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-4">
        {/* 카메라 / 갤러리 버튼 */}
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('multiple')
              fileInputRef.current.click()
            }
          }}
          disabled={uploading || remaining <= 0}
          className="w-full py-6 rounded-2xl bg-blue-600 text-white font-bold text-lg disabled:opacity-50 flex flex-col items-center gap-2 shadow-md hover:bg-blue-700"
        >
          <Camera className="w-8 h-8" />
          {uploading ? '업로드 중...' : '카메라로 촬영하기'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute('multiple', 'true')
              fileInputRef.current.removeAttribute('capture')
              fileInputRef.current.click()
              // 다음 호출 위해 capture 복원
              setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 100)
            }
          }}
          disabled={uploading || remaining <= 0}
          className="w-full py-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5" />
          앨범에서 선택
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* 업로드 결과 */}
        {uploaded.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-emerald-700 flex items-center gap-1.5 mt-3">
              <CheckCircle2 className="w-4 h-4" />
              {uploaded.length}장 업로드 완료 — 차트에 자동 반영됐어요
            </div>
            <div className="grid grid-cols-3 gap-2">
              {uploaded.map((a) => (
                <div key={a.id} className="aspect-square rounded-lg bg-slate-200 overflow-hidden relative">
                  {a.mime_type?.startsWith('image/') ? (
                    <img
                      src={fullFileUrl(a.thumbnail_url || a.file_url)}
                      alt={a.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-[10px]">
                      {a.file_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

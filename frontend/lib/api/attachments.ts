/**
 * 차트 첨부 파일 클라이언트.
 *
 * - 의사용 (인증): 토큰 발급, 직접 업로드, 목록, 삭제
 * - Public (토큰): 토큰 정보 조회, 사진 업로드
 */
import axios from 'axios'
import { apiClient } from './client'

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const publicAxios = axios.create({ baseURL: PUBLIC_BASE })

export interface AttachmentOut {
  id: string
  visit_id: string
  file_name: string
  file_url: string
  thumbnail_url?: string
  mime_type?: string
  size_bytes?: number
  attachment_type: string
  description?: string
  taken_at?: string
  uploaded_at?: string
  created_at: string
}

export interface UploadTokenResponse {
  token: string
  upload_url: string
  expires_at: string
  max_uploads: number
  label?: string
}

export interface TokenInfo {
  valid: boolean
  label?: string
  expires_at?: string
  max_uploads?: number
  used_count?: number
  visit_id?: string
  patient_name?: string
  clinic_name?: string
  error?: string
}

// ─── 의사용 ────────────────────────────────────────────────
export const attachmentService = {
  createToken: async (
    visitId: string,
    data?: { label?: string; expires_in_minutes?: number; max_uploads?: number },
  ): Promise<UploadTokenResponse> => {
    const r = await apiClient.post(`/emr/visits/${visitId}/attachments/token`, data || {})
    return r.data
  },
  uploadDirect: async (
    visitId: string, file: File,
    opts?: { description?: string; attachment_type?: string },
  ): Promise<AttachmentOut> => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts?.description) fd.append('description', opts.description)
    fd.append('attachment_type', opts?.attachment_type || 'PHOTO')
    const r = await apiClient.post(`/emr/visits/${visitId}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data
  },
  list: async (visitId: string): Promise<AttachmentOut[]> => {
    const r = await apiClient.get(`/emr/visits/${visitId}/attachments`)
    return r.data
  },
  remove: async (visitId: string, attId: string): Promise<void> => {
    await apiClient.delete(`/emr/visits/${visitId}/attachments/${attId}`)
  },
}

// ─── Public (토큰) ─────────────────────────────────────────
export const publicAttachmentService = {
  getToken: async (token: string): Promise<TokenInfo> => {
    const r = await publicAxios.get(`/upload/${token}`)
    return r.data
  },
  upload: async (token: string, file: File, description?: string): Promise<AttachmentOut> => {
    const fd = new FormData()
    fd.append('file', file)
    if (description) fd.append('description', description)
    const r = await publicAxios.post(`/upload/${token}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return r.data
  },
}

export function fullFileUrl(file_url: string): string {
  if (!file_url) return ''
  if (/^https?:\/\//i.test(file_url)) return file_url
  // 백엔드는 /uploads/...로 노출, NEXT_PUBLIC_API_URL은 .../api/v1
  const base = (PUBLIC_BASE || '').replace(/\/api\/v\d+\/?$/, '')
  return `${base}${file_url}`
}

/**
 * STT → SOAP 클라이언트
 *
 * 진료 음성/텍스트 transcript를 받아 SOAP 4섹션 + 진단/처치/처방 후보로 분해.
 */
import { apiClient } from './client'

export interface StoSoapRequest {
  transcript: string
  visit_id?: string
  save_to_visit?: boolean
}

export interface StoSoapResponse {
  chief_complaint: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  diagnoses_suggested: { name: string; code?: string }[]
  procedures_suggested: { name: string }[]
  drugs_suggested: { name: string; dose?: string }[]
  confidence: number
  model: string
  raw_transcript: string
  saved_to_visit: boolean
}

export const sttService = {
  parse: async (req: StoSoapRequest): Promise<StoSoapResponse> => {
    const r = await apiClient.post('/stt/parse', req)
    return r.data
  },
}

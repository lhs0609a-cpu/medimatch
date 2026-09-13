import type { Appointment } from '@/lib/api/emr'

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dayRange(date: string) {
  const next = new Date(`${date}T12:00:00`)
  next.setDate(next.getDate() + 1)
  return { date_from: `${date}T00:00:00`, date_to: `${localDate(next)}T00:00:00` }
}

export function chartHref(appointment: Appointment): string {
  const params = new URLSearchParams({ cc: appointment.chief_complaint || '' })
  if (appointment.patient_id) params.set('patient_id', appointment.patient_id)
  return `/emr/chart/new?${params}`
}

export function errorMessage(error: unknown, fallback = '요청을 처리하지 못했습니다. 다시 시도해주세요.'): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}

'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

interface Props {
  endpoint: 'patients' | 'visits' | 'bills' | 'prescriptions'
  label?: string
  className?: string
}

const FILENAME_KR: Record<Props['endpoint'], string> = {
  patients: '환자목록',
  visits: '진료기록',
  bills: '청구수납',
  prescriptions: '처방전',
}

export default function ExportButton({ endpoint, label, className }: Props) {
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      const r = await apiClient.get(`/emr/export/${endpoint}.csv`, { responseType: 'blob' })
      const blob = new Blob([r.data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `${FILENAME_KR[endpoint]}_${today}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('CSV 다운로드 완료')
    } catch (e: any) {
      toast.error('내보내기 실패: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={onClick} disabled={loading} className={className || 'btn-ghost text-xs'}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      {label || 'CSV'}
    </button>
  )
}

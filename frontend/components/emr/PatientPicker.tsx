'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User, X } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface PatientLite {
  id: string
  chart_no?: string
  name: string
  phone?: string
  gender?: string
  birth_date?: string
}

interface PatientPickerProps {
  value: PatientLite | null
  onChange: (patient: PatientLite | null) => void
  placeholder?: string
}

export default function PatientPicker({ value, onChange, placeholder = '환자 검색 (이름·전화·차트번호)' }: PatientPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['patient-search', debounced],
    queryFn: async () => {
      const r = await apiClient.get('/emr/patients/', {
        params: { search: debounced || undefined, size: 15 },
      })
      return r.data?.items || []
    },
    enabled: open,
  })

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-muted/30">
        <User className="w-4 h-4 text-blue-600" />
        <div className="flex-1">
          <span className="font-medium text-sm">{value.name}</span>
          {value.chart_no && <span className="text-xs text-muted-foreground ml-2">{value.chart_no}</span>}
          {value.phone && <span className="text-xs text-muted-foreground ml-2">· {value.phone}</span>}
        </div>
        <button onClick={() => onChange(null)} className="text-muted-foreground hover:text-rose-500">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
          {isLoading && <div className="p-3 text-xs text-muted-foreground">검색 중...</div>}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="p-3 text-xs text-muted-foreground">결과 없음 — 환자 등록 후 사용하세요.</div>
          )}
          {data?.map((p: PatientLite) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p)
                setOpen(false)
                setQuery('')
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{p.name}</span>
                {p.chart_no && <span className="text-[11px] text-muted-foreground">{p.chart_no}</span>}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {p.phone || '전화 미등록'} {p.birth_date ? `· ${p.birth_date}` : ''}
              </div>
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="w-full text-center py-2 text-[11px] text-muted-foreground hover:bg-muted/30"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}

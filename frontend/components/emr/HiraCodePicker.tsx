'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface HiraResult {
  code: string
  name: string
  unit_price?: number
  category?: string
  insurance_type?: string
}

interface Props {
  type: 'fee' | 'disease' | 'drug'
  value: string
  onChange: (val: string) => void
  onSelect: (item: HiraResult) => void
  placeholder?: string
  className?: string
}

/**
 * HIRA 코드(수가/진단/약품) 자동완성 입력.
 * - DB 코드 레지스트리 조회 (없으면 데모 폴백)
 */
export default function HiraCodePicker({
  type, value, onChange, onSelect, placeholder, className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 250)
    return () => clearTimeout(t)
  }, [value])

  const { data, isLoading } = useQuery({
    queryKey: ['hira-code', type, debounced],
    queryFn: async () => {
      const r = await apiClient.get(`/hira-codes/${type}`, {
        params: { q: debounced, limit: 12 },
      })
      return r.data?.data || []
    },
    enabled: open && debounced.length >= 1,
  })

  return (
    <div className={`relative ${className || ''}`}>
      <input
        className="input"
        placeholder={placeholder || (type === 'disease' ? '진단명 또는 KCD 코드' : type === 'drug' ? '약품명' : '수가코드 또는 명칭')}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && debounced.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
          {isLoading && <div className="p-2 text-xs text-muted-foreground">검색 중...</div>}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="p-2 text-xs text-muted-foreground">결과 없음</div>
          )}
          {data?.map((item: HiraResult) => (
            <button
              key={item.code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-muted/50 border-b border-border/30 last:border-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-blue-600">{item.code}</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.unit_price !== undefined && item.unit_price > 0 && (
                <div className="text-[10px] text-muted-foreground">단가 {item.unit_price.toLocaleString()}원</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

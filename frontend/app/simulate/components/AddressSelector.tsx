'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'
import { KOREA_REGIONS } from '../data/korea-regions'

interface AddressSelectorProps {
  onChange: (address: string) => void
  error?: string
  label?: string
}

export default function AddressSelector({ onChange, error, label = '개원 예정 주소 *' }: AddressSelectorProps) {
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [dong, setDong] = useState('')

  const sidoList = Object.keys(KOREA_REGIONS)
  const sigunguList = sido ? Object.keys(KOREA_REGIONS[sido] || {}) : []
  const dongList = sido && sigungu ? (KOREA_REGIONS[sido]?.[sigungu] || []) : []

  useEffect(() => {
    if (sido && sigungu && dong) {
      onChange(`${sido} ${sigungu} ${dong}`)
    } else {
      onChange('')
    }
  }, [sido, sigungu, dong])

  const handleSidoChange = (value: string) => {
    setSido(value)
    setSigungu('')
    setDong('')
  }

  const handleSigunguChange = (value: string) => {
    setSigungu(value)
    setDong('')
  }

  return (
    <div>
      <label className="label mb-2 block">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {/* 시/도 */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            value={sido}
            onChange={(e) => handleSidoChange(e.target.value)}
            className="select pl-9 pr-8 w-full text-sm appearance-none"
          >
            <option value="">시/도</option>
            {sidoList.map((s) => (
              <option key={s} value={s}>{s.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('도', '')}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* 시/군/구 */}
        <div className="relative">
          <select
            value={sigungu}
            onChange={(e) => handleSigunguChange(e.target.value)}
            disabled={!sido}
            className="select pr-8 w-full text-sm appearance-none disabled:opacity-40"
          >
            <option value="">시/군/구</option>
            {sigunguList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* 동/읍/면 */}
        <div className="relative">
          <select
            value={dong}
            onChange={(e) => setDong(e.target.value)}
            disabled={!sigungu}
            className="select pr-8 w-full text-sm appearance-none disabled:opacity-40"
          >
            <option value="">동/읍/면</option>
            {dongList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* 선택된 주소 미리보기 */}
      {sido && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>
            {sido}
            {sigungu && ` ${sigungu}`}
            {dong && ` ${dong}`}
            {!dong && <span className="text-amber-500 ml-1">← 동/읍/면까지 선택해주세요</span>}
          </span>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}

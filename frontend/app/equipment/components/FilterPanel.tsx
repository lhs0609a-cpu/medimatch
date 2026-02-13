'use client'

import { X, SlidersHorizontal } from 'lucide-react'
import { categories, conditionLabels } from '../data/seed'

interface Filters {
  category: string
  condition: string
  minPrice: string
  maxPrice: string
  sellerType: string
}

interface FilterPanelProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  onClose: () => void
  resultCount: number
}

const sellerTypes = [
  { value: '', label: '전체' },
  { value: 'dealer', label: '딜러/유통사' },
  { value: 'hospital', label: '의원 직거래' },
  { value: 'manufacturer', label: '제조사 직판' },
]

export default function FilterPanel({ filters, onFilterChange, onClose, resultCount }: FilterPanelProps) {
  const update = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const resetAll = () => {
    onFilterChange({ category: '전체', condition: '', minPrice: '', maxPrice: '', sellerType: '' })
  }

  const activeCount = [
    filters.category !== '전체',
    filters.condition,
    filters.minPrice,
    filters.maxPrice,
    filters.sellerType,
  ].filter(Boolean).length

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          필터
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">{activeCount}</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={resetAll} className="text-xs text-primary hover:underline">
              초기화
            </button>
          )}
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">카테고리</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => update('category', cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filters.category === cat
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">상태</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => update('condition', '')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              !filters.condition ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            전체
          </button>
          {Object.entries(conditionLabels).map(([key, val]) => (
            <button
              key={key}
              onClick={() => update('condition', key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filters.condition === key
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={filters.condition === key ? { backgroundColor: val.color } : undefined}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">가격 범위 (만원)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            placeholder="최소"
            className="input w-full text-sm"
          />
          <span className="text-muted-foreground">~</span>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            placeholder="최대"
            className="input w-full text-sm"
          />
        </div>
      </div>

      {/* Seller type */}
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">판매자 유형</p>
        <div className="flex flex-wrap gap-1.5">
          {sellerTypes.map((st) => (
            <button
              key={st.value}
              onClick={() => update('sellerType', st.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filters.sellerType === st.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t text-sm text-muted-foreground text-center">
        {resultCount}개 장비 검색됨
      </div>
    </div>
  )
}

export type { Filters }

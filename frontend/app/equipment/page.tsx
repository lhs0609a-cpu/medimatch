'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Package, Search, SlidersHorizontal, Plus, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { equipmentList } from './data/seed'
import EquipmentCard from './components/EquipmentCard'
import FilterPanel, { type Filters } from './components/FilterPanel'

type SortOption = 'latest' | 'price-low' | 'price-high' | 'popular'

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    category: '전체',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sellerType: '',
  })

  const filtered = useMemo(() => {
    let result = equipmentList.filter((eq) => {
      if (filters.category !== '전체' && eq.category !== filters.category) return false
      if (filters.condition && eq.condition !== filters.condition) return false
      if (filters.minPrice && eq.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && eq.price > Number(filters.maxPrice)) return false
      if (filters.sellerType && eq.sellerType !== filters.sellerType) return false
      if (search) {
        const q = search.toLowerCase()
        if (!eq.name.toLowerCase().includes(q) && !eq.brand.toLowerCase().includes(q) && !eq.category.includes(q)) return false
      }
      return true
    })

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break
      case 'price-high': result.sort((a, b) => b.price - a.price); break
      case 'popular': result.sort((a, b) => b.viewCount - a.viewCount); break
      default: result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return result
  }, [filters, search, sortBy])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Package className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">의료장비</h1>
            <span className="badge-default text-xs">{equipmentList.length}개</span>
          </div>
          <Link href="/equipment/register" className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 장비 등록
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Search + Sort */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="장비명, 브랜드 검색..."
              className="input pl-12 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="select min-w-[130px]"
            >
              <option value="latest">최신순</option>
              <option value="price-low">가격 낮은순</option>
              <option value="price-high">가격 높은순</option>
              <option value="popular">인기순</option>
            </select>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`btn-secondary px-3 rounded-lg flex items-center gap-1.5 lg:hidden ${showFilter ? 'bg-primary text-white' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> 필터
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filter sidebar - always visible on desktop */}
          <div className={`${showFilter ? 'block' : 'hidden'} lg:block`}>
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              onClose={() => setShowFilter(false)}
              resultCount={filtered.length}
            />
          </div>

          {/* Equipment grid */}
          <div className="lg:col-span-3">
            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">검색 결과가 없습니다</h3>
                <p className="text-sm text-muted-foreground">필터를 조정하거나 다른 키워드로 검색해보세요.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((eq) => (
                  <EquipmentCard key={eq.id} equipment={eq} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

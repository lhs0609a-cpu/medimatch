'use client'

import { useState, useMemo } from 'react'
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Truck,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Upload,
  RefreshCw,
  X,
  Check,
  Clock,
  Pill,
  Box,
  DollarSign,
  Edit3,
  Trash2,
  History,
  Bell,
  Zap,
  ArrowRight,
} from 'lucide-react'

/* ─── 타입 ─── */
type StockLevel = 'sufficient' | 'low' | 'critical' | 'out_of_stock'
type DrugCategory = 'all' | 'prescription' | 'otc' | 'narcotic' | 'refrigerated'

interface Drug {
  id: string
  name: string
  genericName: string
  manufacturer: string
  category: DrugCategory
  unit: string
  currentStock: number
  safetyStock: number
  maxStock: number
  unitPrice: number
  sellingPrice: number
  expiryDate: string
  lotNumber: string
  location: string
  lastOrdered: string
  monthlyUsage: number
  autoOrder: boolean
  refrigerated: boolean
  narcotic: boolean
}

/* ─── 더미 데이터 ─── */
const inventoryData: Drug[] = [
  { id: 'D001', name: '아목시실린캡슐 500mg', genericName: '아목시실린', manufacturer: '대웅제약', category: 'prescription', unit: '캡슐', currentStock: 450, safetyStock: 200, maxStock: 1000, unitPrice: 120, sellingPrice: 280, expiryDate: '2025-08-15', lotNumber: 'AMX240301', location: 'A-1-3', lastOrdered: '2024-01-05', monthlyUsage: 180, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D002', name: '이부프로펜정 200mg', genericName: '이부프로펜', manufacturer: '삼성제약', category: 'prescription', unit: '정', currentStock: 85, safetyStock: 100, maxStock: 500, unitPrice: 45, sellingPrice: 120, expiryDate: '2025-12-20', lotNumber: 'IBU240201', location: 'A-2-1', lastOrdered: '2024-01-10', monthlyUsage: 120, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D003', name: '메트포르민정 500mg', genericName: '메트포르민', manufacturer: '한미약품', category: 'prescription', unit: '정', currentStock: 1200, safetyStock: 300, maxStock: 2000, unitPrice: 35, sellingPrice: 95, expiryDate: '2026-03-10', lotNumber: 'MET240115', location: 'B-1-2', lastOrdered: '2024-01-08', monthlyUsage: 350, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D004', name: '암로디핀정 5mg', genericName: '암로디핀', manufacturer: '화이자', category: 'prescription', unit: '정', currentStock: 620, safetyStock: 150, maxStock: 800, unitPrice: 85, sellingPrice: 200, expiryDate: '2025-11-30', lotNumber: 'AML240105', location: 'B-2-1', lastOrdered: '2024-01-03', monthlyUsage: 210, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D005', name: '인슐린 글라진 주사', genericName: '인슐린 글라진', manufacturer: '사노피', category: 'refrigerated', unit: '펜', currentStock: 12, safetyStock: 10, maxStock: 50, unitPrice: 18500, sellingPrice: 35000, expiryDate: '2024-06-15', lotNumber: 'INS240110', location: '냉장고-1', lastOrdered: '2024-01-12', monthlyUsage: 8, autoOrder: true, refrigerated: true, narcotic: false },
  { id: 'D006', name: '타이레놀정 500mg', genericName: '아세트아미노펜', manufacturer: 'GSK', category: 'otc', unit: '정', currentStock: 2400, safetyStock: 500, maxStock: 3000, unitPrice: 25, sellingPrice: 70, expiryDate: '2026-06-30', lotNumber: 'TYL240201', location: 'C-1-1', lastOrdered: '2024-01-15', monthlyUsage: 400, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D007', name: '졸피뎀정 10mg', genericName: '졸피뎀', manufacturer: '사노피', category: 'narcotic', unit: '정', currentStock: 30, safetyStock: 20, maxStock: 100, unitPrice: 350, sellingPrice: 800, expiryDate: '2025-09-01', lotNumber: 'ZOL240108', location: '마약장-A', lastOrdered: '2024-01-05', monthlyUsage: 15, autoOrder: false, refrigerated: false, narcotic: true },
  { id: 'D008', name: '레보세티리진정 5mg', genericName: '레보세티리진', manufacturer: '유씨비', category: 'prescription', unit: '정', currentStock: 35, safetyStock: 100, maxStock: 500, unitPrice: 55, sellingPrice: 130, expiryDate: '2025-10-15', lotNumber: 'LEV240115', location: 'A-3-2', lastOrdered: '2024-01-11', monthlyUsage: 90, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D009', name: '오메프라졸캡슐 20mg', genericName: '오메프라졸', manufacturer: '아스트라', category: 'prescription', unit: '캡슐', currentStock: 0, safetyStock: 80, maxStock: 400, unitPrice: 95, sellingPrice: 220, expiryDate: '-', lotNumber: '-', location: 'A-1-5', lastOrdered: '2024-01-02', monthlyUsage: 60, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D010', name: '셀레콕시브캡슐 200mg', genericName: '셀레콕시브', manufacturer: '화이자', category: 'prescription', unit: '캡슐', currentStock: 180, safetyStock: 80, maxStock: 400, unitPrice: 180, sellingPrice: 420, expiryDate: '2025-07-20', lotNumber: 'CEL240110', location: 'A-2-4', lastOrdered: '2024-01-09', monthlyUsage: 65, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D011', name: '프레드니솔론정 5mg', genericName: '프레드니솔론', manufacturer: '제일약품', category: 'prescription', unit: '정', currentStock: 520, safetyStock: 100, maxStock: 600, unitPrice: 30, sellingPrice: 85, expiryDate: '2025-05-01', lotNumber: 'PRD240112', location: 'B-3-1', lastOrdered: '2024-01-07', monthlyUsage: 45, autoOrder: true, refrigerated: false, narcotic: false },
  { id: 'D012', name: '독시사이클린캡슐 100mg', genericName: '독시사이클린', manufacturer: '한독약품', category: 'prescription', unit: '캡슐', currentStock: 280, safetyStock: 100, maxStock: 500, unitPrice: 65, sellingPrice: 150, expiryDate: '2025-04-10', lotNumber: 'DOX240105', location: 'A-4-2', lastOrdered: '2024-01-06', monthlyUsage: 55, autoOrder: true, refrigerated: false, narcotic: false },
]

const wholesalers = [
  { name: '백제약품', connected: true, lastOrder: '오늘' },
  { name: '지오영', connected: true, lastOrder: '어제' },
  { name: '한국유나이티드', connected: false, lastOrder: '3일 전' },
]

/* ─── 유틸 ─── */
function getStockLevel(drug: Drug): StockLevel {
  if (drug.currentStock === 0) return 'out_of_stock'
  if (drug.currentStock < drug.safetyStock * 0.5) return 'critical'
  if (drug.currentStock < drug.safetyStock) return 'low'
  return 'sufficient'
}

const stockLevelConfig: Record<StockLevel, { label: string; color: string; bg: string }> = {
  sufficient: { label: '충분', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  low: { label: '부족', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  critical: { label: '긴급', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  out_of_stock: { label: '품절', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
}

const categoryLabels: Record<DrugCategory, string> = {
  all: '전체',
  prescription: '전문의약품',
  otc: '일반의약품',
  narcotic: '마약류',
  refrigerated: '냉장보관',
}

function isExpiringSoon(dateStr: string): boolean {
  if (dateStr === '-') return false
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000
}

function isExpired(dateStr: string): boolean {
  if (dateStr === '-') return false
  return new Date(dateStr) < new Date()
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<DrugCategory>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry' | 'usage'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderItems, setOrderItems] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = inventoryData

    if (categoryFilter !== 'all') {
      list = list.filter(d => d.category === categoryFilter)
    }

    if (stockFilter === 'low') {
      list = list.filter(d => ['low', 'critical', 'out_of_stock'].includes(getStockLevel(d)))
    } else if (stockFilter === 'expiring') {
      list = list.filter(d => isExpiringSoon(d.expiryDate) || isExpired(d.expiryDate))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      )
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'stock': cmp = (a.currentStock / a.safetyStock) - (b.currentStock / b.safetyStock); break
        case 'expiry': cmp = new Date(a.expiryDate === '-' ? '2099-12-31' : a.expiryDate).getTime() - new Date(b.expiryDate === '-' ? '2099-12-31' : b.expiryDate).getTime(); break
        case 'usage': cmp = b.monthlyUsage - a.monthlyUsage; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [searchQuery, categoryFilter, stockFilter, sortBy, sortDir])

  const stats = useMemo(() => {
    const total = inventoryData.length
    const lowStock = inventoryData.filter(d => ['low', 'critical', 'out_of_stock'].includes(getStockLevel(d))).length
    const expiring = inventoryData.filter(d => isExpiringSoon(d.expiryDate) || isExpired(d.expiryDate)).length
    const totalValue = inventoryData.reduce((acc, d) => acc + d.currentStock * d.unitPrice, 0)
    return { total, lowStock, expiring, totalValue }
  }, [])

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const toggleOrderItem = (id: string) => {
    setOrderItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">재고 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">의약품 재고 현황 및 자동 발주 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Upload className="w-3.5 h-3.5" /> 엑셀 가져오기
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Download className="w-3.5 h-3.5" /> 재고 내보내기
          </button>
          <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
            <Plus className="w-3.5 h-3.5" /> 약품 추가
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">총 약품 수</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-2xs text-muted-foreground mt-1">품목 관리중</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">재고 부족</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
          <div className="text-2xs text-muted-foreground mt-1">발주 필요</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">유통기한 임박</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.expiring}</div>
          <div className="text-2xs text-muted-foreground mt-1">90일 이내</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">재고 자산</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">₩{(stats.totalValue / 10000).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">만</span></div>
          <div className="text-2xs text-muted-foreground mt-1">원가 기준</div>
        </div>
      </div>

      {/* 도매상 연동 & 자동발주 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">연동 도매상</h3>
            <button className="text-2xs text-purple-600 font-medium hover:underline">+ 도매상 추가</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {wholesalers.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.connected ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Truck className={`w-5 h-5 ${w.connected ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                    <div className={`w-1.5 h-1.5 rounded-full ${w.connected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    {w.connected ? '연동중' : '미연동'} · 최근 발주: {w.lastOrder}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3">자동 발주 설정</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">자동 발주 활성화</span>
              <div className="w-10 h-6 rounded-full bg-purple-500 relative cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white absolute top-1 right-1 shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">안전재고 도달 시</span>
              <span className="text-xs text-purple-600 font-medium">자동 발주</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">발주 기본 도매상</span>
              <span className="text-xs font-medium">백제약품</span>
            </div>
            <button className="w-full btn-sm text-xs bg-secondary text-foreground mt-1">
              상세 설정
            </button>
          </div>
        </div>
      </div>

      {/* 재고 발주 바 */}
      {orderItems.size > 0 && (
        <div className="card p-4 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-sm text-purple-600">{orderItems.size}개 약품 발주 대기</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-sm text-xs bg-secondary text-foreground" onClick={() => setOrderItems(new Set())}>
                초기화
              </button>
              <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }} onClick={() => setShowOrderModal(true)}>
                <ShoppingCart className="w-3 h-3" /> 발주하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 필터 + 목록 */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {(['all', 'prescription', 'otc', 'narcotic', 'refrigerated'] as DrugCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat ? 'bg-purple-500 text-white' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="all">재고 상태: 전체</option>
              <option value="low">부족/긴급/품절</option>
              <option value="expiring">유통기한 임박</option>
            </select>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="약품명, 성분명, 제조사..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-9 py-1.5 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">약품명 <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">제조사</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('stock')}>
                  <div className="flex items-center justify-center gap-1">재고 <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">상태</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell cursor-pointer" onClick={() => toggleSort('usage')}>
                  <div className="flex items-center justify-center gap-1">월사용량 <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell cursor-pointer" onClick={() => toggleSort('expiry')}>
                  <div className="flex items-center justify-center gap-1">유통기한 <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground hidden xl:table-cell">위치</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(drug => {
                const level = getStockLevel(drug)
                const lc = stockLevelConfig[level]
                const stockPercent = Math.min((drug.currentStock / drug.maxStock) * 100, 100)
                const expiringSoon = isExpiringSoon(drug.expiryDate)
                const expired = isExpired(drug.expiryDate)

                return (
                  <tr key={drug.id} className={`hover:bg-secondary/30 transition-colors ${level === 'out_of_stock' ? 'bg-red-50/50 dark:bg-red-900/5' : level === 'critical' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={orderItems.has(drug.id)}
                        onChange={() => toggleOrderItem(drug.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${drug.narcotic ? 'bg-red-100 dark:bg-red-900/30' : drug.refrigerated ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                          <Pill className={`w-4 h-4 ${drug.narcotic ? 'text-red-600' : drug.refrigerated ? 'text-blue-600' : 'text-purple-600'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate max-w-[200px]">{drug.name}</div>
                          <div className="text-2xs text-muted-foreground">{drug.genericName} · {drug.id}</div>
                        </div>
                        {drug.narcotic && <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30">마약류</span>}
                        {drug.refrigerated && <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30">냉장</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{drug.manufacturer}</td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <div className="font-semibold">{drug.currentStock.toLocaleString()}<span className="text-2xs text-muted-foreground ml-0.5">{drug.unit}</span></div>
                        <div className="w-20 h-1.5 rounded-full bg-secondary mx-auto mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${level === 'sufficient' ? 'bg-emerald-500' : level === 'low' ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                        <div className="text-2xs text-muted-foreground mt-0.5">안전: {drug.safetyStock}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-2xs font-semibold ${lc.color} ${lc.bg}`}>
                        {lc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-center">
                      <div className="text-sm">{drug.monthlyUsage}</div>
                      <div className="text-2xs text-muted-foreground">예상 {Math.floor(drug.currentStock / Math.max(drug.monthlyUsage / 30, 1))}일분</div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-center">
                      <span className={`text-sm ${expired ? 'text-red-600 font-semibold' : expiringSoon ? 'text-amber-600 font-medium' : ''}`}>
                        {drug.expiryDate === '-' ? '-' : drug.expiryDate}
                      </span>
                      {expired && <div className="text-2xs text-red-600 font-bold">만료됨</div>}
                      {expiringSoon && !expired && <div className="text-2xs text-amber-600">임박</div>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-center text-muted-foreground">{drug.location}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {(level === 'low' || level === 'critical' || level === 'out_of_stock') && (
                          <button className="btn-sm text-2xs px-2 py-1" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }} onClick={() => toggleOrderItem(drug.id)}>
                            <ShoppingCart className="w-3 h-3" /> 발주
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">검색 결과가 없습니다</p>
          </div>
        )}

        {/* 테이블 하단 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <span>총 {filtered.length}개 약품</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded-lg hover:bg-secondary">이전</button>
            <button className="px-3 py-1 rounded-lg bg-purple-500 text-white">1</button>
            <button className="px-3 py-1 rounded-lg hover:bg-secondary">다음</button>
          </div>
        </div>
      </div>

      {/* 발주 모달 */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" /> 발주 확인
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              {inventoryData.filter(d => orderItems.has(d.id)).map(drug => (
                <div key={drug.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div>
                    <div className="text-sm font-medium">{drug.name}</div>
                    <div className="text-2xs text-muted-foreground">현재: {drug.currentStock} → 목표: {drug.maxStock}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{(drug.maxStock - drug.currentStock).toLocaleString()} {drug.unit}</div>
                    <div className="text-2xs text-muted-foreground">₩{((drug.maxStock - drug.currentStock) * drug.unitPrice).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">발주 도매상</span>
                <span className="text-sm font-semibold">백제약품</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">총 발주 금액</span>
                <span className="text-lg font-bold text-purple-600">
                  ₩{inventoryData.filter(d => orderItems.has(d.id)).reduce((acc, d) => acc + (d.maxStock - d.currentStock) * d.unitPrice, 0).toLocaleString()}
                </span>
              </div>
              <button className="w-full btn-sm text-sm py-2.5 mt-2" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                <Truck className="w-4 h-4" /> 발주 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

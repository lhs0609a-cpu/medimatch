'use client'

import { useState } from 'react'
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Brain,
  BarChart3,
  Package,
  Clock,
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  Search,
  Pill,
  Box,
} from 'lucide-react'

type TabKey = 'overview' | 'compare' | 'inventory' | 'bulk' | 'ai'

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: '전체 현황', icon: BarChart3 },
  { key: 'compare', label: '가격 비교', icon: DollarSign },
  { key: 'inventory', label: '재고 관리', icon: Package },
  { key: 'bulk', label: '대량구매 분석', icon: ShoppingCart },
  { key: 'ai', label: 'AI 권고', icon: Brain },
]

const kpi = {
  monthlyCost: 4_285_000,
  potentialSavings: 401_000,
  expiryAlerts: 1,
  reorderAlerts: 2,
}

const supplyItems = [
  { name: '일회용 주사기 3ml', type: 'SUPPLY', code: 'SU-001', unit: '박스(100개)', usage: 20, vendor: '한국메디칼', price: 35_000, monthlyCost: 700_000, stock: 15, reorder: 10, expiryDays: 180, hasGeneric: false, genericPrice: 0, savings: 0 },
  { name: '알코올 솜', type: 'SUPPLY', code: 'SU-002', unit: '팩(200매)', usage: 30, vendor: '메디팜', price: 8_500, monthlyCost: 255_000, stock: 25, reorder: 15, expiryDays: 365, hasGeneric: false, genericPrice: 0, savings: 0 },
  { name: '암로디핀 5mg', type: 'DRUG', code: 'DR-001', unit: '박스(100정)', usage: 15, vendor: '한미약품', price: 12_000, monthlyCost: 180_000, stock: 8, reorder: 5, expiryDays: 90, hasGeneric: true, genericPrice: 8_000, savings: 60_000 },
  { name: '메트포르민 500mg', type: 'DRUG', code: 'DR-002', unit: '박스(100정)', usage: 10, vendor: '대웅제약', price: 15_000, monthlyCost: 150_000, stock: 12, reorder: 5, expiryDays: 200, hasGeneric: true, genericPrice: 9_500, savings: 55_000 },
  { name: '오메프라졸 20mg', type: 'DRUG', code: 'DR-003', unit: '박스(60정)', usage: 8, vendor: '아스트라제네카', price: 28_000, monthlyCost: 224_000, stock: 4, reorder: 3, expiryDays: 25, hasGeneric: true, genericPrice: 14_000, savings: 112_000 },
  { name: '거즈 (멸균)', type: 'SUPPLY', code: 'SU-004', unit: '팩(50매)', usage: 25, vendor: '메디라인', price: 12_000, monthlyCost: 300_000, stock: 18, reorder: 10, expiryDays: 730, hasGeneric: false, genericPrice: 0, savings: 0 },
  { name: '라텍스 장갑', type: 'SUPPLY', code: 'SU-005', unit: '박스(100매)', usage: 15, vendor: '메디라인', price: 18_000, monthlyCost: 270_000, stock: 5, reorder: 8, expiryDays: 365, hasGeneric: false, genericPrice: 0, savings: 0 },
  { name: '세프트리악손 1g', type: 'DRUG', code: 'DR-004', unit: 'vial', usage: 20, vendor: '로슈', price: 5_500, monthlyCost: 110_000, stock: 30, reorder: 15, expiryDays: 150, hasGeneric: true, genericPrice: 3_200, savings: 46_000 },
  { name: '리도카인 2%', type: 'DRUG', code: 'DR-005', unit: 'vial(20ml)', usage: 12, vendor: '대한약품', price: 3_800, monthlyCost: 45_600, stock: 20, reorder: 10, expiryDays: 300, hasGeneric: false, genericPrice: 0, savings: 0 },
  { name: '혈압계 커프', type: 'SUPPLY', code: 'SU-003', unit: '개', usage: 2, vendor: '오므론코리아', price: 45_000, monthlyCost: 90_000, stock: 3, reorder: 2, expiryDays: null, hasGeneric: false, genericPrice: 0, savings: 0 },
]

const bulkItems = [
  { name: '일회용 주사기 3ml', currentPrice: 35_000, bulkPrice: 31_500, qty: 60, discount: 10, roi: 210_000 },
  { name: '알코올 솜', currentPrice: 8_500, bulkPrice: 7_650, qty: 100, discount: 10, roi: 85_000 },
  { name: '거즈 (멸균)', currentPrice: 12_000, bulkPrice: 10_200, qty: 75, discount: 15, roi: 135_000 },
  { name: '라텍스 장갑', currentPrice: 18_000, bulkPrice: 15_300, qty: 50, discount: 15, roi: 135_000 },
]

const aiRecommendations = [
  { id: 1, title: '제네릭 전환 추천', priority: 'HIGH', savings: 186_000, desc: '오메프라졸, 세프트리악손 등 4개 약품의 제네릭 전환 시 월 18.6만원 절감이 가능합니다.', actions: ['제네릭 의약품 동등성 시험 결과 확인', '환자 안내문 준비', '약국 브릿지 시스템으로 변경 알림'] },
  { id: 2, title: '대량구매 할인 활용', priority: 'MEDIUM', savings: 120_000, desc: '일회용 주사기, 알코올 솜 등 소모량 높은 품목을 분기 단위 대량구매 시 월 12만원 절감이 가능합니다.', actions: ['월별 사용량 기반 분기 발주량 산출', '3개 업체 대량구매 견적 비교', '보관 공간 확인'] },
  { id: 3, title: '공급업체 변경 검토', priority: 'LOW', savings: 95_000, desc: '라텍스 장갑, 거즈 등 범용 소모품의 공급업체를 변경하면 월 9.5만원 절감이 가능합니다.', actions: ['대체 업체 품질 샘플 테스트', '최소 주문량 및 배송 조건 확인', '기존 업체와 가격 재협상 시도'] },
]

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

function fmt(n: number) { return n.toLocaleString() + '원' }
function fmtMan(n: number) { return (n / 10000).toFixed(0) + '만' }

export default function SuppliesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = supplyItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const expiryAlerts = supplyItems.filter(i => i.expiryDays !== null && i.expiryDays <= 30)
  const reorderAlerts = supplyItems.filter(i => i.stock <= i.reorder)

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">소모품/약가 비교</h1>
        <p className="text-sm text-muted-foreground mt-1">의료 소모품과 약품 가격을 비교하고 재고를 효율적으로 관리합니다</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /><span className="text-xs text-muted-foreground">월 소모품비</span></div>
          <div className="text-2xl font-bold">{fmtMan(kpi.monthlyCost)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-5 h-5 text-emerald-500" /><span className="text-xs text-muted-foreground">절감 가능액</span></div>
          <div className="text-2xl font-bold text-emerald-600">{fmtMan(kpi.potentialSavings)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-red-500" /><span className="text-xs text-muted-foreground">유통기한 임박</span></div>
          <div className="text-2xl font-bold">{kpi.expiryAlerts}건</div>
          <div className="text-xs mt-1 text-muted-foreground">30일 이내</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-amber-500" /><span className="text-xs text-muted-foreground">재주문 필요</span></div>
          <div className="text-2xl font-bold">{kpi.reorderAlerts}건</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar border-b border-border">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* 전체 현황 */}
      {activeTab === 'overview' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold">월별 소모품비 구성</h3>
          <div className="space-y-3">
            {supplyItems.sort((a, b) => b.monthlyCost - a.monthlyCost).map((item) => (
              <div key={item.code} className="flex items-center gap-3">
                <span className="text-xs w-5">{item.type === 'DRUG' ? <Pill className="w-4 h-4 text-purple-400" /> : <Box className="w-4 h-4 text-blue-400" />}</span>
                <span className="text-sm w-36 truncate">{item.name}</span>
                <div className="flex-1 h-6 bg-secondary/30 rounded overflow-hidden">
                  <div className={`h-full rounded ${item.type === 'DRUG' ? 'bg-purple-400/60' : 'bg-blue-400/60'}`} style={{ width: `${(item.monthlyCost / 700_000) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold w-16 text-right">{fmtMan(item.monthlyCost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 가격 비교 */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="품목명 또는 코드로 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-3">품목명</div>
              <div className="col-span-1">유형</div>
              <div className="col-span-2 text-right">현재 단가</div>
              <div className="col-span-2 text-right">제네릭 단가</div>
              <div className="col-span-2 text-right">월 절감액</div>
              <div className="col-span-2">상태</div>
            </div>
            <div className="divide-y divide-border">
              {filteredItems.map((item) => (
                <div key={item.code} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {item.savings > 0 && <span className="text-emerald-600 font-bold text-sm">-{fmtMan(item.savings)}/월</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.vendor}</span>
                      <span>{fmt(item.price)}/{item.unit}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex col-span-3 items-center gap-2">
                    {item.type === 'DRUG' ? <Pill className="w-4 h-4 text-purple-400 flex-shrink-0" /> : <Box className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-2xs text-muted-foreground">{item.vendor} · {item.unit}</div>
                    </div>
                  </div>
                  <div className="hidden md:block col-span-1">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${item.type === 'DRUG' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'}`}>
                      {item.type === 'DRUG' ? '약품' : '소모품'}
                    </span>
                  </div>
                  <div className="hidden md:block col-span-2 text-right text-sm">{fmt(item.price)}</div>
                  <div className="hidden md:block col-span-2 text-right text-sm">
                    {item.hasGeneric ? <span className="text-emerald-600 font-semibold">{fmt(item.genericPrice)}</span> : <span className="text-muted-foreground">-</span>}
                  </div>
                  <div className="hidden md:block col-span-2 text-right">
                    {item.savings > 0 ? <span className="text-emerald-600 font-bold">{fmt(item.savings)}</span> : <span className="text-muted-foreground">-</span>}
                  </div>
                  <div className="hidden md:flex col-span-2 gap-1">
                    {item.hasGeneric && <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">제네릭 있음</span>}
                    {item.expiryDays !== null && item.expiryDays <= 30 && <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-red-50 text-red-600 dark:bg-red-900/30">만료임박</span>}
                    {item.stock <= item.reorder && <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/30">재고부족</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 재고 관리 */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {expiryAlerts.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-red-500" /> 유통기한 임박 (30일 이내)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiryAlerts.map((item) => (
                  <div key={item.code} className="card p-4 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">D-{item.expiryDays}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">재고: {item.stock} {item.unit} · 단가: {fmt(item.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {reorderAlerts.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /> 재주문 필요</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reorderAlerts.map((item) => (
                  <div key={item.code} className="card p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">재고 {item.stock} / 기준 {item.reorder}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">월 사용량: {item.usage} {item.unit} · 공급: {item.vendor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-bold mb-3">전체 재고 현황</h3>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left p-3 font-semibold text-xs text-muted-foreground">품목</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">현재 재고</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">재주문 기준</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">월 사용량</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">유통기한</th>
                      <th className="text-center p-3 font-semibold text-xs text-muted-foreground">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplyItems.map((item) => (
                      <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className={`p-3 text-center font-semibold ${item.stock <= item.reorder ? 'text-red-500' : ''}`}>{item.stock}</td>
                        <td className="p-3 text-center text-muted-foreground">{item.reorder}</td>
                        <td className="p-3 text-center">{item.usage}</td>
                        <td className={`p-3 text-center ${item.expiryDays !== null && item.expiryDays <= 30 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                          {item.expiryDays !== null ? `${item.expiryDays}일` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {item.stock <= item.reorder || (item.expiryDays !== null && item.expiryDays <= 30)
                            ? <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                            : <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 대량구매 분석 */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="card p-5 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">대량구매 시 분기 절감 예상액</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{fmt(bulkItems.reduce((s, i) => s + i.roi, 0))}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bulkItems.map((item) => (
              <div key={item.name} className="card p-5">
                <h4 className="font-bold mb-3">{item.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">현재 단가</span>
                    <span>{fmt(item.currentPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">대량구매 단가</span>
                    <span className="text-emerald-600 font-semibold">{fmt(item.bulkPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">최소 수량</span>
                    <span>{item.qty}개</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">할인율</span>
                    <span className="text-emerald-600 font-semibold">{item.discount}%</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between font-bold">
                    <span>분기 절감액</span>
                    <span className="text-emerald-600">{fmt(item.roi)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 권고 */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="card p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-bold">AI 분석 총 절감 가능액</span>
            </div>
            <div className="text-2xl font-bold text-primary">월 {fmt(aiRecommendations.reduce((s, r) => s + r.savings, 0))}</div>
          </div>
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold flex-1">{rec.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${priorityColors[rec.priority]}`}>
                  {rec.priority === 'HIGH' ? '높음' : rec.priority === 'MEDIUM' ? '보통' : '낮음'}
                </span>
                <span className="text-sm font-bold text-emerald-600">월 {fmt(rec.savings)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.desc}</p>
              <div className="space-y-1.5">
                {rec.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>데모 데이터로 표시 중입니다. 실제 소모품 데이터를 입력하면 정확한 분석이 가능합니다.</span>
        </div>
      </div>
    </div>
  )
}

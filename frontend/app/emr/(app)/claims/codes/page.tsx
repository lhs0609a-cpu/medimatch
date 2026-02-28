'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search,
  Star,
  StarOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Loader2,
  Info,
  Shield,
  Tag,
  Pill,
  Stethoscope,
  FileText,
  ChevronRight,
  ArrowRight,
  Trash2,
  Sparkles,
  BookOpen,
} from 'lucide-react'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 타입 ─── */
type TabKey = 'fee' | 'disease' | 'drug'

interface FeeCode {
  code: string
  name: string
  category: string
  unit_price: number
  insurance_type: string
}

interface DiseaseCode {
  code: string
  name_kr: string
  chapter: string
  is_chronic: boolean
}

interface DrugCode {
  code: string
  product_name: string
  ingredient_name: string
  insurance_price: number
}

interface ValidationResult {
  valid: boolean
  rejection_rate: number
  warnings: string[]
  details: string
}

/* ─── 데모 데이터 ─── */
const demoFeeCodes: FeeCode[] = [
  { code: 'AA157', name: '초진 진찰료', category: '진찰료', unit_price: 18400, insurance_type: 'COVERED' },
  { code: 'AA258', name: '재진 진찰료', category: '진찰료', unit_price: 12200, insurance_type: 'COVERED' },
  { code: 'B0010', name: '기본 처치료', category: '처치료', unit_price: 26800, insurance_type: 'COVERED' },
  { code: 'D2200', name: '일반혈액검사', category: '검사료', unit_price: 24500, insurance_type: 'COVERED' },
  { code: 'HA010', name: '신경차단술(대)', category: '수술료', unit_price: 45000, insurance_type: 'SELECTIVE' },
  { code: 'MM042', name: '도수치료', category: '처치료', unit_price: 25000, insurance_type: 'COVERED' },
  { code: 'F1010', name: '원외처방료', category: '처방료', unit_price: 14400, insurance_type: 'COVERED' },
  { code: 'E7070', name: '일반 초음파', category: '검사료', unit_price: 32000, insurance_type: 'COVERED' },
]

const demoDiseaseCodes: DiseaseCode[] = [
  { code: 'J06.9', name_kr: '급성 상기도감염', chapter: 'X', is_chronic: false },
  { code: 'M54.5', name_kr: '요통', chapter: 'XIII', is_chronic: false },
  { code: 'I10', name_kr: '본태성 고혈압', chapter: 'IX', is_chronic: true },
  { code: 'E11', name_kr: '제2형 당뇨병', chapter: 'IV', is_chronic: true },
  { code: 'G43.9', name_kr: '편두통', chapter: 'VI', is_chronic: false },
  { code: 'K29.5', name_kr: '만성 위염', chapter: 'XI', is_chronic: true },
]

const demoDrugCodes: DrugCode[] = [
  { code: 'A04900041', product_name: '타이레놀정 500mg', ingredient_name: '아세트아미노펜', insurance_price: 128 },
  { code: 'A23100011', product_name: '뮤코스타정', ingredient_name: '레바미피드', insurance_price: 185 },
  { code: 'A11000011', product_name: '아모겐캡슐', ingredient_name: '아목시실린', insurance_price: 95 },
]

/* ─── 탭 설정 ─── */
const tabs: { key: TabKey; label: string; icon: typeof Tag; endpoint: string }[] = [
  { key: 'fee', label: '수가코드', icon: Tag, endpoint: '/hira-codes/fee' },
  { key: 'disease', label: '상병코드', icon: Stethoscope, endpoint: '/hira-codes/disease' },
  { key: 'drug', label: '약품코드', icon: Pill, endpoint: '/hira-codes/drug' },
]

const insuranceTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  COVERED: { label: '급여', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  SELECTIVE: { label: '선별급여', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  NON_COVERED: { label: '비급여', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

/* ─── localStorage 유틸 ─── */
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

export default function HIRACodeSearchPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('fee')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(FeeCode | DiseaseCode | DrugCode)[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDemo, setIsDemo] = useState(true)

  /* 조합 검증 */
  const [diagnosisCode, setDiagnosisCode] = useState('')
  const [treatmentCodes, setTreatmentCodes] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  /* 최근 검색 & 즐겨찾기 */
  const [recentSearches, setRecentSearches] = useState<{ code: string; name: string; tab: TabKey }[]>([])
  const [favorites, setFavorites] = useState<{ code: string; name: string; tab: TabKey }[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  /* 초기 로드 */
  useEffect(() => {
    setRecentSearches(loadFromStorage('hira_recent', []))
    setFavorites(loadFromStorage('hira_favorites', []))
  }, [])

  /* 검색 디바운스 */
  const doSearch = useCallback(async (query: string, tab: TabKey) => {
    if (query.length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setSearching(true)
    try {
      const endpoint = tabs.find(t => t.key === tab)?.endpoint || '/hira-codes/fee'
      const res = await fetchApi(`${endpoint}?q=${encodeURIComponent(query)}`)
      setSearchResults(res.data || [])
      setShowDropdown(true)
      setIsDemo(res.is_demo ?? false)
    } catch {
      // Fallback to demo data
      const demoMap: Record<TabKey, (FeeCode | DiseaseCode | DrugCode)[]> = {
        fee: demoFeeCodes,
        disease: demoDiseaseCodes,
        drug: demoDrugCodes,
      }
      const q = query.toLowerCase()
      const filtered = demoMap[tab].filter((item) => {
        const values = Object.values(item).map(v => String(v).toLowerCase())
        return values.some(v => v.includes(q))
      })
      setSearchResults(filtered)
      setShowDropdown(true)
      setIsDemo(true)
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value, activeTab)
    }, 300)
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)

    // Show all demo data for the tab
    const demoMap: Record<TabKey, (FeeCode | DiseaseCode | DrugCode)[]> = {
      fee: demoFeeCodes,
      disease: demoDiseaseCodes,
      drug: demoDrugCodes,
    }
    setSearchResults(demoMap[tab])
  }

  const addToRecent = (code: string, name: string, tab: TabKey) => {
    const updated = [{ code, name, tab }, ...recentSearches.filter(r => r.code !== code)].slice(0, 10)
    setRecentSearches(updated)
    saveToStorage('hira_recent', updated)
    setShowDropdown(false)
  }

  const toggleFavorite = (code: string, name: string, tab: TabKey) => {
    const exists = favorites.some(f => f.code === code)
    const updated = exists
      ? favorites.filter(f => f.code !== code)
      : [...favorites, { code, name, tab }]
    setFavorites(updated)
    saveToStorage('hira_favorites', updated)
  }

  const isFavorite = (code: string) => favorites.some(f => f.code === code)

  const clearRecent = () => {
    setRecentSearches([])
    saveToStorage('hira_recent', [])
  }

  /* 조합 검증 */
  const handleValidate = async () => {
    if (!diagnosisCode.trim() || !treatmentCodes.trim()) return
    setValidating(true)
    setValidationResult(null)
    try {
      const res = await fetchApi('/hira-codes/validate-combination', {
        method: 'POST',
        body: JSON.stringify({
          diagnosis_code: diagnosisCode.trim(),
          treatment_codes: treatmentCodes.split(',').map(c => c.trim()).filter(Boolean),
        }),
      })
      setValidationResult(res)
    } catch {
      // Demo fallback
      const codes = treatmentCodes.split(',').map(c => c.trim()).filter(Boolean)
      const hasRisk = codes.some(c => ['HA010', 'D2711', 'MM042'].includes(c.toUpperCase()))
      setValidationResult({
        valid: !hasRisk,
        rejection_rate: hasRisk ? 23.5 : 2.1,
        warnings: hasRisk
          ? ['HA010: 주상병과 시술 관련성 검증 필요', 'D2711: 갑상선 검사와 주상병의 의학적 필요성 확인 필요']
          : [],
        details: hasRisk
          ? '일부 시술코드의 주상병 관련성이 부족합니다. 차트 기록에 의학적 사유를 명시하세요.'
          : '해당 조합은 심사 기준에 적합합니다. 통과 예상.',
      })
    } finally {
      setValidating(false)
    }
  }

  /* 테이블 데이터 (검색 결과가 없으면 전체 데모) */
  const displayData = searchResults.length > 0
    ? searchResults
    : (activeTab === 'fee' ? demoFeeCodes : activeTab === 'disease' ? demoDiseaseCodes : demoDrugCodes)

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* 데모 배너 */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            데모 데이터를 표시 중입니다. API 연동 후 실시간 심평원 코드를 조회할 수 있습니다.
          </span>
        </div>
      )}

      {/* ───── 헤더 ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HIRA 코드 검색</h1>
            <p className="text-sm text-muted-foreground">수가코드, 상병코드, 약품코드 통합 검색 콘솔</p>
          </div>
        </div>
      </div>

      {/* ───── 탭 네비게이션 ───── */}
      <div className="card p-1.5">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ───── 검색 ───── */}
      <div className="card p-4">
        <div className="relative">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                activeTab === 'fee' ? '수가코드 또는 항목명 검색 (예: AA157, 진찰료)...'
                : activeTab === 'disease' ? '상병코드 또는 질환명 검색 (예: J06.9, 감기)...'
                : '약품코드 또는 약품명 검색 (예: 타이레놀, 아세트아미노펜)...'
              }
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
              className="bg-transparent text-sm outline-none w-full py-3 placeholder:text-muted-foreground"
            />
            {searching && <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />}
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false) }} className="flex-shrink-0">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* 자동완성 드롭다운 */}
          {showDropdown && searchQuery && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
              {searchResults.slice(0, 8).map((item) => {
                const code = 'code' in item ? item.code : ''
                const name = activeTab === 'fee' ? (item as FeeCode).name
                  : activeTab === 'disease' ? (item as DiseaseCode).name_kr
                  : (item as DrugCode).product_name
                return (
                  <button
                    key={code}
                    onClick={() => addToRecent(code, name, activeTab)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span className="text-xs font-mono text-muted-foreground w-20 flex-shrink-0">{code}</span>
                    <span className="text-sm flex-1">{name}</span>
                    {activeTab === 'fee' && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(item as FeeCode).unit_price.toLocaleString()}원
                      </span>
                    )}
                    {activeTab === 'disease' && (item as DiseaseCode).is_chronic && (
                      <span className="px-1.5 py-0.5 rounded text-2xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">만성</span>
                    )}
                    <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ───── 즐겨찾기 & 최근 검색 ───── */}
      {(favorites.length > 0 || recentSearches.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 즐겨찾기 */}
          {favorites.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold">즐겨찾기 코드</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav) => (
                  <div key={fav.code} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-mono text-amber-700 dark:text-amber-300">{fav.code}</span>
                    <span className="text-xs text-amber-600">{fav.name}</span>
                    <button onClick={() => toggleFavorite(fav.code, fav.name, fav.tab)} className="ml-1">
                      <X className="w-3 h-3 text-amber-400 hover:text-amber-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최근 검색 */}
          {recentSearches.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">최근 검색</h3>
                </div>
                <button onClick={clearRecent} className="text-2xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  전체 삭제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 8).map((r) => (
                  <button
                    key={r.code}
                    onClick={() => {
                      setActiveTab(r.tab)
                      setSearchQuery(r.code)
                      doSearch(r.code, r.tab)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <span className="text-xs font-mono text-muted-foreground">{r.code}</span>
                    <span className="text-xs">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── 결과 테이블 ───── */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {activeTab === 'fee' ? '수가코드 목록' : activeTab === 'disease' ? '상병코드 목록' : '약품코드 목록'}
          </h3>
          <span className="text-2xs text-muted-foreground">{displayData.length}건</span>
        </div>
        <div className="overflow-x-auto">
          {activeTab === 'fee' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-4 font-medium w-8"></th>
                  <th className="text-left py-2.5 px-4 font-medium">코드</th>
                  <th className="text-left py-2.5 px-4 font-medium">항목명</th>
                  <th className="text-left py-2.5 px-4 font-medium hidden sm:table-cell">분류</th>
                  <th className="text-right py-2.5 px-4 font-medium">단가</th>
                  <th className="text-center py-2.5 px-4 font-medium">보험유형</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(displayData as FeeCode[]).map((item) => {
                  const ins = insuranceTypeLabels[item.insurance_type] || insuranceTypeLabels.COVERED
                  return (
                    <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <button onClick={() => toggleFavorite(item.code, item.name, 'fee')}>
                          {isFavorite(item.code) ? (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <Star className="w-4 h-4 text-muted-foreground/40 hover:text-amber-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item.code}</td>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{item.category}</td>
                      <td className="py-3 px-4 text-right font-semibold">{item.unit_price.toLocaleString()}원</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${ins.color} ${ins.bg}`}>
                          {ins.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'disease' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-4 font-medium w-8"></th>
                  <th className="text-left py-2.5 px-4 font-medium">코드</th>
                  <th className="text-left py-2.5 px-4 font-medium">질환명</th>
                  <th className="text-center py-2.5 px-4 font-medium hidden sm:table-cell">장(Chapter)</th>
                  <th className="text-center py-2.5 px-4 font-medium">구분</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(displayData as DiseaseCode[]).map((item) => (
                  <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => toggleFavorite(item.code, item.name_kr, 'disease')}>
                        {isFavorite(item.code) ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Star className="w-4 h-4 text-muted-foreground/40 hover:text-amber-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item.code}</td>
                    <td className="py-3 px-4 font-medium">{item.name_kr}</td>
                    <td className="py-3 px-4 text-center text-xs text-muted-foreground hidden sm:table-cell">{item.chapter}</td>
                    <td className="py-3 px-4 text-center">
                      {item.is_chronic ? (
                        <span className="px-2 py-0.5 rounded-lg text-2xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20">만성</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-2xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-900/20">급성</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'drug' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-4 font-medium w-8"></th>
                  <th className="text-left py-2.5 px-4 font-medium">코드</th>
                  <th className="text-left py-2.5 px-4 font-medium">제품명</th>
                  <th className="text-left py-2.5 px-4 font-medium hidden sm:table-cell">주성분</th>
                  <th className="text-right py-2.5 px-4 font-medium">보험가</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(displayData as DrugCode[]).map((item) => (
                  <tr key={item.code} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => toggleFavorite(item.code, item.product_name, 'drug')}>
                        {isFavorite(item.code) ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Star className="w-4 h-4 text-muted-foreground/40 hover:text-amber-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item.code}</td>
                    <td className="py-3 px-4 font-medium">{item.product_name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{item.ingredient_name}</td>
                    <td className="py-3 px-4 text-right font-semibold">{item.insurance_price.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {displayData.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <div className="font-semibold text-muted-foreground">검색 결과가 없습니다</div>
            <div className="text-sm text-muted-foreground mt-1">다른 키워드로 검색해 보세요</div>
          </div>
        )}
      </div>

      {/* ───── 조합 검증기 ───── */}
      <div className="card p-5 border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">코드 조합 검증기</h3>
          <Sparkles className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          상병코드와 시술/검사 코드 조합의 청구 적합성을 AI가 사전 검증합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">상병코드 (주상병)</label>
            <input
              type="text"
              placeholder="예: J06.9"
              value={diagnosisCode}
              onChange={(e) => setDiagnosisCode(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">시술/검사 코드 (쉼표 구분)</label>
            <input
              type="text"
              placeholder="예: AA157, D2200, HA010"
              value={treatmentCodes}
              onChange={(e) => setTreatmentCodes(e.target.value)}
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleValidate}
              disabled={validating || !diagnosisCode.trim() || !treatmentCodes.trim()}
              className="btn-primary btn-sm w-full justify-center disabled:opacity-50"
            >
              {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              검증
            </button>
          </div>
        </div>

        {/* 검증 결과 */}
        {validationResult && (
          <div className={`p-4 rounded-xl border ${
            validationResult.valid
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
              : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">적합 - 통과 예상</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-red-700 dark:text-red-400">주의 - 삭감 위험</span>
                </>
              )}
              <span className={`ml-auto text-sm font-bold ${
                validationResult.rejection_rate >= 20 ? 'text-red-500' : validationResult.rejection_rate >= 10 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                삭감률 {validationResult.rejection_rate}%
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">{validationResult.details}</p>

            {validationResult.warnings.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {validationResult.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

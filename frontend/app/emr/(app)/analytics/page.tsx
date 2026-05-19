'use client'

/**
 * EMR 인사이트 — 시술 카테고리 매출 분포, 내원경로 트리, 담당의 매출, 일별 추이.
 * 팔레트의 "인사이트" 대시보드 대응.
 */
import { useEffect, useState } from 'react'
import {
  PieChart as PieIcon, TrendingUp, Users, Calendar, Loader2, ChevronRight, ChevronDown,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import ModuleHeader from '@/components/emr/ModuleHeader'

interface CategoryRevenue {
  category: string
  count: number
  revenue: number
  pct: number
}

interface InflowNode {
  name: string
  count: number
  pct?: number
  children?: { name: string; count: number }[]
}

interface DoctorRow {
  doctor_name: string
  visits: number
  revenue: number
}

interface DayRow {
  date: string
  visits: number
  revenue: number
  new_patients: number
  return_patients: number
}

const formatKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`

const CAT_LABEL: Record<string, string> = {
  LIFTING: '리프팅', SKIN: '피부관리', LASER: '레이저', BOTOX: '보톡스',
  FILLER: '필러', HAIR_REMOVAL: '제모', SCAR: '흉터/모공',
  SURGERY: '성형', PHYSIO: '도수치료', OTHER: '기타', MISC: '미분류',
}

const CAT_COLOR: Record<string, string> = {
  LIFTING: '#a855f7', SKIN: '#3b82f6', LASER: '#f43f5e', BOTOX: '#10b981',
  FILLER: '#ec4899', HAIR_REMOVAL: '#f59e0b', SCAR: '#f97316',
  SURGERY: '#ef4444', PHYSIO: '#14b8a6', OTHER: '#64748b', MISC: '#94a3b8',
}


export default function AnalyticsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)
  const [start, setStart] = useState(monthAgo)
  const [end, setEnd] = useState(today)

  const [cats, setCats] = useState<{ total_revenue: number; categories: CategoryRevenue[] } | null>(null)
  const [inflow, setInflow] = useState<{ total_patients: number; tree: InflowNode[] } | null>(null)
  const [doctors, setDoctors] = useState<DoctorRow[]>([])
  const [days, setDays] = useState<DayRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        apiClient.get('/emr/analytics/category-revenue', { params: { start, end } }),
        apiClient.get('/emr/analytics/inflow-tree', { params: { start, end } }),
        apiClient.get('/emr/analytics/doctor-revenue', { params: { start, end } }),
        apiClient.get('/emr/analytics/daily-trend', { params: { start, end } }),
      ])
      setCats(r1.data)
      setInflow(r2.data)
      setDoctors(r3.data.doctors || [])
      setDays(r4.data.days || [])
    } catch (e) {
      // 데이터 없음 — 빈 상태
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [start, end])

  return (
    <div>
      <ModuleHeader
        moduleKey="reports"
        title="EMR 인사이트"
        subtitle="시술 카테고리·내원경로·담당의·일별 추이 한 화면"
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 기간 */}
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">기간</span>
          <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
          <span className="text-muted-foreground">~</span>
          <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
          <div className="flex gap-1 ml-auto">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setStart(new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10))
                  setEnd(today)
                }}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/70"
              >최근 {d}일</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : (
          <>
            {/* 시술 카테고리 매출 */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <PieIcon className="w-4 h-4" /> 시술 카테고리별 매출 분포
                </h3>
                <p className="text-sm text-muted-foreground">
                  총 매출 <span className="font-semibold text-foreground">{formatKRW(cats?.total_revenue || 0)}</span>
                </p>
              </div>
              {!cats || cats.categories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">기간 내 진료 항목 데이터가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {cats.categories.map((c) => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="w-24 text-sm">{CAT_LABEL[c.category] || c.category}</span>
                      <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.pct}%`, background: CAT_COLOR[c.category] || '#64748b' }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">{c.pct}%</span>
                      <span className="text-sm font-semibold w-28 text-right">{formatKRW(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 내원경로 트리 */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" /> 내원경로 분석
                </h3>
                <p className="text-sm text-muted-foreground">
                  총 {inflow?.total_patients || 0}명
                </p>
              </div>
              {!inflow || inflow.tree.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">기간 내 신규 환자가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {inflow.tree.map((node) => <InflowTreeNode key={node.name} node={node} />)}
                </div>
              )}
            </div>

            {/* 담당의 매출 */}
            <div className="card p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" /> 담당의별 매출
              </h3>
              {doctors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">기간 내 진료 데이터가 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-2">담당의</th>
                      <th className="py-2 text-right">방문 수</th>
                      <th className="py-2 text-right">매출</th>
                      <th className="py-2 text-right">방문당 매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => (
                      <tr key={d.doctor_name} className="border-b border-border/40">
                        <td className="py-2">{d.doctor_name}</td>
                        <td className="py-2 text-right">{d.visits.toLocaleString()}</td>
                        <td className="py-2 text-right font-semibold">{formatKRW(d.revenue)}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {d.visits ? formatKRW(Math.round(d.revenue / d.visits)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 일별 추이 */}
            <div className="card p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" /> 일별 매출·방문 추이
              </h3>
              {days.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">기간 내 진료 데이터가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 min-w-[600px] h-40 border-b border-border pb-2">
                    {(() => {
                      const max = Math.max(1, ...days.map((d) => d.revenue))
                      return days.map((d) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="text-[10px] text-muted-foreground mb-1 opacity-0 group-hover:opacity-100">
                            {formatKRW(d.revenue)}
                          </div>
                          <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.revenue / max) * 100}%` }} />
                          <div className="text-[10px] text-muted-foreground mt-1">{d.date.slice(5)}</div>
                        </div>
                      ))
                    })()}
                  </div>
                  <table className="w-full text-xs mt-4">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="py-1.5">일자</th>
                        <th className="py-1.5 text-right">방문</th>
                        <th className="py-1.5 text-right">신규</th>
                        <th className="py-1.5 text-right">재방문</th>
                        <th className="py-1.5 text-right">매출</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((d) => (
                        <tr key={d.date} className="border-b border-border/40">
                          <td className="py-1.5">{d.date}</td>
                          <td className="py-1.5 text-right">{d.visits}</td>
                          <td className="py-1.5 text-right text-blue-600">{d.new_patients}</td>
                          <td className="py-1.5 text-right text-muted-foreground">{d.return_patients}</td>
                          <td className="py-1.5 text-right font-semibold">{formatKRW(d.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


function InflowTreeNode({ node }: { node: InflowNode }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 1
  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={`w-full flex items-center gap-2 py-2 text-left ${hasChildren ? 'cursor-pointer hover:bg-muted/30' : ''} rounded px-2`}
      >
        {hasChildren ? (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <span className="w-4" />}
        <span className="font-medium">{node.name}</span>
        <span className="text-sm text-muted-foreground">{node.count}명</span>
        {node.pct !== undefined && (
          <span className="text-xs text-muted-foreground ml-auto">{node.pct}%</span>
        )}
      </button>
      {open && node.children && node.children.length > 0 && (
        <div className="ml-8 space-y-1 border-l-2 border-border pl-3">
          {node.children.map((c) => (
            <div key={c.name} className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">{c.name}</span>
              <span className="font-medium">{c.count}명</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

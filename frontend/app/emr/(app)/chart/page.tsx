'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Stethoscope, Plus, FileText, Calendar, Loader2, Search, X } from 'lucide-react'
import { visitService, VisitListItem } from '@/lib/api/emr'

export default function ChartListPage() {
  const [search, setSearch] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visitType, setVisitType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', search, diagnosis, dateFrom, dateTo, visitType, statusFilter],
    queryFn: () => visitService.list({
      page_size: 50,
      search: search || undefined,
      diagnosis: diagnosis || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      visit_type: visitType || undefined,
      status: statusFilter || undefined,
    }),
  })

  const hasFilters = search || diagnosis || dateFrom || dateTo || visitType || statusFilter
  const clearFilters = () => {
    setSearch(''); setDiagnosis(''); setDateFrom(''); setDateTo(''); setVisitType(''); setStatusFilter('')
  }

  const { data: stats } = useQuery({
    queryKey: ['visit-stats'],
    queryFn: () => visitService.stats(),
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">전자차트</h1>
            <p className="text-sm text-muted-foreground">진료 기록 — SOAP · 활력징후 · 진단 · 시술</p>
          </div>
        </div>
        <Link href="/emr/chart/new" className="btn-primary">
          <Plus className="w-4 h-4" /> 신규 진료
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">오늘 진료</div>
          <div className="text-3xl font-bold mt-1">{stats?.today_visits ?? '-'}건</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">이번 달 진료</div>
          <div className="text-3xl font-bold mt-1">{stats?.month_visits ?? '-'}건</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">전체 기록</div>
          <div className="text-3xl font-bold mt-1">{visits?.length ?? '-'}건</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> 진료 기록</h2>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs">
              <X className="w-3 h-3" /> 필터 초기화
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-9 text-sm"
              placeholder="주소·차트번호 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input
            className="input text-sm"
            placeholder="진단명·KCD 코드"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
          <input type="date" className="input text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="시작일" />
          <input type="date" className="input text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="종료일" />
          <select className="input text-sm" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
            <option value="">전체</option>
            <option value="INITIAL">초진</option>
            <option value="REVISIT">재진</option>
            <option value="CHECKUP">검진</option>
          </select>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {!isLoading && (visits?.length ?? 0) === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>아직 진료 기록이 없습니다.</p>
            <Link href="/emr/chart/new" className="btn-primary mt-3 inline-flex">
              <Plus className="w-4 h-4" /> 첫 진료 기록 작성
            </Link>
          </div>
        )}
        {!isLoading && (visits?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 px-2">진료일</th>
                  <th className="py-2 px-2">차트번호</th>
                  <th className="py-2 px-2">구분</th>
                  <th className="py-2 px-2">주소</th>
                  <th className="py-2 px-2">진단</th>
                  <th className="py-2 px-2 text-right">금액</th>
                  <th className="py-2 px-2 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {visits?.map((v: VisitListItem) => (
                  <tr
                    key={v.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    onClick={() => (window.location.href = `/emr/chart/${v.id}`)}
                  >
                    <td className="py-2 px-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {v.visit_date}
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">{v.chart_no || '-'}</td>
                    <td className="py-2 px-2">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {v.visit_type === 'INITIAL' ? '초진' : v.visit_type === 'REVISIT' ? '재진' : '검진'}
                      </span>
                    </td>
                    <td className="py-2 px-2 truncate max-w-[200px]">{v.chief_complaint}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{v.primary_diagnosis || '-'}</td>
                    <td className="py-2 px-2 text-right font-medium">{v.total_amount.toLocaleString()}원</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        v.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700'
                          : v.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {v.status === 'COMPLETED' ? '완료' : v.status === 'IN_PROGRESS' ? '진행중' : v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

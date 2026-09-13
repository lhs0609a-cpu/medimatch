'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Printer } from 'lucide-react'
import { visitService } from '@/lib/api/emr'
import ModuleHeader from '@/components/emr/ModuleHeader'
import QueryState from '@/components/emr/QueryState'

export default function ReportsPage() {
  const [months, setMonths] = useState(6)
  const query = useQuery({ queryKey: ['visit-dashboard', months], queryFn: () => visitService.dashboard(months) })
  const data = query.data
  const exportCsv = () => {
    if (!data) return
    const rows = [['월', '진료 건수', '월별 고유 환자 수', '수납액'], ...data.monthly.map(m => [m.month, m.visits, m.patients, m.revenue])]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'mediplaton-report-' + months + 'months.csv'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const total = data?.monthly.reduce((s, m) => ({ visits: s.visits + m.visits, revenue: s.revenue + m.revenue }), { visits: 0, revenue: 0 })
  const max = Math.max(1, ...(data?.monthly.map(m => m.visits) || []))
  return <div className="mx-auto max-w-7xl space-y-6">
    <ModuleHeader moduleKey="reports" title="진료 리포트" subtitle="저장된 진료 기록과 수납 내역으로 집계합니다." actions={<div className="flex gap-2 print:hidden"><button className="btn-secondary" disabled={!data} onClick={exportCsv}><Download className="h-4 w-4" /> CSV</button><button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> 인쇄</button></div>} />
    <div className="flex items-center gap-3 print:hidden"><label htmlFor="report-period" className="text-sm font-medium">조회 기간</label><select id="report-period" className="input w-auto" value={months} onChange={e => setMonths(Number(e.target.value))}>{[1, 3, 6, 12, 24].map(n => <option key={n} value={n}>최근 {n}개월</option>)}</select></div>
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} />
    {data && <><div className="grid gap-4 sm:grid-cols-3">{[{ label: '전체 진료', value: (total?.visits || 0).toLocaleString() + '건' }, { label: '수납액 합계', value: (total?.revenue || 0).toLocaleString() + '원' }, { label: '집계 시작일', value: data.start }].map(s => <div key={s.label} className="card p-6"><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-3 text-2xl font-bold">{s.value}</p></div>)}</div>
      <section className="card p-6"><h2 className="mb-6 font-bold">월별 진료 추이</h2>{data.monthly.map(m => <div key={m.month} className="mb-4 flex items-center gap-4 text-sm"><span className="w-16 shrink-0 tabular-nums">{m.month}</span><div className="h-7 flex-1 overflow-hidden rounded bg-secondary"><div className="h-full rounded bg-blue-500" style={{ width: m.visits / max * 100 + '%' }} /></div><span className="w-14 text-right tabular-nums">{m.visits}건</span></div>)}</section>
      <div className="grid gap-6 lg:grid-cols-2"><section className="card overflow-x-auto p-6"><h2 className="mb-4 font-bold">월별 운영 지표</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3">월</th><th>진료</th><th>고유 환자</th><th className="text-right">수납액</th></tr></thead><tbody>{data.monthly.map(m => <tr key={m.month} className="border-b border-border/50"><td className="py-3">{m.month}</td><td>{m.visits}</td><td>{m.patients}</td><td className="text-right">{m.revenue.toLocaleString()}원</td></tr>)}</tbody></table><p className="mt-4 text-xs text-muted-foreground">환자 수는 각 월의 고유 환자입니다. 수납액은 청구서의 누적 결제액을 청구일 기준으로 집계합니다.</p></section>
      <section className="card p-6"><h2 className="mb-4 font-bold">주요 진단</h2>{data.top_diagnoses.map(d => <div key={d.code + d.name} className="flex justify-between gap-3 border-b border-border/50 py-3 text-sm"><div><span className="mr-2 text-xs text-blue-600">{d.code}</span>{d.name}</div><span className="shrink-0">{d.count}건</span></div>)}{data.top_diagnoses.length === 0 && <p className="py-8 text-sm text-muted-foreground">등록된 진단이 없습니다.</p>}</section></div></>}
  </div>
}

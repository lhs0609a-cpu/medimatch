'use client';

import { useState, useEffect } from 'react';
import { GitBranch, LayoutGrid, List, RefreshCw } from 'lucide-react';
import DealPipelineKanban from '@/components/broker/DealPipelineKanban';
import DealCard from '@/components/broker/DealCard';

interface Deal {
  id: string; deal_number: string; title: string; status: string; close_reason?: string;
  broker_id?: number; broker_name?: string; expected_commission?: number; actual_commission?: number;
  lead_score?: number; circumvention_flag?: boolean; created_at?: string; updated_at?: string;
}

const STATUS_LABELS: Record<string, string> = {
  LEAD: '리드', CONTACTED: '컨택', VIEWING_SCHEDULED: '내방예정', VIEWED: '내방완료',
  NEGOTIATING: '협상중', CONTRACT_PENDING: '계약대기', CONTRACTED: '계약완료',
  CLOSED_WON: '성사', CLOSED_LOST: '종료',
};

export default function BrokerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '100' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${apiUrl}/admin/broker/deals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setDeals(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeals(); }, [page, statusFilter]);

  const fmt = (n: number) => n?.toLocaleString('ko-KR') || '0';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">딜 파이프라인</h1>
            <p className="text-sm text-gray-500">총 {total}건</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">전체 상태</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('kanban')} className={`p-2 rounded-md ${view === 'kanban' ? 'bg-white shadow-sm' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('table')} className={`p-2 rounded-md ${view === 'table' ? 'bg-white shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={fetchDeals} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">로딩 중...</div>
      ) : view === 'kanban' ? (
        <DealPipelineKanban deals={deals} onDealClick={(id) => setSelectedDeal(id)} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">딜번호</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">제목</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">중개사</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">커미션</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">수정일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDeal(d.id)}>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{d.deal_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{STATUS_LABELS[d.status] || d.status}</span></td>
                  <td className="px-4 py-3 text-gray-600">{d.broker_name || '-'}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{fmt(d.actual_commission || d.expected_commission || 0)}원</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{d.updated_at ? new Date(d.updated_at).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
              {deals.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">딜이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

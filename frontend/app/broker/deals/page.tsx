'use client';

import { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import DealCard from '@/components/broker/DealCard';

interface Deal {
  id: string; deal_number: string; title: string; status: string; close_reason?: string;
  expected_commission?: number; actual_commission?: number; lead_score?: number;
  circumvention_flag?: boolean; created_at?: string; updated_at?: string;
}

const STATUS_TABS = [
  { key: '', label: '전체' },
  { key: 'LEAD', label: '리드' },
  { key: 'CONTACTED', label: '컨택' },
  { key: 'VIEWING_SCHEDULED', label: '내방예정' },
  { key: 'VIEWED', label: '내방완료' },
  { key: 'NEGOTIATING', label: '협상중' },
  { key: 'CONTRACT_PENDING', label: '계약대기' },
  { key: 'CONTRACTED', label: '계약완료' },
  { key: 'CLOSED_WON', label: '성사' },
  { key: 'CLOSED_LOST', label: '종료' },
];

export default function BrokerDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (status) params.set('status', status);
      const res = await fetch(`${apiUrl}/broker/deals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setDeals(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeals(); }, [page, status]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">내 딜</h1>
          <p className="text-sm text-gray-500">총 {total}건</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              status === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {deals.map((deal) => (
            <a key={deal.id} href={`/broker/deals/${deal.id}`}>
              <DealCard deal={deal} />
            </a>
          ))}
          {deals.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">딜이 없습니다</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

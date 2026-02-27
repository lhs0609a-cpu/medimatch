'use client';

import { useState, useEffect } from 'react';
import { Target, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Doctor {
  id: string; name: string; specialty: string; opening_region: string;
  opening_status: string; expected_opening_date: string; deal_count: number;
}

const STATUS_LABELS: Record<string, string> = { PLANNING: '계획 중', SEARCHING: '매물 탐색', NEGOTIATING: '협상 중' };

export default function OpeningTrackerPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (regionFilter) params.set('region', regionFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${apiUrl}/admin/broker/doctors/opening-status?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setDoctors(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, [page, statusFilter]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">개원 진행 추적</h1>
          <p className="text-sm text-gray-500">개원 준비 중인 의사 {total}명</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()} placeholder="지역 검색..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">전체 상태</option>
          <option value="PLANNING">계획 중</option>
          <option value="SEARCHING">매물 탐색</option>
          <option value="NEGOTIATING">협상 중</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">진료과</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">희망 지역</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">예상 개원</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">딜 수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {doctors.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-600">{d.specialty || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{d.opening_region || '-'}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{STATUS_LABELS[d.opening_status] || d.opening_status || '-'}</span></td>
                <td className="px-4 py-3 text-gray-500">{d.expected_opening_date || '-'}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-600">{d.deal_count}</td>
              </tr>
            ))}
            {doctors.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">{loading ? '로딩 중...' : '개원 준비 의사가 없습니다'}</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

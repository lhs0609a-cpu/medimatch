'use client';

import { useState, useEffect } from 'react';
import { UserCog, Plus, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface Broker {
  id: number; user_id: string; display_name: string; phone: string; email: string;
  tier: string; status: string; total_deals: number; closed_won_deals: number;
  current_active_deals: number; total_commission_earned: number; commission_rate: number;
  is_verified: boolean; assigned_regions: string[]; created_at: string;
}

const TIER_LABELS: Record<string, string> = { JUNIOR: '주니어', SENIOR: '시니어', TEAM_LEAD: '팀장', DIRECTOR: '디렉터' };
const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-yellow-100 text-yellow-700', ACTIVE: 'bg-green-100 text-green-700', SUSPENDED: 'bg-red-100 text-red-700', TERMINATED: 'bg-gray-100 text-gray-700' };

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ user_id: '', display_name: '', phone: '', email: '', tier: 'JUNIOR', commission_rate: 60 });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${apiUrl}/admin/broker/brokers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setBrokers(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBrokers(); }, [page, statusFilter]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/admin/broker/brokers`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowCreate(false); fetchBrokers(); setForm({ user_id: '', display_name: '', phone: '', email: '', tier: 'JUNIOR', commission_rate: 60 }); }
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">중개사 관리</h1>
            <p className="text-sm text-gray-500">총 {total}명</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 중개사 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchBrokers()} placeholder="이름, 전화, 이메일 검색..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="PENDING">대기</option>
          <option value="SUSPENDED">정지</option>
          <option value="TERMINATED">해지</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">등급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">딜</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">성사</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">커미션</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">지역</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">검증</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {brokers.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <div><span className="font-medium text-gray-900">{b.display_name}</span></div>
                  <div className="text-xs text-gray-400">{b.phone}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{TIER_LABELS[b.tier] || b.tier}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || ''}`}>{b.status}</span></td>
                <td className="px-4 py-3 text-right text-gray-600">{b.total_deals}</td>
                <td className="px-4 py-3 text-right text-gray-600">{b.closed_won_deals}</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">{fmt(b.total_commission_earned)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{(b.assigned_regions || []).join(', ') || '-'}</td>
                <td className="px-4 py-3 text-center">{b.is_verified ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
              </tr>
            ))}
            {brokers.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">중개사가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">중개사 등록</h2>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">사용자 ID (UUID)</label><input value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">이름</label><input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">전화</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">이메일</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">등급</label><select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="JUNIOR">주니어</option><option value="SENIOR">시니어</option><option value="TEAM_LEAD">팀장</option><option value="DIRECTOR">디렉터</option></select></div>
                <div><label className="block text-xs text-gray-500 mb-1">커미션율 (%)</label><input type="number" value={form.commission_rate} onChange={e => setForm({...form, commission_rate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">취소</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

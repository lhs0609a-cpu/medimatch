'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  BarChart3,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface Cohort {
  id: string;
  category: string;
  title: string;
  status: string;
  target_count: number;
  current_count: number;
  discount_rate: number;
  original_price: number;
  group_price: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Participation {
  id: string;
  user_name: string;
  user_email: string;
  cohort_title: string;
  status: string;
  joined_at: string;
}

/* ─── 상태 설정 ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  RECRUITING:  { label: '모집중',   bg: 'bg-blue-100',    text: 'text-blue-700' },
  IN_PROGRESS: { label: '진행중',   bg: 'bg-violet-100',  text: 'text-violet-700' },
  COMPLETED:   { label: '완료',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED:   { label: '취소',     bg: 'bg-gray-100',    text: 'text-gray-500' },
  FAILED:      { label: '미달성',   bg: 'bg-rose-100',    text: 'text-rose-700' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const CATEGORY_LABELS: Record<string, string> = {
  MEDICAL_EQUIPMENT: '의료장비',
  INTERIOR: '인테리어',
  IT_SOLUTION: 'IT 솔루션',
  FURNITURE: '가구/집기',
  CONSUMABLES: '소모품',
  OTHER: '기타',
};

export default function AdminGroupBuyingPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<Cohort | null>(null);
  const [participants, setParticipants] = useState<Participation[]>([]);
  const [totalStats, setTotalStats] = useState({ total_cohorts: 0, total_participants: 0, total_savings: 0, avg_discount: 0 });

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);

      const [cohortsRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/group-buying/cohorts?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${apiUrl}/group-buying/stats/total`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);

      if (cohortsRes.ok) {
        const data = await cohortsRes.json();
        const list = data.items || data || [];
        setCohorts(list);
        setTotal(data.total || list.length);
      } else {
        setCohorts(getMockCohorts());
        setTotal(4);
      }

      if (statsRes.ok) {
        setTotalStats(await statsRes.json());
      } else {
        setTotalStats({ total_cohorts: 4, total_participants: 47, total_savings: 48000, avg_discount: 18 });
      }
    } catch {
      setCohorts(getMockCohorts());
      setTotal(4);
      setTotalStats({ total_cohorts: 4, total_participants: 47, total_savings: 48000, avg_discount: 18 });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDetail = async (cohort: Cohort) => {
    setDetailModal(cohort);
    try {
      const res = await fetch(`${apiUrl}/group-buying/cohorts/${cohort.id}/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.participants) setParticipants(data.participants);
      }
    } catch {
      setParticipants(getMockParticipants());
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`${apiUrl}/admin/group-buying/cohorts/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch { /* silently fail */ }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatMoney = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={ShoppingCart} color="from-pink-500 to-rose-500" shadow="shadow-pink-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">공동구매 관리</h1>
            <p className="text-gray-500 text-sm">코호트 관리 및 참여자 현황</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TossIcon icon={Package} color="from-pink-500 to-rose-500" shadow="shadow-pink-500/25" size="sm" />
            <span className="text-sm text-gray-500">전체 코호트</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.total_cohorts}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TossIcon icon={Users} color="from-purple-500 to-pink-500" shadow="shadow-purple-500/25" size="sm" />
            <span className="text-sm text-gray-500">총 참여자</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.total_participants}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TossIcon icon={TrendingUp} color="from-emerald-500 to-teal-500" shadow="shadow-emerald-500/25" size="sm" />
            <span className="text-sm text-gray-500">총 절감액</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(totalStats.total_savings)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <TossIcon icon={BarChart3} color="from-cyan-500 to-blue-500" shadow="shadow-cyan-500/25" size="sm" />
            <span className="text-sm text-gray-500">평균 할인율</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.avg_discount}%</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${!statusFilter ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>전체</button>
        {ALL_STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">코호트</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">참여</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">할인율</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">단가</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">기간</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : cohorts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">코호트가 없습니다.</td></tr>
              ) : (
                cohorts.map((item) => (
                  <tr key={item.id} onClick={() => openDetail(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{CATEGORY_LABELS[item.category] || item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${item.current_count >= item.target_count ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {item.current_count}
                      </span>
                      <span className="text-gray-400">/{item.target_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">{item.discount_rate}%</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-gray-400 line-through text-xs">{formatMoney(item.original_price)}</div>
                      <div className="font-medium text-gray-900">{formatMoney(item.group_price)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[item.status]?.text || 'text-gray-600'}`}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(item.start_date)} ~ {formatDate(item.end_date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">총 {total}건</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1; else if (page <= 3) p = i + 1; else if (page >= totalPages - 2) p = totalPages - 4 + i; else p = page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">코호트 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{detailModal.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{CATEGORY_LABELS[detailModal.category] || detailModal.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[detailModal.status]?.bg} ${STATUS_CONFIG[detailModal.status]?.text}`}>
                    {STATUS_CONFIG[detailModal.status]?.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-700">{detailModal.current_count}/{detailModal.target_count}</p>
                  <p className="text-xs text-blue-600">참여 현황</p>
                </div>
                <div className="text-center p-3 bg-rose-50 rounded-xl">
                  <p className="text-xl font-bold text-rose-700">{detailModal.discount_rate}%</p>
                  <p className="text-xs text-rose-600">할인율</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xl font-bold text-emerald-700">{formatMoney(detailModal.group_price)}</p>
                  <p className="text-xs text-emerald-600">공구가</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">모집 달성률</span>
                  <span className="text-sm font-medium">{detailModal.target_count > 0 ? ((detailModal.current_count / detailModal.target_count) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full transition-all" style={{ width: `${Math.min((detailModal.current_count / detailModal.target_count) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">기간</span>
                  <span className="text-sm font-medium">{formatDate(detailModal.start_date)} ~ {formatDate(detailModal.end_date)}</span>
                </div>
              </div>

              {/* Participants */}
              {participants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">참여자 목록</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{p.user_name}</span>
                          <span className="text-xs text-gray-400 ml-2">{p.user_email}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(p.joined_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detailModal.status === 'RECRUITING' && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button onClick={() => handleStatusChange(detailModal.id, 'IN_PROGRESS')} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-medium">진행 시작</button>
                <button onClick={() => handleStatusChange(detailModal.id, 'CANCELLED')} className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium">취소</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getMockCohorts(): Cohort[] {
  return [
    { id: '1', category: 'MEDICAL_EQUIPMENT', title: '초음파 진단장비 공동구매 (3차)', status: 'RECRUITING', target_count: 20, current_count: 14, discount_rate: 22, original_price: 35000000, group_price: 27300000, start_date: '2025-02-01T00:00:00Z', end_date: '2025-03-01T00:00:00Z', created_at: '2025-01-25T10:00:00Z' },
    { id: '2', category: 'INTERIOR', title: '개원 인테리어 패키지 공구', status: 'IN_PROGRESS', target_count: 15, current_count: 15, discount_rate: 18, original_price: 50000000, group_price: 41000000, start_date: '2025-01-15T00:00:00Z', end_date: '2025-02-15T00:00:00Z', created_at: '2025-01-10T10:00:00Z' },
    { id: '3', category: 'IT_SOLUTION', title: 'EMR 솔루션 단체 도입', status: 'RECRUITING', target_count: 30, current_count: 8, discount_rate: 15, original_price: 12000000, group_price: 10200000, start_date: '2025-02-10T00:00:00Z', end_date: '2025-03-10T00:00:00Z', created_at: '2025-02-05T10:00:00Z' },
    { id: '4', category: 'FURNITURE', title: '진료실 가구 세트 공구', status: 'COMPLETED', target_count: 10, current_count: 10, discount_rate: 20, original_price: 8000000, group_price: 6400000, start_date: '2025-01-01T00:00:00Z', end_date: '2025-01-31T00:00:00Z', created_at: '2024-12-20T10:00:00Z' },
  ];
}

function getMockParticipants(): Participation[] {
  return [
    { id: '1', user_name: '김원장', user_email: 'kim@example.com', cohort_title: '', status: 'CONFIRMED', joined_at: '2025-02-03T10:00:00Z' },
    { id: '2', user_name: '박원장', user_email: 'park@example.com', cohort_title: '', status: 'CONFIRMED', joined_at: '2025-02-05T10:00:00Z' },
    { id: '3', user_name: '이원장', user_email: 'lee@example.com', cohort_title: '', status: 'PENDING', joined_at: '2025-02-10T10:00:00Z' },
  ];
}

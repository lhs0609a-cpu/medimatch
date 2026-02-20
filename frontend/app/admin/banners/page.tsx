'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Megaphone,
  Image,
  DollarSign,
  Eye,
  MousePointer,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface BannerAd {
  id: string;
  title: string;
  partner_name: string;
  position: string;
  image_url?: string;
  link_url?: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

interface RevenueStats {
  total_revenue: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
}

/* ─── 상태 설정 ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: '승인대기', bg: 'bg-amber-100',   text: 'text-amber-700' },
  APPROVED:  { label: '승인됨',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ACTIVE:    { label: '게재중',   bg: 'bg-blue-100',    text: 'text-blue-700' },
  PAUSED:    { label: '일시중지', bg: 'bg-gray-100',    text: 'text-gray-600' },
  REJECTED:  { label: '거절됨',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  ENDED:     { label: '종료',     bg: 'bg-gray-100',    text: 'text-gray-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const POSITION_LABELS: Record<string, string> = {
  HOME_TOP: '홈 상단',
  SIDEBAR: '사이드바',
  SEARCH_RESULT: '검색결과',
  PARTNERS_LIST: '파트너 목록',
};

export default function AdminBannersPage() {
  const [items, setItems] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<BannerAd | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);

      const [adsRes, revenueRes] = await Promise.all([
        fetch(`${apiUrl}/banner/admin/ads?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${apiUrl}/banner/admin/ads/revenue`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);

      if (adsRes.ok) {
        const data = await adsRes.json();
        setItems(data.items || data || []);
        setTotal(data.total || (Array.isArray(data) ? data.length : 0));
        if (data.status_counts) setStatusCounts(data.status_counts);
      } else {
        setItems(getMockData());
        setTotal(4);
        setStatusCounts({ PENDING: 2, ACTIVE: 1, PAUSED: 1, REJECTED: 0, ENDED: 0, APPROVED: 0 });
      }

      if (revenueRes.ok) {
        setRevenue(await revenueRes.json());
      } else {
        setRevenue({ total_revenue: 1250000, total_impressions: 45200, total_clicks: 1830, avg_ctr: 4.05 });
      }
    } catch {
      setItems(getMockData());
      setTotal(4);
      setRevenue({ total_revenue: 1250000, total_impressions: 45200, total_clicks: 1830, avg_ctr: 4.05 });
      setStatusCounts({ PENDING: 2, ACTIVE: 1, PAUSED: 1, REJECTED: 0, ENDED: 0, APPROVED: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await fetch(`${apiUrl}/banner/admin/ads/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      fetchData();
      if (detailModal?.id === id) setDetailModal({ ...detailModal, status: approved ? 'APPROVED' : 'REJECTED' });
    } catch { /* silently fail */ }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatMoney = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}만원` : `${n.toLocaleString()}원`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={Megaphone} color="from-orange-500 to-red-500" shadow="shadow-orange-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">배너 광고 관리</h1>
            <p className="text-gray-500 text-sm">배너 광고 승인 및 수익 관리</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Revenue Stats */}
      {revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TossIcon icon={DollarSign} color="from-green-500 to-emerald-500" shadow="shadow-green-500/25" size="sm" />
              <span className="text-sm text-gray-500">총 수익</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(revenue.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TossIcon icon={Eye} color="from-blue-500 to-indigo-500" shadow="shadow-blue-500/25" size="sm" />
              <span className="text-sm text-gray-500">총 노출</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{revenue.total_impressions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TossIcon icon={MousePointer} color="from-violet-500 to-purple-500" shadow="shadow-violet-500/25" size="sm" />
              <span className="text-sm text-gray-500">총 클릭</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{revenue.total_clicks.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <TossIcon icon={TrendingUp} color="from-emerald-500 to-teal-500" shadow="shadow-emerald-500/25" size="sm" />
              <span className="text-sm text-gray-500">평균 CTR</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{revenue.avg_ctr.toFixed(2)}%</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${!statusFilter ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
          전체
        </button>
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          return (
            <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">광고명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">파트너</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">위치</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">예산/소진</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">노출/클릭</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">배너 광고가 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} onClick={() => setDetailModal(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                    <td className="px-4 py-3 text-gray-600">{item.partner_name}</td>
                    <td className="px-4 py-3 text-gray-600">{POSITION_LABELS[item.position] || item.position}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-gray-900 font-medium">{formatMoney(item.budget)}</div>
                      <div className="text-xs text-gray-400">{formatMoney(item.spent)} 소진</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-gray-900">{item.impressions.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{item.clicks}클릭 ({item.ctr.toFixed(1)}%)</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[item.status]?.text || 'text-gray-600'}`}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">총 {total}건 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}건</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
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
              <h2 className="text-lg font-bold text-gray-900">배너 광고 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {detailModal.image_url && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img src={detailModal.image_url} alt={detailModal.title} className="w-full h-48 object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">광고명</p>
                  <p className="font-medium">{detailModal.title}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">파트너</p>
                  <p className="font-medium">{detailModal.partner_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">게재 위치</p>
                  <p className="font-medium">{POSITION_LABELS[detailModal.position] || detailModal.position}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">등록일</p>
                  <p className="font-medium">{formatDate(detailModal.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-700">{detailModal.impressions.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">노출</p>
                </div>
                <div className="text-center p-3 bg-violet-50 rounded-xl">
                  <p className="text-xl font-bold text-violet-700">{detailModal.clicks.toLocaleString()}</p>
                  <p className="text-xs text-violet-600">클릭</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-xl font-bold text-amber-700">{detailModal.ctr.toFixed(2)}%</p>
                  <p className="text-xs text-amber-600">CTR</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xl font-bold text-emerald-700">{formatMoney(detailModal.spent)}</p>
                  <p className="text-xs text-emerald-600">소진액</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-500">예산 소진율</span>
                  <span className="text-sm font-medium">{detailModal.budget > 0 ? ((detailModal.spent / detailModal.budget) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${detailModal.budget > 0 ? Math.min((detailModal.spent / detailModal.budget) * 100, 100) : 0}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">{formatMoney(detailModal.spent)}</span>
                  <span className="text-xs text-gray-400">{formatMoney(detailModal.budget)}</span>
                </div>
              </div>
            </div>

            {detailModal.status === 'PENDING' && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button onClick={() => handleApprove(detailModal.id, true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                  <CheckCircle className="w-4 h-4" />승인
                </button>
                <button onClick={() => handleApprove(detailModal.id, false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors">
                  <XCircle className="w-4 h-4" />거절
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getMockData(): BannerAd[] {
  return [
    { id: '1', title: '봄 개원 이벤트', partner_name: '메디인테리어', position: 'HOME_TOP', image_url: '', link_url: '', status: 'PENDING', budget: 500000, spent: 0, impressions: 0, clicks: 0, ctr: 0, created_at: '2025-02-17T10:00:00Z' },
    { id: '2', title: '의료장비 특가', partner_name: '메디장비', position: 'SIDEBAR', status: 'ACTIVE', budget: 1000000, spent: 450000, impressions: 32000, clicks: 1280, ctr: 4.0, created_at: '2025-02-10T10:00:00Z' },
    { id: '3', title: '세무 상담 프로모', partner_name: '메디세무', position: 'SEARCH_RESULT', status: 'PAUSED', budget: 300000, spent: 180000, impressions: 12000, clicks: 420, ctr: 3.5, created_at: '2025-02-05T10:00:00Z' },
    { id: '4', title: '컨설팅 무료 상담', partner_name: '개원플래닝', position: 'PARTNERS_LIST', status: 'PENDING', budget: 200000, spent: 0, impressions: 0, clicks: 0, ctr: 0, created_at: '2025-02-16T14:00:00Z' },
  ];
}

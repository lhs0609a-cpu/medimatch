'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  HeartHandshake,
  Star,
  MapPin,
  Shield,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface Partner {
  id: string;
  company_name: string;
  representative: string;
  category: string;
  region: string;
  phone?: string;
  email?: string;
  website?: string;
  is_verified: boolean;
  is_premium: boolean;
  rating: number;
  review_count: number;
  inquiry_count: number;
  status: string;
  created_at: string;
}

/* ─── 카테고리 / 상태 설정 ─── */
const CATEGORY_LABELS: Record<string, string> = {
  INTERIOR: '인테리어',
  MEDICAL_EQUIPMENT: '의료장비',
  CONSULTING: '개원 컨설팅',
  FINANCE: '금융/대출',
  MARKETING: '마케팅',
  LEGAL: '법률/세무',
  IT: 'IT/솔루션',
  OTHER: '기타',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:    { label: '활성',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PENDING:   { label: '대기',   bg: 'bg-amber-100',   text: 'text-amber-700' },
  SUSPENDED: { label: '정지',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  INACTIVE:  { label: '비활성', bg: 'bg-gray-100',    text: 'text-gray-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function AdminPartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<Partner | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (categoryFilter) params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const res = await fetch(`${apiUrl}/partners?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.items || data || [];
        setItems(list);
        setTotal(data.total || list.length);
      } else {
        setItems(getMockData());
        setTotal(5);
      }
    } catch {
      setItems(getMockData());
      setTotal(5);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, search, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await fetch(`${apiUrl}/admin/partners/${id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: verified }),
      });
      fetchData();
    } catch { /* silently fail */ }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const filteredItems = statusFilter ? items.filter((i) => i.status === statusFilter) : items;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={HeartHandshake} color="from-blue-500 to-blue-600" shadow="shadow-blue-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
            <p className="text-gray-500 text-sm">인테리어, 장비, 컨설팅 등 파트너 업체 관리</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">전체 파트너</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">인증 파트너</p>
          <p className="text-2xl font-bold text-emerald-600">{items.filter((i) => i.is_verified).length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">프리미엄</p>
          <p className="text-2xl font-bold text-amber-600">{items.filter((i) => i.is_premium).length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">총 문의</p>
          <p className="text-2xl font-bold text-blue-600">{items.reduce((a, b) => a + (b.inquiry_count || 0), 0)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="업체명, 대표자로 검색..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">전체 카테고리</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">검색</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">업체명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">지역</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">평점</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">문의</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">인증</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">파트너가 없습니다.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} onClick={() => setDetailModal(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.company_name}</span>
                        {item.is_premium && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">PRO</span>}
                      </div>
                      <div className="text-xs text-gray-400">{item.representative}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{CATEGORY_LABELS[item.category] || item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.region}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{item.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">({item.review_count})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.inquiry_count}</td>
                    <td className="px-4 py-3 text-center">
                      {item.is_verified ? <Shield className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">-</span>}
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
            <p className="text-sm text-gray-500">총 {total}건</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1; else if (page <= 3) p = i + 1; else if (page >= totalPages - 2) p = totalPages - 4 + i; else p = page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
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
              <h2 className="text-lg font-bold text-gray-900">파트너 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🤝</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{detailModal.company_name}</h3>
                    {detailModal.is_verified && <Shield className="w-5 h-5 text-emerald-500" />}
                    {detailModal.is_premium && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">PRO</span>}
                  </div>
                  <p className="text-gray-500">{detailModal.representative}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">지역</p>
                    <p className="font-medium">{detailModal.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">등록일</p>
                    <p className="font-medium">{formatDate(detailModal.created_at)}</p>
                  </div>
                </div>
                {detailModal.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">연락처</p>
                      <p className="font-medium">{detailModal.phone}</p>
                    </div>
                  </div>
                )}
                {detailModal.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">이메일</p>
                      <p className="font-medium">{detailModal.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-bold text-amber-700">{detailModal.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-amber-600">평점</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-700">{detailModal.review_count}</p>
                  <p className="text-xs text-blue-600">리뷰</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-700">{detailModal.inquiry_count}</p>
                  <p className="text-xs text-blue-600">문의</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {!detailModal.is_verified ? (
                <button onClick={() => { handleVerify(detailModal.id, true); setDetailModal({ ...detailModal, is_verified: true }); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                  <CheckCircle className="w-4 h-4" />인증 승인
                </button>
              ) : (
                <button onClick={() => { handleVerify(detailModal.id, false); setDetailModal({ ...detailModal, is_verified: false }); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors">
                  인증 해제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockData(): Partner[] {
  return [
    { id: '1', company_name: '메디인테리어', representative: '김대표', category: 'INTERIOR', region: '서울 강남구', phone: '02-1234-5678', email: 'info@mediinterior.com', is_verified: true, is_premium: true, rating: 4.8, review_count: 42, inquiry_count: 156, status: 'ACTIVE', created_at: '2024-06-15T10:00:00Z' },
    { id: '2', company_name: '메디장비솔루션', representative: '박대표', category: 'MEDICAL_EQUIPMENT', region: '서울 서초구', phone: '02-2345-6789', is_verified: true, is_premium: false, rating: 4.5, review_count: 28, inquiry_count: 89, status: 'ACTIVE', created_at: '2024-08-20T10:00:00Z' },
    { id: '3', company_name: '개원플래닝', representative: '이대표', category: 'CONSULTING', region: '경기 성남시', email: 'plan@opening.com', is_verified: false, is_premium: false, rating: 4.2, review_count: 15, inquiry_count: 34, status: 'PENDING', created_at: '2025-01-10T10:00:00Z' },
    { id: '4', company_name: '메디세무법인', representative: '최세무사', category: 'LEGAL', region: '서울 종로구', phone: '02-3456-7890', is_verified: true, is_premium: true, rating: 4.9, review_count: 56, inquiry_count: 203, status: 'ACTIVE', created_at: '2024-03-05T10:00:00Z' },
    { id: '5', company_name: '헬스마케팅', representative: '정대표', category: 'MARKETING', region: '서울 마포구', is_verified: false, is_premium: false, rating: 3.8, review_count: 8, inquiry_count: 12, status: 'ACTIVE', created_at: '2025-02-01T10:00:00Z' },
  ];
}

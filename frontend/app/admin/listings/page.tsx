'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardCheck,
  FileText,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface ListingItem {
  id: string;
  title: string;
  address: string;
  region_name: string;
  owner_email: string;
  owner_name: string;
  status: string;
  verification_status: string;
  rent_deposit: number | null;
  rent_monthly: number | null;
  area_pyeong: number | null;
  view_count: number;
  inquiry_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface ListingDetail {
  id: string;
  owner_id: string;
  title: string;
  building_name: string | null;
  address: string;
  region_name: string | null;
  floor: string | null;
  area_pyeong: number | null;
  area_m2: number | null;
  rent_deposit: number | null;
  rent_monthly: number | null;
  maintenance_fee: number | null;
  premium: number | null;
  preferred_tenants: string[];
  has_parking: boolean;
  parking_count: number;
  has_elevator: boolean;
  building_age: number | null;
  previous_use: string | null;
  description: string | null;
  features: string[];
  images: string[];
  status: string;
  verification_status: string;
  verification_docs: { type: string; url: string; uploaded_at: string }[];
  rejection_reason: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  verified_at: string | null;
  verified_by: string | null;
  is_public: boolean;
  view_count: number;
  inquiry_count: number;
  created_at: string | null;
  updated_at: string | null;
}

interface ListingStats {
  DRAFT: number;
  PENDING_REVIEW: number;
  ACTIVE: number;
  RESERVED: number;
  CONTRACTED: number;
  CLOSED: number;
  REJECTED: number;
}

// ============================================================
// Constants
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:          { label: '임시저장', bg: 'bg-gray-100',    text: 'text-gray-700' },
  PENDING_REVIEW: { label: '심사대기', bg: 'bg-orange-100',  text: 'text-orange-700' },
  ACTIVE:         { label: '활성',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  RESERVED:       { label: '예약됨',   bg: 'bg-amber-100',   text: 'text-amber-700' },
  CONTRACTED:     { label: '계약완료', bg: 'bg-violet-100',  text: 'text-violet-700' },
  CLOSED:         { label: '마감',     bg: 'bg-gray-100',    text: 'text-gray-500' },
  REJECTED:       { label: '거부됨',   bg: 'bg-rose-100',    text: 'text-rose-700' },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:          ['CLOSED'],
  PENDING_REVIEW: ['ACTIVE', 'REJECTED', 'CLOSED'],
  ACTIVE:         ['RESERVED', 'CONTRACTED', 'CLOSED'],
  RESERVED:       ['ACTIVE', 'CONTRACTED', 'CLOSED'],
  CONTRACTED:     ['CLOSED'],
  REJECTED:       ['PENDING_REVIEW', 'CLOSED'],
  CLOSED:         ['ACTIVE'],
};

const ALL_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'RESERVED', 'CONTRACTED', 'CLOSED', 'REJECTED'];

// ============================================================
// Component
// ============================================================

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [detailModal, setDetailModal] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null);
  const [statusChangeCurrent, setStatusChangeCurrent] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [dropdownId, setDropdownId] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${apiUrl}/landlord/admin/listings?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        setListings(data.items || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error('Failed to fetch listings:', e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, apiUrl]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // --- Detail modal ---
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailModal(null);
    try {
      const res = await fetch(`${apiUrl}/landlord/admin/listings/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setDetailModal(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Approve ---
  const handleApprove = async () => {
    if (!approveId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/landlord/admin/listings/${approveId}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_status: 'ACTIVE' }),
      });
      if (res.ok) {
        setApproveId(null);
        fetchListings();
      } else {
        const err = await res.json();
        alert(err.detail || '승인 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Reject ---
  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/landlord/admin/listings/${rejectId}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_status: 'REJECTED', reason: rejectReason }),
      });
      if (res.ok) {
        setRejectId(null);
        setRejectReason('');
        fetchListings();
      } else {
        const err = await res.json();
        alert(err.detail || '거부 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Status change ---
  const handleStatusChange = async () => {
    if (!statusChangeId || !newStatus) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/landlord/admin/listings/${statusChangeId}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_status: newStatus, reason: statusReason || undefined }),
      });
      if (res.ok) {
        setStatusChangeId(null);
        setNewStatus('');
        setStatusReason('');
        fetchListings();
      } else {
        const err = await res.json();
        alert(err.detail || '상태 변경 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (val: number | null) => {
    if (!val) return '-';
    if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
    if (val >= 10000) return `${Math.round(val / 10000)}만`;
    return val.toLocaleString();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매물 심사 관리</h1>
            <p className="text-sm text-gray-500">건물주 등록 매물의 심사 및 상태 관리</p>
          </div>
        </div>
        <button
          onClick={fetchListings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = stats[s as keyof ListingStats] || 0;
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(isSelected ? '' : s);
                  setPage(1);
                }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="제목 또는 주소로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
        >
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors"
        >
          검색
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">제목/주소</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등록자</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">면적</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">월세</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등록일</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    로딩 중...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    매물이 없습니다.
                  </td>
                </tr>
              ) : (
                listings.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT;
                  const isPending = item.status === 'PENDING_REVIEW';
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[240px]">{item.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[240px]">{item.address || item.region_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{item.owner_name || '-'}</p>
                        <p className="text-xs text-gray-400">{item.owner_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.area_pyeong ? `${item.area_pyeong}평` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatPrice(item.rent_monthly)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isPending && (
                            <>
                              <button
                                onClick={() => setApproveId(item.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="승인"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectId(item.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="거부"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {!isPending && (
                            <div className="relative">
                              <button
                                onClick={() => setDropdownId(dropdownId === item.id ? null : item.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                title="상태 변경"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {dropdownId === item.id && (
                                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                                  {(STATUS_TRANSITIONS[item.status] || []).map((target) => (
                                    <button
                                      key={target}
                                      onClick={() => {
                                        setDropdownId(null);
                                        setStatusChangeId(item.id);
                                        setStatusChangeCurrent(item.status);
                                        setNewStatus(target);
                                        setStatusReason('');
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      {STATUS_CONFIG[target]?.label || target}(으)로 변경
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              총 {total}건 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}건
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-violet-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Detail Modal */}
      {/* ============================================================ */}
      {(detailModal || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetailModal(null); setDetailLoading(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-3" />
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : detailModal && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">매물 상세</h2>
                  <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-5">
                  {/* 기본 정보 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[detailModal.status]?.bg} ${STATUS_CONFIG[detailModal.status]?.text}`}>
                        {STATUS_CONFIG[detailModal.status]?.label}
                      </span>
                      {detailModal.is_public && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">공개</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{detailModal.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {detailModal.address}
                    </p>
                  </div>

                  {/* 소유자 정보 */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><User className="w-3.5 h-3.5" /> 소유자 정보</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">이름:</span> {detailModal.owner_name || '-'}</p>
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {detailModal.owner_email || '-'}</p>
                      <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {detailModal.contact_phone || detailModal.owner_phone || '-'}</p>
                      <p><span className="text-gray-500">연락 이메일:</span> {detailModal.contact_email || '-'}</p>
                    </div>
                  </div>

                  {/* 매물 정보 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">층:</span> {detailModal.floor || '-'}</div>
                    <div><span className="text-gray-500">면적:</span> {detailModal.area_pyeong ? `${detailModal.area_pyeong}평` : '-'}{detailModal.area_m2 ? ` (${detailModal.area_m2}m²)` : ''}</div>
                    <div><span className="text-gray-500">보증금:</span> {formatPrice(detailModal.rent_deposit)}</div>
                    <div><span className="text-gray-500">월세:</span> {formatPrice(detailModal.rent_monthly)}</div>
                    <div><span className="text-gray-500">관리비:</span> {formatPrice(detailModal.maintenance_fee)}</div>
                    <div><span className="text-gray-500">권리금:</span> {formatPrice(detailModal.premium)}</div>
                    <div><span className="text-gray-500">주차:</span> {detailModal.has_parking ? `가능 (${detailModal.parking_count}대)` : '불가'}</div>
                    <div><span className="text-gray-500">엘리베이터:</span> {detailModal.has_elevator ? '있음' : '없음'}</div>
                    <div><span className="text-gray-500">건물연식:</span> {detailModal.building_age ? `${detailModal.building_age}년` : '-'}</div>
                    <div><span className="text-gray-500">이전용도:</span> {detailModal.previous_use || '-'}</div>
                  </div>

                  {/* 설명 */}
                  {detailModal.description && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">설명</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{detailModal.description}</p>
                    </div>
                  )}

                  {/* 인증 서류 */}
                  {detailModal.verification_docs && detailModal.verification_docs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> 인증 서류</p>
                      <div className="space-y-1">
                        {detailModal.verification_docs.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-violet-600 hover:bg-violet-50 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            {doc.type} - {new Date(doc.uploaded_at).toLocaleDateString('ko-KR')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 거부 사유 */}
                  {detailModal.rejection_reason && (
                    <div className="p-4 bg-rose-50 rounded-xl">
                      <p className="text-xs font-medium text-rose-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> 거부 사유
                      </p>
                      <p className="text-sm text-rose-700">{detailModal.rejection_reason}</p>
                    </div>
                  )}

                  {/* 타임라인 */}
                  <div className="text-xs text-gray-400 flex items-center gap-4">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> 등록: {detailModal.created_at ? new Date(detailModal.created_at).toLocaleDateString('ko-KR') : '-'}</span>
                    <span>수정: {detailModal.updated_at ? new Date(detailModal.updated_at).toLocaleDateString('ko-KR') : '-'}</span>
                    {detailModal.verified_at && <span>승인: {new Date(detailModal.verified_at).toLocaleDateString('ko-KR')}</span>}
                  </div>
                </div>

                {/* 모달 하단 액션 */}
                {detailModal.status === 'PENDING_REVIEW' && (
                  <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                      onClick={() => { setDetailModal(null); setApproveId(detailModal.id); }}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => { setDetailModal(null); setRejectId(detailModal.id); }}
                      className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors"
                    >
                      거부
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Approve Dialog */}
      {/* ============================================================ */}
      {approveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setApproveId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">매물 승인</h3>
              <p className="text-sm text-gray-500 mt-1">이 매물을 승인하고 공개하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setApproveId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '처리 중...' : '승인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Reject Dialog */}
      {/* ============================================================ */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setRejectId(null); setRejectReason(''); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">매물 거부</h3>
              <p className="text-sm text-gray-500 mt-1">거부 사유를 입력해주세요.</p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거부 사유를 입력하세요..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '처리 중...' : '거부'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Status Change Dialog */}
      {/* ============================================================ */}
      {statusChangeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setStatusChangeId(null); setNewStatus(''); setStatusReason(''); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5">
              <h3 className="text-lg font-bold text-gray-900">상태 변경</h3>
              <p className="text-sm text-gray-500 mt-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[statusChangeCurrent]?.bg} ${STATUS_CONFIG[statusChangeCurrent]?.text}`}>
                  {STATUS_CONFIG[statusChangeCurrent]?.label}
                </span>
                {' → '}
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[newStatus]?.bg} ${STATUS_CONFIG[newStatus]?.text}`}>
                  {STATUS_CONFIG[newStatus]?.label}
                </span>
              </p>
            </div>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="사유를 입력하세요 (선택)"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setStatusChangeId(null); setNewStatus(''); setStatusReason(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleStatusChange}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? '처리 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away for dropdown */}
      {dropdownId && (
        <div className="fixed inset-0 z-10" onClick={() => setDropdownId(null)} />
      )}
    </div>
  );
}

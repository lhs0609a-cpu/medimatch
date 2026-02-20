'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  ShieldOff,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Building2,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  oauth_provider: string | null;
  created_at: string | null;
  last_login: string | null;
}

interface UserDetail {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  oauth_provider: string | null;
  company: string | null;
  license_number: string | null;
  specialty: string | null;
  opening_region: string | null;
  opening_status: string | null;
  created_at: string | null;
  last_login: string | null;
  payment_count: number;
  subscription: { plan: string; status: string; expires_at: string | null } | null;
  listing_subscription: { status: string; total_credits: number; used_credits: number; next_billing_date: string | null } | null;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ADMIN:      { label: '관리자',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  DOCTOR:     { label: '의사',     bg: 'bg-blue-100',    text: 'text-blue-700' },
  PHARMACIST: { label: '약사',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  SALES_REP:  { label: '영업사원', bg: 'bg-amber-100',   text: 'text-amber-700' },
  LANDLORD:   { label: '건물주',   bg: 'bg-violet-100',  text: 'text-violet-700' },
};

const ALL_ROLES = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'SALES_REP', 'LANDLORD'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleStats, setRoleStats] = useState<Record<string, number>>({});
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detailModal, setDetailModal] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleChangeId, setRoleChangeId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${apiUrl}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.items || []);
        setTotal(data.total || 0);
        setRoleStats(data.role_stats || {});
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, apiUrl]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailModal(null);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setDetailModal(await res.json());
    } catch (e) {
      console.error('Failed to fetch user detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${id}/status?is_active=${!currentActive}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      alert('상태 변경 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeId || !newRole) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/users/${roleChangeId}/role?role=${newRole}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setRoleChangeId(null);
        setNewRole('');
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.detail || '역할 변경 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TossIcon icon={Users} color="from-purple-500 to-pink-500" shadow="shadow-purple-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
            <p className="text-sm text-gray-500">전체 회원 목록 조회 및 관리</p>
          </div>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 새로고침
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => { setRoleFilter(''); setPage(1); }}
          className={`p-3 rounded-xl border text-center transition-all ${!roleFilter ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-100 bg-white hover:border-gray-200'}`}
        >
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <span className="text-xs text-gray-500">전체</span>
        </button>
        {ALL_ROLES.map((r) => {
          const cfg = ROLE_CONFIG[r];
          const count = roleStats[r] || 0;
          return (
            <button
              key={r}
              onClick={() => { setRoleFilter(roleFilter === r ? '' : r); setPage(1); }}
              className={`p-3 rounded-xl border text-center transition-all ${roleFilter === r ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="이름, 이메일, 전화번호 검색..."
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700">검색</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">이름/이메일</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">역할</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">인증</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">최근 로그인</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">회원이 없습니다.</td></tr>
              ) : users.map((u) => {
                const rcfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.DOCTOR;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rcfg.bg} ${rcfg.text}`}>{rcfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.oauth_provider ? (
                        <span className="text-xs text-gray-500">{u.oauth_provider}</span>
                      ) : u.is_verified ? (
                        <span className="text-xs text-emerald-600">인증됨</span>
                      ) : (
                        <span className="text-xs text-gray-400">미인증</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.last_login)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openDetail(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50" title="상세보기">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(u.id, u.is_active)}
                          className={`p-1.5 rounded-lg ${u.is_active ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={u.is_active ? '비활성화' : '활성화'}
                        >
                          {u.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => { setRoleChangeId(u.id); setNewRole(u.role); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="역할 변경"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">총 {total}명</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detailModal || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setDetailModal(null); setDetailLoading(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-12 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-3" /><p className="text-gray-500">로딩 중...</p></div>
            ) : detailModal && (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">회원 상세</h2>
                  <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👤</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{detailModal.full_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_CONFIG[detailModal.role]?.bg} ${ROLE_CONFIG[detailModal.role]?.text}`}>
                        {ROLE_CONFIG[detailModal.role]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {detailModal.email}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {detailModal.phone || '-'}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> 가입: {formatDate(detailModal.created_at)}</p>
                    <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> 로그인: {formatDate(detailModal.last_login)}</p>
                  </div>

                  {(detailModal.company || detailModal.license_number || detailModal.specialty) && (
                    <div className="p-3 bg-gray-50 rounded-xl text-sm space-y-1">
                      {detailModal.company && <p><span className="text-gray-500">소속:</span> {detailModal.company}</p>}
                      {detailModal.license_number && <p><span className="text-gray-500">면허번호:</span> {detailModal.license_number}</p>}
                      {detailModal.specialty && <p><span className="text-gray-500">전문과:</span> {detailModal.specialty}</p>}
                      {detailModal.opening_region && <p><span className="text-gray-500">개원희망지역:</span> {detailModal.opening_region}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> 결제</p>
                      <p className="text-lg font-bold text-gray-900">{detailModal.payment_count}건</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">상태</p>
                      <p className={`text-sm font-medium ${detailModal.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {detailModal.is_active ? '활성' : '비활성'} / {detailModal.is_verified ? '인증됨' : '미인증'}
                      </p>
                    </div>
                  </div>

                  {detailModal.subscription && (
                    <div className="p-3 bg-blue-50 rounded-xl text-sm">
                      <p className="text-xs font-medium text-blue-600 mb-1">시뮬레이션 구독</p>
                      <p>{detailModal.subscription.plan} / {detailModal.subscription.status} / 만료: {formatDate(detailModal.subscription.expires_at)}</p>
                    </div>
                  )}

                  {detailModal.listing_subscription && (
                    <div className="p-3 bg-violet-50 rounded-xl text-sm">
                      <p className="text-xs font-medium text-violet-600 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> 매물등록 구독</p>
                      <p>{detailModal.listing_subscription.status} / 크레딧: {detailModal.listing_subscription.used_credits}/{detailModal.listing_subscription.total_credits}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Role Change Dialog */}
      {roleChangeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRoleChangeId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">역할 변경</h3>
            <select
              value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setRoleChangeId(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">취소</button>
              <button onClick={handleRoleChange} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                {actionLoading ? '처리 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

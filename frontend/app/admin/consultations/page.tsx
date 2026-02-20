'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Stethoscope,
  Phone,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface Consultation {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  area: number;
  region: string;
  need_loan: string;
  interests: string;
  message: string;
  status: string;
  created_at: string;
  admin_note?: string;
}

/* ─── 상태 설정 ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NEW:        { label: '신규',     bg: 'bg-blue-100',    text: 'text-blue-700' },
  CONTACTED:  { label: '연락완료', bg: 'bg-amber-100',   text: 'text-amber-700' },
  IN_PROGRESS:{ label: '진행중',   bg: 'bg-violet-100',  text: 'text-violet-700' },
  CONVERTED:  { label: '전환',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CLOSED:     { label: '종료',     bg: 'bg-gray-100',    text: 'text-gray-500' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function AdminConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<Consultation | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('type', 'consultation');

      const res = await fetch(`${apiUrl}/admin/contacts?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        if (data.status_counts) setStatusCounts(data.status_counts);
      } else {
        // 백엔드 엔드포인트가 없을 경우 목 데이터
        setItems(getMockData());
        setTotal(5);
        setStatusCounts({ NEW: 3, CONTACTED: 1, IN_PROGRESS: 1, CONVERTED: 0, CLOSED: 0 });
      }
    } catch {
      setItems(getMockData());
      setTotal(5);
      setStatusCounts({ NEW: 3, CONTACTED: 1, IN_PROGRESS: 1, CONVERTED: 0, CLOSED: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`${apiUrl}/admin/contacts/${id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
      if (detailModal?.id === id) {
        setDetailModal({ ...detailModal, status: newStatus });
      }
    } catch {
      // silently fail
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={Stethoscope} color="from-rose-500 to-pink-500" shadow="shadow-rose-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상담 신청 관리</h1>
            <p className="text-gray-500 text-sm">개원의 패키지 상담 신청 내역</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          const isSelected = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(isSelected ? '' : s); setPage(1); }}
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

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="이름, 연락처, 진료과로 검색..."
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
        <button onClick={handleSearch} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">
          검색
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">연락처</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">진료과</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">지역/평수</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">관심분야</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">신청일</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    상담 신청이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setDetailModal(item)}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{item.specialty || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{item.region} / {item.area}평</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{item.interests}</td>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              총 {total}건 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}건
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">상담 신청 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">이름</p>
                    <p className="font-medium">{detailModal.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">연락처</p>
                    <p className="font-medium">{detailModal.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Stethoscope className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">진료과</p>
                    <p className="font-medium">{detailModal.specialty || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">신청일</p>
                    <p className="font-medium">{formatDate(detailModal.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* 개원 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">개원 정보</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">희망 지역</span>
                    <span className="font-medium">{detailModal.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">개원 평수</span>
                    <span className="font-medium">{detailModal.area}평</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">대출 필요</span>
                    <span className="font-medium">{detailModal.need_loan === 'yes' ? '필요' : detailModal.need_loan === 'no' ? '불필요' : '상담 후 결정'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">관심 분야</span>
                    <span className="font-medium">{detailModal.interests}</span>
                  </div>
                </div>
              </div>

              {/* 추가 문의 */}
              {detailModal.message && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">추가 문의 사항</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{detailModal.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 상태 변경 Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 mb-2">상태 변경</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isCurrent = detailModal.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => !isCurrent && handleStatusChange(detailModal.id, s)}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCurrent
                          ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-violet-300`
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 목 데이터 (백엔드 미연결 시) ─── */
function getMockData(): Consultation[] {
  return [
    { id: '1', name: '김의사', phone: '010-1234-5678', specialty: '내과', area: 40, region: '서울 강남구', need_loan: 'yes', interests: 'DSR-Free 대출, 무료 마케팅', message: '빠른 상담 부탁드립니다', status: 'NEW', created_at: '2025-02-15T10:00:00Z' },
    { id: '2', name: '박원장', phone: '010-2345-6789', specialty: '피부과', area: 55, region: '서울 서초구', need_loan: 'undecided', interests: 'PG 단말기, 개원 중개', message: '', status: 'NEW', created_at: '2025-02-14T14:30:00Z' },
    { id: '3', name: '이선생', phone: '010-3456-7890', specialty: '정형외과', area: 60, region: '경기 성남시', need_loan: 'yes', interests: 'DSR-Free 대출, PG 단말기, 인테리어 연계', message: '50평 이상으로 계획 중입니다', status: 'CONTACTED', created_at: '2025-02-13T09:15:00Z' },
    { id: '4', name: '최원장', phone: '010-4567-8901', specialty: '치과', area: 35, region: '서울 마포구', need_loan: 'no', interests: '무료 마케팅, 개원 컨설팅', message: '', status: 'IN_PROGRESS', created_at: '2025-02-12T16:45:00Z' },
    { id: '5', name: '정의사', phone: '010-5678-9012', specialty: '안과', area: 45, region: '인천 남동구', need_loan: 'yes', interests: 'DSR-Free 대출, 무료 마케팅, PG 단말기', message: '개원 예정일은 5월입니다', status: 'NEW', created_at: '2025-02-11T11:20:00Z' },
  ];
}

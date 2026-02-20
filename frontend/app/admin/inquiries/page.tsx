'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Send,
  User,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface Inquiry {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  admin_reply?: string;
  replied_at?: string;
}

/* ─── 상태 설정 ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  NEW:       { label: '신규',     bg: 'bg-blue-100',    text: 'text-blue-700' },
  REPLIED:   { label: '답변완료', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  RESOLVED:  { label: '해결',     bg: 'bg-gray-100',    text: 'text-gray-600' },
  SPAM:      { label: '스팸',     bg: 'bg-rose-100',    text: 'text-rose-700' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

const TYPE_LABELS: Record<string, string> = {
  general: '일반 문의',
  simulation: '시뮬레이션',
  matching: '매칭 관련',
  payment: '결제 문의',
  partnership: '파트너십',
  consultation: '개원 상담',
  bug: '버그 신고',
  other: '기타',
};

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailModal, setDetailModal] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
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
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('search', search);

      const res = await fetch(`${apiUrl}/admin/contacts?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        if (data.status_counts) setStatusCounts(data.status_counts);
      } else {
        setItems(getMockData());
        setTotal(6);
        setStatusCounts({ NEW: 4, REPLIED: 1, RESOLVED: 1, SPAM: 0 });
      }
    } catch {
      setItems(getMockData());
      setTotal(6);
      setStatusCounts({ NEW: 4, REPLIED: 1, RESOLVED: 1, SPAM: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`${apiUrl}/admin/contacts/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
      if (detailModal?.id === id) setDetailModal({ ...detailModal, status: newStatus });
    } catch { /* silently fail */ }
  };

  const handleReply = async () => {
    if (!detailModal || !replyText.trim()) return;
    setReplying(true);
    try {
      await fetch(`${apiUrl}/admin/contacts/${detailModal.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      setDetailModal({ ...detailModal, admin_reply: replyText, status: 'REPLIED', replied_at: new Date().toISOString() });
      setReplyText('');
      fetchData();
    } catch { /* silently fail */ }
    setReplying(false);
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
          <TossIcon icon={MessageCircle} color="from-violet-500 to-purple-500" shadow="shadow-violet-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
            <p className="text-gray-500 text-sm">고객 문의 및 연락 폼 관리</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = statusCounts[s] || 0;
          const isSelected = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(isSelected ? '' : s); setPage(1); }}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
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
            placeholder="이름, 제목, 내용으로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
          />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">전체 유형</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">검색</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">유형</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">제목</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">접수일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">문의가 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} onClick={() => { setDetailModal(item); setReplyText(''); }} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.email || item.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[300px] truncate">{item.subject}</td>
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
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">문의 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">이름</p>
                    <p className="font-medium">{detailModal.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="font-medium">{detailModal.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">연락처</p>
                    <p className="font-medium">{detailModal.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">접수일</p>
                    <p className="font-medium">{formatDate(detailModal.created_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{TYPE_LABELS[detailModal.type] || detailModal.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[detailModal.status]?.bg} ${STATUS_CONFIG[detailModal.status]?.text}`}>
                    {STATUS_CONFIG[detailModal.status]?.label}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{detailModal.subject}</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{detailModal.message}</p>
                </div>
              </div>

              {detailModal.admin_reply && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">관리자 답변</h3>
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                    <p className="text-gray-700 whitespace-pre-wrap">{detailModal.admin_reply}</p>
                    {detailModal.replied_at && (
                      <p className="text-xs text-gray-400 mt-2">{formatDate(detailModal.replied_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Reply */}
              {detailModal.status !== 'SPAM' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">답변 작성</h3>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변을 입력하세요..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying}
                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {replying ? '전송 중...' : '답변 전송'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-500 mb-2">상태 변경</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isCurrent = detailModal.status === s;
                  return (
                    <button key={s} onClick={() => !isCurrent && handleStatusChange(detailModal.id, s)} disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isCurrent ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-violet-300` : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
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

function getMockData(): Inquiry[] {
  return [
    { id: '1', name: '홍길동', email: 'hong@example.com', phone: '010-1111-2222', type: 'general', subject: '서비스 이용 문의', message: '서비스 가입 방법이 궁금합니다.', status: 'NEW', created_at: '2025-02-17T10:00:00Z' },
    { id: '2', name: '김영희', email: 'kim@example.com', type: 'simulation', subject: '시뮬레이션 결과 관련', message: '시뮬레이션 결과를 다시 확인하고 싶습니다.', status: 'NEW', created_at: '2025-02-16T14:00:00Z' },
    { id: '3', name: '박철수', phone: '010-3333-4444', type: 'payment', subject: '결제 취소 요청', message: '구독 결제를 취소하고 싶습니다.', status: 'REPLIED', created_at: '2025-02-15T09:00:00Z', admin_reply: '결제 취소 처리 완료되었습니다.', replied_at: '2025-02-15T11:00:00Z' },
    { id: '4', name: '이수진', email: 'lee@example.com', type: 'partnership', subject: '파트너 등록 문의', message: '인테리어 업체로 파트너 등록하고 싶습니다.', status: 'NEW', created_at: '2025-02-14T16:30:00Z' },
    { id: '5', name: '최민준', phone: '010-5555-6666', type: 'consultation', subject: '[개원상담] 내과 / 서울 강남 / 40평', message: '진료과: 내과\n평수: 40평\n희망지역: 서울 강남', status: 'NEW', created_at: '2025-02-13T13:00:00Z' },
    { id: '6', name: '정하은', email: 'jung@example.com', type: 'bug', subject: '지도 페이지 오류', message: '지도가 로딩되지 않습니다.', status: 'RESOLVED', created_at: '2025-02-12T10:00:00Z' },
  ];
}

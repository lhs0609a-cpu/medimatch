'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  FileText,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface EscrowTransaction {
  id: string;
  buyer_name: string;
  seller_name: string;
  amount: number;
  status: string;
  milestone_count: number;
  completed_milestones: number;
  has_dispute: boolean;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  buyer_name: string;
  seller_name: string;
  title: string;
  status: string;
  signed_at?: string;
  created_at: string;
}

/* ─── 상태 설정 ─── */
const TX_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:     { label: '대기',     bg: 'bg-amber-100',   text: 'text-amber-700' },
  FUNDED:      { label: '입금완료', bg: 'bg-blue-100',    text: 'text-blue-700' },
  IN_PROGRESS: { label: '진행중',   bg: 'bg-violet-100',  text: 'text-violet-700' },
  COMPLETED:   { label: '완료',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  DISPUTED:    { label: '분쟁',     bg: 'bg-rose-100',    text: 'text-rose-700' },
  CANCELLED:   { label: '취소',     bg: 'bg-gray-100',    text: 'text-gray-500' },
};

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:   { label: '초안',     bg: 'bg-gray-100',    text: 'text-gray-600' },
  SENT:    { label: '발송됨',   bg: 'bg-blue-100',    text: 'text-blue-700' },
  SIGNED:  { label: '서명완료', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  EXPIRED: { label: '만료',     bg: 'bg-amber-100',   text: 'text-amber-700' },
};

type TabType = 'transactions' | 'contracts' | 'disputes';

export default function AdminEscrowPage() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<EscrowTransaction | null>(null);
  const [contractModal, setContractModal] = useState<Contract | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions' || activeTab === 'disputes') {
        const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
        if (search) params.set('search', search);
        if (activeTab === 'disputes') params.set('has_dispute', 'true');

        const res = await fetch(`${apiUrl}/escrow/transactions?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.items || data || [];
          setTransactions(list);
          setTotal(data.total || list.length);
        } else {
          const mock = getMockTransactions();
          setTransactions(activeTab === 'disputes' ? mock.filter((t) => t.has_dispute) : mock);
          setTotal(activeTab === 'disputes' ? 1 : mock.length);
        }
      } else {
        const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
        if (search) params.set('search', search);

        const res = await fetch(`${apiUrl}/escrow/contracts?${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.items || data || [];
          setContracts(list);
          setTotal(data.total || list.length);
        } else {
          setContracts(getMockContracts());
          setTotal(3);
        }
      }
    } catch {
      if (activeTab === 'contracts') {
        setContracts(getMockContracts());
        setTotal(3);
      } else {
        const mock = getMockTransactions();
        setTransactions(activeTab === 'disputes' ? mock.filter((t) => t.has_dispute) : mock);
        setTotal(activeTab === 'disputes' ? 1 : mock.length);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const switchTab = (tab: TabType) => { setActiveTab(tab); setPage(1); setSearch(''); setSearchInput(''); };

  const handleResolveDispute = async (id: string, resolution: string) => {
    try {
      await fetch(`${apiUrl}/admin/escrow/${id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      fetchData();
      setDetailModal(null);
    } catch { /* silently fail */ }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatMoney = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;

  const disputes = transactions.filter((t) => t.has_dispute);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={ShieldCheck} color="from-teal-500 to-cyan-500" shadow="shadow-teal-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">에스크로/계약 관리</h1>
            <p className="text-gray-500 text-sm">안전거래, 계약, 분쟁 관리</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'transactions' as TabType, label: '거래', icon: DollarSign },
          { key: 'contracts' as TabType, label: '계약', icon: FileText },
          { key: 'disputes' as TabType, label: '분쟁', icon: AlertTriangle, count: disputes.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="검색..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">검색</button>
      </div>

      {/* Transactions / Disputes Table */}
      {(activeTab === 'transactions' || activeTab === 'disputes') && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">구매자</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">판매자</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">금액</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">마일스톤</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">분쟁</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">생성일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
                ) : (activeTab === 'disputes' ? disputes : transactions).length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">{activeTab === 'disputes' ? '분쟁이 없습니다.' : '거래가 없습니다.'}</td></tr>
                ) : (
                  (activeTab === 'disputes' ? disputes : transactions).map((item) => (
                    <tr key={item.id} onClick={() => setDetailModal(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.buyer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.seller_name}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(item.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-600">{item.completed_milestones}/{item.milestone_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TX_STATUS_CONFIG[item.status]?.bg || 'bg-gray-100'} ${TX_STATUS_CONFIG[item.status]?.text || 'text-gray-600'}`}>
                          {TX_STATUS_CONFIG[item.status]?.label || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.has_dispute ? <AlertTriangle className="w-4 h-4 text-rose-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      {activeTab === 'contracts' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">계약명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">구매자</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">판매자</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">서명일</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">생성일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
                ) : contracts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">계약이 없습니다.</td></tr>
                ) : (
                  contracts.map((item) => (
                    <tr key={item.id} onClick={() => setContractModal(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-gray-600">{item.buyer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.seller_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_CONFIG[item.status]?.bg || 'bg-gray-100'} ${CONTRACT_STATUS_CONFIG[item.status]?.text || 'text-gray-600'}`}>
                          {CONTRACT_STATUS_CONFIG[item.status]?.label || item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(item.signed_at || '')}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">거래 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">구매자</p><p className="font-medium">{detailModal.buyer_name}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">판매자</p><p className="font-medium">{detailModal.seller_name}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">거래 금액</p><p className="font-medium">{formatMoney(detailModal.amount)}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">생성일</p><p className="font-medium">{formatDate(detailModal.created_at)}</p></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">마일스톤 진행</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">완료: {detailModal.completed_milestones} / {detailModal.milestone_count}</span>
                    <span className="text-sm font-medium">{detailModal.milestone_count > 0 ? ((detailModal.completed_milestones / detailModal.milestone_count) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${detailModal.milestone_count > 0 ? (detailModal.completed_milestones / detailModal.milestone_count) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {detailModal.has_dispute && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-semibold text-rose-700">분쟁 발생</h3>
                  </div>
                  <p className="text-sm text-rose-600 mb-3">{detailModal.dispute_reason || '분쟁 사유가 등록되었습니다.'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleResolveDispute(detailModal.id, 'buyer_favor')}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">구매자 유리 해결</button>
                    <button onClick={() => handleResolveDispute(detailModal.id, 'seller_favor')}
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">판매자 유리 해결</button>
                    <button onClick={() => handleResolveDispute(detailModal.id, 'mutual')}
                      className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700">합의 해결</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {contractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setContractModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">계약 상세</h2>
              <button onClick={() => setContractModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">계약명</p><p className="font-medium">{contractModal.title}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">구매자</p><p className="font-medium">{contractModal.buyer_name}</p></div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">판매자</p><p className="font-medium">{contractModal.seller_name}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">상태</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_CONFIG[contractModal.status]?.bg} ${CONTRACT_STATUS_CONFIG[contractModal.status]?.text}`}>
                    {CONTRACT_STATUS_CONFIG[contractModal.status]?.label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">생성일</p><p className="font-medium">{formatDate(contractModal.created_at)}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockTransactions(): EscrowTransaction[] {
  return [
    { id: '1', buyer_name: '김원장', seller_name: '메디인테리어', amount: 45000000, status: 'IN_PROGRESS', milestone_count: 3, completed_milestones: 1, has_dispute: false, created_at: '2025-02-10T10:00:00Z', updated_at: '2025-02-15T10:00:00Z' },
    { id: '2', buyer_name: '박원장', seller_name: '메디장비', amount: 28000000, status: 'FUNDED', milestone_count: 3, completed_milestones: 0, has_dispute: false, created_at: '2025-02-12T10:00:00Z', updated_at: '2025-02-12T10:00:00Z' },
    { id: '3', buyer_name: '이원장', seller_name: '개원플래닝', amount: 15000000, status: 'DISPUTED', milestone_count: 3, completed_milestones: 2, has_dispute: true, dispute_reason: '최종 시공 품질이 계약 내용과 다릅니다.', created_at: '2025-01-20T10:00:00Z', updated_at: '2025-02-14T10:00:00Z' },
    { id: '4', buyer_name: '최원장', seller_name: '메디세무', amount: 5000000, status: 'COMPLETED', milestone_count: 2, completed_milestones: 2, has_dispute: false, created_at: '2025-01-05T10:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  ];
}

function getMockContracts(): Contract[] {
  return [
    { id: '1', buyer_name: '김원장', seller_name: '메디인테리어', title: '강남점 인테리어 계약', status: 'SIGNED', signed_at: '2025-02-08T10:00:00Z', created_at: '2025-02-05T10:00:00Z' },
    { id: '2', buyer_name: '박원장', seller_name: '메디장비', title: '의료장비 구매 계약', status: 'SENT', created_at: '2025-02-12T10:00:00Z' },
    { id: '3', buyer_name: '이원장', seller_name: '개원플래닝', title: '개원 컨설팅 계약', status: 'SIGNED', signed_at: '2025-01-18T10:00:00Z', created_at: '2025-01-15T10:00:00Z' },
  ];
}

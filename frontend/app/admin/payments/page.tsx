'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Calendar,
  Users,
  Repeat,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface PaymentItem {
  id: number;
  order_id: string;
  user_email: string;
  user_name: string;
  product_id: string;
  product_name: string;
  amount: number;
  status: string;
  method: string | null;
  card_company: string | null;
  paid_at: string | null;
  created_at: string | null;
  cancel_reason: string | null;
}

interface SubscriptionItem {
  id: number;
  type: string;
  user_email: string;
  user_name: string;
  plan: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  is_auto_renew: boolean;
  amount: number | null;
  total_credits?: number;
  used_credits?: number;
  next_billing_date?: string | null;
  card_info?: string | null;
}

// ============================================================
// Constants
// ============================================================

const PAYMENT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: '대기',   bg: 'bg-gray-100',    text: 'text-gray-700' },
  COMPLETED: { label: '완료',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  FAILED:    { label: '실패',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  CANCELED:  { label: '취소',   bg: 'bg-amber-100',   text: 'text-amber-700' },
  REFUNDED:  { label: '환불',   bg: 'bg-violet-100',  text: 'text-violet-700' },
};

const SUB_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:    { label: '활성',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELED:  { label: '해지예정', bg: 'bg-amber-100', text: 'text-amber-700' },
  EXPIRED:   { label: '만료',   bg: 'bg-gray-100',    text: 'text-gray-500' },
  PAST_DUE:  { label: '미납',   bg: 'bg-rose-100',    text: 'text-rose-700' },
  SUSPENDED: { label: '정지',   bg: 'bg-rose-100',    text: 'text-rose-700' },
};

// ============================================================
// Component
// ============================================================

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscriptions'>('payments');

  // Payments state
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentStats, setPaymentStats] = useState<Record<string, { count: number; amount: number }>>({});
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentSearchInput, setPaymentSearchInput] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(true);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subTypeFilter, setSubTypeFilter] = useState('');
  const [subLoading, setSubLoading] = useState(true);

  const pageSize = 20;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const params = new URLSearchParams({ page: paymentPage.toString(), page_size: pageSize.toString() });
      if (paymentStatusFilter) params.append('status', paymentStatusFilter);
      if (paymentSearch) params.append('search', paymentSearch);

      const res = await fetch(`${apiUrl}/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.items || []);
        setPaymentTotal(data.total || 0);
        setPaymentStats(data.stats || {});
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e);
    } finally {
      setPaymentLoading(false);
    }
  }, [paymentPage, paymentStatusFilter, paymentSearch, apiUrl]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setSubLoading(true);
    try {
      const params = new URLSearchParams({ page: subPage.toString(), page_size: pageSize.toString() });
      if (subTypeFilter) params.append('sub_type', subTypeFilter);

      const res = await fetch(`${apiUrl}/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.items || []);
        setSubTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch subscriptions:', e);
    } finally {
      setSubLoading(false);
    }
  }, [subPage, subTypeFilter, apiUrl]);

  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    else fetchSubscriptions();
  }, [activeTab, fetchPayments, fetchSubscriptions]);

  const formatPrice = (val: number | null) => {
    if (!val) return '-';
    return val.toLocaleString() + '원';
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const paymentTotalPages = Math.ceil(paymentTotal / pageSize);
  const subTotalPages = Math.ceil(subTotal / pageSize);

  // 총 매출 계산
  const totalRevenue = paymentStats['COMPLETED']?.amount || 0;
  const completedCount = paymentStats['COMPLETED']?.count || 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">결제/구독 관리</h1>
            <p className="text-sm text-gray-500">결제 내역과 구독 현황을 관리합니다</p>
          </div>
        </div>
        <button
          onClick={() => activeTab === 'payments' ? fetchPayments() : fetchSubscriptions()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${(paymentLoading || subLoading) ? 'animate-spin' : ''}`} /> 새로고침
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Receipt className="w-4 h-4 inline mr-1.5" />결제 내역
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subscriptions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Repeat className="w-4 h-4 inline mr-1.5" />구독 현황
        </button>
      </div>

      {/* ============ Payments Tab ============ */}
      {activeTab === 'payments' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">총 매출</p>
              <p className="text-2xl font-bold text-emerald-600">{formatPrice(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">완료 건수</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">취소</p>
              <p className="text-2xl font-bold text-amber-600">{paymentStats['CANCELED']?.count || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">실패</p>
              <p className="text-2xl font-bold text-rose-600">{paymentStats['FAILED']?.count || 0}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="이름, 이메일, 주문번호 검색..."
                value={paymentSearchInput} onChange={(e) => setPaymentSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (() => { setPaymentSearch(paymentSearchInput); setPaymentPage(1); })()}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <select value={paymentStatusFilter} onChange={(e) => { setPaymentStatusFilter(e.target.value); setPaymentPage(1); }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
              <option value="">전체 상태</option>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={() => { setPaymentSearch(paymentSearchInput); setPaymentPage(1); }}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700">검색</button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">주문번호</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">회원</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">상품</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">금액</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">결제수단</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">결제일</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLoading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">결제 내역이 없습니다.</td></tr>
                  ) : payments.map((p) => {
                    const scfg = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.PENDING;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.order_id}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{p.user_name}</p>
                          <p className="text-xs text-gray-400">{p.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{p.product_name}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPrice(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.card_company || p.method || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.paid_at || p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {paymentTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">총 {paymentTotal}건</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))} disabled={paymentPage === 1} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-600 px-2">{paymentPage} / {paymentTotalPages}</span>
                  <button onClick={() => setPaymentPage(Math.min(paymentTotalPages, paymentPage + 1))} disabled={paymentPage === paymentTotalPages} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ Subscriptions Tab ============ */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Type Filter */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                { val: '', label: '전체' },
                { val: 'simulation', label: '시뮬레이션' },
                { val: 'listing', label: '매물등록' },
              ].map((opt) => (
                <button key={opt.val} onClick={() => { setSubTypeFilter(opt.val); setSubPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${subTypeFilter === opt.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">회원</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">유형</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">플랜</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">시작일</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">만료일</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">크레딧/금액</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">자동갱신</th>
                  </tr>
                </thead>
                <tbody>
                  {subLoading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
                  ) : subscriptions.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">구독 내역이 없습니다.</td></tr>
                  ) : subscriptions.map((s) => {
                    const scfg = SUB_STATUS[s.status] || SUB_STATUS.ACTIVE;
                    return (
                      <tr key={`${s.type}-${s.id}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{s.user_name}</p>
                          <p className="text-xs text-gray-400">{s.user_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.type === 'listing' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                            {s.type === 'listing' ? '매물등록' : '시뮬레이션'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.plan}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.started_at)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(s.expires_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {s.type === 'listing' ? (
                            <span>{s.used_credits}/{s.total_credits} 사용</span>
                          ) : s.amount ? (
                            <span>{formatPrice(s.amount)}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${s.is_auto_renew ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {s.is_auto_renew ? 'ON' : 'OFF'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {subTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">총 {subTotal}건</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSubPage(Math.max(1, subPage - 1))} disabled={subPage === 1} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-gray-600 px-2">{subPage} / {subTotalPages}</span>
                  <button onClick={() => setSubPage(Math.min(subTotalPages, subPage + 1))} disabled={subPage === subTotalPages} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

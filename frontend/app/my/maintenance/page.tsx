'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wrench, CreditCard, AlertCircle, CheckCircle2, Clock,
  ChevronRight, RefreshCw, XCircle, MessageSquare, FileText,
  ArrowLeft, Ban,
} from 'lucide-react';

interface Contract {
  id: number;
  project_name: string;
  service_type: string;
  monthly_amount: number;
  billing_day: number;
  company_name: string | null;
  contact_person: string | null;
  card_company: string | null;
  card_number: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  retry_count: number;
  total_paid: number;
  total_months: number;
  created_at: string | null;
}

interface PaymentItem {
  id: number;
  order_id: string;
  amount: number;
  status: string;
  card_company: string | null;
  card_number: string | null;
  paid_at: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  PENDING_SETUP: { label: '카드 미등록', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ACTIVE: { label: '정상', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  PAST_DUE: { label: '미납', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  SUSPENDED: { label: '정지', color: 'bg-red-100 text-red-700', icon: Ban },
  CANCELED: { label: '해지', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  EXPIRED: { label: '만료', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const SERVICE_NAMES: Record<string, string> = {
  HOMEPAGE: '홈페이지',
  PROGRAM: '프로그램',
};

export default function MyMaintenancePage() {
  const searchParams = useSearchParams();
  const setupContractId = searchParams.get('setup');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    if (setupContractId) {
      handleSetupBilling(parseInt(setupContractId));
    }
  }, [setupContractId]);

  const fetchContracts = async () => {
    try {
      const res = await fetch(`${apiUrl}/maintenance/my-contracts`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch contracts:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (contractId: number) => {
    setPaymentsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/${contractId}/billing-history`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleSetupBilling = async (contractId: number) => {
    try {
      const res = await fetch(`${apiUrl}/maintenance/config/${contractId}`, { headers: getHeaders() });
      if (!res.ok) return;
      const config = await res.json();

      // Load Toss SDK via CDN script (consistent with other subscription pages)
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      document.head.appendChild(script);
      await new Promise<void>((resolve) => { script.onload = () => resolve(); });

      const tossPayments = (window as any).TossPayments(config.clientKey);
      await tossPayments.requestBillingAuth('카드', {
        customerKey: config.customerKey,
        successUrl: config.successUrl,
        failUrl: config.failUrl,
      });
    } catch (e) {
      console.error('Toss billing setup error:', e);
    }
  };

  const handleRetryPayment = async (contractId: number) => {
    setActionLoading(`retry-${contractId}`);
    try {
      const res = await fetch(`${apiUrl}/maintenance/${contractId}/retry-payment`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) {
        alert('결제가 완료되었습니다.');
        fetchContracts();
      } else {
        const err = await res.json();
        alert(err.detail || '결제에 실패했습니다.');
      }
    } catch (e) {
      alert('결제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (contractId: number) => {
    setActionLoading(`cancel-${contractId}`);
    try {
      const res = await fetch(`${apiUrl}/maintenance/${contractId}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowCancelModal(null);
        setCancelReason('');
        fetchContracts();
      } else {
        const err = await res.json();
        alert(err.detail || '해지에 실패했습니다.');
      }
    } catch (e) {
      alert('해지 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleContract = (contractId: number) => {
    if (selectedContract === contractId) {
      setSelectedContract(null);
    } else {
      setSelectedContract(contractId);
      fetchPayments(contractId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리유지비</h1>
            <p className="text-sm text-gray-500 mt-1">월 관리비 결제 현황 및 관리</p>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">등록된 계약이 없습니다</h3>
            <p className="text-sm text-gray-500">관리자가 계약을 생성하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((c) => {
              const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.EXPIRED;
              const StatusIcon = statusInfo.icon;
              const isExpanded = selectedContract === c.id;

              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Contract Header */}
                  <button
                    onClick={() => toggleContract(c.id)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{c.project_name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {SERVICE_NAMES[c.service_type] || c.service_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          월 {c.monthly_amount.toLocaleString()}원
                          {c.card_number && ` · ${c.card_company || ''} ${c.card_number}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                        <div>
                          <p className="text-xs text-gray-500">누적 결제</p>
                          <p className="text-sm font-semibold text-gray-900">{c.total_paid.toLocaleString()}원</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">누적 개월</p>
                          <p className="text-sm font-semibold text-gray-900">{c.total_months}개월</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">현재 기간</p>
                          <p className="text-sm text-gray-900">
                            {c.current_period_end ? new Date(c.current_period_end).toLocaleDateString('ko-KR') : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">다음 결제일</p>
                          <p className="text-sm text-gray-900">
                            {c.next_billing_date ? new Date(c.next_billing_date).toLocaleDateString('ko-KR') : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 py-3 border-t border-gray-100">
                        {c.status === 'PENDING_SETUP' && (
                          <button
                            onClick={() => handleSetupBilling(c.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            카드 등록
                          </button>
                        )}
                        {(c.status === 'PAST_DUE' || c.status === 'SUSPENDED') && (
                          <button
                            onClick={() => handleRetryPayment(c.id)}
                            disabled={actionLoading === `retry-${c.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${actionLoading === `retry-${c.id}` ? 'animate-spin' : ''}`} />
                            즉시 결제
                          </button>
                        )}
                        {c.status === 'ACTIVE' && (
                          <button
                            onClick={() => setShowCancelModal(c.id)}
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            해지 요청
                          </button>
                        )}
                        <Link
                          href={`/my/maintenance/requests?contractId=${c.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          요청 게시판
                        </Link>
                      </div>

                      {/* Payment History */}
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          결제 내역
                        </h4>
                        {paymentsLoading ? (
                          <div className="text-center py-4">
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          </div>
                        ) : payments.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">결제 내역이 없습니다.</p>
                        ) : (
                          <div className="space-y-2">
                            {payments.slice(0, 5).map((p) => (
                              <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-sm text-gray-900">{p.amount.toLocaleString()}원</p>
                                  <p className="text-xs text-gray-500">
                                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString('ko-KR') : '-'}
                                    {p.card_number && ` · ${p.card_number}`}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {p.status === 'COMPLETED' ? '완료' : '실패'}
                                </span>
                              </div>
                            ))}
                            {payments.length > 5 && (
                              <p className="text-xs text-gray-400 text-center pt-1">
                                외 {payments.length - 5}건
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">해지 요청</h3>
            <p className="text-sm text-gray-500 mb-4">
              해지 후에도 현재 결제 기간 종료까지 서비스가 유지됩니다.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="해지 사유를 입력해주세요 (선택)"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowCancelModal(null); setCancelReason(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={actionLoading === `cancel-${showCancelModal}`}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === `cancel-${showCancelModal}` ? '처리 중...' : '해지 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

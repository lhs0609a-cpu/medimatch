'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cog, Check, CreditCard, X, RefreshCw,
  Calendar, ArrowRight, Shield, Loader2
} from 'lucide-react';
import { serviceSubscriptionService } from '@/lib/api/services';

type SubStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' | 'SUSPENDED' | null;

interface SubscriptionInfo {
  has_subscription: boolean;
  subscription_id?: number;
  service_type?: string;
  tier?: string;
  status?: SubStatus;
  card_company?: string;
  card_number?: string;
  monthly_amount?: number;
  company_name?: string;
  current_period_end?: string;
  next_billing_date?: string;
  canceled_at?: string;
}

const SERVICE_TYPE = 'PROGRAM';
const TIER = 'STANDARD';

const FEATURES = [
  '100% 맞춤 프로그램 개발 (제작비 ₩0)',
  '150개 검증 모듈 기반 고속 개발',
  '1~4주 내 완성 보장',
  '1개월 무료 유지보수',
  '직원 교육 포함',
  '24시간 자동 운영',
  '100% 환불 보장',
  '언제든 구독 취소 가능',
];

export default function ProgramSubscriptionPage() {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await serviceSubscriptionService.getStatus(SERVICE_TYPE);
      setSubInfo(data);
    } catch {
      setSubInfo({ has_subscription: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const config = await serviceSubscriptionService.getConfig(SERVICE_TYPE, TIER);

      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.head.appendChild(script);

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('토스 SDK 로드 실패'));
      });

      const tossPayments = (window as any).TossPayments(config.clientKey);
      await tossPayments.requestBillingAuth('카드', {
        customerKey: config.customerKey,
        successUrl: config.successUrl,
        failUrl: config.failUrl,
      });
    } catch (err: any) {
      if (err?.message?.includes('취소')) return;
      setError(err?.response?.data?.detail || err?.message || '구독 시작에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const result = await serviceSubscriptionService.cancel(SERVICE_TYPE, cancelReason || undefined);
      setShowCancelConfirm(false);
      setCancelReason('');
      await fetchStatus();
      alert(result.message);
    } catch (err: any) {
      setError(err?.response?.data?.detail || '구독 취소에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const result = await serviceSubscriptionService.reactivate(SERVICE_TYPE);
      await fetchStatus();
      alert(result.message);
    } catch (err: any) {
      setError(err?.response?.data?.detail || '재활성화에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasActive = subInfo?.has_subscription && subInfo.status &&
    ['ACTIVE', 'CANCELED', 'PAST_DUE'].includes(subInfo.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cog className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">프로그램 개발 구독</h1>
          <p className="mt-2 text-gray-600">제작비 0원, 월 30만원으로 맞춤 업무 자동화 프로그램을 운영하세요</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {hasActive && subInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">내 구독</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subInfo.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                subInfo.status === 'CANCELED' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {subInfo.status === 'ACTIVE' ? '활성' :
                 subInfo.status === 'CANCELED' ? '취소 예정' :
                 subInfo.status === 'PAST_DUE' ? '결제 실패' : subInfo.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <CreditCard className="w-4 h-4" />
                  월 구독료
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ₩{(subInfo.monthly_amount || 300000).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  {subInfo.status === 'CANCELED' ? '만료일' : '다음 결제일'}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {subInfo.status === 'CANCELED' && subInfo.current_period_end
                    ? new Date(subInfo.current_period_end).toLocaleDateString('ko-KR')
                    : subInfo.next_billing_date
                    ? new Date(subInfo.next_billing_date).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
              </div>
            </div>

            {subInfo.card_number && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{subInfo.card_company} {subInfo.card_number}</span>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {subInfo.status === 'ACTIVE' && (
                <>
                  <Link
                    href="/services/program"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Cog className="w-5 h-5" />
                    서비스 페이지 보기
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-3 text-gray-500 text-sm hover:text-red-500 transition-colors"
                  >
                    구독 취소
                  </button>
                </>
              )}
              {subInfo.status === 'CANCELED' && (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  구독 재활성화
                </button>
              )}
            </div>
          </div>
        )}

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">구독 취소</h3>
                <button onClick={() => setShowCancelConfirm(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                구독을 취소하면 현재 결제 기간이 끝난 후 더 이상 갱신되지 않습니다. 잔여 기간 동안은 계속 이용 가능합니다.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유 (선택)"
                className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-24 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  돌아가기
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? '처리 중...' : '구독 취소'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!hasActive && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
              <div className="text-sm font-medium opacity-80 mb-1">프로그램 개발 구독 — STANDARD</div>
              <div className="text-4xl font-bold mb-1">
                300,000<span className="text-lg font-normal">원/월</span>
              </div>
              <div className="text-sm opacity-80">제작비 ₩0 + 매월 자동결제 (카드)</div>
            </div>

            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {FEATURES.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={actionLoading}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                구독 시작하기
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Shield className="w-4 h-4" />
                토스페이먼츠 안전 결제
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3">이용 안내</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>- 구독 시작 후 업무 프로세스 분석 및 맞춤 개발이 시작됩니다.</p>
            <p>- 제작비는 무료이며, 월 구독료만 결제됩니다.</p>
            <p>- 1개월 무료 유지보수가 포함되어 있습니다.</p>
            <p>- 구독 취소 시 잔여 기간까지 서비스가 유지됩니다.</p>
            <p>- 100% 환불 보장 (합의 요구사항 미충족 시).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

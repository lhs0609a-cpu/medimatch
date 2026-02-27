'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Stethoscope, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { serviceSubscriptionService } from '@/lib/api/services';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const authKey = searchParams.get('authKey');
  const customerKey = searchParams.get('customerKey');
  const tier = searchParams.get('tier') || 'GROWTH';

  useEffect(() => {
    if (!authKey || !customerKey) {
      setStatus('error');
      setErrorMessage('인증 정보가 누락되었습니다.');
      return;
    }
    activateSubscription();
  }, [authKey, customerKey]);

  const activateSubscription = async () => {
    try {
      setStatus('loading');
      const data = await serviceSubscriptionService.activate({
        auth_key: authKey!,
        customer_key: customerKey!,
        service_type: 'EMR',
        tier,
      });
      setResult(data);
      setStatus('success');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || '구독 활성화에 실패했습니다.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">구독을 활성화하고 있습니다...</p>
          <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">구독 활성화 실패</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <button
                onClick={activateSubscription}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                다시 시도
              </button>
              <Link
                href="/subscription/emr"
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                구독 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">클라우드 EMR 구독이 시작되었습니다!</h1>
          <p className="text-gray-600 mb-6">
            담당 매니저가 배정되어 데이터 이전 및 세팅을 도와드립니다.
          </p>

          {result && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">구독 상태</span>
                  <div className="font-medium text-green-600">활성</div>
                </div>
                <div>
                  <span className="text-gray-500">플랜</span>
                  <div className="font-medium">{result.tier}</div>
                </div>
                <div>
                  <span className="text-gray-500">현재 기간</span>
                  <div className="font-medium">
                    {new Date(result.current_period_end).toLocaleDateString('ko-KR')}까지
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">다음 결제일</span>
                  <div className="font-medium">
                    {new Date(result.next_billing_date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/services/emr"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-5 h-5" />
              서비스 페이지 보기
            </Link>
            <Link
              href="/subscription/emr"
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              구독 관리
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EMRSubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

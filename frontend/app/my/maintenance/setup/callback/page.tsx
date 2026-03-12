'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function MaintenanceSetupCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const contractId = searchParams.get('contractId');

    if (!authKey || !customerKey || !contractId) {
      setStatus('error');
      setMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    setupBilling(authKey, customerKey, parseInt(contractId));
  }, [searchParams]);

  const setupBilling = async (authKey: string, customerKey: string, contractId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/maintenance/setup-billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contract_id: contractId,
          auth_key: authKey,
          customer_key: customerKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setMessage(data.message || '카드 등록 및 첫 결제가 완료되었습니다.');
      } else {
        const err = await res.json();
        setStatus('error');
        setMessage(err.detail || '카드 등록에 실패했습니다.');
      }
    } catch (e) {
      setStatus('error');
      setMessage('처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">결제 처리 중</h2>
            <p className="text-sm text-gray-500">카드를 등록하고 첫 결제를 진행하고 있습니다...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">등록 완료</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => router.push('/my/maintenance')}
              className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              관리유지비 페이지로 이동
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">등록 실패</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/my/maintenance')}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                돌아가기
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

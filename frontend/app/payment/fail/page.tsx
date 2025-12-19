'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailContent() {
  const searchParams = useSearchParams();

  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거절했습니다.';
      case 'INVALID_CARD_EXPIRATION':
        return '카드 유효기간이 만료되었습니다.';
      case 'EXCEED_MAX_ONE_DAY_AMOUNT':
        return '일일 결제 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">결제 실패</h1>
        <p className="text-gray-600 mb-2">{getErrorDescription(errorCode)}</p>

        {errorCode && (
          <p className="text-sm text-gray-400 mb-8">오류 코드: {errorCode}</p>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-yellow-800">
            <strong>해결 방법:</strong>
          </p>
          <ul className="text-sm text-yellow-700 mt-2 text-left list-disc list-inside">
            <li>카드 정보를 다시 확인해주세요</li>
            <li>다른 결제 수단을 이용해보세요</li>
            <li>카드사 고객센터에 문의해주세요</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link
            href="/payment"
            className="block w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도하기
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          문제가 계속되면 고객센터로 문의해주세요.
          <br />
          support@medimatch.kr
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}

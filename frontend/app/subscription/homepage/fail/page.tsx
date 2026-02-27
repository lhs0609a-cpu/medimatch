'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Home, Copy, CheckCircle2, Shield } from 'lucide-react';

type ErrorCategory = 'user_action' | 'card_issue' | 'limit_exceeded' | 'technical' | 'canceled';

interface ErrorInfo {
  title: string;
  description: string;
  category: ErrorCategory;
  solutions: string[];
  canRetry: boolean;
}

const ERROR_MAP: Record<string, ErrorInfo> = {
  'PAY_PROCESS_CANCELED': {
    title: '인증이 취소되었습니다',
    description: '카드 인증 진행 중 취소하셨습니다.',
    category: 'canceled',
    solutions: ['구독을 원하시면 다시 시도해주세요.'],
    canRetry: true,
  },
  'USER_CANCEL': {
    title: '인증이 취소되었습니다',
    description: '인증 창을 닫으셨습니다.',
    category: 'canceled',
    solutions: ['구독을 원하시면 다시 시도해주세요.'],
    canRetry: true,
  },
  'REJECT_CARD_COMPANY': {
    title: '카드사에서 거절되었습니다',
    description: '카드사 정책에 의해 인증이 거절되었습니다.',
    category: 'card_issue',
    solutions: ['카드사 고객센터에 문의해주세요.', '다른 카드로 시도해주세요.'],
    canRetry: true,
  },
  'INVALID_CARD_EXPIRATION': {
    title: '카드 유효기간 오류',
    description: '카드 유효기간이 만료되었거나 잘못 입력되었습니다.',
    category: 'card_issue',
    solutions: ['카드 앞면의 유효기간을 확인해주세요.'],
    canRetry: true,
  },
  'INVALID_STOPPED_CARD': {
    title: '사용 정지된 카드',
    description: '이 카드는 현재 사용이 정지되어 있습니다.',
    category: 'card_issue',
    solutions: ['카드사 고객센터에 문의해주세요.', '다른 카드를 사용해주세요.'],
    canRetry: true,
  },
  'EXCEED_MAX_ONE_TIME_AMOUNT': {
    title: '1회 결제 한도 초과',
    description: '카드의 1회 결제 한도를 초과했습니다.',
    category: 'limit_exceeded',
    solutions: ['카드사 앱에서 한도를 확인해주세요.', '다른 카드를 사용해주세요.'],
    canRetry: true,
  },
};

const DEFAULT_ERROR: ErrorInfo = {
  title: '인증에 실패했습니다',
  description: '카드 인증 중 오류가 발생했습니다.',
  category: 'technical',
  solutions: ['잠시 후 다시 시도해주세요.', '문제가 지속되면 고객센터에 문의해주세요.'],
  canRetry: true,
};

const CATEGORY_EMOJI: Record<ErrorCategory, string> = {
  user_action: '\u2753',
  card_issue: '\uD83D\uDCB3',
  limit_exceeded: '\uD83D\uDEAB',
  technical: '\u26A0\uFE0F',
  canceled: '\u23F0',
};

function FailContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const errorCode = searchParams.get('code') || searchParams.get('errorCode');
  const errorMessage = searchParams.get('message') || searchParams.get('errorMessage');

  const errorInfo = errorCode ? (ERROR_MAP[errorCode] || DEFAULT_ERROR) : DEFAULT_ERROR;
  const categoryEmoji = CATEGORY_EMOJI[errorInfo.category];
  const displayDescription = errorMessage || errorInfo.description;

  const handleCopyError = () => {
    const details = `에러 코드: ${errorCode || '없음'}\n시간: ${new Date().toLocaleString('ko-KR')}`;
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 text-center border-b border-gray-100">
            <div className="text-center mx-auto mb-4">
              <span className="text-5xl">{categoryEmoji}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
            <p className="text-gray-600">{displayDescription}</p>
            {errorCode && (
              <button onClick={handleCopyError}
                className="inline-flex items-center gap-1 mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-green-500">복사됨</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>오류 코드: {errorCode}</span></>
                )}
              </button>
            )}
          </div>

          <div className="p-6 bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              해결 방법
            </h2>
            <ul className="space-y-2">
              {errorInfo.solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0">{i === 0 ? '1\uFE0F\u20E3' : i === 1 ? '2\uFE0F\u20E3' : `${i + 1}.`}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 space-y-3">
            {errorInfo.canRetry && (
              <Link
                href="/subscription/homepage"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                다시 시도하기
              </Link>
            )}
            <Link
              href="/"
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              홈으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400 flex items-center justify-center gap-1">
          <Shield className="w-4 h-4" />
          토스페이먼츠 안전 결제
        </div>
      </div>
    </div>
  );
}

export default function HomepageSubscriptionFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}

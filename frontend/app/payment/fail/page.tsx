'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Home,
  Phone,
  HelpCircle,
  Wallet,
  Clock,
  Shield,
  Ban,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

// 에러 유형 분류
type ErrorCategory = 'user_action' | 'card_issue' | 'limit_exceeded' | 'technical' | 'canceled';

interface ErrorInfo {
  title: string;
  description: string;
  category: ErrorCategory;
  solutions: string[];
  canRetry: boolean;
  suggestAlternative: boolean;
}

// Toss Payments 에러 코드 상세 매핑
const ERROR_MAP: Record<string, ErrorInfo> = {
  // 사용자 취소
  'PAY_PROCESS_CANCELED': {
    title: '결제가 취소되었습니다',
    description: '결제 진행 중 취소 버튼을 누르셨습니다.',
    category: 'canceled',
    solutions: ['결제를 원하시면 다시 시도해주세요.'],
    canRetry: true,
    suggestAlternative: false,
  },
  'USER_CANCEL': {
    title: '결제가 취소되었습니다',
    description: '결제창을 닫으셨습니다.',
    category: 'canceled',
    solutions: ['결제를 원하시면 다시 시도해주세요.'],
    canRetry: true,
    suggestAlternative: false,
  },

  // 카드 문제
  'REJECT_CARD_COMPANY': {
    title: '카드사에서 거절되었습니다',
    description: '카드사 정책에 의해 결제가 거절되었습니다.',
    category: 'card_issue',
    solutions: [
      '카드 뒷면의 고객센터로 거절 사유를 문의해주세요.',
      '다른 카드로 결제를 시도해주세요.',
      '해외결제 차단이 설정되어 있다면 해제해주세요.',
    ],
    canRetry: true,
    suggestAlternative: true,
  },
  'INVALID_CARD_EXPIRATION': {
    title: '카드 유효기간 오류',
    description: '카드 유효기간이 만료되었거나 잘못 입력되었습니다.',
    category: 'card_issue',
    solutions: [
      '카드 앞면의 유효기간(MM/YY)을 확인해주세요.',
      '유효기간이 지난 카드는 카드사에서 재발급 받으세요.',
    ],
    canRetry: true,
    suggestAlternative: true,
  },
  'INVALID_CARD_NUMBER': {
    title: '카드 번호 오류',
    description: '카드 번호가 잘못 입력되었습니다.',
    category: 'user_action',
    solutions: [
      '카드 번호 16자리를 정확히 입력해주세요.',
      '카드 앞면의 번호를 다시 확인해주세요.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
  'INVALID_CVV': {
    title: 'CVV/CVC 오류',
    description: '보안 코드가 잘못 입력되었습니다.',
    category: 'user_action',
    solutions: [
      '카드 뒷면의 서명란 옆 3자리 숫자를 확인해주세요.',
      'AMEX 카드는 앞면의 4자리 숫자입니다.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
  'INVALID_CARD_PASSWORD': {
    title: '카드 비밀번호 오류',
    description: '카드 비밀번호가 일치하지 않습니다.',
    category: 'user_action',
    solutions: [
      '카드 비밀번호 앞 2자리를 정확히 입력해주세요.',
      '비밀번호가 기억나지 않으면 카드사에 문의해주세요.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
  'INVALID_STOPPED_CARD': {
    title: '사용 정지된 카드',
    description: '이 카드는 현재 사용이 정지되어 있습니다.',
    category: 'card_issue',
    solutions: [
      '카드사 고객센터에 정지 사유를 문의해주세요.',
      '다른 카드를 사용해주세요.',
    ],
    canRetry: false,
    suggestAlternative: true,
  },
  'INVALID_CARD_LOST_OR_STOLEN': {
    title: '분실/도난 신고된 카드',
    description: '분실 또는 도난 신고가 접수된 카드입니다.',
    category: 'card_issue',
    solutions: [
      '카드사에서 새 카드를 발급받아 주세요.',
      '다른 카드를 사용해주세요.',
    ],
    canRetry: false,
    suggestAlternative: true,
  },

  // 한도 초과
  'EXCEED_MAX_ONE_DAY_AMOUNT': {
    title: '일일 결제 한도 초과',
    description: '오늘 사용 가능한 결제 한도를 초과했습니다.',
    category: 'limit_exceeded',
    solutions: [
      '내일 다시 시도해주세요.',
      '카드사 앱에서 일시적으로 한도를 높일 수 있습니다.',
      '다른 카드를 사용해주세요.',
    ],
    canRetry: false,
    suggestAlternative: true,
  },
  'EXCEED_MAX_ONE_TIME_AMOUNT': {
    title: '1회 결제 한도 초과',
    description: '1회 결제 가능 금액을 초과했습니다.',
    category: 'limit_exceeded',
    solutions: [
      '카드사 앱에서 온라인 결제 한도를 확인해주세요.',
      '한도가 더 높은 카드를 사용해주세요.',
    ],
    canRetry: false,
    suggestAlternative: true,
  },
  'EXCEED_MAX_MONTHLY_AMOUNT': {
    title: '월간 결제 한도 초과',
    description: '이번 달 사용 가능한 결제 한도를 초과했습니다.',
    category: 'limit_exceeded',
    solutions: [
      '다음 달 1일 이후에 다시 시도해주세요.',
      '카드사에 한도 증액을 요청해주세요.',
      '다른 카드를 사용해주세요.',
    ],
    canRetry: false,
    suggestAlternative: true,
  },
  'NOT_ENOUGH_BALANCE': {
    title: '잔액 부족',
    description: '체크카드/계좌 잔액이 부족합니다.',
    category: 'limit_exceeded',
    solutions: [
      '계좌에 충분한 금액을 입금 후 다시 시도해주세요.',
      '다른 결제 수단을 사용해주세요.',
    ],
    canRetry: true,
    suggestAlternative: true,
  },

  // 기술적 오류
  'PAY_PROCESS_ABORTED': {
    title: '결제 처리 중 오류',
    description: '결제 진행 중 예기치 않은 오류가 발생했습니다.',
    category: 'technical',
    solutions: [
      '잠시 후 다시 시도해주세요.',
      '문제가 지속되면 고객센터에 문의해주세요.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
  'FAILED_INTERNAL_SERVER_ERROR': {
    title: '서버 오류',
    description: '일시적인 서버 오류가 발생했습니다.',
    category: 'technical',
    solutions: [
      '잠시 후 다시 시도해주세요.',
      '문제가 지속되면 고객센터에 문의해주세요.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
  'TIMEOUT': {
    title: '시간 초과',
    description: '결제 처리 시간이 초과되었습니다.',
    category: 'technical',
    solutions: [
      '네트워크 연결을 확인해주세요.',
      '잠시 후 다시 시도해주세요.',
    ],
    canRetry: true,
    suggestAlternative: false,
  },
};

// 기본 에러 정보
const DEFAULT_ERROR: ErrorInfo = {
  title: '결제에 실패했습니다',
  description: '결제 처리 중 오류가 발생했습니다.',
  category: 'technical',
  solutions: [
    '잠시 후 다시 시도해주세요.',
    '다른 결제 수단을 이용해보세요.',
    '문제가 지속되면 고객센터에 문의해주세요.',
  ],
  canRetry: true,
  suggestAlternative: true,
};

// 카테고리별 아이콘 및 색상
const CATEGORY_STYLES: Record<ErrorCategory, { icon: any; gradient: string; shadow: string }> = {
  user_action: {
    icon: HelpCircle,
    gradient: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-500/25'
  },
  card_issue: {
    icon: CreditCard,
    gradient: 'from-indigo-500 to-purple-500',
    shadow: 'shadow-indigo-500/25'
  },
  limit_exceeded: {
    icon: Ban,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25'
  },
  technical: {
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-500',
    shadow: 'shadow-red-500/25'
  },
  canceled: {
    icon: Clock,
    gradient: 'from-slate-500 to-gray-600',
    shadow: 'shadow-slate-500/25'
  },
};

// 대체 결제 수단
const ALTERNATIVE_METHODS = [
  { name: '다른 신용카드', description: '보유한 다른 카드 사용', icon: CreditCard, gradient: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/25' },
  { name: '체크카드', description: '잔액 확인 후 결제', icon: Wallet, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/25' },
  { name: '카카오페이', description: '간편결제 이용', icon: Shield, gradient: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/25' },
];

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const errorCode = searchParams.get('code') || searchParams.get('errorCode');
  const errorMessage = searchParams.get('message') || searchParams.get('errorMessage');
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');

  // 에러 정보 가져오기
  const errorInfo = errorCode ? (ERROR_MAP[errorCode] || DEFAULT_ERROR) : DEFAULT_ERROR;
  const categoryStyle = CATEGORY_STYLES[errorInfo.category];

  // 에러 메시지가 있으면 description 덮어쓰기
  const displayDescription = errorMessage || errorInfo.description;

  // 에러 코드 복사
  const handleCopyError = () => {
    const errorDetails = `에러 코드: ${errorCode || '없음'}\n주문 번호: ${orderId || '없음'}\n시간: ${new Date().toLocaleString('ko-KR')}`;
    navigator.clipboard.writeText(errorDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 다시 시도하기
  const handleRetry = () => {
    if (productId) {
      router.push(`/payment?product=${productId}`);
    } else {
      router.push('/payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* 메인 에러 카드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="p-6 text-center border-b border-gray-100">
            <div className="flex justify-center mb-4">
              <TossIcon icon={categoryStyle.icon} color={categoryStyle.gradient} size="xl" shadow={categoryStyle.shadow} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
            <p className="text-gray-600">{displayDescription}</p>

            {errorCode && (
              <button
                onClick={handleCopyError}
                className="inline-flex items-center gap-1 mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>오류 코드: {errorCode}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 해결 방법 */}
          <div className="p-6 bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              해결 방법
            </h2>
            <ul className="space-y-2">
              {errorInfo.solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-sm flex-shrink-0">
                    {['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][idx] || `${idx+1}`}
                  </span>
                  {solution}
                </li>
              ))}
            </ul>
          </div>

          {/* 액션 버튼 */}
          <div className="p-6 space-y-3">
            {errorInfo.canRetry && (
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                다시 시도하기
              </button>
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

        {/* 대체 결제 수단 안내 */}
        {errorInfo.suggestAlternative && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">다른 결제 수단 이용하기</h2>
            <div className="space-y-3">
              {ALTERNATIVE_METHODS.map((method, idx) => (
                <button
                  key={idx}
                  onClick={handleRetry}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <TossIcon icon={method.icon} color={method.gradient} size="sm" shadow={method.shadow} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 고객센터 안내 */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">도움이 필요하신가요?</h2>
          <div className="space-y-3">
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mediplaton.kr'}`}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <span className="text-2xl">📞</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">고객센터 문의</p>
                <p className="text-sm text-gray-500">{process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@mediplaton.kr'}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
            <Link
              href="/faq"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <span className="text-2xl">❓</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">자주 묻는 질문</p>
                <p className="text-sm text-gray-500">결제 관련 FAQ 확인하기</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* 디버그 정보 (개발 모드에서만 표시 가능) */}
        {orderId && (
          <div className="mt-6 text-center text-sm text-gray-400">
            주문 번호: {orderId}
          </div>
        )}
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

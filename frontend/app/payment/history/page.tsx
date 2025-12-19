'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Payment {
  id: number;
  order_id: string;
  product_name: string;
  amount: number;
  status: string;
  method: string;
  paid_at: string | null;
  created_at: string;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/v1/payments/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELED: 'bg-gray-100 text-gray-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
    };

    const labels: { [key: string]: string } = {
      PENDING: '대기중',
      COMPLETED: '완료',
      FAILED: '실패',
      CANCELED: '취소',
      REFUNDED: '환불',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/mypage" className="text-blue-600 hover:underline">
            ← 마이페이지로 돌아가기
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">결제 내역</h1>

        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <p className="text-gray-500 mb-4">결제 내역이 없습니다.</p>
            <Link
              href="/payment"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              상품 구매하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {payment.product_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      주문번호: {payment.order_id}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">결제 금액</p>
                    <p className="font-semibold text-blue-600">
                      {payment.amount.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">결제 수단</p>
                    <p className="font-medium">{payment.method || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">결제일</p>
                    <p className="font-medium">{formatDate(payment.paid_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">요청일</p>
                    <p className="font-medium">{formatDate(payment.created_at)}</p>
                  </div>
                </div>

                {payment.status === 'COMPLETED' && (
                  <div className="mt-4 pt-4 border-t">
                    <button className="text-sm text-red-600 hover:underline">
                      환불 요청
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

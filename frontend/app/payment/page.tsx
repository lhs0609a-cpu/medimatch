'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  name: string;
  price: number;
  description: string;
}

interface Products {
  [key: string]: Product;
}

declare global {
  interface Window {
    TossPayments: any;
  }
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('product');

  const [products, setProducts] = useState<Products>({});
  const [selectedProduct, setSelectedProduct] = useState<string | null>(productId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    loadTossPaymentsScript();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/v1/payments/products');
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const loadTossPaymentsScript = () => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (!selectedProduct) {
      setError('상품을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 결제 요청 생성
      const response = await fetch('/api/v1/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          product_id: selectedProduct,
          success_url: `${window.location.origin}/payment/success`,
          fail_url: `${window.location.origin}/payment/fail`,
        }),
      });

      if (!response.ok) {
        throw new Error('결제 요청 생성에 실패했습니다.');
      }

      const data = await response.json();

      // 토스페이먼츠 결제창 호출
      const tossPayments = window.TossPayments(data.payment_data.clientKey);
      await tossPayments.requestPayment('카드', {
        amount: data.amount,
        orderId: data.order_id,
        orderName: products[selectedProduct].name,
        successUrl: data.payment_data.successUrl,
        failUrl: data.payment_data.failUrl,
      });
    } catch (err: any) {
      setError(err.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">결제하기</h1>

        {/* 상품 선택 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">상품 선택</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(products).map(([id, product]) => (
              <div
                key={id}
                onClick={() => setSelectedProduct(id)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedProduct === id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      selectedProduct === id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedProduct === id && (
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}원
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 정보 */}
        {selectedProduct && products[selectedProduct] && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">결제 정보</h2>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">상품명</span>
                <span className="font-medium">{products[selectedProduct].name}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">상품 금액</span>
                <span className="font-medium">{formatPrice(products[selectedProduct].price)}원</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600 font-semibold">총 결제 금액</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(products[selectedProduct].price)}원
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handlePayment}
          disabled={!selectedProduct || loading}
          className={`w-full py-4 rounded-xl text-lg font-semibold transition-colors ${
            selectedProduct && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              처리 중...
            </span>
          ) : (
            '결제하기'
          )}
        </button>

        {/* 안내 문구 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>결제 진행 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.</p>
          <p className="mt-2">결제 관련 문의: support@medimatch.kr</p>
        </div>
      </div>
    </div>
  );
}

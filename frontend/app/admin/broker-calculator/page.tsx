'use client';

import { Calculator } from 'lucide-react';
import CommissionCalculator from '@/components/broker/CommissionCalculator';

export default function BrokerCalculatorPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">수수료 계산기</h1>
          <p className="text-sm text-gray-500">상가 임대차 법정 중개수수료 + 플랫폼 분배 계산</p>
        </div>
      </div>
      <CommissionCalculator />
    </div>
  );
}

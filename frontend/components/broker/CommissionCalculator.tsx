'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';

interface CalcResult {
  legal_commission: {
    transaction_amount: number;
    rate: number;
    commission: number;
    vat: number;
    total: number;
  };
  breakdown: {
    total_income: number;
    total_cost: number;
    pre_tax_profit: number;
    vat: number;
    after_tax_profit: number;
    platform_share: number;
    broker_share_gross: number;
    withholding_tax: number;
    broker_net: number;
    roi_percent: number;
  };
}

function calcLegalCommission(deposit: number, monthlyRent: number) {
  const txAmount = deposit + monthlyRent * 100;
  let rate = 0.009;
  if (txAmount >= 900_000_000) rate = 0.003;
  else if (txAmount >= 600_000_000) rate = 0.004;
  else if (txAmount >= 200_000_000) rate = 0.005;
  else if (txAmount >= 50_000_000) rate = 0.008;
  const commission = Math.round(txAmount * rate);
  const vat = Math.round(commission * 0.1);
  return { transaction_amount: txAmount, rate: rate * 100, commission, vat, total: commission + vat };
}

function calcBreakdown(
  grossCommission: number,
  landlordCommission: number,
  marketingCost: number,
  adCost: number,
  platformRate: number,
  brokerRate: number,
) {
  const totalIncome = grossCommission + landlordCommission;
  const totalCost = marketingCost + adCost;
  const preTax = totalIncome - totalCost;
  const vat = Math.round(preTax * 0.1);
  const afterTax = preTax - vat;
  const platformShare = Math.round(afterTax * platformRate / 100);
  const brokerGross = Math.round(afterTax * brokerRate / 100);
  const withholding = Math.round(brokerGross * 0.033);
  const brokerNet = brokerGross - withholding;
  const roi = totalCost > 0 ? Math.round(afterTax / totalCost * 1000) / 10 : 0;
  return {
    total_income: totalIncome,
    total_cost: totalCost,
    pre_tax_profit: preTax,
    vat,
    after_tax_profit: afterTax,
    platform_share: platformShare,
    broker_share_gross: brokerGross,
    withholding_tax: withholding,
    broker_net: brokerNet,
    roi_percent: roi,
  };
}

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function CommissionCalculator() {
  const [deposit, setDeposit] = useState(100_000_000);
  const [monthlyRent, setMonthlyRent] = useState(3_000_000);
  const [grossCommission, setGrossCommission] = useState(0);
  const [landlordCommission, setLandlordCommission] = useState(0);
  const [marketingCost, setMarketingCost] = useState(0);
  const [adCost, setAdCost] = useState(0);
  const [platformRate, setPlatformRate] = useState(40);
  const [brokerRate, setBrokerRate] = useState(60);

  const legal = calcLegalCommission(deposit, monthlyRent);
  const gc = grossCommission || legal.total;
  const breakdown = calcBreakdown(gc, landlordCommission, marketingCost, adCost, platformRate, brokerRate);

  const fields: { label: string; value: number; setter: (v: number) => void; unit?: string }[] = [
    { label: '보증금', value: deposit, setter: setDeposit, unit: '원' },
    { label: '월세', value: monthlyRent, setter: setMonthlyRent, unit: '원' },
    { label: '중개수수료 (0=법정)', value: grossCommission, setter: setGrossCommission, unit: '원' },
    { label: '건물주 커미션', value: landlordCommission, setter: setLandlordCommission, unit: '원' },
    { label: '마케팅비', value: marketingCost, setter: setMarketingCost, unit: '원' },
    { label: '광고비', value: adCost, setter: setAdCost, unit: '원' },
    { label: '플랫폼 비율', value: platformRate, setter: setPlatformRate, unit: '%' },
    { label: '중개인 비율', value: brokerRate, setter: setBrokerRate, unit: '%' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">수수료 계산기</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
            <div className="relative">
              <input
                type="number"
                value={f.value}
                onChange={(e) => f.setter(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {f.unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{f.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 법정 수수료 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">법정 중개수수료 (상가 임대차)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-500">거래금액</div>
          <div className="text-right font-medium">{fmt(legal.transaction_amount)}원</div>
          <div className="text-gray-500">요율</div>
          <div className="text-right font-medium">{legal.rate}%</div>
          <div className="text-gray-500">수수료</div>
          <div className="text-right font-medium">{fmt(legal.commission)}원</div>
          <div className="text-gray-500">부가세</div>
          <div className="text-right font-medium">{fmt(legal.vat)}원</div>
          <div className="text-gray-700 font-semibold">합계</div>
          <div className="text-right font-bold text-blue-600">{fmt(legal.total)}원</div>
        </div>
      </div>

      {/* 분배 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">수익 분배</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">총 수입</div>
          <div className="text-right font-medium">{fmt(breakdown.total_income)}원</div>
          <div className="text-gray-600">총 비용</div>
          <div className="text-right font-medium text-red-600">-{fmt(breakdown.total_cost)}원</div>
          <div className="text-gray-600">세전 순수익</div>
          <div className="text-right font-medium">{fmt(breakdown.pre_tax_profit)}원</div>
          <div className="text-gray-600">부가세 (10%)</div>
          <div className="text-right font-medium text-red-600">-{fmt(breakdown.vat)}원</div>
          <div className="text-gray-600">세후 순수익</div>
          <div className="text-right font-medium">{fmt(breakdown.after_tax_profit)}원</div>
          <div className="border-t border-blue-200 col-span-2 my-1" />
          <div className="text-gray-600">플랫폼 몫 ({platformRate}%)</div>
          <div className="text-right font-medium">{fmt(breakdown.platform_share)}원</div>
          <div className="text-gray-600">중개인 총몫 ({brokerRate}%)</div>
          <div className="text-right font-medium">{fmt(breakdown.broker_share_gross)}원</div>
          <div className="text-gray-600">원천징수 (3.3%)</div>
          <div className="text-right font-medium text-red-600">-{fmt(breakdown.withholding_tax)}원</div>
          <div className="text-blue-700 font-bold">중개인 실수령</div>
          <div className="text-right font-bold text-blue-700">{fmt(breakdown.broker_net)}원</div>
          {breakdown.roi_percent > 0 && (
            <>
              <div className="text-gray-600">ROI</div>
              <div className="text-right font-medium text-green-600">{breakdown.roi_percent}%</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

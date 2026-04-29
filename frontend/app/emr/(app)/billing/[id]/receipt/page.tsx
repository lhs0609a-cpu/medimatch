'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { billService } from '@/lib/api/emr'

const ITEM_TYPE_LABEL: Record<string, string> = {
  CONSULTATION: '진찰',
  EXAM: '검사',
  PROCEDURE: '시술/처치',
  MEDICATION: '약제',
  MATERIAL: '재료',
}

const METHOD_LABEL: Record<string, string> = {
  CARD: '카드',
  CASH: '현금',
  MOBILE: '모바일',
  TRANSFER: '계좌이체',
  INSURANCE: '보험',
  OTHER: '기타',
}

export default function ReceiptPage() {
  const params = useParams()
  const id = params.id as string

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill-receipt', id],
    queryFn: () => billService.get(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (bill) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [bill])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!bill) return <div className="p-6 text-center">청구서를 찾을 수 없습니다.</div>

  return (
    <div className="max-w-md mx-auto p-6 bg-white text-black print:p-2 font-mono">
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 5mm; }
          body { color: #000; background: white !important; font-size: 11px; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { font-family: monospace; }
        }
      `}</style>

      <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
        <h1 className="text-lg font-bold">진료비 영수증</h1>
        <div className="text-xs">{bill.bill_no}</div>
        <div className="text-xs">{bill.bill_date}</div>
      </div>

      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1">항목</th>
            <th className="text-center py-1 w-8">수</th>
            <th className="text-right py-1">금액</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((it: any, i: number) => (
            <tr key={i}>
              <td className="py-1 align-top">
                <div>{it.name}</div>
                <div className="text-[9px] text-gray-600">
                  {ITEM_TYPE_LABEL[it.item_type] || it.item_type}
                  {!it.insurance_covered && ' · 비급여'}
                </div>
              </td>
              <td className="text-center py-1">{it.quantity}</td>
              <td className="text-right py-1">{it.total_price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-2 border-dashed border-black pt-2 space-y-1 text-xs">
        <div className="flex justify-between"><span>소계</span><span>{bill.subtotal.toLocaleString()}원</span></div>
        <div className="flex justify-between"><span>공단 부담</span><span>-{bill.insurance_amount.toLocaleString()}원</span></div>
        <div className="flex justify-between"><span>본인 부담</span><span>{bill.patient_amount.toLocaleString()}원</span></div>
        {bill.non_covered_amount > 0 && (
          <div className="flex justify-between"><span>비급여</span><span>{bill.non_covered_amount.toLocaleString()}원</span></div>
        )}
        {bill.discount_amount > 0 && (
          <div className="flex justify-between"><span>할인</span><span>-{bill.discount_amount.toLocaleString()}원</span></div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
          <span>합계</span><span>{bill.final_amount.toLocaleString()}원</span>
        </div>
      </div>

      {bill.payments.length > 0 && (
        <div className="mt-3 border-t border-dashed border-black pt-2">
          <div className="text-xs font-bold mb-1">결제 내역</div>
          {bill.payments.map((p: any, i: number) => (
            <div key={i} className="flex justify-between text-xs">
              <span>
                {METHOD_LABEL[p.method] || p.method}
                {p.card_last4 && ` (****${p.card_last4})`}
                {p.is_refund && ' · 환불'}
              </span>
              <span className={p.is_refund ? 'text-rose-600' : ''}>
                {p.is_refund ? '-' : ''}{Math.abs(p.amount).toLocaleString()}원
              </span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-bold mt-1 border-t border-dashed border-black pt-1">
            <span>수납 합계</span><span>{bill.paid_amount.toLocaleString()}원</span>
          </div>
          {bill.balance > 0 && (
            <div className="flex justify-between text-xs text-rose-600 font-bold">
              <span>미수금</span><span>{bill.balance.toLocaleString()}원</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-xs text-gray-600 mt-4 border-t border-dashed border-black pt-2">
        <div>감사합니다</div>
        {bill.completed_at && <div>완납 {new Date(bill.completed_at).toLocaleString('ko-KR')}</div>}
      </div>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="btn-primary">인쇄 / PDF로 저장</button>
      </div>
    </div>
  )
}

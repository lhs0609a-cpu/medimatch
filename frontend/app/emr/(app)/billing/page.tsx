'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Plus, X, CreditCard, Loader2, RotateCcw, CircleDollarSign, Printer } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { billService, Bill, BillItem } from '@/lib/api/emr'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    DRAFT: { color: 'bg-muted text-muted-foreground', label: '대기' },
    ISSUED: { color: 'bg-amber-100 text-amber-700', label: '발행' },
    PARTIAL: { color: 'bg-blue-100 text-blue-700', label: '부분수납' },
    PAID: { color: 'bg-green-100 text-green-700', label: '완납' },
    REFUNDED: { color: 'bg-rose-100 text-rose-700', label: '환불' },
    CANCELLED: { color: 'bg-muted text-muted-foreground', label: '취소' },
  }
  const s = map[status] || map.ISSUED
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
}

export default function BillingPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [payTarget, setPayTarget] = useState<Bill | null>(null)

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billService.list({ page_size: 50 } as any),
  })

  const { data: stats } = useQuery({
    queryKey: ['bill-stats'],
    queryFn: () => billService.stats(),
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-semibold">수납 관리</h1>
            <p className="text-sm text-muted-foreground">청구서 발행 · 부분 결제 · 환불 · 미수금 추적</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> 청구서 발행
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">오늘 매출</div>
          <div className="text-3xl font-bold mt-1 text-emerald-600">{(stats?.today_revenue ?? 0).toLocaleString()}원</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">이번 달 매출</div>
          <div className="text-3xl font-bold mt-1">{(stats?.month_revenue ?? 0).toLocaleString()}원</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted-foreground">미수금</div>
          <div className="text-3xl font-bold mt-1 text-amber-600">{(stats?.outstanding ?? 0).toLocaleString()}원</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">청구서 목록</h2>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        {!isLoading && (bills?.length ?? 0) === 0 && (
          <p className="text-center py-8 text-sm text-muted-foreground">청구서가 없습니다.</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 px-2">발행일</th>
                <th className="py-2 px-2">청구번호</th>
                <th className="py-2 px-2 text-right">총액</th>
                <th className="py-2 px-2 text-right">수납</th>
                <th className="py-2 px-2 text-right">잔액</th>
                <th className="py-2 px-2 text-center">상태</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {bills?.map((b: Bill) => (
                <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2">{b.bill_date}</td>
                  <td className="py-2 px-2 font-mono text-xs">{b.bill_no.slice(-12)}</td>
                  <td className="py-2 px-2 text-right">{b.final_amount.toLocaleString()}원</td>
                  <td className="py-2 px-2 text-right text-green-600">{b.paid_amount.toLocaleString()}원</td>
                  <td className="py-2 px-2 text-right text-amber-600 font-medium">{b.balance.toLocaleString()}원</td>
                  <td className="py-2 px-2 text-center"><StatusBadge status={b.status} /></td>
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.balance > 0 && b.status !== 'CANCELLED' && (
                        <button onClick={(e) => { e.stopPropagation(); setPayTarget(b) }} className="btn-secondary text-xs">
                          <CreditCard className="w-3 h-3" /> 수납
                        </button>
                      )}
                      <Link
                        href={`/emr/billing/${b.id}/receipt`}
                        target="_blank"
                        className="btn-ghost text-xs"
                        title="영수증 인쇄/PDF"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Printer className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <NewBillModal onClose={() => setShowForm(false)} onSuccess={() => {
        setShowForm(false)
        qc.invalidateQueries({ queryKey: ['bills'] })
        qc.invalidateQueries({ queryKey: ['bill-stats'] })
      }} />}
      {payTarget && <PaymentModal bill={payTarget} onClose={() => setPayTarget(null)} onSuccess={() => {
        setPayTarget(null)
        qc.invalidateQueries({ queryKey: ['bills'] })
        qc.invalidateQueries({ queryKey: ['bill-stats'] })
      }} />}
    </div>
  )
}

function NewBillModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [billDate, setBillDate] = useState(today)
  const [discount, setDiscount] = useState(0)
  const [memo, setMemo] = useState('')
  const [items, setItems] = useState<Omit<BillItem, 'id' | 'total_price'>[]>([
    { item_type: 'CONSULTATION', code: '', name: '', quantity: 1, unit_price: 0, insurance_covered: true, copay_rate: 0.30 },
  ])

  const createMut = useMutation({
    mutationFn: billService.create,
    onSuccess: () => {
      toast.success('청구서 발행 완료')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '발행 실패'),
  })

  const update = (i: number, p: Partial<typeof items[0]>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const add = () => setItems([...items, { item_type: 'PROCEDURE', code: '', name: '', quantity: 1, unit_price: 0, insurance_covered: true, copay_rate: 0.30 }])

  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
  const final = Math.max(0, subtotal - discount)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-xl max-w-2xl w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">청구서 발행</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label text-xs">발행일</label><input type="date" className="input" value={billDate} onChange={(e) => setBillDate(e.target.value)} /></div>
          <div><label className="label text-xs">할인 (원)</label><input type="number" className="input" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label text-xs">청구 항목</label>
            <button onClick={add} className="btn-ghost text-xs"><Plus className="w-3 h-3" /> 추가</button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <select className="input col-span-2" value={it.item_type} onChange={(e) => update(i, { item_type: e.target.value })}>
                  <option value="CONSULTATION">진찰</option>
                  <option value="EXAM">검사</option>
                  <option value="PROCEDURE">시술</option>
                  <option value="MEDICATION">약제</option>
                  <option value="MATERIAL">재료</option>
                </select>
                <input className="input col-span-4" placeholder="명칭" value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
                <input className="input col-span-1" type="number" min={1} value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                <input className="input col-span-2" type="number" placeholder="단가" value={it.unit_price} onChange={(e) => update(i, { unit_price: Number(e.target.value) })} />
                <input className="input col-span-1" type="number" step="0.01" min={0} max={1} value={it.copay_rate} onChange={(e) => update(i, { copay_rate: Number(e.target.value) })} title="본인부담률" />
                <label className="flex items-center gap-1 text-[10px] col-span-1">
                  <input type="checkbox" checked={it.insurance_covered} onChange={(e) => update(i, { insurance_covered: e.target.checked })} /> 급여
                </label>
                <button onClick={() => remove(i)} className="text-rose-500 col-span-1"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>소계</span><span>{subtotal.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span>할인</span><span className="text-rose-600">-{discount.toLocaleString()}원</span></div>
          <div className="flex justify-between font-bold text-lg"><span>최종</span><span>{final.toLocaleString()}원</span></div>
        </div>

        <textarea className="input" placeholder="메모" value={memo} onChange={(e) => setMemo(e.target.value)} />

        <button
          onClick={() =>
            createMut.mutate({
              bill_date: billDate,
              discount_amount: discount,
              memo: memo || undefined,
              items: items.filter((it) => it.name),
            })
          }
          disabled={createMut.isPending || items.filter((it) => it.name).length === 0}
          className="btn-primary w-full"
        >
          {createMut.isPending ? '발행 중...' : '발행'}
        </button>
      </div>
    </div>
  )
}

function PaymentModal({ bill, onClose, onSuccess }: { bill: Bill; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(bill.balance)
  const [method, setMethod] = useState('CARD')
  const [cardLast4, setCardLast4] = useState('')

  const payMut = useMutation({
    mutationFn: () => billService.pay(bill.id, {
      amount,
      method,
      card_last4: method === 'CARD' && cardLast4 ? cardLast4 : undefined,
    }),
    onSuccess: () => {
      toast.success('수납 완료')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '수납 실패'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><CircleDollarSign className="w-5 h-5" /> 수납 처리</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between"><span>총액</span><b>{bill.final_amount.toLocaleString()}원</b></div>
          <div className="flex justify-between"><span>이미 수납</span><span className="text-green-600">{bill.paid_amount.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span>잔액</span><b className="text-amber-600">{bill.balance.toLocaleString()}원</b></div>
        </div>
        <div><label className="label text-xs">수납액</label><input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} max={bill.balance} /></div>
        <div><label className="label text-xs">결제 수단</label><select className="input" value={method} onChange={(e) => setMethod(e.target.value)}><option value="CARD">카드</option><option value="CASH">현금</option><option value="MOBILE">모바일</option><option value="TRANSFER">계좌이체</option><option value="INSURANCE">보험</option></select></div>
        {method === 'CARD' && <div><label className="label text-xs">카드 끝 4자리</label><input className="input" value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} maxLength={4} /></div>}
        <button onClick={() => payMut.mutate()} disabled={payMut.isPending || amount <= 0} className="btn-primary w-full">
          {payMut.isPending ? '처리 중...' : `${amount.toLocaleString()}원 수납`}
        </button>
      </div>
    </div>
  )
}

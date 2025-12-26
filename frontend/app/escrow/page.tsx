'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Shield, FileText, MessageCircle, AlertCircle,
  Clock, CheckCircle, XCircle, Loader2, ArrowRight,
  CreditCard, TrendingUp
} from 'lucide-react'
import { escrowService } from '@/lib/api/services'
import { EscrowStatus, EscrowTransaction } from '@/lib/api/client'

const statusConfig: Record<EscrowStatus, { label: string; color: string; icon: typeof Clock }> = {
  INITIATED: { label: '시작됨', color: 'bg-gray-100 text-gray-700', icon: Clock },
  FUNDED: { label: '예치 완료', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  RELEASED: { label: '정산 완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  DISPUTED: { label: '분쟁 중', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  REFUNDED: { label: '환불됨', color: 'bg-orange-100 text-orange-700', icon: XCircle },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

export default function EscrowDashboardPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<EscrowStatus | 'ALL'>('ALL')

  const { data, isLoading, error } = useQuery({
    queryKey: ['escrow-transactions'],
    queryFn: () => escrowService.getTransactions(),
  })

  const filteredTransactions = data?.items.filter(t =>
    filter === 'ALL' || t.status === filter
  ) || []

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getMilestoneProgress = (transaction: EscrowTransaction) => {
    if (!transaction.milestones || transaction.milestones.length === 0) return 0
    const approved = transaction.milestones.filter(m =>
      m.status === 'APPROVED' || m.status === 'RELEASED'
    ).length
    return Math.round((approved / transaction.milestones.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">거래 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600">거래 목록을 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">에스크로 결제</h1>
                <p className="text-sm text-gray-500">안전한 거래를 위한 에스크로 시스템</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">안전 거래 시스템</p>
              <p className="text-sm text-blue-700 mt-1">
                에스크로 결제를 통해 서비스 완료 전까지 결제금이 안전하게 보호됩니다.
                마일스톤별로 단계적 지급이 이루어집니다.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체 ({data?.total || 0})
          </button>
          {(['IN_PROGRESS', 'FUNDED', 'COMPLETED', 'DISPUTED'] as EscrowStatus[]).map((status) => {
            const config = statusConfig[status]
            const count = data?.items.filter(t => t.status === status).length || 0
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {config.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">에스크로 거래가 없습니다</h3>
            <p className="text-gray-500 mb-6">
              파트너와 계약 후 에스크로 거래가 생성됩니다.
            </p>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              파트너 둘러보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const config = statusConfig[transaction.status]
              const StatusIcon = config.icon
              const progress = getMilestoneProgress(transaction)

              return (
                <div
                  key={transaction.id}
                  onClick={() => router.push(`/escrow/${transaction.id}`)}
                  className="bg-white rounded-xl p-4 border hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transaction.escrow_number}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">
                        {transaction.partner_name || `파트너 #${transaction.partner_id}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transaction.contract?.title || '에스크로 거래'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatAmount(transaction.total_amount)}원
                      </p>
                      <p className="text-xs text-gray-500">
                        수수료 {formatAmount(transaction.platform_fee)}원
                      </p>
                    </div>
                  </div>

                  {/* Milestone Progress */}
                  {transaction.milestones && transaction.milestones.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>마일스톤 진행률</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        {transaction.milestones.map((m, idx) => (
                          <div
                            key={m.id}
                            className={`flex items-center gap-1 text-xs ${
                              m.status === 'APPROVED' || m.status === 'RELEASED'
                                ? 'text-green-600'
                                : m.status === 'SUBMITTED'
                                ? 'text-yellow-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {m.status === 'APPROVED' || m.status === 'RELEASED' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <span className="w-3 h-3 border rounded-full" />
                            )}
                            <span>{m.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(transaction.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        채팅
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, Loader2, Shield, FileText,
  CheckCircle, Clock, AlertTriangle, XCircle,
  CreditCard, MessageCircle, AlertCircle, Flag
} from 'lucide-react'
import { escrowService } from '@/lib/api/services'
import { EscrowStatus, MilestoneStatus, EscrowMilestone } from '@/lib/api/client'

const statusConfig: Record<EscrowStatus, { label: string; color: string }> = {
  INITIATED: { label: '시작됨', color: 'bg-gray-100 text-gray-700' },
  FUNDED: { label: '예치 완료', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  RELEASED: { label: '정산 완료', color: 'bg-emerald-100 text-emerald-700' },
  DISPUTED: { label: '분쟁 중', color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: '환불됨', color: 'bg-orange-100 text-orange-700' },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-500' },
}

const milestoneStatusConfig: Record<MilestoneStatus, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-gray-100 text-gray-600' },
  FUNDED: { label: '예치됨', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  SUBMITTED: { label: '검토 대기', color: 'bg-purple-100 text-purple-700' },
  APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-700' },
  RELEASED: { label: '지급 완료', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-700' },
}

export default function EscrowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'milestones'>('chat')
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

  const escrowId = params.id as string

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['escrow-transaction', escrowId],
    queryFn: () => escrowService.getTransaction(escrowId),
    enabled: !!escrowId,
    refetchInterval: 10000,
  })

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['escrow-messages', escrowId],
    queryFn: () => escrowService.getMessages(escrowId),
    enabled: !!escrowId,
    refetchInterval: 5000, // 5 second polling for chat
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => escrowService.sendMessage(escrowId, { content }),
    onSuccess: (data) => {
      setNewMessage('')
      if (data.warning_message) {
        setWarningMessage(data.warning_message)
        setTimeout(() => setWarningMessage(null), 5000)
      }
      refetchMessages()
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || '메시지 전송 실패')
    },
  })

  const approveMutation = useMutation({
    mutationFn: (milestoneId: string) => escrowService.approveMilestone(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-transaction', escrowId] })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.items])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    sendMutation.mutate(newMessage.trim())
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">거래 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">거래를 찾을 수 없습니다</h2>
          <Link href="/escrow" className="text-blue-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const config = statusConfig[transaction.status]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">에스크로 거래</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{transaction.escrow_number}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatAmount(transaction.total_amount)}원
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Warning Banner */}
      {warningMessage && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{warningMessage}</p>
          </div>
        </div>
      )}

      {/* Contact Detection Warning Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">안전 거래를 위해 플랫폼 내에서만 소통해주세요</p>
            <p className="text-blue-600">연락처(전화번호, 이메일, SNS 등) 공유 시 자동으로 마스킹됩니다.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                채팅
                {messages?.unread_count ? (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {messages.unread_count}
                  </span>
                ) : null}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'milestones'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Flag className="w-4 h-4" />
                마일스톤 ({transaction.milestones?.length || 0})
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
              {messages?.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>대화를 시작해보세요</p>
                  <p className="text-sm mt-1">모든 대화는 안전하게 보호됩니다</p>
                </div>
              ) : (
                messages?.items.slice().reverse().map((msg, idx, arr) => {
                  const isCurrentUser = msg.sender_id === transaction.customer_id
                  const showDate = idx === 0 ||
                    new Date(msg.created_at).toDateString() !==
                    new Date(arr[idx - 1].created_at).toDateString()

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {/* System message */}
                      {msg.message_type === 'SYSTEM' ? (
                        <div className="text-center my-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            <p className="text-xs text-gray-500 mb-1">
                              {msg.sender_name || (isCurrentUser ? '나' : '파트너')}
                            </p>
                            <div className={`rounded-2xl px-4 py-2 ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {/* Contact info warning */}
                            {msg.contains_contact_info && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span>연락처가 마스킹되었습니다</span>
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(msg.created_at)}
                              {msg.is_read && isCurrentUser && ' · 읽음'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Milestones Tab */
          <div className="flex-1 overflow-y-auto p-4">
            {/* Summary */}
            <div className="bg-white rounded-xl p-4 mb-4 border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">총 금액</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatAmount(transaction.total_amount)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">플랫폼 수수료</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatAmount(transaction.platform_fee)}원
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">파트너 지급액</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(transaction.partner_payout)}원
                  </p>
                </div>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-4">
              {transaction.milestones?.map((milestone, idx) => {
                const mConfig = milestoneStatusConfig[milestone.status]
                const isActive = milestone.status === 'IN_PROGRESS' || milestone.status === 'SUBMITTED'
                const isApproved = milestone.status === 'APPROVED' || milestone.status === 'RELEASED'

                return (
                  <div
                    key={milestone.id}
                    className={`bg-white rounded-xl p-4 border ${
                      isActive ? 'border-blue-300 shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isApproved
                            ? 'bg-green-100 text-green-600'
                            : isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isApproved ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                          <p className="text-sm text-gray-500">{milestone.description}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${mConfig.color}`}>
                        {mConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {formatAmount(milestone.amount)}원 ({milestone.percentage}%)
                        </span>
                        {milestone.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(milestone.due_date)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {milestone.status === 'SUBMITTED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveMutation.mutate(milestone.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('거절 사유를 입력해주세요')
                              if (reason) {
                                escrowService.rejectMilestone(milestone.id, reason)
                                  .then(() => queryClient.invalidateQueries({ queryKey: ['escrow-transaction', escrowId] }))
                              }
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Proof files */}
                    {milestone.proof_description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>제출 내용:</strong> {milestone.proof_description}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Release Button */}
            {transaction.status === 'COMPLETED' && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    if (confirm('정산을 요청하시겠습니까?')) {
                      escrowService.releaseTransaction(escrowId)
                        .then(() => queryClient.invalidateQueries({ queryKey: ['escrow-transaction', escrowId] }))
                    }
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  정산 요청하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dispute Button */}
      {transaction.status !== 'CANCELLED' && transaction.status !== 'RELEASED' && (
        <div className="bg-white border-t p-4">
          <button
            onClick={() => {
              const reason = prompt('분쟁 사유를 입력해주세요')
              if (reason) {
                escrowService.createDispute(escrowId, {
                  reason: '서비스 불만족',
                  description: reason,
                })
                  .then(() => {
                    alert('분쟁이 접수되었습니다. 관리자가 검토 후 연락드립니다.')
                    queryClient.invalidateQueries({ queryKey: ['escrow-transaction', escrowId] })
                  })
                  .catch(() => alert('분쟁 접수 실패'))
              }
            }}
            className="w-full py-2 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              문제가 있으신가요? 분쟁 제기하기
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

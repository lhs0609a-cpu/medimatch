'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Phone, Mail, MapPin, Send, Calendar,
  CheckCircle, XCircle, Loader2, User, Building2
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { MatchStatus } from '@/lib/api/client'

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [newMessage, setNewMessage] = useState('')

  const { data: match, isLoading } = useQuery({
    queryKey: ['pharmacy-match-match', params.id],
    queryFn: () => pharmacyMatchService.getMatch(params.id as string),
    enabled: !!params.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['pharmacy-match-messages', params.id],
    queryFn: () => pharmacyMatchService.getMessages(params.id as string),
    enabled: !!params.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => pharmacyMatchService.sendMessage(params.id as string, content),
    onSuccess: () => {
      setNewMessage('')
      refetchMessages()
    },
  })

  const statusMutation = useMutation({
    mutationFn: (data: { status: MatchStatus; cancel_reason?: string }) =>
      pharmacyMatchService.updateMatchStatus(params.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-match-match', params.id] })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">매칭 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">매칭을 찾을 수 없습니다</h2>
          <Link href="/pharmacy-match/matches" className="text-purple-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const isContactRevealed = match.status !== 'PENDING'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="font-bold text-gray-900">매칭 상세</p>
              <p className="text-sm text-gray-500">
                {match.listing_info.region_name} · {match.profile_info.anonymous_id}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            match.status === 'MUTUAL' || match.status === 'CHATTING' ? 'bg-green-100 text-green-700' :
            match.status === 'CONTRACTED' ? 'bg-emerald-100 text-emerald-700' :
            match.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {match.status === 'PENDING' ? '대기중' :
             match.status === 'MUTUAL' ? '상호 관심' :
             match.status === 'CHATTING' ? '대화중' :
             match.status === 'MEETING' ? '미팅 진행' :
             match.status === 'CONTRACTED' ? '계약 완료' : '취소됨'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Match Info */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">매칭률</p>
            <p className="text-2xl font-bold text-purple-600">{match.match_score?.toFixed(0) || '-'}%</p>
          </div>

          {match.match_score_breakdown && (
            <div className="grid grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">지역</p>
                <p className="font-bold">{match.match_score_breakdown.region}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">예산</p>
                <p className="font-bold">{match.match_score_breakdown.budget}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">규모</p>
                <p className="font-bold">{match.match_score_breakdown.size}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">매출</p>
                <p className="font-bold">{match.match_score_breakdown.revenue}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">유형</p>
                <p className="font-bold">{match.match_score_breakdown.type}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-500">경력</p>
                <p className="font-bold">{match.match_score_breakdown.experience}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Info (if revealed) */}
        {isContactRevealed && (
          <div className="bg-green-50 border-b border-green-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-800">연락처가 공개되었습니다</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Listing Owner Info */}
              {match.listing_private && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    매물주 정보
                  </p>
                  <p className="font-medium text-gray-900 mb-2">
                    {match.listing_private.pharmacy_name || '약국'}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {match.listing_private.exact_address}
                    </p>
                    {match.listing_private.owner_phone && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${match.listing_private.owner_phone}`} className="text-purple-600">
                          {match.listing_private.owner_phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pharmacist Info */}
              {match.profile_private && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    약사 정보
                  </p>
                  <p className="font-medium text-gray-900 mb-2">
                    {match.profile_private.full_name || '약사'}
                  </p>
                  <div className="space-y-1 text-sm">
                    {match.profile_private.phone && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${match.profile_private.phone}`} className="text-purple-600">
                          {match.profile_private.phone}
                        </a>
                      </p>
                    )}
                    {match.profile_private.email && (
                      <p className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${match.profile_private.email}`} className="text-purple-600">
                          {match.profile_private.email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
          {messages?.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>대화를 시작해보세요</p>
            </div>
          ) : (
            messages?.items.slice().reverse().map((msg, idx, arr) => {
              const isCurrentUser = msg.sender_id === match.profile_info.id
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
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      <p className="text-xs text-gray-500 mb-1">
                        {msg.sender_anonymous_id}
                      </p>
                      <div className={`rounded-2xl px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(msg.created_at)}
                        {msg.is_read && isCurrentUser && ' · 읽음'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {isContactRevealed && match.status !== 'CANCELLED' && match.status !== 'CONTRACTED' && (
          <div className="bg-white border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 disabled:bg-gray-300"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status Actions */}
        {isContactRevealed && match.status !== 'CANCELLED' && match.status !== 'CONTRACTED' && (
          <div className="bg-white border-t p-4">
            <div className="flex gap-2">
              {match.status === 'MUTUAL' || match.status === 'CHATTING' ? (
                <>
                  <button
                    onClick={() => statusMutation.mutate({ status: 'MEETING' })}
                    disabled={statusMutation.isPending}
                    className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    미팅 예약
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('정말 취소하시겠습니까?')) {
                        statusMutation.mutate({ status: 'CANCELLED', cancel_reason: '사용자 취소' })
                      }
                    }}
                    disabled={statusMutation.isPending}
                    className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              ) : match.status === 'MEETING' ? (
                <>
                  <button
                    onClick={() => statusMutation.mutate({ status: 'CONTRACTED' })}
                    disabled={statusMutation.isPending}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    계약 완료
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('정말 취소하시겠습니까?')) {
                        statusMutation.mutate({ status: 'CANCELLED', cancel_reason: '사용자 취소' })
                      }
                    }}
                    disabled={statusMutation.isPending}
                    className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Commission Notice */}
        {match.status === 'CONTRACTED' && match.commission_amount && (
          <div className="bg-amber-50 border-t border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <strong>수수료 안내:</strong> 계약이 완료되었습니다.
              권리금의 {match.commission_rate}% ({match.commission_amount.toLocaleString()}만원)가 수수료로 청구됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreVertical,
  Building,
  AlertCircle,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Shield,
  X,
  FileSignature,
  CreditCard,
} from 'lucide-react'
import { chatService, escrowService } from '@/lib/api/services'

interface Message {
  id: string
  sender_id: string
  sender_type: string
  sender_name?: string
  message_type: string
  content: string
  filtered_content?: string
  contains_contact: boolean
  attachments: any[]
  metadata: any
  is_read: boolean
  created_at: string
}

interface ChatRoom {
  id: number
  room_code: string
  partner_id: number
  partner_name: string
  partner_logo?: string
  inquiry_id?: number
  inquiry_title?: string
  status: string
  messages: Message[]
  created_at: string
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = Number(params.roomId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [currentUserId] = useState('current-user-id') // Should come from auth context
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    total_amount: '',
    service_start_date: '',
    service_end_date: '',
  })
  const [isCreatingContract, setIsCreatingContract] = useState(false)

  useEffect(() => {
    loadRoom()
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [room?.messages])

  const loadRoom = async () => {
    setIsLoading(true)
    try {
      const data = await chatService.getRoom(roomId)
      setRoom(data)
      // Mark as read
      await chatService.markAsRead(roomId)
    } catch (error) {
      // Mock data
      setRoom({
        id: roomId,
        room_code: 'CHAT-ABC12345',
        partner_id: 1,
        partner_name: '메디인테리어',
        partner_logo: undefined,
        inquiry_id: 1,
        inquiry_title: '강남 피부과 인테리어 견적 문의',
        status: 'ACTIVE',
        messages: [
          {
            id: '1',
            sender_id: 'system',
            sender_type: 'system',
            sender_name: '시스템',
            message_type: 'SYSTEM',
            content: '메디인테리어와의 상담이 시작되었습니다. 플랫폼 내에서 안전하게 상담하세요.',
            filtered_content: null,
            contains_contact: false,
            attachments: [],
            metadata: {},
            is_read: true,
            created_at: '2024-12-28T10:00:00',
          },
          {
            id: '2',
            sender_id: 'current-user-id',
            sender_type: 'user',
            sender_name: '나',
            message_type: 'TEXT',
            content: '안녕하세요. 강남역 근처에 피부과 개원을 준비 중입니다. 45평 정도 규모로 인테리어 견적을 받고 싶습니다.',
            filtered_content: null,
            contains_contact: false,
            attachments: [],
            metadata: {},
            is_read: true,
            created_at: '2024-12-28T10:01:00',
          },
          {
            id: '3',
            sender_id: 'partner-1',
            sender_type: 'partner',
            sender_name: '메디인테리어',
            message_type: 'TEXT',
            content: '안녕하세요! 문의 감사합니다. 45평 피부과 기준으로 보통 1억~1.5억 정도 예상됩니다. 정확한 견적을 위해 현장 미팅이 가능하실까요?',
            filtered_content: null,
            contains_contact: false,
            attachments: [],
            metadata: {},
            is_read: true,
            created_at: '2024-12-28T10:05:00',
          },
          {
            id: '4',
            sender_id: 'current-user-id',
            sender_type: 'user',
            sender_name: '나',
            message_type: 'TEXT',
            content: '네, 현장 미팅 가능합니다. 이번 주 목요일 오후 2시 어떠세요?',
            filtered_content: null,
            contains_contact: false,
            attachments: [],
            metadata: {},
            is_read: true,
            created_at: '2024-12-28T10:10:00',
          },
          {
            id: '5',
            sender_id: 'partner-1',
            sender_type: 'partner',
            sender_name: '메디인테리어',
            message_type: 'TEXT',
            content: '네, 내일 오후 2시에 현장 미팅 가능합니다. 주소를 알려주시면 방문하겠습니다.',
            filtered_content: null,
            contains_contact: false,
            attachments: [],
            metadata: {},
            is_read: false,
            created_at: '2024-12-31T14:30:00',
          },
        ],
        created_at: '2024-12-28T10:00:00',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!message.trim() || isSending || !room) return

    setIsSending(true)
    try {
      const response = await chatService.sendMessage(room.id, {
        content: message.trim(),
        message_type: 'TEXT',
      })

      // Check for contact detection warning
      if (response.contact_detected) {
        setWarningMessage(response.warning_message || '연락처가 감지되어 마스킹 처리되었습니다.')
        setShowWarning(true)
      }

      // Add message to list
      setRoom((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, response.message],
      } : null)

      setMessage('')
      inputRef.current?.focus()
    } catch (error) {
      // Demo: add mock message
      const newMessage: Message = {
        id: Date.now().toString(),
        sender_id: currentUserId,
        sender_type: 'user',
        sender_name: '나',
        message_type: 'TEXT',
        content: message.trim(),
        filtered_content: null,
        contains_contact: false,
        attachments: [],
        metadata: {},
        is_read: false,
        created_at: new Date().toISOString(),
      }

      setRoom((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
      } : null)

      setMessage('')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  }

  const handleCreateContract = async () => {
    if (!room || !contractForm.title || !contractForm.total_amount) return

    setIsCreatingContract(true)
    try {
      const contract = await escrowService.createContract({
        partner_id: room.partner_id,
        inquiry_id: room.inquiry_id,
        title: contractForm.title,
        description: contractForm.description,
        contract_content: `${contractForm.title}\n\n${contractForm.description}`,
        total_amount: Number(contractForm.total_amount),
        service_start_date: contractForm.service_start_date || undefined,
        service_end_date: contractForm.service_end_date || undefined,
      })

      // 계약서 생성 메시지 전송
      await chatService.sendMessage(room.id, {
        message_type: 'CONTRACT',
        content: `📋 계약서가 생성되었습니다.\n\n${contractForm.title}\n금액: ${Number(contractForm.total_amount).toLocaleString()}원\n\n계약서를 확인하고 서명해주세요.`,
        metadata: { contract_id: contract.id },
      })

      setShowContractModal(false)
      setContractForm({ title: '', description: '', total_amount: '', service_start_date: '', service_end_date: '' })

      // 에스크로 페이지로 이동
      router.push(`/escrow/${contract.id}`)
    } catch (error) {
      alert('계약서 생성에 실패했습니다.')
    } finally {
      setIsCreatingContract(false)
    }
  }

  const shouldShowDate = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()
    return currentDate !== prevDate
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">채팅방을 찾을 수 없습니다</h2>
          <Link href="/chat" className="text-violet-600 hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Link href={`/partners/${room.partner_id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              {room.partner_logo ? (
                <img src={room.partner_logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <Building className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">{room.partner_name}</h1>
              <p className="text-xs text-gray-500 truncate">
                {room.status === 'ACTIVE' ? '상담중' : room.status === 'CONTRACTED' ? '계약완료' : '종료'}
              </p>
            </div>
          </Link>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Inquiry Info */}
        {room.inquiry_title && (
          <div className="px-4 py-2 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 truncate">
              <span className="text-gray-400">관련 문의:</span> {room.inquiry_title}
            </p>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">안전한 거래를 위해 플랫폼 내에서 상담하세요</p>
            <p className="text-blue-600">외부 연락처 공유 시 자동으로 마스킹 처리됩니다.</p>
          </div>
        </div>

        {room.messages.map((msg, idx) => {
          const prevMsg = room.messages[idx - 1]
          const isMe = msg.sender_id === currentUserId
          const isSystem = msg.sender_type === 'system'

          return (
            <div key={msg.id}>
              {/* Date Separator */}
              {shouldShowDate(msg, prevMsg) && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}

              {/* System Message */}
              {isSystem ? (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full max-w-xs text-center">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* User/Partner Message */
                <div className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                    {/* Sender Name (for partner) */}
                    {!isMe && (
                      <span className="text-xs text-gray-500 ml-1 mb-1 block">{room.partner_name}</span>
                    )}

                    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {/* Contact Warning */}
                        {msg.contains_contact && (
                          <div className={`flex items-center gap-1 text-xs mb-1 ${isMe ? 'text-violet-200' : 'text-amber-600'}`}>
                            <AlertCircle className="w-3 h-3" />
                            연락처 마스킹됨
                          </div>
                        )}

                        {/* Message Content */}
                        <p className="whitespace-pre-wrap break-words">
                          {msg.contains_contact ? msg.filtered_content || msg.content : msg.content}
                        </p>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att: any, i: number) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                  isMe ? 'bg-violet-500' : 'bg-gray-100'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Time & Read Status */}
                      <div className={`flex items-center gap-1 text-xs text-gray-400 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isMe && (
                          msg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-violet-600" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Warning Toast */}
      {showWarning && (
        <div className="absolute top-20 left-4 right-4 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-lg flex items-start gap-3 z-50">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium">연락처가 감지되었습니다</p>
            <p className="text-sm text-amber-700">{warningMessage}</p>
          </div>
          <button onClick={() => setShowWarning(false)} className="text-amber-600 hover:text-amber-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input */}
      {room.status === 'ACTIVE' ? (
        <div className="bg-white border-t p-4 flex-shrink-0">
          <div className="flex items-end gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowContractModal(true)}
              className="p-2 text-violet-600 hover:text-violet-700 transition-colors"
              title="계약 제안"
            >
              <FileSignature className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent max-h-32"
                style={{ minHeight: '48px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 border-t p-4 text-center">
          <p className="text-gray-500">
            {room.status === 'CONTRACTED' ? '계약이 완료된 채팅방입니다.' : '종료된 채팅방입니다.'}
          </p>
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSignature className="w-6 h-6 text-violet-600" />
                <h2 className="font-bold text-lg">계약 제안</h2>
              </div>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계약 제목 *</label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="예: 강남 피부과 인테리어 공사"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">총 금액 (원) *</label>
                <input
                  type="number"
                  value={contractForm.total_amount}
                  onChange={(e) => setContractForm({ ...contractForm, total_amount: e.target.value })}
                  placeholder="100000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {contractForm.total_amount && (
                  <p className="text-sm text-gray-500 mt-1">
                    {Number(contractForm.total_amount).toLocaleString()}원
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={contractForm.service_start_date}
                    onChange={(e) => setContractForm({ ...contractForm, service_start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={contractForm.service_end_date}
                    onChange={(e) => setContractForm({ ...contractForm, service_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                <textarea
                  value={contractForm.description}
                  onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                  placeholder="작업 범위, 포함 사항 등을 상세히 기재해주세요"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 에스크로 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">에스크로 결제 시스템</p>
                    <p className="mt-1">계약 금액은 에스크로에 예치되며, 마일스톤(30%-40%-30%) 완료 시 단계별로 지급됩니다.</p>
                    <p className="mt-1">플랫폼 수수료: 3%</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateContract}
                disabled={!contractForm.title || !contractForm.total_amount || isCreatingContract}
                className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingContract ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    계약서 생성 중...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    계약서 생성 및 에스크로 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

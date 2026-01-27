'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Search,
  Building,
  ChevronRight,
  Check,
  CheckCheck,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react'
import { chatService } from '@/lib/api/services'

interface ChatRoom {
  id: number
  room_code: string
  partner_id: number
  partner_name: string
  partner_logo?: string
  status: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  created_at: string
}

export default function ChatListPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all')

  useEffect(() => {
    loadRooms()
  }, [filter])

  const loadRooms = async () => {
    setIsLoading(true)
    try {
      const data = await chatService.getRooms({
        status: filter === 'all' ? undefined : filter.toUpperCase(),
      })
      setRooms(data.rooms)
    } catch (error) {
      // Mock data
      setRooms([
        {
          id: 1,
          room_code: 'CHAT-ABC12345',
          partner_id: 1,
          partner_name: '메디인테리어',
          partner_logo: undefined,
          status: 'ACTIVE',
          last_message: '네, 내일 오후 2시에 현장 미팅 가능합니다.',
          last_message_at: '2024-12-31T14:30:00',
          unread_count: 2,
          created_at: '2024-12-28T10:00:00',
        },
        {
          id: 2,
          room_code: 'CHAT-DEF67890',
          partner_id: 2,
          partner_name: '헬스케어솔루션',
          partner_logo: undefined,
          status: 'ACTIVE',
          last_message: '견적서 첨부해드렸습니다. 확인 부탁드립니다.',
          last_message_at: '2024-12-30T11:20:00',
          unread_count: 0,
          created_at: '2024-12-25T15:00:00',
        },
        {
          id: 3,
          room_code: 'CHAT-GHI11111',
          partner_id: 3,
          partner_name: '개원컨설팅그룹',
          partner_logo: undefined,
          status: 'CONTRACTED',
          last_message: '계약이 완료되었습니다. 감사합니다!',
          last_message_at: '2024-12-20T16:45:00',
          unread_count: 0,
          created_at: '2024-12-10T09:00:00',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '어제'
    } else if (days < 7) {
      return `${days}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">상담중</span>
      case 'CONTRACTED':
        return <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">계약완료</span>
      case 'CLOSED':
        return <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">종료</span>
      default:
        return null
    }
  }

  const totalUnread = rooms.reduce((sum, room) => sum + room.unread_count, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">채팅</span>
                {totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '상담중' },
              { key: 'closed', label: '종료' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                    <div className="h-3 bg-secondary rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/chat/${room.id}`}
                className="block card card-interactive p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {room.partner_logo ? (
                        <img src={room.partner_logo} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <Building className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    {room.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {room.unread_count > 9 ? '9+' : room.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${room.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {room.partner_name}
                        </h3>
                        {getStatusBadge(room.status)}
                      </div>
                      {room.last_message_at && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(room.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {room.unread_count === 0 && (
                        <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      <p className={`text-sm truncate ${room.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {room.last_message || '대화를 시작해보세요'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">채팅이 없습니다</h3>
            <p className="text-muted-foreground mb-6">파트너에게 문의하면 채팅이 시작됩니다.</p>
            <Link href="/partners" className="btn-primary">
              파트너 찾아보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronRight,
  Settings,
  Trash2,
  ArrowLeft,
  Loader2,
  Sparkles,
  MapPin,
  MessageCircle,
  CreditCard,
  Building,
  Users,
  AlertCircle,
} from 'lucide-react'
import { notificationService, UserNotification, NotificationType } from '@/lib/api/services'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await notificationService.getNotifications({
        unread_only: filter === 'unread',
        limit: 50,
      })
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    } catch (error) {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // Optimistic update anyway
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    if (notification.data?.url) {
      router.push(notification.data.url)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'PROSPECT_NEW':
      case 'PROSPECT_ALERT':
      case 'CLOSED_HOSPITAL':
        return <MapPin className="w-5 h-5 text-green-600" />
      case 'CHAT_MESSAGE':
      case 'PARTNER_INQUIRY':
      case 'PARTNER_RESPONSE':
        return <MessageCircle className="w-5 h-5 text-blue-600" />
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
      case 'ESCROW_FUNDED':
      case 'ESCROW_RELEASED':
      case 'MILESTONE_SUBMITTED':
      case 'MILESTONE_APPROVED':
        return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'MATCH_NEW':
      case 'MATCH_INTEREST':
      case 'MATCH_MESSAGE':
        return <Users className="w-5 h-5 text-orange-600" />
      case 'SYSTEM':
      case 'WELCOME':
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="모두 읽음 처리"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            <Link
              href="/notifications/settings"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="알림 설정"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'unread', label: '읽지 않음' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="container mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                  !notification.is_read ? 'border-l-4 border-blue-600' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold truncate ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1 line-clamp-2 ${
                        !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {notification.body}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        title="읽음 처리"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">알림이 없습니다</h3>
            <p className="text-gray-500">
              {filter === 'unread'
                ? '읽지 않은 알림이 없습니다'
                : '새로운 알림이 도착하면 여기에 표시됩니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Pill,
  Users,
  Shield,
  Settings,
  Zap,
  Clock,
  Check,
  X,
  ChevronRight,
  Trash2,
  Eye,
  Volume2,
  VolumeX,
  Filter,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Package,
  TrendingUp,
} from 'lucide-react'

/* ─── 타입 ─── */
type NotifCategory = 'all' | 'prescription' | 'claim' | 'appointment' | 'pharmacy' | 'system'
type NotifPriority = 'urgent' | 'normal' | 'low'

interface Notification {
  id: string
  category: NotifCategory
  title: string
  message: string
  time: string
  read: boolean
  priority: NotifPriority
  icon: React.ElementType
  iconColor: string
  iconBg: string
  actionLabel?: string
  actionHref?: string
}

/* ─── 더미 데이터 ─── */
const notifications: Notification[] = [
  {
    id: 'N001',
    category: 'prescription',
    title: '처방전 조제 완료',
    message: '김영수 환자의 처방전(RX-2024-1847)이 메디매치 온누리약국에서 조제 완료되었습니다.',
    time: '3분 전',
    read: false,
    priority: 'normal',
    icon: Pill,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    actionLabel: '처방 확인',
    actionHref: '/emr/patients',
  },
  {
    id: 'N002',
    category: 'claim',
    title: 'AI 청구 방어 알림',
    message: '오늘 청구 건 중 2건에서 삭감 리스크가 감지되었습니다. 확인 후 수정하세요.',
    time: '15분 전',
    read: false,
    priority: 'urgent',
    icon: Shield,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    actionLabel: '방어 분석실',
    actionHref: '/emr/claims/defense',
  },
  {
    id: 'N003',
    category: 'appointment',
    title: '예약 접수',
    message: '이미경 환자가 내일 오전 10:30 재진 예약을 완료했습니다.',
    time: '30분 전',
    read: false,
    priority: 'normal',
    icon: Calendar,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    actionLabel: '예약 확인',
    actionHref: '/emr/appointments',
  },
  {
    id: 'N004',
    category: 'pharmacy',
    title: 'DUR 알림 — 알레르기 금기',
    message: '강지원 환자 처방(RX-2024-1840)에서 세팔로스포린 알레르기 금기가 감지되었습니다. 약국에서 대체약 문의 중.',
    time: '45분 전',
    read: true,
    priority: 'urgent',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    actionLabel: '처방 수정',
  },
  {
    id: 'N005',
    category: 'claim',
    title: '심사 결과 수신',
    message: '2024년 1월 1차 심사 결과가 도착했습니다. 328건 인정, 8건 삭감.',
    time: '1시간 전',
    read: true,
    priority: 'normal',
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    actionLabel: '결과 보기',
    actionHref: '/emr/claims',
  },
  {
    id: 'N006',
    category: 'appointment',
    title: '노쇼 알림',
    message: '정대현 환자(13:00 예약)가 15분 경과 후에도 미도착 상태입니다.',
    time: '1시간 전',
    read: true,
    priority: 'normal',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    actionLabel: '연락하기',
  },
  {
    id: 'N007',
    category: 'system',
    title: '수가표 업데이트',
    message: '2024년 4월 적용 예정 약국 수가표가 업데이트되었습니다.',
    time: '2시간 전',
    read: true,
    priority: 'low',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'N008',
    category: 'pharmacy',
    title: '재고 부족 알림',
    message: '이부프로펜정 200mg 재고가 안전재고 이하로 감소했습니다. 발주를 권고합니다.',
    time: '3시간 전',
    read: true,
    priority: 'normal',
    icon: Package,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    actionLabel: '재고 확인',
  },
  {
    id: 'N009',
    category: 'system',
    title: '시스템 점검 안내',
    message: '1월 25일(목) 02:00~04:00 정기 시스템 점검이 예정되어 있습니다.',
    time: '5시간 전',
    read: true,
    priority: 'low',
    icon: Settings,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-100 dark:bg-gray-900/30',
  },
  {
    id: 'N010',
    category: 'prescription',
    title: '처방전 전송 완료',
    message: '최은지 환자의 처방전이 메디매치 온누리약국으로 전송되었습니다.',
    time: '5시간 전',
    read: true,
    priority: 'normal',
    icon: Zap,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
]

const categoryTabs: { key: NotifCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: '전체', icon: Bell },
  { key: 'prescription', label: '처방', icon: Pill },
  { key: 'claim', label: '청구', icon: Shield },
  { key: 'appointment', label: '예약', icon: Calendar },
  { key: 'pharmacy', label: '약국', icon: Package },
  { key: 'system', label: '시스템', icon: Settings },
]

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<NotifCategory>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = useMemo(() => {
    let list = notifications
    if (activeCategory !== 'all') {
      list = list.filter(n => n.category === activeCategory)
    }
    if (showUnreadOnly) {
      list = list.filter(n => !n.read)
    }
    return list
  }, [activeCategory, showUnreadOnly])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative">
            <Bell className="w-6 h-6 text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-2xs font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">알림 센터</h1>
            <p className="text-sm text-muted-foreground mt-0.5">읽지 않은 알림 {unreadCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)} className="rounded" />
            안 읽은 것만
          </label>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Check className="w-3.5 h-3.5" /> 모두 읽음
          </button>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Settings className="w-3.5 h-3.5" /> 설정
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {categoryTabs.map(tab => {
          const count = tab.key === 'all'
            ? notifications.filter(n => !n.read).length
            : notifications.filter(n => n.category === tab.key && !n.read).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === tab.key ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={`text-2xs px-1.5 py-0.5 rounded-full ${activeCategory === tab.key ? 'bg-white/20' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 알림 목록 */}
      <div className="card divide-y divide-border">
        {filtered.length > 0 ? filtered.map(notif => (
          <div
            key={notif.id}
            className={`flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer ${
              !notif.read ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''
            }`}
          >
            {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-4 flex-shrink-0" />}
            {notif.read && <div className="w-2 flex-shrink-0" />}

            <div className={`w-10 h-10 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0`}>
              <notif.icon className={`w-5 h-5 ${notif.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${!notif.read ? 'font-bold' : 'font-medium'}`}>{notif.title}</span>
                {notif.priority === 'urgent' && (
                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-2xs font-bold text-red-600 dark:bg-red-900/30">긴급</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xs text-muted-foreground">{notif.time}</span>
                {notif.actionLabel && (
                  <button className="text-2xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                    {notif.actionLabel} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0 mt-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">알림이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}

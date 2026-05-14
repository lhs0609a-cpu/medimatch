'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, ArrowRight,
  LayoutDashboard, Users, Stethoscope, CalendarCheck, Receipt, Settings,
  Bell, HelpCircle, Mic, Pill, BarChart3, Building2, CreditCard, Shield,
  UserCog, MessageSquare, Video, ArrowLeftRight, Brain, Clock, Star,
  QrCode, Users2, Landmark, ShoppingCart, TrendingUp, Rocket, HeartPulse,
  Send, FileText,
  type LucideIcon,
} from 'lucide-react'

type Cmd = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  group: '진료/운영' | '분석/리포트' | '설정/기타'
  keywords?: string
}

const COMMANDS: Cmd[] = [
  // 진료/운영
  { id: 'dashboard',     label: '대시보드',         href: '/emr/dashboard',       icon: LayoutDashboard, group: '진료/운영', keywords: 'home 홈 main' },
  { id: 'appointments',  label: '예약/접수',         href: '/emr/appointments',    icon: CalendarCheck,   group: '진료/운영', keywords: 'booking schedule 예약 접수' },
  { id: 'inbox',         label: '예약 인박스',        href: '/emr/inbox',           icon: MessageSquare,   group: '진료/운영', keywords: 'external 똑닥 굿닥' },
  { id: 'chart',         label: '전자차트',          href: '/emr/chart',           icon: Mic,             group: '진료/운영', keywords: 'soap stt 음성 chart' },
  { id: 'patients',      label: '환자 관리',          href: '/emr/patients',        icon: Users,           group: '진료/운영', keywords: 'patient 환자' },
  { id: 'patients-import', label: '환자 임포트',      href: '/emr/patients/import', icon: ArrowRight,      group: '진료/운영', keywords: 'csv excel 이관 import' },
  { id: 'prescriptions', label: '처방전',           href: '/emr/prescriptions',   icon: Pill,            group: '진료/운영', keywords: 'rx prescription' },
  { id: 'claims',        label: '보험청구',          href: '/emr/claims',          icon: Receipt,         group: '진료/운영', keywords: '심평원 hira claim' },
  { id: 'tax',           label: '경정청구',          href: '/emr/tax-correction',  icon: Shield,          group: '진료/운영', keywords: 'tax 절세' },
  { id: 'crm',           label: 'CRM · 환자 리콜',     href: '/emr/crm',             icon: Send,            group: '진료/운영', keywords: 'recall 캠페인 알림톡' },
  { id: 'chronic',       label: '만성질환관리',        href: '/emr/chronic-care',    icon: HeartPulse,      group: '진료/운영', keywords: '고혈압 당뇨 만관제' },
  { id: 'telemedicine',  label: '비대면 진료',        href: '/emr/telemedicine',    icon: Video,           group: '진료/운영', keywords: 'video 화상' },
  { id: 'waiting',       label: '대기/동선',          href: '/emr/waiting',         icon: Clock,           group: '진료/운영', keywords: 'queue pipeline' },
  { id: 'smart-booking', label: '스마트 예약 QR',     href: '/emr/smart-booking',   icon: QrCode,          group: '진료/운영', keywords: 'qr selfbook' },
  { id: 'bridge',        label: '약국 브릿지',        href: '/emr/bridge',          icon: ArrowLeftRight,  group: '진료/운영', keywords: 'pharmacy dur' },
  { id: 'billing',       label: '수납/결제',          href: '/emr/billing',         icon: CreditCard,      group: '진료/운영', keywords: 'pay invoice' },

  // 분석/리포트
  { id: 'reports',       label: '통합 리포트',         href: '/emr/reports',         icon: BarChart3,       group: '분석/리포트', keywords: 'report monthly' },
  { id: 'biz-dashboard', label: '비즈니스 분석',       href: '/emr-dashboard',       icon: BarChart3,       group: '분석/리포트', keywords: '벤치마크 매출' },
  { id: 'cost-staff',    label: '인건비 최적화',       href: '/emr/cost/staff',      icon: Users2,          group: '분석/리포트' },
  { id: 'cost-fixed',    label: '고정비 절감',         href: '/emr/cost/fixed',      icon: Landmark,        group: '분석/리포트' },
  { id: 'cost-supplies', label: '소모품/약가 비교',    href: '/emr/cost/supplies',   icon: ShoppingCart,    group: '분석/리포트' },
  { id: 'cost-marketing',label: '마케팅 ROI',         href: '/emr/cost/marketing',  icon: TrendingUp,      group: '분석/리포트' },
  { id: 'ai-consulting', label: 'AI 경영컨설팅',       href: '/emr/ai-consulting',   icon: Brain,           group: '분석/리포트' },
  { id: 'reviews',       label: '만족도/리뷰',         href: '/emr/reviews',         icon: Star,            group: '분석/리포트' },

  // 설정/기타
  { id: 'opening',       label: '개원 준비',          href: '/opening-project',     icon: Rocket,          group: '설정/기타', keywords: 'd-day project' },
  { id: 'multi-branch',  label: '멀티 지점',          href: '/emr/multi-branch',    icon: Building2,       group: '설정/기타' },
  { id: 'staff',         label: '직원/권한',          href: '/emr/staff',           icon: UserCog,         group: '설정/기타' },
  { id: 'seats',         label: '직원 ID/요금',       href: '/emr/seats',           icon: CreditCard,      group: '설정/기타', keywords: '과금 billing seat' },
  { id: 'integrations',  label: '연동/API',          href: '/emr/integrations',    icon: Building2,       group: '설정/기타' },
  { id: 'settings',      label: '설정',              href: '/emr/settings',        icon: Settings,        group: '설정/기타' },
  { id: 'notifications', label: '알림',              href: '/emr/notifications',   icon: Bell,            group: '설정/기타' },
  { id: 'support',       label: '도움말',            href: '/emr/support',         icon: HelpCircle,      group: '설정/기타' },
]

function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 1
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  if (h.includes(n)) return 100 - h.indexOf(n)
  // 토큰 단위 부분 일치
  const tokens = n.split(/\s+/).filter(Boolean)
  let score = 0
  for (const t of tokens) if (h.includes(t)) score += 30
  return score
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS
    return COMMANDS
      .map(c => ({ c, s: Math.max(fuzzyScore(c.label, query), fuzzyScore(c.keywords ?? '', query)) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.c)
  }, [query])

  const grouped = useMemo(() => {
    const g: Record<string, Cmd[]> = {}
    for (const c of filtered) (g[c.group] ??= []).push(c)
    return g
  }, [filtered])

  // 활성 인덱스 리셋
  useEffect(() => { setActiveIdx(0) }, [query, open])

  // 포커스
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10) }, [open])

  // 스크롤 동기화
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  // 키보드
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const target = filtered[activeIdx]
        if (target) { router.push(target.href); onClose() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, activeIdx, onClose, router])

  if (!open) return null

  let runningIdx = -1
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="명령 팔레트"
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메뉴, 기능 검색 (예: 청구, crm, 환자)"
            className="bg-transparent text-base outline-none w-full placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="btn-icon flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              일치하는 항목이 없습니다
            </div>
          ) : (
            (['진료/운영', '분석/리포트', '설정/기타'] as const).map(groupName => {
              const items = grouped[groupName]
              if (!items?.length) return null
              return (
                <div key={groupName} className="mb-1">
                  <div className="px-4 py-1 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {groupName}
                  </div>
                  {items.map(c => {
                    runningIdx++
                    const idx = runningIdx
                    const active = idx === activeIdx
                    return (
                      <button
                        key={c.id}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => { router.push(c.href); onClose() }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                          active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <c.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{c.label}</span>
                        <span className="text-2xs text-muted-foreground truncate">{c.href}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-secondary/40 flex items-center justify-between text-2xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-card border border-border rounded">↑↓</kbd> 이동</span>
            <span><kbd className="px-1 py-0.5 bg-card border border-border rounded">Enter</kbd> 선택</span>
            <span><kbd className="px-1 py-0.5 bg-card border border-border rounded">Esc</kbd> 닫기</span>
          </div>
          <span>{filtered.length}개</span>
        </div>
      </div>
    </div>
  )
}

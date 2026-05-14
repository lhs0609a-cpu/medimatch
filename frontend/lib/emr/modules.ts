/**
 * EMR 모듈 정체성 마스터.
 *
 * 모든 EMR 모듈은 여기서 정의된 색·아이콘·라벨·서브타이틀을 사용합니다.
 * 페이지 헤더(ModuleHeader) / 사이드바 / 통계 카드가 이 메타로 통일됩니다.
 *
 * 색 정책:
 *   - bg / fg / accent / ring: Tailwind 색 컬러 클래스 prefix(예: 'blue', 'rose')
 *   - 같은 prefix의 50/100/600 등을 컴포넌트가 일관되게 사용
 *
 * 새 모듈 추가는 여기에만 행 추가.
 */
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, Stethoscope, CalendarCheck, Pill, Receipt, Shield,
  HeartPulse, Inbox, MessageSquare, ShieldCheck, KeyRound, ClipboardCheck,
  Activity, FileText, Building2, UserCog, ArrowLeftRight, Brain, Star, Clock,
  QrCode, BarChart3, Users2, Landmark, ShoppingCart, TrendingUp, Video,
  Sparkles, CreditCard, Camera, Mic,
} from 'lucide-react'

/** 모듈 색 — Tailwind palette prefix (50/100/200/.../900 패턴 보장된 것만 사용) */
export type ModuleColor =
  | 'blue' | 'sky' | 'cyan' | 'teal' | 'emerald' | 'lime'
  | 'amber' | 'orange' | 'rose' | 'pink' | 'fuchsia'
  | 'violet' | 'indigo' | 'slate' | 'zinc' | 'stone'

export interface ModuleMeta {
  /** URL slug — '/emr/{slug}' 또는 자유 경로 (소문자) */
  key: string
  /** 짧은 라벨 — 헤더·사이드바·배지에 공통 */
  label: string
  /** 한 줄 설명 — 헤더 부제 */
  desc?: string
  /** Lucide icon */
  icon: LucideIcon
  /** Tailwind 컬러 prefix */
  color: ModuleColor
}

/** EMR 핵심 모듈 — 페이지가 자기 키로 lookup */
export const MODULES: Record<string, ModuleMeta> = {
  dashboard: {
    key: 'dashboard',
    label: '대시보드',
    desc: '오늘의 진료·매출·이슈를 한눈에',
    icon: LayoutDashboard,
    color: 'slate',
  },
  appointments: {
    key: 'appointments',
    label: '예약/접수',
    desc: '시간대별 예약과 도착·진료 흐름',
    icon: CalendarCheck,
    color: 'indigo',
  },
  inbox: {
    key: 'inbox',
    label: '예약 인박스',
    desc: '똑닥·굿닥·네이버 예약을 한 화면에',
    icon: Inbox,
    color: 'violet',
  },
  patients: {
    key: 'patients',
    label: '환자 관리',
    desc: '유입·상담·동의·예약 파이프라인',
    icon: Users,
    color: 'teal',
  },
  chart: {
    key: 'chart',
    label: '전자차트',
    desc: 'SOAP·진단·시술·바이탈',
    icon: Stethoscope,
    color: 'blue',
  },
  prescriptions: {
    key: 'prescriptions',
    label: '처방전',
    desc: 'DUR·픽업코드·약국 전송',
    icon: Pill,
    color: 'fuchsia',
  },
  claims: {
    key: 'claims',
    label: '보험청구',
    desc: '심평원 EDI·이의신청·삭감 분석',
    icon: Receipt,
    color: 'amber',
  },
  cdss: {
    key: 'cdss',
    label: 'CDSS 사전심사',
    desc: '9종 자동 점검·삭감 예방 점수',
    icon: ShieldCheck,
    color: 'cyan',
  },
  questionnaire: {
    key: 'questionnaire',
    label: '사전문진',
    desc: '카톡 magic-link → 차트 prefill',
    icon: MessageSquare,
    color: 'amber',
  },
  stt: {
    key: 'stt',
    label: 'AI 음성차팅',
    desc: 'STT → SOAP 자동 분해',
    icon: Mic,
    color: 'violet',
  },
  attachments: {
    key: 'attachments',
    label: '차트 첨부',
    desc: '폰 카메라로 환부·검사지 즉시',
    icon: Camera,
    color: 'sky',
  },
  pickup: {
    key: 'pickup',
    label: '약국 픽업',
    desc: '6자리 코드·F2~F12 단축키',
    icon: KeyRound,
    color: 'rose',
  },
  'chronic-care': {
    key: 'chronic-care',
    label: '만성질환관리',
    desc: '고혈압·당뇨·이상지질·비만 회차 추적',
    icon: HeartPulse,
    color: 'pink',
  },
  seats: {
    key: 'seats',
    label: '직원 ID/요금',
    desc: 'PC가 아닌 사용자 ID당 과금',
    icon: CreditCard,
    color: 'emerald',
  },
  setup: {
    key: 'setup',
    label: '5분 셋업',
    desc: '진료과 프리셋 자동 적용',
    icon: Sparkles,
    color: 'blue',
  },
  billing: {
    key: 'billing',
    label: '수납/결제',
    desc: '카드·현금·미수금',
    icon: CreditCard,
    color: 'emerald',
  },
  'tax-correction': {
    key: 'tax-correction',
    label: '경정청구',
    desc: '홈택스 자동 보정',
    icon: Shield,
    color: 'emerald',
  },
  telemedicine: {
    key: 'telemedicine',
    label: '비대면 진료',
    desc: '원격 진료·처방 전송',
    icon: Video,
    color: 'orange',
  },
  waiting: {
    key: 'waiting',
    label: '대기/동선',
    desc: '실시간 대기열·키오스크 호출',
    icon: Clock,
    color: 'amber',
  },
  'smart-booking': {
    key: 'smart-booking',
    label: '스마트 예약 QR',
    desc: 'QR 한 번에 예약 완성',
    icon: QrCode,
    color: 'sky',
  },
  bridge: {
    key: 'bridge',
    label: '약국 브릿지',
    desc: '의원 ↔ 약국 처방 양방향',
    icon: ArrowLeftRight,
    color: 'lime',
  },
  reports: {
    key: 'reports',
    label: '통합 리포트',
    desc: '월간 KPI 대시보드',
    icon: BarChart3,
    color: 'slate',
  },
  'ai-consulting': {
    key: 'ai-consulting',
    label: 'AI 경영컨설팅',
    desc: '의원 운영 자동 진단',
    icon: Brain,
    color: 'fuchsia',
  },
  reviews: {
    key: 'reviews',
    label: '만족도/리뷰',
    desc: '환자 평가·답글·평점 추적',
    icon: Star,
    color: 'amber',
  },
  crm: {
    key: 'crm',
    label: '환자 리콜/CRM',
    desc: '예약 부도·미수금 콜큐',
    icon: MessageSquare,
    color: 'rose',
  },
  'multi-branch': {
    key: 'multi-branch',
    label: '멀티 지점',
    desc: '여러 지점을 한 계정으로',
    icon: Building2,
    color: 'stone',
  },
  staff: {
    key: 'staff',
    label: '직원/권한',
    desc: '권한·근태·인건비',
    icon: UserCog,
    color: 'slate',
  },
  integrations: {
    key: 'integrations',
    label: '연동/API',
    desc: '외부 시스템 webhook',
    icon: Building2,
    color: 'zinc',
  },
  'cost-staff': {
    key: 'cost-staff',
    label: '인건비 최적화',
    desc: '근무·시급 최적 설계',
    icon: Users2,
    color: 'emerald',
  },
  'cost-fixed': {
    key: 'cost-fixed',
    label: '고정비 절감',
    desc: '임차·관리비·세금',
    icon: Landmark,
    color: 'lime',
  },
  'cost-supplies': {
    key: 'cost-supplies',
    label: '소모품/약가 비교',
    desc: '동일 품목 최저가 비교',
    icon: ShoppingCart,
    color: 'orange',
  },
  'cost-marketing': {
    key: 'cost-marketing',
    label: '마케팅 ROI',
    desc: '광고비·신규 환자 ROI',
    icon: TrendingUp,
    color: 'rose',
  },
  discover: {
    key: 'discover',
    label: '발견',
    desc: 'EMR 사용 중 자연스럽게 — 매물·개원·공동구매·약국',
    icon: Sparkles,
    color: 'violet',
  },
}

export function getModule(key: string): ModuleMeta {
  return MODULES[key] || {
    key,
    label: key,
    icon: ClipboardCheck,
    color: 'slate',
  }
}

/**
 * 모듈 색상 → Tailwind 클래스 묶음.
 *
 * 헤더 인디케이터·아이콘 박스·텍스트·테두리를 일관되게 빼낸다.
 */
export interface ModuleColorClasses {
  /** 좌측 5px 인디케이터 바 */
  indicator: string
  /** 아이콘 박스 — 파스텔 배경 + 짙은 색 아이콘 */
  iconBox: string
  iconColor: string
  /** 모듈 라벨 문자색 (chip/뱃지용) */
  fg: string
  /** 파스텔 배경 (배지/카드 hover) */
  bgSoft: string
  /** 헤더 미세 그라디언트 (좌→우 fade) */
  headerGradient: string
  /** 진한 색 단색 (포커스링·버튼) */
  ring: string
}

export function moduleClasses(color: ModuleColor): ModuleColorClasses {
  // Tailwind는 동적 string을 purge하므로 모든 색을 명시적으로 매핑한다.
  const map: Record<ModuleColor, ModuleColorClasses> = {
    blue:    { indicator: 'bg-blue-500',    iconBox: 'bg-blue-50',    iconColor: 'text-blue-600',    fg: 'text-blue-700',    bgSoft: 'bg-blue-50',    headerGradient: 'from-blue-50/60',    ring: 'ring-blue-300' },
    sky:     { indicator: 'bg-sky-500',     iconBox: 'bg-sky-50',     iconColor: 'text-sky-600',     fg: 'text-sky-700',     bgSoft: 'bg-sky-50',     headerGradient: 'from-sky-50/60',     ring: 'ring-sky-300' },
    cyan:    { indicator: 'bg-cyan-500',    iconBox: 'bg-cyan-50',    iconColor: 'text-cyan-600',    fg: 'text-cyan-700',    bgSoft: 'bg-cyan-50',    headerGradient: 'from-cyan-50/60',    ring: 'ring-cyan-300' },
    teal:    { indicator: 'bg-teal-500',    iconBox: 'bg-teal-50',    iconColor: 'text-teal-600',    fg: 'text-teal-700',    bgSoft: 'bg-teal-50',    headerGradient: 'from-teal-50/60',    ring: 'ring-teal-300' },
    emerald: { indicator: 'bg-emerald-500', iconBox: 'bg-emerald-50', iconColor: 'text-emerald-600', fg: 'text-emerald-700', bgSoft: 'bg-emerald-50', headerGradient: 'from-emerald-50/60', ring: 'ring-emerald-300' },
    lime:    { indicator: 'bg-lime-500',    iconBox: 'bg-lime-50',    iconColor: 'text-lime-600',    fg: 'text-lime-700',    bgSoft: 'bg-lime-50',    headerGradient: 'from-lime-50/60',    ring: 'ring-lime-300' },
    amber:   { indicator: 'bg-amber-500',   iconBox: 'bg-amber-50',   iconColor: 'text-amber-600',   fg: 'text-amber-700',   bgSoft: 'bg-amber-50',   headerGradient: 'from-amber-50/60',   ring: 'ring-amber-300' },
    orange:  { indicator: 'bg-orange-500',  iconBox: 'bg-orange-50',  iconColor: 'text-orange-600',  fg: 'text-orange-700',  bgSoft: 'bg-orange-50',  headerGradient: 'from-orange-50/60',  ring: 'ring-orange-300' },
    rose:    { indicator: 'bg-rose-500',    iconBox: 'bg-rose-50',    iconColor: 'text-rose-600',    fg: 'text-rose-700',    bgSoft: 'bg-rose-50',    headerGradient: 'from-rose-50/60',    ring: 'ring-rose-300' },
    pink:    { indicator: 'bg-pink-500',    iconBox: 'bg-pink-50',    iconColor: 'text-pink-600',    fg: 'text-pink-700',    bgSoft: 'bg-pink-50',    headerGradient: 'from-pink-50/60',    ring: 'ring-pink-300' },
    fuchsia: { indicator: 'bg-fuchsia-500', iconBox: 'bg-fuchsia-50', iconColor: 'text-fuchsia-600', fg: 'text-fuchsia-700', bgSoft: 'bg-fuchsia-50', headerGradient: 'from-fuchsia-50/60', ring: 'ring-fuchsia-300' },
    violet:  { indicator: 'bg-violet-500',  iconBox: 'bg-violet-50',  iconColor: 'text-violet-600',  fg: 'text-violet-700',  bgSoft: 'bg-violet-50',  headerGradient: 'from-violet-50/60',  ring: 'ring-violet-300' },
    indigo:  { indicator: 'bg-indigo-500',  iconBox: 'bg-indigo-50',  iconColor: 'text-indigo-600',  fg: 'text-indigo-700',  bgSoft: 'bg-indigo-50',  headerGradient: 'from-indigo-50/60',  ring: 'ring-indigo-300' },
    slate:   { indicator: 'bg-slate-500',   iconBox: 'bg-slate-100',  iconColor: 'text-slate-700',   fg: 'text-slate-700',   bgSoft: 'bg-slate-50',   headerGradient: 'from-slate-50/60',   ring: 'ring-slate-300' },
    zinc:    { indicator: 'bg-zinc-500',    iconBox: 'bg-zinc-100',   iconColor: 'text-zinc-700',    fg: 'text-zinc-700',    bgSoft: 'bg-zinc-50',    headerGradient: 'from-zinc-50/60',    ring: 'ring-zinc-300' },
    stone:   { indicator: 'bg-stone-500',   iconBox: 'bg-stone-100',  iconColor: 'text-stone-700',   fg: 'text-stone-700',   bgSoft: 'bg-stone-50',   headerGradient: 'from-stone-50/60',   ring: 'ring-stone-300' },
  }
  return map[color]
}

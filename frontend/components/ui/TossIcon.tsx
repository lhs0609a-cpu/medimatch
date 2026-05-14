import { type LucideIcon } from 'lucide-react'

type TossSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface TossIconProps {
  icon: LucideIcon
  /** Tailwind gradient (e.g. 'from-blue-500 to-blue-600') — primary color name extracted from `from-` */
  color?: string
  size?: TossSize
  /** Ignored — kept for backward compat */
  shadow?: string
  className?: string
}

const sizeMap: Record<TossSize, { box: string; icon: string; iconStroke: number; radius: number }> = {
  xs: { box: 'w-8 h-8',   icon: 'w-4 h-4',   iconStroke: 2.6, radius: 10 },
  sm: { box: 'w-10 h-10', icon: 'w-5 h-5',   iconStroke: 2.4, radius: 12 },
  md: { box: 'w-12 h-12', icon: 'w-6 h-6',   iconStroke: 2.4, radius: 14 },
  lg: { box: 'w-14 h-14', icon: 'w-7 h-7',   iconStroke: 2.2, radius: 16 },
  xl: { box: 'w-16 h-16', icon: 'w-8 h-8',   iconStroke: 2.2, radius: 18 },
}

/** Toss-style 3D palette: light(상단 광택) → base(주색) → dark(하단 그림자) */
const palettes: Record<string, { light: string; base: string; dark: string }> = {
  'blue-500':    { light: '#7AB6FF', base: '#3182F6', dark: '#1E5BD6' },
  'blue-600':    { light: '#5FA0FB', base: '#2563EB', dark: '#1747C2' },
  'blue-700':    { light: '#4A8DEE', base: '#1D4ED8', dark: '#103AAE' },
  'indigo-500':  { light: '#8A9EFF', base: '#6366F1', dark: '#4338CA' },
  'indigo-600':  { light: '#7387FF', base: '#4F46E5', dark: '#3730A3' },
  'purple-500':  { light: '#B388FF', base: '#A855F7', dark: '#7E22CE' },
  'purple-600':  { light: '#A370FF', base: '#9333EA', dark: '#6B21A8' },
  'violet-500':  { light: '#A38AFF', base: '#8B5CF6', dark: '#6D28D9' },
  'violet-600':  { light: '#9272FF', base: '#7C3AED', dark: '#5B21B6' },
  'green-500':   { light: '#5DDB8B', base: '#22C55E', dark: '#15803D' },
  'green-600':   { light: '#46C77A', base: '#16A34A', dark: '#0E6B33' },
  'emerald-500': { light: '#3FD7B0', base: '#10B981', dark: '#047857' },
  'emerald-600': { light: '#2BC598', base: '#059669', dark: '#035E47' },
  'teal-500':    { light: '#46CFCF', base: '#14B8A6', dark: '#0F766E' },
  'teal-600':    { light: '#2CBABA', base: '#0D9488', dark: '#0B5F5A' },
  'cyan-500':    { light: '#4ECCE6', base: '#06B6D4', dark: '#0E7490' },
  'cyan-600':    { light: '#36BAD4', base: '#0891B2', dark: '#0A607A' },
  'sky-500':     { light: '#6EC3F6', base: '#0EA5E9', dark: '#0369A1' },
  'sky-600':     { light: '#4FB1ED', base: '#0284C7', dark: '#075985' },
  'orange-500':  { light: '#FFA259', base: '#F97316', dark: '#C2410C' },
  'orange-600':  { light: '#FB8B3C', base: '#EA580C', dark: '#9A3412' },
  'amber-500':   { light: '#FFD24A', base: '#F59E0B', dark: '#B45309' },
  'amber-600':   { light: '#FAC03A', base: '#D97706', dark: '#92400E' },
  'yellow-500':  { light: '#FFE057', base: '#EAB308', dark: '#A16207' },
  'yellow-600':  { light: '#FFC74A', base: '#CA8A04', dark: '#854D0E' },
  'red-500':     { light: '#FF8A8A', base: '#EF4444', dark: '#B91C1C' },
  'red-600':     { light: '#FB7373', base: '#DC2626', dark: '#991B1B' },
  'rose-500':    { light: '#FF8AA3', base: '#F43F5E', dark: '#BE123C' },
  'rose-600':    { light: '#FB738F', base: '#E11D48', dark: '#9F1239' },
  'pink-500':    { light: '#FF9AC9', base: '#EC4899', dark: '#BE185D' },
  'pink-600':    { light: '#FB7FB8', base: '#DB2777', dark: '#9D174D' },
  'slate-500':   { light: '#94A3B8', base: '#64748B', dark: '#334155' },
  'slate-600':   { light: '#7B8CA3', base: '#475569', dark: '#1E293B' },
  'gray-500':    { light: '#9CA3AF', base: '#6B7280', dark: '#374151' },
  'gray-600':    { light: '#8B95A3', base: '#4B5563', dark: '#1F2937' },
}

export function TossIcon({
  icon: Icon,
  color = 'from-blue-500 to-blue-600',
  size = 'md',
  shadow: _shadow,
  className,
}: TossIconProps) {
  const s = sizeMap[size]

  // Extract primary color: 'from-blue-500 to-blue-600' → 'blue-500'
  const match = color.match(/from-([a-z]+-\d+)/)
  const colorKey = match?.[1] || 'blue-500'
  const p = palettes[colorKey] || palettes['blue-500']
  const r = s.radius

  // 토스 3D 버튼: 위→아래 그라데이션(빛 받는 느낌) + 외부 색 그림자 + 내부 광택/그림자
  const bg = `linear-gradient(160deg, ${p.light} 0%, ${p.base} 55%, ${p.dark} 100%)`
  const boxShadow = [
    `0 10px 20px -6px ${p.base}66`,           // 색 번짐 그림자 (떠 있는 느낌)
    `0 4px 8px -2px rgba(0,0,0,0.10)`,         // 미세 그림자
    `inset 0 1px 0 0 rgba(255,255,255,0.45)`,  // 상단 하이라이트 라인
    `inset 0 -2px 5px 0 ${p.dark}80`,          // 하단 내부 그림자 (덩어리감)
  ].join(', ')

  return (
    <div
      className={`relative ${s.box} flex items-center justify-center ${className ?? ''}`}
      style={{
        borderRadius: r,
        background: bg,
        boxShadow,
      }}
      aria-hidden="true"
    >
      {/* 상단 글로시 하이라이트 — 토스 아이콘 특유의 광택 */}
      <span
        className="pointer-events-none absolute"
        style={{
          left: '14%',
          right: '14%',
          top: '8%',
          height: '28%',
          borderRadius: r - 4,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
          filter: 'blur(0.5px)',
        }}
      />
      <Icon
        className={`relative ${s.icon} text-white`}
        strokeWidth={s.iconStroke}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
      />
    </div>
  )
}

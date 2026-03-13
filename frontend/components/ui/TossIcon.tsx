import { type LucideIcon } from 'lucide-react'

type TossSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface TossIconProps {
  icon: LucideIcon
  /** Tailwind gradient kept for backward compat — only first color is used */
  color?: string
  size?: TossSize
  /** Ignored — kept for backward compat */
  shadow?: string
  className?: string
}

const sizeMap: Record<TossSize, { box: string; icon: string }> = {
  xs: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
  sm: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  md: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
  lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
  xl: { box: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
}

/* Tailwind color → hex (solid flat color for Toss-style) */
const colorHex: Record<string, string> = {
  'blue-500': '#3182f6',
  'blue-600': '#2563eb',
  'indigo-500': '#3182f6',
  'indigo-600': '#2563eb',
  'purple-500': '#3182f6',
  'purple-600': '#2563eb',
  'violet-500': '#3182f6',
  'violet-600': '#2563eb',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'teal-500': '#3182f6',
  'teal-600': '#2563eb',
  'cyan-500': '#2563eb',
  'cyan-600': '#2563eb',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
  'amber-500': '#f59e0b',
  'amber-600': '#d97706',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'rose-500': '#f43f5e',
  'rose-600': '#e11d48',
  'pink-500': '#3182f6',
  'pink-600': '#2563eb',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
}

export function TossIcon({
  icon: Icon,
  color = 'from-blue-500 to-blue-600',
  size = 'md',
  shadow: _shadow,
  className,
}: TossIconProps) {
  const s = sizeMap[size]

  // Extract primary color from gradient prop (e.g. 'from-blue-500 to-blue-600' → 'blue-500')
  const match = color.match(/from-([a-z]+-\d+)/)
  const colorKey = match?.[1] || 'blue-500'
  const hex = colorHex[colorKey] || '#3182f6'

  return (
    <div
      className={`${s.box} flex items-center justify-center ${className ?? ''}`}
      style={{ backgroundColor: hex }}
    >
      <Icon className={`${s.icon} text-white`} strokeWidth={1.8} />
    </div>
  )
}

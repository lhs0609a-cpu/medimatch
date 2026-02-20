import { type LucideIcon } from 'lucide-react'

type TossSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface TossIconProps {
  icon: LucideIcon
  /** Tailwind gradient: e.g. 'from-blue-500 to-indigo-500' */
  color?: string
  size?: TossSize
  /** Additional shadow class, e.g. 'shadow-blue-500/25' */
  shadow?: string
  className?: string
}

const sizeMap: Record<TossSize, { box: string; icon: string }> = {
  xs: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
  sm: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  md: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
  lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
  xl: { box: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8' },
}

export function TossIcon({
  icon: Icon,
  color = 'from-blue-500 to-indigo-500',
  size = 'md',
  shadow,
  className,
}: TossIconProps) {
  const s = sizeMap[size]
  return (
    <div
      className={`icon-3d ${s.box} bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow ?? ''} ${className ?? ''}`}
    >
      <Icon className={`${s.icon} text-white`} />
    </div>
  )
}

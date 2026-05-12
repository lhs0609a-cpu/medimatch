'use client'

/**
 * ModuleStatTile — 모듈 색에 맞춘 통계 카드.
 *
 * 대시보드·각 모듈 첫 화면 KPI에 공통.
 * 좌측 컬러 사이드바 + 라벨 + 큰 숫자 + 옵션 (서브, trend).
 *
 * <ModuleStatTile color="blue" label="오늘 진료" value={32} suffix="건" trend={+12.5} />
 */
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { moduleClasses, type ModuleColor } from '@/lib/emr/modules'

interface Props {
  color: ModuleColor
  label: string
  value: number | string
  suffix?: string
  /** %단위 변화율 — undefined면 trend 숨김 */
  trend?: number
  trendSuffix?: string
  /** 좌측 아이콘 */
  icon?: LucideIcon
  /** 클릭 가능한 카드 — onClick 받으면 hover 효과 추가 */
  onClick?: () => void
  /** 강조 (붉은 테두리 ring) */
  highlight?: boolean
  detail?: string
  className?: string
}

export default function ModuleStatTile({
  color, label, value, suffix, trend, trendSuffix = '%',
  icon: Icon, onClick, highlight, detail, className = '',
}: Props) {
  const cls = moduleClasses(color)
  const trendColor = trend == null ? '' :
    trend > 0 ? 'text-emerald-600' :
    trend < 0 ? 'text-rose-600' :
    'text-slate-500'
  const TrendIcon = trend == null ? null :
    trend > 0 ? TrendingUp :
    trend < 0 ? TrendingDown :
    Minus

  const Wrapper: any = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative overflow-hidden card p-4 text-left transition-all
        ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''}
        ${highlight ? `ring-2 ${cls.ring}` : ''}
        ${className}`}
    >
      {/* 좌측 5px 인디케이터 */}
      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${cls.indicator}`} aria-hidden />

      <div className="pl-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={`text-xs font-medium ${cls.fg}`}>{label}</div>
          {Icon && (
            <div className={`w-7 h-7 rounded-lg ${cls.iconBox} flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${cls.iconColor}`} />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
            {value}
          </span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
        {(trend != null || detail) && (
          <div className="flex items-center gap-2 mt-1.5 text-[11px]">
            {trend != null && TrendIcon && (
              <span className={`inline-flex items-center gap-0.5 font-medium ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(trend).toFixed(1)}{trendSuffix}
              </span>
            )}
            {detail && <span className="text-muted-foreground">{detail}</span>}
          </div>
        )}
      </div>
    </Wrapper>
  )
}

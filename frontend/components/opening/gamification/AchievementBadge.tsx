'use client'

import { Lock } from 'lucide-react'
import { type Achievement, type AchievementTier, TIER_COLORS } from '@/app/checklist/data/gamification/achievements'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  size?: 'sm' | 'md'
}

export default function AchievementBadge({ achievement, unlocked, size = 'md' }: AchievementBadgeProps) {
  const colors = TIER_COLORS[achievement.tier]

  if (size === 'sm') {
    return (
      <div
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all
          ${unlocked ? `${colors.bg} ${colors.border}` : 'bg-secondary/50 border-border opacity-50'}
        `}
        title={achievement.description}
      >
        <span className="text-sm">{unlocked ? achievement.icon : '🔒'}</span>
        <span className={`text-[10px] font-medium ${unlocked ? colors.text : 'text-muted-foreground'}`}>
          {achievement.name}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center
        ${unlocked
          ? `${colors.bg} ${colors.border}`
          : 'bg-secondary/30 border-border/50 opacity-40 grayscale'
        }
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center text-2xl
        ${unlocked ? '' : 'bg-secondary'}
      `}>
        {unlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div>
        <div className={`text-xs font-semibold ${unlocked ? colors.text : 'text-muted-foreground'}`}>
          {achievement.name}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {achievement.description}
        </div>
      </div>
      <TierBadge tier={achievement.tier} />
    </div>
  )
}

function TierBadge({ tier }: { tier: AchievementTier }) {
  const label = tier === 'gold' ? 'Gold' : tier === 'silver' ? 'Silver' : 'Bronze'
  const colors = TIER_COLORS[tier]
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  )
}

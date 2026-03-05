'use client'

import { useEffect } from 'react'
import { type Achievement, TIER_COLORS } from '@/app/checklist/data/gamification/achievements'
import { Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

interface AchievementToastProps {
  achievement: Achievement
  onDismiss: () => void
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const colors = TIER_COLORS[achievement.tier]

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-20 right-4 z-[70] max-w-xs w-full"
    >
      <button
        onClick={onDismiss}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-lg
          ${colors.bg} ${colors.border}
        `}
      >
        <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-xl flex-shrink-0">
          {achievement.icon}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
              업적 달성!
            </span>
          </div>
          <div className={`text-sm font-semibold ${colors.text} truncate`}>
            {achievement.name}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {achievement.description}
          </div>
        </div>
      </button>
    </motion.div>
  )
}

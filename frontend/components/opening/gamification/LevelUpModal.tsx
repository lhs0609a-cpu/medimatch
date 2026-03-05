'use client'

import { X, Zap, Star } from 'lucide-react'
import { type LevelInfo } from '@/app/checklist/data/gamification/xp-levels'
import { motion } from 'framer-motion'

interface LevelUpModalProps {
  level: LevelInfo
  onClose: () => void
}

const LEVEL_EMOJIS: Record<number, string> = {
  1: '🌱', 2: '🔍', 3: '📚', 4: '📋', 5: '🚀',
  6: '⭐', 7: '🏆', 8: '👑', 9: '💎', 10: '🐉',
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const emoji = LEVEL_EMOJIS[level.level] || '⭐'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="relative bg-card rounded-3xl border border-border shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Top gradient */}
        <div className="h-2 bg-gradient-to-r from-primary via-amber-400 to-primary" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center">
          {/* Sparkle decoration */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mx-auto mb-5"
            >
              <span className="text-5xl">{emoji}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-2 -right-2 w-8 h-8"
            >
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-1">LEVEL UP!</p>
            <h2 className="text-2xl font-bold mb-1">레벨 {level.level} 달성!</h2>
            <p className="text-lg font-medium text-muted-foreground mb-6">{level.title}</p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span>필요 XP: {level.requiredXP.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              계속 진행하기
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

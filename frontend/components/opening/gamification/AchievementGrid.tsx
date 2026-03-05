'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { ALL_ACHIEVEMENTS, type Achievement } from '@/app/checklist/data/gamification/achievements'
import AchievementBadge from './AchievementBadge'

interface AchievementGridProps {
  unlockedIds: string[]
}

type FilterCategory = 'all' | 'phase' | 'quiz' | 'participation' | 'special'

const CATEGORIES: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'phase', label: '단계별' },
  { key: 'quiz', label: '퀴즈' },
  { key: 'participation', label: '참여' },
  { key: 'special', label: '특별' },
]

export default function AchievementGrid({ unlockedIds }: AchievementGridProps) {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [showLocked, setShowLocked] = useState(true)

  const filtered = ALL_ACHIEVEMENTS.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false
    if (!showLocked && !unlockedIds.includes(a.id)) return false
    return true
  })

  const unlockedCount = unlockedIds.length
  const totalCount = ALL_ACHIEVEMENTS.length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold">업적</h3>
          <span className="text-xs text-muted-foreground">{unlockedCount}/{totalCount}</span>
        </div>
        <button
          onClick={() => setShowLocked(!showLocked)}
          className="text-xs text-primary hover:underline"
        >
          {showLocked ? '달성만 보기' : '전체 보기'}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === cat.key
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {filtered.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            unlocked={unlockedIds.includes(achievement.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          표시할 업적이 없습니다
        </div>
      )}
    </div>
  )
}

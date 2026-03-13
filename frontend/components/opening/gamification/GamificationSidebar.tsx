'use client'

import { useState } from 'react'
import { Trophy, Target, Zap, Brain, ChevronDown, ChevronUp } from 'lucide-react'
import XPBar from './XPBar'
import ReadinessDashboard from './ReadinessDashboard'
import AchievementGrid from './AchievementGrid'
import { type LevelInfo } from '@/app/checklist/data/gamification/xp-levels'
import { type ReadinessGradeInfo } from '@/app/checklist/data/gamification/readiness'

interface GamificationSidebarProps {
  xp: number
  level: LevelInfo
  readinessScore: number
  readinessGrade: ReadinessGradeInfo
  readinessBreakdown: { taskRate: number; quizRate: number; detailRate: number }
  unlockedAchievements: string[]
  completedTasks: string[]
  getPhaseQuizAverage: (phaseId: number) => number
}

type SidebarTab = 'readiness' | 'achievements'

export default function GamificationSidebar({
  xp, level, readinessScore, readinessGrade, readinessBreakdown,
  unlockedAchievements, completedTasks, getPhaseQuizAverage,
}: GamificationSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('readiness')

  return (
    <div className="space-y-4">
      {/* XP Bar (always visible) */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <XPBar xp={xp} level={level} />
      </div>

      {/* Tab toggle */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('readiness')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'readiness'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            준비도
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            업적
            {unlockedAchievements.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                {unlockedAchievements.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'readiness' ? (
            <ReadinessDashboard
              score={readinessScore}
              grade={readinessGrade}
              breakdown={readinessBreakdown}
              getPhaseQuizAverage={getPhaseQuizAverage}
              completedTasks={completedTasks}
            />
          ) : (
            <AchievementGrid unlockedIds={unlockedAchievements} />
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          통계
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem icon={<Zap className="w-3.5 h-3.5 text-primary" />} label="총 XP" value={xp.toLocaleString()} />
          <StatItem icon={<Target className="w-3.5 h-3.5 text-green-500" />} label="준비도" value={`${readinessScore}점`} />
          <StatItem icon={<Brain className="w-3.5 h-3.5 text-blue-500" />} label="퀴즈 풀이" value={`${Math.round(readinessBreakdown.quizRate)}%`} />
          <StatItem icon={<Trophy className="w-3.5 h-3.5 text-amber-500" />} label="업적" value={`${unlockedAchievements.length}개`} />
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </div>
  )
}

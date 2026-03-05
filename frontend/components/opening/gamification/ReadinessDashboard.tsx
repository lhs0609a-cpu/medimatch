'use client'

import { useState } from 'react'
import { Target, TrendingUp, Brain, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { phases } from '@/app/checklist/data/phases'
import { type ReadinessGradeInfo } from '@/app/checklist/data/gamification/readiness'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'

interface ReadinessDashboardProps {
  score: number
  grade: ReadinessGradeInfo
  breakdown: { taskRate: number; quizRate: number; detailRate: number }
  getPhaseQuizAverage: (phaseId: number) => number
  completedTasks: string[]
}

export default function ReadinessDashboard({
  score, grade, breakdown, getPhaseQuizAverage, completedTasks,
}: ReadinessDashboardProps) {
  const [expanded, setExpanded] = useState(false)

  // Radar chart data
  const radarData = phases.map(phase => {
    const phaseTaskIds = phase.subtasks.map(s => s.id)
    const completed = phaseTaskIds.filter(id => completedTasks.includes(id)).length
    const taskRate = (completed / phaseTaskIds.length) * 100
    const quizRate = getPhaseQuizAverage(phase.id)
    const combined = Math.round(taskRate * 0.5 + quizRate * 0.5)
    return {
      phase: `P${phase.id}`,
      fullName: phase.title,
      value: combined,
    }
  })

  // Improvement suggestion
  const weakestPhase = radarData.reduce((min, d) => d.value < min.value ? d : min, radarData[0])
  const suggestion = weakestPhase.value < 50
    ? `${weakestPhase.fullName} 단계를 집중적으로 진행하면 점수가 크게 올라갑니다.`
    : weakestPhase.value < 80
      ? `${weakestPhase.fullName} 퀴즈를 풀면 준비도가 향상됩니다.`
      : '모든 단계가 고르게 진행되고 있습니다!'

  return (
    <div className="space-y-4">
      {/* Score Gauge */}
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-3">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="currentColor"
              className="text-secondary"
              strokeWidth="10"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={grade.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 327} 327`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: grade.color }}>
              {score}
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: grade.color }}
            >
              {grade.grade}
            </span>
          </div>
        </div>
        <div className="text-sm font-semibold">{grade.label}</div>
        <p className="text-xs text-muted-foreground mt-1">개원 준비도</p>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2.5">
        <BreakdownBar
          icon={<Target className="w-3.5 h-3.5" />}
          label="태스크 완료"
          value={Math.round(breakdown.taskRate)}
          weight="40%"
          color="#3B82F6"
        />
        <BreakdownBar
          icon={<Brain className="w-3.5 h-3.5" />}
          label="퀴즈 점수"
          value={Math.round(breakdown.quizRate)}
          weight="40%"
          color="#8B5CF6"
        />
        <BreakdownBar
          icon={<FileText className="w-3.5 h-3.5" />}
          label="디테일 (비용+메모)"
          value={Math.round(breakdown.detailRate)}
          weight="20%"
          color="#10B981"
        />
      </div>

      {/* Expand for radar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {expanded ? '접기' : '단계별 분석 보기'}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Radar chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="phase"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Phase breakdown list */}
          <div className="space-y-1.5">
            {radarData.map(d => (
              <div key={d.phase} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-bold text-muted-foreground">{d.phase}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${d.value}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement suggestion */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{suggestion}</p>
      </div>
    </div>
  )
}

function BreakdownBar({
  icon, label, value, weight, color,
}: {
  icon: React.ReactNode; label: string; value: number; weight: string; color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
          <span className="text-[10px] opacity-60">({weight})</span>
        </div>
        <span className="text-xs font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

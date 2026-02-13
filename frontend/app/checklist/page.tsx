'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ClipboardCheck, RotateCcw, Trophy, Target } from 'lucide-react'
import Link from 'next/link'
import { phases } from './data/phases'
import PhaseCard from './components/PhaseCard'
import TimelineView from './components/TimelineView'
import CostSummary from './components/CostSummary'

const STORAGE_KEY = 'medimatch_checklist_progress'

export default function ChecklistPage() {
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setCompletedTasks(JSON.parse(saved))
      } catch {}
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks))
    }
  }, [completedTasks, loaded])

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const resetAll = () => {
    if (confirm('모든 진행 상황을 초기화하시겠습니까?')) {
      setCompletedTasks([])
    }
  }

  const totalTasks = useMemo(() => phases.reduce((sum, p) => sum + p.subtasks.length, 0), [])
  const completedCount = completedTasks.length
  const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">개원 체크리스트</h1>
            </div>
          </div>
          <button onClick={resetAll} className="btn-ghost p-2 rounded-lg text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Progress overview */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {overallProgress === 100 ? (
                <Trophy className="w-5 h-5 text-amber-500" />
              ) : (
                <Target className="w-5 h-5 text-primary" />
              )}
              <span className="font-semibold text-foreground">
                {overallProgress === 100 ? '축하합니다! 모든 준비를 완료했습니다!' : '전체 진행률'}
              </span>
            </div>
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{completedCount}/{totalTasks} 항목 완료</span>
            <span>8단계 / 12개월</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            단계별 보기
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'timeline' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            타임라인 보기
          </button>
        </div>

        {viewMode === 'timeline' ? (
          <div className="space-y-6">
            <TimelineView phases={phases} completedTasks={completedTasks} />
            <CostSummary phases={phases} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Phase cards */}
            <div className="lg:col-span-2 space-y-4">
              {phases.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  completedTasks={completedTasks}
                  onToggleTask={toggleTask}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <CostSummary phases={phases} />

              {/* Quick stats */}
              <div className="card p-5">
                <h3 className="font-semibold text-foreground mb-3">단계별 진행률</h3>
                <div className="space-y-3">
                  {phases.map((phase) => {
                    const done = phase.subtasks.filter((t) => completedTasks.includes(t.id)).length
                    const total = phase.subtasks.length
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    return (
                      <div key={phase.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: phase.color }}>
                          {phase.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground truncate">{phase.title}</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: phase.color }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import { useGamification } from '@/components/opening/useGamification'
import OpeningProjectHeader from '@/components/opening/OpeningProjectHeader'
import JourneyPhaseCard from '@/components/opening/JourneyPhaseCard'
import JourneyConnector from '@/components/opening/JourneyConnector'
import JourneySidebar from '@/components/opening/JourneySidebar'
import GamificationSidebar from '@/components/opening/gamification/GamificationSidebar'
import MilestoneCelebration from '@/components/opening/MilestoneCelebration'
import GraduationModal from '@/components/opening/GraduationModal'
import QuizModal from '@/components/opening/gamification/QuizModal'
import LevelUpModal from '@/components/opening/gamification/LevelUpModal'
import AchievementToast from '@/components/opening/gamification/AchievementToast'
import FadeIn from '@/components/animation/FadeIn'
import { Loader2, Rocket, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'

export default function OpeningProjectPage() {
  const project = useOpeningProject()
  const gamification = useGamification(
    project.data.completedTasks,
    project.data.actualCosts,
    project.data.memos,
  )
  const [showGraduation, setShowGraduation] = useState(false)
  const activeCardRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)
  const lastCompletedRef = useRef<string | null>(null)

  // Auto-scroll to active phase on load
  useEffect(() => {
    if (!project.loading && !scrolledRef.current && activeCardRef.current) {
      scrolledRef.current = true
      setTimeout(() => {
        activeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [project.loading])

  const handleAllComplete = useCallback(() => {
    setShowGraduation(true)
  }, [])

  const handleToggle = useCallback((subtaskId: string) => {
    const wasCompleted = project.data.completedTasks.includes(subtaskId)
    project.toggleTask(subtaskId)
    if (!wasCompleted) {
      gamification.awardTaskXP(subtaskId)
      lastCompletedRef.current = subtaskId
      setTimeout(() => {
        if (lastCompletedRef.current === subtaskId) {
          gamification.startQuiz(subtaskId)
        }
      }, 600)
    }
  }, [project, gamification])

  // Phase navigation
  const goToPhase = useCallback((phaseId: number) => {
    project.setActivePhase(phaseId)
    setTimeout(() => {
      document.getElementById(`phase-${phaseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [project])

  if (project.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  const hasStarted = project.data.specialty || project.completedCount > 0
  const quizTaskTitle = gamification.pendingQuizTaskId
    ? project.filteredPhases.flatMap(p => p.subtasks).find(s => s.id === gamification.pendingQuizTaskId)?.title || ''
    : ''

  const activeIdx = project.filteredPhases.findIndex(p => p.id === project.activePhase)
  const prevPhase = activeIdx > 0 ? project.filteredPhases[activeIdx - 1] : null
  const nextPhase = activeIdx < project.filteredPhases.length - 1 ? project.filteredPhases[activeIdx + 1] : null

  return (
    <>
      <OpeningProjectHeader
        completedCount={project.completedCount}
        totalTasks={project.totalTasks}
        progress={project.progress}
        targetDate={project.data.targetDate}
        isLoggedIn={project.isLoggedIn}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <FadeIn direction="up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-base font-medium mb-5">
              <Rocket className="w-5 h-5" />
              개원 여정 가이드
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              8단계만 따라오세요.<br className="sm:hidden" /> 개원이 완성됩니다.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              사업계획부터 개원 당일까지, {project.totalTasks}개 체크리스트로 빠짐없이 준비하세요
            </p>
            {!hasStarted && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link href="/opening-project/wizard" className="btn-primary text-lg px-8 py-3">
                  <Rocket className="w-5 h-5" />
                  맞춤 설정으로 시작하기
                </Link>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Phase Step Indicator — 가로 단계 바 */}
        <div className="mb-8 bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between gap-1">
            {project.filteredPhases.map((phase, idx) => {
              const phaseStatus = project.getPhaseStatus(phase.id)
              const isActive = project.activePhase === phase.id
              const prog = project.getPhaseProgress(phase.id)
              return (
                <button
                  key={phase.id}
                  onClick={() => goToPhase(phase.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all ${
                    isActive ? 'bg-primary/10' : 'hover:bg-secondary'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                    ${phaseStatus === 'completed'
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'text-white'
                        : 'bg-secondary text-muted-foreground'
                    }
                  `}
                    style={isActive && phaseStatus !== 'completed' ? { backgroundColor: phase.color } : undefined}
                  >
                    {phaseStatus === 'completed' ? <Check className="w-5 h-5" /> : phase.id}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {phase.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{prog.completed}/{prog.total}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Journey Map */}
          <div className="flex-1 min-w-0 space-y-4">
            {project.filteredPhases.map((phase, index) => {
              const status = project.getPhaseStatus(phase.id)
              const progress = project.getPhaseProgress(phase.id)
              const isActive = project.activePhase === phase.id

              return (
                <div key={phase.id} ref={isActive ? activeCardRef : undefined}>
                  <JourneyPhaseCard
                    phase={phase}
                    status={status}
                    progress={progress}
                    completedTasks={project.data.completedTasks}
                    onToggle={handleToggle}
                    focused={isActive}
                    getTaskQuizScore={gamification.getTaskQuizScore}
                    onQuizClick={gamification.startQuiz}
                    phaseQuizAverage={gamification.getPhaseQuizAverage(phase.id)}
                  />
                  {index < project.filteredPhases.length - 1 && (
                    <JourneyConnector
                      color={phase.color}
                      completed={status === 'completed'}
                    />
                  )}
                </div>
              )
            })}

            {/* Phase Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 pb-8">
              {prevPhase ? (
                <button
                  onClick={() => goToPhase(prevPhase.id)}
                  className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors px-5 py-3 rounded-xl hover:bg-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                  이전: {prevPhase.title}
                </button>
              ) : <div />}
              {nextPhase ? (
                <button
                  onClick={() => goToPhase(nextPhase.id)}
                  className="flex items-center gap-2 text-base font-semibold text-primary hover:text-primary/80 transition-colors px-5 py-3 rounded-xl bg-primary/5 hover:bg-primary/10"
                >
                  다음: {nextPhase.title}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : <div />}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <JourneySidebar
                completedCount={project.completedCount}
                totalTasks={project.totalTasks}
                progress={project.progress}
                budgetTotal={project.data.budgetTotal}
                budgetSpent={project.budgetSpent}
                targetDate={project.data.targetDate}
                onDateChange={(date) => project.updateMeta({ targetDate: date })}
                getPhaseProgress={project.getPhaseProgress}
              />
              <GamificationSidebar
                xp={gamification.data.xp}
                level={gamification.level}
                readinessScore={gamification.readinessScore}
                readinessGrade={gamification.readinessGrade}
                readinessBreakdown={gamification.readinessBreakdown}
                unlockedAchievements={gamification.data.unlockedAchievements}
                completedTasks={project.data.completedTasks}
                getPhaseQuizAverage={gamification.getPhaseQuizAverage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Toasts */}
      <MilestoneCelebration
        completedTasks={project.data.completedTasks}
        seenMilestones={project.data.seenMilestones}
        onMilestoneSeen={project.markMilestoneSeen}
        onAllComplete={handleAllComplete}
      />
      {showGraduation && (
        <GraduationModal
          onClose={() => setShowGraduation(false)}
          readinessScore={gamification.readinessScore}
          readinessGrade={gamification.readinessGrade}
          xp={gamification.data.xp}
          level={gamification.level}
          achievementCount={gamification.data.unlockedAchievements.length}
        />
      )}
      <AnimatePresence>
        {gamification.pendingQuizTaskId && (
          <QuizModal
            taskId={gamification.pendingQuizTaskId}
            taskTitle={quizTaskTitle}
            onSubmit={gamification.submitQuizAnswers}
            onClose={gamification.dismissQuiz}
            previousScore={gamification.getTaskQuizScore(gamification.pendingQuizTaskId)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gamification.pendingLevelUp && !gamification.pendingQuizTaskId && (
          <LevelUpModal
            level={gamification.pendingLevelUp}
            onClose={gamification.dismissLevelUp}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gamification.pendingAchievements.length > 0 && (
          <AchievementToast
            achievement={gamification.pendingAchievements[0]}
            onDismiss={gamification.dismissAchievement}
          />
        )}
      </AnimatePresence>
    </>
  )
}

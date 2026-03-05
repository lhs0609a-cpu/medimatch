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
import StaggerChildren from '@/components/animation/StaggerChildren'
import { Loader2, Rocket } from 'lucide-react'
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
  const activeRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)
  const lastCompletedRef = useRef<string | null>(null)

  // Auto-scroll to active phase on load
  useEffect(() => {
    if (!project.loading && !scrolledRef.current && activeRef.current) {
      scrolledRef.current = true
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [project.loading])

  const handleAllComplete = useCallback(() => {
    setShowGraduation(true)
  }, [])

  // Wrap toggleTask to also award XP and trigger quiz
  const handleToggle = useCallback((subtaskId: string) => {
    const wasCompleted = project.data.completedTasks.includes(subtaskId)
    project.toggleTask(subtaskId)

    if (!wasCompleted) {
      // Award task XP
      gamification.awardTaskXP(subtaskId)
      // Trigger quiz after 600ms
      lastCompletedRef.current = subtaskId
      setTimeout(() => {
        if (lastCompletedRef.current === subtaskId) {
          gamification.startQuiz(subtaskId)
        }
      }, 600)
    }
  }, [project, gamification])

  if (project.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not started yet - show intro
  const hasStarted = project.data.specialty || project.completedCount > 0

  // Find task title for quiz modal
  const quizTaskTitle = gamification.pendingQuizTaskId
    ? project.filteredPhases.flatMap(p => p.subtasks).find(s => s.id === gamification.pendingQuizTaskId)?.title || ''
    : ''

  return (
    <>
      <OpeningProjectHeader
        completedCount={project.completedCount}
        totalTasks={project.totalTasks}
        progress={project.progress}
        targetDate={project.data.targetDate}
        isLoggedIn={project.isLoggedIn}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <FadeIn direction="up">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Rocket className="w-4 h-4" />
              개원 여정 가이드
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
              8단계만 따라오세요.<br className="sm:hidden" /> 개원이 완성됩니다.
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              사업계획부터 개원 당일까지, {project.totalTasks}개 체크리스트로 빠짐없이 준비하세요
            </p>
            {!hasStarted && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/opening-project/wizard"
                  className="btn-primary"
                >
                  <Rocket className="w-4 h-4" />
                  맞춤 설정으로 시작하기
                </Link>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Journey Map */}
          <div className="flex-1 min-w-0">
            <StaggerChildren staggerDelay={80}>
              {project.filteredPhases.map((phase, index) => {
                const status = project.getPhaseStatus(phase.id)
                const progress = project.getPhaseProgress(phase.id)
                const isActive = project.activePhase === phase.id

                return (
                  <div key={phase.id} ref={isActive ? activeRef : undefined}>
                    <JourneyPhaseCard
                      phase={phase}
                      status={status}
                      progress={progress}
                      completedTasks={project.data.completedTasks}
                      onToggle={handleToggle}
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
            </StaggerChildren>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
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

      {/* Milestone Celebration Handler */}
      <MilestoneCelebration
        completedTasks={project.data.completedTasks}
        seenMilestones={project.data.seenMilestones}
        onMilestoneSeen={project.markMilestoneSeen}
        onAllComplete={handleAllComplete}
      />

      {/* Graduation Modal */}
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

      {/* Quiz Modal */}
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

      {/* Level Up Modal */}
      <AnimatePresence>
        {gamification.pendingLevelUp && !gamification.pendingQuizTaskId && (
          <LevelUpModal
            level={gamification.pendingLevelUp}
            onClose={gamification.dismissLevelUp}
          />
        )}
      </AnimatePresence>

      {/* Achievement Toast */}
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

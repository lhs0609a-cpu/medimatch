'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { phases } from '@/app/checklist/data/phases'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import OpeningProjectHeader from '@/components/opening/OpeningProjectHeader'
import JourneyPhaseCard from '@/components/opening/JourneyPhaseCard'
import JourneyConnector from '@/components/opening/JourneyConnector'
import JourneySidebar from '@/components/opening/JourneySidebar'
import MilestoneCelebration from '@/components/opening/MilestoneCelebration'
import GraduationModal from '@/components/opening/GraduationModal'
import FadeIn from '@/components/animation/FadeIn'
import StaggerChildren from '@/components/animation/StaggerChildren'
import { Loader2, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function OpeningProjectPage() {
  const project = useOpeningProject()
  const [showGraduation, setShowGraduation] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)

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

  if (project.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not started yet - show intro
  const hasStarted = project.data.specialty || project.completedCount > 0

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
              {phases.map((phase, index) => {
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
                      onToggle={project.toggleTask}
                    />
                    {index < phases.length - 1 && (
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
            <div className="sticky top-20">
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
        <GraduationModal onClose={() => setShowGraduation(false)} />
      )}
    </>
  )
}

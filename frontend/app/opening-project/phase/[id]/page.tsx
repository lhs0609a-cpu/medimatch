'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
import Link from 'next/link'
import { phases, getPhaseCost } from '@/app/checklist/data/phases'
import { getPhaseFunnelConfig, getBannerStyleClasses } from '@/app/checklist/data/emr-funnel-config'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import { useGamification } from '@/components/opening/useGamification'
import PhaseChecklist from '@/components/opening/PhaseChecklist'
import ToolRecommendation from '@/components/opening/ToolRecommendation'
import XPBar from '@/components/opening/gamification/XPBar'
import QuizModal from '@/components/opening/gamification/QuizModal'
import LevelUpModal from '@/components/opening/gamification/LevelUpModal'
import AchievementToast from '@/components/opening/gamification/AchievementToast'
import FadeIn from '@/components/animation/FadeIn'
import {
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope,
  Users, Megaphone, PartyPopper, ArrowLeft, ArrowRight,
  Calendar, Wallet, FileText, Loader2,
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

const PHASE_ICONS: Record<number, React.ElementType> = {
  1: ClipboardList, 2: MapPin, 3: FileCheck, 4: Ruler,
  5: Stethoscope, 6: Users, 7: Megaphone, 8: PartyPopper,
}

export default function PhaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const phaseId = parseInt(params.id as string)
  const phase = phases.find(p => p.id === phaseId)
  const project = useOpeningProject()
  const gamification = useGamification(
    project.data.completedTasks,
    project.data.actualCosts,
    project.data.memos,
  )
  const lastCompletedRef = useRef<string | null>(null)

  // Wrap toggleTask with gamification
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

  if (!phase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">페이즈를 찾을 수 없습니다</h1>
          <Link href="/opening-project" className="text-primary hover:underline">여정 지도로 돌아가기</Link>
        </div>
      </div>
    )
  }

  if (project.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const Icon = PHASE_ICONS[phase.id] || ClipboardList
  const funnelConfig = getPhaseFunnelConfig(phase.id)
  const phaseCost = getPhaseCost(phase)
  const progress = project.getPhaseProgress(phase.id)
  const status = project.getPhaseStatus(phase.id)
  const prevPhase = phases.find(p => p.id === phaseId - 1)
  const nextPhase = phases.find(p => p.id === phaseId + 1)

  const quizTaskTitle = gamification.pendingQuizTaskId
    ? phase.subtasks.find(s => s.id === gamification.pendingQuizTaskId)?.title || ''
    : ''

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Mini Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/opening-project')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            여정 지도
          </button>
          <span className="text-sm font-medium">Phase {phase.id} / 8</span>
          <span className="text-xs text-muted-foreground">{progress.completed}/{progress.total} 완료</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 1. Phase Hero */}
        <FadeIn direction="up">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white"
              style={{ backgroundColor: status === 'completed' ? '#22c55e' : phase.color }}
            >
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{phase.title}</h1>
            <p className="text-muted-foreground mb-4">{phase.description}</p>

            {/* Phase Meta */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                약 {phase.duration}개월
              </span>
              {phaseCost > 0 && (
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  약 {phaseCost.toLocaleString()}만원
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{progress.percent}% 완료</span>
                <span className="text-muted-foreground">{progress.completed}/{progress.total}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress.percent}%`,
                    backgroundColor: status === 'completed' ? '#22c55e' : phase.color,
                  }}
                />
              </div>
            </div>

            {/* XP Bar (compact) */}
            <div className="mt-3 max-w-sm mx-auto">
              <XPBar xp={gamification.data.xp} level={gamification.level} compact />
            </div>
          </div>
        </FadeIn>

        {/* 2. Checklist Guide */}
        <FadeIn direction="up" delay={100}>
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <PhaseChecklist
              phaseId={phase.id}
              completedTasks={project.data.completedTasks}
              actualCosts={project.data.actualCosts}
              memos={project.data.memos}
              onToggle={handleToggle}
              onCostChange={project.updateTaskCost}
              onMemoChange={project.updateTaskMemo}
              getTaskQuizScore={gamification.getTaskQuizScore}
              onQuizClick={gamification.startQuiz}
            />
          </div>
        </FadeIn>

        {/* 3. Recommended Tools */}
        <FadeIn direction="up" delay={200}>
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
            <ToolRecommendation activePhase={phase.id} />
          </div>
        </FadeIn>

        {/* 4. Required Documents */}
        {phase.documents && phase.documents.length > 0 && (
          <FadeIn direction="up" delay={300}>
            <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <FileText className="w-4 h-4 text-primary" />
                필요 서류
              </div>
              <div className="space-y-2">
                {phase.documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-secondary/30"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">{doc.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* 5. EMR Banner */}
        {funnelConfig?.banner && (
          <FadeIn direction="up" delay={400}>
            <div className={`rounded-2xl border p-5 sm:p-6 ${getBannerStyleClasses(funnelConfig.banner.style)}`}>
              <h3 className="font-semibold mb-1">{funnelConfig.banner.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{funnelConfig.banner.description}</p>
              <Link
                href={funnelConfig.banner.ctaHref}
                className="btn-primary btn-sm inline-flex items-center gap-1.5"
              >
                {funnelConfig.banner.ctaText}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </FadeIn>
        )}

        {/* 6. Prev/Next Navigation */}
        <div className="flex items-center justify-between pt-4">
          {prevPhase ? (
            <Link
              href={`/opening-project/phase/${prevPhase.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{prevPhase.title}</span>
              <span className="sm:hidden">이전</span>
            </Link>
          ) : <div />}

          <Link
            href="/opening-project"
            className="text-sm text-primary hover:underline"
          >
            여정 지도
          </Link>

          {nextPhase ? (
            <Link
              href={`/opening-project/phase/${nextPhase.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="hidden sm:inline">{nextPhase.title}</span>
              <span className="sm:hidden">다음</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/emr/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              EMR 시작하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

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
    </div>
  )
}

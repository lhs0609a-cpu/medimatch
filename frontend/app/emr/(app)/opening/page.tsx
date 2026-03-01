'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import DdayCounter from '@/components/opening/DdayCounter'
import { phases, getPhaseCost } from '@/app/checklist/data/phases'
import { emrFunnelConfig, getPhaseFunnelConfig, getBannerStyleClasses } from '@/app/checklist/data/emr-funnel-config'
import {
  Rocket, Loader2, ArrowRight, CheckCircle2, Clock, Calendar,
  TrendingUp, Wallet, Target, BarChart3, ChevronRight,
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope, Users, Megaphone, PartyPopper,
  Calculator, Monitor, Receipt, ShoppingCart, Paintbrush, UserPlus, LayoutDashboard,
  MapPinned, ListChecks, FolderOpen, Landmark, Building2, Ear, Brain, Zap,
  Activity, HeartPulse, Eye, Baby, SmilePlus, Scissors, Leaf, Home,
  ShieldCheck, Flame, Briefcase, Trash2, RadioTower, FileText, Shield,
} from 'lucide-react'

const phaseIcons: Record<string, React.ElementType> = {
  ClipboardList, MapPin, FileCheck, Ruler, Stethoscope, Users, Megaphone, PartyPopper,
}

const toolIcons: Record<string, React.ElementType> = {
  Calculator, Monitor, Receipt, ShoppingCart, Paintbrush, UserPlus, LayoutDashboard,
  MapPinned, ListChecks, FolderOpen, Landmark, Building2, MapPin, FileCheck,
  Stethoscope, Users, Megaphone, TrendingUp, ArrowRight,
}

function getIcon(name: string): React.ElementType {
  return phaseIcons[name] || toolIcons[name] || Target
}

export default function EMROpeningPage() {
  const router = useRouter()
  const {
    data, loading, activePhase, setActivePhase,
    toggleTask, updateMeta, updateTaskCost, updateTaskMemo,
    completedCount, totalTasks, progress, budgetSpent,
    getPhaseProgress, getPhaseStatus,
    isLoggedIn, serverProjectId,
  } = useOpeningProject(true)

  // Redirect to wizard if no project
  useEffect(() => {
    if (!loading && !serverProjectId && !data.specialty && !data.title && data.completedTasks.length === 0) {
      router.push('/emr/opening/wizard')
    }
  }, [loading, serverProjectId, data, router])

  // D-Day calc
  const daysRemaining = useMemo(() => {
    if (!data.targetDate) return null
    const diff = new Date(data.targetDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [data.targetDate])

  // Weekly tasks (next 5 uncompleted)
  const weeklyTasks = useMemo(() => {
    const allSubtasks = phases.flatMap(p => p.subtasks.map(s => ({ ...s, phaseId: p.id, phaseTitle: p.title, phaseColor: p.color })))
    return allSubtasks
      .filter(s => !data.completedTasks.includes(s.id))
      .slice(0, 5)
  }, [data.completedTasks])

  // AI Timeline
  const aiTimeline = useMemo(() => {
    if (completedCount < 2) return null
    const weeksElapsed = Math.max(1, Math.ceil((Date.now() - (data.targetDate ? new Date(data.targetDate).getTime() - 365 * 24 * 60 * 60 * 1000 : Date.now())) / (7 * 24 * 60 * 60 * 1000)))
    const velocity = Math.max(0.5, completedCount / Math.max(1, weeksElapsed))
    const remaining = totalTasks - completedCount
    const weeksToComplete = Math.round(remaining / velocity)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + weeksToComplete * 7)
    return { velocity: velocity.toFixed(1), weeksToComplete, estimatedDate }
  }, [completedCount, totalTasks, data.targetDate])

  // Current phase config for EMR funnel
  const currentFunnel = getPhaseFunnelConfig(activePhase)

  // Budget KPIs
  const budgetTotal = data.budgetTotal || 0
  const budgetRemaining = budgetTotal - budgetSpent

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">개원 프로젝트 로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* (A) 헤더 + D-Day + Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{data.title || '개원 준비 커맨드센터'}</h1>
            <p className="text-sm text-muted-foreground">
              {data.specialty ? `${data.specialty} · ` : ''}{progress}% 진행 · {completedCount}/{totalTasks} 완료
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {daysRemaining !== null && (
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${daysRemaining <= 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : daysRemaining <= 90 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary/10 text-primary'}`}>
              D{daysRemaining > 0 ? `-${daysRemaining}` : daysRemaining === 0 ? '-Day' : `+${Math.abs(daysRemaining)}`}
            </div>
          )}
          <Link href="/emr/opening/budget" className="btn-secondary btn-sm flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" /> 예산
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">진행률</div>
          <div className="text-xl font-bold text-primary">{progress}%</div>
          <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">완료 태스크</div>
          <div className="text-xl font-bold">{completedCount}<span className="text-sm text-muted-foreground font-normal">/{totalTasks}</span></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">현재 단계</div>
          <div className="text-xl font-bold">Phase {activePhase}</div>
          <div className="text-xs text-muted-foreground">{phases.find(p => p.id === activePhase)?.title}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="text-xs text-muted-foreground mb-1">예산 사용</div>
          <div className="text-xl font-bold">{budgetTotal > 0 ? `${Math.round(budgetSpent / budgetTotal * 100)}%` : '-'}</div>
          {budgetTotal > 0 && <div className="text-xs text-muted-foreground">{budgetSpent.toLocaleString()} / {budgetTotal.toLocaleString()}만원</div>}
        </div>
      </div>

      {/* (B) 현재 Phase 스포트라이트 + (C) 이번 주 할 일 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* (B) Current Phase Spotlight */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const phase = phases.find(p => p.id === activePhase)
                const Icon = phase ? getIcon(phase.icon) : Target
                return (
                  <>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${phase?.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: phase?.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Phase {activePhase}: {phase?.title}</div>
                    </div>
                  </>
                )
              })()}
            </div>
            <Link
              href={`/emr/opening/phase/${activePhase}`}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              상세보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {(() => {
            const { completed, total, percent } = getPhaseProgress(activePhase)
            return (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{completed}/{total} 완료</span>
                    <span className="font-medium">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: phases.find(p => p.id === activePhase)?.color,
                      }}
                    />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/emr/opening/phase/${activePhase}?tab=checklist`} className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    체크리스트
                  </Link>
                  <Link href={`/emr/opening/phase/${activePhase}?tab=tools`} className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    도구
                  </Link>
                  <Link href="/emr/opening/budget" className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    비용분석
                  </Link>
                </div>
              </div>
            )
          })()}
        </div>

        {/* (C) 이번 주 할 일 */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">이번 주 할 일</h3>
          </div>
          <div className="space-y-2">
            {weeklyTasks.map(task => (
              <label
                key={task.id}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={data.completedTasks.includes(task.id)}
                  onChange={() => toggleTask(task.id)}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{task.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: task.phaseColor }} />
                    {task.phaseTitle}
                  </div>
                </div>
              </label>
            ))}
            {weeklyTasks.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                모든 태스크를 완료했습니다!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* (D) 예산 현황 + (E) AI 타임라인 예측 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* (D) Budget Status */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">예산 현황</h3>
            </div>
            <Link href="/emr/opening/budget" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              예산 상세 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 3 KPI cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">총 예산</div>
              <div className="text-sm font-bold">{budgetTotal > 0 ? `${(budgetTotal / 10000).toFixed(1)}억` : '-'}</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">사용액</div>
              <div className="text-sm font-bold text-amber-600">{budgetSpent > 0 ? `${(budgetSpent / 10000).toFixed(1)}억` : '-'}</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">잔액</div>
              <div className={`text-sm font-bold ${budgetRemaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {budgetTotal > 0 ? `${(budgetRemaining / 10000).toFixed(1)}억` : '-'}
              </div>
            </div>
          </div>

          {/* Phase budget bars */}
          <div className="space-y-1.5">
            {phases.map(phase => {
              const phaseCost = getPhaseCost(phase)
              const phaseActual = phase.subtasks.reduce((sum, s) => sum + (data.actualCosts[s.id] || 0), 0)
              const barWidth = budgetTotal > 0 ? Math.min(100, (phaseCost / budgetTotal) * 100 * 8) : 0
              return (
                <div key={phase.id} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-muted-foreground">{phase.id}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: phase.color }} />
                  </div>
                  <span className="w-16 text-right text-muted-foreground">{phaseCost > 0 ? `${phaseCost.toLocaleString()}` : '-'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* (E) AI Timeline */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">AI 타임라인 예측</h3>
          </div>

          {aiTimeline ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">주간 완료 속도</div>
                  <div className="text-lg font-bold">{aiTimeline.velocity}<span className="text-xs font-normal text-muted-foreground"> tasks/주</span></div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">예상 완료까지</div>
                  <div className="text-lg font-bold">{aiTimeline.weeksToComplete}<span className="text-xs font-normal text-muted-foreground"> 주</span></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">예상 완료일</span>
                  <span className="font-medium">{aiTimeline.estimatedDate.toLocaleDateString('ko-KR')}</span>
                </div>
                {data.targetDate && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">목표일</span>
                    <span className="font-medium">{new Date(data.targetDate).toLocaleDateString('ko-KR')}</span>
                  </div>
                )}
              </div>

              {/* Phase Gantt bars */}
              <div className="space-y-1">
                {phases.map(phase => {
                  const { percent } = getPhaseProgress(phase.id)
                  return (
                    <div key={phase.id} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-muted-foreground">{phase.id}</span>
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: phase.color }}
                        />
                      </div>
                      <span className="w-10 text-right">{percent}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              태스크를 2개 이상 완료하면<br />타임라인 예측이 시작됩니다
            </div>
          )}
        </div>
      </div>

      {/* (F) Phase 카드 그리드 */}
      <div>
        <h3 className="text-sm font-semibold mb-3">전체 단계 현황</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {phases.map(phase => {
            const { completed, total, percent } = getPhaseProgress(phase.id)
            const Icon = getIcon(phase.icon)
            const status = getPhaseStatus(phase.id)
            const funnelConfig = getPhaseFunnelConfig(phase.id)
            return (
              <Link
                key={phase.id}
                href={`/emr/opening/phase/${phase.id}`}
                className={`
                  bg-card rounded-xl border p-3 transition-all hover:shadow-md hover:-translate-y-0.5
                  ${status === 'active' ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${phase.color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: phase.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{phase.title}</div>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: phase.color }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                  {/* Connected feature mini badges */}
                  {phase.connectedFeatures && phase.connectedFeatures.length > 0 && (
                    <div className="flex -space-x-1">
                      {phase.connectedFeatures.slice(0, 2).map((f, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center border border-card" title={f.name}>
                          <span className="text-[8px]">{f.icon.charAt(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* (G) EMR 기능 바로가기 (현재 Phase 기반) */}
      {currentFunnel && currentFunnel.tools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">추천 도구</h3>
            <span className="text-xs text-muted-foreground">Phase {activePhase} 기반</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentFunnel.tools.map(tool => {
              const Icon = toolIcons[tool.icon] || Target
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${tool.highlight
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                      : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                    }
                  `}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.highlight ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${tool.highlight ? 'text-primary' : ''}`}>{tool.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{tool.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* EMR Funnel Banner */}
      {currentFunnel?.banner && (
        <div className={`rounded-2xl border p-5 ${getBannerStyleClasses(currentFunnel.banner.style)}`}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold text-sm">{currentFunnel.banner.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{currentFunnel.banner.description}</div>
            </div>
            <Link href={currentFunnel.banner.ctaHref} className="btn-primary btn-sm flex-shrink-0 flex items-center gap-1">
              {currentFunnel.banner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

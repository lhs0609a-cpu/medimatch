'use client'

import { useState } from 'react'
import { type Phase, type SubTask } from '@/app/checklist/data/phases'
import { taskGuides } from '@/app/checklist/data/task-guides'
import { getFilteredPhases, getDisplayCost, getUnmetDependencies } from '@/app/checklist/data/specialty-filter'
import { getGuideForSpecialty, inferRegionCode } from '@/app/checklist/data/task-guides/merge-guide'
import { Check, ChevronDown, ChevronUp, Lightbulb, Banknote, StickyNote, AlertTriangle, FileText, ListOrdered, ClipboardList, Scale, MessageSquareQuote, Coins, Link2 } from 'lucide-react'
import TaskQuizIndicator from './gamification/TaskQuizIndicator'
import DidYouKnow from './gamification/DidYouKnow'
import CommonMistakes from './gamification/CommonMistakes'
import TaskTimelineBar from './TaskTimelineBar'
import TaskResourceList from './TaskResourceList'
import TaskBenchmarks from './TaskBenchmarks'
import FailureCaseList from './FailureCaseList'
import RegionalInfoPanel from './RegionalInfoPanel'
import ContactList from './ContactList'
import TemplateDownloadList from './TemplateDownloadList'

interface PhaseChecklistProps {
  phaseId: number
  completedTasks: string[]
  actualCosts: Record<string, number>
  memos: Record<string, string>
  onToggle: (subtaskId: string) => void
  onCostChange?: (subtaskId: string, cost: number) => void
  onMemoChange?: (subtaskId: string, memo: string) => void
  getTaskQuizScore?: (taskId: string) => number | null
  onQuizClick?: (taskId: string) => void
  specialty?: string
  locationAddress?: string
}

export default function PhaseChecklist({
  phaseId, completedTasks, actualCosts, memos,
  onToggle, onCostChange, onMemoChange,
  getTaskQuizScore, onQuizClick,
  specialty, locationAddress,
}: PhaseChecklistProps) {
  const filteredPhases = getFilteredPhases(specialty)
  const phase = filteredPhases.find(p => p.id === phaseId)
  if (!phase) return null

  const completedCount = phase.subtasks.filter(s => completedTasks.includes(s.id)).length
  const regionCode = inferRegionCode(locationAddress)

  return (
    <div>
      {/* Phase 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{phase.title}</h3>
          <p className="text-sm text-muted-foreground">{phase.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{phase.subtasks.length}
          </span>
          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${phase.subtasks.length > 0 ? (completedCount / phase.subtasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 서브태스크 리스트 */}
      <div className="space-y-2">
        {phase.subtasks.map((task) => (
          <ChecklistItem
            key={task.id}
            task={task}
            isCompleted={completedTasks.includes(task.id)}
            actualCost={actualCosts[task.id]}
            memo={memos[task.id] || ''}
            phaseColor={phase.color}
            completedTasks={completedTasks}
            specialtyId={specialty}
            regionCode={regionCode}
            onToggle={() => onToggle(task.id)}
            onCostChange={onCostChange ? (cost) => onCostChange(task.id, cost) : undefined}
            onMemoChange={onMemoChange ? (memo) => onMemoChange(task.id, memo) : undefined}
            quizScore={getTaskQuizScore?.(task.id) ?? null}
            onQuizClick={onQuizClick ? () => onQuizClick(task.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function ChecklistItem({
  task, isCompleted, actualCost, memo, phaseColor,
  completedTasks, specialtyId, regionCode,
  onToggle, onCostChange, onMemoChange,
  quizScore, onQuizClick,
}: {
  task: SubTask
  isCompleted: boolean
  actualCost?: number
  memo: string
  phaseColor: string
  completedTasks: string[]
  specialtyId?: string
  regionCode?: string
  onToggle: () => void
  onCostChange?: (cost: number) => void
  onMemoChange?: (memo: string) => void
  quizScore: number | null
  onQuizClick?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDidYouKnow, setShowDidYouKnow] = useState(true)

  const displayCost = getDisplayCost(task)
  const unmetDeps = getUnmetDependencies(task, completedTasks)

  return (
    <div className={`
      rounded-xl border transition-all duration-200
      ${isCompleted
        ? 'bg-primary/5 border-primary/20'
        : 'bg-card border-border hover:border-primary/30'
      }
    `}>
      {/* 의존성 경고 */}
      {unmetDeps.length > 0 && !isCompleted && (
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/30 rounded-t-xl">
          <Link2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            선행 태스크 필요: {unmetDeps.map(d => d.title).join(', ')}
          </span>
        </div>
      )}

      {/* 메인 행 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className={`
            w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${isCompleted
              ? 'bg-primary text-white'
              : 'border-2 border-muted-foreground/30 hover:border-primary'
            }
          `}
        >
          {isCompleted && <Check className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {task.description}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isCompleted && (
            <TaskQuizIndicator
              taskId={task.id}
              quizScore={quizScore}
              onClick={onQuizClick}
            />
          )}
          {displayCost && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              {displayCost}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {expanded && (() => {
        const guide = getGuideForSpecialty(task.id, specialtyId) ?? taskGuides[task.id]
        return (
          <div className="px-4 pb-3 pt-1 space-y-3 border-t border-border/50">
            {/* "알고 계셨나요?" 교육 팝업 */}
            {!isCompleted && (
              <DidYouKnow
                taskId={task.id}
                show={showDidYouKnow}
                onDismiss={() => setShowDidYouKnow(false)}
              />
            )}

            {/* 타임라인 */}
            {guide?.timeline && (
              <TaskTimelineBar timeline={guide.timeline} />
            )}

            {task.tips && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{task.tips}</span>
              </div>
            )}

            {/* 진행 방법 */}
            {guide?.steps && guide.steps.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <ListOrdered className="w-3.5 h-3.5 text-blue-500" />
                  <span>진행 방법</span>
                </div>
                <ol className="space-y-1 ml-5">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="text-xs text-muted-foreground list-decimal pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 꿀팁 */}
            {guide?.tips && guide.tips.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>꿀팁</span>
                </div>
                <ul className="space-y-1 ml-5">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground list-disc pl-1">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 흔한 실수 (game-style) */}
            <CommonMistakes taskId={task.id} />

            {/* 실패 사례 */}
            {guide?.failureCases && <FailureCaseList cases={guide.failureCases} />}

            {/* 상세 체크리스트 */}
            {guide?.subChecklists && guide.subChecklists.length > 0 && (
              <div className="space-y-2">
                {guide.subChecklists.map((checklist, ci) => (
                  <div key={ci} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <ClipboardList className="w-3.5 h-3.5 text-violet-500" />
                      <span>{checklist.label}</span>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {checklist.items.map((item, ii) => (
                        <li key={ii} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* 추천 리소스 */}
            {guide?.resources && <TaskResourceList resources={guide.resources} />}

            {/* 문서 템플릿 다운로드 */}
            {guide?.resources && <TemplateDownloadList resources={guide.resources} />}

            {/* 벤치마크/수치 */}
            {guide?.benchmarks && <TaskBenchmarks benchmarks={guide.benchmarks} />}

            {/* 비용 상세 */}
            {guide?.costBreakdown && (
              <TaskBenchmarks benchmarks={guide.costBreakdown} title="비용 상세" icon={Coins} />
            )}

            {/* 지역별 정보 */}
            {guide?.regionalData && (
              <RegionalInfoPanel regionalData={guide.regionalData} userRegionCode={regionCode} />
            )}

            {/* 담당 기관 연락처 */}
            {guide?.contacts && <ContactList contacts={guide.contacts} />}

            {/* 법적 리스크 */}
            {guide?.legalRisks && guide.legalRisks.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>법적 리스크</span>
                </div>
                <ul className="space-y-1 ml-5">
                  {guide.legalRisks.map((risk, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-400 list-disc pl-1">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 관련 법규 */}
            {guide?.regulations && guide.regulations.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Scale className="w-3.5 h-3.5 text-red-500" />
                  <span>관련 법규</span>
                </div>
                <ul className="space-y-1 ml-5">
                  {guide.regulations.map((reg, i) => (
                    <li key={i} className="text-xs text-muted-foreground list-disc pl-1">
                      {reg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 전문가 조언 */}
            {guide?.expertAdvice && (
              <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg">
                <MessageSquareQuote className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{guide.expertAdvice}</span>
              </div>
            )}

            {/* 필요 서류 */}
            {guide?.documents && guide.documents.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <FileText className="w-3.5 h-3.5 text-green-600" />
                  <span>필요 서류</span>
                </div>
                <ul className="space-y-1 ml-5">
                  {guide.documents.map((doc, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 실제 비용 입력 */}
            {onCostChange && (
              <div className="flex items-center gap-2">
                <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">실제 비용:</span>
                <input
                  type="number"
                  value={actualCost || ''}
                  onChange={(e) => onCostChange(parseInt(e.target.value) || 0)}
                  placeholder="만원"
                  className="w-24 text-xs bg-secondary/50 border border-border rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground">만원</span>
              </div>
            )}

            {/* 메모 */}
            {onMemoChange && (
              <div className="flex items-start gap-2">
                <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-1.5" />
                <textarea
                  value={memo}
                  onChange={(e) => onMemoChange(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={2}
                  className="flex-1 text-xs bg-secondary/50 border border-border rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              예상 소요: {task.estimatedDays}일
            </div>
          </div>
        )
      })()}
    </div>
  )
}

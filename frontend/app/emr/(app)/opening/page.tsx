'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import OpeningTimeline from '@/components/opening/OpeningTimeline'
import PhaseChecklist from '@/components/opening/PhaseChecklist'
import ProgressSummary from '@/components/opening/ProgressSummary'
import DdayCounter from '@/components/opening/DdayCounter'
import ToolRecommendation from '@/components/opening/ToolRecommendation'
import {
  Settings2, Loader2, Rocket, PartyPopper, ArrowRight,
} from 'lucide-react'

export default function EMROpeningPage() {
  const {
    data, loading, activePhase, setActivePhase,
    toggleTask, updateMeta, updateTaskCost, updateTaskMemo,
    completedCount, totalTasks, progress, budgetSpent,
    getPhaseProgress, getPhaseStatus,
  } = useOpeningProject(true) // forceApi = true (EMR은 항상 API)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Phase 5 완료 축하 체크
  const phase5Progress = getPhaseProgress(5)
  const phase5Complete = phase5Progress.percent === 100

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
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {data.title || '개원 준비 커맨드센터'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.specialty ? `${data.specialty} · ` : ''}
              {progress}% 진행 · {completedCount}/{totalTasks} 완료
            </p>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="btn-icon"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* 설정 패널 */}
      {settingsOpen && (
        <div className="bg-secondary/30 rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">프로젝트 이름</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => updateMeta({ title: e.target.value })}
                placeholder="예: 강남 내과 개원 프로젝트"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">진료과</label>
              <select
                value={data.specialty}
                onChange={(e) => updateMeta({ specialty: e.target.value })}
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">선택하세요</option>
                <option value="내과">내과</option>
                <option value="정형외과">정형외과</option>
                <option value="피부과">피부과</option>
                <option value="안과">안과</option>
                <option value="이비인후과">이비인후과</option>
                <option value="비뇨의학과">비뇨의학과</option>
                <option value="산부인과">산부인과</option>
                <option value="소아청소년과">소아청소년과</option>
                <option value="신경과">신경과</option>
                <option value="가정의학과">가정의학과</option>
                <option value="재활의학과">재활의학과</option>
                <option value="정신건강의학과">정신건강의학과</option>
                <option value="성형외과">성형외과</option>
                <option value="치과">치과</option>
                <option value="한의원">한의원</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">위치</label>
              <input
                type="text"
                value={data.locationAddress}
                onChange={(e) => updateMeta({ locationAddress: e.target.value })}
                placeholder="예: 서울시 강남구 역삼동"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">총 예산 (만원)</label>
              <input
                type="number"
                value={data.budgetTotal || ''}
                onChange={(e) => updateMeta({ budgetTotal: parseInt(e.target.value) || null })}
                placeholder="예: 30000"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* D-Day 카운터 */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <DdayCounter
          targetDate={data.targetDate}
          onDateChange={(date) => updateMeta({ targetDate: date })}
        />
      </div>

      {/* 타임라인 */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <OpeningTimeline
          activePhase={activePhase}
          onPhaseClick={setActivePhase}
          getPhaseStatus={getPhaseStatus}
          getPhaseProgress={getPhaseProgress}
        />
      </div>

      {/* Phase 5 완료 축하 배너 */}
      {phase5Complete && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-5">
          <div className="flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-primary">EMR 시스템 도입 완료!</div>
              <div className="text-sm text-muted-foreground">
                의료장비/기자재 단계를 모두 완료했습니다. EMR 기능을 본격적으로 활용해보세요.
              </div>
            </div>
            <Link href="/emr/dashboard" className="btn-primary btn-sm flex-shrink-0">
              EMR 대시보드 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 메인: 체크리스트 + 사이드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            <PhaseChecklist
              phaseId={activePhase}
              completedTasks={data.completedTasks}
              actualCosts={data.actualCosts}
              memos={data.memos}
              onToggle={toggleTask}
              onCostChange={updateTaskCost}
              onMemoChange={updateTaskMemo}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            <ProgressSummary
              completedCount={completedCount}
              totalTasks={totalTasks}
              progress={progress}
              budgetTotal={data.budgetTotal}
              budgetSpent={budgetSpent}
              getPhaseProgress={getPhaseProgress}
            />
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            <ToolRecommendation activePhase={activePhase} />
          </div>

          {/* Phase 8 청구 테스트 바로가기 */}
          {activePhase === 8 && (
            <Link
              href="/emr/claims"
              className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all"
            >
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary">건강보험 청구 테스트</div>
                <div className="text-xs text-muted-foreground">청구관리에서 테스트 청구를 시작하세요</div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

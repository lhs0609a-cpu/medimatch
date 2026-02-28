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
  ArrowLeft, Settings2, ChevronDown, ChevronUp, Save,
  Stethoscope, Rocket, Cloud, CloudOff, Loader2,
} from 'lucide-react'

export default function OpeningCommandCenter() {
  const {
    data, loading, activePhase, setActivePhase,
    toggleTask, updateMeta, updateTaskCost, updateTaskMemo,
    completedCount, totalTasks, progress, budgetSpent,
    getPhaseProgress, getPhaseStatus, isLoggedIn,
  } = useOpeningProject()

  const [settingsOpen, setSettingsOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-icon">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold">
                  {data.title || '내 개원 프로젝트'}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isLoggedIn ? (
                    <><Cloud className="w-3 h-3 text-primary" /><span>클라우드 동기화</span></>
                  ) : (
                    <><CloudOff className="w-3 h-3" /><span>로컬 저장</span></>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLoggedIn && (
              <Link
                href="/login"
                className="text-xs text-primary font-medium hover:underline hidden sm:block"
              >
                로그인하면 클라우드 동기화
              </Link>
            )}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="btn-icon"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 프로젝트 설정 패널 */}
      {settingsOpen && (
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">프로젝트 이름</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => updateMeta({ title: e.target.value })}
                  placeholder="예: 강남 내과 개원 프로젝트"
                  className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">진료과</label>
                <select
                  value={data.specialty}
                  onChange={(e) => updateMeta({ specialty: e.target.value })}
                  className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
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
                  <option value="영상의학과">영상의학과</option>
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
                  className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">총 예산 (만원)</label>
                <input
                  type="number"
                  value={data.budgetTotal || ''}
                  onChange={(e) => updateMeta({ budgetTotal: parseInt(e.target.value) || null })}
                  placeholder="예: 30000"
                  className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* D-Day + 진행 요약 바 */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <DdayCounter
              targetDate={data.targetDate}
              onDateChange={(date) => updateMeta({ targetDate: date })}
            />
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{progress}%</div>
                <div className="text-xs text-muted-foreground">진행률</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-xs text-muted-foreground">/{totalTasks} 완료</div>
              </div>
            </div>
          </div>
        </div>

        {/* 타임라인 */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 mb-6">
          <OpeningTimeline
            activePhase={activePhase}
            onPhaseClick={setActivePhase}
            getPhaseStatus={getPhaseStatus}
            getPhaseProgress={getPhaseProgress}
          />
        </div>

        {/* 메인 콘텐츠: 체크리스트 + 사이드 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 체크리스트 (2/3) */}
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

          {/* 사이드 패널 (1/3) */}
          <div className="space-y-6">
            {/* 진행률 + 예산 */}
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

            {/* 추천 도구 */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
              <ToolRecommendation activePhase={activePhase} />
            </div>

            {/* 비로그인 CTA */}
            {!isLoggedIn && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-sm">데이터를 안전하게 보관하세요</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  로그인하면 체크리스트가 클라우드에 동기화되어 어디서든 확인할 수 있습니다.
                </p>
                <div className="flex gap-2">
                  <Link href="/login" className="btn-primary btn-sm flex-1 justify-center">
                    로그인
                  </Link>
                  <Link href="/register" className="btn-secondary btn-sm flex-1 justify-center">
                    회원가입
                  </Link>
                </div>
              </div>
            )}

            {/* EMR 바로가기 */}
            <Link
              href="/emr/dashboard"
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold group-hover:text-primary transition-colors">
                  MediMatch EMR
                </div>
                <div className="text-xs text-muted-foreground">
                  EMR에서 더 많은 기능을 사용하세요
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

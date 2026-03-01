'use client'

import { useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import PhaseChecklist from '@/components/opening/PhaseChecklist'
import { phases, getPhaseCost } from '@/app/checklist/data/phases'
import { getPhaseFunnelConfig, getBannerStyleClasses } from '@/app/checklist/data/emr-funnel-config'
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2,
  ClipboardList, Wrench, FileText, Users as UsersIcon, BarChart3,
  Calculator, MapPin, Monitor, Receipt, ShoppingCart, Paintbrush,
  UserPlus, LayoutDashboard, MapPinned, ListChecks, FolderOpen,
  Landmark, Building2, FileCheck, Stethoscope, Users, Megaphone,
  PartyPopper, Ruler, TrendingUp, Target, ExternalLink,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Calculator, MapPin, Monitor, Receipt, ShoppingCart, Paintbrush,
  UserPlus, LayoutDashboard, MapPinned, ListChecks, FolderOpen,
  Landmark, Building2, FileCheck, Stethoscope, Users, Megaphone,
  PartyPopper, Ruler, TrendingUp, Target, ClipboardList,
}

const TABS = [
  { id: 'checklist', label: '체크리스트', icon: ClipboardList },
  { id: 'tools', label: '도구', icon: Wrench },
  { id: 'documents', label: '문서/가이드', icon: FileText },
  { id: 'partners', label: '파트너', icon: UsersIcon },
  { id: 'cost', label: '비용 분석', icon: BarChart3 },
]

export default function PhaseDeepPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const phaseId = parseInt(params.id as string)
  const initialTab = searchParams.get('tab') || 'checklist'
  const [activeTab, setActiveTab] = useState(initialTab)

  const {
    data, loading,
    toggleTask, updateTaskCost, updateTaskMemo,
    getPhaseProgress,
    budgetSpent,
  } = useOpeningProject(true)

  const phase = phases.find(p => p.id === phaseId)
  const funnelConfig = getPhaseFunnelConfig(phaseId)

  const phaseProgress = useMemo(() => {
    if (!phase) return { completed: 0, total: 0, percent: 0 }
    return getPhaseProgress(phaseId)
  }, [phase, phaseId, getPhaseProgress])

  // KPI values based on phase
  const kpiValues = useMemo(() => {
    if (!phase || !funnelConfig) return ['—', '—', '—', '—']
    const phaseCost = getPhaseCost(phase)
    const phaseActualCost = phase.subtasks.reduce((s, st) => s + (data.actualCosts[st.id] || 0), 0)
    const { completed, total } = phaseProgress

    switch (phaseId) {
      case 1: return [
        data.budgetTotal ? `${Math.round(data.budgetTotal * 0.08).toLocaleString()}만원` : '—',
        data.budgetTotal ? `${Math.round(data.budgetTotal / (data.budgetTotal * 0.08) * 12)}개월` : '—',
        data.budgetTotal ? `${data.budgetTotal.toLocaleString()}만원` : '—',
        data.budgetTotal ? '70%' : '—',
      ]
      case 2: return ['—', '—', '—', '—']
      case 3: return [
        `${total - completed}건`,
        `${(total - completed) * 7}일`,
        `${completed}건`,
        `${phaseActualCost.toLocaleString()}만원`,
      ]
      case 4: return [
        `${phaseCost.toLocaleString()}만원`,
        '—',
        '—',
        phaseActualCost > 0 ? `${(phaseCost - phaseActualCost).toLocaleString()}만원` : '—',
      ]
      case 5: return [
        `${phaseCost.toLocaleString()}만원`,
        `${total}개`,
        '—',
        `${phaseProgress.percent}%`,
      ]
      case 6: return [
        `${phaseCost.toLocaleString()}만원`,
        `${completed}명`,
        `${total}명`,
        '—',
      ]
      case 7: return [
        `${phaseCost.toLocaleString()}만원`,
        `${total}개`,
        '—',
        '—',
      ]
      case 8: {
        const daysLeft = data.targetDate
          ? Math.ceil((new Date(data.targetDate).getTime() - Date.now()) / (86400000))
          : null
        return [
          `${total - completed}건`,
          '—',
          `${phaseProgress.percent}%`,
          daysLeft !== null ? `D-${Math.max(0, daysLeft)}` : '—',
        ]
      }
      default: return ['—', '—', '—', '—']
    }
  }, [phaseId, phase, data, phaseProgress, funnelConfig])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!phase) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">존재하지 않는 단계입니다.</p>
        <Link href="/emr/opening" className="text-primary hover:underline text-sm mt-2 inline-block">돌아가기</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emr/opening" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${phase.color}20` }}>
            {(() => {
              const Icon = iconMap[phase.icon] || Target
              return <Icon className="w-5 h-5" style={{ color: phase.color }} />
            })()}
          </div>
          <div>
            <h1 className="text-lg font-bold">Phase {phaseId}: {phase.title}</h1>
            <p className="text-sm text-muted-foreground">{phase.description}</p>
          </div>
        </div>
        {/* Phase navigation */}
        <div className="flex items-center gap-1">
          {phaseId > 1 && (
            <Link href={`/emr/opening/phase/${phaseId - 1}`} className="btn-icon">
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          {phaseId < 8 && (
            <Link href={`/emr/opening/phase/${phaseId + 1}`} className="btn-icon">
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">{phaseProgress.completed}/{phaseProgress.total} 완료</span>
          <span className="font-medium">{phaseProgress.percent}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full">
          <div className="h-full rounded-full transition-all" style={{ width: `${phaseProgress.percent}%`, backgroundColor: phase.color }} />
        </div>
      </div>

      {/* KPI Cards */}
      {funnelConfig && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {funnelConfig.kpiLabels.map((label, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-lg font-bold mt-0.5">{kpiValues[i]}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main: Tabs + Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content (3/4) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tab buttons */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}
                `}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <PhaseChecklist
                phaseId={phaseId}
                completedTasks={data.completedTasks}
                actualCosts={data.actualCosts}
                memos={data.memos}
                onToggle={toggleTask}
                onCostChange={updateTaskCost}
                onMemoChange={updateTaskMemo}
              />
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && funnelConfig && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Phase {phaseId} 추천 도구</h3>
                <div className="space-y-3">
                  {funnelConfig.tools.map(tool => {
                    const Icon = iconMap[tool.icon] || Target
                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className={`
                          flex items-center gap-3 p-4 rounded-xl border transition-all
                          ${tool.highlight
                            ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                            : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.highlight ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${tool.highlight ? 'text-primary' : ''}`}>{tool.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{tool.description}</div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${tool.highlight ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                          {tool.ctaText}
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {funnelConfig.tools.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    이 단계에는 연결된 도구가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">필요 문서 / 가이드</h3>
                {phase.documents && phase.documents.length > 0 ? (
                  <div className="space-y-2">
                    {phase.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.description}</div>
                        </div>
                        {doc.templateUrl && (
                          <a href={doc.templateUrl} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            다운로드 <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    이 단계에 등록된 문서가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Partners Tab */}
            {activeTab === 'partners' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">추천 파트너</h3>
                  <Link href="/emr/opening/vendors" className="text-xs text-primary hover:underline">
                    전체 보기 →
                  </Link>
                </div>
                {(() => {
                  const partnerCategories: Record<number, { category: string; examples: string[] }[]> = {
                    1: [{ category: '개원 컨설팅', examples: ['전문 컨설턴트 A', '전문 컨설턴트 B'] }],
                    2: [{ category: '부동산', examples: ['의료전문 부동산 A'] }],
                    3: [{ category: '세무/노무', examples: ['의료전문 세무사', '의료전문 노무사'] }],
                    4: [{ category: '인테리어', examples: ['의료전문 인테리어 A', '의료전문 인테리어 B', '설계사무소'] }],
                    5: [{ category: '의료장비', examples: ['장비 공급업체 A', '리스회사 A'] }],
                    6: [{ category: '채용', examples: ['의료인 채용 플랫폼 A'] }],
                    7: [{ category: '마케팅', examples: ['병원 마케팅 전문 A', 'SNS 대행 A'] }],
                    8: [{ category: '컨설팅', examples: ['개원 후 관리 컨설팅'] }],
                  }
                  const partners = partnerCategories[phaseId] || []
                  return partners.length > 0 ? (
                    <div className="space-y-3">
                      {partners.map((cat, ci) => (
                        <div key={ci}>
                          <div className="text-xs text-muted-foreground mb-2">{cat.category}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cat.examples.map((name, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                                  {name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{name}</div>
                                  <div className="text-xs text-muted-foreground">{cat.category} 전문</div>
                                </div>
                                <button className="text-xs px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                                  문의
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      이 단계에 추천 파트너가 없습니다.
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Cost Analysis Tab */}
            {activeTab === 'cost' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">비용 분석</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground">예상 비용</div>
                    <div className="text-sm font-bold">{getPhaseCost(phase).toLocaleString()}만원</div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground">실제 비용</div>
                    <div className="text-sm font-bold text-amber-600">
                      {phase.subtasks.reduce((s, st) => s + (data.actualCosts[st.id] || 0), 0).toLocaleString()}만원
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground">차이</div>
                    {(() => {
                      const est = getPhaseCost(phase)
                      const act = phase.subtasks.reduce((s, st) => s + (data.actualCosts[st.id] || 0), 0)
                      const diff = est - act
                      return (
                        <div className={`text-sm font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {diff >= 0 ? '-' : '+'}{Math.abs(diff).toLocaleString()}만원
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Subtask cost breakdown */}
                <div className="space-y-2">
                  {phase.subtasks.map(st => {
                    const estimated = st.estimatedCost || 0
                    const actual = data.actualCosts[st.id] || 0
                    const maxVal = Math.max(estimated, actual, 1)
                    return (
                      <div key={st.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={data.completedTasks.includes(st.id) ? 'line-through text-muted-foreground' : ''}>
                            {st.title}
                          </span>
                          <span className="text-muted-foreground">
                            {actual > 0 ? `${actual.toLocaleString()}` : estimated > 0 ? `(${estimated.toLocaleString()})` : '-'} 만원
                          </span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div className="flex-1 bg-secondary rounded-full overflow-hidden" title="예상">
                            <div className="h-full rounded-full bg-primary/40" style={{ width: `${(estimated / maxVal) * 100}%` }} />
                          </div>
                          <div className="flex-1 bg-secondary rounded-full overflow-hidden" title="실제">
                            <div className="h-full rounded-full" style={{ width: `${(actual / maxVal) * 100}%`, backgroundColor: phase.color }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded bg-primary/40 inline-block" /> 예상</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded inline-block" style={{ backgroundColor: phase.color }} /> 실제</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (1/4) */}
        <div className="space-y-4">
          {/* EMR Funnel Banner */}
          {funnelConfig?.banner && (
            <div className={`rounded-xl border p-4 ${getBannerStyleClasses(funnelConfig.banner.style)}`}>
              <div className="text-sm font-semibold mb-1">{funnelConfig.banner.title}</div>
              <div className="text-xs text-muted-foreground mb-3">{funnelConfig.banner.description}</div>
              <Link href={funnelConfig.banner.ctaHref} className="btn-primary btn-sm w-full text-center flex items-center justify-center gap-1">
                {funnelConfig.banner.ctaText} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Connected Features */}
          {phase.connectedFeatures && phase.connectedFeatures.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">연결된 기능</div>
              <div className="space-y-2">
                {phase.connectedFeatures.map((f, i) => {
                  const Icon = iconMap[f.icon] || Target
                  return (
                    <Link key={i} href={f.href} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {f.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Phase Navigation */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">단계 이동</div>
            <div className="space-y-1">
              {phases.map(p => {
                const { percent } = getPhaseProgress(p.id)
                return (
                  <Link
                    key={p.id}
                    href={`/emr/opening/phase/${p.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${p.id === phaseId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary/50 text-muted-foreground'}`}
                  >
                    <span className="w-4 text-center">{p.id}</span>
                    <span className="flex-1 truncate">{p.title}</span>
                    <span>{percent}%</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

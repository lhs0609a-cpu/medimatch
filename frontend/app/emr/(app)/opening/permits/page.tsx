'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useOpeningProject } from '@/components/opening/useOpeningProject'
import { permitCategories } from '@/app/checklist/data/permit-requirements'
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle,
  Building2, Receipt, Shield, RadioTower, Trash2, Flame, Briefcase,
  FileText, FileCheck, Calculator, Users, ShieldCheck, ShieldAlert,
  FileWarning, ExternalLink, Phone, Globe, ChevronDown, ChevronRight,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Building2, Receipt, Shield, RadioTower, Trash2, Flame, Briefcase,
  FileText, FileCheck, Calculator, Users, ShieldCheck, ShieldAlert,
  FileWarning,
}

type PermitStatus = 'completed' | 'in-progress' | 'not-started'

function getPermitStatus(linkedSubtaskId: string, completedTasks: string[]): PermitStatus {
  if (completedTasks.includes(linkedSubtaskId)) return 'completed'
  // Check if any task in same phase is done (rough proxy for "in-progress")
  const phaseId = linkedSubtaskId.split('-')[0]
  const phaseHasProgress = completedTasks.some(t => t.startsWith(`${phaseId}-`))
  if (phaseHasProgress) return 'in-progress'
  return 'not-started'
}

const statusConfig: Record<PermitStatus, { label: string; color: string; icon: React.ElementType }> = {
  'completed': { label: '완료', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
  'in-progress': { label: '진행중', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', icon: Clock },
  'not-started': { label: '미시작', color: 'text-muted-foreground bg-secondary', icon: AlertCircle },
}

export default function PermitsGuidePage() {
  const { data, loading } = useOpeningProject(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState(permitCategories[0]?.id || '')
  const [selectedPermitId, setSelectedPermitId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([permitCategories[0]?.id || '']))

  const selectedCategory = permitCategories.find(c => c.id === selectedCategoryId)
  const selectedPermit = useMemo(() => {
    if (!selectedPermitId) {
      return selectedCategory?.permits[0] || null
    }
    for (const cat of permitCategories) {
      const found = cat.permits.find(p => p.id === selectedPermitId)
      if (found) return found
    }
    return null
  }, [selectedPermitId, selectedCategory])

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Stats
  const stats = useMemo(() => {
    const allPermits = permitCategories.flatMap(c => c.permits)
    const completed = allPermits.filter(p => getPermitStatus(p.linkedSubtaskId, data.completedTasks) === 'completed').length
    const inProgress = allPermits.filter(p => getPermitStatus(p.linkedSubtaskId, data.completedTasks) === 'in-progress').length
    return { total: allPermits.length, completed, inProgress, notStarted: allPermits.length - completed - inProgress }
  }, [data.completedTasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/emr/opening" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold">인허가 가이드</h1>
          <p className="text-sm text-muted-foreground">개원에 필요한 인허가와 행정 절차를 안내합니다</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">완료</div>
          <div className="text-xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">진행중</div>
          <div className="text-xl font-bold text-amber-600">{stats.inProgress}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">미시작</div>
          <div className="text-xl font-bold text-muted-foreground">{stats.notStarted}</div>
        </div>
      </div>

      {/* Main: Category list + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category list */}
        <div className="space-y-2">
          {permitCategories.map(cat => {
            const CatIcon = iconMap[cat.icon] || FileCheck
            const isExpanded = expandedCategories.has(cat.id)
            return (
              <div key={cat.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => {
                    toggleCategory(cat.id)
                    setSelectedCategoryId(cat.id)
                    if (!isExpanded && cat.permits.length > 0) {
                      setSelectedPermitId(cat.permits[0].id)
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 p-3 hover:bg-secondary/50 transition-colors ${selectedCategoryId === cat.id ? 'bg-secondary/30' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                    <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">{cat.name}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border">
                    {cat.permits.map(permit => {
                      const status = getPermitStatus(permit.linkedSubtaskId, data.completedTasks)
                      const StatusIcon = statusConfig[status].icon
                      return (
                        <button
                          key={permit.id}
                          onClick={() => {
                            setSelectedPermitId(permit.id)
                            setSelectedCategoryId(cat.id)
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${selectedPermitId === permit.id ? 'bg-primary/5 text-primary' : 'hover:bg-secondary/50'}`}
                        >
                          <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 ${statusConfig[status].color.split(' ')[0]}`} />
                          <span className="flex-1 truncate">{permit.title}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Detail panel */}
        <div className="lg:col-span-2">
          {selectedPermit ? (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
              {/* Permit header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold">{selectedPermit.title}</h2>
                  <div className="text-sm text-muted-foreground mt-0.5">{selectedPermit.agency}</div>
                </div>
                {(() => {
                  const status = getPermitStatus(selectedPermit.linkedSubtaskId, data.completedTasks)
                  const StatusIcon = statusConfig[status].icon
                  return (
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${statusConfig[status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[status].label}
                    </span>
                  )
                })()}
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-secondary/30 rounded-lg p-2.5">
                  <div className="text-xs text-muted-foreground">예상 소요일</div>
                  <div className="text-sm font-bold">{selectedPermit.estimatedDays}일</div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2.5">
                  <div className="text-xs text-muted-foreground">예상 비용</div>
                  <div className="text-sm font-bold">{selectedPermit.estimatedCost > 0 ? `${selectedPermit.estimatedCost}만원` : '무료'}</div>
                </div>
                {selectedPermit.agencyPhone && (
                  <div className="bg-secondary/30 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground">연락처</div>
                    <div className="text-sm font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedPermit.agencyPhone}
                    </div>
                  </div>
                )}
              </div>

              {selectedPermit.agencyWebsite && (
                <a
                  href={selectedPermit.agencyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Globe className="w-3 h-3" /> {selectedPermit.agencyWebsite}
                </a>
              )}

              {selectedPermit.conditionalOn && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                  <span className="font-medium text-amber-700 dark:text-amber-400">조건부: </span>
                  <span className="text-amber-600 dark:text-amber-400">{selectedPermit.conditionalOn}</span>
                </div>
              )}

              {/* Required documents */}
              <div>
                <h3 className="text-sm font-semibold mb-2">필요 서류</h3>
                <div className="space-y-1.5">
                  {selectedPermit.documents.map(doc => (
                    <div key={doc.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{doc.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-sm font-semibold mb-2">진행 절차</h3>
                <ol className="space-y-2">
                  {selectedPermit.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {selectedPermit.tips.length > 0 && (
                <div className="bg-primary/5 rounded-xl p-4">
                  <div className="text-xs font-semibold text-primary mb-2">팁</div>
                  <ul className="space-y-1">
                    {selectedPermit.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
              좌측에서 허가 항목을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

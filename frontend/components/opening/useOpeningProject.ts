'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { phases } from '@/app/checklist/data/phases'
import { openingProjectService } from '@/lib/api/services'

const STORAGE_KEY = 'medimatch_opening_project'
const LEGACY_KEY = 'medimatch_checklist_progress'

export interface LocalProjectData {
  title: string
  specialty: string
  targetDate: string
  locationAddress: string
  notes: string
  budgetTotal: number | null
  completedTasks: string[]
  actualCosts: Record<string, number>
  memos: Record<string, string>
}

const DEFAULT_LOCAL: LocalProjectData = {
  title: '',
  specialty: '',
  targetDate: '',
  locationAddress: '',
  notes: '',
  budgetTotal: null,
  completedTasks: [],
  actualCosts: {},
  memos: {},
}

function loadLocal(): LocalProjectData {
  if (typeof window === 'undefined') return DEFAULT_LOCAL
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_LOCAL, ...JSON.parse(raw) }

    // 레거시 키 마이그레이션
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const migrated: LocalProjectData = {
        ...DEFAULT_LOCAL,
        completedTasks: Array.isArray(parsed) ? parsed : parsed.completedTasks || [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_KEY)
      return migrated
    }
  } catch { /* ignore */ }
  return DEFAULT_LOCAL
}

function saveLocal(data: LocalProjectData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('access_token')
}

// 전체 subtask 수
const totalTasks = phases.reduce((sum, p) => sum + p.subtasks.length, 0)

export function useOpeningProject(forceApi = false) {
  const [data, setData] = useState<LocalProjectData>(DEFAULT_LOCAL)
  const [serverProjectId, setServerProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState(1)
  const useApi = forceApi || isLoggedIn()
  const initialized = useRef(false)

  // 초기 로드
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      if (useApi) {
        try {
          const res = await openingProjectService.list()
          if (res.items.length > 0) {
            const proj = res.items[0]
            setServerProjectId(proj.id)
            setData({
              title: proj.title || '',
              specialty: proj.specialty || '',
              targetDate: proj.target_date || '',
              locationAddress: proj.location_address || '',
              notes: proj.notes || '',
              budgetTotal: proj.budget_total || null,
              completedTasks: proj.tasks.filter(t => t.is_completed).map(t => t.subtask_id),
              actualCosts: Object.fromEntries(proj.tasks.filter(t => t.actual_cost).map(t => [t.subtask_id, t.actual_cost!])),
              memos: Object.fromEntries(proj.tasks.filter(t => t.memo).map(t => [t.subtask_id, t.memo!])),
            })
          } else {
            // 서버에 프로젝트 없음 → localStorage에 데이터 있으면 동기화
            const local = loadLocal()
            if (local.completedTasks.length > 0 || local.title) {
              const proj = await openingProjectService.create({
                title: local.title || undefined,
                specialty: local.specialty || undefined,
                target_date: local.targetDate || undefined,
                budget_total: local.budgetTotal || undefined,
                location_address: local.locationAddress || undefined,
                notes: local.notes || undefined,
              } as any)
              setServerProjectId(proj.id)
              if (local.completedTasks.length > 0) {
                await openingProjectService.syncFromLocal(proj.id, {
                  tasks: local.completedTasks.map(id => ({
                    subtask_id: id,
                    is_completed: true,
                    actual_cost: local.actualCosts[id],
                    memo: local.memos[id],
                  })),
                })
              }
              setData(local)
              localStorage.removeItem(STORAGE_KEY)
            } else {
              setData(DEFAULT_LOCAL)
            }
          }
        } catch {
          // API 실패 → 로컬로 폴백
          setData(loadLocal())
        }
      } else {
        setData(loadLocal())
      }
      setLoading(false)
    }

    init()
  }, [useApi])

  // 현재 활성 Phase 자동 계산
  useEffect(() => {
    if (loading) return
    for (let i = phases.length - 1; i >= 0; i--) {
      const phase = phases[i]
      const hasCompleted = phase.subtasks.some(s => data.completedTasks.includes(s.id))
      if (hasCompleted) {
        const allDone = phase.subtasks.every(s => data.completedTasks.includes(s.id))
        setActivePhase(allDone && i < phases.length - 1 ? phase.id + 1 : phase.id)
        return
      }
    }
    setActivePhase(1)
  }, [data.completedTasks, loading])

  const toggleTask = useCallback(async (subtaskId: string) => {
    const isCompleted = !data.completedTasks.includes(subtaskId)
    const newCompleted = isCompleted
      ? [...data.completedTasks, subtaskId]
      : data.completedTasks.filter(id => id !== subtaskId)

    const newData = { ...data, completedTasks: newCompleted }
    setData(newData)

    if (useApi && serverProjectId) {
      try {
        await openingProjectService.toggleTask(serverProjectId, subtaskId, {
          is_completed: isCompleted,
          actual_cost: data.actualCosts[subtaskId],
          memo: data.memos[subtaskId],
        })
      } catch { /* optimistic update already done */ }
    } else {
      saveLocal(newData)
    }
  }, [data, useApi, serverProjectId])

  const updateMeta = useCallback(async (updates: Partial<Pick<LocalProjectData, 'title' | 'specialty' | 'targetDate' | 'locationAddress' | 'notes' | 'budgetTotal'>>) => {
    const newData = { ...data, ...updates }
    setData(newData)

    if (useApi && serverProjectId) {
      try {
        await openingProjectService.update(serverProjectId, {
          title: updates.title,
          specialty: updates.specialty,
          target_date: updates.targetDate,
          budget_total: updates.budgetTotal ?? undefined,
          location_address: updates.locationAddress,
          notes: updates.notes,
        } as any)
      } catch { /* optimistic update already done */ }
    } else {
      saveLocal(newData)
    }
  }, [data, useApi, serverProjectId])

  const updateTaskCost = useCallback(async (subtaskId: string, cost: number) => {
    const newData = { ...data, actualCosts: { ...data.actualCosts, [subtaskId]: cost } }
    setData(newData)

    if (useApi && serverProjectId) {
      try {
        await openingProjectService.toggleTask(serverProjectId, subtaskId, {
          is_completed: data.completedTasks.includes(subtaskId),
          actual_cost: cost,
        })
      } catch { /* optimistic */ }
    } else {
      saveLocal(newData)
    }
  }, [data, useApi, serverProjectId])

  const updateTaskMemo = useCallback(async (subtaskId: string, memo: string) => {
    const newData = { ...data, memos: { ...data.memos, [subtaskId]: memo } }
    setData(newData)

    if (useApi && serverProjectId) {
      try {
        await openingProjectService.toggleTask(serverProjectId, subtaskId, {
          is_completed: data.completedTasks.includes(subtaskId),
          memo,
        })
      } catch { /* optimistic */ }
    } else {
      saveLocal(newData)
    }
  }, [data, useApi, serverProjectId])

  // 계산값
  const completedCount = data.completedTasks.length
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const budgetSpent = Object.values(data.actualCosts).reduce((s, v) => s + v, 0)

  const getPhaseProgress = useCallback((phaseId: number) => {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return { completed: 0, total: 0, percent: 0 }
    const completed = phase.subtasks.filter(s => data.completedTasks.includes(s.id)).length
    return { completed, total: phase.subtasks.length, percent: Math.round((completed / phase.subtasks.length) * 100) }
  }, [data.completedTasks])

  const getPhaseStatus = useCallback((phaseId: number): 'completed' | 'active' | 'upcoming' => {
    const { percent } = getPhaseProgress(phaseId)
    if (percent === 100) return 'completed'
    if (percent > 0) return 'active'
    if (phaseId === activePhase) return 'active'
    return 'upcoming'
  }, [getPhaseProgress, activePhase])

  return {
    data,
    loading,
    activePhase,
    setActivePhase,
    toggleTask,
    updateMeta,
    updateTaskCost,
    updateTaskMemo,
    completedCount,
    totalTasks,
    progress,
    budgetSpent,
    getPhaseProgress,
    getPhaseStatus,
    isLoggedIn: useApi,
    serverProjectId,
  }
}

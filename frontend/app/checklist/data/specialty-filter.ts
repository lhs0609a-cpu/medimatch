import { phases, type Phase, type SubTask } from './phases'

/**
 * applicableSpecialties 기반 서브태스크 필터링
 * specialtyId가 없으면 전체 태스크 반환 (필터 없음)
 */
export function getFilteredPhases(specialtyId?: string): Phase[] {
  if (!specialtyId) return phases

  return phases.map(phase => ({
    ...phase,
    subtasks: phase.subtasks.filter(task =>
      !task.applicableSpecialties || task.applicableSpecialties.includes(specialtyId)
    ),
  }))
}

/**
 * costRange 우선 표시, 없으면 estimatedCost 사용
 * 범위 형식: "3,000~5,000만"
 */
export function getDisplayCost(task: SubTask): string | null {
  if (task.costRange) {
    const [min, max] = task.costRange
    if (min === 0 && max === 0) return null
    return `${min.toLocaleString()}~${max.toLocaleString()}만`
  }
  if (task.estimatedCost !== undefined && task.estimatedCost > 0) {
    return `~${task.estimatedCost.toLocaleString()}만`
  }
  return null
}

/**
 * 미충족 의존성 조회
 */
export function getUnmetDependencies(task: SubTask, completedTasks: string[]): SubTask[] {
  if (!task.dependencies || task.dependencies.length === 0) return []

  const unmet: SubTask[] = []
  for (const depId of task.dependencies) {
    if (!completedTasks.includes(depId)) {
      const dep = findSubtaskById(depId)
      if (dep) unmet.push(dep)
    }
  }
  return unmet
}

/**
 * 전체 phase에서 서브태스크 ID로 검색
 */
export function findSubtaskById(id: string): SubTask | undefined {
  for (const phase of phases) {
    const task = phase.subtasks.find(s => s.id === id)
    if (task) return task
  }
  return undefined
}

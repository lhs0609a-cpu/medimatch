export const READINESS_WEIGHTS = {
  taskCompletion: 0.4,   // 40%
  quizAverage: 0.4,      // 40%
  detailScore: 0.2,      // 20% (costs + memos)
} as const

export type ReadinessGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

export interface ReadinessGradeInfo {
  grade: ReadinessGrade
  label: string
  minScore: number
  color: string
}

export const READINESS_GRADES: ReadinessGradeInfo[] = [
  { grade: 'S', label: '완벽한 준비',  minScore: 95, color: '#FFD700' },
  { grade: 'A', label: '우수한 준비',  minScore: 85, color: '#22c55e' },
  { grade: 'B', label: '양호한 준비',  minScore: 70, color: '#3B82F6' },
  { grade: 'C', label: '보통 준비',    minScore: 55, color: '#F59E0B' },
  { grade: 'D', label: '부족한 준비',  minScore: 35, color: '#F97316' },
  { grade: 'F', label: '시작 단계',    minScore: 0,  color: '#EF4444' },
]

export function getReadinessGrade(score: number): ReadinessGradeInfo {
  for (const g of READINESS_GRADES) {
    if (score >= g.minScore) return g
  }
  return READINESS_GRADES[READINESS_GRADES.length - 1]
}

export function calculateReadiness(
  taskCompletionRate: number,   // 0-100
  quizAverageRate: number,      // 0-100
  detailRate: number,           // 0-100
): number {
  return Math.round(
    taskCompletionRate * READINESS_WEIGHTS.taskCompletion +
    quizAverageRate * READINESS_WEIGHTS.quizAverage +
    detailRate * READINESS_WEIGHTS.detailScore
  )
}

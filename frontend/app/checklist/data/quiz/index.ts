import type { QuizQuestion } from './types'
import { phase1Quiz } from './phase1-quiz'
import { phase2Quiz } from './phase2-quiz'
import { phase3Quiz } from './phase3-quiz'
import { phase4Quiz } from './phase4-quiz'
import { phase5Quiz } from './phase5-quiz'
import { phase6Quiz } from './phase6-quiz'
import { phase7Quiz } from './phase7-quiz'
import { phase8Quiz } from './phase8-quiz'
import { phase9Quiz } from './phase9-quiz'

const ALL_QUIZZES: Record<number, QuizQuestion[]> = {
  1: phase1Quiz,
  2: phase2Quiz,
  3: phase3Quiz,
  4: phase4Quiz,
  5: phase5Quiz,
  6: phase6Quiz,
  7: phase7Quiz,
  8: phase8Quiz,
  9: phase9Quiz,
}

export function getQuizzesByPhase(phaseId: number): QuizQuestion[] {
  return ALL_QUIZZES[phaseId] || []
}

export function getQuizzesForTask(taskId: string): QuizQuestion[] {
  const phaseId = parseInt(taskId.split('-')[0])
  return getQuizzesByPhase(phaseId).filter(q => q.taskId === taskId)
}

export function getAllQuizzes(): QuizQuestion[] {
  return Object.values(ALL_QUIZZES).flat()
}

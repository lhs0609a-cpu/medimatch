'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { phases } from '@/app/checklist/data/phases'
import { getQuizzesForTask } from '@/app/checklist/data/quiz'
import type { QuizQuestion, QuizResult } from '@/app/checklist/data/quiz/types'
import { XP_REWARDS, getLevelForXP, type LevelInfo } from '@/app/checklist/data/gamification/xp-levels'
import { ALL_ACHIEVEMENTS, type Achievement, type AchievementCondition } from '@/app/checklist/data/gamification/achievements'
import { calculateReadiness, getReadinessGrade, type ReadinessGradeInfo } from '@/app/checklist/data/gamification/readiness'

const STORAGE_KEY = 'medimatch_gamification'

export interface GamificationData {
  xp: number
  quizResults: Record<string, QuizResult>   // taskId → QuizResult
  unlockedAchievements: string[]            // achievement ids
  correctStreak: number
  maxCorrectStreak: number
  perfectCount: number                      // number of 2/2 quiz results
  loginDates: string[]                      // ISO date strings
  tasksCompletedByDate: Record<string, string[]> // date → taskIds
  initialized: boolean
}

const DEFAULT_DATA: GamificationData = {
  xp: 0,
  quizResults: {},
  unlockedAchievements: [],
  correctStreak: 0,
  maxCorrectStreak: 0,
  perfectCount: 0,
  loginDates: [],
  tasksCompletedByDate: {},
  initialized: false,
}

function loadData(): GamificationData {
  if (typeof window === 'undefined') return DEFAULT_DATA
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_DATA, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_DATA
}

function saveData(data: GamificationData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export interface GamificationHook {
  data: GamificationData
  level: LevelInfo
  readinessScore: number
  readinessGrade: ReadinessGradeInfo
  readinessBreakdown: { taskRate: number; quizRate: number; detailRate: number }

  // Quiz flow
  pendingQuizTaskId: string | null
  startQuiz: (taskId: string) => void
  dismissQuiz: () => void
  submitQuizAnswers: (taskId: string, answers: Record<string, string>) => {
    score: number
    xpGained: number
    newLevel: LevelInfo | null
    newAchievements: Achievement[]
  }

  // XP
  awardTaskXP: (taskId: string) => { xpGained: number; newLevel: LevelInfo | null; newAchievements: Achievement[] }
  awardMemoXP: (taskId: string) => void
  awardCostXP: (taskId: string) => void

  // Achievement
  getTaskQuizScore: (taskId: string) => number | null
  getPhaseQuizAverage: (phaseId: number) => number

  // Level up modal
  pendingLevelUp: LevelInfo | null
  dismissLevelUp: () => void

  // Achievement toast
  pendingAchievements: Achievement[]
  dismissAchievement: () => void
}

export function useGamification(
  completedTasks: string[],
  actualCosts: Record<string, number>,
  memos: Record<string, string>,
): GamificationHook {
  const [data, setData] = useState<GamificationData>(DEFAULT_DATA)
  const [pendingQuizTaskId, setPendingQuizTaskId] = useState<string | null>(null)
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelInfo | null>(null)
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([])
  const initRef = useRef(false)
  const xpAwardedRef = useRef<Set<string>>(new Set())

  // Load data on mount
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const loaded = loadData()

    // Track login date
    const today = todayStr()
    const loginDates = loaded.loginDates.includes(today)
      ? loaded.loginDates
      : [...loaded.loginDates, today]

    // First-time catchup: award task XP for already-completed tasks
    if (!loaded.initialized && completedTasks.length > 0) {
      const catchupXP = completedTasks.length * XP_REWARDS.TASK_COMPLETE
      // Also award phase completion XP
      let phaseXP = 0
      for (const phase of phases) {
        const allDone = phase.subtasks.every(s => completedTasks.includes(s.id))
        if (allDone) phaseXP += XP_REWARDS.PHASE_COMPLETE
      }
      const newData = {
        ...loaded,
        xp: loaded.xp + catchupXP + phaseXP,
        loginDates,
        initialized: true,
      }
      setData(newData)
      saveData(newData)
      return
    }

    const newData = { ...loaded, loginDates, initialized: true }
    setData(newData)
    saveData(newData)
  }, [completedTasks])

  // Helper: persist data
  const persist = useCallback((newData: GamificationData) => {
    setData(newData)
    saveData(newData)
  }, [])

  // Check achievements based on current state
  const checkAchievements = useCallback((currentData: GamificationData): Achievement[] => {
    const newAchievements: Achievement[] = []
    for (const ach of ALL_ACHIEVEMENTS) {
      if (currentData.unlockedAchievements.includes(ach.id)) continue
      if (evaluateCondition(ach.condition, currentData, completedTasks, memos)) {
        newAchievements.push(ach)
      }
    }
    return newAchievements
  }, [completedTasks, memos])

  // Award XP and check level up + achievements
  const awardXPInternal = useCallback((currentData: GamificationData, amount: number): {
    updatedData: GamificationData
    newLevel: LevelInfo | null
    newAchievements: Achievement[]
  } => {
    const oldLevel = getLevelForXP(currentData.xp)
    const newXP = currentData.xp + amount
    const newLevel = getLevelForXP(newXP)
    const leveledUp = newLevel.level > oldLevel.level ? newLevel : null

    let updatedData = { ...currentData, xp: newXP }

    // Check achievements
    const newAchievements = checkAchievements(updatedData)
    if (newAchievements.length > 0) {
      const achievementXP = newAchievements.length * XP_REWARDS.ACHIEVEMENT_UNLOCK
      updatedData = {
        ...updatedData,
        xp: updatedData.xp + achievementXP,
        unlockedAchievements: [
          ...updatedData.unlockedAchievements,
          ...newAchievements.map(a => a.id),
        ],
      }
    }

    return { updatedData, newLevel: leveledUp, newAchievements }
  }, [checkAchievements])

  const awardTaskXP = useCallback((taskId: string) => {
    if (xpAwardedRef.current.has(`task-${taskId}`)) {
      return { xpGained: 0, newLevel: null, newAchievements: [] as Achievement[] }
    }
    xpAwardedRef.current.add(`task-${taskId}`)

    let xpGained = XP_REWARDS.TASK_COMPLETE

    // Track today's completions
    const today = todayStr()
    const todayTasks = [...(data.tasksCompletedByDate[today] || []), taskId]
    let updatedData = {
      ...data,
      tasksCompletedByDate: { ...data.tasksCompletedByDate, [today]: todayTasks },
    }

    // Check phase completion
    for (const phase of phases) {
      const phaseTaskIds = phase.subtasks.map(s => s.id)
      if (!phaseTaskIds.includes(taskId)) continue
      const allDone = phaseTaskIds.every(id =>
        id === taskId || completedTasks.includes(id)
      )
      if (allDone) {
        xpGained += XP_REWARDS.PHASE_COMPLETE
      }
    }

    const { updatedData: finalData, newLevel, newAchievements } = awardXPInternal(updatedData, xpGained)
    persist(finalData)

    if (newLevel) setPendingLevelUp(newLevel)
    if (newAchievements.length > 0) {
      setPendingAchievements(prev => [...prev, ...newAchievements])
    }

    return { xpGained, newLevel, newAchievements }
  }, [data, completedTasks, awardXPInternal, persist])

  const awardMemoXP = useCallback((taskId: string) => {
    if (xpAwardedRef.current.has(`memo-${taskId}`)) return
    xpAwardedRef.current.add(`memo-${taskId}`)
    const { updatedData } = awardXPInternal(data, XP_REWARDS.MEMO_WRITTEN)
    persist(updatedData)
  }, [data, awardXPInternal, persist])

  const awardCostXP = useCallback((taskId: string) => {
    if (xpAwardedRef.current.has(`cost-${taskId}`)) return
    xpAwardedRef.current.add(`cost-${taskId}`)
    const { updatedData } = awardXPInternal(data, XP_REWARDS.COST_RECORDED)
    persist(updatedData)
  }, [data, awardXPInternal, persist])

  const startQuiz = useCallback((taskId: string) => {
    setPendingQuizTaskId(taskId)
  }, [])

  const dismissQuiz = useCallback(() => {
    setPendingQuizTaskId(null)
  }, [])

  const submitQuizAnswers = useCallback((taskId: string, answers: Record<string, string>) => {
    const questions = getQuizzesForTask(taskId)
    let correct = 0
    for (const q of questions) {
      if (answers[q.id] === q.correctId) correct++
    }
    const score = correct
    const isPerfect = correct === questions.length && questions.length > 0

    // Calculate XP
    let xpGained = correct * XP_REWARDS.QUIZ_CORRECT
    if (isPerfect) xpGained += XP_REWARDS.QUIZ_PERFECT

    // Update streak
    let newStreak = data.correctStreak
    let newMaxStreak = data.maxCorrectStreak
    for (const q of questions) {
      if (answers[q.id] === q.correctId) {
        newStreak++
        newMaxStreak = Math.max(newMaxStreak, newStreak)
      } else {
        newStreak = 0
      }
    }

    const newPerfectCount = isPerfect ? data.perfectCount + 1 : data.perfectCount

    // Keep best score
    const existingResult = data.quizResults[taskId]
    const newResult: QuizResult = {
      taskId,
      score,
      answeredAt: new Date().toISOString(),
      answers,
    }
    const bestResult = existingResult && existingResult.score >= score ? existingResult : newResult

    const updatedData = {
      ...data,
      quizResults: { ...data.quizResults, [taskId]: bestResult },
      correctStreak: newStreak,
      maxCorrectStreak: newMaxStreak,
      perfectCount: newPerfectCount,
    }

    const { updatedData: finalData, newLevel, newAchievements } = awardXPInternal(updatedData, xpGained)
    persist(finalData)
    setPendingQuizTaskId(null)

    if (newLevel) setPendingLevelUp(newLevel)
    if (newAchievements.length > 0) {
      setPendingAchievements(prev => [...prev, ...newAchievements])
    }

    return { score, xpGained, newLevel, newAchievements }
  }, [data, awardXPInternal, persist])

  const getTaskQuizScore = useCallback((taskId: string): number | null => {
    const result = data.quizResults[taskId]
    return result ? result.score : null
  }, [data.quizResults])

  const getPhaseQuizAverage = useCallback((phaseId: number): number => {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return 0
    let totalScore = 0
    let totalQuestions = 0
    for (const task of phase.subtasks) {
      const result = data.quizResults[task.id]
      const questions = getQuizzesForTask(task.id)
      if (result && questions.length > 0) {
        totalScore += result.score
        totalQuestions += questions.length
      }
    }
    return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
  }, [data.quizResults])

  const dismissLevelUp = useCallback(() => setPendingLevelUp(null), [])
  const dismissAchievement = useCallback(() => {
    setPendingAchievements(prev => prev.slice(1))
  }, [])

  // Calculate readiness
  const totalTasks = phases.reduce((s, p) => s + p.subtasks.length, 0)
  const taskRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

  const allTaskIds = phases.flatMap(p => p.subtasks.map(s => s.id))
  let quizTotal = 0
  let quizCorrect = 0
  for (const tid of allTaskIds) {
    const questions = getQuizzesForTask(tid)
    if (questions.length > 0 && data.quizResults[tid]) {
      quizTotal += questions.length
      quizCorrect += data.quizResults[tid].score
    }
  }
  const quizRate = quizTotal > 0 ? (quizCorrect / quizTotal) * 100 : 0

  const costCount = Object.keys(actualCosts).filter(k => actualCosts[k] > 0).length
  const memoCount = Object.keys(memos).filter(k => memos[k]?.trim()).length
  const detailRate = totalTasks > 0 ? ((costCount + memoCount) / (totalTasks * 2)) * 100 : 0

  const readinessScore = calculateReadiness(taskRate, quizRate, detailRate)
  const readinessGrade = getReadinessGrade(readinessScore)
  const level = getLevelForXP(data.xp)

  return {
    data,
    level,
    readinessScore,
    readinessGrade,
    readinessBreakdown: { taskRate, quizRate, detailRate },
    pendingQuizTaskId,
    startQuiz,
    dismissQuiz,
    submitQuizAnswers,
    awardTaskXP,
    awardMemoXP,
    awardCostXP,
    getTaskQuizScore,
    getPhaseQuizAverage,
    pendingLevelUp,
    dismissLevelUp,
    pendingAchievements,
    dismissAchievement,
  }
}

// Achievement condition evaluator
function evaluateCondition(
  cond: AchievementCondition,
  data: GamificationData,
  completedTasks: string[],
  memos: Record<string, string>,
): boolean {
  switch (cond.type) {
    case 'phase_complete': {
      const phase = phases.find(p => p.id === cond.phaseId)
      if (!phase) return false
      return phase.subtasks.every(s => completedTasks.includes(s.id))
    }
    case 'phase_quiz_score': {
      const phase = phases.find(p => p.id === cond.phaseId)
      if (!phase) return false
      // All tasks must be completed first
      if (!phase.subtasks.every(s => completedTasks.includes(s.id))) return false
      // Check quiz average
      let total = 0, correct = 0
      for (const task of phase.subtasks) {
        const questions = getQuizzesForTask(task.id)
        const result = data.quizResults[task.id]
        if (questions.length === 0) continue
        if (!result) return false  // must have attempted all quizzes
        total += questions.length
        correct += result.score
      }
      if (total === 0) return false
      const avg = (correct / total) * 100
      if (avg < cond.minPercent) return false
      // Check memo requirement
      if (cond.requireMemo) {
        return phase.subtasks.every(s => memos[s.id]?.trim())
      }
      return true
    }
    case 'quiz_perfect_count':
      return data.perfectCount >= cond.count
    case 'quiz_streak':
      return data.maxCorrectStreak >= cond.count
    case 'cost_records': {
      // Count from tasksCompletedByDate is tricky — use simpler proxy
      return false // evaluated externally if needed
    }
    case 'memo_records': {
      const memoCount = Object.values(memos).filter(m => m?.trim()).length
      return memoCount >= cond.count
    }
    case 'login_streak': {
      const dates = [...data.loginDates].sort()
      if (dates.length < cond.days) return false
      let maxStreak = 1, currentStreak = 1
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1])
        const curr = new Date(dates[i])
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else if (diffDays > 1) {
          currentStreak = 1
        }
      }
      return maxStreak >= cond.days
    }
    case 'tasks_in_day': {
      for (const tasks of Object.values(data.tasksCompletedByDate)) {
        if (tasks.length >= cond.count) return true
      }
      return false
    }
    case 'early_start': {
      // Would need targetDate — skip for now
      return false
    }
    default:
      return false
  }
}

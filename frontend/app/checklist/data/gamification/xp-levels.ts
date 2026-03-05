export interface LevelInfo {
  level: number
  title: string
  requiredXP: number
}

export const LEVELS: LevelInfo[] = [
  { level: 1,  title: '개원 새싹',          requiredXP: 0 },
  { level: 2,  title: '개원 탐색자',        requiredXP: 200 },
  { level: 3,  title: '개원 학습자',        requiredXP: 500 },
  { level: 4,  title: '개원 계획자',        requiredXP: 1000 },
  { level: 5,  title: '개원 실행자',        requiredXP: 1800 },
  { level: 6,  title: '개원 전문가',        requiredXP: 2800 },
  { level: 7,  title: '개원 달인',          requiredXP: 4000 },
  { level: 8,  title: '개원 마스터',        requiredXP: 5500 },
  { level: 9,  title: '개원 그랜드마스터',  requiredXP: 7500 },
  { level: 10, title: '개원의 전설',        requiredXP: 10000 },
]

export const XP_REWARDS = {
  TASK_COMPLETE: 50,
  QUIZ_CORRECT: 30,
  QUIZ_PERFECT: 100,      // 2/2 bonus
  MEMO_WRITTEN: 15,
  COST_RECORDED: 20,
  PHASE_COMPLETE: 200,
  ACHIEVEMENT_UNLOCK: 150,
} as const

export function getLevelForXP(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].requiredXP) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): LevelInfo | null {
  const idx = LEVELS.findIndex(l => l.level === currentLevel)
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
}

export function getXPProgress(xp: number): { current: number; next: number; percent: number } {
  const level = getLevelForXP(xp)
  const next = getNextLevel(level.level)
  if (!next) return { current: xp, next: xp, percent: 100 }
  const range = next.requiredXP - level.requiredXP
  const progress = xp - level.requiredXP
  return { current: progress, next: range, percent: Math.round((progress / range) * 100) }
}

export type AchievementTier = 'bronze' | 'silver' | 'gold'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string // emoji
  tier: AchievementTier
  category: 'phase' | 'quiz' | 'participation' | 'special'
  condition: AchievementCondition
}

export type AchievementCondition =
  | { type: 'phase_complete'; phaseId: number }
  | { type: 'phase_quiz_score'; phaseId: number; minPercent: number; requireMemo?: boolean }
  | { type: 'quiz_perfect_count'; count: number }
  | { type: 'quiz_streak'; count: number }
  | { type: 'cost_records'; count: number }
  | { type: 'memo_records'; count: number }
  | { type: 'login_streak'; days: number }
  | { type: 'tasks_in_day'; count: number }
  | { type: 'early_start'; daysBeforeDDay: number }

const phaseNames = [
  '', '사업계획', '입지선정', '인허가', '인테리어',
  '의료장비', '인력채용', '마케팅', '개원오픈',
]

function phaseAchievements(phaseId: number): Achievement[] {
  const name = phaseNames[phaseId]
  return [
    {
      id: `phase-${phaseId}-bronze`,
      name: `${name} 완료`,
      description: `Phase ${phaseId} 전체 태스크 완료`,
      icon: '🏅',
      tier: 'bronze',
      category: 'phase',
      condition: { type: 'phase_complete', phaseId },
    },
    {
      id: `phase-${phaseId}-silver`,
      name: `${name} 이해도 70%`,
      description: `Phase ${phaseId} 퀴즈 평균 70% 이상`,
      icon: '🥈',
      tier: 'silver',
      category: 'phase',
      condition: { type: 'phase_quiz_score', phaseId, minPercent: 70 },
    },
    {
      id: `phase-${phaseId}-gold`,
      name: `${name} 마스터`,
      description: `Phase ${phaseId} 퀴즈 90%+ & 메모 완성`,
      icon: '🥇',
      tier: 'gold',
      category: 'phase',
      condition: { type: 'phase_quiz_score', phaseId, minPercent: 90, requireMemo: true },
    },
  ]
}

const PHASE_ACHIEVEMENTS: Achievement[] = Array.from({ length: 8 }, (_, i) =>
  phaseAchievements(i + 1)
).flat()

const QUIZ_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'quiz-perfect-3',
    name: '완벽한 이해',
    description: '퀴즈 만점 3회 달성',
    icon: '💯',
    tier: 'bronze',
    category: 'quiz',
    condition: { type: 'quiz_perfect_count', count: 3 },
  },
  {
    id: 'quiz-perfect-10',
    name: '퀴즈 천재',
    description: '퀴즈 만점 10회 달성',
    icon: '🧠',
    tier: 'silver',
    category: 'quiz',
    condition: { type: 'quiz_perfect_count', count: 10 },
  },
  {
    id: 'quiz-perfect-30',
    name: '개원 박사',
    description: '퀴즈 만점 30회 달성',
    icon: '🎓',
    tier: 'gold',
    category: 'quiz',
    condition: { type: 'quiz_perfect_count', count: 30 },
  },
  {
    id: 'quiz-streak-5',
    name: '연속 정답왕',
    description: '5문제 연속 정답',
    icon: '🔥',
    tier: 'bronze',
    category: 'quiz',
    condition: { type: 'quiz_streak', count: 5 },
  },
  {
    id: 'quiz-streak-15',
    name: '불꽃 연속 정답',
    description: '15문제 연속 정답',
    icon: '⚡',
    tier: 'silver',
    category: 'quiz',
    condition: { type: 'quiz_streak', count: 15 },
  },
  {
    id: 'quiz-streak-30',
    name: '무적 연속 정답',
    description: '30문제 연속 정답',
    icon: '💎',
    tier: 'gold',
    category: 'quiz',
    condition: { type: 'quiz_streak', count: 30 },
  },
]

const PARTICIPATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'cost-5',
    name: '예산 관리 시작',
    description: '비용 기록 5개 작성',
    icon: '💰',
    tier: 'bronze',
    category: 'participation',
    condition: { type: 'cost_records', count: 5 },
  },
  {
    id: 'cost-20',
    name: '꼼꼼한 예산관리자',
    description: '비용 기록 20개 작성',
    icon: '📊',
    tier: 'silver',
    category: 'participation',
    condition: { type: 'cost_records', count: 20 },
  },
  {
    id: 'memo-5',
    name: '기록의 시작',
    description: '메모 5개 작성',
    icon: '📝',
    tier: 'bronze',
    category: 'participation',
    condition: { type: 'memo_records', count: 5 },
  },
  {
    id: 'memo-20',
    name: '성실한 기록자',
    description: '메모 20개 작성',
    icon: '📓',
    tier: 'silver',
    category: 'participation',
    condition: { type: 'memo_records', count: 20 },
  },
  {
    id: 'login-3',
    name: '꾸준한 시작',
    description: '3일 연속 접속',
    icon: '📅',
    tier: 'bronze',
    category: 'participation',
    condition: { type: 'login_streak', days: 3 },
  },
  {
    id: 'login-7',
    name: '매일 열심히',
    description: '7일 연속 접속',
    icon: '🗓️',
    tier: 'silver',
    category: 'participation',
    condition: { type: 'login_streak', days: 7 },
  },
]

const SPECIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'speed-runner',
    name: '스피드러너',
    description: '하루에 5개 이상 태스크 완료',
    icon: '🏃',
    tier: 'silver',
    category: 'special',
    condition: { type: 'tasks_in_day', count: 5 },
  },
  {
    id: 'early-bird',
    name: '앞서가는 준비생',
    description: 'D-Day 180일 전 시작',
    icon: '🦅',
    tier: 'gold',
    category: 'special',
    condition: { type: 'early_start', daysBeforeDDay: 180 },
  },
]

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...PHASE_ACHIEVEMENTS,
  ...QUIZ_ACHIEVEMENTS,
  ...PARTICIPATION_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
]

export const TIER_COLORS: Record<AchievementTier, { bg: string; border: string; text: string }> = {
  bronze: { bg: 'bg-amber-100 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400' },
  silver: { bg: 'bg-slate-100 dark:bg-slate-800/40', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-300' },
  gold:   { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-400 dark:border-yellow-600', text: 'text-yellow-700 dark:text-yellow-400' },
}

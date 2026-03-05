export type QuizType = 'multiple_choice' | 'ox' | 'scenario'

export interface QuizChoice {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string           // e.g. 'q-1-1-a'
  taskId: string       // e.g. '1-1'
  type: QuizType
  question: string
  choices: QuizChoice[]
  correctId: string    // choice id
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizResult {
  taskId: string
  score: number        // 0-2 (per-task: 2 questions)
  answeredAt: string   // ISO date
  answers: Record<string, string> // questionId → chosenId
}

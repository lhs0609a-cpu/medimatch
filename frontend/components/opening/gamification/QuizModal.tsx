'use client'

import { useState, useEffect } from 'react'
import { X, Check, XCircle, ChevronRight, RotateCcw, Zap, Brain, HelpCircle } from 'lucide-react'
import { getQuizzesForTask } from '@/app/checklist/data/quiz'
import type { QuizQuestion } from '@/app/checklist/data/quiz/types'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizModalProps {
  taskId: string
  taskTitle: string
  onSubmit: (taskId: string, answers: Record<string, string>) => {
    score: number
    xpGained: number
  }
  onClose: () => void
  previousScore?: number | null
}

type QuizStage = 'question' | 'feedback' | 'result'

export default function QuizModal({ taskId, taskTitle, onSubmit, onClose, previousScore }: QuizModalProps) {
  const questions = getQuizzesForTask(taskId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stage, setStage] = useState<QuizStage>('question')
  const [result, setResult] = useState<{ score: number; xpGained: number } | null>(null)

  const currentQ = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  if (questions.length === 0) return null

  const handleSelect = (choiceId: string) => {
    if (stage !== 'question') return
    setSelectedId(choiceId)
  }

  const handleConfirm = () => {
    if (!selectedId || !currentQ) return
    const newAnswers = { ...answers, [currentQ.id]: selectedId }
    setAnswers(newAnswers)
    setStage('feedback')
  }

  const handleNext = () => {
    if (isLast) {
      // Submit all answers
      const finalAnswers = { ...answers, [currentQ.id]: selectedId! }
      const res = onSubmit(taskId, finalAnswers)
      setResult(res)
      setStage('result')
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedId(null)
      setStage('question')
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setAnswers({})
    setSelectedId(null)
    setStage('question')
    setResult(null)
  }

  const isCorrect = selectedId === currentQ?.correctId

  const typeIcon = currentQ?.type === 'ox' ? '⭕❌' : currentQ?.type === 'scenario' ? '📋' : '📝'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="relative bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl px-5 py-4 border-b border-border/50 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">이해도 퀴즈</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{taskTitle}</p>
          {stage !== 'result' && (
            <div className="flex gap-1.5 mt-3">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < currentIndex ? 'bg-primary' :
                    i === currentIndex ? 'bg-primary/50' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {stage === 'result' && result ? (
              /* Result Screen */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 ${
                  result.score === questions.length
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : result.score > 0
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <span className="text-4xl">
                    {result.score === questions.length ? '🎉' : result.score > 0 ? '👍' : '💪'}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1">
                  {result.score === questions.length ? '완벽합니다!' :
                   result.score > 0 ? '잘했어요!' : '다시 도전해보세요!'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {questions.length}문제 중 {result.score}문제 정답
                </p>

                {/* Score visual */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      result.score === questions.length ? 'text-green-500' :
                      result.score > 0 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {result.score}/{questions.length}
                    </div>
                    <div className="text-xs text-muted-foreground">정답</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary flex items-center gap-1">
                      <Zap className="w-5 h-5" />
                      +{result.xpGained}
                    </div>
                    <div className="text-xs text-muted-foreground">XP 획득</div>
                  </div>
                </div>

                {previousScore !== null && previousScore !== undefined && (
                  <p className="text-xs text-muted-foreground mb-4">
                    이전 최고 점수: {previousScore}/{questions.length}
                  </p>
                )}

                <div className="flex gap-2">
                  {result.score < questions.length && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      다시 풀기
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    계속하기
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Question / Feedback Screen */
              <motion.div
                key={`q-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Question type badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{typeIcon}</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {currentQ.type === 'ox' ? 'OX 퀴즈' : currentQ.type === 'scenario' ? '시나리오' : '객관식'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {currentIndex + 1} / {questions.length}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="text-base font-semibold mb-4 leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Choices */}
                <div className="space-y-2 mb-4">
                  {currentQ.choices.map((choice) => {
                    const isSelected = selectedId === choice.id
                    const showFeedback = stage === 'feedback'
                    const isAnswer = choice.id === currentQ.correctId

                    let borderColor = 'border-border hover:border-primary/50'
                    let bgColor = ''
                    if (isSelected && !showFeedback) {
                      borderColor = 'border-primary ring-2 ring-primary/20'
                      bgColor = 'bg-primary/5'
                    } else if (showFeedback && isAnswer) {
                      borderColor = 'border-green-500 ring-2 ring-green-500/20'
                      bgColor = 'bg-green-50 dark:bg-green-900/10'
                    } else if (showFeedback && isSelected && !isAnswer) {
                      borderColor = 'border-red-500 ring-2 ring-red-500/20'
                      bgColor = 'bg-red-50 dark:bg-red-900/10'
                    }

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleSelect(choice.id)}
                        disabled={stage === 'feedback'}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${borderColor} ${bgColor} disabled:cursor-default`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            showFeedback && isAnswer
                              ? 'bg-green-500 text-white'
                              : showFeedback && isSelected && !isAnswer
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-secondary text-muted-foreground'
                          }`}>
                            {showFeedback && isAnswer ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : showFeedback && isSelected && !isAnswer ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              choice.id.toUpperCase()
                            )}
                          </div>
                          <span className="text-sm">{choice.text}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Feedback / Explanation */}
                {stage === 'feedback' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl mb-4 ${
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isCorrect ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400">정답입니다! +{30} XP</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">아쉽네요!</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  </motion.div>
                )}

                {/* Action Button */}
                {stage === 'question' ? (
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className="w-full py-3 rounded-xl font-medium text-sm bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    확인
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl font-medium text-sm bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLast ? '결과 보기' : '다음 문제'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Skip */}
                {stage === 'question' && (
                  <button
                    onClick={onClose}
                    className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    건너뛰기
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

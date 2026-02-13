'use client'

import { Check } from 'lucide-react'
import { GradeType, gradeLabels, calculateCosts } from '../data/rates'

interface BudgetComparisonProps {
  area: number
  specialtyId: string
  selectedGrade: GradeType
  onGradeChange: (grade: GradeType) => void
}

const grades: GradeType[] = ['budget', 'standard', 'premium']

export default function BudgetComparison({ area, specialtyId, selectedGrade, onGradeChange }: BudgetComparisonProps) {
  const formatCost = (cost: number) => {
    if (cost >= 10000) return `${(cost / 10000).toFixed(1)}억`
    return `${cost.toLocaleString()}만`
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-foreground mb-4">등급별 비교</h3>
      <div className="grid grid-cols-3 gap-3">
        {grades.map((grade) => {
          const info = gradeLabels[grade]
          const costs = calculateCosts(area, specialtyId, grade)
          const isSelected = selectedGrade === grade

          return (
            <button
              key={grade}
              onClick={() => onGradeChange(grade)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-transparent bg-muted/50 hover:border-muted-foreground/20'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {grade === 'standard' && (
                <span className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 bg-primary text-white rounded-full">
                  추천
                </span>
              )}
              <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: info.color }} />
              <p className="font-semibold text-foreground text-sm">{info.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
              <p className="text-lg font-bold mt-3" style={{ color: info.color }}>
                {formatCost(costs.total)}원
              </p>
              <p className="text-xs text-muted-foreground">
                평당 {formatCost(area > 0 ? Math.round(costs.total / area) : 0)}원
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

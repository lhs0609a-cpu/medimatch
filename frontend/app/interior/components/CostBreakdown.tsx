'use client'

import { costCategories, GradeType, specialtyConfigs } from '../data/rates'

interface CostBreakdownProps {
  area: number
  specialtyId: string
  grade: GradeType
  categories: { name: string; cost: number }[]
  extraCosts: { name: string; cost: number }[]
  total: number
}

export default function CostBreakdown({ area, specialtyId, grade, categories, extraCosts, total }: CostBreakdownProps) {
  const specialty = specialtyConfigs.find((s) => s.id === specialtyId)

  const formatCost = (cost: number) => {
    if (cost >= 10000) return `${(cost / 10000).toFixed(1)}억원`
    return `${cost.toLocaleString()}만원`
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-foreground">상세 비용 내역</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {specialty?.name} · {area}평 · {grade === 'budget' ? '예산형' : grade === 'standard' ? '표준형' : '프리미엄'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left p-3 font-medium text-muted-foreground">공사 항목</th>
              <th className="text-right p-3 font-medium text-muted-foreground">평당 단가</th>
              <th className="text-right p-3 font-medium text-muted-foreground">소계</th>
              <th className="text-right p-3 font-medium text-muted-foreground">비중</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => {
              const rateKey = grade === 'budget' ? 'budgetRate' : grade === 'standard' ? 'standardRate' : 'premiumRate'
              const rate = costCategories[i]?.[rateKey] || 0
              const ratio = total > 0 ? ((cat.cost / total) * 100).toFixed(1) : '0'

              return (
                <tr key={cat.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground">{cat.name}</td>
                  <td className="p-3 text-right text-muted-foreground">{rate.toLocaleString()}만원</td>
                  <td className="p-3 text-right font-medium text-foreground">{formatCost(cat.cost)}</td>
                  <td className="p-3 text-right text-muted-foreground">{ratio}%</td>
                </tr>
              )
            })}

            {extraCosts.length > 0 && (
              <>
                <tr>
                  <td colSpan={4} className="p-3 text-xs font-medium text-muted-foreground bg-muted/30">
                    진료과 특수 공사
                  </td>
                </tr>
                {extraCosts.map((ec) => {
                  const ratio = total > 0 ? ((ec.cost / total) * 100).toFixed(1) : '0'
                  return (
                    <tr key={ec.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{ec.name}</td>
                      <td className="p-3 text-right text-muted-foreground">-</td>
                      <td className="p-3 text-right font-medium text-foreground">{formatCost(ec.cost)}</td>
                      <td className="p-3 text-right text-muted-foreground">{ratio}%</td>
                    </tr>
                  )
                })}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 font-bold">
              <td className="p-3 text-foreground" colSpan={2}>합계</td>
              <td className="p-3 text-right text-primary text-lg">{formatCost(total)}</td>
              <td className="p-3 text-right text-muted-foreground">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Special notes */}
      {specialty && specialty.specialNotes.length > 0 && (
        <div className="p-4 border-t bg-amber-50 dark:bg-amber-950/10">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            {specialty.name} 유의사항
          </p>
          <ul className="space-y-1">
            {specialty.specialNotes.map((note, i) => (
              <li key={i} className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1.5">
                <span className="mt-1">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

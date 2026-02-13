'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Ruler, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { specialtyConfigs, calculateCosts, GradeType } from './data/rates'
import CostBreakdown from './components/CostBreakdown'
import BudgetComparison from './components/BudgetComparison'
import CostChart from './components/CostChart'

export default function InteriorPage() {
  const [specialtyId, setSpecialtyId] = useState('internal')
  const [area, setArea] = useState(35)
  const [grade, setGrade] = useState<GradeType>('standard')

  const specialty = specialtyConfigs.find((s) => s.id === specialtyId)

  const handleSpecialtyChange = (id: string) => {
    const sp = specialtyConfigs.find((s) => s.id === id)
    if (sp) {
      setSpecialtyId(id)
      setArea(sp.recommendedArea)
    }
  }

  const costs = useMemo(() => calculateCosts(area, specialtyId, grade), [area, specialtyId, grade])

  const formatCost = (cost: number) => {
    if (cost >= 10000) return `${(cost / 10000).toFixed(1)}억원`
    return `${cost.toLocaleString()}만원`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Ruler className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">인테리어 견적</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Input section */}
        <div className="card p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Specialty */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">진료과 선택</label>
              <div className="flex flex-wrap gap-2">
                {specialtyConfigs.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => handleSpecialtyChange(sp.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      specialtyId === sp.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>
              {specialty && (
                <p className="text-xs text-muted-foreground mt-2">
                  권장 평수: {specialty.minArea}~{specialty.maxArea}평 (추천 {specialty.recommendedArea}평)
                </p>
              )}
            </div>

            {/* Area */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">면적 (평)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setArea(Math.max(10, area - 5))}
                  className="btn-secondary w-10 h-10 rounded-lg flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <button
                  onClick={() => setArea(Math.min(100, area + 5))}
                  className="btn-secondary w-10 h-10 rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="text-center min-w-[60px]">
                  <span className="text-2xl font-bold text-primary">{area}</span>
                  <span className="text-sm text-muted-foreground ml-1">평</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {Math.round(area * 3.3058)}㎡
              </p>
            </div>
          </div>
        </div>

        {/* Total summary */}
        <div className="card p-5 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">예상 총 비용</p>
              <p className="text-3xl font-bold text-primary">{formatCost(costs.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">평당 비용</p>
              <p className="text-xl font-bold text-foreground">
                {area > 0 ? formatCost(Math.round(costs.total / area)) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Budget comparison */}
        <BudgetComparison
          area={area}
          specialtyId={specialtyId}
          selectedGrade={grade}
          onGradeChange={setGrade}
        />

        {/* Details */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <CostBreakdown
              area={area}
              specialtyId={specialtyId}
              grade={grade}
              categories={costs.categories}
              extraCosts={costs.extraCosts}
              total={costs.total}
            />
          </div>
          <div>
            <CostChart categories={costs.categories} extraCosts={costs.extraCosts} />
          </div>
        </div>
      </main>
    </div>
  )
}

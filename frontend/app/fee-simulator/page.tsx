'use client'

import { useState } from 'react'
import { ArrowLeft, Calculator, Search } from 'lucide-react'
import Link from 'next/link'
import { specialties } from './data/fees'
import FeeTable from './components/FeeTable'
import RevenueCalc from './components/RevenueCalc'
import ComparisonChart from './components/ComparisonChart'

const categories = ['all', '초진', '재진', '처치', '검사', '비보험'] as const

export default function FeeSimulatorPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0].id)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dailyPatients, setDailyPatients] = useState(specialties[0].avgDailyPatients)
  const [nonInsuranceRatio, setNonInsuranceRatio] = useState(specialties[0].avgNonInsuranceRatio)
  const [workingDays, setWorkingDays] = useState(22)
  const [showComparison, setShowComparison] = useState(false)

  const specialty = specialties.find((s) => s.id === selectedSpecialty) || specialties[0]

  const handleSpecialtyChange = (id: string) => {
    const sp = specialties.find((s) => s.id === id)
    if (sp) {
      setSelectedSpecialty(id)
      setDailyPatients(sp.avgDailyPatients)
      setNonInsuranceRatio(sp.avgNonInsuranceRatio)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Calculator className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">수가 시뮬레이터</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Specialty selector */}
        <div className="card p-4 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">진료과 선택</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((sp) => (
              <button
                key={sp.id}
                onClick={() => handleSpecialtyChange(sp.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSpecialty === sp.id
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                style={selectedSpecialty === sp.id ? { backgroundColor: sp.color } : undefined}
              >
                {sp.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Fee table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat === 'all' ? '전체' : cat}
                </button>
              ))}
            </div>

            <FeeTable specialty={specialty} filter={categoryFilter} />

            {/* Comparison toggle */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="btn-secondary w-full py-3 rounded-lg text-sm font-medium"
            >
              {showComparison ? '비교 차트 숨기기' : '진료과별 매출 비교 보기'}
            </button>

            {showComparison && <ComparisonChart selectedSpecialtyId={selectedSpecialty} />}
          </div>

          {/* Right: Revenue calc */}
          <div>
            <RevenueCalc
              specialty={specialty}
              dailyPatients={dailyPatients}
              nonInsuranceRatio={nonInsuranceRatio}
              workingDays={workingDays}
              onDailyPatientsChange={setDailyPatients}
              onNonInsuranceRatioChange={setNonInsuranceRatio}
              onWorkingDaysChange={setWorkingDays}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

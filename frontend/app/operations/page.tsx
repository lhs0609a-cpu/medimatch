'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, BarChart3, Plus, Download, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { MonthlyRecord, ForecastData, demoRecords, demoForecasts, STORAGE_KEY } from './data/seed'
import KPICards from './components/KPICards'
import MonthlyInput from './components/MonthlyInput'
import TrendChart from './components/TrendChart'
import GapAnalysis from './components/GapAnalysis'

export default function OperationsPage() {
  const [records, setRecords] = useState<MonthlyRecord[]>([])
  const [forecasts] = useState<ForecastData[]>(demoForecasts)
  const [showInput, setShowInput] = useState(false)
  const [useDemo, setUseDemo] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setRecords(JSON.parse(saved))
      } catch {}
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded && !useDemo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    }
  }, [records, loaded, useDemo])

  const handleSave = (record: MonthlyRecord) => {
    setRecords((prev) => {
      const existing = prev.findIndex((r) => r.month === record.month)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = record
        return updated.sort((a, b) => a.month.localeCompare(b.month))
      }
      return [...prev, record].sort((a, b) => a.month.localeCompare(b.month))
    })
    setShowInput(false)
  }

  const handleLoadDemo = () => {
    setRecords(demoRecords)
    setUseDemo(true)
  }

  const handleClear = () => {
    if (confirm('모든 실적 데이터를 삭제하시겠습니까?')) {
      setRecords([])
      setUseDemo(false)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const displayRecords = records

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">개원 후 대시보드</h1>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button onClick={handleClear} className="btn-ghost p-2 rounded-lg text-muted-foreground hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowInput(true)}
              className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 실적 입력
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Empty state */}
        {displayRecords.length === 0 && !showInput && (
          <div className="card p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">아직 실적 데이터가 없습니다</h2>
            <p className="text-muted-foreground mb-6">
              월별 실적을 입력하면 시뮬레이션 예측과 비교 분석할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setShowInput(true)} className="btn-primary px-6 py-2.5 rounded-lg flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> 실적 입력하기
              </button>
              <button onClick={handleLoadDemo} className="btn-secondary px-6 py-2.5 rounded-lg">
                데모 데이터로 체험
              </button>
            </div>
          </div>
        )}

        {/* Input form */}
        {showInput && (
          <div className="mb-6">
            <MonthlyInput onSave={handleSave} onClose={() => setShowInput(false)} />
          </div>
        )}

        {/* Dashboard */}
        {displayRecords.length > 0 && (
          <div className="space-y-6">
            {useDemo && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400 text-center">
                데모 데이터로 보고 있습니다. 실제 실적을 입력하면 더 정확한 분석이 가능합니다.
              </div>
            )}

            <KPICards records={displayRecords} />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrendChart records={displayRecords} forecasts={forecasts} />
              </div>
              <div>
                <GapAnalysis records={displayRecords} forecasts={forecasts} />
              </div>
            </div>

            {/* Records table */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-foreground">월별 실적 기록</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">월</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">매출</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">환자수</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">신규</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">지출</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">영업이익</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRecords.map((r) => (
                      <tr key={r.month} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="p-3 font-medium">{r.month}</td>
                        <td className="p-3 text-right">{r.revenue.toLocaleString()}만</td>
                        <td className="p-3 text-right">{r.patients.toLocaleString()}명</td>
                        <td className="p-3 text-right">{r.newPatients.toLocaleString()}명</td>
                        <td className="p-3 text-right">{r.expenses.toLocaleString()}만</td>
                        <td className={`p-3 text-right font-medium ${
                          r.revenue - r.expenses >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {(r.revenue - r.expenses).toLocaleString()}만
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

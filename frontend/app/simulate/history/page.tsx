'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, BarChart3, Calendar, MapPin, Building2,
  TrendingUp, Eye, Trash2, ChevronRight, Search
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

interface SimulationHistory {
  id: string
  title: string
  region: string
  specialty: string
  score: number
  created_at: string
  status: 'completed' | 'processing' | 'failed'
}

export default function SimulationHistoryPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [histories, setHistories] = useState<SimulationHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      fetchHistories()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchHistories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/simulations/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistories(data.items || [])
      }
    } catch (err) {
      console.error('Failed to fetch simulation history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    if (score >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
    return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mypage" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">시뮬레이션 내역</span>
              </div>
            </div>
            <Link href="/simulate" className="btn-primary">
              새 시뮬레이션
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {histories.length === 0 ? (
          /* Empty State */
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              아직 시뮬레이션 내역이 없습니다
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              개원 시뮬레이션을 실행하고 예상 수익과 경쟁 분석 결과를 확인해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/simulate" className="btn-primary">
                <TrendingUp className="w-4 h-4" />
                시뮬레이션 시작하기
              </Link>
              <Link href="/prospects" className="btn-secondary">
                <Search className="w-4 h-4" />
                개원 입지 탐색
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left">
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">수익 예측</h3>
                <p className="text-sm text-muted-foreground">
                  AI 기반 월 예상 매출과 순이익을 분석합니다
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">경쟁 분석</h3>
                <p className="text-sm text-muted-foreground">
                  반경 내 경쟁 병원 현황을 파악합니다
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">입지 점수</h3>
                <p className="text-sm text-muted-foreground">
                  유동인구, 접근성 등 입지 적합도를 평가합니다
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* History List */
          <div className="space-y-4">
            {histories.map((history) => (
              <Link
                key={history.id}
                href={`/simulate/${history.id}`}
                className="card p-6 block hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {history.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {history.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {history.specialty}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${getScoreColor(history.score)}`}>
                    {history.score}점
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(history.created_at)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-primary font-medium">
                    상세 보기
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

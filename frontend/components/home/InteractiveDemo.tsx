'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BarChart3, CheckCircle2, MapPin, Zap } from 'lucide-react'
import { fadeInUp, viewportConfig } from '@/components/animation/MotionWrapper'

export function InteractiveDemo() {
  const [demoAddress, setDemoAddress] = useState('')
  const [demoSpecialty, setDemoSpecialty] = useState('내과')
  const [showDemoResult, setShowDemoResult] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoResults, setDemoResults] = useState({
    monthlyRevenue: '1.2억 ~ 1.8억',
    breakEven: '14개월',
    competitors: 12,
    population: '32,450명',
    score: 78,
  })

  const runDemo = async () => {
    if (!demoAddress) return
    setDemoLoading(true)
    setShowDemoResult(false)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.medimatch.kr/api/v1'
    try {
      const res = await fetch(`${apiUrl}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: demoAddress, clinic_type: demoSpecialty }),
      })
      if (res.ok) {
        const data = await res.json()
        const minRev = Math.round((data.estimated_monthly_revenue?.min || 0) / 100000000 * 10) / 10
        const maxRev = Math.round((data.estimated_monthly_revenue?.max || 0) / 100000000 * 10) / 10
        setDemoResults({
          monthlyRevenue: `${minRev}억 ~ ${maxRev}억`,
          breakEven: `${data.profitability?.breakeven_months || 14}개월`,
          competitors: data.competition?.same_dept_count || 0,
          population: `${(data.demographics?.population_1km || 0).toLocaleString()}명`,
          score: data.confidence_score || 78,
        })
      }
    } catch {
      // API 실패 시 기본 fallback 값 유지
    } finally {
      setDemoLoading(false)
      setShowDemoResult(true)
    }
  }

  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            3분 만에 결과 확인
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            지금 바로 시뮬레이션 체험
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            주소와 진료과목을 입력하면 AI가 예상 매출을 분석합니다
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-3xl p-6 md:p-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">개원 예정 주소</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={demoAddress}
                    onChange={(e) => setDemoAddress(e.target.value)}
                    placeholder="예: 서울시 강남구 역삼동"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#3182f6] text-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">진료 과목</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['내과', '정형외과', '피부과', '치과', '소아과', '안과'].map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setDemoSpecialty(spec)}
                      className={`py-2.5 px-2 sm:py-3 sm:px-4 rounded-xl text-sm font-medium transition-all ${
                        demoSpecialty === spec
                          ? 'bg-[#3182f6] text-white shadow-lg'
                          : 'bg-secondary hover:bg-accent'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={runDemo}
              disabled={!demoAddress || demoLoading}
              className="w-full btn-primary btn-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {demoLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI가 분석 중...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  무료 분석 시작
                </>
              )}
            </button>

            {/* Result with AnimatePresence */}
            <AnimatePresence>
              {showDemoResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="mt-8 pt-8 border-t border-border"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-[#3182f6]" />
                    <span className="font-semibold">분석 완료!</span>
                    <span className="text-sm text-muted-foreground">
                      {demoAddress} · {demoSpecialty}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                      <div className="text-sm text-muted-foreground mb-1">예상 월 매출</div>
                      <div className="text-2xl font-bold text-[#3182f6]">{demoResults.monthlyRevenue}</div>
                    </div>
                    <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                      <div className="text-sm text-muted-foreground mb-1">손익분기점</div>
                      <div className="text-2xl font-bold text-[#3182f6]">{demoResults.breakEven}</div>
                    </div>
                    <div className="p-4 bg-[#3182f6]/5 rounded-2xl">
                      <div className="text-sm text-muted-foreground mb-1">개원 적합도</div>
                      <div className="text-2xl font-bold text-[#3182f6]">{demoResults.score}점</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                    <span className="text-sm text-muted-foreground">상세 분석 결과를 확인하세요</span>
                    <Link href="/simulate" className="btn-primary btn-sm">
                      전체 리포트 보기
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

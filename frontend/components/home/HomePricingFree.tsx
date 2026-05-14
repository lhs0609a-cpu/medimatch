'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

// 무료 강조 + 의사랑·오름차트 같은 유료 EMR과 직관적 비교.
// "왜 무료인가? — 협력사 매칭이 BM" 한 줄 honest 설명 포함.
type Row = {
  feature: string
  ours: string | true
  others: string | false
}

const ROWS: Row[] = [
  { feature: '월 사용료 (1ID)',          ours: '0원',           others: '약 30~80만원' },
  { feature: '설치·세팅·서버 관리',       ours: '필요 없음',      others: '필요' },
  { feature: 'AI 음성 자동 차트',         ours: true,           others: false },
  { feature: '삭감 방어 AI 청구',          ours: true,           others: '일부' },
  { feature: 'CRM 알림톡 환자 리콜',       ours: true,           others: false },
  { feature: '환자 카톡 인터페이스',       ours: true,           others: false },
  { feature: '클라우드 백업·자동 업데이트', ours: true,           others: '별도 비용' },
  { feature: '타사 데이터 무료 마이그레이션', ours: true,         others: false },
  { feature: '가입·카드 등록',             ours: '0초',          others: '필요' },
]

export function HomePricingFree() {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            평생 무료 (의사용)
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            왜 무료인가요?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            EMR 사용료가 아닌, 의원 운영 중 자연스럽게 만나는 협력사 매칭<br className="hidden md:block" />
            (인테리어·기기·매물·공동구매)에서 수수료를 받는 구조입니다.
          </p>
        </motion.div>

        {/* 비교표 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto card overflow-hidden"
        >
          <div className="grid grid-cols-[1.5fr_1fr_1fr] divide-x divide-border">
            {/* 헤더 */}
            <div className="p-4 bg-secondary/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                비교 항목
              </span>
            </div>
            <div className="p-4 bg-primary/10 text-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                MediMatch
              </span>
              <span className="text-lg font-bold text-primary">평생 무료</span>
            </div>
            <div className="p-4 bg-secondary/40 text-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                기존 EMR
              </span>
              <span className="text-sm text-muted-foreground">의사랑·오름차트 등</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {ROWS.map((r) => (
              <div key={r.feature} className="grid grid-cols-[1.5fr_1fr_1fr] divide-x divide-border text-sm">
                <div className="p-4 font-medium">{r.feature}</div>
                <div className="p-4 text-center">
                  {r.ours === true ? (
                    <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                  ) : (
                    <span className="font-semibold text-primary">{r.ours}</span>
                  )}
                </div>
                <div className="p-4 text-center">
                  {r.others === false ? (
                    <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">{r.others}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 사용자 ID당 과금 — 1ID 무료, 그 이상은 저렴한 정액 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.2 }}
          className="mt-10 max-w-4xl mx-auto"
        >
          <div className="bg-secondary/40 rounded-2xl p-6 md:p-8">
            <div className="text-center mb-5">
              <h3 className="font-bold text-lg mb-1">의원이 커지면 — 사용자 ID당 정액</h3>
              <p className="text-xs text-muted-foreground">
                PC 대수가 아닌 사람 수 기준. 페이닥·이중원장·다인 진료실에 유리합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { range: '1 ID',       price: '0원',     note: '평생' },
                { range: '2~4 ID',     price: '39,000',  note: '/ID/월' },
                { range: '5~9 ID',     price: '29,000',  note: '/ID/월' },
                { range: '10+ ID',     price: '19,000',  note: '/ID/월' },
              ].map((p) => (
                <div key={p.range} className="text-center bg-background rounded-xl p-4 border border-border">
                  <div className="text-xs text-muted-foreground mb-1">{p.range}</div>
                  <div className="text-xl font-bold">{p.price}</div>
                  <div className="text-2xs text-muted-foreground">{p.note}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 최종 CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link href="/emr" className="btn-primary btn-lg inline-flex">
            지금 1초 만에 시작
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            가입·카드 등록·약정 0. 24시간 안에 해지하면 데이터 자동 삭제.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

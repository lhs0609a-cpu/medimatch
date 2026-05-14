'use client'

import { motion } from 'framer-motion'
import { Stethoscope, Smartphone, Mic, Bell, Pill, Star, ArrowRight, Check } from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { viewportConfig } from '@/components/animation/MotionWrapper'

// 의사용 EMR과 환자용 모바일 앱을 한 섹션에서 듀얼로 소개.
// 의사가 차트 쓰면 → 환자가 알림 받고 예약·복약·결과 확인하는 양방향 흐름 시각화.
export function HomeAppShowcase() {
  return (
    <section className="py-[80px] md:py-[120px] bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-primary bg-primary/10 rounded-full">
            의원과 환자, 같은 흐름
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            의사가 차트 쓰면<br className="md:hidden" /> 환자에게 자동 전달
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            EMR과 환자 앱이 분리된 시스템이 아닙니다. 한 흐름으로 묶여 있습니다.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* 의사용 EMR */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5 }}
            className="card p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <TossIcon icon={Stethoscope} color="from-blue-500 to-indigo-600" size="lg" />
              <div>
                <div className="text-xs text-muted-foreground">의사·실장용</div>
                <h3 className="text-xl font-bold">MediMatch EMR</h3>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              브라우저만 있으면 어디서든. 설치·서버 관리·백업 신경쓸 필요 없습니다.
            </p>

            <ul className="space-y-2.5 mb-6">
              {[
                'AI 음성으로 차트 자동 작성',
                '삭감 위험 실시간 경고 + 1클릭 청구',
                '환자 리콜 알림톡 자동 발송',
                '매출·환자수·내원 패턴 실시간 분석',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                1ID 평생 무료
              </span>
              <span className="text-xs text-muted-foreground">· 가입·카드 등록 없음</span>
            </div>
          </motion.div>

          {/* 환자용 앱 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-8"
          >
            <div className="flex items-center gap-3 mb-5">
              <TossIcon icon={Smartphone} color="from-emerald-500 to-teal-600" size="lg" />
              <div>
                <div className="text-xs text-muted-foreground">환자용 (별도 앱 다운로드 불필요)</div>
                <h3 className="text-xl font-bold">카톡 알림톡 인터페이스</h3>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              앱스토어 설치 거부감 0. 카톡 한 줄로 예약 확인·문진·결과 조회 완료.
            </p>

            <ul className="space-y-2.5 mb-6">
              {[
                { icon: Bell, text: '예약 확인·도착 알림·취소 가드' },
                { icon: Mic, text: '내원 전 문진 1분 작성 → 차트 prefill' },
                { icon: Pill, text: '복약 시간 알림 + 부작용 보고 폼' },
                { icon: Star, text: '진료 후 만족도 1탭 평가' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-sm">
                  <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                환자 비용 0원
              </span>
              <span className="text-xs text-muted-foreground">· PIPA·정통망법 동의 가드 내장</span>
            </div>
          </motion.div>
        </div>

        {/* 양방향 흐름 한 줄 설명 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          의사 진료 종료 → 환자 카톡 알림 → 만족도 회신 → 의원 리뷰 → 다음 환자 유입
          <span className="text-primary font-medium"> 한 흐름</span>으로 완결.
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import {
  Mic, Brain, FileText, Check, MessageSquare, Calendar, Pill, ChevronRight,
} from 'lucide-react'
import { BrowserMockup } from './mockups/BrowserMockup'
import { PhoneMockup } from './mockups/PhoneMockup'
import { viewportConfig } from '@/components/animation/MotionWrapper'

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

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto items-center">
          {/* === 의사용 EMR — 브라우저 목업 === */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6 }}
          >
            <BrowserMockup url="medi.brandplaton.com/emr/chart/new">
              <div className="p-4 text-[11px]">
                {/* 사이드바 시뮬 */}
                <div className="flex gap-3">
                  <div className="w-24 space-y-1 flex-shrink-0">
                    {['진료', '환자', '처방·청구', 'CRM', '리포트', '발견'].map((m, i) => (
                      <div
                        key={m}
                        className={`px-2 py-1 rounded text-[10px] ${
                          i === 0 ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                  {/* 차트 영역 */}
                  <div className="flex-1 space-y-2">
                    {/* 환자 헤더 */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                      <div>
                        <div className="font-semibold text-[12px] text-zinc-900 dark:text-zinc-100">김환자 · 남 · 38세</div>
                        <div className="text-[9px] text-muted-foreground">차트 A-1024 · 2026-05-14 14:30</div>
                      </div>
                      <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        REC 01:42
                      </div>
                    </div>
                    {/* CC */}
                    <div>
                      <div className="text-[9px] font-semibold text-primary mb-0.5">CC · 주호소</div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300">
                        3일 전부터 시작된 우측 하복부 통증, 식후 악화
                      </div>
                    </div>
                    {/* PI */}
                    <div>
                      <div className="text-[9px] font-semibold text-primary mb-0.5">PI · 현병력</div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        지속 통증 NRS 6/10, 발열·구토 동반 없음. 최근 회식 후 발생
                      </div>
                    </div>
                    {/* AI 추천 진단코드 */}
                    <div>
                      <div className="text-[9px] font-semibold text-primary mb-0.5 flex items-center gap-1">
                        <Brain className="w-2.5 h-2.5" /> AI 진단코드 추천
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-mono">
                          K59.0 변비
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-mono">
                          K30 소화불량
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-mono">
                          R10.4 복통 NOS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BrowserMockup>

            <div className="mt-6 px-1">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">의사·실장용</div>
              <h3 className="text-xl font-bold mb-3">브라우저만 있으면 어디서든</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { icon: Mic, t: 'AI 음성으로 차트 자동 작성' },
                  { icon: Check, t: '삭감 위험 실시간 경고 + 1클릭 청구' },
                  { icon: MessageSquare, t: '환자 리콜 알림톡 자동 발송' },
                ].map((it) => (
                  <li key={it.t} className="flex items-start gap-2">
                    <it.icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{it.t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                1ID 평생 무료 <span className="text-muted-foreground font-normal">· 가입·카드 등록 없음</span>
              </div>
            </div>
          </motion.div>

          {/* === 환자용 카톡 알림톡 — 폰 목업 === */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PhoneMockup>
              {/* 카톡 헤더 */}
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center text-[10px] font-bold text-zinc-800">
                  메디
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold truncate">메디매치 내과의원</div>
                  <div className="text-[8px] text-muted-foreground">알림톡</div>
                </div>
              </div>

              {/* 알림톡 메시지 1 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/40 rounded-lg p-2 mb-2 text-[9px]">
                <div className="flex items-center gap-1 mb-1 text-[8px] font-semibold text-yellow-700 dark:text-yellow-400">
                  <Calendar className="w-2.5 h-2.5" />
                  예약 확정
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 leading-snug">
                  김환자님, <b>2026-05-15 (목) 14:30</b> 진료 예약이 확정되었습니다.
                </div>
                <button className="mt-1.5 w-full text-[8px] text-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded py-1">
                  지도 보기
                </button>
              </div>

              {/* 알림톡 메시지 2 — 문진 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-lg p-2 mb-2 text-[9px]">
                <div className="flex items-center gap-1 mb-1 text-[8px] font-semibold text-blue-700 dark:text-blue-400">
                  <FileText className="w-2.5 h-2.5" />
                  사전 문진 (1분)
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 leading-snug">
                  내원 전 11문항 작성하시면<br />대기 시간 없이 진료 시작됩니다.
                </div>
                <button className="mt-1.5 w-full text-[8px] text-center bg-blue-500 text-white rounded py-1 font-semibold">
                  문진 시작 →
                </button>
              </div>

              {/* 알림톡 메시지 3 — 복약 */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg p-2 text-[9px]">
                <div className="flex items-center gap-1 mb-1 text-[8px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <Pill className="w-2.5 h-2.5" />
                  복약 시간
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 leading-snug">
                  점심 식후 처방약 복용 시간입니다.<br />
                  부작용 있으면 바로 알려주세요.
                </div>
                <div className="flex gap-1 mt-1.5">
                  <button className="flex-1 text-[8px] bg-emerald-500 text-white rounded py-1 font-semibold">
                    복용 완료
                  </button>
                  <button className="flex-1 text-[8px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded py-1">
                    부작용 보고
                  </button>
                </div>
              </div>
            </PhoneMockup>

            <div className="mt-6 px-1">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                환자용 · 별도 앱 다운로드 X
              </div>
              <h3 className="text-xl font-bold mb-3">카톡 한 줄로 모든 안내</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  '예약 확인·도착 알림·취소 가드',
                  '내원 전 문진 1분 작성 → 차트 prefill',
                  '복약 시간 알림 + 부작용 보고 폼',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                환자 비용 0원 <span className="text-muted-foreground font-normal">· PIPA·정통망법 가드 내장</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 양방향 흐름 한 줄 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ delay: 0.2 }}
          className="mt-10 text-center text-sm text-muted-foreground"
        >
          의사 진료 → 환자 카톡 알림 → 만족도 회신 → 리뷰 → 다음 환자 유입
          <span className="text-primary font-medium"> 한 흐름</span>으로 완결.
        </motion.div>
      </div>
    </section>
  )
}

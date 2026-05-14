'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { viewportConfig } from '@/components/animation/MotionWrapper'

const FAQS = [
  {
    q: '진짜 평생 무료인가요? 나중에 유료 전환되지 않나요?',
    a: '1ID(원장 1명) 기준 평생 무료가 약정입니다. 의원 규모가 커져 2명 이상 사용자가 필요하면 ID당 정액(2~4: 39,000원, 5~9: 29,000원, 10+: 19,000원). 수익 모델은 EMR 사용료가 아니라 인테리어·기기·매물·공동구매 매칭 수수료입니다.',
  },
  {
    q: '기존 EMR(의사랑·오름차트 등)에서 데이터 옮길 수 있나요?',
    a: 'CSV/엑셀 자동 매핑으로 한 번에 가져옵니다. 의사랑·닥터팔레트·비트·두번째뇌 컬럼명 사전 내장. 미매핑 컬럼은 원본 그대로 보존되어 손실 0. 마이그레이션 작업도 무료입니다.',
  },
  {
    q: '클라우드인데 환자 정보 보안은요?',
    a: 'AWS 서울 리전 + 의료법 5년 보존 정책 + 모든 접근 로그 기록. 알림톡 발송은 정통망법/PIPA 동의 가드 18종 적용(야간 차단, 1분 dedup, 광고 키워드 차단 등). 데이터 주권은 원장님에게 — 언제든 전체 Export 무료.',
  },
  {
    q: '인터넷이 끊기면 진료를 못 하나요?',
    a: '주요 화면은 로컬 캐시로 30분간 작동. 결제·청구는 인터넷 복구 후 자동 동기화. 진료 자체가 멈추지 않도록 설계되어 있습니다.',
  },
  {
    q: 'AI 음성 차트는 한국어를 잘 인식하나요?',
    a: '의료 전문 한국어 모델 기반 (브라우저 음성 인식 + GPT-4o-mini 보정). 의사/환자 발화 자동 구분, CC·PI·PMH 자동 분류, ICD-10 코드 추천. 사투리·약어도 학습됨.',
  },
  {
    q: '심평원 청구가 진짜 1클릭으로 되나요?',
    a: 'AI가 진단명·시술코드 조합을 분석해 삭감 위험도 색상으로 표시(녹/황/적). 위험한 코드는 대안 추천. 청구서는 EDI 포맷으로 변환되어 1클릭 전송. 평균 삭감률 30% 감소.',
  },
  {
    q: '환자 앱을 따로 설치해야 하나요?',
    a: '환자 입장에선 카톡 알림톡 한 줄로 끝. 별도 앱 다운로드·가입 불필요. 예약 확인, 도착 알림, 문진 작성, 복약 알림, 결과 조회까지 카톡 안에서 완결.',
  },
  {
    q: '의원 외에 다른 서비스는 뭐가 있나요?',
    a: 'EMR 안 \'발견\' 탭에서: 병원 매물 470+, 개원 D-Day 체크리스트, 공동구매(평균 22% 절감), 약국 양도양수 매칭. 같은 매직링크 로그인으로 모두 무료 접근. 매칭 성사 시에만 협의 수수료.',
  },
]

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-primary bg-primary/10 rounded-full">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            궁금한 것을 먼저 물어보셨습니다
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-secondary/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-sm md:text-base">{f.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

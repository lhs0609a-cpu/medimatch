'use client';

/**
 * 신입 상담사 5분 온보딩 위저드
 *
 * 14장 카드(인트로 + 9단계 + 매칭 우선순위 + 클로징 3장).
 * 단계별로 "꼭 물어볼 3가지 / 약속하면 안 되는 것 / 매칭 우선순위" 구조.
 *
 * 콘텐츠 중심 — 실제 신입이 첫 콜 전 5분 안에 숙지 가능.
 */
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen, AlertTriangle,
  CheckCircle, Target, Phone, Sparkles, Award, Headphones,
} from 'lucide-react';

interface Card {
  type: 'intro' | 'stage' | 'priority' | 'closing';
  stage_key?: string;
  title: string;
  subtitle?: string;
  icon?: any;
  ask?: string[];        // 꼭 물어볼 것
  forbidden?: string[];  // 약속 금지
  match?: string[];      // 우선 매칭 카테고리
  body?: string[];       // intro/closing 일반 카드용
  color?: string;
}

const CARDS: Card[] = [
  // 인트로
  {
    type: 'intro',
    title: '5분 온보딩',
    subtitle: '첫 콜 전 한 번만 보세요. 현장에서 다시 안 봐도 됩니다.',
    icon: BookOpen,
    color: 'bg-violet-600',
    body: [
      '메디플라톤은 의사가 개원·운영하는 모든 단계를 도와주는 매칭 플랫폼입니다.',
      '우리는 13개 카테고리(부동산·법무·회계·세무·노무·금융·인테리어·기기·약품·간판·EMR·마케팅·종합컨설팅) 협력사를 보유하고, 의사에게 적합한 곳을 묶음으로 매칭합니다.',
      '의사는 무료, 협력사가 매칭 수수료를 부담합니다. 절대 의사에게 비용을 청구하지 마세요.',
      '상담의 목표는 "지금 이 의사가 어느 단계에 있고, 가장 막막한 게 무엇인지" 한 번에 파악해서, 카테고리 1~3개를 매칭하는 것입니다.',
    ],
  },
  // 단계별 9장
  {
    type: 'stage', stage_key: 'PLANNING',
    title: '01 사업계획',
    subtitle: '아직 결정이 거의 없는 단계. 우리가 가장 큰 가치를 줄 수 있는 시점.',
    icon: Sparkles,
    color: 'bg-blue-600',
    ask: [
      '진료과·서브스페셜티가 정해졌는지',
      '단독 vs 동업 — 결정했는지, 동업이라면 누구와',
      '예산 가용한도 — 자기자본 + 대출 가능액까지 합쳐서',
    ],
    forbidden: [
      '"개원 무조건 성공한다" 같은 단정',
      '예산 산정 없이 입지 추천',
      '구체적 매출/순익 보장',
    ],
    match: ['종합 개원컨설팅', '회계법인 (예산·자금조달 자문)', '금융 (대출 사전 한도)'],
  },
  {
    type: 'stage', stage_key: 'LOCATION_REVIEW',
    title: '02 입지검토',
    subtitle: '후보지를 늘려주는 게 핵심. 임대료 협상 카드를 만들어주세요.',
    icon: Target,
    color: 'bg-blue-600',
    ask: [
      '현재 검토 중인 후보지 몇 곳인지',
      '예산 내 임대료/보증금/권리금 한도',
      '특정 지역 고집 vs 유연하게 봄',
    ],
    forbidden: [
      '데이터 없이 "여기가 좋다" 추천',
      '권리금 적정선 단정',
      '경쟁의원 수만 보고 판단 ("환자 분포·연령 보세요")',
    ],
    match: ['부동산중개법인 (의료시설 전문)', '종합컨설팅 (상권/인구통계)'],
  },
  {
    type: 'stage', stage_key: 'CONTRACT',
    title: '03 임대계약',
    subtitle: '가장 위험한 단계. 사인 전 무료 법률검토 무조건 권유.',
    icon: AlertTriangle,
    color: 'bg-orange-600',
    ask: [
      '계약서 초안 받았는지 (있으면 PDF 받기)',
      '임대 기간·갱신 조건·원상복구 조항',
      '권리금 분배·계약일·잔금일 순서',
    ],
    forbidden: [
      '"이 계약 좋다/나쁘다" 즉답',
      '권리금 양도자와 직접 협상 권유',
      '계약 전 인테리어 발주 권유',
    ],
    match: ['법무법인/변호사 (의료법 전문)', '부동산중개법인 (협상 보조)', '금융 (보증금 대출)'],
  },
  {
    type: 'stage', stage_key: 'LICENSING',
    title: '04 인허가',
    subtitle: '서류 1개만 빠져도 한 달 지연. 패스트트랙 강조.',
    icon: AlertTriangle,
    color: 'bg-orange-600',
    ask: [
      '사업자등록 했는지',
      '의료기관 개설신고 진행 상황',
      '심평원·건보공단 등록 일정',
    ],
    forbidden: [
      '인허가 기간 단정 ("3주면 끝나요" X)',
      '특정 보건소 영향력 과장',
    ],
    match: ['종합컨설팅 (개설신고 대행)', '세무법인 (사업자등록·세금신고)', '법무 (의료법인 설립 시)'],
  },
  {
    type: 'stage', stage_key: 'CONSTRUCTION',
    title: '05 인테리어',
    subtitle: '평균 30~40% 비용 차지. 3곳 동시 견적 비교가 핵심.',
    icon: Award,
    color: 'bg-emerald-600',
    ask: [
      '평수·필요 동선 (진료실·검사실·대기실)',
      '예산 — 평당 vs 총액 어떻게 잡는지',
      '착공 가능 시점 (인허가·임대 잔금일과 연결)',
    ],
    forbidden: [
      '특정 1개 업체 일방적 추천',
      '"평당 X만원이면 충분"같은 단정',
      '하자보증 기간 보장 (업체별 상이)',
    ],
    match: ['인테리어 (3곳 동시 견적)', '간판·사이니지', '소방·전기 (인테리어 패키지로 묶기)'],
  },
  {
    type: 'stage', stage_key: 'EQUIPMENT',
    title: '06 의료기기',
    subtitle: '구매 vs 리스 vs 중고 — 5년 총비용 1억 차이 강조.',
    icon: Award,
    color: 'bg-emerald-600',
    ask: [
      '필수 장비 목록 (진료과별)',
      '신품 vs 중고 vs 리스 선호',
      '월 캐시플로우 부담 가능 한도',
    ],
    forbidden: [
      '특정 브랜드 우월성 단정',
      '리스사 금리 보장',
      '"중고는 위험하다" 일반화',
    ],
    match: ['의료기기 (다업체 견적 매트릭스)', '금융 (의료기기 리스)', '소모품 (도매 직거래)'],
  },
  {
    type: 'stage', stage_key: 'HIRING',
    title: '07 인력채용',
    subtitle: '근로계약·4대보험 셋업이 더 중요. 노무 자문 무조건.',
    icon: Phone,
    color: 'bg-violet-600',
    ask: [
      '필요 인력 (간호조무사·실장·코디 등)',
      '경력자 선호 vs 신입 OJT',
      '급여 수준 — 지역 평균 알고 계신지',
    ],
    forbidden: [
      '특정 구인사이트 효과 보장',
      '"이 정도 급여가 적정"',
      '근로계약서 양식 직접 제공 (노무사 통해)',
    ],
    match: ['노무법인 (계약·4대보험·취업규칙)', '종합컨설팅 (채용/교육)', '세무 (급여대장)'],
  },
  {
    type: 'stage', stage_key: 'OPENING',
    title: '08 개원준비',
    subtitle: '오픈 직후 3개월이 환자 정착 좌우. EMR·마케팅이 핵심.',
    icon: Sparkles,
    color: 'bg-blue-600',
    ask: [
      'EMR 결정했는지 (안 했으면 무료 3개월 강조)',
      '마케팅 채널 — 네이버·블로그·인스타 중 무엇',
      '개원 이벤트·프리오픈 계획',
    ],
    forbidden: [
      '"환자 X명 보장" 같은 마케팅 효과 약속',
      '특정 SNS 트렌드 단정',
      'EMR 비용 가격 단정 (옵션 따라 다름)',
    ],
    match: ['EMR·청구', '마케팅 (개원 부스팅 패키지)', '간판·인쇄물'],
  },
  {
    type: 'stage', stage_key: 'OPERATING',
    title: '09 운영안정',
    subtitle: '경정청구 평균 환급액 3,000만원. 절세·비용절감 무조건.',
    icon: CheckCircle,
    color: 'bg-emerald-600',
    ask: [
      '월 매출/지출 트래킹 어떻게 하는지',
      '세무사·노무사 만족도',
      '인건비·고정비 부담 비중',
    ],
    forbidden: [
      '"절세 X만원 보장" 단정',
      '경쟁의원 정보 공유',
    ],
    match: ['세무법인 (경정청구·결산)', '회계 (재무자문)', '소모품·약품 (단가 인하)'],
  },
  // 매칭 우선순위
  {
    type: 'priority',
    title: '매칭 우선순위 결정 룰',
    subtitle: '1통화에서 매칭은 1~3개로 좁혀야 의사가 부담 안 느낍니다.',
    icon: Target,
    color: 'bg-amber-600',
    body: [
      '① 의사가 "막막하다"고 직접 말한 카테고리 → 무조건 1순위.',
      '② 현재 단계 미완료 항목과 연결된 카테고리 → 2순위 (체크리스트 자동 추천).',
      '③ 시간 임박 카테고리 → 인허가·인테리어처럼 리드타임 긴 것은 우선.',
      '④ 같은 의사에게 같은 카테고리 중복 매칭 X. (의사 피로도 ↑)',
      '⑤ HOT 우선순위 의사라도 한 통화에 4개 이상 매칭 X. 다음 통화에서 추가.',
      '⑥ 매칭 후 24시간 안에 협력사가 의사에게 컨택했는지 반드시 확인.',
    ],
  },
  // 클로징 3장
  {
    type: 'closing',
    title: '카톡 멘트 템플릿',
    subtitle: '통화 끝나고 5분 안에 카톡으로 후속. 도달률 90%+',
    icon: Phone,
    color: 'bg-emerald-700',
    body: [
      '[관심 표명한 의사]\n"원장님 안녕하세요, 메디플라톤 OOO입니다. 오늘 통화 정리해서 보내드려요.\n\n· 추천: [카테고리 3개]\n· 단계 체크리스트 PDF\n· 미션맵 링크: [URL]\n\n검토하시고 답주시면 매칭 진행할게요!"',
      '[부재중인 의사]\n"메디플라톤 OOO입니다. 통화 못 받으셨네요. 편한 시간 알려주시면 다시 연락드릴게요. (또는 지금 카톡으로 진단 한 번 해보실래요?)"',
      '[거절한 의사]\n"네 알겠습니다. 단계별 체크리스트 한 장만 보내드릴게요. 필요한 시점에 다시 연락주세요. [PDF]"',
    ],
  },
  {
    type: 'closing',
    title: '절대 하면 안 되는 것 (요약)',
    subtitle: '딱 5가지만 기억하세요.',
    icon: AlertTriangle,
    color: 'bg-red-600',
    body: [
      '① 의사에게 매칭/이용료 청구 — 무료입니다.',
      '② 매출·환자수·절세액 보장 — 우리 통제 밖.',
      '③ 특정 협력사 단독 추천 — 비교 견적이 가치.',
      '④ 우리 내부 commission_rate 노출 — 매칭 신뢰 ↓.',
      '⑤ 한 번 통화에 4개 이상 카테고리 매칭 — 부담만 ↑.',
    ],
  },
  {
    type: 'closing',
    title: '바로 시작하기',
    subtitle: 'CRM에서 오늘 콜 TOP 10을 위에서부터 돌리세요.',
    icon: Headphones,
    color: 'bg-blue-700',
    body: [
      '1. /admin/crm 메인의 "오늘 콜할 TOP 10" 위에서부터 시작',
      '2. 각 lead 우측의 ▶︎ 콜 콘솔 버튼 클릭',
      '3. AI 스크립트는 카드 순서대로 따라 읽으면 됩니다.',
      '4. 통화 종료 시 결과만 클릭하면 자동 저장 + 후속 일정 등록.',
      '5. 막히면 이 가이드 다시 보세요.',
    ],
  },
];

export default function OnboardingPage() {
  const [idx, setIdx] = useState(0);
  const card = CARDS[idx];
  const Icon = card.icon || BookOpen;
  const progress = ((idx + 1) / CARDS.length) * 100;

  const next = () => idx < CARDS.length - 1 && setIdx(i => i + 1);
  const prev = () => idx > 0 && setIdx(i => i - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/40 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin/crm" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />CRM으로
          </Link>
          <div className="text-xs text-gray-500">
            {idx + 1} / {CARDS.length}
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            {/* Header */}
            <div className={`${card.color || 'bg-gray-700'} text-white p-8`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">{card.title}</h1>
                  {card.subtitle && (
                    <p className="text-sm text-white/85 mt-2 leading-relaxed">{card.subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {card.body && (
                <div className="space-y-3">
                  {card.body.map((b, i) => (
                    <p key={i} className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {b}
                    </p>
                  ))}
                </div>
              )}

              {card.ask && (
                <Block icon={CheckCircle} title="꼭 물어볼 것 (3가지)" tone="emerald">
                  <ol className="space-y-2 pl-5 list-decimal text-sm text-gray-800">
                    {card.ask.map((a, i) => <li key={i}>{a}</li>)}
                  </ol>
                </Block>
              )}

              {card.forbidden && (
                <Block icon={AlertTriangle} title="약속·단정 금지" tone="red">
                  <ul className="space-y-2 pl-5 list-disc text-sm text-gray-800">
                    {card.forbidden.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </Block>
              )}

              {card.match && (
                <Block icon={Target} title="우선 매칭 카테고리" tone="blue">
                  <ul className="space-y-1 pl-5 list-disc text-sm text-gray-800">
                    {card.match.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </Block>
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-8 py-5 bg-gray-50 border-t border-gray-100">
              <button
                onClick={prev}
                disabled={idx === 0}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />이전
              </button>
              {idx < CARDS.length - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-6 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800"
                >
                  다음 <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/admin/crm"
                  className="flex items-center gap-1 px-6 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4" />첫 콜 시작
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mini index */}
        <div className="mt-8 flex flex-wrap gap-1.5 justify-center">
          {CARDS.map((c, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-7 h-7 text-[10px] rounded-md transition-all ${
                i === idx ? 'bg-gray-900 text-white font-bold scale-110'
                  : i < idx ? 'bg-gray-200 text-gray-500'
                    : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
              title={c.title}
            >{i + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, tone, children }: {
  icon: any; title: string; tone: 'emerald' | 'red' | 'blue'; children: React.ReactNode;
}) {
  const cls = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    red: 'bg-red-50 border-red-100 text-red-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
  }[tone];
  const iconCls = {
    emerald: 'text-emerald-600', red: 'text-red-600', blue: 'text-blue-600',
  }[tone];
  return (
    <div className={`border rounded-2xl p-5 ${cls}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconCls}`} />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

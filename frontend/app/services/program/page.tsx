'use client';

import { useState } from 'react';
import {
  Cog, Clock, AlertTriangle, Users, Calculator,
  Database, FileText, Mail, BarChart3, Shield,
  Zap, RefreshCw, ClipboardCheck, Code2, Headphones,
  Rocket, TrendingDown, DollarSign, Brain
} from 'lucide-react';
import {
  ServiceHero,
  ServiceProblemSection,
  ServiceSolutionSection,
  ServiceComparisonTable,
  ServiceProcessSteps,
  ServicePricingCards,
  ServiceTestimonials,
  ServiceFAQ,
  ServiceConsultationForm,
  ServiceStickyHeader,
} from '@/components/services';

// ============================================================
// ROI Calculator Component
// ============================================================
function ROICalculator() {
  const [employees, setEmployees] = useState(3);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const hourlyRate = 25000; // 시급 기준

  const dailySavings = employees * hoursPerDay * hourlyRate;
  const monthlySavings = dailySavings * 22; // 월 22일 기준
  const annualSavings = monthlySavings * 12;
  const monthlySubscription = 300000;
  const roi = Math.round(((annualSavings - monthlySubscription * 12) / (monthlySubscription * 12)) * 100);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            ROI 계산기
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            우리 회사 절감액, 바로 계산해보세요
          </h2>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input */}
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>반복 업무 담당 직원 수</span>
                  <span className="text-blue-600 font-bold">{employees}명</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1명</span><span>20명</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>1인당 반복 업무 시간/일</span>
                  <span className="text-blue-600 font-bold">{hoursPerDay}시간</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1시간</span><span>8시간</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">시급 기준</div>
                <div className="font-bold text-gray-900">₩25,000/시간</div>
              </div>
            </div>

            {/* Result */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">월간 절감 가능 금액</div>
                <div className="text-3xl font-bold text-blue-600">
                  ₩{monthlySavings.toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">연간 절감 가능 금액</div>
                <div className="text-3xl font-bold text-green-600">
                  ₩{annualSavings.toLocaleString()}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 mb-1">DevAuto 월 구독료</div>
                    <div className="text-xl font-bold text-gray-900">₩300,000/월</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600 mb-1">예상 ROI</div>
                    <div className="text-2xl font-bold text-blue-700">{roi}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProgramServicePage() {
  return (
    <div className="min-h-screen">
      <ServiceStickyHeader
        title="DevAuto"
        navItems={[
          { label: '문제점', href: '#problems' },
          { label: 'ROI 계산', href: '#roi' },
          { label: '솔루션', href: '#solutions' },
          { label: '가격', href: '#pricing' },
          { label: '후기', href: '#testimonials' },
        ]}
        ctaText="무료 진단 받기"
        ctaHref="#consultation"
        homeHref="/"
      />

      {/* Hero */}
      <ServiceHero
        badge="제작비 0원 | 150개 기업이 증명"
        headline="직원 3명이 하던 일, 프로그램 하나로 끝내세요"
        subHeadline="매일 3시간씩 반복 작업에 낭비하고 계신가요? 경쟁사는 이미 70% 더 빨리 일하고 있습니다."
        description="월급 405만원 직원 1명 뽑을 돈으로, 24시간 무휴 자동화 시스템 8개를 운영할 수 있습니다."
        stats={[
          { value: '70%', label: '업무 시간 절감' },
          { value: '150+', label: '도입 기업' },
          { value: '98%', label: '재계약률' },
          { value: '800%', label: '평균 ROI' },
        ]}
        ctaText="무료 진단 받기"
        ctaHref="#consultation"
        secondaryCta={{ text: '가격 보기', href: '#pricing' }}
      />

      {/* Problems */}
      <div id="problems">
        <ServiceProblemSection
          badge="이런 증상, 몇 개나 해당되나요?"
          headline="돈이 새는 4가지 증상"
          subHeadline="하나라도 해당되면, 연간 최소 1,200만원이 낭비되고 있습니다"
          problems={[
            {
              icon: Clock,
              title: '"또 사람 뽑자는 품의서..."',
              description: '매일 같은 작업을 반복하느라 야근이 일상이 됐습니다. 직원을 더 뽑아도 같은 문제가 반복됩니다. 사람이 아니라 시스템이 필요한 단계입니다.',
              stat: '3시간+',
              statLabel: '일 평균 반복 업무',
            },
            {
              icon: AlertTriangle,
              title: '"이 보고서, 숫자가 또 틀렸잖아"',
              description: '엑셀 파일 수십 개를 복사-붙여넣기하다 보면 실수는 필연입니다. 수작업 데이터 처리는 정확도가 떨어지고, 실수 하나가 큰 손실로 이어집니다.',
              stat: '100%',
              statLabel: '수작업 → 오류 발생률',
            },
            {
              icon: Users,
              title: '"핵심 담당자가 퇴사하면 끝"',
              description: '특정 직원만 알고 있는 업무 프로세스. 그 사람이 퇴사하면? 인수인계서로는 절대 복원 불가. 업무 지식이 시스템이 아닌 사람에게 갇혀 있습니다.',
              stat: '1명',
              statLabel: '핵심 의존 인력',
            },
            {
              icon: DollarSign,
              title: '"외주 개발비 견적이 5천만원?"',
              description: '기업용 솔루션 도입은 수천만 원, 맞춤 개발은 수개월. 결국 포기하고 사람을 더 뽑습니다. 악순환의 반복입니다.',
              stat: '₩5,000만+',
              statLabel: '기업 솔루션 평균 도입비',
            },
          ]}
          bottomCallout={{
            amount: '연간 ₩1,200만원+',
            label: '자동화하지 않으면 매년 잃는 금액',
            description: '이 페이지를 읽는 5분 동안 당신 회사에서 ₩25,000이 낭비됐습니다.',
          }}
        />
      </div>

      {/* ROI Calculator */}
      <div id="roi">
        <ROICalculator />
      </div>

      {/* Solutions */}
      <div id="solutions">
        <ServiceSolutionSection
          badge="DevAuto의 해결책"
          headline="반복은 프로그램에게, 사람은 더 중요한 일에"
          subHeadline="150개 기업 = 150개의 서로 다른 맞춤 프로그램. 범용 솔루션이 아닙니다."
          solutions={[
            {
              icon: Database,
              title: '데이터 자동 수집 & 통합',
              description: '여러 사이트, 시스템, 엑셀에 흩어진 데이터를 하나로 통합합니다. 실시간 자동 수집으로 항상 최신 데이터를 유지합니다.',
              highlights: ['경쟁사 가격 자동 모니터링', '다중 소스 데이터 통합', 'API 자동 연동'],
            },
            {
              icon: FileText,
              title: '보고서 & 정산 자동 생성',
              description: '매일 4시간씩 걸리던 매출 정산이 버튼 하나로 끝납니다. 정해진 양식에 맞춰 자동으로 생성, 오류율 0%.',
              highlights: ['일일/주간/월간 자동 리포트', '매출 정산 자동화', '커스텀 양식 지원'],
            },
            {
              icon: Mail,
              title: '이메일 & 알림 자동 발송',
              description: '조건에 따라 자동으로 이메일, 카카오톡, 슬랙 알림을 보냅니다. 놓치는 건이 0이 됩니다.',
              highlights: ['조건부 자동 알림', '고객 리마인더 발송', '대량 메일 처리'],
            },
            {
              icon: BarChart3,
              title: '실시간 모니터링 대시보드',
              description: '재고, 주문, 고객 데이터를 한 화면에서 실시간으로 확인합니다. 엑셀 파일을 열 필요가 없습니다.',
              highlights: ['재고/주문 실시간 추적', '경영 지표 대시보드', '이상 감지 자동 알림'],
            },
          ]}
        />
      </div>

      {/* Comparison */}
      <ServiceComparisonTable
        headline="사람 채용 vs 범용 툴 vs DevAuto"
        subHeadline="무엇이 가장 합리적인 선택일까요?"
        columns={[
          { name: '사람 채용' },
          { name: '범용 솔루션' },
          { name: 'DevAuto', highlight: true, badge: '추천' },
        ]}
        rows={[
          { label: '월 비용', values: ['₩350만+', '₩50~200만', '₩30만'] },
          { label: '초기 세팅', values: ['교육 1~3개월', '도입 3~6개월', '1~4주 개발'] },
          { label: '업무 맞춤', values: ['사람 역량 의존', '기능에 맞춰 변경', '100% 맞춤 개발'] },
          { label: '퇴사 리스크', values: ['매우 높음', '없음', '없음'] },
          { label: '확장성', values: ['추가 채용 필요', '제한적', '무제한'] },
          { label: '24시간 운영', values: [false, true, true] },
          { label: '오류율', values: ['사람 실수 불가피', '설정 오류 가능', '0%'] },
          { label: '유지보수', values: ['퇴사 시 중단', '추가 비용', '1개월 무료 포함'] },
        ]}
        resultRow={{
          label: '연간 총비용',
          values: ['₩4,860만+', '₩1,200만+', '₩360만'],
        }}
      />

      {/* Process */}
      <ServiceProcessSteps
        headline="개발 프로세스"
        subHeadline="최소 1주, 최대 4주. 속도가 다릅니다."
        steps={[
          {
            icon: ClipboardCheck,
            title: '무료 진단',
            description: '현재 업무 환경 분석, 자동화 가능 영역 파악, 절감액 산출',
            duration: '30분',
          },
          {
            icon: Brain,
            title: '맞춤 설계',
            description: '귀사 프로세스에 최적화된 솔루션 설계, 견적 제안',
            duration: '24시간 내',
          },
          {
            icon: Code2,
            title: '개발',
            description: '150개 검증된 모듈 기반 고속 개발, 실시간 진행상황 공유',
            duration: '1~4주',
          },
          {
            icon: Rocket,
            title: '완성 & 지원',
            description: '테스트 완료 후 도입, 직원 교육, 1개월 무료 유지보수',
            duration: '지속 지원',
          },
        ]}
      />

      {/* Pricing */}
      <ServicePricingCards
        headline="단순 명쾌한 가격"
        subHeadline="복잡한 요금표 없습니다. 딱 하나의 요금제."
        freeLabel="제작비 ₩0 — 개발비는 우리가 부담합니다"
        tiers={[
          {
            name: 'STANDARD',
            price: '₩30만',
            priceUnit: '/월',
            description: '귀사 맞춤 업무 자동화 프로그램',
            highlight: true,
            popularLabel: '150개 기업이 선택',
            features: [
              { text: '100% 맞춤 프로그램 개발', included: true },
              { text: '150개 검증 모듈 기반 개발', included: true },
              { text: '1~4주 내 완성', included: true },
              { text: '1개월 무료 유지보수', included: true },
              { text: '직원 교육 포함', included: true },
              { text: '24시간 자동 운영', included: true },
              { text: '100% 환불 보장', included: true },
              { text: '추가 기능 확장 가능', included: true },
            ],
            ctaText: '무료 진단 신청',
            ctaHref: '#consultation',
          },
        ]}
        bottomNote="100% 환불 보장 — 합의한 요구사항대로 만들었는데 만족하지 못하시면 전액 환불합니다."
      />

      {/* Cost comparison */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-6">숫자가 답합니다</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">신입 1명 연봉</div>
                <div className="text-2xl font-bold text-red-500 line-through">₩4,860만/년</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">DevAuto 연 비용</div>
                <div className="text-2xl font-bold text-blue-600">₩360만/년</div>
              </div>
            </div>
            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <span className="text-sm text-blue-600">비용 절감</span>
              <div className="text-3xl font-bold text-blue-700">93% 절약</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <div id="testimonials">
        <ServiceTestimonials
          headline="150개 기업이 증명한 성과"
          subHeadline="실제 고객사의 이야기입니다"
          testimonials={[
            {
              name: '김영수 대표',
              role: '마켓플러스 (유통업, 45명)',
              content: '솔직히 처음엔 "이 가격에 될까?" 의심했습니다. 그런데 매일 4시간씩 걸리던 매출 정산이 이제 버튼 하나로 끝납니다. 도입 첫 주부터 효과가 바로 나타났어요.',
              result: '월 80시간 단축 / 연 1,920만원 절감',
              rating: 5,
            },
            {
              name: '이정민 팀장',
              role: '한성정밀 (제조업, 120명)',
              content: '엑셀 파일 수십 개 관리하다 실수 나면 난리였는데, 이제 통합 시스템으로 실수가 0이 됐습니다. 경쟁사보다 견적도 빠르고 소통도 정말 잘 됐어요.',
              result: '데이터 오류 100% 감소 / 효율 2배',
              rating: 5,
            },
            {
              name: '박지현 이사',
              role: '스마트HR (서비스업, 30명)',
              content: '사람 한 명 더 뽑으려다 자동화를 선택했는데, 인건비 연 4천만 원을 아꼈습니다. 최고의 결정이었어요. 다른 부서에서도 요청이 쏟아지고 있습니다.',
              result: '연간 인건비 4,000만원 절감 / ROI 800%',
              rating: 5,
            },
          ]}
        />
      </div>

      {/* Objection handling */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            아직 망설여지신다면
          </h2>

          <div className="space-y-6">
            {[
              {
                question: '"이 가격에 제대로 된 걸 만들어 준다고?"',
                answer: '대기업은 같은 프로젝트에 5천만 원을 씁니다. DevAuto가 10분의 1 비용으로 가능한 이유는, 4년간 축적한 150개 이상의 검증된 자동화 모듈을 조합하기 때문입니다. 처음부터 만드는 것이 아닌, 검증된 조각들의 최적 조합입니다.',
              },
              {
                question: '"범용 솔루션 도입했다가 결국 안 쓰게 된 경험..."',
                answer: '150개 기업 = 150개의 서로 다른 프로그램입니다. 범용 툴에 업무를 맞추는 것이 아니라, 현재 업무 프로세스에 맞춰 1:1 맞춤 개발합니다. 그래서 98% 재계약률이 가능합니다.',
              },
              {
                question: '"결과가 마음에 안 들면?"',
                answer: '100% 환불 보장합니다. 합의한 요구사항대로 만들었는데 만족하지 못하시면 전액 환불합니다. 이것이 가능한 이유는 150개 기업을 통해 검증된 결과에 대한 확신이 있기 때문입니다.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">{item.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <ServiceFAQ
        headline="자주 묻는 질문"
        items={[
          {
            question: '비용이 많이 들지 않을까요?',
            answer: '직원 1명 월급(₩350만)보다 훨씬 저렴한 월 ₩30만입니다. 제작비도 0원이니 초기 부담이 전혀 없습니다. 무료 진단에서 정확한 ROI를 계산해드립니다.',
          },
          {
            question: '우리 회사 업무도 자동화가 가능할까요?',
            answer: '엑셀 작업, 복사-붙여넣기, 규칙 기반 반복 업무는 거의 100% 자동화 가능합니다. 30분 무료 진단으로 정확히 어떤 업무를 자동화할 수 있는지 파악해드립니다.',
          },
          {
            question: '개발 기간은 얼마나 걸리나요?',
            answer: '단순 자동화는 1~2주, 중간 규모 시스템은 3~4주입니다. 긴급 개발도 가능합니다. 100% 납기 준수를 보장합니다.',
          },
          {
            question: '개발 후 문제가 생기면?',
            answer: '1개월 무료 유지보수가 포함되어 있습니다. 이 기간 내 모든 버그 수정과 조정은 무료입니다. 이후에도 합리적인 비용으로 지속 지원합니다.',
          },
          {
            question: '결과가 마음에 안 들면 어떻게 되나요?',
            answer: '100% 환불 보장합니다. 합의한 요구사항대로 만들었는데 만족하지 못하시면 전액 환불합니다. 저희 결과물에 대한 확신이 있기에 가능한 보장입니다.',
          },
        ]}
      />

      {/* Consultation Form */}
      <ServiceConsultationForm
        serviceType="PROGRAM"
        headline="무료 업무 자동화 진단 받기"
        subHeadline="30분이면 됩니다. 귀사 맞춤 절감액을 바로 알려드립니다. 3가지만 적어주세요, 24시간 내 맞춤 견적을 보내드립니다."
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p>DevAuto by 플라톤마케팅 | 사업자등록번호: 000-00-00000</p>
          <p className="mt-1">서울특별시 강남구 | 대표: 홍길동 | 문의: 1588-0000</p>
          <p className="mt-3 text-gray-500">&copy; 2026 DevAuto. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

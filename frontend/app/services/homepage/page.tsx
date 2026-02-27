'use client';

import {
  Globe, Smartphone, Search, MousePointerClick,
  Users, BarChart3, Palette, Code2, HeadphonesIcon,
  FileSearch, Megaphone, Rocket, ClipboardCheck,
  TrendingUp, Shield, Clock, Eye
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
// Portfolio Data
// ============================================================
const PORTFOLIO = [
  { name: '비스필치과', category: '치과', result: '신환 320% 증가', description: '임플란트 특화 브랜딩으로 강남 상위 노출 달성' },
  { name: '더이지플란트치과', category: '치과', result: '예약률 4.2배', description: '원데이 임플란트 특화 전환 퍼널 설계' },
  { name: '친절한홍치과', category: '치과', result: '월 180건 문의', description: '가족치과 브랜딩으로 신뢰 기반 마케팅' },
  { name: '더좋은한방병원', category: '한의원', result: '신환 5배 증가', description: '척추/관절 특화 콘텐츠 + SEO 최적화' },
  { name: '소잠한의원', category: '한의원', result: '매출 2.3배', description: '피부질환 특화 전문성 어필 전략' },
  { name: '하나여성의원', category: '산부인과', result: '문의 270% 증가', description: '여성 전문 클리닉 브랜딩 리뉴얼' },
];

export default function HomepageServicePage() {
  return (
    <div className="min-h-screen">
      <ServiceStickyHeader
        title="플라톤마케팅"
        navItems={[
          { label: '문제점', href: '#problems' },
          { label: '솔루션', href: '#solutions' },
          { label: '포트폴리오', href: '#portfolio' },
          { label: '가격', href: '#pricing' },
          { label: '후기', href: '#testimonials' },
        ]}
        ctaText="무료 진단 받기"
        ctaHref="#consultation"
        homeHref="/"
      />

      {/* Hero */}
      <ServiceHero
        badge="제작비 0원 | 170개 의료기관이 선택"
        headline="같은 광고비를 쓰는데 환자가 5배 오는 병원과 0인 병원의 차이"
        subHeadline="강남 A한의원, 월 6천만원 → 1억 4천만원. 폐업 위기 40평에서 8개월 만에 120평 확장, 부원장 채용까지."
        description="4년간 170개 병의원의 '예약 버튼을 누르는 그 순간'만 연구한 팀입니다."
        stats={[
          { value: '386%', label: '평균 신환 증가율' },
          { value: '170+', label: '의료기관 제작' },
          { value: '94%', label: '3년 이상 장기계약' },
          { value: '287%', label: '전환율 향상' },
        ]}
        ctaText="무료 진단 받기"
        ctaHref="#consultation"
        secondaryCta={{ text: '가격 보기', href: '#pricing' }}
      />

      {/* Problems */}
      <div id="problems">
        <ServiceProblemSection
          badge="이런 문제, 겪고 계시죠?"
          headline="홈페이지가 돈을 벌어다 주지 않는 4가지 이유"
          subHeadline="매달 수백만 원의 광고비가 홈페이지에서 증발하고 있습니다"
          problems={[
            {
              icon: Eye,
              title: '예쁘기만 한 홈페이지',
              description: '"왜 이 병원이어야 하는지" 설득력 있는 메시지가 없습니다. 가격 비교만 하다 떠나는 환자들. 방문자의 78%가 아무 행동 없이 이탈합니다.',
              stat: '78%',
              statLabel: '이탈률 (업계 평균)',
            },
            {
              icon: Smartphone,
              title: '모바일에서 깨지는 홈페이지',
              description: '환자의 87%가 모바일로 검색합니다. 10명 중 8명이 모바일 화면이 불편하면 바로 뒤로 가기를 누릅니다.',
              stat: '87%',
              statLabel: '모바일 검색 비율',
            },
            {
              icon: MousePointerClick,
              title: '"예약하기" 버튼이 안 보이는 홈페이지',
              description: '정보만 나열하고 환자가 행동하도록 유도하지 않습니다. 전환 퍼널 설계 없이는 전환율 0.3%, 즉 99.7%가 떠납니다.',
              stat: '0.3%',
              statLabel: '평균 전환율',
            },
            {
              icon: Search,
              title: '검색해도 안 나오는 병원',
              description: 'SEO 최적화 없이 광고비에만 100% 의존. 구글/네이버 자연검색 유입이 0이면, 광고를 끄는 순간 환자도 0명이 됩니다.',
              stat: '0건',
              statLabel: '자연검색 유입',
            },
          ]}
          bottomCallout={{
            amount: '연간 ₩1,872만원',
            label: '이대로 1년만 더 방치하면 잃는 금액',
            description: '홈페이지 비용이 아깝다고요? 바꾸지 않는 것이 훨씬 더 비쌉니다.',
          }}
        />
      </div>

      {/* Solutions */}
      <div id="solutions">
        <ServiceSolutionSection
          badge="플라톤마케팅의 해결책"
          headline="환자가 예약하는 홈페이지, 이렇게 만듭니다"
          subHeadline="디자인이 아닌 전환율을 설계합니다"
          solutions={[
            {
              icon: Palette,
              title: '"왜 우리 병원인지" 보여주는 브랜딩',
              description: '원장님의 진료 철학, 차별점, 전문성을 환자의 언어로 풀어냅니다. 가격 경쟁이 아닌 가치 경쟁으로 전환합니다.',
              highlights: ['병원 맞춤 브랜드 스토리', '전문성 어필 콘텐츠', '차별화된 비주얼 아이덴티티'],
            },
            {
              icon: MousePointerClick,
              title: '검색 → 클릭 → 예약까지 전환 설계',
              description: '방문자가 자연스럽게 예약까지 이어지는 퍼널을 설계합니다. 모든 페이지에 명확한 CTA(Call to Action)를 배치합니다.',
              highlights: ['전환율 최적화(CRO) 적용', 'A/B 테스트 기반 개선', '예약 경로 최적화'],
            },
            {
              icon: Smartphone,
              title: '모바일에서도 완벽한 반응형',
              description: '87%의 환자가 모바일로 접속합니다. 모바일 우선 설계로 어떤 기기에서든 완벽하게 작동합니다.',
              highlights: ['모바일 퍼스트 디자인', '터치 최적화 UI/UX', '빠른 로딩 속도'],
            },
            {
              icon: Search,
              title: '검색 1페이지 노출 — SEO 최적화',
              description: '광고비 없이도 환자가 찾아오는 구조를 만듭니다. 네이버/구글 SEO 최적화로 자연검색 유입을 극대화합니다.',
              highlights: ['키워드 분석 & 최적화', '기술 SEO (속도/구조화 데이터)', '콘텐츠 마케팅 연동'],
            },
          ]}
        />
      </div>

      {/* Comparison Table */}
      <ServiceComparisonTable
        headline="일반 제작업체 vs 플라톤마케팅"
        subHeadline="단순 홈페이지 제작이 아닌, 환자 유입 시스템을 구축합니다"
        columns={[
          { name: '일반 제작업체' },
          { name: '플라톤마케팅', highlight: true, badge: '추천' },
        ]}
        rows={[
          { label: '목표', values: ['예쁜 디자인', '환자 예약 전환'] },
          { label: '전담팀', values: ['1명 담당', 'QUO팀 5명 배정'] },
          { label: '대표 미팅', values: ['없음', '매월 정기 미팅'] },
          { label: '브랜딩', values: ['템플릿 수정', '병원 맞춤 브랜딩'] },
          { label: '성과 리포트', values: ['없음 / 유료', '매월 무료 제공'] },
          { label: '의료광고법', values: ['모름', '자체 필터링 시스템'] },
          { label: 'SEO 최적화', values: [false, true] },
          { label: '전환율 설계', values: [false, true] },
        ]}
        resultRow={{
          label: '결과',
          values: ['광고비만 증발', '월 6천 → 1억 4천'],
        }}
      />

      {/* Process */}
      <ServiceProcessSteps
        headline="제작 프로세스"
        subHeadline="4~6주, 체계적인 프로세스로 완성합니다"
        steps={[
          {
            icon: ClipboardCheck,
            title: '무료 상담 & 진단',
            description: '현재 홈페이지 전환율 분석, 경쟁사 비교, 개선 방향 제시',
            duration: '당일',
          },
          {
            icon: FileSearch,
            title: '브랜드 스터디',
            description: '원장님 인터뷰, 타겟 환자 분석, 차별화 포인트 도출',
            duration: '1주차',
          },
          {
            icon: Palette,
            title: '기획 & 디자인',
            description: '전환 퍼널 설계, UI/UX 디자인, 콘텐츠 제작',
            duration: '2~3주차',
          },
          {
            icon: Rocket,
            title: '개발 & 런칭',
            description: '반응형 개발, SEO 세팅, 테스트 후 오픈. 이후 매월 성과 리포트',
            duration: '4~6주차',
          },
        ]}
      />

      {/* Portfolio */}
      <section className="py-16 md:py-24 bg-white" id="portfolio">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              포트폴리오
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
              170개 의료기관이 증명한 성과
            </h2>
            <p className="mt-3 text-lg text-gray-600">실제 고객사의 성과를 확인하세요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PORTFOLIO.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <Globe className="w-12 h-12 text-blue-300" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {item.result}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <ServicePricingCards
        headline="투명한 가격 정책"
        subHeadline="제작비 0원. 월 구독료만 내시면 됩니다."
        freeLabel="제작비 ₩0 — 초기 비용 부담 없이 시작하세요"
        tiers={[
          {
            name: 'STARTER',
            price: '₩150만',
            priceUnit: '/월',
            description: '기본에 충실한 병원 홈페이지',
            features: [
              { text: '반응형 홈페이지 제작', included: true },
              { text: '기본 브랜드 디자인', included: true },
              { text: '기본 SEO 최적화', included: true },
              { text: '모바일 최적화', included: true },
              { text: '3개월 유지보수', included: true },
              { text: '전환 퍼널 설계', included: false },
              { text: 'QUO팀 5인 전담', included: false },
              { text: '매월 성과 리포트', included: false },
            ],
            ctaText: '상담 신청',
            ctaHref: '#consultation',
          },
          {
            name: 'GROWTH',
            price: '₩300만',
            priceUnit: '/월',
            description: '환자가 예약하는 전환형 홈페이지',
            highlight: true,
            popularLabel: '170개 병원 중 94%가 선택',
            features: [
              { text: 'STARTER 전체 포함', included: true },
              { text: '전환 퍼널 설계 (CRO)', included: true },
              { text: 'QUO팀 5인 전담 배정', included: true },
              { text: '매월 대표 정기 미팅', included: true },
              { text: '매월 성과 리포트', included: true },
              { text: '블로그 마케팅 연동', included: true },
              { text: '의료광고법 필터링', included: true },
              { text: '무제한 수정', included: true },
            ],
            ctaText: '가장 인기있는 플랜',
            ctaHref: '#consultation',
            badge: '추천',
          },
          {
            name: 'PREMIUM',
            price: '₩500만',
            priceUnit: '/월',
            description: '마케팅 통합 관리 패키지',
            features: [
              { text: 'GROWTH 전체 포함', included: true },
              { text: '영상 콘텐츠 제작', included: true },
              { text: 'SNS 통합 관리', included: true },
              { text: '광고 캠페인 세팅', included: true },
              { text: '우선 지원', included: true },
              { text: '주간 성과 리포트', included: true },
              { text: 'A/B 테스트 운영', included: true },
              { text: 'VIP 전담 매니저', included: true },
            ],
            ctaText: '프리미엄 상담',
            ctaHref: '#consultation',
          },
        ]}
        bottomNote="모든 플랜은 언제든 해지 가능하며, 잔여 기간까지 서비스가 유지됩니다."
      />

      {/* Price Comparison Box */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              이 비용, 비싸다고 느끼신다면 비교해보세요
            </h3>
            <div className="space-y-3">
              {[
                { label: '마케팅 담당자 1명 채용', price: '₩350만/월~', note: '퇴사 리스크, 교육 비용 별도' },
                { label: '업체 교체 시 재제작', price: '₩500만+ / 6개월', note: '매번 처음부터 다시' },
                { label: '전환 안 되는 홈페이지 광고비', price: '₩156만+/월', note: '매달 증발하는 광고비' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.note}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 line-through">{item.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-2 bg-blue-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-blue-700">플라톤 GROWTH</p>
                  <p className="text-xs text-blue-500">5인 전담팀 + 검증된 성과</p>
                </div>
                <span className="text-lg font-bold text-blue-700">₩300만/월</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <div id="testimonials">
        <ServiceTestimonials
          headline="원장님들의 실제 후기"
          subHeadline="결과로 증명합니다"
          testimonials={[
            {
              name: 'K 원장님',
              role: '강남 피부과',
              content: '이전엔 광고비만 쓰고 환자는 없었어요. 그런데 플라톤은 다르더군요. 매출이 2배 이상 뛰었습니다.',
              result: '매출 2배 이상 증가',
              rating: 5,
            },
            {
              name: '안경모 원장님',
              role: '서울 한의원',
              content: '대표가 직접 미팅 오고, 작가님들과 팀이 따로 붙는다는 게 진짜 신뢰됐어요. 결과도 확실했습니다.',
              result: '신환 386% 증가',
              rating: 5,
            },
            {
              name: 'L 원장님',
              role: '분당 치과',
              content: '마침내 찾았다. 바로 여기다..! 6개월마다 업체를 바꾸던 제가 3년째 함께하고 있습니다.',
              result: '3년 장기 계약 유지 중',
              rating: 5,
            },
          ]}
        />
      </div>

      {/* FAQ */}
      <ServiceFAQ
        headline="자주 묻는 질문"
        items={[
          {
            question: '제작 기간은 얼마나 걸리나요?',
            answer: '보통 4~6주 소요됩니다. 브랜드 스터디(1주) → 기획/디자인(2~3주) → 개발/최적화(1~2주)의 체계적인 프로세스로 진행됩니다. 철저한 사전 작업으로 수정 횟수를 최소화하면서도 높은 품질을 보장합니다.',
          },
          {
            question: '기존 홈페이지 리뉴얼도 가능한가요?',
            answer: '네, 가능합니다. 오히려 기존 사이트의 데이터를 활용할 수 있어 더 효과적인 경우가 많습니다. 기존 콘텐츠 마이그레이션, URL 리디렉션 등 SEO 유지 작업도 포함됩니다.',
          },
          {
            question: '의료광고법 위반은 없나요?',
            answer: '4년간 법적 문제 0건입니다. 자체 의료광고법 필터링 시스템을 운영하고 있으며, 모든 콘텐츠는 법적 검토를 거친 후 게시됩니다. 의료법, 의료광고심의 기준을 철저히 준수합니다.',
          },
          {
            question: '왜 제작비가 무료이고 월 구독료인가요?',
            answer: '초기 비용 부담 없이 시작할 수 있도록 한 모델입니다. 월 구독 기간 동안 지속적인 성과 관리, 콘텐츠 업데이트, 기술 유지보수를 제공합니다. 일회성 제작이 아닌 지속적인 성과 개선이 핵심입니다.',
          },
          {
            question: '해지하면 어떻게 되나요?',
            answer: '언제든 해지 가능하며, 잔여 구독 기간까지 서비스가 유지됩니다. 해지 후에는 홈페이지 소유권 이전 등 원만한 전환을 도와드립니다. 위약금은 없습니다.',
          },
          {
            question: '제작 후 수정은 어떻게 하나요?',
            answer: 'GROWTH 이상 플랜은 무제한 수정이 포함되어 있습니다. STARTER 플랜도 3개월간 무료 유지보수를 제공합니다. 매월 정기 리포트를 통해 개선 포인트를 도출하고 지속적으로 최적화합니다.',
          },
        ]}
      />

      {/* Consultation Form */}
      <ServiceConsultationForm
        serviceType="HOMEPAGE"
        headline="무료 홈페이지 진단 받기"
        subHeadline="현재 홈페이지 전환율 분석 + 경쟁사 비교 리포트를 무료로 받아보세요. 50만원 상당의 진단을 무료로 제공합니다."
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p>플라톤마케팅 | 사업자등록번호: 000-00-00000</p>
          <p className="mt-1">서울특별시 강남구 | 대표: 홍길동 | 문의: 1588-0000</p>
          <p className="mt-3 text-gray-500">&copy; 2026 Platon Marketing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

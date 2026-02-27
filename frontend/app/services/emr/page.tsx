'use client';

import {
  Stethoscope, Mic, Cloud, Smartphone, Shield,
  Clock, CreditCard, FileCheck, Users, Zap,
  Monitor, Wifi, Database, Lock, ClipboardCheck,
  Settings, Rocket, HeadphonesIcon, BarChart3, Globe
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

export default function EMRServicePage() {
  return (
    <div className="min-h-screen">
      <ServiceStickyHeader
        title="PlatonEMR"
        navItems={[
          { label: '문제점', href: '#problems' },
          { label: '솔루션', href: '#solutions' },
          { label: '비교', href: '#comparison' },
          { label: '가격', href: '#pricing' },
          { label: '후기', href: '#testimonials' },
        ]}
        ctaText="무료 데모 신청"
        ctaHref="#consultation"
        homeHref="/"
      />

      {/* Hero */}
      <ServiceHero
        badge="STARTER 평생 무료 | 클라우드 네이티브 SaaS"
        headline="차트 쓰는 시간을 반으로, 환자 보는 시간을 두 배로"
        subHeadline="AI가 진료 내용을 듣고 차트를 자동으로 완성합니다. 설치 없이 웹 브라우저만 있으면 어디서든 진료 가능."
        description="100개 이상 의원이 선택한 클라우드 EMR. 보험청구부터 CRM까지, 진료에만 집중하세요."
        stats={[
          { value: '50%', label: '차트 시간 절감' },
          { value: '100+', label: '도입 의원' },
          { value: '97%', label: '재계약률' },
          { value: '40%', label: '비용 절감' },
        ]}
        ctaText="무료 데모 신청"
        ctaHref="#consultation"
        secondaryCta={{ text: '가격 보기', href: '#pricing' }}
      />

      {/* Problems */}
      <div id="problems">
        <ServiceProblemSection
          badge="기존 EMR, 이런 불편 겪고 계시죠?"
          headline="10년 된 EMR이 원장님의 시간과 돈을 잡아먹고 있습니다"
          subHeadline="경쟁사 공통 약점 — 아직도 이런 EMR을 쓰고 계신가요?"
          problems={[
            {
              icon: Monitor,
              title: '10년 전 화면, 10년 전 속도',
              description: '2000년대에 만들어진 UI, 복잡한 메뉴 구조, 느린 로딩. 직원 교육만 2주, 진료 중 화면 전환에만 하루 30분을 허비합니다.',
              stat: '30분/일',
              statLabel: 'UI 비효율 시간',
            },
            {
              icon: Clock,
              title: '차트 쓰느라 환자 못 보는 3시간',
              description: '하루 50명 진료, 환자당 3분씩 차트 작성. AI 음성인식도 없고, 복붙도 불편한 구형 EMR에서 하루 3시간이 차트에 묶입니다.',
              stat: '3시간/일',
              statLabel: '차트 작성 시간',
            },
            {
              icon: CreditCard,
              title: '가격이 얼마인지 모르겠다',
              description: '초기 설치비 수백만 원, 유지보수비 별도, 업그레이드비 별도. 영업사원마다 견적이 다르고, 숨겨진 비용이 곳곳에 있습니다.',
              stat: '???만원',
              statLabel: '불투명한 가격',
            },
            {
              icon: Wifi,
              title: 'PC 고장나면 진료 중단',
              description: '서버가 병원 안에 있어서 PC 고장, 정전, 랜섬웨어 한 번이면 진료가 올스톱. 백업도 수동, 복구도 불확실합니다.',
              stat: '100%',
              statLabel: '온프레미스 의존',
            },
          ]}
          bottomCallout={{
            amount: '연간 ₩2,400만원+',
            label: '비효율적인 EMR로 매년 잃는 시간과 비용',
            description: 'EMR 교체가 두렵다고요? 바꾸지 않는 비용이 훨씬 더 큽니다.',
          }}
        />
      </div>

      {/* Solutions */}
      <div id="solutions">
        <ServiceSolutionSection
          badge="PlatonEMR이 다른 이유"
          headline="진료에만 집중하세요. 나머지는 AI가 합니다"
          subHeadline="14개 핵심 기능을 하나의 클라우드 플랫폼에 통합했습니다"
          solutions={[
            {
              icon: Mic,
              title: 'AI 차트 작성 & 음성인식',
              description: '진료 중 말씀만 하세요. AI가 음성을 인식하고, 진료 내용을 자동으로 SOAP 차트로 변환합니다. 차트 작성 시간 50% 절감.',
              highlights: ['실시간 음성→텍스트 변환', 'SOAP 형식 자동 구조화', 'AI 추천 진단코드 & 처방'],
            },
            {
              icon: Users,
              title: '키오스크 + CRM + 예약 연동',
              description: '환자가 도착하면 키오스크에서 자동 접수. CRM으로 리콜/생일 문자 자동 발송. 온라인 예약과 실시간 연동.',
              highlights: ['무인 접수 키오스크', '자동 리콜 & 마케팅 CRM', '온라인 예약 ↔ EMR 실시간 동기화'],
            },
            {
              icon: FileCheck,
              title: '보험청구 & DUR 간소화',
              description: '진료와 동시에 보험청구 데이터가 자동 생성됩니다. DUR 실시간 체크, 심사 반려율 최소화. 청구 누락 0건을 목표로.',
              highlights: ['자동 보험청구 데이터 생성', '실시간 DUR 점검', '심사 반려 사전 예방 알림'],
            },
            {
              icon: Cloud,
              title: '클라우드 + 모바일 + 환자포털',
              description: '설치 없이 크롬만 있으면 어디서든 접속. 모바일 앱으로 외출 중에도 차트 확인. 환자포털로 예약/결과 조회까지.',
              highlights: ['웹 브라우저 기반 (설치 불필요)', '모바일 앱 (iOS/Android)', '오픈 API 연동 지원'],
            },
          ]}
        />
      </div>

      {/* Comparison Table */}
      <div id="comparison">
        <ServiceComparisonTable
          headline="기존 EMR vs PlatonEMR"
          subHeadline="같은 EMR이 아닙니다. 세대가 다릅니다."
          columns={[
            { name: '기존 EMR' },
            { name: 'PlatonEMR', highlight: true, badge: '추천' },
          ]}
          rows={[
            { label: '설치 방식', values: ['PC 설치 (온프레미스)', '클라우드 (설치 불필요)'] },
            { label: 'AI 차트 작성', values: [false, true] },
            { label: '음성인식', values: [false, true] },
            { label: '모바일 접속', values: [false, true] },
            { label: '자동 보험청구', values: ['수동 입력', 'AI 자동 생성'] },
            { label: 'DUR 실시간 체크', values: ['별도 창', '진료 화면 내장'] },
            { label: '키오스크 연동', values: ['별도 구매', '기본 포함'] },
            { label: 'CRM/예약 연동', values: ['별도 비용', '기본 포함'] },
            { label: '가격 투명성', values: ['영업사원 견적', '홈페이지 공개'] },
            { label: '데이터 백업', values: ['수동', '자동 (매일)'] },
          ]}
          resultRow={{
            label: '결과',
            values: ['차트에 묶인 3시간', '환자에 집중하는 시간'],
          }}
        />
      </div>

      {/* Process */}
      <ServiceProcessSteps
        headline="도입 프로세스"
        subHeadline="2주면 충분합니다. 데이터 이전까지 무료로 도와드립니다"
        steps={[
          {
            icon: HeadphonesIcon,
            title: '무료 상담 & 데모',
            description: '원장님 진료 환경에 맞는 맞춤 데모. 기존 EMR 데이터 이전 가능 여부 확인.',
            duration: '당일',
          },
          {
            icon: Database,
            title: '데이터 이전',
            description: '기존 EMR의 환자 데이터, 차트 이력, 예약 정보를 안전하게 마이그레이션.',
            duration: '1주차',
          },
          {
            icon: Settings,
            title: '맞춤 세팅',
            description: '진료과별 차트 템플릿, 처방 세트, 보험청구 설정을 원장님 스타일에 맞게 구성.',
            duration: '2주차',
          },
          {
            icon: Rocket,
            title: '운영 시작',
            description: '전담 매니저가 안정화까지 동행. 직원 교육, 문제 해결 즉시 대응.',
            duration: '2주차~',
          },
        ]}
      />

      {/* Pricing */}
      <div id="pricing">
        <ServicePricingCards
          headline="투명한 가격 정책"
          subHeadline="숨겨진 비용 없이, 월 구독료만 내시면 됩니다"
          freeLabel="STARTER 평생 무료 — 카드 등록 없이 바로 시작하세요"
          tiers={[
            {
              name: 'STARTER',
              price: '무료',
              priceUnit: '',
              description: '1인 의원 / 소규모 클리닉',
              badge: '평생 무료',
              features: [
                { text: '클라우드 EMR 기본 기능', included: true },
                { text: '보험청구 & DUR', included: true },
                { text: '기본 차트 템플릿', included: true },
                { text: '이메일 지원', included: true },
                { text: '데이터 자동 백업', included: true },
                { text: 'AI 음성인식', included: false },
                { text: '키오스크 & CRM', included: false },
                { text: '전담 매니저', included: false },
              ],
              ctaText: '무료로 시작하기',
              ctaHref: '/subscription/emr',
            },
            {
              name: 'GROWTH',
              price: '₩120만',
              priceUnit: '/월',
              description: '2~5인 의원 / 성장하는 클리닉',
              highlight: true,
              popularLabel: '가장 많이 선택',
              features: [
                { text: 'STARTER 전체 포함', included: true },
                { text: 'AI 음성인식 차트 작성', included: true },
                { text: '키오스크 + CRM 연동', included: true },
                { text: '온라인 예약 시스템', included: true },
                { text: '모바일 앱', included: true },
                { text: '전담 매니저 배정', included: true },
                { text: '환자포털', included: true },
                { text: '무제한 직원 계정', included: true },
              ],
              ctaText: '가장 인기있는 플랜',
              ctaHref: '#consultation',
              badge: '추천',
            },
            {
              name: 'PREMIUM',
              price: '₩250만',
              priceUnit: '/월',
              description: '다지점 / 대형 의원 / 병원',
              features: [
                { text: 'GROWTH 전체 포함', included: true },
                { text: '다지점 통합 관리', included: true },
                { text: '맞춤 개발 (API 연동)', included: true },
                { text: '오픈 API 제공', included: true },
                { text: '우선 기술 지원 (SLA)', included: true },
                { text: '경영 분석 대시보드', included: true },
                { text: '전용 서버 옵션', included: true },
                { text: 'VIP 전담 매니저', included: true },
              ],
              ctaText: '프리미엄 상담',
              ctaHref: '#consultation',
            },
          ]}
          bottomNote="STARTER는 평생 무료. 유료 플랜도 언제든 해지 가능하며, 잔여 기간까지 서비스가 유지됩니다."
        />
      </div>

      {/* Price Comparison Box */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              기존 EMR 비용과 비교해보세요
            </h3>
            <div className="space-y-3">
              {[
                { label: 'EMR 초기 설치비', price: '₩300~800만', note: '서버 + 설치 + 세팅 + 교육' },
                { label: '연간 유지보수비', price: '₩120~240만/년', note: '업데이트, 장애 대응 별도' },
                { label: '서버 교체 (3~5년마다)', price: '₩200~400만', note: '하드웨어 노후화 시 필수' },
                { label: '키오스크/CRM 별도 구매', price: '₩100~300만', note: '연동 비용 추가' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.note}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500 line-through">{item.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-2 bg-green-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-green-700">PlatonEMR STARTER</p>
                  <p className="text-xs text-green-600">클라우드 EMR + 보험청구 + DUR 기본 포함</p>
                </div>
                <span className="text-lg font-bold text-green-700">₩0 무료</span>
              </div>
              <div className="flex items-center justify-between mt-2 bg-blue-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-blue-700">PlatonEMR GROWTH</p>
                  <p className="text-xs text-blue-500">AI 차트 + 키오스크 + CRM 모두 포함</p>
                </div>
                <span className="text-lg font-bold text-blue-700">₩120만/월</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <div id="testimonials">
        <ServiceTestimonials
          headline="원장님들의 실제 후기"
          subHeadline="EMR을 바꾸고 달라진 일상"
          testimonials={[
            {
              name: 'P 원장님',
              role: '서울 내과',
              content: '하루 3시간 차트 작성이 1시간 반으로 줄었습니다. 음성인식 정확도가 놀랍고, 환자와 눈을 마주칠 시간이 생겼어요.',
              result: '차트 시간 50% 절감',
              rating: 5,
            },
            {
              name: 'C 원장님',
              role: '분당 치과',
              content: '키오스크부터 예약, CRM까지 별도로 구매할 필요가 없어서 오히려 비용이 줄었습니다. 클라우드라 어디서든 접속되는 것도 큰 장점.',
              result: '통합 비용 40% 절감',
              rating: 5,
            },
            {
              name: 'K 원장님',
              role: '강남 피부과',
              content: '기존 EMR 데이터 이전이 걱정이었는데, 전담 매니저가 2주 만에 깔끔하게 처리해줬습니다. 직원들도 하루 만에 적응했어요.',
              result: '2주 만에 완전 전환',
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
            question: '기존 EMR 데이터를 이전할 수 있나요?',
            answer: '네, 대부분의 주요 EMR(닥터팔레트, 스마트닥터, 비트컴퓨터 등)에서 데이터 이전이 가능합니다. 환자 기본 정보, 차트 이력, 예약 데이터, 보험청구 이력 등을 안전하게 마이그레이션합니다. 전담 매니저가 전체 과정을 무료로 지원합니다.',
          },
          {
            question: '인터넷이 끊기면 진료를 못 하나요?',
            answer: '오프라인 모드를 지원합니다. 인터넷 연결이 일시적으로 끊겨도 로컬 캐시로 진료를 계속할 수 있으며, 연결이 복구되면 자동으로 동기화됩니다. 또한 99.9% 가동률 SLA를 보장합니다.',
          },
          {
            question: '환자 데이터 보안은 안전한가요?',
            answer: 'AWS 의료 전용 클라우드에서 운영되며, 개인정보보호법 및 의료법에 따른 보안 인증을 취득했습니다. 데이터는 AES-256으로 암호화되고, 매일 자동 백업됩니다. 접근 로그 감사 추적도 지원합니다.',
          },
          {
            question: '어떤 진료과에서 사용할 수 있나요?',
            answer: '내과, 외과, 치과, 피부과, 한의원, 안과, 이비인후과 등 대부분의 진료과를 지원합니다. 진료과별 특화 차트 템플릿과 처방 세트가 미리 구성되어 있으며, 원장님 스타일에 맞게 커스터마이징 가능합니다.',
          },
          {
            question: '도입 기간은 얼마나 걸리나요?',
            answer: '평균 2주입니다. 1주차에 데이터 이전과 맞춤 세팅, 2주차에 직원 교육과 병행 운영을 진행합니다. 전담 매니저가 안정화까지 동행하며, 급한 경우 최단 3일 내 도입도 가능합니다.',
          },
          {
            question: '구독을 해지하면 데이터는 어떻게 되나요?',
            answer: '해지 시 잔여 구독 기간까지 서비스가 유지됩니다. 만료 후 90일간 데이터를 보관하며, 이 기간 내 데이터를 백업 파일로 다운로드하거나 다른 EMR로 이전할 수 있도록 도와드립니다. 위약금은 없습니다.',
          },
        ]}
      />

      {/* Consultation Form */}
      <ServiceConsultationForm
        serviceType="EMR"
        headline="무료 EMR 데모 신청하기"
        subHeadline="30분 데모로 PlatonEMR의 차이를 직접 체험해보세요. 데이터 이전 가능 여부까지 무료로 확인해드립니다."
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p>메디플라톤 | 사업자등록번호: 000-00-00000</p>
          <p className="mt-1">서울특별시 강남구 | 대표: 홍길동 | 문의: 1588-0000</p>
          <p className="mt-3 text-gray-500">&copy; 2026 MediPlaton. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

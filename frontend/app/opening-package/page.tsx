'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  BarChart3, Building2, CreditCard, Megaphone,
  ClipboardCheck, MapPin, Shield, Calculator,
  CheckCircle2, Circle, ArrowRight,
  Send, Loader2, Phone, User, MessageSquare,
  Stethoscope, Calendar, MapPinned,
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
  ServiceStickyHeader,
} from '@/components/services';

/* ─────────────────── 개원 체크리스트 섹션 ─────────────────── */
function OpeningChecklist() {
  const items = [
    { label: '입지 선정', badge: 'AI 상권분석 무료', solved: true },
    { label: '매물 계약', badge: '중개수수료 0원', solved: true },
    { label: '인테리어', badge: '제휴 업체 소개 가능', solved: false },
    { label: '의료기기', badge: '제휴 업체 소개 가능', solved: false },
    { label: 'PG 단말기', badge: '무료 설치', solved: true },
    { label: '개원 대출', badge: '제휴 금융사 연결', solved: true },
    { label: '마케팅', badge: '6개월 무상 지원', solved: true },
    { label: '보험청구', badge: 'AI 삭감 방지', solved: true },
    { label: '세무 절세', badge: '경정청구 대행', solved: true },
  ];
  const solvedCount = items.filter((i) => i.solved).length;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            개원 준비, 어디까지 하셨나요?
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            체크가 안 된 항목, 메디플라톤이 해결해드립니다
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Checklist */}
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  item.solved
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {item.solved ? (
                  <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
                <span className="font-medium text-gray-900 flex-1">{item.label}</span>
                <span
                  className={`text-xs font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${
                    item.solved
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {item.badge}
                </span>
              </div>
            ))}

            <div className="mt-6 p-5 rounded-xl bg-blue-600 text-white text-center">
              <p className="font-bold text-lg">
                {items.length}개 항목 중 {solvedCount}개를 메디플라톤이 해결합니다
              </p>
              <a
                href="#consultation"
                className="inline-flex items-center gap-2 mt-3 text-sm text-blue-100 hover:text-white transition-colors"
              >
                무료 상담 받기 <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/popup-checklist.jpg"
              alt="개원 체크리스트"
              width={600}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 비용 절감 비교 박스 ─────────────────── */
function CostSavingsSection() {
  const items = [
    { label: '상권분석 컨설팅', cost: '₩300만' },
    { label: '상가 중개수수료', cost: '₩300~450만' },
    { label: 'PG 설치비', cost: '₩50~100만' },
    { label: '마케팅 6개월', cost: '₩900~3,000만' },
    { label: '경정청구 세무사 수수료', cost: '₩100~200만' },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            이 패키지, 진짜 무료인 이유
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left: 일반 개원 비용 */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-500 mb-6">일반 개원 시 비용</h3>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-400 line-through font-medium">{item.cost}</span>
                </div>
              ))}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">합계</span>
                  <span className="text-red-500 font-bold text-xl line-through">
                    ₩1,550~3,850만
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 메디플라톤 패키지 */}
          <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-100 mb-6">메디플라톤 패키지</h3>
              <div className="text-6xl font-black mb-2">₩0</div>
              <div className="inline-block bg-blue-500 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
                PG 24개월 이용 약정
              </div>
            </div>
            <div className="text-blue-100 leading-relaxed text-sm space-y-2">
              <p>원장님의 매출이 올라야 저희 수익도 올라갑니다.</p>
              <p>그래서 초기 비용은 저희가 투자하는 겁니다.</p>
              <p className="text-white font-bold text-base mt-4">
                공짜가 아니라, 성공 보수제입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 개원 상담 폼 (커스텀) ─────────────────── */
function OpeningConsultationForm() {
  const [form, setForm] = useState({
    hospital_name: '',
    doctor_name: '',
    phone: '',
    specialty: '',
    region: '',
    timeline: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctor_name || !form.phone || !form.specialty) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.doctor_name,
          email: `${form.phone.replace(/[^0-9]/g, '')}@opening.mediplaton.com`,
          subject: `[개원패키지] ${form.specialty} / ${form.region || '미정'} / ${form.timeline || '미정'}`,
          message: [
            `병원명(예정): ${form.hospital_name || '미정'}`,
            `진료과: ${form.specialty}`,
            `희망 지역: ${form.region || '미정'}`,
            `개원 시기: ${form.timeline || '미정'}`,
            `연락처: ${form.phone}`,
            form.message ? `추가 문의: ${form.message}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });

      if (!res.ok) throw new Error('서버 오류');
      setStatus('success');
    } catch {
      setErrorMsg('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="py-16 md:py-24 bg-blue-600" id="consultation">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              상담 신청이 완료되었습니다!
            </h3>
            <p className="text-gray-600">24시간 내에 담당자가 연락드리겠습니다.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-blue-600" id="consultation">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div className="text-white">
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              무료 개원 상담 신청
            </h2>
            <p className="mt-4 text-blue-100 text-lg leading-relaxed">
              상권분석 리포트 + 맞춤 매물 추천을 무료로 받아보세요. 강매 절대 없습니다.
            </p>

            <div className="mt-8 space-y-3">
              {[
                '폼 작성 30초',
                '24시간 내 맞춤 상담',
                '강매 절대 없음',
                '상담 후 진행 여부 자유',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-blue-100 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-6">무료 개원 상담 신청</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  병원명 (예정)
                </label>
                <input
                  type="text"
                  value={form.hospital_name}
                  onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
                  placeholder="예) OO내과의원"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4" />
                  원장님 성함 *
                </label>
                <input
                  type="text"
                  required
                  value={form.doctor_name}
                  onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4" />
                  연락처 *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Stethoscope className="w-4 h-4" />
                  진료과 *
                </label>
                <select
                  required
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">선택해주세요</option>
                  <option value="내과">내과</option>
                  <option value="피부과">피부과</option>
                  <option value="치과">치과</option>
                  <option value="한의원">한의원</option>
                  <option value="정형외과">정형외과</option>
                  <option value="안과">안과</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPinned className="w-4 h-4" />
                  희망 개원 지역
                </label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="예) 서울 강남구, 경기 분당 등"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  예상 개원 시기
                </label>
                <select
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">선택해주세요</option>
                  <option value="3개월 이내">3개월 이내</option>
                  <option value="6개월 이내">6개월 이내</option>
                  <option value="1년 이내">1년 이내</option>
                  <option value="미정">미정</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  추가 문의사항 (선택)
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="예) 현재 근무 중인 병원 퇴사 예정, 대출 상담도 함께 원합니다..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                무료 개원 상담 신청하기
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════ 메인 페이지 ═══════════════════ */
export default function OpeningPackagePage() {
  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <ServiceStickyHeader
        title="메디플라톤 개원패키지"
        navItems={[
          { label: '문제점', href: '#problems' },
          { label: '솔루션', href: '#solutions' },
          { label: '프로세스', href: '#process' },
          { label: '가격', href: '#pricing' },
          { label: '후기', href: '#testimonials' },
        ]}
        ctaText="무료 개원 상담"
        ctaHref="#consultation"
      />

      {/* Hero */}
      <ServiceHero
        badge="중개수수료 0원 | PG 설치비 0원 | 마케팅비 0원"
        headline={'입지 분석부터 개원 후 안정화까지\n메디플라톤이 책임집니다'}
        subHeadline="우리가 추천한 자리에서 개원하시면, 6개월간 마케팅을 무료로 지원합니다. 잘 되게 만들어야 하는 건 원장님만이 아니라 저희도 마찬가지니까요."
        stats={[
          { value: '2580만원', label: '무료 마케팅 지원 가치' },
          { value: '386%', label: '평균 신환 증가율' },
          { value: '6개월', label: '안정화 마케팅 기간' },
          { value: '0원', label: '초기 비용' },
        ]}
        ctaText="무료 개원 상담 받기"
        ctaHref="#consultation"
        secondaryCta={{ text: '패키지 상세 보기', href: '#pricing' }}
      />

      {/* Problems */}
      <div id="problems">
        <ServiceProblemSection
          badge="매일 3곳의 병원이 문을 닫습니다"
          headline="개원 첫 6개월이 병원의 생존을 결정합니다"
          subHeadline="한 해 1,000개 이상 폐업. 대부분 개원 초기 환자 확보 실패가 원인입니다"
          problems={[
            {
              icon: MapPin,
              title: '입지 선정 실패',
              description:
                '상권 분석 없이 감으로 선택한 자리, 3년 안에 60%가 이전하거나 폐업',
              stat: '60%',
              statLabel: '3년 내 이전/폐업률',
            },
            {
              icon: Megaphone,
              title: '초기 마케팅 부재',
              description:
                '개원 첫 3개월 환자가 없으면 운영 자금이 고갈, 악순환 시작',
              stat: '3개월',
              statLabel: '골든타임',
            },
            {
              icon: CreditCard,
              title: 'PG/결제 과다 수수료',
              description:
                '기존 VAN사 수수료 2.5%+, 매출 5천만 기준 월 125만원 이상 유출',
              stat: '125만원+',
              statLabel: '월 수수료 지출',
            },
            {
              icon: Building2,
              title: '중개수수료 부담',
              description:
                '상가 임대차 중개수수료 최대 0.9%, 보증금 5억이면 450만원',
              stat: '450만원',
              statLabel: '중개수수료 (보증금 5억 기준)',
            },
          ]}
          bottomCallout={{
            amount: '연간 2,000만원+',
            label: '개원 초기 잘못된 선택으로 잃는 비용',
            description:
              '입지, 마케팅, PG — 하나만 잘못돼도 2천만원이 날아갑니다.',
          }}
        />
      </div>

      {/* Solutions */}
      <div id="solutions">
        <ServiceSolutionSection
          badge="메디플라톤의 해결책"
          headline="개원에 필요한 모든 것을 0원으로"
          subHeadline="원장님은 진료 준비에만 집중하세요. 나머지는 저희가 합니다."
          solutions={[
            {
              icon: BarChart3,
              title: 'AI 상권분석으로 최적 입지 추천',
              description:
                '심평원, 국토부, 상권 데이터를 종합 분석. 진료과별 경쟁강도, 유동인구, 배후수요를 고려한 데이터 기반 입지를 추천합니다.',
              highlights: [
                '진료과별 맞춤 상권 리포트',
                '경쟁 병원 분석',
                '예상 매출 시뮬레이션',
              ],
            },
            {
              icon: Building2,
              title: '추천 입지 매물 중개 (수수료 0원)',
              description:
                '분석 결과에 맞는 최적 매물을 찾아드립니다. 임대차 협상부터 계약까지, 중개수수료는 메디플라톤이 부담합니다.',
              highlights: [
                '법정 중개수수료 전액 면제',
                '임대 조건 협상 대행',
                '계약서 검토 지원',
              ],
            },
            {
              icon: CreditCard,
              title: 'PG 결제 시스템 무료 설치',
              description:
                '토스페이먼츠 기반 최신 결제 시스템을 무료로 설치합니다. 카드, 간편결제, 현금영수증 — 기존 VAN보다 낮은 수수료율.',
              highlights: [
                '설치비 0원',
                '기존 대비 낮은 수수료',
                '카드/간편결제/현금영수증 통합',
              ],
            },
            {
              icon: Megaphone,
              title: '개원 후 6개월 무상 마케팅',
              description:
                '우리가 추천한 자리에서 안 되면, 우리 분석이 틀린 겁니다. 그래서 안정화까지 마케팅을 책임집니다. 최대 2,580만원 상당.',
              highlights: [
                '네이버 플레이스 최적화',
                '블로그/SNS 마케팅',
                '전담 마케터 1:1 배정',
              ],
            },
            {
              icon: Shield,
              title: '보험청구 AI 자동화',
              description:
                '심평원 청구 전 AI가 삭감 위험을 분석합니다. 코드 조합 패턴을 사전 점검하여 평균 삭감률 50% 감소.',
              highlights: [
                'AI 삭감 리스크 사전 분석',
                '일괄 심평원 전송',
                '코드별 통과율 예측',
              ],
            },
            {
              icon: Calculator,
              title: '경정청구 세금환급',
              description:
                'AI가 놓친 공제를 찾아 세금을 돌려받습니다. 보험청구 데이터 기반 의료비 세액공제를 자동 스캔. 성공 보수제(환급액의 10~15%)로 부담 없이.',
              highlights: [
                'AI 자동 공제 스캔',
                '성공 보수제 (10~15%)',
                '환급 실패 시 수수료 0원',
              ],
            },
          ]}
        />
      </div>

      {/* 개원 체크리스트 */}
      <OpeningChecklist />

      {/* Comparison Table */}
      <div id="comparison">
        <ServiceComparisonTable
          headline="일반 개원 vs 메디플라톤 패키지"
          subHeadline="같은 개원, 비용은 0원"
          columns={[
            { name: '일반 개원' },
            { name: '메디플라톤 패키지', highlight: true, badge: '추천' },
          ]}
          rows={[
            { label: '상권분석', values: ['유료 (200~500만원)', '무료 (AI 분석)'] },
            { label: '중개수수료', values: ['법정 수수료 부담', '0원'] },
            { label: 'PG 설치', values: ['설치비 50~100만원', '0원'] },
            { label: 'PG 수수료', values: ['VAN 2.5%+', '업계 최저 수준'] },
            {
              label: '개원 마케팅',
              values: ['별도 계약 (월 150~500만원)', '6개월 무상 (최대 2,580만원)'],
            },
            { label: '개원 대출', values: ['직접 알아봄', '제휴 금융사 연결'] },
            { label: '보험청구', values: ['수작업 (삭감률 5%+)', 'AI 자동화 (삭감률 2%)'] },
            { label: '세무 절세', values: ['세무사 별도 (20~30% 수수료)', 'AI 자동 스캔 (10~15%)'] },
            { label: '전담 매니저', values: [false, true] },
            { label: '성과 리포트', values: [false, true] },
          ]}
          resultRow={{
            label: '초기 비용 합계',
            values: ['1,000만원+', '0원'],
          }}
        />
      </div>

      {/* Process Steps */}
      <div id="process">
        <ServiceProcessSteps
          headline="4단계로 끝나는 개원 준비"
          subHeadline="상담부터 개원 후 안정화까지, 원스톱으로 진행합니다"
          steps={[
            {
              icon: ClipboardCheck,
              title: '무료 상담 & 상권분석',
              description:
                '희망 진료과, 지역, 예산을 바탕으로 AI 상권분석 리포트를 제공합니다.',
              duration: '1~2일',
            },
            {
              icon: Building2,
              title: '최적 매물 중개',
              description:
                '분석 결과 기반 매물 추천, 현장 답사, 임대 조건 협상, 계약까지.',
              duration: '2~4주',
            },
            {
              icon: CreditCard,
              title: 'PG 설치 & 개원 세팅',
              description:
                '결제 시스템 설치, 개원 대출 연결, 인테리어 업체 소개.',
              duration: '개원 전',
            },
            {
              icon: Megaphone,
              title: '6개월 마케팅 집중 지원',
              description:
                '네이버 플레이스, 블로그, SNS 마케팅으로 초기 환자 확보. 전담 마케터 배정.',
              duration: '개원 후 6개월',
            },
          ]}
        />
      </div>

      {/* Pricing Cards */}
      <div id="pricing">
        <ServicePricingCards
          headline="패키지 선택"
          subHeadline="모든 패키지 초기 비용 0원. PG 이용 약정만 하시면 됩니다."
          freeLabel="초기 비용 ₩0 — 중개·마케팅·PG 설치 전부 무료"
          tiers={[
            {
              name: '기본',
              price: '₩0',
              priceUnit: '/초기비용',
              description: 'PG 설치 + 기본 마케팅',
              features: [
                { text: 'PG 결제 시스템 무료 설치', included: true },
                { text: '네이버 플레이스 기본 세팅', included: true },
                { text: '블로그 마케팅 3개월', included: true },
                { text: '기본 SEO 최적화', included: true },
                { text: 'EMR 기본 (STARTER 무료)', included: true },
                { text: 'AI 청구 분석', included: false },
                { text: '경정청구 대행', included: false },
                { text: '상권분석 리포트', included: false },
                { text: '입지 중개 수수료 면제', included: false },
                { text: '전담 마케터 배정', included: false },
                { text: 'SNS 마케팅', included: false },
              ],
              ctaText: '기본 패키지 상담',
              ctaHref: '#consultation',
            },
            {
              name: '플러스',
              price: '₩0',
              priceUnit: '/초기비용',
              badge: '추천',
              description: 'PG + 중개 + 마케팅 6개월',
              highlight: true,
              popularLabel: '가장 많이 선택',
              features: [
                { text: '기본 패키지 전체 포함', included: true },
                { text: 'AI 상권분석 리포트', included: true },
                { text: '입지 중개 수수료 0원', included: true },
                { text: '블로그 + SNS 마케팅 6개월', included: true },
                { text: '전담 마케터 1:1 배정', included: true },
                { text: 'EMR 기본', included: true },
                { text: 'AI 청구 분석', included: true },
                { text: '경정청구 대행', included: false },
                { text: '월간 성과 리포트', included: true },
                { text: '개원 대출 연결', included: false },
                { text: '홈페이지 제작', included: false },
              ],
              ctaText: '플러스 패키지 상담',
              ctaHref: '#consultation',
            },
            {
              name: '프리미엄',
              price: '₩0',
              priceUnit: '/초기비용',
              description: '올인원 (PG + 중개 + 대출 + 마케팅 + 홈페이지)',
              features: [
                { text: '플러스 패키지 전체 포함', included: true },
                { text: 'EMR 기본', included: true },
                { text: 'AI 청구 분석', included: true },
                { text: '경정청구 대행', included: true },
                { text: '제휴 금융사 개원 대출 연결', included: true },
                { text: '병원 홈페이지 제작 (₩300만 상당)', included: true },
                { text: '카페 프로필 세팅', included: true },
                { text: '영상 콘텐츠 제작', included: true },
                { text: '온라인 광고 캠페인 세팅', included: true },
                { text: '주간 성과 리포트', included: true },
                { text: 'VIP 전담 매니저', included: true },
              ],
              ctaText: '프리미엄 패키지 상담',
              ctaHref: '#consultation',
            },
          ]}
          bottomNote="모든 패키지는 PG 24개월 이용 약정이 포함됩니다. 중도 해지 시 잔여 마케팅 비용이 청구될 수 있습니다."
        />
      </div>

      {/* 비용 절감 비교 박스 */}
      <CostSavingsSection />

      {/* Testimonials */}
      <div id="testimonials">
        <ServiceTestimonials
          headline="개원에 성공한 원장님들의 후기"
          subHeadline="메디플라톤 패키지로 시작한 원장님들"
          testimonials={[
            {
              name: '박O진 원장님',
              role: '강남 피부과 | 2025년 개원',
              content:
                '상권분석 리포트를 보고 결정했는데, 진짜 데이터대로 되더라고요. 개원 3개월 만에 하루 30명 넘게 오기 시작했습니다.',
              result: '개원 3개월 만에 일평균 30명 달성',
              rating: 5,
            },
            {
              name: '이O현 원장님',
              role: '분당 내과 | 2025년 개원',
              content:
                '중개수수료 400만원을 아꼈는데, 마케팅까지 6개월 무료라니. 개원 초기 자금 압박이 확 줄었습니다.',
              result: '초기 비용 1,200만원 절감',
              rating: 5,
            },
            {
              name: '김O수 원장님',
              role: '서울 치과 | 2026년 개원',
              content:
                '전담 마케터가 붙어서 네이버 플레이스, 블로그를 다 잡아줬어요. 저는 진료에만 집중할 수 있었습니다.',
              result: '개원 6개월 월매출 8천만원 달성',
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
            question: '정말 전부 무료인가요?',
            answer:
              '네, 초기 비용 0원입니다. 대신 PG 결제 시스템을 24개월간 저희 걸 사용하시는 조건입니다. PG 수수료는 기존 VAN보다 낮거나 동일한 수준이므로 원장님께 추가 부담이 아닙니다.',
          },
          {
            question: '왜 무료로 해주는 건가요?',
            answer:
              '원장님 병원의 결제가 저희 PG를 통해 발생합니다. 원장님 매출이 올라야 저희 수익도 올라가는 구조입니다. 그래서 마케팅에 투자하는 겁니다. 공짜가 아니라 성공 보수제입니다.',
          },
          {
            question: 'PG 수수료율은 어떻게 되나요?',
            answer:
              '카드 결제 기준 업계 최저 수준으로 제공됩니다. 기존 VAN사 대비 동일하거나 더 낮은 수수료율입니다. 상세 수수료율은 상담 시 안내드립니다.',
          },
          {
            question: '24개월 전에 해지하면 어떻게 되나요?',
            answer:
              'PG 약정 기간 내 해지 시, 제공받은 마케팅 비용의 잔여분이 청구될 수 있습니다. 하지만 대부분의 원장님이 PG를 계속 사용하시기 때문에 실질적인 부담은 없습니다.',
          },
          {
            question: '어떤 진료과든 가능한가요?',
            answer:
              '네, 모든 진료과에 적용 가능합니다. 다만 상권분석은 진료과별 경쟁강도와 수요를 고려하여 맞춤 제공됩니다.',
          },
          {
            question: '상권분석이 정말 정확한가요?',
            answer:
              '심평원 진료 데이터, 국토부 상권 데이터, 유동인구, 경쟁 병원 분석 등을 종합한 AI 분석입니다. 170개 이상의 병의원 데이터로 검증된 모델을 사용합니다.',
          },
          {
            question: '마케팅 6개월 후에는 어떻게 되나요?',
            answer:
              '6개월 안정화 이후에도 원하시면 유료 마케팅 서비스를 연장할 수 있습니다. 대부분 6개월이면 자연검색 유입이 안정화되어 별도 마케팅 없이도 환자가 유지됩니다.',
          },
          {
            question: '보험청구 자동화는 어떻게 작동하나요?',
            answer:
              'EMR에서 진료 기록을 작성하면, AI가 자동으로 상병코드와 수가코드 조합을 분석하여 삭감 위험을 사전에 감지합니다. 고위험 항목은 수정 제안과 함께 알려드리고, 안전한 청구 건은 심평원에 일괄 전송할 수 있습니다. 평균 삭감률이 50% 이상 감소합니다.',
          },
          {
            question: '경정청구 수수료는 얼마인가요?',
            answer:
              '성공 보수제로, 환급 성공 시에만 수수료가 발생합니다. 환급액 100만원 미만은 15%, 100~500만원은 12%, 500만원 이상은 10%입니다. 환급 실패 시 수수료는 0원입니다. 일반 세무사 수수료(20~30%)보다 저렴합니다.',
          },
        ]}
      />

      {/* Consultation Form */}
      <OpeningConsultationForm />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>&copy; 2026 메디플라톤. All rights reserved.</p>
      </footer>
    </div>
  );
}

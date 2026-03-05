'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Cog, Clock, AlertTriangle, Users, Calculator,
  Database, FileText, Mail, BarChart3, Shield,
  Zap, RefreshCw, ClipboardCheck, Code2, Headphones,
  Rocket, TrendingDown, DollarSign, Brain, CheckCircle2,
  ArrowRight, Phone, Play, Monitor, Smartphone, Search,
  Lock, Bell, Cpu, FileDown, LayoutDashboard, SlidersHorizontal,
  Globe, CalendarClock, ShieldCheck, MessageSquare, Sparkles,
  FileOutput, Link2, ChevronDown, ChevronUp, X, ExternalLink
} from 'lucide-react';

// ============================================================
// 손실 계산기 (ROI Loss Calculator)
// ============================================================
function LossCalculator() {
  const [hours, setHours] = useState(3);
  const [employees, setEmployees] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(20000);

  const annualWaste = hours * employees * hourlyRate * 22 * 12;
  const automationCost = 5000000;
  const annualSaving = annualWaste * 0.7; // 70% 자동화

  return (
    <section id="loss-calc" className="py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            손실 계산기
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            지금 얼마나 손해보고 계신지 직접 계산해 보세요
          </h2>
          <p className="mt-3 text-gray-600">
            아래 숫자만 입력하면 귀사의 연간 손실 비용을 바로 확인할 수 있습니다.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반복 업무에 소요되는 일일 시간
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={hours}
                    onChange={(e) => setHours(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">시간 / 일</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  해당 업무를 수행하는 직원 수
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={employees}
                    onChange={(e) => setEmployees(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">명</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직원 평균 시급
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10000}
                    step={1000}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(10000, Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <div className="text-sm text-red-600 mb-1">연간 낭비되는 비용</div>
                <div className="text-3xl font-bold text-red-600">
                  ₩{annualWaste.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">자동화 도입 비용 (예상)</div>
                <div className="text-2xl font-bold text-gray-700">
                  ₩{automationCost.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="text-sm text-green-600 mb-1">자동화 시 연간 절감 금액</div>
                <div className="text-3xl font-bold text-green-600">
                  ₩{annualSaving.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-400 text-center">
            도입 비용은 프로젝트 규모에 따라 달라질 수 있습니다. 정확한 견적은 무료 상담에서 확인하세요.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// 견적 계산기 (Development Cost Calculator)
// ============================================================
const FEATURES = [
  {
    category: '기본 기능',
    difficulty: '낮음',
    color: 'green',
    items: [
      { id: 'crawl', name: '데이터 자동 수집 / 크롤링', desc: '웹사이트에서 데이터를 자동으로 수집', market: 150000, our: 120000 },
      { id: 'excel', name: '엑셀 / CSV 자동 처리', desc: '파일 읽기, 정리, 변환, 자동 저장', market: 200000, our: 170000 },
      { id: 'email', name: '이메일 / 알림 자동 발송', desc: '조건에 따른 자동 메일/문자 전송', market: 120000, our: 100000 },
      { id: 'ui', name: '기본 UI 화면 (입력 폼/목록)', desc: '데이터 입력 화면, 목록 화면 구성', market: 180000, our: 150000 },
      { id: 'file', name: '파일 업로드 / 다운로드', desc: '첨부파일 업로드 및 다운로드 기능', market: 100000, our: 80000 },
    ],
  },
  {
    category: '중급 기능',
    difficulty: '보통',
    color: 'blue',
    items: [
      { id: 'db', name: '데이터베이스 설계 / 연동', desc: 'DB 테이블 설계, CRUD 구현', market: 350000, our: 290000 },
      { id: 'dashboard', name: '관리자 대시보드', desc: '매출/재고/고객 현황 시각화 화면', market: 400000, our: 330000 },
      { id: 'auth', name: '회원가입 / 로그인 시스템', desc: '이메일 인증, 비밀번호 암호화, 세션 관리', market: 300000, our: 250000 },
      { id: 'search', name: '검색 / 필터 / 정렬 기능', desc: '다중 조건 검색, 동적 필터링', market: 250000, our: 200000 },
      { id: 'responsive', name: '반응형 디자인 (모바일 최적화)', desc: 'PC/태블릿/모바일 화면 대응', market: 280000, our: 230000 },
    ],
  },
  {
    category: '고급 기능',
    difficulty: '높음',
    color: 'orange',
    items: [
      { id: 'api', name: '외부 API 연동 (결제/지도/알림)', desc: 'PG 결제, 카카오맵, Slack/SMS 연동', market: 500000, our: 420000 },
      { id: 'booking', name: '예약 / 스케줄링 시스템', desc: '날짜/시간 예약, 캘린더, 자동 알림', market: 450000, our: 380000 },
      { id: 'rbac', name: '권한 관리 (관리자/일반 분리)', desc: '역할별 접근 권한, 메뉴 제어', market: 400000, our: 330000 },
      { id: 'realtime', name: '실시간 알림 / 채팅', desc: 'WebSocket 기반 실시간 통신', market: 350000, our: 290000 },
    ],
  },
  {
    category: '전문 기능',
    difficulty: '매우 높음',
    color: 'purple',
    items: [
      { id: 'ai', name: 'AI 기능 (GPT/Claude 연동)', desc: 'AI 자동 분류, 요약, 추천, 챗봇', market: 800000, our: 650000 },
      { id: 'pdf', name: '자동 보고서 / PDF 생성', desc: '데이터 기반 맞춤 보고서 자동 생성', market: 600000, our: 500000 },
      { id: 'integration', name: '멀티 시스템 통합 연동', desc: 'ERP/CRM/회계 등 외부 시스템 연결', market: 700000, our: 580000 },
    ],
  },
];

function EstimateCalculator() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allItems = FEATURES.flatMap(c => c.items);
  const selectedItems = allItems.filter(i => selected.has(i.id));
  const totalMarket = selectedItems.reduce((s, i) => s + i.market, 0);
  const totalOur = selectedItems.reduce((s, i) => s + i.our, 0);
  const totalSaving = totalMarket - totalOur;

  const getEstimatedWeeks = () => {
    const count = selected.size;
    if (count === 0) return null;
    if (count <= 3) return '1~2주';
    if (count <= 7) return '2~3주';
    if (count <= 12) return '3~4주';
    return '4~6주';
  };

  const diffColors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <section id="estimate" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            견적 계산기
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            필요한 기능만 체크하면 견적이 바로 나옵니다
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            원하는 기능을 체크하세요. 난이도와 예상 비용이 자동으로 계산됩니다.
            Claude AI 기반 개발로 시장가 대비 10~20% 저렴합니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Feature List */}
          <div className="lg:col-span-2 space-y-6">
            {FEATURES.map((cat) => (
              <div key={cat.category} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{cat.category}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColors[cat.color]}`}>
                    난이도: {cat.difficulty}
                  </span>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => {
                    const isSelected = selected.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(item.id)}
                          className="mt-1 w-5 h-5 accent-blue-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                            <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                              <span className="text-gray-400 line-through">₩{(item.market / 10000).toFixed(0)}만</span>
                              <span className="text-blue-600 font-bold">₩{(item.our / 10000).toFixed(0)}만</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Result Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h3 className="font-bold text-gray-900 text-lg mb-1">실시간 견적 계산</h3>
              <p className="text-sm text-gray-500 mb-6">{selected.size}개 기능 선택됨</p>

              {selected.size === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  왼쪽에서 필요한 기능을 체크하세요
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">시장가</span>
                    <span className="text-sm text-gray-400 line-through">₩{totalMarket.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">저희 가격</span>
                    <span className="text-xl font-bold text-blue-600">₩{totalOur.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-green-600 font-medium">절감액</span>
                    <span className="text-lg font-bold text-green-600">₩{totalSaving.toLocaleString()}</span>
                  </div>

                  {getEstimatedWeeks() && (
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-xs text-blue-600 mb-1">예상 개발 기간</div>
                      <div className="text-lg font-bold text-blue-700">{getEstimatedWeeks()}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 소스코드 100% 제공</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 1개월 무상 유지보수</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 안 맞으면 100% 환불</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Claude AI 기반 고속 개발</div>
              </div>

              <a
                href="#consultation"
                className="block mt-6 w-full bg-blue-600 text-white text-center font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                무료 상담 신청
              </a>

              <p className="mt-3 text-xs text-gray-400 text-center">
                실제 금액은 상세 요구사항에 따라 달라질 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ Accordion
// ============================================================
function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = [
    {
      q: '비용이 많이 들지 않을까요?',
      a: '직원 1명 월급(약 350만원)보다 저렴한 비용으로 시작할 수 있습니다. 게다가 한 번 개발하면 계속 사용 가능하니 장기적으로 보면 인건비 대비 훨씬 경제적입니다. 무료 상담에서 예상 ROI를 계산해 드립니다.',
    },
    {
      q: '우리 회사 업무도 자동화가 가능할까요?',
      a: '엑셀로 하는 작업, 복붙이 많은 작업, 정해진 규칙이 있는 반복 작업이라면 거의 100% 자동화 가능합니다. 30분 무료 진단으로 귀사 업무의 자동화 가능 여부와 예상 효과를 정확히 알려드립니다.',
    },
    {
      q: '개발 기간은 얼마나 걸리나요?',
      a: '간단한 자동화 도구는 1-2주, 중규모 시스템은 3-4주면 완성됩니다. 급하신 경우 긴급 개발도 가능합니다. 정확한 일정은 무료 상담 후 안내드리며, 약속한 납기는 100% 지킵니다.',
    },
    {
      q: '개발 후 문제가 생기면 어떻게 하나요?',
      a: '개발 완료 후 1개월간 무상 유지보수를 제공합니다. 이 기간 동안 발생하는 모든 버그 수정, 기능 조정은 무료입니다. 이후에도 합리적인 비용으로 지속적인 지원을 받으실 수 있습니다.',
    },
    {
      q: '결과가 마음에 안 들면 어떻게 되나요?',
      a: '100% 환불 보장합니다. 합의된 요구사항대로 개발했음에도 만족하지 못하시면 전액 환불해 드립니다. 저희는 그만큼 결과물에 자신 있습니다.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">자주 묻는 질문</h2>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-medium text-gray-900">{item.q}</span>
                {openIdx === idx ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Contact Form
// ============================================================
function ContactForm() {
  const [form, setForm] = useState({ company_name: '', contact_person: '', contact_phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/service-subscription/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: 'PROGRAM', ...form }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="consultation" className="py-20 md:py-28 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              30초만 투자하면<br />연간 절감액 바로 알려드립니다
            </h2>
            <p className="text-gray-400 mb-8">
              &ldquo;우리 회사도 자동화 가능할까?&rdquo; 3가지만 적어주세요.
              24시간 내 맞춤 견적을 보내드립니다.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                자동화 가능 업무 무료 분석
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                예상 시간/비용 절감 효과 계산
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                24시간 내 맞춤 견적 제공
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                상담 후 결정해도 OK (강매 NO)
              </div>
            </div>
            <div className="mt-8 bg-white/10 rounded-xl p-4">
              <p className="text-sm text-yellow-300 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                이번 주 상담 가능: 월/수/금 오전 10시~12시
              </p>
              <p className="text-xs text-gray-400 mt-1">품질 유지를 위해 주 6건만 진행합니다</p>
            </div>
          </div>

          <div>
            {status === 'success' ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-2xl font-bold">신청 완료!</p>
                <p className="mt-2 text-gray-400">24시간 내 맞춤 견적을 보내드리겠습니다</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text" placeholder="회사명 *" required
                  value={form.company_name}
                  onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text" placeholder="담당자명 *" required
                  value={form.contact_person}
                  onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text" placeholder="연락처 (전화 또는 이메일) *" required
                  value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <textarea
                  placeholder="자동화하고 싶은 업무 (선택)"
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {status === 'loading' ? '전송 중...' : '우리 회사 연간 절감액 무료로 받기'}
                </button>
                {status === 'error' && (
                  <p className="text-red-400 text-center text-sm">전송에 실패했습니다. 다시 시도해주세요.</p>
                )}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 24시간 내 맞춤 견적</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 강매 절대 없음</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 100% 환불 보장</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function ProgramServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ───── Sticky Header ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <a href="/" className="font-bold text-gray-900">DevAuto</a>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#problems" className="hover:text-gray-900">문제점</a>
            <a href="#loss-calc" className="hover:text-gray-900">손실 계산</a>
            <a href="#solutions" className="hover:text-gray-900">솔루션</a>
            <a href="#demo" className="hover:text-gray-900">데모</a>
            <a href="#estimate" className="hover:text-gray-900">견적</a>
            <a href="#testimonials" className="hover:text-gray-900">후기</a>
          </div>
          <a
            href="#consultation"
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            무료 진단 받기
          </a>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            제작비 0원 | 150개 기업이 증명
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight">
            직원 3명이 하루 종일 하는 일,<br />
            프로그램 하나가 <span className="text-blue-600">27분</span>에 끝냅니다
          </h1>
          <p className="mt-4 text-lg md:text-xl text-blue-600 font-semibold">
            &rarr; 연간 1,200만원 절감. 150개 기업이 증명.
          </p>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            월급 405만원 직원 1명 뽑을 돈으로 24시간 무휴 자동화 시스템 8개 운영.<br />
            150개 기업이 이미 선택했습니다.
          </p>

          <div className="mt-6 bg-gray-900 text-white rounded-2xl p-5 max-w-xl mx-auto">
            <p className="text-sm text-gray-300">
              매일 3시간씩, 매년 720시간.<br />
              당신 직원들이 복사-붙여넣기에 갈아 넣는 시간입니다.
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-400">
              150개 기업이 이 시간을 되찾았습니다. 다음은 당신 차례.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#consultation"
              className="group bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              우리 회사 연간 절감액 무료로 받기
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#loss-calc"
              className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2 transition-colors"
            >
              <Calculator className="w-5 h-5" />
              30초만에 ROI 계산하기
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> 폼 작성 30초</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> 24시간 내 맞춤 견적</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> 안 맞으면 100% 환불</span>
          </div>

          {/* Hero Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {[
              { value: '70%', label: '평균 업무시간 단축률' },
              { value: '150+', label: '도입 기업' },
              { value: '98%', label: '재계약률' },
              { value: '4.9/5', label: '만족도' },
              { value: '24h', label: '견적 응답 시간' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-2xl font-black text-blue-600">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Client Logos ───── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8">147개 기업이 이미 업무 자동화에 성공했습니다</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { name: '한성정밀', type: '제조업 / 직원 120명', result: '업무시간 65% 단축' },
              { name: '마켓플러스', type: '유통업 / 직원 45명', result: '월 80시간 절감' },
              { name: '스마트HR', type: 'HR 서비스 / 직원 30명', result: '인건비 40% 절감' },
              { name: '퀵로지스', type: '물류업 / 직원 80명', result: '오류율 99% 감소' },
              { name: '메디케어랩', type: '의료기기 / 직원 55명', result: '보고서 자동화 100%' },
            ].map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto font-bold text-sm mb-2">
                  {c.name[0]}
                </div>
                <div className="font-semibold text-gray-900 text-sm">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.type}</div>
                <div className="text-xs text-green-600 font-medium mt-1">{c.result}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Problems ───── */}
      <section id="problems" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              경고: 당신의 회사도 해당됩니다
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
              이 중 하나라도 해당되면<br />매달 돈이 새고 있습니다
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: '"또 사람 뽑자는 품의서..."',
                desc: '업무량 1.5배 증가 시 인원 충원 불가능. 채용공고 → 면접 → 온보딩 → 퇴사 사이클에서 수백만원 손실.',
                stat: '연 4,860만원',
                statLabel: '신입 1명 실제 비용 (월급+4대보험+퇴직금+교육)',
              },
              {
                icon: AlertTriangle,
                title: '"이 보고서, 숫자가 또 틀렸잖아"',
                desc: '수동 데이터 처리는 반드시 오류 발생. 엑셀 셀 오타가 수천만원 발주 실수로 이어진 실제 사례.',
                stat: '평균 3.6%',
                statLabel: '수작업 데이터 오류율 (IBM 리서치)',
              },
              {
                icon: Users,
                title: '"핵심 담당자가 퇴사하면 끝"',
                desc: '담당자만 아는 엑셀 매크로, 정산 시스템. 담당자 없으면 회사 운영 중단.',
                stat: '평균 2.3개월',
                statLabel: '담당자 퇴사 시 업무 공백 기간',
              },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <p.icon className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{p.desc}</p>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{p.stat}</div>
                  <div className="text-xs text-red-500 mt-0.5">{p.statLabel}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gray-900 text-white rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-400">이대로 1년만 더 방치하면 잃는 금액</p>
            <p className="text-3xl font-bold mt-1">연간 ₩1,200만원+</p>
            <p className="text-sm text-gray-400 mt-2">이 페이지를 읽는 5분 동안 당신 회사에서 ₩25,000이 낭비됐습니다.</p>
          </div>
        </div>
      </section>

      {/* ───── Loss Calculator ───── */}
      <LossCalculator />

      {/* ───── Solutions ───── */}
      <section id="solutions" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              &ldquo;그래서 어떻게 해결해 주시는 건가요?&rdquo;
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              오직 귀사만을 위한 맞춤 솔루션
            </h2>
            <p className="text-gray-600">범용 소프트웨어 NO. 귀사 업무 프로세스에 100% 맞춤 개발합니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Solution 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">업무 자동화 프로그램</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> 3시간짜리 엑셀 정리 → 버튼 하나로 3분 완료</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> 매일 아침 9시, 보고서가 대표님 메일함에 자동 도착</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> 납기 지연, 재고 부족? 알아서 알림 → 실수 제로</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> 경쟁사 가격/재고를 24시간 자동 모니터링</li>
              </ul>
              <div className="mt-5 bg-blue-50 rounded-xl p-3 text-center">
                <span className="text-sm text-blue-700 font-semibold">→ 평균 업무시간 70% 단축, 연간 960시간 확보</span>
              </div>
            </div>

            {/* Solution 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-5">
                <Cog className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">맞춤 사내 프로그램</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> 우리 회사 프로세스 그대로 → 교육 없이 바로 사용</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> 재고/주문/고객, 흩어진 데이터를 한 화면에서 관리</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> 실시간 대시보드로 의사결정 속도 3배 향상</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> 기존 시스템(엑셀/ERP/쇼핑몰)과 자동 연동</li>
              </ul>
              <div className="mt-5 bg-green-50 rounded-xl p-3 text-center">
                <span className="text-sm text-green-700 font-semibold">→ 데이터 정확도 99.9%, 담당자 퇴사해도 업무 중단 제로</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Demo / Before → After ───── */}
      <section id="demo" className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              실제 화면 공개
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              4시간 → 3분. 직접 눈으로 확인하세요
            </h2>
            <p className="text-gray-600">
              &ldquo;에이, 과장이겠지&rdquo; 하셨죠? 실제 고객사 적용 사례입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <div className="text-red-600 font-bold text-sm mb-2">Before</div>
              <h3 className="font-bold text-gray-900 mb-2">4시간 걸리던 작업</h3>
              <p className="text-sm text-gray-600">수동으로 10개 사이트에서 데이터 수집, 엑셀 정리, 보고서 작성</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="text-green-600 font-bold text-sm mb-2">After</div>
              <h3 className="font-bold text-gray-900 mb-2">버튼 한 번, 3분 완료</h3>
              <p className="text-sm text-gray-600">자동 수집 → 자동 정리 → 자동 보고서 생성 → 이메일 발송까지</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="text-blue-600 font-bold text-sm mb-2">결과</div>
              <h3 className="font-bold text-gray-900 mb-2">월 80시간 x 12개월 = 960시간</h3>
              <p className="text-sm text-gray-600">시급 2만원 기준 연간 1,920만원 절감 효과</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Comparison Table ───── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              비교
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              사람 채용 vs 범용 툴 vs DevAuto
            </h2>
            <p className="text-gray-600">뭐가 진짜 이득일까요?</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl overflow-hidden border border-gray-100">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500">항목</th>
                  <th className="px-5 py-4 text-sm font-medium text-gray-500 text-center">사람 채용</th>
                  <th className="px-5 py-4 text-sm font-medium text-gray-500 text-center">범용 솔루션</th>
                  <th className="px-5 py-4 text-sm font-medium text-center bg-blue-50 text-blue-700">
                    DevAuto 맞춤 개발
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">추천</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['월 비용', '405만원+', '10~50만원/월', '50만원~ (1회)'],
                  ['우리 업무 적합도', '높음', '낮음 (범용)', '100% 맞춤'],
                  ['퇴사/중단 리스크', '높음', '서비스 종료 리스크', '없음 (영구 소유)'],
                  ['실수율', '인간 평균 3.6%', '설정 오류 가능', '0%'],
                  ['24시간 가동', '불가', '가능', '가능'],
                  ['교육/온보딩', '1~3개월', '직원 교육 필요', '1일'],
                  ['환불 정책', '불가', '환불 불가', '100% 환불 보장'],
                ].map(([label, a, b, c], i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-gray-700">{label}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{a}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{b}</td>
                    <td className="px-5 py-3.5 text-center bg-blue-50/50 text-blue-700 font-medium">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              실제 후기
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              &ldquo;진작 할 걸 그랬어요&rdquo;
            </h2>
            <p className="text-gray-600">도입 기업들의 솔직 후기</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: '김영수 대표',
                company: '마켓플러스 / 유통업 / 직원 45명',
                quote: '솔직히 처음엔 "이 가격에 될까?" 의심했습니다. 그런데 매일 4시간씩 걸리던 매출 정산이 이제 버튼 하나로 끝납니다.',
                detail: '도입 첫 주부터 효과가 바로 나타났어요. 직원들이 야근에서 해방됐습니다.',
                result: '월 80시간 단축 · 연 960시간 확보 · 시급 2만원 기준 연 1,920만원 절감',
              },
              {
                name: '이정민 팀장',
                company: '한성정밀 / 제조업 / 직원 120명',
                quote: '엑셀 파일 수십 개 관리하다 실수 나면 난리였는데, 이제 통합 시스템으로 실수가 0이 됐습니다.',
                detail: '경쟁사보다 견적도 빠르고 소통도 정말 잘 됐어요.',
                result: '데이터 오류 100% 감소, 업무 효율 2배 상승',
              },
              {
                name: '박지현 이사',
                company: '스마트HR / 서비스업 / 직원 30명',
                quote: '사람 한 명 더 뽑으려다 자동화를 선택했는데, 인건비 연 4천만 원을 아꼈습니다.',
                detail: '최고의 결정이었어요. 다른 부서에서도 "우리도 해달라"고 요청이 쏟아지고 있습니다.',
                result: '연간 인건비 4,000만원 절감, ROI 800%',
              },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {'★★★★★'.split('').map((s, j) => <span key={j}>{s}</span>)}
                </div>
                <p className="text-gray-900 font-medium mb-2">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm text-gray-500 mb-4">{t.detail}</p>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 font-medium mb-4">
                  {t.result}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.company}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { v: '150+', l: '도입 기업 수' },
              { v: '98%', l: '재계약률' },
              { v: '70%', l: '평균 업무시간 단축' },
              { v: '4.9/5', l: '고객 만족도' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <div className="text-2xl font-bold text-blue-600">{s.v}</div>
                <div className="text-xs text-gray-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Process ───── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              진행 과정
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              복잡한 절차? 없습니다. 딱 4단계면 끝.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ClipboardCheck, title: '무료 진단', time: '30분', desc: '현재 업무 환경을 분석하고 자동화 가능 영역을 파악합니다' },
              { icon: Brain, title: '맞춤 제안', time: '24시간 내', desc: '귀사에 최적화된 솔루션과 견적을 제안드립니다' },
              { icon: Code2, title: '개발 진행', time: '1~4주', desc: '실시간으로 진행 상황 공유, 피드백 즉시 반영' },
              { icon: Rocket, title: '배포 & 교육', time: '1일', desc: '완성된 솔루션 배포 및 사용법 교육까지' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {i + 1}
                </div>
                <step.icon className="w-8 h-8 text-blue-600 mx-auto mb-3 mt-2" />
                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                <div className="text-xs text-blue-600 font-semibold mb-2">{step.time}</div>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Guarantee ───── */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">결과 불만족 시 100% 환불</h2>
          <p className="text-blue-100 leading-relaxed">
            &ldquo;돈만 받고 도망가면 어떡하지?&rdquo; 걱정하지 마세요.
            합의된 결과물이 안 나오면 전액 환불. 계약서에 명시합니다.
            이게 저희가 150개 기업에서 98% 재계약률을 유지하는 비결입니다.
          </p>
        </div>
      </section>

      {/* ───── Objection Handling ───── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              &ldquo;솔직히 이런 걱정 되시죠?&rdquo;
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: '"이 가격에 제대로 된 걸 만들어 준다고?"',
                a: '대기업은 같은 프로젝트에 5,000만 원 씁니다. 저희가 1/10 비용으로 가능한 이유: 150건 납품에서 축적된 자동화 템플릿. 처음부터 만드는 게 아니라, 검증된 모듈을 조합하고 귀사에 맞게 커스터마이징합니다.',
                proof: '납품물 코드 품질 평가 평균 4.8/5.0 · 소스코드 100% 귀사 소유',
              },
              {
                q: '"우리 회사엔 안 맞을 것 같은데..."',
                a: '범용 솔루션 도입했다가 결국 안 쓰게 된 경험, 있으시죠? 저희는 귀사 업무 프로세스를 직접 분석해서 1:1 맞춤 개발합니다. 150개 기업, 150개 서로 다른 프로그램.',
                proof: '도입 후 실사용률 96% · 98% 재계약률이 증거입니다',
              },
              {
                q: '"만들고 나서 버그 나면?"',
                a: '개발 후 연락 두절? 저희는 다릅니다. 1개월 무상 유지보수 + 평일 핫라인 운영. 심지어 결과물이 마음에 안 들면 100% 환불. 계약서에 명시합니다.',
                proof: '1개월 무상 A/S + 2시간 내 대응 보장 + 불만족 시 전액 환불',
              },
              {
                q: '"개발 과정이 복잡하지 않을까?"',
                a: '전문 용어로 소통하는 개발사 아닙니다. "이 엑셀 작업 자동으로 해주세요"라고 말씀하시면 됩니다. 기술적인 건 저희가 알아서 처리합니다.',
                proof: '30분 무료 진단 → 24시간 내 맞춤 견적 → 1~4주 완성',
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">{item.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.a}</p>
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {item.proof}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Price Comparison ───── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              비용 비교
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              직원 반 달 월급으로 영구 자동화 시스템을 구축합니다
            </h2>
            <p className="text-gray-600">신입 1명 연봉 4,860만원 vs 자동화 프로그램 50만원. 숫자가 답합니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Employee */}
            <div className="bg-white rounded-2xl p-6 border border-red-100">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-red-500" />
                <h3 className="font-bold text-gray-900">신입 직원 1명 채용 시</h3>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: '월급', value: '300만원' },
                  { label: '4대보험', value: '30만원' },
                  { label: '교육/온보딩 비용', value: '50만원' },
                  { label: '퇴직금 적립', value: '25만원' },
                  { label: '실수로 인한 손실', value: '연 평균 340만원' },
                  { label: '퇴사 리스크', value: '재채용 비용 200만원+' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-600">{r.label}</span>
                    <span className="font-medium text-red-500">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-red-50 rounded-xl p-4 text-center">
                <div className="text-xs text-red-500">합계</div>
                <div className="text-xl font-bold text-red-600">월 405만원+ / 연 4,860만원</div>
                <div className="text-xs text-red-400 mt-1">+ 관리 부담 + 퇴사 리스크</div>
              </div>
            </div>

            {/* DevAuto */}
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-6">
                <Cpu className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-900">맞춤 자동화 프로그램</h3>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  '24시간 무휴 작동',
                  '실수 확률 0%',
                  '퇴사 걱정 없음',
                  '교육 필요 없음',
                  '1개월 무상 유지보수 포함',
                  '소스코드 소유 · 영구 사용',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-xs text-blue-600">합계</div>
                <div className="text-xl font-bold text-blue-700">50만원부터~</div>
                <div className="text-xs text-blue-500 mt-1">직원 반 달 월급으로 영구 자동화 시스템 구축</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Estimate Calculator ───── */}
      <EstimateCalculator />

      {/* ───── FAQ ───── */}
      <FAQSection />

      {/* ───── Urgency CTA ───── */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-3xl font-bold mb-4">
            이 페이지를 읽는 5분 동안<br />당신 회사에서 25,000원이 낭비됐습니다
          </h2>
          <p className="text-gray-400 mb-6">
            시급 2만원 x 직원 3명 x 5분 = 5,000원. 이게 반복 업무의 실제 비용입니다.<br />
            매일, 매달, 매년. 30분 무료 진단 하나로 이 숫자를 0에 가깝게 만들 수 있습니다.
          </p>
          <div className="bg-yellow-500/20 text-yellow-300 text-sm font-medium py-2 px-4 rounded-full inline-block mb-6">
            이번 주 상담 가능: 월/수/금 오전 10시~12시 (품질 유지를 위해 주 6건만 진행)
          </div>
          <div>
            <a
              href="#consultation"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
            >
              우리 회사 연간 절감액 무료로 받기
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 폼 작성 30초</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 24시간 내 맞춤 견적</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 안 맞으면 100% 환불</span>
          </div>
        </div>
      </section>

      {/* ───── Contact Form ───── */}
      <ContactForm />

      {/* ───── Footer ───── */}
      <footer className="bg-gray-950 text-gray-500 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <p>DevAuto by 플라톤마케팅 | 사업자등록번호: 000-00-00000</p>
          <p className="mt-1">서울특별시 강남구 | 대표: 홍길동 | 문의: 1588-0000</p>
          <p className="mt-3 text-gray-600">&copy; 2026 DevAuto. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { CheckCircle2, ArrowRight, CreditCard, Globe, Zap, Phone } from 'lucide-react';
import Link from 'next/link';

export default function HomepageServicePage() {
  const [form, setForm] = useState({ company_name: '', contact_person: '', contact_phone: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/service-subscription/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: 'HOMEPAGE', ...form }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ───── HERO ───── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-black to-black" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* 뱃지 */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-5 py-2 mb-10">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">PG(결제 단말기) 설치 조건</span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.95]">
            <span className="text-white">병원 홈페이지</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
              무료 제작
            </span>
          </h1>

          <p className="mt-8 text-xl sm:text-2xl md:text-3xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
            PG 단말기만 설치하시면<br className="hidden sm:block" />
            홈페이지를 <strong className="text-white font-semibold">0원</strong>에 만들어드립니다
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contact"
              className="group bg-white text-black font-bold text-lg sm:text-xl px-10 py-5 rounded-2xl hover:bg-blue-50 transition-all flex items-center gap-3"
            >
              무료 상담 신청
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="tel:15880000"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-lg"
            >
              <Phone className="w-5 h-5" />
              1588-0000
            </a>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

      {/* ───── 조건 한 줄 요약 ───── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight">
            조건은 딱 하나
          </h2>
          <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-600 rounded-3xl p-8 sm:p-12">
            <CreditCard className="w-16 h-16 mx-auto text-white/80 mb-6" />
            <p className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              PG 단말기 설치
            </p>
            <p className="mt-4 text-lg sm:text-xl text-white/80 font-light">
              병원에 카드결제 단말기만 설치해주시면 됩니다
            </p>
          </div>
        </div>
      </section>

      {/* ───── 뭘 해주나요? ───── */}
      <section className="py-20 sm:py-28 px-6 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-center mb-16">
            이걸 전부 <span className="text-blue-400">무료</span>로
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: '반응형 홈페이지',
                desc: 'PC · 태블릿 · 모바일\n완벽 대응',
              },
              {
                icon: Zap,
                title: '맞춤 디자인',
                desc: '병원 브랜드에 맞춘\n프리미엄 디자인',
              },
              {
                icon: CheckCircle2,
                title: '유지보수 포함',
                desc: '수정 · 업데이트\n걱정 없이',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 text-center hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-12 h-12 mx-auto text-blue-400 mb-6" />
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-lg whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 숫자로 보는 성과 ───── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-16">
            이미 검증된 결과
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: '170+', label: '제작 병원' },
              { value: '0원', label: '제작비' },
              { value: '94%', label: '만족도' },
              { value: '4주', label: '제작 기간' },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl sm:text-5xl md:text-6xl font-black text-blue-400">
                  {stat.value}
                </p>
                <p className="mt-2 text-gray-500 text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 문의 폼 ───── */}
      <section id="contact" className="py-20 sm:py-28 px-6 bg-gray-950">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-4">
            지금 신청하세요
          </h2>
          <p className="text-center text-gray-400 text-lg mb-12">
            상담은 무료입니다. 부담 없이 연락주세요.
          </p>

          {status === 'success' ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <p className="text-3xl font-bold">신청 완료!</p>
              <p className="mt-3 text-gray-400 text-lg">빠른 시일 내에 연락드리겠습니다</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="병원명"
                required
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-6 py-5 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="담당자 성함"
                required
                value={form.contact_person}
                onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-6 py-5 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="tel"
                placeholder="연락처"
                required
                value={form.contact_phone}
                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/15 rounded-2xl px-6 py-5 text-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-white text-black font-bold text-xl py-5 rounded-2xl hover:bg-blue-50 disabled:opacity-50 transition-all"
              >
                {status === 'loading' ? '전송 중...' : '무료 상담 신청하기'}
              </button>
              {status === 'error' && (
                <p className="text-red-400 text-center">전송에 실패했습니다. 다시 시도해주세요.</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ───── 푸터 ───── */}
      <footer className="py-10 text-center text-gray-600 text-sm border-t border-white/5">
        <p>플라톤마케팅 | 사업자등록번호: 000-00-00000</p>
        <p className="mt-1">서울특별시 강남구 | 대표: 홍길동 | 문의: 1588-0000</p>
        <p className="mt-3 text-gray-700">&copy; 2026 Platon Marketing. All rights reserved.</p>
      </footer>
    </div>
  );
}

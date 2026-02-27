'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Loader2, Phone, Building2, User, MessageSquare } from 'lucide-react';

interface ServiceConsultationFormProps {
  serviceType: 'HOMEPAGE' | 'PROGRAM' | 'EMR';
  headline?: string;
  subHeadline?: string;
  apiEndpoint?: string;
}

export default function ServiceConsultationForm({
  serviceType,
  headline,
  subHeadline,
  apiEndpoint,
}: ServiceConsultationFormProps) {
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    contact_phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isHomepage = serviceType === 'HOMEPAGE';
  const isEMR = serviceType === 'EMR';
  const defaultHeadline = isEMR
    ? '무료 EMR 데모 신청하기'
    : isHomepage
    ? '무료 홈페이지 진단 받기'
    : '무료 업무 자동화 진단 받기';
  const defaultSub = isEMR
    ? '30분 데모로 PlatonEMR의 차이를 직접 체험해보세요. 데이터 이전까지 무료로 도와드립니다'
    : isHomepage
    ? '현재 홈페이지의 전환율 분석 + 경쟁사 비교 리포트를 무료로 받아보세요'
    : '30분이면 충분합니다. 귀사 맞춤 절감액을 바로 알려드립니다';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.contact_phone) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

      // 1) Backend API
      const res = await fetch(`${API_URL}/api/v1/service-subscription/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          ...form,
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">상담 신청이 완료되었습니다!</h3>
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
              {headline || defaultHeadline}
            </h2>
            <p className="mt-4 text-blue-100 text-lg leading-relaxed">
              {subHeadline || defaultSub}
            </p>

            <div className="mt-8 space-y-3">
              {[
                '폼 작성 30초',
                '24시간 내 맞춤 답변',
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
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              {isEMR ? '무료 데모 신청' : isHomepage ? '무료 진단 신청' : '무료 상담 신청'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4" />
                  {isEMR ? '병원/의원명' : isHomepage ? '병원/기관명' : '회사명'}
                </label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder={isEMR ? '예) 00내과의원' : isHomepage ? '예) 00치과의원' : '예) 주식회사 00'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4" />
                  {isEMR ? '원장님 성함' : isHomepage ? '원장님 성함' : '담당자 성함'}
                </label>
                <input
                  type="text"
                  required
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4" />
                  연락처
                </label>
                <input
                  type="tel"
                  required
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  {isEMR ? '추가 요청사항 (선택)' : isHomepage ? '상담 희망 내용 (선택)' : '자동화하고 싶은 업무 (선택)'}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={isEMR
                    ? '예) 현재 사용 중인 EMR, 진료과, 데이터 이전 희망 여부...'
                    : isHomepage
                    ? '예) 신규 홈페이지 제작, 기존 사이트 리뉴얼...'
                    : '예) 매일 여러 사이트에서 가격 정보를 수집해서 엑셀로 정리하는 작업...'
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600">{errorMsg}</p>
              )}

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
                {isEMR ? '무료 데모 신청하기' : isHomepage ? '무료 진단 신청하기' : '무료 상담 신청하기'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

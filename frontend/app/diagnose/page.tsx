'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, Phone, MapPin, Wallet,
  Calendar, Stethoscope, Loader2, Sparkles, Target, ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { HomeHeader, HomeFooter } from '@/components/home';
import { setGuestToken, rememberPhoneTail } from '@/lib/auth/guestToken';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Meta {
  stages: { key: string; label: string }[];
  categories: { key: string; label: string }[];
  timelines: string[];
  specialties: string[];
  budget_options_만: { label: string; max: number | null }[];
}

interface FormData {
  specialty: string;
  timeline: string;
  region_sido: string;
  region_sigungu: string;
  budget_max_만: number | null;
  opening_stage: string;
  pain_categories: string[];
  has_partner: boolean;
  needs_loan: boolean;
  name: string;
  phone: string;
  email: string;
  consent_marketing: boolean;
}

interface DiagnosisResult {
  lead_id: string;
  name: string;
  readiness_score: number;
  opening_stage: string;
  opening_stage_label: string;
  timeline_label: string;
  recommended_categories: { key: string; label: string }[];
  pain_categories: { key: string; label: string }[];
  missing_count: number;
  next_action_message: string;
  roadmap_url?: string;
  alimtalk_sent?: boolean;
}

const SIDO_OPTIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const TOTAL_STEPS = 7;

export default function DiagnosePage() {
  const searchParams = useSearchParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState('');

  const [data, setData] = useState<FormData>({
    specialty: '',
    timeline: '',
    region_sido: '',
    region_sigungu: '',
    budget_max_만: null,
    opening_stage: '',
    pain_categories: [],
    has_partner: false,
    needs_loan: false,
    name: '',
    phone: '',
    email: '',
    consent_marketing: true,
  });

  useEffect(() => {
    fetch(`${apiUrl}/diagnosis/meta`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setMeta(d));
  }, []);

  const progress = (step / TOTAL_STEPS) * 100;

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!data.specialty;
      case 2: return !!data.timeline;
      case 3: return !!data.region_sido;
      case 4: return data.budget_max_만 !== null || data.budget_max_만 === null && data.specialty !== '';
      case 5: return !!data.opening_stage;
      case 6: return true;
      case 7: return !!data.name && !!data.phone && data.consent_marketing;
      default: return false;
    }
  }, [step, data]);

  const next = () => {
    if (!canNext) return;
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else submit();
  };
  const prev = () => { if (step > 1) setStep(s => s - 1); };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const utm_source = searchParams?.get('utm_source') || undefined;
      const utm_campaign = searchParams?.get('utm_campaign') || undefined;
      const res = await fetch(`${apiUrl}/diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, utm_source, utm_campaign }),
      });
      if (res.ok) {
        const r: DiagnosisResult = await res.json();
        // 토큰 자동 저장 — 무로그인 식별 핵심
        if (r.roadmap_url) {
          try {
            const u = new URL(r.roadmap_url);
            const t = u.searchParams.get('token');
            if (t) setGuestToken(t);
          } catch { /* relative url 무시 */ }
        }
        rememberPhoneTail(data.phone);
        setResult(r);
      } else {
        const e = await res.json();
        setError(e.detail || '제출 실패');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <HomeHeader />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {result ? (
            <ResultCard result={result} />
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3182f6]/10 text-[#3182f6] text-sm font-medium mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  1분 개원 진단
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  무엇이 가장 막막한지 알려주세요
                </h1>
                <p className="text-sm text-muted-foreground">
                  현 상황을 진단해 준비도 점수와 맞춤 협력사를 추천해드립니다
                </p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{step}/{TOTAL_STEPS} 단계</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#3182f6] to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Step content */}
              <div className="bg-background border border-foreground/8 rounded-3xl p-6 md:p-8 min-h-[360px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step === 1 && (
                      <Step
                        icon={Stethoscope} title="진료과를 선택해주세요"
                        sub="개원하실 또는 운영 중이신 진료과목"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {meta.specialties.map(s => (
                            <Chip
                              key={s}
                              active={data.specialty === s}
                              onClick={() => setData({ ...data, specialty: s })}
                            >
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </Step>
                    )}

                    {step === 2 && (
                      <Step
                        icon={Calendar} title="언제쯤 개원 예정이신가요?"
                        sub="대략적인 시기로 충분합니다"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {meta.timelines.map(t => (
                            <Chip
                              key={t}
                              active={data.timeline === t}
                              onClick={() => setData({ ...data, timeline: t })}
                            >
                              {t}
                            </Chip>
                          ))}
                        </div>
                      </Step>
                    )}

                    {step === 3 && (
                      <Step
                        icon={MapPin} title="개원 희망 지역은요?"
                        sub="시·도 / 시·군·구를 알려주세요"
                      >
                        <label className="block text-xs font-medium text-muted-foreground mb-1">시·도</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                          {SIDO_OPTIONS.map(s => (
                            <Chip
                              key={s}
                              active={data.region_sido === s}
                              onClick={() => setData({ ...data, region_sido: s })}
                            >
                              {s}
                            </Chip>
                          ))}
                        </div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">시·군·구 (선택)</label>
                        <input
                          value={data.region_sigungu}
                          onChange={e => setData({ ...data, region_sigungu: e.target.value })}
                          placeholder="예: 강남구"
                          className="w-full px-4 py-3 text-sm border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
                        />
                      </Step>
                    )}

                    {step === 4 && (
                      <Step
                        icon={Wallet} title="총 예산은 어느 정도인가요?"
                        sub="대략의 범위로 답해주세요. 진단에만 사용됩니다."
                      >
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {meta.budget_options_만.map(b => (
                            <Chip
                              key={b.label}
                              active={data.budget_max_만 === b.max}
                              onClick={() => setData({ ...data, budget_max_만: b.max })}
                            >
                              {b.label}
                            </Chip>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-foreground/5">
                          <Toggle
                            label="자금 조달(대출/리스) 필요"
                            value={data.needs_loan}
                            onChange={v => setData({ ...data, needs_loan: v })}
                          />
                          <Toggle
                            label="동업으로 진행"
                            value={data.has_partner}
                            onChange={v => setData({ ...data, has_partner: v })}
                          />
                        </div>
                      </Step>
                    )}

                    {step === 5 && (
                      <Step
                        icon={Target} title="현재 어느 단계까지 와 계세요?"
                        sub="가장 가까운 단계를 선택해주세요"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          {meta.stages.map(s => (
                            <button
                              key={s.key}
                              onClick={() => setData({ ...data, opening_stage: s.key })}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                                data.opening_stage === s.key
                                  ? 'bg-[#3182f6] text-white border border-[#3182f6]'
                                  : 'bg-background border border-foreground/10 hover:border-[#3182f6]/40'
                              }`}
                            >
                              <span className="text-sm font-semibold">{s.label}</span>
                              {data.opening_stage === s.key && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      </Step>
                    )}

                    {step === 6 && (
                      <Step
                        icon={Sparkles} title="가장 막막한 영역은요?"
                        sub="여러 개 선택 가능. 우리가 가장 먼저 도와드릴 부분이에요."
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {meta.categories.map(c => {
                            const active = data.pain_categories.includes(c.key);
                            return (
                              <Chip
                                key={c.key}
                                active={active}
                                onClick={() => {
                                  setData({
                                    ...data,
                                    pain_categories: active
                                      ? data.pain_categories.filter(k => k !== c.key)
                                      : [...data.pain_categories, c.key],
                                  });
                                }}
                              >
                                {c.label}
                              </Chip>
                            );
                          })}
                        </div>
                      </Step>
                    )}

                    {step === 7 && (
                      <Step
                        icon={Phone} title="결과를 받을 연락처를 알려주세요"
                        sub="전담 상담사가 1영업일 내 연락드립니다"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">이름 *</label>
                            <input
                              value={data.name}
                              onChange={e => setData({ ...data, name: e.target.value })}
                              placeholder="홍길동"
                              className="w-full px-4 py-3 text-sm border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">연락처 *</label>
                            <input
                              value={data.phone}
                              onChange={e => setData({ ...data, phone: e.target.value })}
                              placeholder="010-1234-5678"
                              className="w-full px-4 py-3 text-sm border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">이메일 (선택)</label>
                            <input
                              type="email"
                              value={data.email}
                              onChange={e => setData({ ...data, email: e.target.value })}
                              placeholder="doctor@example.com"
                              className="w-full px-4 py-3 text-sm border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
                            />
                          </div>
                          <label className="flex items-start gap-2 pt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.consent_marketing}
                              onChange={e => setData({ ...data, consent_marketing: e.target.checked })}
                              className="mt-0.5"
                            />
                            <span className="text-xs text-muted-foreground leading-relaxed">
                              <strong className="text-foreground">개인정보 수집·이용 동의</strong> · 진단 결과 안내 및 1회성 상담 연락 목적, 보관 1년. (필수)
                            </span>
                          </label>
                        </div>
                      </Step>
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={prev}
                  disabled={step === 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />이전
                </button>
                <button
                  onClick={next}
                  disabled={!canNext || submitting}
                  className="flex items-center gap-1 px-6 py-3 text-sm font-semibold bg-[#3182f6] text-white rounded-xl hover:bg-[#3182f6]/90 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : step === TOTAL_STEPS ? (
                    <>진단 결과 받기 <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>다음 <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <HomeFooter />
    </>
  );
}

function Step({
  icon: Icon, title, sub, children,
}: { icon: any; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#3182f6]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#3182f6]" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 text-sm rounded-xl transition-all ${
        active
          ? 'bg-[#3182f6] text-white border border-[#3182f6] font-semibold'
          : 'bg-background border border-foreground/10 hover:border-[#3182f6]/40 text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
        value
          ? 'bg-[#3182f6]/10 border border-[#3182f6] text-[#3182f6] font-semibold'
          : 'bg-background border border-foreground/10 hover:border-[#3182f6]/40'
      }`}
    >
      <span>{label}</span>
      <div className={`w-10 h-5 rounded-full p-0.5 ${value ? 'bg-[#3182f6]' : 'bg-foreground/10'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}

function ResultCard({ result }: { result: DiagnosisResult }) {
  const grade = result.readiness_score >= 80 ? '훌륭함'
    : result.readiness_score >= 60 ? '양호'
      : result.readiness_score >= 40 ? '보통' : '시작 단계';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-3">
          <Check className="w-3.5 h-3.5" />
          진단 완료
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          {result.name} 원장님의 개원 준비도
        </h1>
      </div>

      {/* Score card */}
      <div className="bg-foreground text-background rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3182f6]/30 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-end gap-3 mb-2">
            <span className="text-6xl font-black text-white">{result.readiness_score}</span>
            <span className="text-xl text-white/60 mb-2">/100</span>
            <span className="ml-auto px-3 py-1 rounded-full bg-white/10 text-white text-sm">{grade}</span>
          </div>
          <p className="text-white/70 text-sm">
            현재 단계: <strong className="text-white">{result.opening_stage_label}</strong> · 시기: <strong className="text-white">{result.timeline_label}</strong>
          </p>
          <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#3182f6] to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${result.readiness_score}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
          <p className="mt-4 text-white/50 text-xs">
            남은 체크리스트 <strong className="text-white">{result.missing_count}개</strong> · 추천 협력사 <strong className="text-white">{result.recommended_categories.length}개</strong>
          </p>
        </div>
      </div>

      {/* Recommended */}
      {result.recommended_categories.length > 0 && (
        <div className="bg-background border border-foreground/8 rounded-3xl p-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#3182f6]" />
            지금 매칭이 필요한 협력사
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {result.recommended_categories.map(c => (
              <Link
                key={c.key}
                href={`/partners?category=${c.key}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-[#3182f6]/10 text-sm font-medium text-foreground transition-colors"
              >
                <span>{c.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Next action */}
      <div className="bg-[#3182f6]/5 border border-[#3182f6]/20 rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3182f6] flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1">전담 상담사 배정 완료</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.next_action_message}</p>
          </div>
        </div>
      </div>

      {/* Trust */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        진단 정보는 1회성 상담 외 외부 공유되지 않습니다
      </div>

      {result.roadmap_url && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-900 mb-1">
                {result.alimtalk_sent
                  ? '카톡으로 결과를 발송했어요'
                  : '본인 미션맵 링크가 발급되었어요'}
              </h3>
              <p className="text-xs text-emerald-700 leading-relaxed mb-3">
                미션맵에서 단계별 체크리스트, 매칭된 협력사, 견적 비교를 본인이 직접 확인하고 관리할 수 있어요.
              </p>
              <a
                href={result.roadmap_url}
                className="inline-flex items-center gap-1 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
              >
                내 미션맵 바로 보기 <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/partners" className="flex-1 px-6 py-3 text-sm font-semibold text-center bg-foreground text-background rounded-2xl hover:opacity-90">
          협력사 직접 둘러보기
        </Link>
        <Link href="/" className="flex-1 px-6 py-3 text-sm font-semibold text-center border border-foreground/15 rounded-2xl hover:bg-muted/50">
          홈으로
        </Link>
      </div>
    </motion.div>
  );
}

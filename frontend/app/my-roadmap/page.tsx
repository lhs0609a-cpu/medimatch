'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle, Circle, MapPin, Stethoscope, Phone, Calendar,
  Sparkles, Target, ChevronRight, AlertTriangle, Loader2,
  Star, FileText, Award, ShieldCheck,
} from 'lucide-react';
import { HomeHeader, HomeFooter } from '@/components/home';
import { DiagnoseMockup } from '@/components/home/mockups/DomainScreens';
import { resolveGuestToken, clearGuestToken } from '@/lib/auth/guestToken';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ChecklistItem {
  key: string; label: string; weight: number;
  partner_categories: string[]; done: boolean; completed_at?: string; note?: string;
}

interface Match {
  id: number; category: string; category_label: string;
  partner_name?: string; partner_phone?: string; partner_rating?: number;
  partner_review_count: number; partner_sido?: string; partner_sigungu?: string;
  status: string; quoted_amount?: number; contracted_amount?: number;
}

interface QuoteSummary {
  category: string; category_label: string; count: number;
  min_amount: number; max_amount: number; avg_amount: number; spread_pct: number;
}

interface Milestone {
  id: number; stage?: string; stage_label?: string;
  title: string; description?: string;
  due_at?: string; completed_at?: string; status: string;
}

interface Roadmap {
  name: string;
  specialty?: string;
  target_region_sido?: string;
  target_region_sigungu?: string;
  target_open_date?: string;
  opening_stage: string;
  opening_stage_label: string;
  stage_progress_pct: number;
  stages: { key: string; label: string; passed: boolean; current: boolean }[];
  readiness_score: number;
  checklist: Record<string, ChecklistItem[]>;
  recommended_categories: { key: string; label: string }[];
  matches: Match[];
  quote_summary: QuoteSummary[];
  milestones: Milestone[];
  consultant_name: string;
  consultant_phone: string;
}

const STATUS_LABEL: Record<string, string> = {
  SUGGESTED: '추천', INTRODUCED: '소개', IN_PROGRESS: '진행',
  QUOTED: '견적', CONTRACTED: '계약 완료', REJECTED: '거절',
};
const STATUS_COLOR: Record<string, string> = {
  SUGGESTED: 'bg-gray-100 text-gray-600',
  INTRODUCED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-violet-50 text-violet-700',
  QUOTED: 'bg-amber-50 text-amber-700',
  CONTRACTED: 'bg-emerald-50 text-emerald-700',
};

function fmtKRW(n?: number | null): string {
  if (!n) return '-';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}


export default function MyRoadmapPage() {
  return (
    <Suspense fallback={<RoadmapLoading />}>
      <RoadmapInner />
    </Suspense>
  );
}

function RoadmapLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function RoadmapInner() {
  const params = useSearchParams();
  // URL token 우선, 없으면 localStorage. URL에 있으면 자동으로 localStorage에 저장됨.
  const [token, setToken] = useState<string>('');
  useEffect(() => {
    const urlToken = params?.get('token') || '';
    const resolved = urlToken || resolveGuestToken() || '';
    setToken(resolved);
  }, [params]);

  const [data, setData] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) { setError('NO_TOKEN'); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/roadmap/me?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const e = await res.json().catch(() => ({}));
        // 410(만료) 또는 404(존재 안 함) → 저장된 토큰 폐기
        if (res.status === 410 || res.status === 404) clearGuestToken();
        setError(e.detail || '불러오지 못했습니다.');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleItem = async (stage: string, item_key: string, done: boolean) => {
    const res = await fetch(`${apiUrl}/roadmap/me/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, stage, item_key, done }),
    });
    if (res.ok) fetchData();
  };

  if (loading) return <RoadmapLoading />;

  if (error || !data) {
    const noToken = error === 'NO_TOKEN';
    return (
      <>
        <HomeHeader />
        <main className="min-h-screen px-4 pt-24 pb-16">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            {/* 좌측: 안내 */}
            <div className="text-center lg:text-left">
              {noToken ? (
                <>
                  <Sparkles className="w-12 h-12 text-[#3182f6] mb-4 mx-auto lg:mx-0" />
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">아직 진단을 안 하셨어요</h1>
                  <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                    메디플라톤은 가입·로그인 없이 1분 진단으로 시작합니다.<br />
                    진단하시면 우측처럼 본인 미션맵이 자동 생성돼요.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 mx-auto lg:mx-0" />
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">링크가 만료됐거나 유효하지 않아요</h1>
                  <p className="text-base text-muted-foreground mb-6">
                    카톡으로 새 링크를 받으시거나 다시 진단해주세요.
                  </p>
                </>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start">
                <Link href="/diagnose" className="inline-flex items-center justify-center gap-1 px-5 py-3 text-sm font-bold bg-foreground text-background rounded-xl">
                  {noToken ? '1분 진단으로 시작' : '다시 진단받기'} <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/recover" className="inline-flex items-center justify-center gap-1 px-5 py-3 text-sm font-semibold border border-foreground/15 rounded-xl hover:bg-muted/40">
                  카톡으로 링크 받기
                </Link>
              </div>
            </div>

            {/* 우측: 실제 미션맵 화면 미리보기 */}
            <div>
              <DiagnoseMockup />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                실제 미션맵 화면 — 진단 직후 받게 되는 결과
              </p>
            </div>
          </div>
        </main>
        <HomeFooter />
      </>
    );
  }

  const stageOrder = data.stages.map(s => s.key);
  const grade = data.readiness_score >= 80 ? '훌륭함'
    : data.readiness_score >= 60 ? '양호'
      : data.readiness_score >= 40 ? '보통' : '시작 단계';

  const upcomingMilestones = [...data.milestones]
    .filter(m => m.status !== 'DONE')
    .sort((a, b) => (a.due_at || '').localeCompare(b.due_at || ''))
    .slice(0, 5);

  return (
    <>
      <HomeHeader />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-foreground text-background rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#3182f6]/30 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs mb-4">
                <Sparkles className="w-3 h-3" />
                나의 개원 미션맵
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">{data.name} 원장님</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                {data.specialty && (
                  <span className="flex items-center gap-1"><Stethoscope className="w-4 h-4" />{data.specialty}</span>
                )}
                {data.target_region_sido && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />{data.target_region_sido} {data.target_region_sigungu || ''}
                  </span>
                )}
                {data.target_open_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(data.target_open_date).toLocaleDateString('ko-KR')} 개원 예정
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/60 mb-1">개원 준비도</div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black">{data.readiness_score}</span>
                    <span className="text-lg text-white/60 mb-1">/100</span>
                    <span className="ml-2 px-2 py-1 rounded-full bg-white/10 text-xs mb-1">{grade}</span>
                  </div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#3182f6] to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.readiness_score}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60 mb-1">현재 단계</div>
                  <div className="text-2xl font-bold">{data.opening_stage_label}</div>
                  <div className="text-xs text-white/60 mt-1">전체 9단계 중 {stageOrder.indexOf(data.opening_stage) + 1}번째</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stage stepper */}
          <div className="bg-background border border-foreground/8 rounded-3xl p-6">
            <div className="text-sm font-bold mb-4">단계 진행</div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1">
              {data.stages.map((s, i) => (
                <div key={s.key} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    s.current ? 'bg-[#3182f6] text-white shadow-lg shadow-[#3182f6]/30'
                      : s.passed ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {s.passed && !s.current ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[11px] leading-tight ${
                    s.current ? 'text-foreground font-bold'
                      : s.passed ? 'text-foreground/70' : 'text-muted-foreground'
                  }`}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 두 컬럼: 체크리스트 + 추천/매칭 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 체크리스트 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-background border border-foreground/8 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">단계별 체크리스트</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      완료한 항목은 클릭해서 표시해주세요. 자동 계산됩니다.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">총 {Object.values(data.checklist).flat().length}개</span>
                </div>

                <div className="space-y-5">
                  {stageOrder.map(stage => {
                    const items = data.checklist[stage] || [];
                    if (items.length === 0) return null;
                    const stageInfo = data.stages.find(s => s.key === stage);
                    const allDone = items.every(i => i.done);
                    return (
                      <div key={stage} className={`rounded-2xl p-4 ${
                        stageInfo?.current ? 'bg-[#3182f6]/5 border border-[#3182f6]/20' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`text-xs font-bold uppercase tracking-wider ${
                            stageInfo?.current ? 'text-[#3182f6]' : 'text-muted-foreground'
                          }`}>
                            {stageInfo?.label} {allDone && '✓'}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {items.filter(i => i.done).length}/{items.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {items.map(it => (
                            <button
                              key={it.key}
                              onClick={() => toggleItem(stage, it.key, !it.done)}
                              className="w-full flex items-start gap-2 px-2 py-2 hover:bg-background rounded-xl text-left transition-colors"
                            >
                              {it.done ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                              )}
                              <span className={`flex-1 text-sm ${
                                it.done ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}>{it.label}</span>
                              {!it.done && it.partner_categories.length > 0 && (
                                <span className="text-[10px] text-[#3182f6] bg-[#3182f6]/10 px-2 py-0.5 rounded-full">
                                  매칭 가능
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 다가오는 마일스톤 */}
              {upcomingMilestones.length > 0 && (
                <div className="bg-background border border-foreground/8 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-[#3182f6]" />
                    <h2 className="text-lg font-bold">다가오는 일정</h2>
                  </div>
                  <div className="space-y-2">
                    {upcomingMilestones.map(m => {
                      const overdue = m.due_at && new Date(m.due_at) < new Date();
                      return (
                        <div key={m.id} className={`flex items-start gap-3 p-3 rounded-xl ${
                          overdue ? 'bg-red-50' : 'bg-muted/30'
                        }`}>
                          <div className={`mt-1 w-2 h-2 rounded-full ${
                            overdue ? 'bg-red-500' : 'bg-[#3182f6]'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{m.title}</div>
                            {m.stage_label && (
                              <div className="text-xs text-muted-foreground mt-0.5">{m.stage_label}</div>
                            )}
                          </div>
                          {m.due_at && (
                            <div className={`text-xs ${overdue ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                              {new Date(m.due_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 사이드: 추천 + 매칭 + 견적 */}
            <div className="space-y-4">
              {/* 우선 매칭 추천 */}
              {data.recommended_categories.length > 0 && (
                <div className="bg-background border border-foreground/8 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#3182f6]" />
                    <h3 className="text-sm font-bold">우선 매칭 필요</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    현재 단계에서 가장 도움될 협력사
                  </p>
                  <div className="space-y-1.5">
                    {data.recommended_categories.slice(0, 6).map(c => (
                      <div key={c.key} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
                        <span className="text-sm font-medium">{c.label}</span>
                        <span className="text-[10px] text-muted-foreground">상담사 매칭</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 견적 비교 요약 */}
              {data.quote_summary.length > 0 && (
                <div className="bg-background border border-foreground/8 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold">견적 비교</h3>
                  </div>
                  <div className="space-y-3">
                    {data.quote_summary.map(q => (
                      <div key={q.category} className="border border-foreground/5 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{q.category_label}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                            {q.count}곳 비교
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">최저</div>
                            <div className="font-bold text-emerald-700">{fmtKRW(q.min_amount)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">평균</div>
                            <div className="font-bold">{fmtKRW(q.avg_amount)}</div>
                          </div>
                        </div>
                        {q.spread_pct > 0 && (
                          <div className="mt-2 text-[11px] text-muted-foreground">
                            업체간 가격차 <strong className="text-foreground">{q.spread_pct}%</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 매칭된 협력사 */}
              {data.matches.length > 0 && (
                <div className="bg-background border border-foreground/8 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-bold">매칭 협력사 ({data.matches.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {data.matches.map(m => (
                      <div key={m.id} className="border border-foreground/5 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium truncate">{m.partner_name || `${m.category_label} 매칭 대기`}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLOR[m.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[m.status] || m.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{m.category_label}</div>
                        {m.partner_rating !== null && m.partner_rating !== undefined && (
                          <div className="flex items-center gap-1 mt-1 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{m.partner_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({m.partner_review_count})</span>
                            {m.partner_sido && (
                              <span className="text-muted-foreground ml-1">· {m.partner_sido}</span>
                            )}
                          </div>
                        )}
                        {m.contracted_amount && (
                          <div className="text-[11px] text-emerald-700 mt-1">
                            계약 완료 · {fmtKRW(m.contracted_amount)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상담사 카드 */}
              <div className="bg-[#3182f6] text-white rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  <h3 className="text-sm font-bold">전담 상담사</h3>
                </div>
                <div className="text-base font-bold">{data.consultant_name}</div>
                <a href={`tel:${data.consultant_phone}`} className="text-2xl font-black mt-1 block">
                  {data.consultant_phone}
                </a>
                <p className="text-xs text-white/80 mt-2">
                  체크리스트·매칭·견적 도움이 필요하시면 언제든 연락주세요.
                </p>
              </div>

              {/* 보안 안내 */}
              <div className="flex items-start gap-2 px-3 py-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>이 링크는 본인 전용입니다. 외부 공유를 삼가해주세요.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <HomeFooter />
    </>
  );
}

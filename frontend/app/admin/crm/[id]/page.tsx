'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, User, Briefcase, Calendar,
  CheckCircle, Circle, Sparkles, MessageCircle, Plus, X, Save,
  Building2, Wallet, AlertTriangle, ChevronRight, Loader2, FileText,
} from 'lucide-react';
import { QuoteMatrix } from '@/components/crm/QuoteMatrix';
import { Timeline } from '@/components/crm/Timeline';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

interface ChecklistItem {
  key: string; label: string; weight: number;
  partner_categories: string[]; done: boolean; completed_at?: string; note?: string;
}
interface Consultation {
  id: string; user_id?: string; contact_method: string; direction: string;
  duration_seconds: number; summary?: string; outcome: string;
  next_action?: string; next_followup_at?: string; created_at: string;
  pain_points: string[]; talked_about: string[];
}
interface PartnerMatch {
  id: number; partner_id?: number; partner_name?: string; partner_phone?: string;
  category: string; category_label: string; status: string; match_reason?: string;
  quoted_amount?: number; contracted_amount?: number; commission_rate?: number;
  commission_amount?: number; matched_at: string; introduced_at?: string;
  contracted_at?: string; note?: string;
}
interface Milestone {
  id: number; lead_id: string; stage?: string; stage_label?: string;
  title: string; description?: string;
  due_at?: string; started_at?: string; completed_at?: string;
  status: string; source: string; partner_match_id?: number;
  visible_to_doctor: boolean; visible_to_partner: boolean;
  order_index: number; created_at: string;
}

interface Lead {
  id: string; name: string; phone?: string; email?: string;
  specialty?: string; sub_specialty?: string; current_workplace?: string;
  target_region_sido?: string; target_region_sigungu?: string; target_region_dong?: string;
  target_open_date?: string; budget_total?: number; needs_loan?: boolean; has_partner?: boolean;
  funnel_stage: string; opening_stage: string; priority: string;
  lead_score: number; readiness_score: number;
  next_action?: string; next_followup_at?: string; last_contacted_at?: string;
  notes?: string; source?: string; created_at: string;
  checklist: Record<string, ChecklistItem[]>;
  consultations: Consultation[];
  partner_matches: PartnerMatch[];
  milestones: Milestone[];
  recommended_categories: string[];
}

const STAGE_LABELS: Record<string, string> = {
  PLANNING: '사업계획', LOCATION_REVIEW: '입지검토', CONTRACT: '임대계약',
  LICENSING: '인허가', CONSTRUCTION: '인테리어', EQUIPMENT: '의료기기',
  HIRING: '인력채용', OPENING: '개원준비', OPERATING: '운영안정',
};
const STAGE_ORDER = Object.keys(STAGE_LABELS);

const FUNNEL_LABELS: Record<string, string> = {
  NEW: '신규', CONTACTED: '컨택', ENGAGED: '관심',
  QUALIFIED: '검증', PROPOSING: '제안', NEGOTIATING: '협상',
  CONVERTED: '전환', DORMANT: '휴면', LOST: '실패',
};
const FUNNEL_ORDER = Object.keys(FUNNEL_LABELS);

const OUTCOME_LABELS: Record<string, string> = {
  NO_ANSWER: '부재', REFUSED: '거절', INTERESTED: '관심',
  FOLLOW_UP: '후속', BOOKED_MEETING: '미팅예약', PROPOSAL_SENT: '제안전달',
  CONVERTED: '전환', LOST: '실패',
};

const METHOD_LABELS: Record<string, string> = {
  PHONE: '전화', KAKAO: '카톡', SMS: '문자', EMAIL: '이메일', MEETING: '대면', OTHER: '기타',
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  SUGGESTED: '추천', INTRODUCED: '소개', IN_PROGRESS: '진행',
  QUOTED: '견적', CONTRACTED: '계약', REJECTED: '거절',
};

export default function CRMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setLead(await res.json());
    } finally { setLoading(false); }
  }, [leadId]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/partner-suggestions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const d = await res.json();
        setSuggestions(d.suggestions || []);
      }
    } catch {}
  }, [leadId]);

  useEffect(() => { if (leadId) fetchLead(); }, [leadId, fetchLead]);
  useEffect(() => { if (leadId) fetchSuggestions(); }, [leadId, fetchSuggestions]);

  const updateLead = async (patch: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(patch),
      });
      if (res.ok) await fetchLead();
    } finally { setSaving(false); }
  };

  const toggleChecklist = async (stage: string, itemKey: string, done: boolean) => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}/checklist`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ stage, item_key: itemKey, done }),
    });
    if (res.ok) {
      await fetchLead();
      fetchSuggestions();
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!lead) {
    return <div className="p-6 text-gray-500">Lead를 찾을 수 없습니다.</div>;
  }

  const currentStageIdx = STAGE_ORDER.indexOf(lead.opening_stage);
  const currentFunnelIdx = FUNNEL_ORDER.indexOf(lead.funnel_stage);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {lead.name}
              {lead.specialty && <span className="text-sm font-normal text-gray-500">· {lead.specialty}</span>}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lead.phone}</span>}
              {lead.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{lead.email}</span>}
              {lead.target_region_sido && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {lead.target_region_sido} {lead.target_region_sigungu}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScript(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700">
            <Sparkles className="w-4 h-4" />상담 스크립트
          </button>
          <button onClick={() => setShowCallModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <Phone className="w-4 h-4" />통화 기록
          </button>
        </div>
      </div>

      {/* Funnel pipeline */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="text-xs text-gray-500 mb-2">CRM 퍼널</div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {FUNNEL_ORDER.filter(f => !['DORMANT', 'LOST'].includes(f)).map((f, i, arr) => {
            const idx = FUNNEL_ORDER.indexOf(f);
            const passed = currentFunnelIdx >= idx;
            const current = lead.funnel_stage === f;
            return (
              <button
                key={f}
                onClick={() => updateLead({ funnel_stage: f })}
                className={`flex-1 min-w-[80px] py-2 text-xs rounded-lg transition-all ${
                  current ? 'bg-blue-600 text-white font-medium'
                    : passed ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {FUNNEL_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Opening stage tracker */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500">개원 단계</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">준비도</span>
            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                   style={{ width: `${lead.readiness_score}%` }} />
            </div>
            <span className="font-semibold text-gray-900">{lead.readiness_score}%</span>
          </div>
        </div>
        <div className="grid grid-cols-9 gap-1">
          {STAGE_ORDER.map((s, i) => {
            const passed = currentStageIdx >= i;
            const current = lead.opening_stage === s;
            return (
              <button
                key={s}
                onClick={() => updateLead({ opening_stage: s })}
                className={`py-2 px-1 text-[11px] rounded-lg transition-all leading-tight ${
                  current ? 'bg-emerald-600 text-white font-medium'
                    : passed ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Profile + Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">프로필</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={Briefcase} label="현재 근무" value={lead.current_workplace} />
              <InfoRow icon={Calendar} label="희망 개원일" value={lead.target_open_date ? new Date(lead.target_open_date).toLocaleDateString('ko-KR') : null} />
              <InfoRow icon={Wallet} label="예산" value={lead.budget_total ? fmtKRW(lead.budget_total) : null} />
              <InfoRow icon={User} label="동업" value={lead.has_partner ? '동업' : '단독'} />
              <InfoRow icon={Building2} label="대출 필요" value={lead.needs_loan ? '예' : '아니오'} />
              <InfoRow icon={Sparkles} label="출처" value={lead.source} />
            </div>
            {lead.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">메모</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
            {lead.next_action && (
              <div className="mt-3 p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-amber-900">다음 액션</div>
                  <div className="text-amber-700">{lead.next_action}</div>
                  {lead.next_followup_at && (
                    <div className="text-xs text-amber-600 mt-1">
                      {new Date(lead.next_followup_at).toLocaleString('ko-KR')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Checklist (current stage + adjacent) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-900">단계별 체크리스트</div>
              <span className="text-xs text-gray-500">현재 단계: {STAGE_LABELS[lead.opening_stage]}</span>
            </div>
            <div className="space-y-4">
              {STAGE_ORDER.map(stage => {
                const items = lead.checklist[stage] || [];
                if (items.length === 0) return null;
                const allDone = items.every(i => i.done);
                const isCurrent = stage === lead.opening_stage;
                return (
                  <div key={stage} className={`rounded-xl ${isCurrent ? 'bg-blue-50 p-3 -m-3' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-medium uppercase tracking-wider ${
                        isCurrent ? 'text-blue-700' : 'text-gray-400'
                      }`}>
                        {STAGE_LABELS[stage]} {allDone && '✓'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {items.filter(i => i.done).length}/{items.length}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {items.map(it => (
                        <button
                          key={it.key}
                          onClick={() => toggleChecklist(stage, it.key, !it.done)}
                          className="w-full flex items-start gap-2 px-2 py-1.5 hover:bg-white rounded-lg text-left"
                        >
                          {it.done ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <span className={`flex-1 text-sm ${it.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {it.label}
                          </span>
                          {!it.done && it.partner_categories.length > 0 && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                              {it.partner_categories.length}개 협력사
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

          {/* Consultations */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">상담 기록</div>
            {lead.consultations.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">아직 통화 기록이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {lead.consultations.map(c => (
                  <div key={c.id} className="border-l-2 border-blue-200 pl-3 pb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">{METHOD_LABELS[c.contact_method]}</span>
                      <span>·</span>
                      <span>{OUTCOME_LABELS[c.outcome]}</span>
                      {c.duration_seconds > 0 && (
                        <>
                          <span>·</span>
                          <span>{Math.round(c.duration_seconds / 60)}분</span>
                        </>
                      )}
                      <span className="ml-auto">{new Date(c.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                    {c.summary && <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.summary}</p>}
                    {c.pain_points.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.pain_points.map((p, i) => (
                          <span key={i} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded-full">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {c.next_action && (
                      <div className="mt-2 text-xs text-gray-600">
                        → {c.next_action}
                        {c.next_followup_at && (
                          <span className="ml-1 text-amber-600">
                            ({new Date(c.next_followup_at).toLocaleDateString('ko-KR')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Partner suggestions + matches */}
        <div className="space-y-4">
          {/* Recommended partners */}
          {suggestions.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="text-sm font-semibold text-gray-900 mb-1">추천 협력사</div>
              <p className="text-xs text-gray-500 mb-3">현재 단계 미완료 항목 기준</p>
              <div className="space-y-3">
                {suggestions.map(s => (
                  <div key={s.category} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">{s.category_label}</div>
                      <button
                        onClick={async () => {
                          const res = await fetch(`${apiUrl}/crm/leads/${leadId}/partner-matches`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                            body: JSON.stringify({ category: s.category, match_reason: '단계 추천' }),
                          });
                          if (res.ok) fetchLead();
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        + 추가
                      </button>
                    </div>
                    {s.partners.length === 0 ? (
                      <p className="text-xs text-gray-400">등록 파트너 없음</p>
                    ) : (
                      <div className="space-y-1">
                        {s.partners.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-800 truncate">{p.name}</div>
                              <div className="text-gray-500">
                                {p.sido} {p.sigungu} · ★ {p.rating.toFixed(1)} ({p.review_count})
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const res = await fetch(`${apiUrl}/crm/leads/${leadId}/partner-matches`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                                  body: JSON.stringify({ category: s.category, partner_id: p.id, match_reason: '추천 매칭' }),
                                });
                                if (res.ok) fetchLead();
                              }}
                              className="ml-2 text-blue-600 hover:underline whitespace-nowrap"
                            >연결</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active matches */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-3">매칭된 협력사 ({lead.partner_matches.length})</div>
            {lead.partner_matches.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">아직 매칭이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {lead.partner_matches.map(m => (
                  <PartnerMatchRow key={m.id} match={m} onUpdate={fetchLead} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공유 타임라인 */}
      <Timeline
        leadId={lead.id}
        milestones={lead.milestones || []}
        onChanged={fetchLead}
      />

      {/* 견적 비교 매트릭스 — 매칭이 있는 카테고리별 */}
      {lead.partner_matches.length > 0 && (() => {
        const byCat: Record<string, { count: number; label: string }> = {};
        lead.partner_matches.forEach(m => {
          if (!byCat[m.category]) byCat[m.category] = { count: 0, label: m.category_label };
          byCat[m.category].count += 1;
        });
        const cats = Object.entries(byCat).filter(([, v]) => v.count >= 1);
        if (cats.length === 0) return null;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mt-2">
              <FileText className="w-4 h-4 text-blue-600" />
              견적 비교 매트릭스
            </div>
            {cats.map(([cat, info]) => (
              <QuoteMatrix
                key={cat}
                leadId={lead.id}
                category={cat}
                categoryLabel={info.label}
                onChanged={fetchLead}
              />
            ))}
          </div>
        );
      })()}

      {/* Modals */}
      {showCallModal && (
        <CallLogModal
          leadId={lead.id}
          checklist={lead.checklist}
          onClose={() => setShowCallModal(false)}
          onSaved={() => { setShowCallModal(false); fetchLead(); fetchSuggestions(); }}
        />
      )}
      {showScript && (
        <ScriptModal leadId={lead.id} onClose={() => setShowScript(false)} />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 ml-auto">{value || '-'}</span>
    </div>
  );
}

function fmtKRW(n: number): string {
  if (!n) return '0';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

function PartnerMatchRow({ match, onUpdate }: { match: PartnerMatch; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(match.status);
  const [contracted, setContracted] = useState(match.contracted_amount?.toString() || '');
  const [rate, setRate] = useState(match.commission_rate?.toString() || '5');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/crm/lead-partner-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          status,
          contracted_amount: contracted ? Number(contracted) : null,
          commission_rate: rate ? Number(rate) : null,
        }),
      });
      if (res.ok) { setEditing(false); onUpdate(); }
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-gray-100 rounded-xl p-3 text-sm">
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-gray-900 font-medium">{match.partner_name || '-'}</div>
          <div className="text-xs text-gray-500">{match.category_label}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          match.status === 'CONTRACTED' ? 'bg-emerald-100 text-emerald-700'
            : match.status === 'REJECTED' ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
        }`}>
          {MATCH_STATUS_LABELS[match.status]}
        </span>
      </div>
      {match.contracted_amount && (
        <div className="text-xs text-emerald-700 mt-1">
          계약 {fmtKRW(match.contracted_amount)} → 수수료 {fmtKRW(match.commission_amount || 0)}
        </div>
      )}
      {!editing ? (
        <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline mt-1">상태 변경</button>
      ) : (
        <div className="mt-2 space-y-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg">
            {Object.entries(MATCH_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {status === 'CONTRACTED' && (
            <div className="grid grid-cols-2 gap-2">
              <input value={contracted} onChange={(e) => setContracted(e.target.value)} placeholder="계약금액"
                     className="px-2 py-1 text-xs border border-gray-200 rounded-lg" />
              <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="수수료%"
                     className="px-2 py-1 text-xs border border-gray-200 rounded-lg" />
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={save} disabled={saving}
                    className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {saving ? '저장 중…' : '저장'}
            </button>
            <button onClick={() => setEditing(false)}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg">취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CallLogModal({ leadId, checklist, onClose, onSaved }: {
  leadId: string; checklist: Record<string, ChecklistItem[]>;
  onClose: () => void; onSaved: () => void;
}) {
  const [contactMethod, setContactMethod] = useState('PHONE');
  const [outcome, setOutcome] = useState('FOLLOW_UP');
  const [duration, setDuration] = useState('');
  const [summary, setSummary] = useState('');
  const [painPointInput, setPainPointInput] = useState('');
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [nextAction, setNextAction] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          contact_method: contactMethod,
          outcome,
          duration_seconds: duration ? Number(duration) * 60 : 0,
          summary,
          pain_points: painPoints,
          next_action: nextAction,
          next_followup_at: nextFollowup ? new Date(nextFollowup).toISOString() : null,
        }),
      });
      if (res.ok) onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">통화·상담 기록</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">방식</label>
              <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl">
                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">결과</label>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl">
                {Object.entries(OUTCOME_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">통화 시간(분)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">통화 요약</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
                      placeholder="대화 핵심을 한두 문장으로…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">불편·니즈 (Enter로 추가)</label>
            <input value={painPointInput} onChange={(e) => setPainPointInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && painPointInput.trim()) {
                       e.preventDefault();
                       setPainPoints([...painPoints, painPointInput.trim()]);
                       setPainPointInput('');
                     }
                   }}
                   placeholder="예: 세무사 못 구함, 입지 막막"
                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
            {painPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {painPoints.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full">
                    {p}
                    <button onClick={() => setPainPoints(painPoints.filter((_, j) => j !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">다음 액션</label>
            <input value={nextAction} onChange={(e) => setNextAction(e.target.value)}
                   placeholder="예: 임대차 검토 견적 3곳 카톡 발송"
                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">후속 일정</label>
            <input type="datetime-local" value={nextFollowup} onChange={(e) => setNextFollowup(e.target.value)}
                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl">취소</button>
          <button onClick={submit} disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50">
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScriptModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [useAi, setUseAi] = useState(true);

  const fetchScript = (ai: boolean) => {
    setLoading(true);
    fetch(`${apiUrl}/crm/leads/${leadId}/script?use_ai=${ai}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setScript(d); setLoading(false); });
  };

  useEffect(() => {
    fetchScript(useAi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />상담 스크립트
            </h2>
            {script?.generated_by && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                script.generated_by === 'ai'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {script.generated_by === 'ai' ? 'AI 생성' : '룰 기반'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = !useAi; setUseAi(next); fetchScript(next); }}
              className="text-xs text-violet-600 hover:underline"
            >
              {useAi ? '룰로 보기' : 'AI로 보기'}
            </button>
            <button
              onClick={() => fetchScript(useAi)}
              className="text-xs text-gray-500 hover:text-gray-700"
              title="새로고침"
            >
              ↻
            </button>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          ) : !script ? (
            <p className="text-gray-500">생성 실패</p>
          ) : (
            <>
              <div className="text-xs text-gray-500">현재 단계: <span className="font-semibold text-gray-900">{script.stage_label}</span></div>
              <Section title="오프닝">
                <p className="text-sm text-gray-800 leading-relaxed">{script.opening}</p>
              </Section>
              <Section title="후크 (관심 끌기)">
                <p className="text-sm text-gray-800 leading-relaxed">{script.hook}</p>
              </Section>
              {script.value_cards.length > 0 && (
                <Section title="우리가 줄 수 있는 가치">
                  <div className="space-y-2">
                    {script.value_cards.map((c: any) => (
                      <div key={c.category} className="bg-violet-50 rounded-xl p-3">
                        <div className="text-xs font-semibold text-violet-900">{c.label}</div>
                        <p className="text-sm text-violet-800 mt-1">{c.pitch}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              <Section title="자주 나오는 반론 대응">
                <div className="space-y-2">
                  {script.objections.map((o: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-gray-900">Q. {o.q}</div>
                      <p className="text-sm text-gray-700 mt-1">A. {o.a}</p>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="클로징">
                <p className="text-sm text-gray-800 leading-relaxed">{script.closing}</p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

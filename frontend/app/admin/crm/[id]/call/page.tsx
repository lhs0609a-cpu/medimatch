'use client';

/**
 * 라이브 콜 콘솔 — 풀스크린
 *
 * 좌(스크립트)·중(핵심정보+다음액션)·우(체크리스트+추천파트너)·하단(통화메모)
 *
 * 통화 종료 시 outcome/next_action 자동 추출 → consultation 레코드 저장.
 * 초보 상담사도 위에서 아래로 내려가며 그대로 사용 가능.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X, Phone, PhoneOff, Sparkles, CheckCircle, Circle, ChevronRight,
  Loader2, Send, Plus, MapPin, Calendar, Wallet, Building2, Briefcase,
  AlertTriangle, Mic, FileText, MessageSquare, Target, Link2, Copy,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

interface ChecklistItem {
  key: string; label: string; weight: number;
  partner_categories: string[]; done: boolean;
}

interface PartnerSuggestion {
  category: string; category_label: string;
  partners: { id: number; name: string; phone?: string; sido?: string; sigungu?: string;
              rating: number; review_count: number; is_premium: boolean }[];
}

interface Match {
  id: number; partner_id?: number; partner_name?: string;
  category: string; category_label: string; status: string;
}

interface Lead {
  id: string; name: string; phone?: string; email?: string;
  specialty?: string; current_workplace?: string;
  target_region_sido?: string; target_region_sigungu?: string;
  target_open_date?: string; budget_total?: number;
  needs_loan: boolean; has_partner: boolean;
  funnel_stage: string; opening_stage: string; priority: string;
  lead_score: number; readiness_score: number;
  next_action?: string; notes?: string;
  checklist: Record<string, ChecklistItem[]>;
  partner_matches: Match[];
}

interface Script {
  opening: string; hook: string;
  value_cards: { category: string; label: string; pitch: string }[];
  objections: { q: string; a: string }[];
  closing: string; stage_label?: string; generated_by?: string;
}

const STAGE_LABELS: Record<string, string> = {
  PLANNING: '사업계획', LOCATION_REVIEW: '입지검토', CONTRACT: '임대계약',
  LICENSING: '인허가', CONSTRUCTION: '인테리어', EQUIPMENT: '의료기기',
  HIRING: '인력채용', OPENING: '개원준비', OPERATING: '운영안정',
};

const OUTCOME_OPTIONS = [
  { key: 'NO_ANSWER',     label: '부재중',       cls: 'bg-gray-100 text-gray-700' },
  { key: 'INTERESTED',    label: '관심 있음',     cls: 'bg-emerald-100 text-emerald-800' },
  { key: 'FOLLOW_UP',     label: '후속 필요',     cls: 'bg-blue-100 text-blue-800' },
  { key: 'BOOKED_MEETING',label: '미팅 예약',     cls: 'bg-violet-100 text-violet-800' },
  { key: 'PROPOSAL_SENT', label: '제안 전달',     cls: 'bg-indigo-100 text-indigo-800' },
  { key: 'REFUSED',       label: '거절',         cls: 'bg-amber-100 text-amber-800' },
  { key: 'CONVERTED',     label: '전환 성공',     cls: 'bg-emerald-500 text-white' },
  { key: 'LOST',          label: '실패',         cls: 'bg-red-100 text-red-800' },
];

function fmtKRW(n?: number | null): string {
  if (!n) return '-';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

export default function CallConsolePage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PartnerSuggestion[]>([]);

  // 통화 상태
  const [callActive, setCallActive] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // 통화 메모/결과
  const [outcome, setOutcome] = useState('FOLLOW_UP');
  const [summary, setSummary] = useState('');
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [painInput, setPainInput] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowupDays, setNextFollowupDays] = useState<number | null>(3);

  // 카드 진행
  const [scriptCardIdx, setScriptCardIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============ 데이터 로딩 ============
  const fetchLead = useCallback(async () => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) setLead(await res.json());
  }, [leadId]);

  const fetchScript = useCallback(async (useAi = true) => {
    setScriptLoading(true);
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/script?use_ai=${useAi}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setScript(await res.json());
    } finally { setScriptLoading(false); }
  }, [leadId]);

  const fetchSuggestions = useCallback(async () => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}/partner-suggestions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const d = await res.json();
      setSuggestions(d.suggestions || []);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    fetchLead();
    fetchScript(true);
    fetchSuggestions();
  }, [leadId, fetchLead, fetchScript, fetchSuggestions]);

  // ============ 통화 타이머 ============
  useEffect(() => {
    if (callActive && callStartedAt) {
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - callStartedAt) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callActive, callStartedAt]);

  const startCall = () => {
    setCallActive(true);
    setCallStartedAt(Date.now());
    setElapsedSec(0);
    setScriptCardIdx(0);
  };
  const endCall = () => {
    setCallActive(false);
    // 자동 next_action 추정
    if (!nextAction) {
      if (outcome === 'BOOKED_MEETING') setNextAction('미팅 일정 확정 및 자료 발송');
      else if (outcome === 'PROPOSAL_SENT') setNextAction('제안서 검토 후 후속 통화');
      else if (outcome === 'INTERESTED') setNextAction('맞춤 협력사 견적 정리해서 카톡 발송');
      else if (outcome === 'NO_ANSWER') setNextAction('재시도 (시간대 변경)');
      else if (outcome === 'FOLLOW_UP') setNextAction('단계 체크리스트 + 자료 카톡 발송');
    }
  };

  // ============ 체크리스트 1클릭 토글 ============
  const toggleCheck = async (stage: string, item_key: string, done: boolean) => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ stage, item_key: item_key, done }),
    });
    if (res.ok) { fetchLead(); fetchSuggestions(); }
  };

  // ============ 추천 파트너 → 즉시 매칭 ============
  const matchPartner = async (category: string, partner_id?: number) => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}/partner-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ category, partner_id, match_reason: '콜 콘솔에서 즉시 매칭' }),
    });
    if (res.ok) fetchLead();
  };

  // ============ 미션맵 링크 발급/복사 ============
  const issueLink = async () => {
    const res = await fetch(`${apiUrl}/crm/leads/${leadId}/roadmap-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const d = await res.json();
      setLinkUrl(d.url);
    }
  };

  const copyLink = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {}
  };

  // ============ 통화 저장 ============
  const saveConsultation = async () => {
    setSaving(true);
    setSaveOk(false);
    try {
      const next_followup_at = nextFollowupDays
        ? new Date(Date.now() + nextFollowupDays * 86_400_000).toISOString()
        : null;
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          contact_method: 'PHONE',
          duration_seconds: elapsedSec || (callStartedAt ? Math.floor((Date.now() - callStartedAt) / 1000) : 0),
          summary,
          pain_points: painPoints,
          outcome,
          next_action: nextAction || undefined,
          next_followup_at,
        }),
      });
      if (res.ok) {
        setSaveOk(true);
        setTimeout(() => router.push(`/admin/crm/${leadId}`), 800);
      }
    } finally { setSaving(false); }
  };

  if (!lead) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // 스크립트 카드 시퀀스: opening → hook → value_cards[] → objections[] → closing
  const cards: { type: string; title: string; body: string; sub?: string }[] = [];
  if (script) {
    cards.push({ type: 'opening', title: '오프닝', body: script.opening });
    cards.push({ type: 'hook', title: '후크 — 관심 끌기', body: script.hook });
    script.value_cards.forEach(v => cards.push({
      type: 'value', title: `가치 제안 — ${v.label}`, body: v.pitch, sub: v.category,
    }));
    script.objections.forEach((o, i) => cards.push({
      type: 'objection', title: `반론 ${i + 1} 대응`, body: `Q. ${o.q}\n\nA. ${o.a}`,
    }));
    cards.push({ type: 'closing', title: '클로징', body: script.closing });
  }

  const currentCard = cards[scriptCardIdx];
  const checklistByStage = lead.checklist || {};
  const currentStageItems = checklistByStage[lead.opening_stage] || [];
  const matchedCategories = new Set(lead.partner_matches.map(m => m.category));

  return (
    <div className="fixed inset-0 bg-gray-900 text-gray-100 z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">콜 콘솔</div>
          <div className="text-base font-bold">{lead.name}</div>
          {lead.specialty && <div className="text-sm text-gray-400">· {lead.specialty}</div>}
          {lead.target_region_sido && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{lead.target_region_sido} {lead.target_region_sigungu || ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {callActive ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-mono font-bold">
                  {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-semibold"
              >
                <PhoneOff className="w-4 h-4" />통화 종료
              </button>
            </>
          ) : (
            <>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="text-sm text-gray-400">
                  {lead.phone}
                </a>
              )}
              <button
                onClick={startCall}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold"
              >
                <Phone className="w-4 h-4" />통화 시작
              </button>
            </>
          )}
          <Link
            href={`/admin/crm/${leadId}`}
            className="p-2 text-gray-400 hover:text-white rounded-lg"
            title="콜 콘솔 종료"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Main 3-column */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* 좌 — 스크립트 큐시트 */}
        <div className="col-span-4 bg-gray-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold">상담 스크립트</span>
              {script?.generated_by && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  script.generated_by === 'ai' ? 'bg-violet-500/30 text-violet-200' : 'bg-gray-700 text-gray-400'
                }`}>
                  {script.generated_by === 'ai' ? 'AI' : '룰'}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchScript(true)}
              className="text-xs text-violet-300 hover:text-violet-200"
              title="새로고침"
            >↻ 재생성</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {scriptLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto mt-12" />
            ) : !currentCard ? (
              <p className="text-sm text-gray-500 text-center mt-12">스크립트 생성 실패</p>
            ) : (
              <>
                <div className="text-xs text-gray-500 mb-2">
                  {scriptCardIdx + 1} / {cards.length} · {currentCard.title}
                </div>
                <div className="bg-gradient-to-br from-violet-900/40 to-violet-800/30 border border-violet-700/40 rounded-2xl p-5 mb-4 min-h-[260px]">
                  <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-100">
                    {currentCard.body}
                  </div>
                </div>

                {/* 카드 점프 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cards.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setScriptCardIdx(i)}
                      className={`w-7 h-7 text-[10px] rounded-md ${
                        i === scriptCardIdx ? 'bg-violet-500 text-white'
                          : i < scriptCardIdx ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}
                      title={c.title}
                    >{i + 1}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex border-t border-gray-700">
            <button
              onClick={() => setScriptCardIdx(i => Math.max(0, i - 1))}
              disabled={scriptCardIdx === 0}
              className="flex-1 px-4 py-3 text-sm hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent border-r border-gray-700"
            >이전</button>
            <button
              onClick={() => setScriptCardIdx(i => Math.min(cards.length - 1, i + 1))}
              disabled={scriptCardIdx >= cards.length - 1}
              className="flex-1 px-4 py-3 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-30 font-semibold"
            >다음 →</button>
          </div>
        </div>

        {/* 중 — 핵심정보 + 다음액션 */}
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
          {/* 의사 핵심 3줄 */}
          <div className="bg-gray-800 rounded-2xl p-5 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-3">한눈에 보는 의사</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <CoreFact icon={Briefcase} label="현재 근무" value={lead.current_workplace || '-'} />
              <CoreFact icon={Calendar} label="개원 시기" value={lead.target_open_date ? new Date(lead.target_open_date).toLocaleDateString('ko-KR') : '-'} />
              <CoreFact icon={Wallet} label="예산" value={fmtKRW(lead.budget_total)} />
              <CoreFact icon={Building2} label="대출 필요" value={lead.needs_loan ? '예' : '아니오'} />
            </div>

            {/* 준비도 게이지 */}
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>개원 준비도</span>
                <span>{STAGE_LABELS[lead.opening_stage]}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                       style={{ width: `${lead.readiness_score}%` }} />
                </div>
                <span className="text-sm font-bold text-white">{lead.readiness_score}</span>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-gray-500 mb-1">메모</div>
                <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-3">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* 다음 한 가지 행동 — 가장 큰 카드 */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 rounded-2xl p-5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">다음 한 가지 행동</span>
            </div>
            <div className="text-base font-bold text-white">
              {nextAction || lead.next_action || '통화 종료 시 자동 추정됩니다.'}
            </div>
            {nextFollowupDays !== null && (
              <div className="mt-2 text-xs text-amber-200/80">
                후속 일정: {nextFollowupDays === 0 ? '오늘'
                  : nextFollowupDays === 1 ? '내일'
                    : `${nextFollowupDays}일 뒤`} 자동 등록 예정
              </div>
            )}
          </div>

          {/* 미션맵 매직링크 */}
          <div className="bg-gray-800 rounded-2xl p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">의사 미션맵 링크</span>
              </div>
              {!linkUrl && (
                <button
                  onClick={issueLink}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >발급</button>
              )}
            </div>
            {linkUrl ? (
              <div className="space-y-2">
                <input
                  readOnly
                  value={linkUrl}
                  className="w-full px-3 py-2 text-xs bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Copy className="w-3 h-3" />
                    {linkCopied ? '복사됨!' : '복사'}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('미션맵 링크: ' + linkUrl)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                  >
                    <Send className="w-3 h-3" />공유
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">의사가 본인 진행도/매칭/견적을 직접 볼 수 있는 링크.</p>
            )}
          </div>
        </div>

        {/* 우 — 체크리스트 + 추천 파트너 */}
        <div className="col-span-4 bg-gray-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-700">
            <div className="flex-1 px-4 py-3 text-sm font-semibold border-r border-gray-700">
              <CheckCircle className="w-4 h-4 inline mr-1.5 text-emerald-400" />
              현재 단계 체크
            </div>
            <div className="flex-1 px-4 py-3 text-sm font-semibold">
              <Sparkles className="w-4 h-4 inline mr-1.5 text-violet-400" />
              추천 파트너
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
            {/* 체크리스트 */}
            <div className="overflow-y-auto p-3 border-r border-gray-700">
              <div className="text-xs text-gray-500 mb-2">{STAGE_LABELS[lead.opening_stage]}</div>
              <div className="space-y-1">
                {currentStageItems.length === 0 ? (
                  <p className="text-xs text-gray-500">항목 없음</p>
                ) : currentStageItems.map(it => (
                  <button
                    key={it.key}
                    onClick={() => toggleCheck(lead.opening_stage, it.key, !it.done)}
                    className="w-full flex items-start gap-2 px-2 py-2 hover:bg-gray-700 rounded-lg text-left text-xs"
                  >
                    {it.done ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={it.done ? 'line-through text-gray-500 flex-1' : 'text-gray-200 flex-1'}>
                      {it.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 추천 파트너 */}
            <div className="overflow-y-auto p-3">
              {suggestions.length === 0 ? (
                <p className="text-xs text-gray-500">미완료 항목이 없습니다.</p>
              ) : suggestions.map(s => (
                <div key={s.category} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-semibold text-gray-200">{s.category_label}</div>
                    {!matchedCategories.has(s.category) && (
                      <button
                        onClick={() => matchPartner(s.category)}
                        className="text-[10px] text-blue-400 hover:text-blue-300"
                      >+ 카테고리 매칭</button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {s.partners.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between px-2 py-1.5 bg-gray-900 rounded-lg text-[11px]">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 truncate">{p.name}</div>
                          <div className="text-gray-500">★ {p.rating.toFixed(1)} ({p.review_count})</div>
                        </div>
                        <button
                          onClick={() => matchPartner(s.category, p.id)}
                          className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px]"
                        >연결</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 — 통화 메모 + 결과 + 저장 */}
      <div className="bg-gray-950 border-t border-gray-800 p-4">
        <div className="grid grid-cols-12 gap-3">
          {/* 결과 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="text-xs text-gray-500 mb-1.5">결과</div>
            <div className="grid grid-cols-2 gap-1">
              {OUTCOME_OPTIONS.map(o => (
                <button
                  key={o.key}
                  onClick={() => setOutcome(o.key)}
                  className={`px-2 py-1.5 text-[11px] rounded-lg transition-all ${
                    outcome === o.key ? o.cls + ' font-bold ring-2 ring-white/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >{o.label}</button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div className="col-span-12 lg:col-span-5">
            <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />통화 요약
            </div>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="대화 핵심 1~2문장 (자동 저장)"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <input
                value={painInput}
                onChange={e => setPainInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && painInput.trim()) {
                    e.preventDefault();
                    setPainPoints([...painPoints, painInput.trim()]);
                    setPainInput('');
                  }
                }}
                placeholder="불편/니즈 (Enter로 추가)"
                className="flex-1 min-w-[140px] px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              {painPoints.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-red-900/40 text-red-300 rounded-full">
                  {p}
                  <button onClick={() => setPainPoints(painPoints.filter((_, j) => j !== i))}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 다음액션 + 후속일정 + 저장 */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
            <input
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="다음 액션 (자동 추정 또는 직접)"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex items-center gap-1">
              {[1, 3, 7, 14].map(d => (
                <button
                  key={d}
                  onClick={() => setNextFollowupDays(d)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg ${
                    nextFollowupDays === d ? 'bg-amber-500 text-white font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >{d}일</button>
              ))}
              <button
                onClick={() => setNextFollowupDays(null)}
                className={`px-2 py-1.5 text-xs rounded-lg ${
                  nextFollowupDays === null ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >없음</button>
            </div>
            <button
              onClick={saveConsultation}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl ${
                saveOk ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" />
                : saveOk ? <><CheckCircle className="w-4 h-4" />저장 완료</>
                  : <><Send className="w-4 h-4" />상담 저장 후 종료</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreFact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500 mb-0.5 flex items-center gap-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className="text-sm text-gray-100 font-medium truncate">{value}</div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Plus,
  Phone, Calendar, AlertTriangle, Flame, Snowflake, Users,
  TrendingUp, Target, X, Zap, BookOpen, Headphones,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  current_workplace?: string;
  target_region_sido?: string;
  target_region_sigungu?: string;
  budget_total?: number;
  funnel_stage: string;
  opening_stage: string;
  priority: string;
  lead_score: number;
  readiness_score: number;
  next_action?: string;
  next_followup_at?: string;
  last_contacted_at?: string;
  source?: string;
  created_at: string;
}

interface Stats {
  total_leads: number;
  overdue_followups: number;
  converted_count: number;
  conversion_rate: number;
  by_funnel: Record<string, number>;
  contracted_revenue: number;
  commission_revenue: number;
}

interface QueueItem {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  target_region_sido?: string;
  target_region_sigungu?: string;
  opening_stage?: string;
  opening_stage_label: string;
  funnel_stage?: string;
  priority?: string;
  lead_score: number;
  readiness_score: number;
  priority_score: number;
  urgency_x: number;
  silence_x: number;
  overdue_x: number;
  last_contacted_at?: string;
  next_action?: string;
  next_followup_at?: string;
  target_open_date?: string;
  is_overdue_followup: boolean;
}

const FUNNEL_LABELS: Record<string, string> = {
  NEW: '신규', CONTACTED: '컨택', ENGAGED: '관심',
  QUALIFIED: '검증', PROPOSING: '제안', NEGOTIATING: '협상',
  CONVERTED: '전환', DORMANT: '휴면', LOST: '실패',
};
const FUNNEL_COLORS: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  ENGAGED: 'bg-amber-100 text-amber-700',
  QUALIFIED: 'bg-violet-100 text-violet-700',
  PROPOSING: 'bg-indigo-100 text-indigo-700',
  NEGOTIATING: 'bg-orange-100 text-orange-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  DORMANT: 'bg-stone-100 text-stone-500',
  LOST: 'bg-red-100 text-red-700',
};

const STAGE_LABELS: Record<string, string> = {
  PLANNING: '사업계획', LOCATION_REVIEW: '입지검토', CONTRACT: '임대계약',
  LICENSING: '인허가', CONSTRUCTION: '인테리어', EQUIPMENT: '의료기기',
  HIRING: '인력채용', OPENING: '개원준비', OPERATING: '운영안정',
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: any; cls: string }> = {
  HOT:  { label: 'HOT',  icon: Flame,     cls: 'text-red-600 bg-red-50' },
  WARM: { label: 'WARM', icon: TrendingUp, cls: 'text-amber-600 bg-amber-50' },
  COLD: { label: 'COLD', icon: Snowflake, cls: 'text-blue-600 bg-blue-50' },
  DEAD: { label: 'DEAD', icon: X,         cls: 'text-gray-500 bg-gray-100' },
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

export default function CRMListPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [funnelFilter, setFunnelFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueScope, setQueueScope] = useState<'all' | 'me'>('all');
  const [queueOpen, setQueueOpen] = useState(true);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.set('search', search);
      if (funnelFilter) params.set('funnel_stage', funnelFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (stageFilter) params.set('opening_stage', stageFilter);
      if (needsFollowup) params.set('needs_followup', 'true');

      const res = await fetch(`${apiUrl}/crm/leads?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, funnelFilter, priorityFilter, stageFilter, needsFollowup]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/crm/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (queueScope === 'me') params.set('owner_user_id', 'me');
      const res = await fetch(`${apiUrl}/crm/queue/today?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const d = await res.json();
        setQueue(d.items || []);
      }
    } catch {}
  }, [queueScope]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">개원의 CRM</h1>
          <p className="text-sm text-gray-500 mt-1">
            광고·추출로 확보한 의사 lead 관리 — 단계 트래커, 체크리스트, 협력사 매칭
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/crm/onboarding"
            className="flex items-center gap-2 px-4 py-2 text-sm border border-violet-200 text-violet-700 rounded-xl hover:bg-violet-50"
          >
            <BookOpen className="w-4 h-4" />교육 가이드
          </Link>
          <button
            onClick={() => { fetchData(); fetchStats(); fetchQueue(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />새로고침
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />Lead 추가
          </button>
        </div>
      </div>

      {/* 오늘 콜할 TOP 10 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-amber-900">오늘 콜할 TOP {queue.length}</div>
              <div className="text-xs text-amber-700">
                위에서부터 순서대로 콜만 돌리세요. 매시간 자동 갱신.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg p-0.5 border border-amber-200">
              <button
                onClick={() => setQueueScope('all')}
                className={`px-3 py-1 text-xs rounded-md ${queueScope === 'all' ? 'bg-amber-500 text-white' : 'text-amber-700'}`}
              >전체</button>
              <button
                onClick={() => setQueueScope('me')}
                className={`px-3 py-1 text-xs rounded-md ${queueScope === 'me' ? 'bg-amber-500 text-white' : 'text-amber-700'}`}
              >내 담당</button>
            </div>
            <button
              onClick={() => setQueueOpen(o => !o)}
              className="text-xs text-amber-700 px-2 py-1 hover:bg-amber-100 rounded-md"
            >
              {queueOpen ? '접기' : '펼치기'}
            </button>
          </div>
        </div>
        {queueOpen && (
          <div className="bg-white border-t border-amber-200">
            {queue.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-400 text-center">
                지금은 우선 콜 대상이 없어요. lead가 늘어나면 자동으로 채워집니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {queue.map((q, i) => {
                  const stale = q.last_contacted_at
                    ? Math.floor((Date.now() - new Date(q.last_contacted_at).getTime()) / 86_400_000)
                    : null;
                  return (
                    <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-red-500 text-white'
                          : i < 3 ? 'bg-orange-500 text-white'
                            : 'bg-amber-100 text-amber-800'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <Link href={`/admin/crm/${q.id}`} className="font-semibold text-gray-900 hover:text-blue-600 truncate">
                            {q.name}
                          </Link>
                          {q.specialty && <span className="text-xs text-gray-500">{q.specialty}</span>}
                          {q.priority === 'HOT' && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                              HOT
                            </span>
                          )}
                          {q.is_overdue_followup && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                              후속 지연
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 truncate">
                          {q.opening_stage_label && <span>{q.opening_stage_label}</span>}
                          {q.target_region_sido && <span>· {q.target_region_sido} {q.target_region_sigungu || ''}</span>}
                          {stale !== null && (
                            <span>· {stale === 0 ? '오늘 컨택' : `${stale}일 무응답`}</span>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span title="긴급도">⚡{q.urgency_x}</span>
                        <span title="무응답">💤{q.silence_x}</span>
                        <span title="후속 지연">⏰{q.overdue_x}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-700">{Math.round(q.priority_score)}</div>
                        <div className="text-[10px] text-gray-500">우선도</div>
                      </div>
                      <div className="flex gap-1">
                        {q.phone && (
                          <a
                            href={`tel:${q.phone}`}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                            title={`전화 ${q.phone}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/crm/${q.id}/call`}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          title="콜 콘솔 열기"
                        >
                          <Headphones className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPI icon={Users} label="총 lead" value={stats.total_leads.toLocaleString()} />
          <KPI icon={AlertTriangle} label="후속 지연" value={stats.overdue_followups.toLocaleString()}
               highlight={stats.overdue_followups > 0} />
          <KPI icon={Target} label="전환" value={`${stats.converted_count} (${stats.conversion_rate}%)`} />
          <KPI icon={TrendingUp} label="계약 매출" value={fmtKRW(stats.contracted_revenue)} />
          <KPI icon={Phone} label="수수료 매출" value={fmtKRW(stats.commission_revenue)} />
        </div>
      )}

      {/* Funnel strip */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFunnelFilter('')}
            className={`px-3 py-1.5 text-xs rounded-full border ${!funnelFilter ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >전체 {stats.total_leads}</button>
          {Object.keys(FUNNEL_LABELS).map((s) => (
            <button
              key={s}
              onClick={() => setFunnelFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full border ${funnelFilter === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {FUNNEL_LABELS[s]} {stats.by_funnel[s] || 0}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="이름, 전화, 이메일, 전공, 지역…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl">
          <option value="">우선순위 전체</option>
          {Object.keys(PRIORITY_CONFIG).map(p => (
            <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
          ))}
        </select>
        <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl">
          <option value="">개원단계 전체</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2">
          <input type="checkbox" checked={needsFollowup}
                 onChange={(e) => { setNeedsFollowup(e.target.checked); setPage(1); }} />
          후속 지연만
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">우선</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">전공</th>
              <th className="px-4 py-3">지역</th>
              <th className="px-4 py-3">단계</th>
              <th className="px-4 py-3">퍼널</th>
              <th className="px-4 py-3 text-center">준비도</th>
              <th className="px-4 py-3">다음 액션</th>
              <th className="px-4 py-3">최근 통화</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">로딩 중…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">조건에 맞는 lead가 없어요.</td></tr>
            ) : items.map((l) => {
              const P = PRIORITY_CONFIG[l.priority] ?? PRIORITY_CONFIG.WARM;
              const PIcon = P.icon;
              const overdue = l.next_followup_at && new Date(l.next_followup_at) < new Date();
              return (
                <tr key={l.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${P.cls}`}>
                      <PIcon className="w-3 h-3" /> {P.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/crm/${l.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {l.name}
                    </Link>
                    {l.phone && <div className="text-xs text-gray-500 mt-0.5">{l.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{l.specialty || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {l.target_region_sido && (
                      <>{l.target_region_sido} {l.target_region_sigungu && `· ${l.target_region_sigungu}`}</>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{STAGE_LABELS[l.opening_stage] || l.opening_stage}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${FUNNEL_COLORS[l.funnel_stage] || 'bg-gray-100 text-gray-600'}`}>
                      {FUNNEL_LABELS[l.funnel_stage] || l.funnel_stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                             style={{ width: `${l.readiness_score}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 w-8">{l.readiness_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">
                    {l.next_action || '-'}
                    {overdue && (
                      <span className="ml-2 inline-flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />지연
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {l.last_contacted_at ? new Date(l.last_contacted_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / 총 {total}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchData(); fetchStats(); }} />}
    </div>
  );
}

function KPI({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-red-500' : ''}`} />{label}
      </div>
      <div className={`text-xl font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}

function fmtKRW(n: number): string {
  if (!n) return '0';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

function CreateLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialty: '',
    target_region_sido: '', target_region_sigungu: '',
    opening_stage: 'PLANNING', priority: 'WARM',
    source: 'manual', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name) { setError('이름은 필수'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) { onCreated(); }
      else { const e = await res.json(); setError(e.detail || '실패'); }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Lead 추가</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <Field label="이름 *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="전화" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="이메일" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="진료과" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="시도" value={form.target_region_sido} onChange={(v) => setForm({ ...form, target_region_sido: v })} />
            <Field label="시군구" value={form.target_region_sigungu} onChange={(v) => setForm({ ...form, target_region_sigungu: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="개원단계" value={form.opening_stage} onChange={(v) => setForm({ ...form, opening_stage: v })}
                    options={Object.entries(STAGE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
            <Select label="우선순위" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })}
                    options={Object.keys(PRIORITY_CONFIG).map(k => ({ value: k, label: PRIORITY_CONFIG[k].label }))} />
          </div>
          <Field label="출처" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
          <button onClick={submit} disabled={submitting} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {submitting ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Select({ label, value, onChange, options }:
  { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

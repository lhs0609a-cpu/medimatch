'use client';

import { useState } from 'react';
import {
  Calendar, CheckCircle, Circle, Clock, Plus, X, Save, Loader2,
  AlertCircle, Trash2, Eye, EyeOff, Sparkles, Edit2,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

interface Milestone {
  id: number;
  lead_id: string;
  stage?: string;
  stage_label?: string;
  title: string;
  description?: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  status: string;
  source: string;
  partner_match_id?: number;
  visible_to_doctor: boolean;
  visible_to_partner: boolean;
  order_index: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  PLANNED:     { label: '예정', cls: 'bg-gray-100 text-gray-600', icon: Circle },
  IN_PROGRESS: { label: '진행', cls: 'bg-blue-100 text-blue-700', icon: Clock },
  DONE:        { label: '완료', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  BLOCKED:     { label: '대기', cls: 'bg-red-100 text-red-700', icon: AlertCircle },
  SKIPPED:     { label: '건너뜀', cls: 'bg-stone-100 text-stone-500', icon: X },
};

const SOURCE_LABELS: Record<string, string> = {
  AUTO: '시스템', MANUAL: '수기', PARTNER_EVENT: '매칭 이벤트',
};

const STAGE_LABELS: Record<string, string> = {
  PLANNING: '사업계획', LOCATION_REVIEW: '입지검토', CONTRACT: '임대계약',
  LICENSING: '인허가', CONSTRUCTION: '인테리어', EQUIPMENT: '의료기기',
  HIRING: '인력채용', OPENING: '개원준비', OPERATING: '운영안정',
};

function fmtDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isOverdue(due?: string, status?: string): boolean {
  if (!due || status === 'DONE' || status === 'SKIPPED') return false;
  return new Date(due) < new Date();
}

export function Timeline({
  leadId, milestones, onChanged,
}: { leadId: string; milestones: Milestone[]; onChanged: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);

  const sorted = [...milestones].sort((a, b) => {
    if (!a.due_at && !b.due_at) return a.order_index - b.order_index;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const seed = async () => {
    setSeeding(true);
    try {
      await fetch(`${apiUrl}/crm/leads/${leadId}/milestones/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      onChanged();
    } finally { setSeeding(false); }
  };

  const updateStatus = async (m: Milestone, status: string) => {
    await fetch(`${apiUrl}/crm/milestones/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    });
    onChanged();
  };

  const toggleVisibility = async (m: Milestone, key: 'visible_to_doctor' | 'visible_to_partner') => {
    await fetch(`${apiUrl}/crm/milestones/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ [key]: !m[key] }),
    });
    onChanged();
  };

  const remove = async (m: Milestone) => {
    if (!confirm('이 마일스톤을 삭제할까요?')) return;
    await fetch(`${apiUrl}/crm/milestones/${m.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    onChanged();
  };

  // 단계별 그룹
  const byStage: Record<string, Milestone[]> = {};
  for (const m of sorted) {
    const k = m.stage || '_other';
    if (!byStage[k]) byStage[k] = [];
    byStage[k].push(m);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            공유 타임라인
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {milestones.length}개 마일스톤 · 의사·우리팀·협력사 공통
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={seed}
            disabled={seeding}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 disabled:opacity-50"
            title="현재 단계 + 다음 단계 기본 마일스톤 자동 추가"
          >
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            자동 시드
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-3 h-3" />추가
          </button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          아직 마일스톤이 없습니다.
          <button onClick={seed} className="block mx-auto mt-2 text-xs text-blue-600 hover:underline">
            기본 마일스톤 자동으로 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byStage).map(([stageKey, items]) => (
            <div key={stageKey}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {stageKey === '_other' ? '기타' : (STAGE_LABELS[stageKey] || stageKey)}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-1.5">
                {items.map((m) => (
                  <MilestoneRow
                    key={m.id}
                    m={m}
                    onStatus={(s) => updateStatus(m, s)}
                    onToggleVis={(k) => toggleVisibility(m, k)}
                    onEdit={() => setEditing(m)}
                    onRemove={() => remove(m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <MilestoneEditModal
          leadId={leadId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onChanged(); }}
        />
      )}
      {editing && (
        <MilestoneEditModal
          leadId={leadId}
          milestone={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </div>
  );
}

function MilestoneRow({
  m, onStatus, onToggleVis, onEdit, onRemove,
}: {
  m: Milestone;
  onStatus: (s: string) => void;
  onToggleVis: (k: 'visible_to_doctor' | 'visible_to_partner') => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.PLANNED;
  const StatusIcon = cfg.icon;
  const overdue = isOverdue(m.due_at, m.status);

  const cycleStatus = () => {
    const order = ['PLANNED', 'IN_PROGRESS', 'DONE'];
    const i = order.indexOf(m.status);
    const next = i < 0 ? 'IN_PROGRESS' : order[(i + 1) % order.length];
    onStatus(next);
  };

  return (
    <div className={`group flex items-start gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 ${
      overdue ? 'bg-red-50/50' : ''
    }`}>
      <button
        onClick={cycleStatus}
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          m.status === 'DONE' ? 'bg-emerald-600' : 'border-2 border-gray-300 hover:border-blue-400'
        }`}
        title={`상태: ${cfg.label} (클릭하면 변경)`}
      >
        {m.status === 'DONE' && <CheckCircle className="w-4 h-4 text-white" />}
        {m.status === 'IN_PROGRESS' && <Clock className="w-3 h-3 text-blue-600" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${m.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {m.title}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.cls}`}>
            {cfg.label}
          </span>
          {m.source !== 'MANUAL' && (
            <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
              {SOURCE_LABELS[m.source]}
            </span>
          )}
          {overdue && (
            <span className="text-[10px] text-red-600 flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" />지연
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
          {m.due_at && <span>📅 {fmtDate(m.due_at)}</span>}
          {m.completed_at && <span>✓ {fmtDate(m.completed_at)}</span>}
          {m.description && <span className="truncate">· {m.description}</span>}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          onClick={() => onToggleVis('visible_to_doctor')}
          className={`p-1 rounded ${m.visible_to_doctor ? 'text-blue-600' : 'text-gray-300'}`}
          title={m.visible_to_doctor ? '의사에게 공개' : '의사에게 비공개'}
        >
          {m.visible_to_doctor ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-blue-600 rounded"
          title="수정"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600 rounded"
          title="삭제"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function MilestoneEditModal({
  leadId, milestone, onClose, onSaved,
}: {
  leadId: string;
  milestone?: Milestone;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    stage: milestone?.stage || '',
    due_at: milestone?.due_at ? new Date(milestone.due_at).toISOString().slice(0, 16) : '',
    status: milestone?.status || 'PLANNED',
    visible_to_doctor: milestone?.visible_to_doctor ?? true,
    visible_to_partner: milestone?.visible_to_partner ?? true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description || null,
        stage: form.stage || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        status: form.status,
        visible_to_doctor: form.visible_to_doctor,
        visible_to_partner: form.visible_to_partner,
      };
      const url = milestone
        ? `${apiUrl}/crm/milestones/${milestone.id}`
        : `${apiUrl}/crm/leads/${leadId}/milestones`;
      const method = milestone ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (res.ok) onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {milestone ? '마일스톤 수정' : '마일스톤 추가'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                   placeholder="예: 임대차계약 체결"
                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">단계</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl">
                <option value="">미지정</option>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl">
                {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">예정일</label>
            <input type="datetime-local" value={form.due_at}
                   onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                   className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl" />
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.visible_to_doctor}
                     onChange={(e) => setForm({ ...form, visible_to_doctor: e.target.checked })} />
              의사에게 공개
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.visible_to_partner}
                     onChange={(e) => setForm({ ...form, visible_to_partner: e.target.checked })} />
              협력사에게 공개
            </label>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl">취소</button>
          <button onClick={submit} disabled={saving || !form.title.trim()}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />저장</>}
          </button>
        </div>
      </div>
    </div>
  );
}

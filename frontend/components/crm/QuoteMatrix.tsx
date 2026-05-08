'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Plus, X, FileText, Save, ArrowDown, ArrowUp,
  Award, Star,
} from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '');

interface QuoteField {
  key: string;
  label: string;
  type: 'currency' | 'number' | 'tags' | 'text' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface Match {
  id: number;
  partner_id?: number;
  partner_name?: string;
  partner_phone?: string;
  partner_rating?: number;
  partner_review_count?: number;
  category: string;
  category_label: string;
  status: string;
  quoted_amount?: number;
  quoted_at?: string;
  quote_details: Record<string, any>;
  contracted_amount?: number;
}

interface MatrixData {
  category: string;
  category_label: string;
  matches: Match[];
  fields: QuoteField[];
  stats: {
    count: number;
    quoted_count: number;
    min_amount?: number;
    max_amount?: number;
    avg_amount?: number;
    spread_pct: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  SUGGESTED: '추천', INTRODUCED: '소개', IN_PROGRESS: '진행',
  QUOTED: '견적', CONTRACTED: '계약', REJECTED: '거절',
};

export function QuoteMatrix({
  leadId,
  category,
  categoryLabel,
  onChanged,
}: {
  leadId: string;
  category: string;
  categoryLabel: string;
  onChanged?: () => void;
}) {
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Match | null>(null);

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/quotes/${category}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [leadId, category]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  if (loading) {
    return <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400 inline" /></div>;
  }
  if (!data || data.matches.length === 0) {
    return null;
  }

  const minAmount = data.stats.min_amount;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            {categoryLabel} 견적 비교
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            매칭 {data.stats.count}곳 · 견적 입력 {data.stats.quoted_count}곳
            {data.stats.spread_pct > 0 && (
              <> · 가격차 <span className="text-amber-600 font-semibold">{data.stats.spread_pct}%</span></>
            )}
          </p>
        </div>
        {data.stats.avg_amount && (
          <div className="text-right">
            <div className="text-[10px] text-gray-500">평균</div>
            <div className="text-sm font-bold text-gray-900">{fmtKRW(data.stats.avg_amount)}</div>
          </div>
        )}
      </div>

      {data.matches.length === 1 ? (
        <SingleQuote match={data.matches[0]} onEdit={() => setEditing(data.matches[0])} />
      ) : (
        <CompareTable
          matches={data.matches}
          fields={data.fields}
          minAmount={minAmount}
          onEdit={(m) => setEditing(m)}
        />
      )}

      {editing && (
        <QuoteEditModal
          match={editing}
          fields={data.fields}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchMatrix();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function SingleQuote({ match, onEdit }: { match: Match; onEdit: () => void }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{match.partner_name || '미정'}</span>
          {match.partner_rating && (
            <span className="text-xs text-amber-600 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-500" />
              {match.partner_rating.toFixed(1)}
            </span>
          )}
        </div>
        {match.quoted_amount ? (
          <div className="text-lg font-bold text-gray-900 mt-1">{fmtKRW(match.quoted_amount)}</div>
        ) : (
          <div className="text-xs text-gray-500 mt-1">아직 견적 없음</div>
        )}
      </div>
      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
      >
        견적 입력
      </button>
    </div>
  );
}

function CompareTable({
  matches, fields, minAmount, onEdit,
}: {
  matches: Match[];
  fields: QuoteField[];
  minAmount?: number;
  onEdit: (m: Match) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 sticky left-0 bg-white" style={{ minWidth: '120px' }}>
              항목
            </th>
            {matches.map((m) => {
              const isLowest = m.quoted_amount && m.quoted_amount === minAmount;
              return (
                <th key={m.id} className="text-left py-2 px-2 align-top" style={{ minWidth: '160px' }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{m.partner_name || '미정'}</span>
                    {isLowest && (
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      m.status === 'CONTRACTED' ? 'bg-emerald-100 text-emerald-700'
                        : m.status === 'QUOTED' ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                    {m.partner_rating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        {m.partner_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {fields.map((f, fi) => (
            <tr key={f.key} className={fi % 2 === 0 ? 'bg-gray-50/40' : ''}>
              <td className="py-2 px-2 text-xs font-medium text-gray-600 sticky left-0 bg-inherit">
                {f.label}
              </td>
              {matches.map((m) => {
                const value = f.key === 'amount'
                  ? m.quoted_amount
                  : (m.quote_details || {})[f.key];
                const isMin = f.key === 'amount' && value && value === minAmount;
                const isMax = f.key === 'amount' && value && value === Math.max(...matches.map(x => x.quoted_amount || 0));
                return (
                  <td key={m.id} className="py-2 px-2 align-top">
                    <CellValue
                      field={f}
                      value={value}
                      highlight={isMin ? 'good' : isMax && matches.length > 1 ? 'bad' : undefined}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="py-3 px-2 sticky left-0 bg-white"></td>
            {matches.map((m) => (
              <td key={m.id} className="py-3 px-2">
                <button
                  onClick={() => onEdit(m)}
                  className="w-full px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  {m.quoted_amount ? '견적 수정' : '견적 입력'}
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CellValue({
  field, value, highlight,
}: { field: QuoteField; value: any; highlight?: 'good' | 'bad' }) {
  if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const cls = highlight === 'good' ? 'text-emerald-700 font-bold'
    : highlight === 'bad' ? 'text-gray-500' : 'text-gray-800';

  if (field.type === 'currency') {
    return (
      <span className={`text-sm ${cls} flex items-center gap-1`}>
        {fmtKRW(Number(value))}
        {highlight === 'good' && <ArrowDown className="w-3 h-3 text-emerald-600" />}
        {highlight === 'bad' && <ArrowUp className="w-3 h-3 text-gray-400" />}
      </span>
    );
  }
  if (field.type === 'tags' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((t: string, i: number) => (
          <span key={i} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    );
  }
  if (field.type === 'date') {
    return <span className="text-xs text-gray-700">{new Date(value).toLocaleDateString('ko-KR')}</span>;
  }
  return <span className={`text-sm ${cls}`}>{String(value)}</span>;
}

function QuoteEditModal({
  match, fields, onClose, onSaved,
}: {
  match: Match;
  fields: QuoteField[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial: Record<string, any> = { amount: match.quoted_amount || '' };
  for (const k of Object.keys(match.quote_details || {})) initial[k] = (match.quote_details as any)[k];
  // Ensure tag fields exist as arrays
  for (const f of fields) {
    if (f.type === 'tags' && !Array.isArray(initial[f.key])) initial[f.key] = [];
  }

  const [form, setForm] = useState<Record<string, any>>(initial);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const { amount, ...rest } = form;
      const body: any = {
        quoted_amount: amount ? Number(amount) : null,
        quote_details: rest,
      };
      const res = await fetch(`${apiUrl}/crm/lead-partner-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (res.ok) onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">견적 입력</h2>
            <p className="text-xs text-gray-500 mt-0.5">{match.partner_name || '미정'} · {match.category_label}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {fields.map((f) => (
            <FieldInput key={f.key} field={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
          ))}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl">취소</button>
          <button onClick={submit} disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />저장</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field, value, onChange,
}: { field: QuoteField; value: any; onChange: (v: any) => void }) {
  const baseClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (field.type === 'tags') {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{field.required && ' *'}
        </label>
        <div className="flex flex-wrap gap-1">
          {(field.options || []).map((opt) => {
            const active = arr.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(active ? arr.filter(x => x !== opt) : [...arr, opt])}
                className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                  active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{field.required && ' *'}
        </label>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">선택</option>
          {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {field.label}{field.required && ' *'}
        </label>
        <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className={baseClass} />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {field.label}{field.required && ' *'}
      </label>
      <input
        type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(field.type === 'currency' || field.type === 'number'
          ? (e.target.value ? Number(e.target.value) : '')
          : e.target.value)}
        placeholder={field.placeholder}
        className={baseClass}
      />
    </div>
  );
}

function fmtKRW(n: number): string {
  if (!n) return '0';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}

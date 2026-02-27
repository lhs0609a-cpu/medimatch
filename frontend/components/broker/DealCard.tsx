'use client';

import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface Deal {
  id: string;
  deal_number: string;
  title: string;
  status: string;
  close_reason?: string;
  expected_commission?: number;
  actual_commission?: number;
  lead_score?: number;
  circumvention_flag?: boolean;
  broker_name?: string;
  created_at?: string;
  updated_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-sky-100 text-sky-700',
  VIEWING_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  VIEWED: 'bg-violet-100 text-violet-700',
  NEGOTIATING: 'bg-amber-100 text-amber-700',
  CONTRACT_PENDING: 'bg-orange-100 text-orange-700',
  CONTRACTED: 'bg-blue-100 text-blue-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  LEAD: '리드',
  CONTACTED: '컨택 완료',
  VIEWING_SCHEDULED: '내방 예정',
  VIEWED: '내방 완료',
  NEGOTIATING: '협상 중',
  CONTRACT_PENDING: '계약 대기',
  CONTRACTED: '계약 완료',
  CLOSED_WON: '성사',
  CLOSED_LOST: '종료',
};

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function DealCard({
  deal,
  onClick,
  draggable,
}: {
  deal: Deal;
  onClick?: () => void;
  draggable?: boolean;
}) {
  const commission = deal.actual_commission || deal.expected_commission;
  const daysAgo = deal.updated_at
    ? Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / 86400000)
    : null;

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[deal.status] || 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[deal.status] || deal.status}
        </span>
        {deal.circumvention_flag && (
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
      </div>

      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
        {deal.title}
      </h4>

      <p className="text-[11px] text-gray-400 mb-2">{deal.deal_number}</p>

      {commission && commission > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-xs font-medium text-green-600">{fmt(commission)}원</span>
        </div>
      )}

      {deal.lead_score !== undefined && deal.lead_score > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${Math.min(deal.lead_score, 100)}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        {deal.broker_name && <span>{deal.broker_name}</span>}
        {daysAgo !== null && (
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
          </span>
        )}
      </div>
    </div>
  );
}

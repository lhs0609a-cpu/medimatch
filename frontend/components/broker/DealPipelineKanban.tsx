'use client';

import DealCard from './DealCard';

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

const PIPELINE_STAGES = [
  { key: 'LEAD', label: '리드', color: 'border-gray-300' },
  { key: 'CONTACTED', label: '컨택', color: 'border-sky-400' },
  { key: 'VIEWING_SCHEDULED', label: '내방예정', color: 'border-indigo-400' },
  { key: 'VIEWED', label: '내방완료', color: 'border-violet-400' },
  { key: 'NEGOTIATING', label: '협상중', color: 'border-amber-400' },
  { key: 'CONTRACT_PENDING', label: '계약대기', color: 'border-orange-400' },
  { key: 'CONTRACTED', label: '계약완료', color: 'border-blue-400' },
  { key: 'CLOSED_WON', label: '성사', color: 'border-green-400' },
];

export default function DealPipelineKanban({
  deals,
  onDealClick,
}: {
  deals: Deal[];
  onDealClick?: (dealId: string) => void;
}) {
  const grouped: Record<string, Deal[]> = {};
  for (const stage of PIPELINE_STAGES) {
    grouped[stage.key] = [];
  }
  for (const deal of deals) {
    if (grouped[deal.status]) {
      grouped[deal.status].push(deal);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {PIPELINE_STAGES.map((stage) => (
        <div
          key={stage.key}
          className={`flex-shrink-0 w-64 bg-gray-50 rounded-xl border-t-2 ${stage.color}`}
        >
          <div className="px-3 py-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700">{stage.label}</h3>
            <span className="px-1.5 py-0.5 bg-white rounded-md text-[10px] font-medium text-gray-500 border border-gray-200">
              {grouped[stage.key].length}
            </span>
          </div>
          <div className="px-2 pb-2 space-y-2 max-h-[600px] overflow-y-auto">
            {grouped[stage.key].map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick?.(deal.id)}
              />
            ))}
            {grouped[stage.key].length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">
                딜 없음
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

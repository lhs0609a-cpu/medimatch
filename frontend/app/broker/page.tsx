'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Target, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import CommissionCalculator from '@/components/broker/CommissionCalculator';

interface DashboardData {
  broker: { id: number; display_name: string; tier: string; commission_rate: number };
  kpi: { active_deals: number; closed_won: number; total_commission_earned: number; total_paid_commission: number; success_rate: number };
  pipeline: Record<string, number>;
  recent_deals: { id: string; deal_number: string; title: string; status: string; updated_at: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  LEAD: '리드', CONTACTED: '컨택', VIEWING_SCHEDULED: '내방예정', VIEWED: '내방완료',
  NEGOTIATING: '협상중', CONTRACT_PENDING: '계약대기', CONTRACTED: '계약완료',
  CLOSED_WON: '성사', CLOSED_LOST: '종료',
};

export default function BrokerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${apiUrl}/broker/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {data?.broker.display_name || '중개인'}님, 안녕하세요
        </h1>
        <p className="text-sm text-gray-500 mt-1">오늘의 중개 현황을 확인하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '활성 딜', value: data?.kpi.active_deals || 0, icon: Target, color: 'from-blue-500 to-blue-600' },
          { label: '성사 건', value: data?.kpi.closed_won || 0, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
          { label: '누적 커미션', value: `${fmt(data?.kpi.total_commission_earned || 0)}원`, icon: DollarSign, color: 'from-violet-500 to-violet-600' },
          { label: '성공률', value: `${data?.kpi.success_rate || 0}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Deals */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">최근 딜</h2>
          <div className="space-y-3">
            {(data?.recent_deals || []).map((deal) => (
              <a key={deal.id} href={`/broker/deals/${deal.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                  <p className="text-xs text-gray-400">{deal.deal_number}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">{STATUS_LABELS[deal.status] || deal.status}</span>
              </a>
            ))}
            {(!data?.recent_deals || data.recent_deals.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">최근 딜이 없습니다</p>
            )}
          </div>
        </div>

        {/* Commission Calculator */}
        <CommissionCalculator />
      </div>
    </div>
  );
}

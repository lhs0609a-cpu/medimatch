'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, TrendingUp, Target, AlertTriangle, DollarSign, Trophy, RefreshCw } from 'lucide-react';

interface ControlTowerData {
  kpi: { broker_count: number; active_deals: number; monthly_revenue: number; conversion_rate: number };
  leaderboard: { id: number; name: string; won: number; commission: number }[];
  alerts: { suspicious_activities: number; pending_commissions: number };
}

export default function BrokerControlPage() {
  const [data, setData] = useState<ControlTowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/admin/broker/control-tower`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;

  const kpiCards = [
    { label: '활성 중개사', value: data?.kpi.broker_count || 0, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '활성 딜', value: data?.kpi.active_deals || 0, icon: Target, color: 'from-violet-500 to-violet-600' },
    { label: '월 매출', value: `${fmt(data?.kpi.monthly_revenue || 0)}원`, icon: DollarSign, color: 'from-green-500 to-green-600' },
    { label: '전환율', value: `${data?.kpi.conversion_rate || 0}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">컨트롤타워</h1>
            <p className="text-sm text-gray-500">부동산 중개 현황 한눈에 보기</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
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
        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">Top 5 중개사</h2>
          </div>
          <div className="space-y-3">
            {(data?.leaderboard || []).map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-600'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.won}건 성사</p>
                </div>
                <span className="text-sm font-semibold text-green-600">{fmt(b.commission)}원</span>
              </div>
            ))}
            {(!data?.leaderboard || data.leaderboard.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">데이터 없음</p>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold text-gray-900">알림</h2>
          </div>
          <div className="space-y-3">
            {(data?.alerts.suspicious_activities || 0) > 0 && (
              <a href="/admin/broker-deals" className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700">우회거래 의심</p>
                  <p className="text-xs text-red-500">{data?.alerts.suspicious_activities}건 미해결</p>
                </div>
              </a>
            )}
            {(data?.alerts.pending_commissions || 0) > 0 && (
              <a href="/admin/broker-deals" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700">미정산 커미션</p>
                  <p className="text-xs text-amber-500">{data?.alerts.pending_commissions}건</p>
                </div>
              </a>
            )}
            {(!data?.alerts.suspicious_activities && !data?.alerts.pending_commissions) && (
              <p className="text-sm text-gray-400 text-center py-4">현재 알림 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

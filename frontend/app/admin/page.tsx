'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Pill,
  Send,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  realEstateListings: number;
  pharmacyProspects: number;
  hotProspects: number;
  campaignsSent: number;
  smsBalance: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    realEstateListings: 0,
    pharmacyProspects: 0,
    hotProspects: 0,
    campaignsSent: 0,
    smsBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      // 부동산 매물 통계
      const listingRes = await fetch(`${apiUrl}/realestate/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 약국 타겟 통계
      const prospectRes = await fetch(`${apiUrl}/pharmacy-prospects/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 캠페인 통계
      const campaignRes = await fetch(`${apiUrl}/campaigns/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const listingData = listingRes.ok ? await listingRes.json() : {};
      const prospectData = prospectRes.ok ? await prospectRes.json() : {};
      const campaignData = campaignRes.ok ? await campaignRes.json() : {};

      setStats({
        realEstateListings: listingData.total_listings || 0,
        pharmacyProspects: prospectData.total || 0,
        hotProspects: prospectData.hot || 0,
        campaignsSent: campaignData.total_sent || 0,
        smsBalance: campaignData.sms_balance || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '부동산 매물',
      value: stats.realEstateListings,
      icon: Building2,
      color: 'violet',
      href: '/admin/realestate',
      change: '+12',
      changeType: 'up',
    },
    {
      title: '약국 타겟',
      value: stats.pharmacyProspects,
      icon: Pill,
      color: 'emerald',
      href: '/admin/prospects',
      change: `HOT ${stats.hotProspects}개`,
      changeType: 'neutral',
    },
    {
      title: '발송 완료',
      value: stats.campaignsSent,
      icon: Send,
      color: 'sky',
      href: '/admin/campaigns',
      change: '이번 주',
      changeType: 'neutral',
    },
    {
      title: 'SMS 잔액',
      value: stats.smsBalance.toLocaleString(),
      icon: TrendingUp,
      color: 'amber',
      href: '/admin/campaigns',
      change: '원',
      changeType: 'neutral',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-500 mt-1">부동산 매물, 약국 타겟팅, 캠페인을 관리하세요.</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${card.color}-100 flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
              {card.changeType === 'up' && (
                <span className="flex items-center text-emerald-600 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  {card.change}
                </span>
              )}
              {card.changeType === 'down' && (
                <span className="flex items-center text-rose-600 text-sm font-medium">
                  <ArrowDownRight className="w-4 h-4" />
                  {card.change}
                </span>
              )}
              {card.changeType === 'neutral' && (
                <span className="text-gray-500 text-sm">{card.change}</span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loading ? '-' : card.value}
            </p>
            <p className="text-sm text-gray-500">{card.title}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 부동산 매물 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">부동산 매물 관리</h3>
              <p className="text-sm text-gray-500">의료시설 적합 매물 수집</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/admin/realestate"
              className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
            >
              매물 목록 보기
            </Link>
            <button
              onClick={() => {/* trigger crawl */}}
              className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              크롤링 시작
            </button>
          </div>
        </div>

        {/* 약국 타겟팅 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">약국 타겟팅</h3>
              <p className="text-sm text-gray-500">양도 가능 약국 분석</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/admin/prospects"
              className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              타겟 목록 보기
            </Link>
            <button
              onClick={() => {/* trigger scan */}}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              스캔 시작
            </button>
          </div>
        </div>

        {/* 아웃바운드 캠페인 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">아웃바운드 캠페인</h3>
              <p className="text-sm text-gray-500">SMS/이메일 발송</p>
            </div>
          </div>
          <div className="space-y-2">
            <Link
              href="/admin/campaigns"
              className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
            >
              캠페인 관리
            </Link>
            <Link
              href="/admin/campaigns/new"
              className="block w-full px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors text-center"
            >
              새 캠페인 시작
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

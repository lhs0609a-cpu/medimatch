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
  ClipboardCheck,
  Stethoscope,
  MessageCircle,
  Megaphone,
  ShieldCheck,
  ShoppingCart,
  BarChart3,
  HeartHandshake,
  CreditCard,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

interface AdminStats {
  realEstateListings: number;
  pharmacyProspects: number;
  hotProspects: number;
  campaignsSent: number;
  smsBalance: number;
  pendingReview: number;
  pharmacyPendingReview: number;
  consultations: number;
  inquiries: number;
  escrowActive: number;
  bannersPending: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    realEstateListings: 0,
    pharmacyProspects: 0,
    hotProspects: 0,
    campaignsSent: 0,
    smsBalance: 0,
    pendingReview: 0,
    pharmacyPendingReview: 0,
    consultations: 0,
    inquiries: 0,
    escrowActive: 0,
    bannersPending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [listingRes, prospectRes, campaignRes, pendingRes, pharmPendingRes, adminStatsRes] = await Promise.all([
        fetch(`${apiUrl}/realestate/stats`, { headers }).catch(() => null),
        fetch(`${apiUrl}/pharmacy-prospects/stats`, { headers }).catch(() => null),
        fetch(`${apiUrl}/campaigns/stats`, { headers }).catch(() => null),
        fetch(`${apiUrl}/landlord/admin/listings?status=PENDING_REVIEW&page_size=1`, { headers }).catch(() => null),
        fetch(`${apiUrl}/pharmacy-transfer/admin/listings?status=PENDING_REVIEW&page_size=1`, { headers }).catch(() => null),
        fetch(`${apiUrl}/admin/stats`, { headers }).catch(() => null),
      ]);

      const listingData = listingRes?.ok ? await listingRes.json() : {};
      const prospectData = prospectRes?.ok ? await prospectRes.json() : {};
      const campaignData = campaignRes?.ok ? await campaignRes.json() : {};
      const pendingData = pendingRes?.ok ? await pendingRes.json() : {};
      const pharmPendingData = pharmPendingRes?.ok ? await pharmPendingRes.json() : {};
      const adminData = adminStatsRes?.ok ? await adminStatsRes.json() : {};

      setStats({
        realEstateListings: listingData.total_listings || 0,
        pharmacyProspects: prospectData.total || 0,
        hotProspects: prospectData.hot || 0,
        campaignsSent: campaignData.total_sent || 0,
        smsBalance: campaignData.sms_balance || 0,
        pendingReview: pendingData.total || 0,
        pharmacyPendingReview: pharmPendingData.total || 0,
        consultations: adminData.consultations || 0,
        inquiries: adminData.inquiries || 0,
        escrowActive: adminData.escrow_active || 0,
        bannersPending: adminData.banners_pending || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: '심사 대기', value: stats.pendingReview, icon: ClipboardCheck, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25', href: '/admin/listings', change: '건물주 매물', changeType: stats.pendingReview > 0 ? 'up' : 'neutral' },
    { title: '상담 신청', value: stats.consultations, icon: Stethoscope, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25', href: '/admin/consultations', change: '개원 패키지', changeType: stats.consultations > 0 ? 'up' : 'neutral' },
    { title: '문의', value: stats.inquiries, icon: MessageCircle, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/25', href: '/admin/inquiries', change: '미답변', changeType: stats.inquiries > 0 ? 'up' : 'neutral' },
    { title: '부동산 매물', value: stats.realEstateListings, icon: Building2, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/25', href: '/admin/realestate', change: '활성', changeType: 'neutral' as const },
    { title: '약국 타겟', value: stats.pharmacyProspects, icon: Pill, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25', href: '/admin/prospects', change: `HOT ${stats.hotProspects}`, changeType: 'neutral' as const },
    { title: '에스크로', value: stats.escrowActive, icon: ShieldCheck, color: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/25', href: '/admin/escrow', change: '진행중', changeType: 'neutral' as const },
    { title: '배너 대기', value: stats.bannersPending, icon: Megaphone, color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/25', href: '/admin/banners', change: '승인 필요', changeType: stats.bannersPending > 0 ? 'up' : 'neutral' },
    { title: '약국 매물 대기', value: stats.pharmacyPendingReview, icon: Pill, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25', href: '/admin/pharmacy-listings', change: '약국 양도', changeType: stats.pharmacyPendingReview > 0 ? 'up' : 'neutral' },
    { title: '발송 완료', value: stats.campaignsSent, icon: Send, color: 'from-blue-400 to-cyan-500', shadow: 'shadow-blue-500/25', href: '/admin/campaigns', change: '이번 주', changeType: 'neutral' as const },
    { title: 'SMS 잔액', value: stats.smsBalance.toLocaleString(), icon: TrendingUp, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/25', href: '/admin/campaigns', change: '원', changeType: 'neutral' as const },
  ];

  const quickLinks = [
    { href: '/admin/consultations', label: '상담 신청', desc: '개원 패키지 상담', icon: Stethoscope, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/25' },
    { href: '/admin/inquiries', label: '문의 관리', desc: '고객 문의 확인/답변', icon: MessageCircle, color: 'from-violet-500 to-purple-500', shadow: 'shadow-violet-500/25' },
    { href: '/admin/banners', label: '배너 광고', desc: '광고 승인/수익 관리', icon: Megaphone, color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/25' },
    { href: '/admin/partners', label: '파트너 관리', desc: '파트너 인증/현황', icon: HeartHandshake, color: 'from-red-500 to-pink-500', shadow: 'shadow-red-500/25' },
    { href: '/admin/escrow', label: '에스크로', desc: '안전거래/분쟁 관리', icon: ShieldCheck, color: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/25' },
    { href: '/admin/group-buying', label: '공동구매', desc: '코호트/참여자 관리', icon: ShoppingCart, color: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/25' },
    { href: '/admin/simulations', label: '시뮬레이션', desc: '이력/통계 조회', icon: BarChart3, color: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/25' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-500 mt-1">상담, 문의, 매물, 비즈니스 현황을 한 눈에 관리하세요.</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <TossIcon icon={card.icon} color={card.color} shadow={card.shadow} size="sm" />
              {card.changeType === 'up' && (
                <span className="flex items-center text-emerald-600 text-xs font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {card.change}
                </span>
              )}
              {card.changeType === 'down' && (
                <span className="flex items-center text-rose-600 text-xs font-medium">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {card.change}
                </span>
              )}
              {card.changeType === 'neutral' && (
                <span className="text-gray-400 text-xs">{card.change}</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">
              {loading ? '-' : card.value}
            </p>
            <p className="text-xs text-gray-500">{card.title}</p>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">바로가기</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group text-center"
            >
              <div className="flex justify-center mb-3">
                <TossIcon icon={link.icon} color={link.color} shadow={link.shadow} size="md" />
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{link.label}</p>
              <p className="text-xs text-gray-400">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 매물 심사 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TossIcon icon={ClipboardCheck} color="from-amber-500 to-orange-500" shadow="shadow-amber-500/25" size="sm" />
              <div>
                <h3 className="font-semibold text-gray-900">매물 심사</h3>
                <p className="text-sm text-gray-500">건물주 등록 매물</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/listings" className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors text-sm">
                심사 목록 보기
              </Link>
              <Link href="/admin/listings?status=PENDING_REVIEW" className="block w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-center text-sm">
                대기 중인 매물 ({stats.pendingReview}건)
              </Link>
            </div>
          </div>

          {/* 상담 신청 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TossIcon icon={Stethoscope} color="from-rose-500 to-pink-500" shadow="shadow-rose-500/25" size="sm" />
              <div>
                <h3 className="font-semibold text-gray-900">상담 신청</h3>
                <p className="text-sm text-gray-500">개원 패키지 상담</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/consultations" className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors text-sm">
                전체 상담 보기
              </Link>
              <Link href="/admin/consultations?status=NEW" className="block w-full px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-center text-sm">
                신규 상담 확인
              </Link>
            </div>
          </div>

          {/* 문의 관리 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TossIcon icon={MessageCircle} color="from-violet-500 to-purple-500" shadow="shadow-violet-500/25" size="sm" />
              <div>
                <h3 className="font-semibold text-gray-900">문의 관리</h3>
                <p className="text-sm text-gray-500">고객 문의 답변</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/inquiries" className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors text-sm">
                전체 문의 보기
              </Link>
              <Link href="/admin/inquiries?status=NEW" className="block w-full px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors text-center text-sm">
                미답변 문의 확인
              </Link>
            </div>
          </div>

          {/* 배너 승인 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TossIcon icon={Megaphone} color="from-orange-500 to-red-500" shadow="shadow-orange-500/25" size="sm" />
              <div>
                <h3 className="font-semibold text-gray-900">배너 광고</h3>
                <p className="text-sm text-gray-500">승인 및 수익 관리</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/banners" className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-sm">
                광고 목록 보기
              </Link>
              <Link href="/admin/banners?status=PENDING" className="block w-full px-4 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors text-center text-sm">
                승인 대기 ({stats.bannersPending}건)
              </Link>
            </div>
          </div>

          {/* 에스크로 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <TossIcon icon={ShieldCheck} color="from-teal-500 to-cyan-500" shadow="shadow-teal-500/25" size="sm" />
              <div>
                <h3 className="font-semibold text-gray-900">에스크로</h3>
                <p className="text-sm text-gray-500">안전거래/분쟁</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/escrow" className="block px-4 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors text-sm">
                거래 목록 보기
              </Link>
              <Link href="/admin/escrow?tab=disputes" className="block w-full px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-center text-sm">
                분쟁 관리
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (placeholder) */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">최근 활동</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="space-y-4">
            {[
              { time: '방금 전', text: '새 상담 신청이 접수되었습니다', type: 'consultation', href: '/admin/consultations' },
              { time: '10분 전', text: '배너 광고 승인 요청이 등록되었습니다', type: 'banner', href: '/admin/banners' },
              { time: '30분 전', text: '매물 심사 요청이 등록되었습니다', type: 'listing', href: '/admin/listings' },
              { time: '1시간 전', text: '고객 문의가 접수되었습니다', type: 'inquiry', href: '/admin/inquiries' },
              { time: '2시간 전', text: '에스크로 거래가 완료되었습니다', type: 'escrow', href: '/admin/escrow' },
            ].map((activity, i) => (
              <Link key={i} href={activity.href} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 group-hover:text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

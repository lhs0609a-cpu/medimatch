'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import {
  BarChart3,
  TrendingUp,
  Bell,
  CreditCard,
  ArrowRight,
  MapPin,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Zap,
  Building2,
  Plus,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

interface DashboardStats {
  totalSimulations: number;
  totalBids: number;
  successfulBids: number;
  pendingAlerts: number;
  credits: number;
  subscriptionStatus: string;
  subscriptionExpires: string | null;
}

interface RecentActivity {
  id: number;
  type: 'simulation' | 'bid' | 'alert' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('DOCTOR');
  const [userName, setUserName] = useState<string>('사용자');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Use apiClient (handles baseURL, auth token, and error interceptors)
      const userResponse = await apiClient.get('/auth/me');
      const userData = userResponse.data;
      setUserRole(userData.role || 'DOCTOR');
      setUserName(userData.full_name || '사용자');

      try {
        const statsResponse = await apiClient.get('/dashboard/stats');
        const statsData = statsResponse.data;
        setStats({
          totalSimulations: statsData.total_simulations || 0,
          totalBids: statsData.total_bids || 0,
          successfulBids: statsData.successful_bids || 0,
          pendingAlerts: statsData.pending_alerts || 0,
          credits: statsData.credits || 0,
          subscriptionStatus: statsData.subscription_status || 'INACTIVE',
          subscriptionExpires: statsData.subscription_expires || null,
        });
      } catch {
        setStats({
          totalSimulations: 0,
          totalBids: 0,
          successfulBids: 0,
          pendingAlerts: 0,
          credits: 0,
          subscriptionStatus: 'INACTIVE',
          subscriptionExpires: null,
        });
      }

      try {
        const activitiesResponse = await apiClient.get('/dashboard/activities', { params: { limit: 5 } });
        const activitiesData = activitiesResponse.data;
        setActivities(
          activitiesData.items?.map((item: any) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            timestamp: item.created_at,
            status: item.status,
          })) || []
        );
      } catch {
        setActivities([]);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return;
      }
      setStats({
        totalSimulations: 0,
        totalBids: 0,
        successfulBids: 0,
        pendingAlerts: 0,
        credits: 0,
        subscriptionStatus: 'INACTIVE',
        subscriptionExpires: null,
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = (() => {
    switch (userRole) {
      case 'LANDLORD':
        return [
          { label: '매물 등록', href: '/landlord/register', icon: Plus, color: 'emerald', desc: '새 매물' },
          { label: '내 매물', href: '/landlord', icon: Building2, color: 'blue', desc: '관리하기' },
          { label: '구독 관리', href: '/subscription/listing', icon: CreditCard, color: 'amber', desc: '정기결제' },
          { label: '매물 검색', href: '/buildings', icon: Search, color: 'sky', desc: '입점 현황' },
        ];
      case 'PHARMACIST':
        return [
          { label: '매물 찾기', href: '/buildings', icon: Search, color: 'emerald', desc: '건물 검색' },
          { label: '약국 등록', href: '/pharmacist/register', icon: Plus, color: 'blue', desc: '양도 등록' },
          { label: '내 약국 매물', href: '/pharmacist', icon: Building2, color: 'fuchsia', desc: '관리하기' },
          { label: '약국 매칭', href: '/pharmacy', icon: MapPin, color: 'sky', desc: '매칭 찾기' },
        ];
      default:
        return [
          { label: '시뮬레이션', href: '/simulate', icon: BarChart3, color: 'blue', desc: '개원 분석' },
          { label: '개원지 탐색', href: '/prospects', icon: Search, color: 'emerald', desc: '프로스펙트' },
          { label: '약국 매칭', href: '/pharmacy', icon: Building2, color: 'fuchsia', desc: '입찰하기' },
          { label: '지도', href: '/map', icon: MapPin, color: 'sky', desc: '전체보기' },
        ];
    }
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'simulation': return <BarChart3 className="w-5 h-5" />;
      case 'bid': return <CreditCard className="w-5 h-5" />;
      case 'alert': return <Bell className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg-soft flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 animate-pulse w-fit">
            <TossIcon icon={Sparkles} color="from-blue-500 to-blue-600" size="xl" />
          </div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/assets/logo/mediplaton-horizontal.png" alt="MEDI-PLATON" className="h-8 object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {['대시보드', '지도', '알림', '설정'].map((item, i) => (
                <Link
                  key={item}
                  href={['/', '/map', '/alerts', '/mypage'][i]}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    i === 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {(stats?.pendingAlerts || 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                {userName.charAt(0)}
              </div>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl animate-fade-in-down">
            <div className="px-4 py-3 space-y-1">
              {['대시보드', '지도', '알림', '설정'].map((item, i) => (
                <Link
                  key={item}
                  href={['/', '/map', '/alerts', '/mypage'][i]}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    i === 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, {userName}님!
            </h1>
          </div>
          <p className="text-gray-500">오늘도 메디플라톤과 함께 스마트한 의료 개원을 준비하세요.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative p-5 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${action.color}-500/10 rounded-full blur-2xl`} />
              <div className="relative">
                <div className="mb-4">
                  <TossIcon icon={action.icon} color={`from-${action.color}-500 to-${action.color}-600`} size="md" shadow={`shadow-${action.color}-500/25`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                <p className="text-sm text-gray-500">{action.desc}</p>
                <ChevronRight className="absolute right-0 bottom-0 w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Maintenance Link */}
        <Link
          href="/my/maintenance"
          className="flex items-center gap-3 mb-8 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">관리유지비</h4>
            <p className="text-xs text-gray-500">홈페이지/프로그램 관리비 결제 및 요청</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats?.totalSimulations || 0}</p>
            <p className="text-sm text-gray-500">시뮬레이션</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">📈</span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {stats?.totalBids ? Math.round((stats.successfulBids / stats.totalBids) * 100) : 0}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stats?.successfulBids || 0}<span className="text-gray-400 text-lg">/{stats?.totalBids || 0}</span>
            </p>
            <p className="text-sm text-gray-500">낙찰 현황</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">🔔</span>
              {(stats?.pendingAlerts || 0) > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats?.pendingAlerts || 0}</p>
            <p className="text-sm text-gray-500">새 알림</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats?.credits || 0}</p>
            <p className="text-sm text-gray-500">크레딧 잔액</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                전체 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mx-auto mb-4">⏰</span>
                <p className="text-gray-500 mb-4">아직 활동 내역이 없습니다.</p>
                <Link href="/simulate" className="btn-primary inline-flex">
                  첫 시뮬레이션 시작
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.type === 'simulation' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'alert' ? 'bg-rose-100 text-rose-600' :
                      activity.type === 'bid' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          activity.status === 'new' ? 'bg-sky-100 text-sky-700' :
                          activity.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.status === 'completed' ? '완료' :
                           activity.status === 'new' ? '신규' :
                           activity.status === 'pending' ? '대기중' : activity.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">구독 상태</h2>
              {stats?.subscriptionStatus === 'ACTIVE' ? (
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">프로 구독 활성화</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    {stats.subscriptionExpires && (
                      <>만료일: {new Date(stats.subscriptionExpires).toLocaleDateString('ko-KR')}</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">무료 플랜</span>
                  </div>
                  <Link href="/payment" className="btn-primary w-full text-center">
                    <Zap className="w-4 h-4 mr-2" />
                    프로로 업그레이드
                  </Link>
                </div>
              )}
            </div>

            {/* Recommended Prospects */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">추천 프로스펙트</h2>
                <Link href="/prospects" className="text-sm text-blue-600 hover:text-blue-700">
                  더보기
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-success">신규</span>
                    <span className="text-sm font-semibold text-blue-600">92점</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">강남구 역삼동 신축</h4>
                  <p className="text-xs text-gray-500">피부과, 정형외과 추천</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-danger">공실</span>
                    <span className="text-sm font-semibold text-blue-600">88점</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">서초구 의료빌딩</h4>
                  <p className="text-xs text-gray-500">이전: 내과의원</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

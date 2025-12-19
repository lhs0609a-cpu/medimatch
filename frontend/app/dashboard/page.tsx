'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('DOCTOR');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 실제 구현에서는 API 호출
      // Mock 데이터
      setStats({
        totalSimulations: 12,
        totalBids: 5,
        successfulBids: 2,
        pendingAlerts: 3,
        credits: 5,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpires: '2025-02-15',
      });

      setActivities([
        {
          id: 1,
          type: 'simulation',
          title: '시뮬레이션 완료',
          description: '강남구 역삼동 피부과 개원 시뮬레이션',
          timestamp: '2025-01-15T10:30:00',
          status: 'completed',
        },
        {
          id: 2,
          type: 'bid',
          title: '입찰 등록',
          description: '서초구 서초동 약국 슬롯 입찰',
          timestamp: '2025-01-14T14:20:00',
          status: 'pending',
        },
        {
          id: 3,
          type: 'alert',
          title: '새로운 프로스펙트',
          description: '송파구 잠실동에 새로운 입지 발견',
          timestamp: '2025-01-14T09:00:00',
          status: 'new',
        },
        {
          id: 4,
          type: 'payment',
          title: '결제 완료',
          description: 'SalesScanner 월 구독',
          timestamp: '2025-01-10T16:45:00',
          status: 'completed',
        },
      ]);

      setUserRole('DOCTOR');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = (): QuickAction[] => {
    const baseActions: QuickAction[] = [
      { label: '지도 보기', href: '/map', icon: 'map', color: 'blue' },
    ];

    switch (userRole) {
      case 'DOCTOR':
        return [
          { label: '시뮬레이션 시작', href: '/simulate', icon: 'chart', color: 'purple' },
          { label: '약국 슬롯 등록', href: '/pharmacy/register', icon: 'plus', color: 'green' },
          ...baseActions,
        ];
      case 'PHARMACIST':
        return [
          { label: '슬롯 입찰하기', href: '/pharmacy', icon: 'bid', color: 'yellow' },
          { label: '내 입찰 현황', href: '/pharmacy/mybids', icon: 'list', color: 'blue' },
          ...baseActions,
        ];
      case 'SALES_REP':
        return [
          { label: '프로스펙트 검색', href: '/prospects', icon: 'search', color: 'green' },
          { label: '알림 설정', href: '/alerts', icon: 'bell', color: 'red' },
          ...baseActions,
        ];
      default:
        return baseActions;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'simulation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'bid':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      new: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels: { [key: string]: string } = {
      completed: '완료',
      pending: '대기중',
      new: '신규',
      failed: '실패',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              MediMatch
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/map" className="text-gray-600 hover:text-gray-900">지도</Link>
              <Link href="/alerts" className="text-gray-600 hover:text-gray-900">알림</Link>
              <Link href="/mypage" className="text-gray-600 hover:text-gray-900">마이페이지</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">안녕하세요!</h1>
          <p className="text-gray-600 mt-1">오늘도 MediMatch와 함께하세요.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">시뮬레이션</span>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalSimulations}</p>
            <p className="text-xs text-gray-500 mt-1">전체 시뮬레이션</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">입찰</span>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.successfulBids}/{stats?.totalBids}
            </p>
            <p className="text-xs text-gray-500 mt-1">낙찰/전체 입찰</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">알림</span>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.pendingAlerts}</p>
            <p className="text-xs text-gray-500 mt-1">확인하지 않은 알림</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">크레딧</span>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.credits}</p>
            <p className="text-xs text-gray-500 mt-1">잔여 리포트 크레딧</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 빠른 실행 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 실행</h2>
              <div className="space-y-3">
                {getQuickActions().map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-colors`}
                  >
                    <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                      <svg className={`w-5 h-5 text-${action.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-900">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 구독 상태 */}
            <div className="bg-white rounded-xl shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">구독 상태</h2>
              {stats?.subscriptionStatus === 'ACTIVE' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">활성화</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {stats.subscriptionExpires && (
                      <>만료일: {new Date(stats.subscriptionExpires).toLocaleDateString('ko-KR')}</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">구독이 비활성화 상태입니다.</p>
                  <Link
                    href="/payment"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    구독하기
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
                <Link href="/activities" className="text-sm text-blue-600 hover:underline">
                  전체 보기
                </Link>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500">최근 활동이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 추천 프로스펙트 */}
            <div className="bg-white rounded-xl shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">추천 프로스펙트</h2>
                <Link href="/prospects" className="text-sm text-blue-600 hover:underline">
                  전체 보기
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      신규
                    </span>
                    <span className="text-blue-600 font-medium text-sm">적합도 92점</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">강남구 역삼동 신축 건물</h4>
                  <p className="text-sm text-gray-500">서울특별시 강남구 테헤란로 123</p>
                  <p className="text-xs text-gray-400 mt-2">추천 진료과: 피부과, 정형외과</p>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      공실
                    </span>
                    <span className="text-blue-600 font-medium text-sm">적합도 88점</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">서초구 서초동 의료 빌딩</h4>
                  <p className="text-sm text-gray-500">서울특별시 서초구 서초대로 456</p>
                  <p className="text-xs text-gray-400 mt-2">이전: 내과의원</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

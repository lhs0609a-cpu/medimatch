'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  Home,
  Pill,
  Send,
  TrendingUp,
  ClipboardCheck,
  CreditCard,
  LogIn,
  Stethoscope,
  MessageCircle,
  Megaphone,
  HeartHandshake,
  ShieldCheck,
  ShoppingCart,
  Globe,
  LayoutDashboard,
  UserCog,
  GitBranch,
  Calculator,
  Target,
  MessageSquarePlus,
} from 'lucide-react';

interface SidebarGroup {
  title: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    title: '',
    items: [
      { href: '/admin', label: '대시보드', icon: Home },
    ],
  },
  {
    title: '심사/매물',
    items: [
      { href: '/admin/listings', label: '매물 심사', icon: ClipboardCheck },
      { href: '/admin/pharmacy-listings', label: '약국 매물', icon: Pill },
      { href: '/admin/realestate', label: '부동산 매물', icon: Building2 },
    ],
  },
  {
    title: '고객 관리',
    items: [
      { href: '/admin/consultations', label: '상담 신청', icon: Stethoscope },
      { href: '/admin/inquiries', label: '문의 관리', icon: MessageCircle },
      { href: '/admin/users', label: '회원 관리', icon: Users },
    ],
  },
  {
    title: '비즈니스',
    items: [
      { href: '/admin/banners', label: '배너 광고', icon: Megaphone },
      { href: '/admin/partners', label: '파트너 관리', icon: HeartHandshake },
      { href: '/admin/escrow', label: '에스크로/계약', icon: ShieldCheck },
      { href: '/admin/group-buying', label: '공동구매', icon: ShoppingCart },
    ],
  },
  {
    title: '부동산 중개',
    items: [
      { href: '/admin/broker-control', label: '컨트롤타워', icon: LayoutDashboard },
      { href: '/admin/brokers', label: '중개사 관리', icon: UserCog },
      { href: '/admin/broker-deals', label: '딜 파이프라인', icon: GitBranch },
      { href: '/admin/broker-calculator', label: '수수료 계산기', icon: Calculator },
      { href: '/admin/opening-tracker', label: '개원 추적', icon: Target },
      { href: '/admin/broker-board', label: '게시판', icon: MessageSquarePlus },
    ],
  },
  {
    title: '분석/운영',
    items: [
      { href: '/admin/simulations', label: '시뮬레이션', icon: BarChart3 },
      { href: '/admin/payments', label: '결제/구독', icon: CreditCard },
      { href: '/admin/service-subscriptions', label: '서비스 구독', icon: Globe },
      { href: '/admin/campaigns', label: '캠페인', icon: Send },
      { href: '/admin/prospects', label: '약국 타겟팅', icon: Pill },
      { href: '/admin/stats', label: '통계', icon: TrendingUp },
      { href: '/admin/settings', label: '설정', icon: Settings },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const user = await response.json();
      if (user.role === 'ADMIN' || user.role === 'SALES_REP') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const loginRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!loginRes.ok) {
        setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      const token = await loginRes.json();
      localStorage.setItem('access_token', token.access_token);
      if (token.refresh_token) {
        localStorage.setItem('refresh_token', token.refresh_token);
      }

      const meRes = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });

      if (!meRes.ok) {
        setLoginError('사용자 정보를 가져올 수 없습니다.');
        return;
      }

      const user = await meRes.json();
      if (user.role === 'ADMIN' || user.role === 'SALES_REP') {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setLoginError('관리자 권한이 없습니다.');
      }
    } catch (error) {
      setLoginError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">관리자 로그인</h1>
              <p className="text-sm text-gray-500 mt-1">메디플라톤 관리자 페이지</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {loginLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    로그인
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-100">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">메디플라톤</span>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
              Admin
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {sidebarGroups.map((group, gi) => (
              <div key={gi}>
                {group.title && (
                  <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.title}</p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                          isActive
                            ? 'bg-violet-50 text-violet-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : ''}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Back to Dashboard */}
          <div className="p-4 border-t border-gray-100">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

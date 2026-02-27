'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Building2,
  MessageSquare,
  ChevronLeft,
  Sparkles,
  LogIn,
} from 'lucide-react';

const sidebarItems = [
  { href: '/broker', label: '대시보드', icon: LayoutDashboard },
  { href: '/broker/deals', label: '내 딜', icon: FileText },
  { href: '/broker/listings', label: '매물 검색', icon: Building2 },
  { href: '/broker/board', label: '게시판', icon: MessageSquare },
];

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const user = await res.json();
      if (user.role === 'SALES_REP') setIsAuthed(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
      if (!loginRes.ok) { setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.'); return; }
      const token = await loginRes.json();
      localStorage.setItem('access_token', token.access_token);
      if (token.refresh_token) localStorage.setItem('refresh_token', token.refresh_token);

      const meRes = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!meRes.ok) { setLoginError('사용자 정보를 가져올 수 없습니다.'); return; }
      const user = await meRes.json();
      if (user.role === 'SALES_REP') {
        setIsAuthed(true);
      } else {
        localStorage.removeItem('access_token');
        setLoginError('중개인 권한이 없습니다.');
      }
    } catch (e) { setLoginError('로그인 중 오류가 발생했습니다.'); }
    finally { setLoginLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">중개인 포털</h1>
              <p className="text-sm text-gray-500 mt-1">메디플라톤 부동산 중개</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {loginError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50">
                {loginLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-4 h-4" /> 로그인</>}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">메인으로 돌아가기</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-40 h-screen w-56 bg-white border-r border-gray-100">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-2 px-5 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">중개인 포털</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/broker' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" /> 대시보드로
            </Link>
          </div>
        </div>
      </aside>

      <main className="ml-56 min-h-screen">{children}</main>
    </div>
  );
}

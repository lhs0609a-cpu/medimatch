'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  company: string | null;
  createdAt: string;
}

interface Subscription {
  plan: string;
  status: string;
  expires_at: string;
  is_auto_renew: boolean;
}

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // 실제 구현에서는 API 호출
      // Mock 데이터
      setProfile({
        id: 1,
        email: 'doctor@example.com',
        name: '김의사',
        phone: '010-1234-5678',
        role: 'DOCTOR',
        company: '메디매치 병원',
        createdAt: '2024-06-01T00:00:00',
      });

      setSubscription({
        plan: 'monthly',
        status: 'ACTIVE',
        expires_at: '2025-02-15T00:00:00',
        is_auto_renew: true,
      });

      setEditForm({
        name: '김의사',
        phone: '010-1234-5678',
        company: '메디매치 병원',
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // API 호출하여 프로필 저장
      console.log('Saving profile:', editForm);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name,
              phone: editForm.phone,
              company: editForm.company,
            }
          : null
      );
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      DOCTOR: '의사',
      PHARMACIST: '약사',
      SALES_REP: '영업사원',
      ADMIN: '관리자',
    };
    return labels[role] || role;
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              대시보드로 돌아가기
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline text-sm"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">마이페이지</h1>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">프로필 정보</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  저장
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-6">
            {/* 프로필 이미지 */}
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">
                {profile?.name?.charAt(0) || 'U'}
              </span>
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">소속</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">이름</p>
                    <p className="font-medium text-gray-900">{profile?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">이메일</p>
                    <p className="font-medium text-gray-900">{profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">연락처</p>
                    <p className="font-medium text-gray-900">{profile?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">회원 유형</p>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {getRoleLabel(profile?.role || '')}
                    </span>
                  </div>
                  {profile?.company && (
                    <div>
                      <p className="text-sm text-gray-500">소속</p>
                      <p className="font-medium text-gray-900">{profile.company}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">가입일</p>
                    <p className="font-medium text-gray-900">
                      {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 구독 정보 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">구독 정보</h2>
            <Link href="/payment" className="text-sm text-blue-600 hover:underline">
              구독 관리
            </Link>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    subscription.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></div>
                <span className="font-medium text-gray-900">
                  {subscription.status === 'ACTIVE' ? '활성화됨' : '비활성화'}
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">구독 플랜</p>
                  <p className="font-medium text-gray-900">
                    {subscription.plan === 'monthly' ? '월간 구독' : '연간 구독'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">만료일</p>
                  <p className="font-medium text-gray-900">
                    {new Date(subscription.expires_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">자동 결제</p>
                  <p className="font-medium text-gray-900">
                    {subscription.is_auto_renew ? '활성화' : '비활성화'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">활성화된 구독이 없습니다.</p>
              <Link
                href="/payment"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                구독 시작하기
              </Link>
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <Link
            href="/payment/history"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 border-b"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-gray-900">결제 내역</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/alerts"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 border-b"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-gray-900">알림 설정</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/simulate/history"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 border-b"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-gray-900">시뮬레이션 내역</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-red-600"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>로그아웃</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, User, Mail, Phone, Building2, Calendar,
  CreditCard, Bell, BarChart3, LogOut, ChevronRight,
  Crown, Sparkles, Shield, Edit2, Check, X, Heart, Settings
} from 'lucide-react'
import { useSubscription, SubscriptionBadge } from '@/lib/contexts/SubscriptionContext'

interface UserProfile {
  id: number
  email: string
  name: string
  phone: string
  role: string
  company: string | null
  createdAt: string
}

export default function MyPage() {
  const router = useRouter()
  const { subscription, isLoading: subscriptionLoading, refresh: refreshSubscription } = useSubscription()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    company: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const profileResponse = await fetch('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch profile')
      }

      const profileData = await profileResponse.json()
      setProfile({
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        phone: profileData.phone || '',
        role: profileData.role,
        company: profileData.company || null,
        createdAt: profileData.created_at,
      })

      setEditForm({
        name: profileData.name || '',
        phone: profileData.phone || '',
        company: profileData.company || '',
      })
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          company: editForm.company,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedData = await response.json()

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: updatedData.name || editForm.name,
              phone: updatedData.phone || editForm.phone,
              company: updatedData.company || editForm.company,
            }
          : null
      )
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save profile:', err)
      alert('프로필 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      DOCTOR: '의사',
      PHARMACIST: '약사',
      SALES_REP: '영업사원',
      ADMIN: '관리자',
    }
    return labels[role] || role
  }

  const getSubscriptionLabel = () => {
    switch (subscription.tier) {
      case 'vip':
        return { label: 'VIP', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' }
      case 'premium':
        return { label: '프리미엄', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' }
      default:
        return { label: '무료', icon: Shield, color: 'text-muted-foreground', bg: 'bg-secondary' }
    }
  }

  const subscriptionInfo = getSubscriptionLabel()
  const SubscriptionIcon = subscriptionInfo.icon

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span>홈으로</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-foreground mb-8">마이페이지</h1>

        {/* Subscription Status Card - Prominent */}
        <div className={`rounded-2xl p-6 mb-6 ${
          subscription.tier === 'vip'
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            : subscription.tier === 'premium'
            ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
            : 'bg-card border'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                subscription.tier !== 'free' ? 'bg-white/20' : 'bg-primary/10'
              }`}>
                <SubscriptionIcon className={`w-6 h-6 ${
                  subscription.tier !== 'free' ? 'text-white' : 'text-primary'
                }`} />
              </div>
              <div>
                <p className={`text-sm ${subscription.tier !== 'free' ? 'text-white/70' : 'text-muted-foreground'}`}>
                  현재 멤버십
                </p>
                <p className={`text-xl font-bold ${subscription.tier !== 'free' ? 'text-white' : 'text-foreground'}`}>
                  {subscriptionInfo.label} 회원
                </p>
              </div>
            </div>
            {subscription.tier === 'free' ? (
              <Link
                href="/subscribe"
                className="btn-primary"
              >
                업그레이드
              </Link>
            ) : (
              <Link
                href="/subscribe"
                className={`px-4 py-2 rounded-lg font-medium ${
                  subscription.tier !== 'free'
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-primary/10 hover:bg-primary/20 text-primary'
                } transition-colors`}
              >
                구독 관리
              </Link>
            )}
          </div>

          {/* Subscription Benefits / Usage */}
          {subscription.tier !== 'free' ? (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/70 text-sm">시뮬레이션</p>
                <p className="text-lg font-semibold">
                  {subscription.features.maxSimulations === 'unlimited' ? '무제한' : `${subscription.usedSimulations}/${subscription.features.maxSimulations}`}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm">리포트</p>
                <p className="text-lg font-semibold">
                  {subscription.features.maxReportsPerMonth === 'unlimited' ? '무제한' : `${subscription.usedReports}/${subscription.features.maxReportsPerMonth}`}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm">만료일</p>
                <p className="text-lg font-semibold">
                  {subscription.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    : '-'}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                프리미엄으로 업그레이드하고 무제한 시뮬레이션, 상세 리포트 등 다양한 혜택을 누려보세요.
              </p>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">프로필 정보</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                  취소
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                  disabled={saving}
                >
                  <Check className="w-4 h-4" />
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-6">
            {/* Profile Avatar */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">
                {profile?.name?.charAt(0) || 'U'}
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">이름</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">연락처</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">소속</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">이름</p>
                      <p className="font-medium text-foreground">{profile?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">이메일</p>
                      <p className="font-medium text-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">연락처</p>
                      <p className="font-medium text-foreground">{profile?.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">회원 유형</p>
                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {getRoleLabel(profile?.role || '')}
                      </span>
                    </div>
                  </div>
                  {profile?.company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">소속</p>
                        <p className="font-medium text-foreground">{profile.company}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">가입일</p>
                      <p className="font-medium text-foreground">
                        {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Menu */}
        <div className="card overflow-hidden">
          <Link
            href="/favorites"
            className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">찜한 매물</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link
            href="/simulate/history"
            className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">시뮬레이션 내역</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link
            href="/payment/history"
            className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">결제 내역</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link
            href="/alerts"
            className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">알림 설정</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">설정</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </div>
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">이용약관</Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
          <span>|</span>
          <Link href="/help" className="hover:text-foreground">고객센터</Link>
        </div>
      </div>
    </div>
  )
}

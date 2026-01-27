'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Settings, Moon, Sun, Monitor, Globe,
  Lock, Bell, Shield, Trash2, ChevronRight, LogOut,
  Eye, EyeOff, Check
} from 'lucide-react'
import { useTheme } from '@/components/theme'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(true)
  const [dataSharing, setDataSharing] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    try {
      // TODO: API call to delete account
      toast.success('계정이 삭제되었습니다')
      localStorage.removeItem('token')
      router.push('/')
    } catch {
      toast.error('계정 삭제에 실패했습니다')
    }
  }

  const themeOptions = [
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6">설정을 변경하려면 로그인이 필요합니다</p>
          <Link href="/login" className="btn-primary">
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mypage" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">설정</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Theme Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5" />
            화면 테마
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    theme === option.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className={`text-sm font-medium ${
                    theme === option.value ? 'text-primary' : 'text-foreground'
                  }`}>
                    {option.label}
                  </p>
                  {theme === option.value && (
                    <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <Link
              href="/alerts"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">매물 알림 설정</p>
                <p className="text-sm text-muted-foreground">관심 지역/진료과 알림 관리</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            <div className="flex items-center justify-between p-3 rounded-lg">
              <div>
                <p className="font-medium text-foreground">마케팅 수신 동의</p>
                <p className="text-sm text-muted-foreground">프로모션, 이벤트 정보 수신</p>
              </div>
              <button
                onClick={() => setMarketingConsent(!marketingConsent)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  marketingConsent ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    marketingConsent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            개인정보 설정
          </h2>
          <div className="space-y-4">
            <Link
              href="/mypage"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">내 정보 관리</p>
                <p className="text-sm text-muted-foreground">이름, 연락처, 소속 변경</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>

            <div className="flex items-center justify-between p-3 rounded-lg">
              <div>
                <p className="font-medium text-foreground">데이터 분석 동의</p>
                <p className="text-sm text-muted-foreground">서비스 개선을 위한 데이터 활용</p>
              </div>
              <button
                onClick={() => setDataSharing(!dataSharing)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  dataSharing ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    dataSharing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <Link
              href="/privacy"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">개인정보처리방침</p>
                <p className="text-sm text-muted-foreground">개인정보 수집 및 이용 안내</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            보안 설정
          </h2>
          <div className="space-y-4">
            <button
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
              onClick={() => toast.info('비밀번호 변경 이메일이 발송됩니다')}
            >
              <div>
                <p className="font-medium text-foreground">비밀번호 변경</p>
                <p className="text-sm text-muted-foreground">이메일로 재설정 링크 발송</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium text-foreground">로그아웃</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-200 dark:border-red-900/50">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            계정 삭제
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              계정 삭제
            </button>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 mb-4">
                정말로 계정을 삭제하시겠습니까? 모든 데이터가 삭제됩니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  삭제 확인
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>메디플라톤 v1.0.0</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">이용약관</Link>
            <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
            <Link href="/help" className="hover:text-foreground">고객센터</Link>
          </div>
        </div>
      </main>
    </div>
  )
}

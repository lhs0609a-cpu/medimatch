'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  TestTube,
} from 'lucide-react'
import { notificationService, NotificationPreference } from '@/lib/api/services'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setIsLoading(true)
    try {
      const data = await notificationService.getPreferences()
      setPreferences(data)
    } catch (error) {
      // Default preferences
      setPreferences({
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        kakao_enabled: false,
        prospect_alerts: true,
        chat_messages: true,
        payment_updates: true,
        match_updates: true,
        marketing: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (key: keyof NotificationPreference) => {
    if (!preferences) return

    const newValue = !preferences[key]
    const newPreferences = { ...preferences, [key]: newValue }
    setPreferences(newPreferences)

    setIsSaving(true)
    try {
      await notificationService.updatePreferences({ [key]: newValue })
    } catch (error) {
      // Revert on error
      setPreferences(preferences)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await notificationService.sendTestNotification()
      setTestResult(`${result.message} (${result.devices_count}개 디바이스)`)
    } catch (error) {
      setTestResult('테스트 알림 발송 실패')
    } finally {
      setIsTesting(false)
    }
  }

  const Toggle = ({
    enabled,
    onChange,
    disabled = false,
  }: {
    enabled: boolean
    onChange: () => void
    disabled?: boolean
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-violet-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">알림 설정</h1>
          {isSaving && (
            <Loader2 className="w-4 h-4 text-violet-600 animate-spin ml-auto" />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* 알림 채널 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">알림 채널</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-medium text-gray-900">푸시 알림</p>
                  <p className="text-sm text-gray-500">브라우저/앱 푸시 알림</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.push_enabled ?? true}
                onChange={() => handleToggle('push_enabled')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-medium text-gray-900">이메일</p>
                  <p className="text-sm text-gray-500">중요 알림 이메일 수신</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.email_enabled ?? true}
                onChange={() => handleToggle('email_enabled')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-medium text-gray-900">SMS</p>
                  <p className="text-sm text-gray-500">문자 메시지 수신</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.sms_enabled ?? false}
                onChange={() => handleToggle('sms_enabled')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium text-gray-900">카카오 알림톡</p>
                  <p className="text-sm text-gray-500">카카오톡으로 알림 수신</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.kakao_enabled ?? false}
                onChange={() => handleToggle('kakao_enabled')}
              />
            </div>
          </div>
        </section>

        {/* 알림 유형 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">알림 유형</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-medium text-gray-900">프로스펙트 알림</p>
                  <p className="text-sm text-gray-500">새로운 입지 발견 알림</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.prospect_alerts ?? true}
                onChange={() => handleToggle('prospect_alerts')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💭</span>
                <div>
                  <p className="font-medium text-gray-900">채팅 메시지</p>
                  <p className="text-sm text-gray-500">파트너/매칭 채팅 알림</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.chat_messages ?? true}
                onChange={() => handleToggle('chat_messages')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-medium text-gray-900">결제 알림</p>
                  <p className="text-sm text-gray-500">결제/에스크로 관련 알림</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.payment_updates ?? true}
                onChange={() => handleToggle('payment_updates')}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-gray-900">매칭 알림</p>
                  <p className="text-sm text-gray-500">매칭/관심 표현 알림</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.match_updates ?? true}
                onChange={() => handleToggle('match_updates')}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📢</span>
                <div>
                  <p className="font-medium text-gray-900">마케팅 알림</p>
                  <p className="text-sm text-gray-500">이벤트/프로모션 정보</p>
                </div>
              </div>
              <Toggle
                enabled={preferences?.marketing ?? false}
                onChange={() => handleToggle('marketing')}
              />
            </div>
          </div>
        </section>

        {/* 테스트 알림 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">알림 테스트</h2>
          <p className="text-sm text-gray-500 mb-4">
            알림이 정상적으로 작동하는지 테스트해보세요.
          </p>
          <button
            onClick={handleTestNotification}
            disabled={isTesting}
            className="w-full py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <TestTube className="w-5 h-5" />
                테스트 알림 발송
              </>
            )}
          </button>
          {testResult && (
            <p
              className={`mt-3 text-sm text-center ${
                testResult.includes('실패') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {testResult}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Bell,
  Mail,
  CreditCard,
  Shield,
  Database,
  Globe,
  Save,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'

interface SettingsData {
  general: {
    site_name: string
    site_url: string
    support_email: string
    maintenance_mode: boolean
  }
  notifications: {
    email_enabled: boolean
    sms_enabled: boolean
    push_enabled: boolean
    slack_webhook: string
  }
  payment: {
    toss_enabled: boolean
    escrow_fee_percent: number
    min_escrow_amount: number
  }
  security: {
    require_email_verification: boolean
    session_timeout_minutes: number
    max_login_attempts: number
  }
  crawler: {
    auto_crawl_enabled: boolean
    crawl_interval_hours: number
    last_crawl_at: string
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'payment' | 'security' | 'crawler'>('general')
  const [crawlType, setCrawlType] = useState<'all' | 'hospitals' | 'closed'>('all')
  const [lastCrawlResult, setLastCrawlResult] = useState<{ task_id: string; task_name: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get("/admin/settings")
      setSettings(response.data)
    } catch (error) {
      console.error("Settings load failed:", error)
      // Fallback to default settings
      setSettings({
        general: {
          site_name: '메디플라톤',
          site_url: 'https://mediplaton.kr',
          support_email: 'support@mediplaton.kr',
          maintenance_mode: false,
        },
        notifications: {
          email_enabled: true,
          sms_enabled: false,
          push_enabled: true,
          slack_webhook: '',
        },
        payment: {
          toss_enabled: true,
          escrow_fee_percent: 3.0,
          min_escrow_amount: 100000,
        },
        security: {
          require_email_verification: true,
          session_timeout_minutes: 30,
          max_login_attempts: 5,
        },
        crawler: {
          auto_crawl_enabled: true,
          crawl_interval_hours: 24,
          last_crawl_at: '2024-01-02T10:30:00Z',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    setSaveMessage(null)
    try {
      await apiClient.put("/admin/settings", settings)
      setSaveMessage({ type: 'success', text: '설정이 저장되었습니다.' })
    } catch (error) {
      setSaveMessage({ type: 'error', text: '설정 저장에 실패했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTriggerCrawl = async () => {
    setIsCrawling(true)
    try {
      const response = await apiClient.post("/admin/crawler/trigger", null, {
        params: { crawl_type: crawlType }
      })
      setLastCrawlResult({
        task_id: response.data.task_id,
        task_name: response.data.task_name
      })
      setSaveMessage({ type: 'success', text: `${response.data.task_name}이(가) 시작되었습니다. (Task ID: ${response.data.task_id})` })
      // Update last crawl time
      if (settings) {
        setSettings({
          ...settings,
          crawler: {
            ...settings.crawler,
            last_crawl_at: response.data.started_at
          }
        })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: '크롤링 시작에 실패했습니다.' })
    } finally {
      setIsCrawling(false)
    }
  }

  const Toggle = ({
    enabled,
    onChange,
  }: {
    enabled: boolean
    onChange: () => void
  }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-violet-600' : 'bg-gray-300'
      }`}
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  const tabs = [
    { key: 'general', label: '일반', icon: Globe },
    { key: 'notifications', label: '알림', icon: Bell },
    { key: 'payment', label: '결제', icon: CreditCard },
    { key: 'security', label: '보안', icon: Shield },
    { key: 'crawler', label: '크롤러', icon: Database },
  ] as const

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p className="text-gray-500 mt-1">플랫폼 설정 관리</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          저장
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        {activeTab === 'general' && settings && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">일반 설정</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 이름
              </label>
              <input
                type="text"
                value={settings.general.site_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, site_name: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사이트 URL
              </label>
              <input
                type="url"
                value={settings.general.site_url}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, site_url: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지원 이메일
              </label>
              <input
                type="email"
                value={settings.general.support_email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    general: { ...settings.general, support_email: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <div>
                <p className="font-medium text-gray-900">유지보수 모드</p>
                <p className="text-sm text-gray-500">사용자 접근을 일시적으로 차단합니다</p>
              </div>
              <Toggle
                enabled={settings.general.maintenance_mode}
                onChange={() =>
                  setSettings({
                    ...settings,
                    general: {
                      ...settings.general,
                      maintenance_mode: !settings.general.maintenance_mode,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && settings && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">알림 설정</h3>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">이메일 알림</p>
                <p className="text-sm text-gray-500">사용자에게 이메일 알림을 발송합니다</p>
              </div>
              <Toggle
                enabled={settings.notifications.email_enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email_enabled: !settings.notifications.email_enabled,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">SMS 알림</p>
                <p className="text-sm text-gray-500">문자 메시지 알림을 발송합니다</p>
              </div>
              <Toggle
                enabled={settings.notifications.sms_enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      sms_enabled: !settings.notifications.sms_enabled,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">푸시 알림</p>
                <p className="text-sm text-gray-500">브라우저/앱 푸시 알림을 발송합니다</p>
              </div>
              <Toggle
                enabled={settings.notifications.push_enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      push_enabled: !settings.notifications.push_enabled,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slack Webhook URL
              </label>
              <input
                type="url"
                value={settings.notifications.slack_webhook}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      slack_webhook: e.target.value,
                    },
                  })
                }
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-400 mt-1">내부 알림용 Slack 웹훅 URL</p>
            </div>
          </div>
        )}

        {activeTab === 'payment' && settings && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">결제 설정</h3>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">토스페이먼츠</p>
                <p className="text-sm text-gray-500">토스페이먼츠 결제를 활성화합니다</p>
              </div>
              <Toggle
                enabled={settings.payment.toss_enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      toss_enabled: !settings.payment.toss_enabled,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                에스크로 수수료 (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.payment.escrow_fee_percent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      escrow_fee_percent: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 에스크로 금액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={settings.payment.min_escrow_amount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      min_escrow_amount: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {activeTab === 'security' && settings && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">보안 설정</h3>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">이메일 인증 필수</p>
                <p className="text-sm text-gray-500">회원가입 시 이메일 인증을 요구합니다</p>
              </div>
              <Toggle
                enabled={settings.security.require_email_verification}
                onChange={() =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      require_email_verification: !settings.security.require_email_verification,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                세션 타임아웃 (분)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.security.session_timeout_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      session_timeout_minutes: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 로그인 시도 횟수
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.security.max_login_attempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      max_login_attempts: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-400 mt-1">
                초과 시 계정이 일시 잠금됩니다
              </p>
            </div>
          </div>
        )}

        {activeTab === 'crawler' && settings && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">크롤러 설정</h3>

            <div className="flex items-center justify-between py-4 border-b">
              <div>
                <p className="font-medium text-gray-900">자동 크롤링</p>
                <p className="text-sm text-gray-500">부동산/약국 정보를 자동으로 수집합니다</p>
              </div>
              <Toggle
                enabled={settings.crawler.auto_crawl_enabled}
                onChange={() =>
                  setSettings({
                    ...settings,
                    crawler: {
                      ...settings.crawler,
                      auto_crawl_enabled: !settings.crawler.auto_crawl_enabled,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                크롤링 주기 (시간)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.crawler.crawl_interval_hours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    crawler: {
                      ...settings.crawler,
                      crawl_interval_hours: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* 수동 크롤링 실행 */}
            <div className="p-6 bg-gray-50 rounded-xl space-y-4">
              <h4 className="font-medium text-gray-900">수동 크롤링 실행</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  크롤링 유형
                </label>
                <select
                  value={crawlType}
                  onChange={(e) => setCrawlType(e.target.value as 'all' | 'hospitals' | 'closed')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  <option value="all">전체 크롤링 (병원 + 건물 + 상권)</option>
                  <option value="hospitals">병원 데이터만 (심평원)</option>
                  <option value="closed">폐업 병원 탐지만</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-500">마지막 크롤링</p>
                  <p className="font-medium text-gray-900">
                    {new Date(settings.crawler.last_crawl_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={handleTriggerCrawl}
                  disabled={isCrawling}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCrawling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isCrawling ? '시작 중...' : '크롤링 시작'}
                </button>
              </div>

              {/* 마지막 실행 결과 */}
              {lastCrawlResult && (
                <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                  <p className="text-sm text-violet-700">
                    <span className="font-medium">{lastCrawlResult.task_name}</span> 실행됨
                  </p>
                  <p className="text-xs text-violet-500 mt-1">
                    Task ID: {lastCrawlResult.task_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

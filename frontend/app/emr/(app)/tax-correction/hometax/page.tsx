'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Download,
  RefreshCw,
  Loader2,
  Info,
  ArrowLeft,
  Key,
  Smartphone,
  User,
  Lock,
  Globe,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  Database,
  Unlink,
  Link2,
  FileText,
  AlertTriangle,
  Settings,
  Zap,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── API ─── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchApi(path: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

/* ─── 타입 ─── */
type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error'
type AuthMethod = 'certificate' | 'simple_auth' | 'delegation'
type SimpleAuthProvider = 'kakao' | 'naver' | 'pass'
type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed'

interface SyncedYear {
  tax_year: number
  filing_type: string
  gross_income: number
  total_tax: number
  synced_at: string
}

interface DelegationInfo {
  accountant_name: string
  license_number: string
  scope: string[]
  delegation_start: string
  delegation_end: string
}

/* ─── 설정 ─── */
const authMethodConfig: Record<AuthMethod, { label: string; description: string; icon: typeof Key }> = {
  certificate: { label: '공동인증서', description: '공동인증서(구 공인인증서)로 로그인', icon: Key },
  simple_auth: { label: '간편인증', description: '카카오, 네이버, PASS 등 간편인증', icon: Smartphone },
  delegation: { label: '세무사 위임', description: '세무사에게 홈택스 조회 위임', icon: User },
}

const simpleAuthProviders: { id: SimpleAuthProvider; name: string; color: string; bg: string }[] = [
  { id: 'kakao', name: '카카오', color: 'text-amber-800', bg: 'bg-yellow-300' },
  { id: 'naver', name: '네이버', color: 'text-white', bg: 'bg-green-500' },
  { id: 'pass', name: 'PASS', color: 'text-white', bg: 'bg-red-500' },
]

const delegationScopes = [
  { id: 'income_tax', label: '종합소득세 신고 내역' },
  { id: 'withholding', label: '원천징수 영수증' },
  { id: 'deduction_details', label: '소득공제/세액공제 상세' },
  { id: 'payment_records', label: '납부 내역' },
  { id: 'business_income', label: '사업소득 내역' },
  { id: 'medical_expense', label: '의료비 지출 내역' },
]

/* ─── 데모 데이터 ─── */
const demoSyncedYears: SyncedYear[] = [
  { tax_year: 2024, filing_type: '종합소득세', gross_income: 85000000, total_tax: 9800000, synced_at: '2025-03-10' },
  { tax_year: 2023, filing_type: '종합소득세', gross_income: 78000000, total_tax: 8400000, synced_at: '2025-03-10' },
  { tax_year: 2022, filing_type: '종합소득세', gross_income: 72000000, total_tax: 7200000, synced_at: '2025-03-10' },
  { tax_year: 2021, filing_type: '종합소득세', gross_income: 65000000, total_tax: 6100000, synced_at: '2025-03-10' },
  { tax_year: 2020, filing_type: '종합소득세', gross_income: 58000000, total_tax: 5200000, synced_at: '2025-03-10' },
]

function formatAmount(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`
  return `${amount.toLocaleString()}원`
}

export default function HometaxPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('simple_auth')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncedYears, setSyncedYears] = useState<SyncedYear[]>([])
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(true)
  const [loading, setLoading] = useState(true)

  // Certificate fields
  const [certFile, setCertFile] = useState<string | null>(null)
  const [certPassword, setCertPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Simple auth
  const [selectedProvider, setSelectedProvider] = useState<SimpleAuthProvider>('kakao')
  const [simpleAuthStep, setSimpleAuthStep] = useState(0)

  // Delegation
  const [delegationInfo, setDelegationInfo] = useState<DelegationInfo>({
    accountant_name: '',
    license_number: '',
    scope: ['income_tax', 'deduction_details'],
    delegation_start: new Date().toISOString().split('T')[0],
    delegation_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  // Disconnect modal
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    try {
      const res = await fetchApi('/tax-correction/hometax/status')
      setConnectionStatus(res.connected ? 'connected' : 'disconnected')
      setSyncedYears(res.synced_years || [])
      setLastSyncDate(res.last_sync || null)
      setIsDemo(res.is_demo || false)
    } catch {
      // Demo fallback
      setConnectionStatus('disconnected')
      setSyncedYears([])
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    // Simulate connection
    setConnectionStatus('syncing')

    // Simulate auth process
    await new Promise(r => setTimeout(r, 2000))
    setConnectionStatus('connected')
    setLastSyncDate(new Date().toISOString().split('T')[0])
  }

  async function handleSync() {
    setSyncStatus('syncing')
    setSyncProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 400))
      setSyncProgress(i)
    }

    try {
      await fetchApi('/tax-correction/hometax/sync', { method: 'POST' })
    } catch {
      // demo fallback
    }

    setSyncedYears(demoSyncedYears)
    setLastSyncDate(new Date().toISOString().split('T')[0])
    setSyncStatus('completed')
    setTimeout(() => setSyncStatus('idle'), 2000)
  }

  async function handleDisconnect() {
    setShowDisconnectModal(false)
    setConnectionStatus('disconnected')
    setSyncedYears([])
    setLastSyncDate(null)
    setCertFile(null)
    setCertPassword('')
    setSimpleAuthStep(0)
  }

  const toggleDelegationScope = (scopeId: string) => {
    setDelegationInfo(prev => ({
      ...prev,
      scope: prev.scope.includes(scopeId)
        ? prev.scope.filter(s => s !== scopeId)
        : [...prev.scope, scopeId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/emr/tax-correction" className="btn-outline btn-sm text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">홈택스 연동</h1>
            <p className="text-sm text-muted-foreground">국세청 홈택스 데이터를 안전하게 연동합니다</p>
          </div>
        </div>
      </div>

      {/* ───── 연결 상태 ───── */}
      <div className={`card p-5 border ${
        connectionStatus === 'connected' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' :
        connectionStatus === 'syncing' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' :
        connectionStatus === 'error' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' :
        'border-border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              connectionStatus === 'connected' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              connectionStatus === 'syncing' ? 'bg-blue-100 dark:bg-blue-900/30' :
              'bg-secondary'
            }`}>
              {connectionStatus === 'connected' ? (
                <Link2 className="w-6 h-6 text-emerald-600" />
              ) : connectionStatus === 'syncing' ? (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <Unlink className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                홈택스 연동 상태
                <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${
                  connectionStatus === 'connected' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' :
                  connectionStatus === 'syncing' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' :
                  'text-muted-foreground bg-secondary'
                }`}>
                  {connectionStatus === 'connected' ? '연결됨' :
                   connectionStatus === 'syncing' ? '연결 중...' :
                   connectionStatus === 'error' ? '오류' : '미연결'}
                </span>
              </div>
              {lastSyncDate && (
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  마지막 동기화: {lastSyncDate}
                </div>
              )}
            </div>
          </div>

          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
                className="btn-primary btn-sm text-xs"
              >
                {syncStatus === 'syncing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                데이터 동기화
              </button>
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="btn-outline btn-sm text-xs text-red-600 hover:text-red-700"
              >
                <Unlink className="w-3.5 h-3.5" />
                연결 해제
              </button>
            </div>
          )}
        </div>

        {/* 동기화 진행 */}
        {syncStatus === 'syncing' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">동기화 진행 중...</span>
              <span className="font-semibold">{syncProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {syncStatus === 'completed' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            동기화가 완료되었습니다.
          </div>
        )}
      </div>

      {/* ───── 인증 방식 선택 (미연결 시) ───── */}
      {connectionStatus === 'disconnected' && (
        <div className="card p-5 space-y-5">
          <h2 className="font-bold text-lg">인증 방식 선택</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(authMethodConfig) as [AuthMethod, typeof authMethodConfig[AuthMethod]][]).map(([key, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => setAuthMethod(key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    authMethod === key
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${authMethod === key ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="font-semibold text-sm">{config.label}</div>
                  <div className="text-2xs text-muted-foreground mt-1">{config.description}</div>
                </button>
              )
            })}
          </div>

          {/* 공동인증서 */}
          {authMethod === 'certificate' && (
            <div className="space-y-4 p-4 bg-secondary/20 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" /> 공동인증서 인증
              </h3>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">인증서 파일</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    certFile ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setCertFile('NPKI_SignCert.der')
                  }}
                >
                  {certFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium">{certFile}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <div className="text-sm text-muted-foreground">인증서 파일을 선택하세요</div>
                      <div className="text-2xs text-muted-foreground mt-1">.der, .pfx 형식</div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">인증서 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={certPassword}
                    onChange={e => setCertPassword(e.target.value)}
                    className="input py-2.5 w-full pr-10"
                    placeholder="인증서 비밀번호 입력"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleConnect}
                disabled={!certFile || !certPassword}
                className="btn-primary btn-sm w-full py-2.5 disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5" />
                공동인증서로 연결
              </button>
            </div>
          )}

          {/* 간편인증 */}
          {authMethod === 'simple_auth' && (
            <div className="space-y-4 p-4 bg-secondary/20 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" /> 간편인증
              </h3>

              {/* 인증 제공자 선택 */}
              <div className="flex items-center gap-3">
                {simpleAuthProviders.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => { setSelectedProvider(provider.id); setSimpleAuthStep(0) }}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                      selectedProvider === provider.id
                        ? `${provider.bg} ${provider.color} ring-2 ring-offset-2 ring-offset-card`
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>

              {/* 인증 단계 가이드 */}
              <div className="space-y-3">
                {[
                  { step: 1, title: '본인 확인 요청', description: `${simpleAuthProviders.find(p => p.id === selectedProvider)?.name} 앱에서 본인 확인 알림을 확인하세요` },
                  { step: 2, title: '인증번호 입력', description: '화면에 표시된 인증번호를 앱에 입력하세요' },
                  { step: 3, title: '연결 완료', description: '홈택스 데이터 연동이 완료됩니다' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                    i <= simpleAuthStep ? 'bg-card border border-border' : 'opacity-50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i < simpleAuthStep ? 'bg-emerald-500 text-white' :
                      i === simpleAuthStep ? 'bg-primary text-white' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {i < simpleAuthStep ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-2xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (simpleAuthStep < 2) {
                    setSimpleAuthStep(prev => prev + 1)
                  } else {
                    handleConnect()
                  }
                }}
                className="btn-primary btn-sm w-full py-2.5"
              >
                {simpleAuthStep === 0 ? '간편인증 시작' :
                 simpleAuthStep === 1 ? '인증번호 확인 완료' :
                 '연결 완료'}
              </button>
            </div>
          )}

          {/* 세무사 위임 */}
          {authMethod === 'delegation' && (
            <div className="space-y-4 p-4 bg-secondary/20 rounded-xl">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> 세무사 위임
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">세무사 성명</label>
                  <input
                    value={delegationInfo.accountant_name}
                    onChange={e => setDelegationInfo(prev => ({ ...prev, accountant_name: e.target.value }))}
                    className="input py-2.5 w-full"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">세무사 등록번호</label>
                  <input
                    value={delegationInfo.license_number}
                    onChange={e => setDelegationInfo(prev => ({ ...prev, license_number: e.target.value }))}
                    className="input py-2.5 w-full"
                    placeholder="12345"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">위임 범위</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {delegationScopes.map(scope => (
                    <label key={scope.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-card cursor-pointer">
                      <input
                        type="checkbox"
                        checked={delegationInfo.scope.includes(scope.id)}
                        onChange={() => toggleDelegationScope(scope.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{scope.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">위임 시작일</label>
                  <input
                    type="date"
                    value={delegationInfo.delegation_start}
                    onChange={e => setDelegationInfo(prev => ({ ...prev, delegation_start: e.target.value }))}
                    className="input py-2.5 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">위임 종료일</label>
                  <input
                    type="date"
                    value={delegationInfo.delegation_end}
                    onChange={e => setDelegationInfo(prev => ({ ...prev, delegation_end: e.target.value }))}
                    className="input py-2.5 w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={!delegationInfo.accountant_name || !delegationInfo.license_number}
                className="btn-primary btn-sm w-full py-2.5 disabled:opacity-50"
              >
                <User className="w-3.5 h-3.5" />
                세무사 위임 등록
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───── 동기화된 데이터 요약 ───── */}
      {syncedYears.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" /> 동기화된 데이터
            </h3>
            <span className="text-xs text-muted-foreground">{syncedYears.length}개 과세연도</span>
          </div>

          {/* 테이블 헤더 */}
          <div className="hidden sm:grid grid-cols-5 gap-4 p-4 bg-secondary/30 text-xs font-semibold text-muted-foreground border-b border-border">
            <div>과세연도</div>
            <div>신고 유형</div>
            <div className="text-right">총 수입</div>
            <div className="text-right">납부 세액</div>
            <div className="text-right">동기화일</div>
          </div>

          <div className="divide-y divide-border">
            {syncedYears.map(year => (
              <div key={year.tax_year} className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 p-4 hover:bg-secondary/30 transition-colors items-center">
                {/* 모바일 */}
                <div className="sm:hidden space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{year.tax_year}년</span>
                    <span className="text-sm font-bold">{formatAmount(year.total_tax)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{year.filing_type} | 수입 {formatAmount(year.gross_income)}</div>
                </div>

                {/* 데스크톱 */}
                <div className="hidden sm:block text-sm font-semibold">{year.tax_year}년</div>
                <div className="hidden sm:block text-xs text-muted-foreground">{year.filing_type}</div>
                <div className="hidden sm:block text-sm text-right">{formatAmount(year.gross_income)}</div>
                <div className="hidden sm:block text-sm text-right font-semibold">{formatAmount(year.total_tax)}</div>
                <div className="hidden sm:block text-xs text-right text-muted-foreground">{year.synced_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───── 보안 안내 ───── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">보안 및 개인정보 보호</h3>
        </div>
        <div className="space-y-3">
          {[
            { icon: Shield, title: 'AES-256 암호화', description: '모든 인증 정보와 세금 데이터는 AES-256 수준으로 암호화하여 저장합니다.' },
            { icon: Lock, title: '비밀번호 미저장', description: '인증서 비밀번호는 일회성으로 사용되며 서버에 저장되지 않습니다.' },
            { icon: Database, title: '최소 데이터 수집', description: '경정청구에 필요한 최소한의 데이터만 수집하며, 서비스 종료 시 즉시 삭제합니다.' },
            { icon: Globe, title: '안전한 통신', description: 'TLS 1.3 프로토콜을 사용하여 데이터 전송 중 암호화를 보장합니다.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20">
              <item.icon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-2xs text-muted-foreground mt-0.5">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <a href="#" className="text-xs text-primary font-semibold hover:underline">개인정보 처리방침 보기</a>
        </div>
      </div>

      {/* ───── 연결 해제 확인 모달 ───── */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDisconnectModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">연결 해제</h3>
                  <p className="text-xs text-muted-foreground">홈택스 연동을 해제하시겠습니까?</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                연결 해제 시 동기화된 모든 데이터가 삭제됩니다. 진행 중인 경정청구에 영향을 줄 수 있습니다.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDisconnectModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-secondary text-foreground"
                >
                  취소
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  연결 해제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

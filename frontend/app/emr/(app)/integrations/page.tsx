'use client'

import { useState } from 'react'
import {
  Plug,
  Zap,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  ChevronRight,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Globe,
  Building2,
  FileText,
  Pill,
  Stethoscope,
  Truck,
  MessageSquare,
  Bell,
  Database,
  Activity,
  Link,
  ArrowRight,
  Sparkles,
  X,
  Check,
  Webhook,
  Code2,
  Lock,
  Smartphone,
} from 'lucide-react'

/* ─── 타입 ─── */
type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending'

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: React.ElementType
  color: string
  status: IntegrationStatus
  lastSync?: string
  details?: string
}

/* ─── 더미 데이터 ─── */
const integrations: Integration[] = [
  {
    id: 'hira',
    name: '건강보험심사평가원 (HIRA)',
    description: '보험청구 전송, 심사결과 조회, 수가정보 자동 업데이트',
    category: '공공기관',
    icon: Building2,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    status: 'connected',
    lastSync: '5분 전',
    details: '일일 청구 건수: 342건 | 인증서: 2025.03.15 만료',
  },
  {
    id: 'nhis',
    name: '국민건강보험공단',
    description: '자격조회, 건강검진 결과 연동, 산정특례 확인',
    category: '공공기관',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    status: 'connected',
    lastSync: '30분 전',
    details: '자격조회 API v2.1 | 일 조회 한도: 5,000건',
  },
  {
    id: 'dur',
    name: '의약품안전사용서비스 (DUR)',
    description: '의약품 안전성 점검, 병용금기, 연령금기, 임부금기 자동 체크',
    category: '공공기관',
    icon: Pill,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
    status: 'connected',
    lastSync: '실시간',
    details: 'DUR API v3.0 | 점검 응답시간: 평균 0.3초',
  },
  {
    id: 'pharmacy_bridge',
    name: '약국 브릿지',
    description: '연동 약국으로 실시간 처방전 전송, 조제 상태 추적',
    category: '의원-약국',
    icon: Zap,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    status: 'connected',
    lastSync: '실시간',
    details: '연동 약국 3곳 | 오늘 전송: 47건',
  },
  {
    id: 'kakao',
    name: '카카오톡 알림',
    description: '예약확인, 방문알림, 복약안내 카카오 알림톡 자동 전송',
    category: '알림/메시지',
    icon: MessageSquare,
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30',
    status: 'connected',
    lastSync: '정상',
    details: '채널: @MediMatch | 이번 달 발송: 1,234건',
  },
  {
    id: 'naver',
    name: '네이버 예약',
    description: '네이버 플레이스 예약 연동, 리뷰 관리',
    category: '알림/메시지',
    icon: Globe,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30',
    status: 'pending',
    details: '연동 신청 중 - 영업일 2일 이내 처리',
  },
  {
    id: 'wholesaler_bj',
    name: '백제약품 도매 연동',
    description: '재고 자동 발주, 납품 현황 조회, 정산',
    category: '도매상',
    icon: Truck,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
    status: 'connected',
    lastSync: '10분 전',
    details: '계정: BJ-2024-001 | 이번 달 발주: 12건',
  },
  {
    id: 'wholesaler_gy',
    name: '지오영 도매 연동',
    description: '재고 자동 발주, 납품 현황 조회, 정산',
    category: '도매상',
    icon: Truck,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
    status: 'connected',
    lastSync: '1시간 전',
    details: '계정: GY-2024-045 | 이번 달 발주: 8건',
  },
  {
    id: 'hl7_fhir',
    name: 'HL7 FHIR 데이터 교환',
    description: '국제 의료정보 표준 기반 데이터 교환',
    category: 'API',
    icon: Database,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30',
    status: 'disconnected',
    details: 'FHIR R4 지원 | 연동 시 타 EMR 데이터 마이그레이션 가능',
  },
  {
    id: 'lab_system',
    name: '검사 장비 연동 (LIS)',
    description: '혈액검사, 소변검사 등 장비 결과 자동 수신',
    category: 'API',
    icon: Activity,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30',
    status: 'error',
    lastSync: '연결 오류',
    details: '마지막 정상 동기화: 2024-01-20 16:30 | 재연결 필요',
  },
]

const apiKeys = [
  { name: 'Production API Key', key: 'mk_prod_a1b2c3d4e5f6g7h8i9j0...', created: '2024-01-01', lastUsed: '방금', status: 'active' },
  { name: 'Development API Key', key: 'mk_dev_x1y2z3w4v5u6t7s8r9q0...', created: '2024-01-15', lastUsed: '3시간 전', status: 'active' },
  { name: 'Webhook Test Key', key: 'mk_test_m1n2o3p4q5r6s7t8u9v0...', created: '2024-01-10', lastUsed: '어제', status: 'inactive' },
]

const webhookEvents = [
  { event: 'prescription.created', description: '새 처방전 생성', enabled: true },
  { event: 'prescription.dispensed', description: '처방전 조제 완료', enabled: true },
  { event: 'claim.submitted', description: '보험 청구 제출', enabled: true },
  { event: 'claim.result', description: '심사 결과 수신', enabled: true },
  { event: 'patient.created', description: '신규 환자 등록', enabled: false },
  { event: 'appointment.booked', description: '예약 생성', enabled: false },
  { event: 'inventory.low', description: '재고 부족 알림', enabled: true },
]

const statusConfig: Record<IntegrationStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  connected: { label: '연동중', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: CheckCircle2 },
  disconnected: { label: '미연동', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: Link },
  error: { label: '오류', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: AlertTriangle },
  pending: { label: '처리중', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
}

const categories = ['전체', '공공기관', '의원-약국', '알림/메시지', '도매상', 'API']

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'webhooks'>('integrations')
  const [showKey, setShowKey] = useState<Set<number>>(new Set())
  const [webhooks, setWebhooks] = useState(webhookEvents)

  const filtered = activeCategory === '전체'
    ? integrations
    : integrations.filter(i => i.category === activeCategory)

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  const toggleShowKey = (idx: number) => {
    setShowKey(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const toggleWebhook = (event: string) => {
    setWebhooks(prev => prev.map(w => w.event === event ? { ...w, enabled: !w.enabled } : w))
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">연동/API 허브</h1>
          <p className="text-sm text-muted-foreground mt-1">외부 시스템 연동 및 API 관리</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">{connectedCount} 연동</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium">{errorCount} 오류</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'integrations', label: '연동 서비스', icon: Plug },
          { key: 'api', label: 'API 키 관리', icon: Key },
          { key: 'webhooks', label: '웹훅 설정', icon: Code2 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 연동 서비스 */}
      {activeTab === 'integrations' && (
        <>
          {/* 카테고리 필터 */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 오류 알림 배너 */}
          {errorCount > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-semibold text-red-600">{errorCount}개 서비스 연결 오류</span>
                <p className="text-xs text-red-500 mt-0.5">연동 오류가 발생했습니다. 확인 후 재연결해주세요.</p>
              </div>
              <button className="btn-sm text-xs bg-red-500 text-white hover:bg-red-600">
                <RefreshCw className="w-3 h-3" /> 재연결
              </button>
            </div>
          )}

          {/* 연동 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(integration => {
              const sc = statusConfig[integration.status]
              const StatusIcon = sc.icon

              return (
                <div key={integration.id} className={`card p-5 hover:shadow-md transition-shadow ${
                  integration.status === 'error' ? 'border-red-200 dark:border-red-800' : ''
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${integration.color}`}>
                      <integration.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{integration.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-bold ${sc.color} ${sc.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{integration.description}</p>
                      {integration.details && (
                        <p className="text-2xs text-muted-foreground mt-2 p-2 rounded-lg bg-secondary/50">{integration.details}</p>
                      )}
                      {integration.lastSync && (
                        <div className="flex items-center gap-1 mt-2 text-2xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          마지막 동기화: {integration.lastSync}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    {integration.status === 'connected' && (
                      <>
                        <button className="btn-sm text-2xs bg-secondary text-foreground flex-1">
                          <Settings className="w-3 h-3" /> 설정
                        </button>
                        <button className="btn-sm text-2xs bg-secondary text-foreground">
                          <RefreshCw className="w-3 h-3" /> 동기화
                        </button>
                      </>
                    )}
                    {integration.status === 'disconnected' && (
                      <button className="btn-sm text-2xs flex-1 bg-blue-600 text-white hover:bg-blue-700">
                        <Plug className="w-3 h-3" /> 연동하기
                      </button>
                    )}
                    {integration.status === 'error' && (
                      <>
                        <button className="btn-sm text-2xs bg-red-500 text-white hover:bg-red-600 flex-1">
                          <RefreshCw className="w-3 h-3" /> 재연결
                        </button>
                        <button className="btn-sm text-2xs bg-secondary text-foreground">
                          로그 보기
                        </button>
                      </>
                    )}
                    {integration.status === 'pending' && (
                      <button className="btn-sm text-2xs bg-secondary text-foreground flex-1" disabled>
                        <Clock className="w-3 h-3" /> 처리 대기중...
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* API 키 관리 */}
      {activeTab === 'api' && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">API 키</h3>
                <p className="text-xs text-muted-foreground mt-0.5">외부 시스템에서 MediMatch API에 접근하기 위한 인증 키입니다</p>
              </div>
              <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> 새 키 생성
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((ak, i) => (
                <div key={i} className="p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{ak.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                        ak.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}>
                        {ak.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleShowKey(i)} className="p-1.5 rounded-lg hover:bg-secondary">
                        {showKey.has(i) ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-secondary">
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs bg-secondary/50 px-3 py-2 rounded-lg text-muted-foreground">
                    {showKey.has(i) ? ak.key.replace('...', 'klmnopqrstuvwxyz') : ak.key}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-2xs text-muted-foreground">
                    <span>생성: {ak.created}</span>
                    <span>마지막 사용: {ak.lastUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">API 사용량</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xs text-muted-foreground">이번 달 요청</div>
                <div className="text-xl font-bold mt-1">12,847</div>
                <div className="text-2xs text-muted-foreground mt-0.5">한도: 50,000</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xs text-muted-foreground">평균 응답시간</div>
                <div className="text-xl font-bold mt-1">124<span className="text-xs font-normal">ms</span></div>
                <div className="text-2xs text-emerald-600 mt-0.5">정상</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xs text-muted-foreground">성공률</div>
                <div className="text-xl font-bold mt-1">99.8<span className="text-xs font-normal">%</span></div>
                <div className="text-2xs text-emerald-600 mt-0.5">양호</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">API 문서</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'REST API Reference', description: '전체 API 엔드포인트 및 사용 가이드', icon: FileText },
                { title: 'HL7 FHIR 가이드', description: '의료정보 표준 연동 가이드', icon: Database },
                { title: 'Webhook 연동 가이드', description: '이벤트 기반 알림 설정 방법', icon: Code2 },
                { title: 'SDK 다운로드', description: 'Python, JavaScript, Java SDK', icon: Code2 },
              ].map((doc, i) => (
                <button key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-blue-200 dark:hover:border-blue-800 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <doc.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{doc.title}</div>
                    <div className="text-2xs text-muted-foreground">{doc.description}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 웹훅 설정 */}
      {activeTab === 'webhooks' && (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">웹훅 엔드포인트</h3>
                <p className="text-xs text-muted-foreground mt-0.5">이벤트 발생 시 지정된 URL로 알림을 전송합니다</p>
              </div>
              <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-3.5 h-3.5" /> 엔드포인트 추가
              </button>
            </div>

            <div className="p-4 rounded-xl border border-border mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-sm">Production Webhook</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-2xs font-bold text-emerald-600 dark:bg-emerald-900/30">활성</span>
                </div>
                <button className="btn-sm text-2xs bg-secondary text-foreground">
                  <Settings className="w-3 h-3" /> 설정
                </button>
              </div>
              <div className="font-mono text-xs bg-secondary/50 px-3 py-2 rounded-lg text-muted-foreground">
                https://api.example.com/webhooks/medimatch
              </div>
              <div className="flex items-center gap-4 mt-2 text-2xs text-muted-foreground">
                <span>생성: 2024-01-01</span>
                <span>마지막 전송: 3분 전</span>
                <span className="text-emerald-600">성공률: 99.9%</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-4">이벤트 구독 설정</h3>
            <div className="space-y-1">
              {webhooks.map(wh => (
                <div key={wh.event} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{wh.event}</code>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-0.5">{wh.description}</div>
                  </div>
                  <button
                    onClick={() => toggleWebhook(wh.event)}
                    className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                      wh.enabled ? 'bg-blue-500' : 'bg-secondary'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${
                      wh.enabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3">최근 웹훅 로그</h3>
            <div className="space-y-2">
              {[
                { time: '14:05:23', event: 'prescription.created', status: 'success', responseTime: '120ms' },
                { time: '14:03:18', event: 'claim.submitted', status: 'success', responseTime: '85ms' },
                { time: '14:01:45', event: 'inventory.low', status: 'success', responseTime: '142ms' },
                { time: '13:58:30', event: 'prescription.dispensed', status: 'success', responseTime: '98ms' },
                { time: '13:55:12', event: 'appointment.booked', status: 'failed', responseTime: 'timeout' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 text-xs">
                  <span className="text-muted-foreground w-16">{log.time}</span>
                  <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-2xs">{log.event}</code>
                  <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  }`}>
                    {log.status === 'success' ? '200 OK' : '408 Timeout'}
                  </span>
                  <span className="text-muted-foreground ml-auto">{log.responseTime}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

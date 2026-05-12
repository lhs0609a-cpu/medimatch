'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Target,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Smartphone,
  X,
  Megaphone,
  UserPlus,
  Activity,
  Info,
  Loader2,
  Moon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import {
  patientRecallService,
  type RecallTarget,
  type RecallStats,
  type RecallCampaign,
  type AlimtalkStatus,
  type RecallUIStatus,
  type RecallTemplate,
  type BulkSendResult,
} from '@/lib/api/patientRecall'

const statusConfig: Record<RecallUIStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '발송 대기', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
  sent: { label: '발송완료', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  booked: { label: '예약완료', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  no_response: { label: '무응답', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

const priorityConfig = {
  high: { label: '높음', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  medium: { label: '보통', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  low: { label: '낮음', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
}

function isNightKST(): boolean {
  const kstHour = (new Date().getUTCHours() + 9) % 24
  return kstHour >= 21 || kstHour < 8
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<'recall' | 'campaigns'>('recall')
  const [filterStatus, setFilterStatus] = useState<RecallUIStatus | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showConfirmSend, setShowConfirmSend] = useState<{ ids: string[]; one?: boolean } | null>(null)

  const [stats, setStats] = useState<RecallStats | null>(null)
  const [targets, setTargets] = useState<RecallTarget[]>([])
  const [campaigns, setCampaigns] = useState<RecallCampaign[]>([])
  const [alimtalk, setAlimtalk] = useState<AlimtalkStatus | null>(null)
  const [templates, setTemplates] = useState<RecallTemplate[]>([])
  const [templateCode, setTemplateCode] = useState<string>('MEDI_RECALL_V1')
  const [enableSmsFallback, setEnableSmsFallback] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(100)
  const [totalTargets, setTotalTargets] = useState(0)

  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [campaignForm, setCampaignForm] = useState({ name: '', target_group: 'chronic' })
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err' | 'warn'; msg: string } | null>(null)
  const [lastBulkResult, setLastBulkResult] = useState<BulkSendResult | null>(null)

  const night = isNightKST()
  const sendDisabled = isDemo || !alimtalk?.configured || night

  const showToast = useCallback((kind: 'ok' | 'err' | 'warn', msg: string, duration = 4000) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), duration)
  }, [])

  const reload = useCallback(async (resetPage = false) => {
    setLoading(true)
    try {
      const currentPage = resetPage ? 1 : page
      if (resetPage) setPage(1)
      const [s, t, c, a, tpls] = await Promise.all([
        patientRecallService.stats(),
        patientRecallService.targets({ page: currentPage, size: pageSize }),
        patientRecallService.campaigns(),
        patientRecallService.alimtalkStatus(),
        patientRecallService.templates(),
      ])
      setStats(s)
      setTargets(t.items)
      setTotalTargets(t.total)
      setCampaigns(c.items)
      setAlimtalk(a)
      setTemplates(tpls.items)
      setIsDemo(s.is_demo || t.is_demo || c.is_demo)
    } catch (e: any) {
      const detail = e?.response?.data?.detail || ''
      showToast('err', detail || '데이터 로드 실패 — 로그인 상태와 EMR 구독을 확인하세요.', 8000)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, showToast])

  useEffect(() => { reload() }, [reload])

  const filteredTargets = useMemo(() => {
    if (filterStatus === 'all') return targets
    return targets.filter(t => t.status === filterStatus)
  }, [targets, filterStatus])

  const totalPages = Math.max(1, Math.ceil(totalTargets / pageSize))

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const performSend = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    if (night) {
      showToast('warn', '야간(21:00~08:00)에는 발송이 차단됩니다.', 6000)
      return
    }
    if (alimtalk && !alimtalk.configured) {
      showToast('warn', '알림톡이 비활성화되어 있어요. 운영자에게 설정을 요청하세요.', 6000)
      return
    }
    if (isDemo) {
      showToast('warn', '데모 데이터는 실제 발송할 수 없습니다. 환자를 먼저 등록하세요.', 6000)
      return
    }
    setSendingBulk(true)
    try {
      const res = await patientRecallService.sendBulk({
        target_ids: ids,
        template_code: templateCode,
        enable_sms_fallback: enableSmsFallback,
      })
      setLastBulkResult(res)
      if (!res.ok) {
        const map: Record<string, string> = {
          alimtalk_not_configured: '알림톡 미설정으로 발송 보류',
          demo_targets_cannot_send: '데모 데이터는 발송할 수 없습니다',
          no_eligible_targets: '발송 가능한 대상이 없습니다 (동의/중복/한도 확인)',
        }
        showToast('warn', map[res.reason || ''] || '발송이 보류되었습니다', 8000)
      } else if (res.results) {
        const { sent, failed, skipped } = res.results
        const kind = failed > 0 || skipped > 0 ? 'warn' : 'ok'
        showToast(
          kind,
          `발송 ${sent}건 · 실패 ${failed}건 · 건너뜀 ${skipped}건${skipped > 0 ? ' (동의거부/중복/한도)' : ''}`,
          failed > 0 || skipped > 0 ? 8000 : 4000,
        )
        setSelectedIds(new Set())
        await reload()
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      const map: Record<string, string> = {
        night_send_forbidden: '야간(21:00~08:00) 발송이 차단됐어요.',
        consent_refused: '수신 거부한 환자입니다.',
        duplicate_within_60s: '같은 환자에게 1분 내 중복 발송 차단됐어요.',
        daily_limit: '오늘 환자당 발송 한도(1회)에 도달했어요.',
      }
      showToast('err', map[detail] || e?.response?.data?.detail || '발송 실패', 8000)
    } finally {
      setSendingBulk(false)
      setShowConfirmSend(null)
    }
  }, [alimtalk, enableSmsFallback, isDemo, night, reload, showToast, templateCode])

  const requestSend = (ids: string[], one = false) => {
    if (sendDisabled) {
      if (night) showToast('warn', '야간(21:00~08:00) 발송 차단')
      else if (isDemo) showToast('warn', '데모 데이터는 발송 불가')
      else showToast('warn', '알림톡 미설정')
      return
    }
    setShowConfirmSend({ ids, one })
  }

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) return
    setCreatingCampaign(true)
    try {
      await patientRecallService.createCampaign({
        name: campaignForm.name,
        target_group: campaignForm.target_group,
        channel: 'KAKAO',
        template_code: templateCode,
      })
      setShowCampaignModal(false)
      setCampaignForm({ name: '', target_group: 'chronic' })
      showToast('ok', '캠페인이 생성되었습니다.')
      await reload()
    } catch (e: any) {
      showToast('err', e?.response?.data?.detail || '캠페인 생성 실패', 8000)
    } finally {
      setCreatingCampaign(false)
    }
  }

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (showCampaignModal) setShowCampaignModal(false)
      if (showConfirmSend) setShowConfirmSend(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCampaignModal, showConfirmSend])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        환자 리콜 데이터 불러오는 중…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">환자 리콜/CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">정기검진 리콜, 알림 캠페인, 재방문 관리</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="tpl-select" className="text-muted-foreground">템플릿</label>
            <select
              id="tpl-select"
              className="input py-1 px-2 text-xs"
              value={templateCode}
              onChange={e => setTemplateCode(e.target.value)}
            >
              {templates.length === 0 && <option value="MEDI_RECALL_V1">기본 템플릿</option>}
              {templates.map(t => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-sm text-xs bg-secondary text-foreground" onClick={() => reload()} aria-label="새로고침">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> 새로고침
          </button>
          <button
            className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowCampaignModal(true)}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> 캠페인 생성
          </button>
        </div>
      </div>

      {/* 야간 발송 차단 배너 */}
      {night && (
        <div className="card p-3 flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/40" role="status">
          <Moon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-indigo-700 dark:text-indigo-300">
            <strong>야간 시간대 (21:00~08:00)</strong> · 정통망법 준수를 위해 알림톡 발송이 차단됩니다.
            08시 이후 다시 시도하세요.
          </div>
        </div>
      )}

      {/* 데모 배너 + 가이드 */}
      {isDemo && (
        <div className="card p-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40" role="status">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p><strong>데모 데이터</strong>입니다. 발송 버튼이 비활성화되어 있어요.</p>
            <ol className="list-decimal pl-5 space-y-0.5">
              <li><a className="underline" href="/emr/patients">환자 관리</a>에서 환자를 등록하세요</li>
              <li>마지막 방문일을 기록하세요 (60~90일 지나면 자동 대상화)</li>
              <li>수신 동의(<code>consent_alimtalk</code>) 받은 환자만 발송됩니다</li>
            </ol>
          </div>
        </div>
      )}

      {/* 알림톡 미설정 배너 — 의사 친화적 */}
      {alimtalk && !alimtalk.configured && (
        <div className="card p-3 flex items-start gap-2 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40" role="alert">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-red-700 dark:text-red-300">
            <strong>알림톡 발송이 비활성화</strong>되어 있어요.
            발송하려면 운영팀에 설정을 요청하세요 (<a className="underline" href="mailto:support@mediplatform.kr">support@mediplatform.kr</a>).
            <div className="text-2xs opacity-70 mt-1">사유: {alimtalk.missing.join(', ') || '미설정'}</div>
          </div>
        </div>
      )}

      {/* 요약 카드 */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="리콜 대상" value={`${stats.totalTarget}명`} sub={`발송 ${stats.sent}명`} icon={Target} accent="blue" />
          <StatCard label="응답률" value={`${stats.responseRate}%`} sub="실시간 집계" icon={Activity} accent="emerald" arrow />
          <StatCard label="예약 전환율" value={`${stats.bookingRate}%`} sub={`${stats.booked}명 예약 완료`} icon={UserPlus} accent="blue" />
          <StatCard label="활성 캠페인" value={String(campaigns.filter(c => c.status === 'active').length)} sub="진행중" icon={Megaphone} accent="amber" />
        </div>
      )}

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist">
        {[
          { key: 'recall', label: '리콜 대상', icon: Bell },
          { key: 'campaigns', label: '캠페인 관리', icon: Megaphone },
        ].map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리콜 대상 목록 */}
      {activeTab === 'recall' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border">
            <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="상태 필터">
              {(['all', 'pending', 'sent', 'no_response', 'booked'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  aria-pressed={filterStatus === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatus === s ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {s === 'all' ? '전체' : statusConfig[s]?.label}
                </button>
              ))}
            </div>
            {selectedIds.size > 0 && (
              <div className="sm:ml-auto flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">{selectedIds.size}명 선택</span>
                <label className="flex items-center gap-1 text-2xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableSmsFallback}
                    onChange={e => setEnableSmsFallback(e.target.checked)}
                    className="rounded"
                    aria-label="SMS 폴백 활성화"
                  />
                  SMS 대체(유료)
                </label>
                <button
                  className="btn-sm text-2xs bg-blue-600 text-white disabled:opacity-50"
                  onClick={() => requestSend(Array.from(selectedIds))}
                  disabled={sendingBulk || sendDisabled}
                  aria-label="선택한 환자에게 일괄 발송"
                >
                  {sendingBulk ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Send className="w-3 h-3" aria-hidden="true" />}
                  일괄 발송
                </button>
                <button
                  className="btn-sm text-2xs bg-secondary text-foreground"
                  onClick={() => setSelectedIds(new Set())}
                >
                  해제
                </button>
              </div>
            )}
          </div>

          <ul className="divide-y divide-border" aria-label="리콜 대상 목록">
            {filteredTargets.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">
                해당 상태의 리콜 대상이 없습니다.
              </li>
            )}
            {filteredTargets.map(target => {
              const sc = statusConfig[target.status]
              const pc = priorityConfig[target.priority]
              const checked = selectedIds.has(target.id)
              return (
                <li
                  key={target.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-secondary/30 transition-colors ${
                    target.priority === 'high' && target.status === 'pending'
                      ? 'bg-red-50/30 dark:bg-red-900/5'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <label className="flex-shrink-0 cursor-pointer" aria-label={`${target.name} 선택`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(target.id)}
                        className="rounded"
                      />
                    </label>

                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <span className="text-sm font-bold text-blue-600">{target.name[0] || '?'}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate max-w-[140px]">{target.name}</span>
                        {target.age != null && (
                          <span className="text-2xs text-muted-foreground">{target.gender}/{target.age}세</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${pc.color} ${pc.bg}`}>{pc.label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${sc.color} ${sc.bg}`}>{sc.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {target.reason} · 마지막 방문: {target.lastVisit || '기록 없음'} ({target.daysAgo}일 전)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {target.status === 'pending' && (
                      <button
                        className="btn-sm text-2xs bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => requestSend([target.id], true)}
                        disabled={sendDisabled || sendingBulk}
                        aria-label={`${target.name}에게 발송`}
                      >
                        <Send className="w-3 h-3" aria-hidden="true" /> 발송
                      </button>
                    )}
                    {target.status === 'no_response' && (
                      <button
                        className="btn-sm text-2xs bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                        onClick={() => requestSend([target.id], true)}
                        disabled={sendDisabled || sendingBulk}
                        aria-label={`${target.name}에게 재발송`}
                      >
                        <RefreshCw className="w-3 h-3" aria-hidden="true" /> 재발송
                      </button>
                    )}
                    {target.status === 'sent' && target.phone && (
                      <a
                        className="btn-sm text-2xs bg-secondary text-foreground"
                        href={`tel:${target.phone.replace(/[^0-9]/g, '')}`}
                        aria-label={`${target.name}에게 전화`}
                      >
                        <Phone className="w-3 h-3" aria-hidden="true" /> 전화
                      </a>
                    )}
                    {target.status === 'booked' && (
                      <span className="flex items-center gap-1 text-2xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> 예약됨
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* 페이지네이션 */}
          {!isDemo && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border text-xs">
              <span className="text-muted-foreground">
                총 {totalTargets}명 · {page}/{totalPages} 페이지
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn-sm text-2xs bg-secondary disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  aria-label="이전 페이지"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  className="btn-sm text-2xs bg-secondary disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  aria-label="다음 페이지"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 캠페인 관리 */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 && (
            <div className="card p-8 text-center text-sm text-muted-foreground">
              아직 캠페인이 없습니다. 위 "캠페인 생성" 버튼으로 시작하세요.
            </div>
          )}
          {campaigns.map(campaign => (
            <article key={campaign.id} className="card p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    campaign.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    campaign.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    <Megaphone className={`w-5 h-5 ${
                      campaign.status === 'active' ? 'text-blue-600' :
                      campaign.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${
                        campaign.status === 'active' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                        campaign.status === 'completed' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                        'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                      }`}>
                        {campaign.status === 'active' ? '진행중' : campaign.status === 'completed' ? '완료' : campaign.status === 'scheduled' ? '예약됨' : '준비중'}
                      </span>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-0.5">{campaign.date || '-'} · 대상 {campaign.target}명</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <Tile label="발송" value={campaign.sent} />
                <Tile label="열람" value={campaign.opened} />
                <Tile label="예약" value={campaign.booked} accent="blue" />
                <Tile label="전환율" value={`${campaign.sent > 0 ? ((campaign.booked / campaign.sent) * 100).toFixed(0) : 0}%`} accent="emerald" />
              </div>

              {campaign.target > 0 && campaign.sent > 0 && (
                <div className="mt-3">
                  <div className="flex h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round((campaign.sent / campaign.target) * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-blue-500" style={{ width: `${Math.min(100, (campaign.sent / campaign.target) * 100)}%` }} />
                    <div className="bg-secondary" style={{ width: `${Math.max(0, ((campaign.target - campaign.sent) / campaign.target) * 100)}%` }} />
                  </div>
                  <div className="text-2xs text-muted-foreground mt-1">
                    발송 진행률: {((campaign.sent / campaign.target) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* 캠페인 생성 모달 */}
      {showCampaignModal && (
        <Modal title="새 캠페인 만들기" onClose={() => setShowCampaignModal(false)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="camp-name" className="text-xs font-medium text-muted-foreground">캠페인명</label>
              <input
                id="camp-name"
                type="text"
                className="input mt-1"
                placeholder="예: 만성질환 정기검진 안내"
                value={campaignForm.name}
                onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="camp-group" className="text-xs font-medium text-muted-foreground">대상 그룹</label>
              <select
                id="camp-group"
                className="input mt-1"
                value={campaignForm.target_group}
                onChange={e => setCampaignForm(f => ({ ...f, target_group: e.target.value }))}
              >
                <option value="chronic">만성질환 환자 (당뇨/고혈압/고지혈증)</option>
                <option value="inactive_90">3개월 이상 미방문 환자</option>
                <option value="checkup">정기검진 대상자</option>
                <option value="all">전체 환자</option>
              </select>
            </div>
            <div>
              <label htmlFor="camp-tpl" className="text-xs font-medium text-muted-foreground">템플릿 (사전 승인된 것만)</label>
              <select
                id="camp-tpl"
                className="input mt-1"
                value={templateCode}
                onChange={e => setTemplateCode(e.target.value)}
              >
                {templates.map(t => (
                  <option key={t.code} value={t.code}>{t.label}</option>
                ))}
              </select>
              <p className="text-2xs text-muted-foreground mt-1 italic">
                미리보기: {templates.find(t => t.code === templateCode)?.preview || '—'}
              </p>
            </div>
            <button
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={handleCreateCampaign}
              disabled={creatingCampaign || !campaignForm.name.trim()}
            >
              {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              캠페인 생성
            </button>
          </div>
        </Modal>
      )}

      {/* 발송 확인 모달 */}
      {showConfirmSend && (
        <Modal title="알림톡 발송 확인" onClose={() => setShowConfirmSend(null)}>
          <div className="space-y-3 text-sm">
            <p>
              <strong>{showConfirmSend.ids.length}명</strong>에게 알림톡을 발송할까요?
            </p>
            <div className="bg-secondary/50 p-3 rounded-xl text-xs space-y-1">
              <div>· 템플릿: <strong>{templates.find(t => t.code === templateCode)?.label || templateCode}</strong></div>
              <div>· SMS 대체: {enableSmsFallback ? '활성 (건당 ~35원)' : '비활성'}</div>
              <div className="text-muted-foreground italic">
                수신 거부, 1분 내 중복, 일일 한도(1회) 환자는 자동 제외됩니다.
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm bg-secondary text-foreground"
                onClick={() => setShowConfirmSend(null)}
              >
                취소
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={() => performSend(showConfirmSend.ids)}
                disabled={sendingBulk}
              >
                {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                발송
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 마지막 발송 결과 — 상세 모달 트리거 */}
      {lastBulkResult?.results && (lastBulkResult.results.failed > 0 || lastBulkResult.results.skipped > 0) && (
        <div className="card p-3 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>
              최근 발송: 성공 {lastBulkResult.results.sent} · 실패 {lastBulkResult.results.failed} · 건너뜀 {lastBulkResult.results.skipped}.
              실패 건은 RecallSend 테이블에서 status=FAILED로 추적 가능합니다.
            </span>
            <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setLastBulkResult(null)} aria-label="닫기">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.kind === 'ok' ? 'bg-emerald-600 text-white' :
            toast.kind === 'warn' ? 'bg-amber-500 text-white' :
            'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// 작은 컴포넌트
// ──────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent, arrow }: {
  label: string; value: string; sub: string; icon: any; accent: 'blue' | 'emerald' | 'amber'; arrow?: boolean
}) {
  const bg = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  }[accent]
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
      <div className={`text-2xl font-bold ${accent === 'emerald' ? 'text-emerald-600' : ''}`}>{value}</div>
      <div className="flex items-center gap-1 mt-1">
        {arrow && <ArrowUpRight className="w-3 h-3 text-emerald-500" aria-hidden="true" />}
        <span className="text-2xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  )
}

function Tile({ label, value, accent }: { label: string; value: string | number; accent?: 'blue' | 'emerald' }) {
  return (
    <div className="p-3 rounded-xl bg-secondary/50 text-center">
      <div className="text-2xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${accent === 'blue' ? 'text-blue-600' : accent === 'emerald' ? 'text-emerald-600' : ''}`}>{value}</div>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // 첫 진입 포커스
    ref.current?.focus()
  }, [])
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="btn-icon" aria-label="닫기">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 pb-8">{children}</div>
      </div>
    </div>
  )
}

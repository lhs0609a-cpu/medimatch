'use client'

import { useState } from 'react'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  BookOpen,
  Video,
  FileText,
  Sparkles,
  ExternalLink,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Smartphone,
  Rocket,
  Shield,
  Zap,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Pill,
  Star,
  X,
  Plus,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const faqCategories = [
  {
    category: '시작하기',
    icon: Rocket,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    items: [
      { q: '처음 가입 후 뭘 해야 하나요?', a: '가입 후 온보딩 위자드가 자동으로 진행됩니다. 진료과목, 운영시간, 기능 설정을 완료하면 바로 사용 가능합니다. 기존 EMR 데이터 마이그레이션이 필요한 경우 고객지원팀에 문의하세요.' },
      { q: '기존 EMR에서 데이터를 옮길 수 있나요?', a: 'HL7 FHIR, CSV, Excel 형식의 데이터를 가져올 수 있습니다. 설정 > 데이터 > 가져오기에서 진행하거나, 전담 컨설턴트를 통한 무료 마이그레이션을 신청할 수 있습니다.' },
      { q: '태블릿이나 스마트폰에서도 사용할 수 있나요?', a: '네, MediMatch EMR은 반응형 웹 앱으로 모든 기기에서 사용 가능합니다. 별도 앱 설치 없이 브라우저에서 접속하시면 됩니다.' },
    ],
  },
  {
    category: 'AI 기능',
    icon: Sparkles,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
    items: [
      { q: 'AI 음성 차트는 어떻게 사용하나요?', a: 'AI 진료차트 메뉴에서 녹음 버튼을 클릭하면 됩니다. 진료 대화를 실시간 인식하여 SOAP 형식의 차트를 자동 작성합니다. 마이크 권한을 허용해주세요.' },
      { q: 'AI 청구 방어가 뭔가요?', a: '보험 청구 전 AI가 삭감 리스크를 자동 분석합니다. 고위험 청구건에 대해 수정 제안, 근거 자료 첨부, 이의신청서 자동 생성을 지원합니다.' },
      { q: 'AI 추천 진단이 틀리면 어떡하나요?', a: 'AI 추천은 참고 자료일 뿐, 최종 판단은 원장님이 하시면 됩니다. 추천을 수정하거나 무시해도 되며, 피드백을 통해 AI 정확도가 지속적으로 개선됩니다.' },
    ],
  },
  {
    category: '의원-약국 연동',
    icon: Zap,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    items: [
      { q: '약국 연동은 어떻게 하나요?', a: '설정 > 연동/API에서 인근 약국을 검색하고 연동 요청을 보낼 수 있습니다. 약국에서 수락하면 실시간 처방전 전송이 활성화됩니다.' },
      { q: '처방전이 약국에 안 가요', a: '연동 상태를 먼저 확인해주세요 (연동/API 허브). 연결 오류인 경우 재연결 버튼을 눌러주세요. 지속되면 고객지원에 문의하세요.' },
    ],
  },
  {
    category: '결제/구독',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    items: [
      { q: '무료 체험 기간이 끝나면 어떻게 되나요?', a: '90일 무료 체험 후 자동으로 과금되지 않습니다. 체험 종료 전 결제 수단을 등록하고 구독을 시작해야 계속 사용할 수 있습니다.' },
      { q: '구독을 중간에 해지할 수 있나요?', a: '언제든 해지할 수 있습니다. 해지 시 결제일까지 사용 가능하며, 데이터는 30일간 보관됩니다. 데이터 내보내기 기능을 통해 백업 가능합니다.' },
      { q: '플랜 업그레이드는 어떻게 하나요?', a: '설정 > 구독/결제에서 플랜을 변경할 수 있습니다. 업그레이드 시 차액만 결제되며, 즉시 적용됩니다.' },
    ],
  },
]

const guides = [
  { title: '빠른 시작 가이드', description: '5분 안에 EMR 기본 설정 완료하기', icon: Rocket, time: '5분' },
  { title: 'AI 음성 차트 튜토리얼', description: 'AI 차트 기능 A to Z', icon: Sparkles, time: '8분' },
  { title: '보험 청구 가이드', description: '청구 제출부터 심사 결과 확인까지', icon: Shield, time: '10분' },
  { title: '약국 연동 설정', description: '인근 약국과 실시간 처방 연동하기', icon: Zap, time: '3분' },
  { title: '직원 계정 관리', description: '직원 추가 및 권한 설정 방법', icon: Users, time: '5분' },
  { title: '경영분석 활용하기', description: '매출, 환자 데이터 분석 가이드', icon: BarChart3, time: '7분' },
]

const tickets = [
  { id: 'TK-2024-042', title: '처방전 전송 오류 문의', status: 'resolved' as const, date: '2024-01-20', response: '해결 완료' },
  { id: 'TK-2024-038', title: '인쇄 설정 변경 요청', status: 'in_progress' as const, date: '2024-01-18', response: '처리 중' },
  { id: 'TK-2024-035', title: '데이터 마이그레이션 문의', status: 'resolved' as const, date: '2024-01-15', response: '해결 완료' },
]

const updates = [
  { version: 'v2.4.1', date: '2024-01-20', title: 'AI 청구 방어 정확도 향상', changes: ['삭감 예측 정확도 92%로 개선', '이의신청서 자동 생성 기능 추가', '버그 수정 5건'] },
  { version: 'v2.4.0', date: '2024-01-15', title: '경영분석 대시보드 개편', changes: ['AI 경영 인사이트 추가', '시간대별 분석 차트', '수가표 자동 업데이트'] },
  { version: 'v2.3.5', date: '2024-01-10', title: '약국 연동 안정성 개선', changes: ['처방전 전송 속도 50% 향상', 'DUR 점검 응답시간 개선', '오프라인 대비 로컬 캐시'] },
]

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'tickets' | 'updates'>('faq')
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">도움말/고객지원</h1>
          <p className="text-sm text-muted-foreground mt-1">FAQ, 사용 가이드, 1:1 문의</p>
        </div>
        <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowContactModal(true)}>
          <MessageSquare className="w-3.5 h-3.5" /> 1:1 문의하기
        </button>
      </div>

      {/* 검색 */}
      <div className="card p-6 text-center">
        <h2 className="text-lg font-bold mb-1">무엇을 도와드릴까요?</h2>
        <p className="text-sm text-muted-foreground mb-4">궁금한 점을 검색하거나 아래 항목을 확인하세요</p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="AI 차트, 청구, 연동, 구독..."
            className="input pl-12 py-3.5 text-sm w-full rounded-2xl"
          />
        </div>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5" /> 1588-0000
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5" /> support@medimatch.kr
          </div>
          <span className="text-muted-foreground">·</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> 평일 09:00~18:00
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'faq', label: 'FAQ', icon: HelpCircle },
          { key: 'guides', label: '사용 가이드', icon: BookOpen },
          { key: 'tickets', label: '문의 내역', icon: MessageSquare },
          { key: 'updates', label: '업데이트', icon: Rocket },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {faqCategories.map((cat, ci) => {
            const filteredItems = searchQuery.trim()
              ? cat.items.filter(item => item.q.includes(searchQuery) || item.a.includes(searchQuery))
              : cat.items
            if (filteredItems.length === 0) return null
            return (
              <div key={ci} className="card">
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className={`w-8 h-8 rounded-xl ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm">{cat.category}</h3>
                </div>
                <div className="divide-y divide-border">
                  {filteredItems.map((item, i) => {
                    const key = `${ci}-${i}`
                    const isExpanded = expandedFaq === key
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : key)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                        >
                          <span className="text-sm font-medium pr-4">{item.q}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/30 p-4 rounded-xl">{item.a}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 사용 가이드 */}
      {activeTab === 'guides' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide, i) => (
            <div key={i} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <guide.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {guide.time}
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{guide.title}</h3>
              <p className="text-xs text-muted-foreground">{guide.description}</p>
              <button className="mt-3 text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                가이드 보기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 문의 내역 */}
      {activeTab === 'tickets' && (
        <div className="card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">내 문의 내역</h3>
            <button className="btn-sm text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => setShowContactModal(true)}>
              <Plus className="w-3 h-3" /> 새 문의
            </button>
          </div>
          <div className="divide-y divide-border">
            {tickets.map(ticket => (
              <div key={ticket.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  ticket.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {ticket.status === 'resolved'
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <Clock className="w-5 h-5 text-amber-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{ticket.title}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-2xs font-bold ${
                      ticket.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      {ticket.response}
                    </span>
                  </div>
                  <div className="text-2xs text-muted-foreground mt-0.5">{ticket.id} · {ticket.date}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업데이트 노트 */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {updates.map((update, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-xs font-bold text-blue-600">{update.version}</span>
                <span className="text-xs text-muted-foreground">{update.date}</span>
                {i === 0 && <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-2xs font-bold text-emerald-600">최신</span>}
              </div>
              <h3 className="font-semibold text-sm mb-2">{update.title}</h3>
              <ul className="space-y-1">
                {update.changes.map((change, ci) => (
                  <li key={ci} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 1:1 문의 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">1:1 문의</h3>
              <button onClick={() => setShowContactModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">문의 유형</label>
                <select className="input mt-1">
                  <option>기능 문의</option>
                  <option>오류/버그 신고</option>
                  <option>결제/구독</option>
                  <option>데이터 마이그레이션</option>
                  <option>원격지원 요청</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">제목</label>
                <input type="text" className="input mt-1" placeholder="문의 제목을 입력하세요" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">내용</label>
                <textarea className="input mt-1 min-h-[120px]" placeholder="문의 내용을 상세히 작성해주세요" rows={5} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">스크린샷 첨부 (선택)</label>
                <div className="mt-1 border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-blue-300">
                  클릭하거나 파일을 드래그하세요
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> 문의 전송
              </button>
              <p className="text-2xs text-muted-foreground text-center">평균 응답 시간: 2시간 이내 (영업일 기준)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


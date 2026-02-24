'use client'

import { useState } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Phone,
  PhoneOff,
  MessageSquare,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  FileText,
  Pill,
  Send,
  Maximize2,
  Minimize2,
  Settings,
  AlertCircle,
  CheckCircle2,
  Camera,
  Volume2,
  VolumeX,
  MoreVertical,
  ClipboardList,
  Stethoscope,
  X,
  User,
  Shield,
} from 'lucide-react'

/* ─── 타입 ─── */
type SessionStatus = 'waiting' | 'ready' | 'in_progress' | 'completed' | 'no_show'

interface TelemedicineSession {
  id: string
  patientName: string
  patientAge: number
  patientGender: string
  chartNo: string
  time: string
  type: '초진' | '재진'
  status: SessionStatus
  chiefComplaint: string
  lastVisit?: string
  conditions?: string[]
}

/* ─── 더미 데이터 ─── */
const todaySessions: TelemedicineSession[] = [
  {
    id: 'TM001', patientName: '김영수', patientAge: 45, patientGender: 'M',
    chartNo: 'C-2024-0892', time: '09:00', type: '재진', status: 'completed',
    chiefComplaint: '고혈압 경과 관찰', lastVisit: '2024-01-05',
    conditions: ['고혈압', '고지혈증'],
  },
  {
    id: 'TM002', patientName: '이미경', patientAge: 38, patientGender: 'F',
    chartNo: 'C-2024-1204', time: '09:30', type: '재진', status: 'completed',
    chiefComplaint: '갑상선 기능 검사 결과 상담', lastVisit: '2024-01-10',
    conditions: ['갑상선기능저하증'],
  },
  {
    id: 'TM003', patientName: '박준호', patientAge: 52, patientGender: 'M',
    chartNo: 'C-2024-0341', time: '10:00', type: '재진', status: 'in_progress',
    chiefComplaint: '당뇨 약 조절 상담', lastVisit: '2023-12-20',
    conditions: ['제2형 당뇨', '고혈압'],
  },
  {
    id: 'TM004', patientName: '강지원', patientAge: 29, patientGender: 'F',
    chartNo: 'C-2024-1567', time: '10:30', type: '초진', status: 'ready',
    chiefComplaint: '두통, 어지러움 증상 2주',
  },
  {
    id: 'TM005', patientName: '정대현', patientAge: 61, patientGender: 'M',
    chartNo: 'C-2024-0128', time: '11:00', type: '재진', status: 'waiting',
    chiefComplaint: '요통 악화 상담', lastVisit: '2024-01-08',
    conditions: ['퇴행성 디스크'],
  },
  {
    id: 'TM006', patientName: '최은지', patientAge: 34, patientGender: 'F',
    chartNo: 'C-2024-1891', time: '11:30', type: '초진', status: 'waiting',
    chiefComplaint: '피부 발진 상담',
  },
  {
    id: 'TM007', patientName: '한상우', patientAge: 47, patientGender: 'M',
    chartNo: 'C-2024-0654', time: '14:00', type: '재진', status: 'waiting',
    chiefComplaint: '수면장애 경과 관찰', lastVisit: '2024-01-02',
    conditions: ['불면증'],
  },
]

const statusConfig: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: '대기', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  ready: { label: '입장 완료', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  in_progress: { label: '진료 중', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  completed: { label: '완료', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/30' },
  no_show: { label: '미접속', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
}

const chatMessages = [
  { sender: 'patient', text: '안녕하세요 원장님, 잘 들리시나요?', time: '10:00' },
  { sender: 'doctor', text: '네, 잘 들립니다. 화면도 잘 보이시나요?', time: '10:00' },
  { sender: 'patient', text: '네, 잘 보입니다!', time: '10:01' },
  { sender: 'doctor', text: '좋습니다. 오늘 당뇨 약 조절 상담으로 오셨는데, 최근 혈당 수치가 어떠셨나요?', time: '10:01' },
  { sender: 'patient', text: '아침 공복 혈당이 150~160 정도로 좀 높게 나오고 있어요. 식후에는 200 넘을 때도 있고요.', time: '10:02' },
  { sender: 'doctor', text: '네, 지난번보다 조금 올랐네요. 식이 조절은 잘 되고 계신가요?', time: '10:03' },
]

export default function TelemedicinePage() {
  const [selectedSession, setSelectedSession] = useState<TelemedicineSession>(todaySessions[2])
  const [isInCall, setIsInCall] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [screenShare, setScreenShare] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chartOpen, setChartOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  // 통계
  const totalToday = todaySessions.length
  const completedCount = todaySessions.filter(s => s.status === 'completed').length
  const waitingCount = todaySessions.filter(s => s.status === 'waiting' || s.status === 'ready').length

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Video className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">비대면 진료</h1>
            <p className="text-sm text-muted-foreground">오늘 {totalToday}건 · 완료 {completedCount}건 · 대기 {waitingCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            카메라/마이크 정상
          </div>
          <button className="btn-sm text-xs bg-secondary text-foreground">
            <Settings className="w-3.5 h-3.5" /> 장비 설정
          </button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px]">
        {/* ──── 좌측: 예약 목록 ──── */}
        <div className="w-72 flex-shrink-0 card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> 오늘 일정
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {todaySessions.map(session => {
              const sc = statusConfig[session.status]
              const isSelected = selectedSession.id === session.id
              return (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500' : 'hover:bg-secondary/30'
                  } ${session.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{session.time}</span>
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${sc.color} ${sc.bg}`}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {session.patientName}
                        <span className="text-2xs text-muted-foreground ml-1">
                          {session.patientGender}/{session.patientAge}세
                        </span>
                      </div>
                      <div className="text-2xs text-muted-foreground truncate">{session.chiefComplaint}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${
                      session.type === '초진' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                    }`}>{session.type}</span>
                    {session.conditions?.map((c, i) => (
                      <span key={i} className="text-2xs text-muted-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ──── 중앙: 비디오 영역 ──── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* 비디오 화면 */}
          <div className="relative flex-1 bg-gray-900 rounded-2xl overflow-hidden">
            {/* 환자 화면 (메인) */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isInCall && selectedSession.status === 'in_progress' ? (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-white font-medium">{selectedSession.patientName} 환자</p>
                  <p className="text-gray-400 text-sm mt-1">화상 연결됨 · 00:12:34</p>
                </div>
              ) : selectedSession.status === 'ready' ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Video className="w-10 h-10 text-blue-400" />
                  </div>
                  <p className="text-white font-medium">{selectedSession.patientName} 환자 대기 중</p>
                  <p className="text-gray-400 text-sm mt-1">환자가 대기실에 입장했습니다</p>
                  <button
                    onClick={() => setIsInCall(true)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 flex items-center gap-2 mx-auto"
                  >
                    <Phone className="w-4 h-4" /> 진료 시작
                  </button>
                </div>
              ) : selectedSession.status === 'waiting' ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium">환자 미접속</p>
                  <p className="text-gray-500 text-sm mt-1">{selectedSession.time} 예약 · 환자 접속 대기 중</p>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle2 className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">진료 완료</p>
                </div>
              )}
            </div>

            {/* 의사 화면 (PIP) */}
            {isInCall && selectedSession.status === 'in_progress' && (
              <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden">
                {videoOn ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-gray-400 mx-auto" />
                      <p className="text-2xs text-gray-400 mt-1">내 카메라</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <VideoOff className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            )}

            {/* 상단 정보 바 */}
            {isInCall && selectedSession.status === 'in_progress' && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur text-white text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  진료 중 · 00:12:34
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg bg-black/50 backdrop-blur text-white hover:bg-black/70">
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFullscreen(!fullscreen)}
                    className="p-2 rounded-lg bg-black/50 backdrop-blur text-white hover:bg-black/70"
                  >
                    {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 컨트롤 바 */}
          {isInCall && selectedSession.status === 'in_progress' && (
            <div className="flex items-center justify-center gap-3 py-2">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-full transition-colors ${micOn ? 'bg-secondary hover:bg-secondary/80' : 'bg-red-500 text-white'}`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-full transition-colors ${videoOn ? 'bg-secondary hover:bg-secondary/80' : 'bg-red-500 text-white'}`}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setScreenShare(!screenShare)}
                className={`p-3 rounded-full transition-colors ${screenShare ? 'bg-blue-500 text-white' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <MonitorUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`p-3 rounded-full transition-colors ${chatOpen ? 'bg-blue-500 text-white' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChartOpen(!chartOpen)}
                className={`p-3 rounded-full transition-colors ${chartOpen ? 'bg-blue-500 text-white' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                <ClipboardList className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-border mx-1" />
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="px-4 py-2.5 rounded-full bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 flex items-center gap-2"
              >
                <Pill className="w-4 h-4" /> 처방
              </button>
              <button
                onClick={() => setIsInCall(false)}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* ──── 우측: 채팅 또는 차트 ──── */}
        {(chatOpen || chartOpen) && isInCall && selectedSession.status === 'in_progress' && (
          <div className="w-80 flex-shrink-0 flex flex-col gap-3">
            {/* 채팅 패널 */}
            {chatOpen && (
              <div className="card flex flex-col flex-1 overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" /> 채팅
                  </h3>
                  <button onClick={() => setChatOpen(false)} className="btn-icon p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                        msg.sender === 'doctor'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-secondary rounded-bl-md'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-2xs mt-0.5 ${msg.sender === 'doctor' ? 'text-blue-100' : 'text-muted-foreground'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="메시지 입력..."
                      className="input text-xs flex-1 py-2"
                    />
                    <button className="p-2 rounded-lg bg-blue-500 text-white">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 차트 패널 */}
            {chartOpen && (
              <div className="card flex flex-col flex-1 overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" /> 진료 차트
                  </h3>
                  <button onClick={() => setChartOpen(false)} className="btn-icon p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* 환자 요약 */}
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-sm">{selectedSession.patientName}</span>
                      <span className="text-2xs text-muted-foreground">{selectedSession.patientGender}/{selectedSession.patientAge}세</span>
                      <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/30">{selectedSession.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedSession.chartNo}</p>
                    {selectedSession.conditions && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedSession.conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-2xs text-amber-700">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SOAP 입력 */}
                  <div>
                    <label className="text-xs font-semibold text-blue-600">S (주관적)</label>
                    <textarea className="input mt-1 text-xs min-h-[60px]" placeholder="환자 호소 내용..." defaultValue="공복 혈당 150-160, 식후 200 이상. 약 복용은 규칙적." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-emerald-600">O (객관적)</label>
                    <textarea className="input mt-1 text-xs min-h-[60px]" placeholder="검사 결과, 활력징후..." defaultValue="HbA1c 7.8% (이전 7.2%). BP 138/88." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-purple-600">A (평가)</label>
                    <textarea className="input mt-1 text-xs min-h-[40px]" placeholder="진단/평가..." defaultValue="제2형 당뇨 혈당 조절 악화. 약물 조절 필요." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-amber-600">P (계획)</label>
                    <textarea className="input mt-1 text-xs min-h-[40px]" placeholder="치료 계획..." defaultValue="메트포르민 용량 증량(500→850mg). 4주 후 재검." />
                  </div>

                  {/* AI 제안 */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">AI 진료 어시스턴트</span>
                    </div>
                    <ul className="space-y-1 text-2xs text-blue-700 dark:text-blue-300">
                      <li>• HbA1c 0.6%p 상승 — 식이요법 병행 강화 권고</li>
                      <li>• 메트포르민 증량 시 위장관 부작용 모니터링 필요</li>
                      <li>• 신기능(eGFR) 확인 후 용량 조절 권고</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 처방 모달 */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPrescriptionModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-600" /> 비대면 처방
              </h3>
              <button onClick={() => setShowPrescriptionModal(false)} className="btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className="text-xs text-muted-foreground">환자</div>
                <div className="font-semibold text-sm">{selectedSession.patientName} ({selectedSession.chartNo})</div>
              </div>

              {/* 약품 목록 */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">처방 약품</label>
                <div className="mt-2 space-y-2">
                  <div className="border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">메트포르민정 850mg</span>
                      <span className="text-2xs text-muted-foreground">1일 2회</span>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-1">식후 30분 · 28일분</div>
                  </div>
                  <div className="border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">아모디핀정 5mg</span>
                      <span className="text-2xs text-muted-foreground">1일 1회</span>
                    </div>
                    <div className="text-2xs text-muted-foreground mt-1">아침 식후 · 28일분</div>
                  </div>
                </div>
              </div>

              {/* 약국 선택 */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">전송 약국</label>
                <select className="input mt-1 text-sm">
                  <option>메디매치 온누리약국 (연동 약국)</option>
                  <option>환자 지정 약국</option>
                  <option>환자에게 처방전 발송</option>
                </select>
              </div>

              {/* 안내 */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-2xs text-amber-700 dark:text-amber-300">
                  비대면 진료 처방은 환자 본인 확인 후 전송됩니다. 마약류·향정신성 의약품은 비대면 처방이 불가합니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> 약국 전송
                </button>
                <button onClick={() => setShowPrescriptionModal(false)} className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-secondary text-foreground">
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

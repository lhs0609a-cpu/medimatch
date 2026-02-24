'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Save,
  Send,
  ArrowLeft,
  Brain,
  Sparkles,
  FileText,
  Pill,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Search,
  Clock,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  Volume2,
  VolumeX,
  User,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Shield,
  Zap,
  Loader2,
  Check,
  Info,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'

/* ─── 타입 ─── */
interface DiagnosisCode {
  code: string
  name: string
  confidence: number
}

interface PrescriptionItem {
  id: string
  name: string
  dose: string
  frequency: string
  days: number
  qty: number
  route: string
}

/* ─── AI 추천 데이터 ─── */
const suggestedDiagnoses: DiagnosisCode[] = [
  { code: 'R51', name: '두통', confidence: 92 },
  { code: 'G43.9', name: '편두통, 상세불명', confidence: 78 },
  { code: 'R42', name: '어지러움 및 어지럼증', confidence: 45 },
  { code: 'G44.1', name: '혈관성 두통', confidence: 32 },
]

const suggestedPrescriptions: PrescriptionItem[] = [
  { id: '1', name: '아세트아미노펜 500mg', dose: '500mg', frequency: '1일 3회', days: 3, qty: 9, route: '경구' },
  { id: '2', name: '이부프로펜 200mg', dose: '200mg', frequency: '1일 3회', days: 3, qty: 9, route: '경구' },
  { id: '3', name: '메토클로프라미드 5mg', dose: '5mg', frequency: '1일 2회', days: 3, qty: 6, route: '경구' },
]

const frequentDrugs = [
  '아세트아미노펜 500mg', '이부프로펜 200mg', '암로디핀 5mg', '메트포르민 500mg',
  '오메프라졸 20mg', '셀레콕시브 200mg', '레보플록사신 500mg', '아목시실린 500mg',
]

export default function NewChartPage() {
  // 녹음 상태
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [aiProcessing, setAiProcessing] = useState(false)

  // 차트 데이터
  const [selectedPatient, setSelectedPatient] = useState<{ name: string; age: number; gender: string; chartNo: string } | null>(null)
  const [cc, setCc] = useState('')
  const [pi, setPi] = useState('')
  const [pmh, setPmh] = useState('')
  const [ros, setRos] = useState('')
  const [pe, setPe] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  // 바이탈
  const [vitals, setVitals] = useState({ bp_sys: '', bp_dia: '', hr: '', temp: '', weight: '' })

  // 진단
  const [selectedDx, setSelectedDx] = useState<DiagnosisCode[]>([])
  const [dxSearch, setDxSearch] = useState('')

  // 처방
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])
  const [rxSearch, setRxSearch] = useState('')

  // 삭감 위험도
  const [claimRisk, setClaimRisk] = useState<'low' | 'medium' | 'high' | null>(null)

  // 대화 텍스트
  const [transcript, setTranscript] = useState<{ speaker: 'doctor' | 'patient'; text: string; time: string }[]>([])

  // 패널 토글
  const [showTranscript, setShowTranscript] = useState(true)

  // 녹음 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && !isPaused) {
      interval = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  // 데모: 녹음 시작 후 AI 자동 생성
  const handleStartRecording = () => {
    setIsRecording(true)
    setSelectedPatient({ name: '박준호', age: 28, gender: 'M', chartNo: 'NEW' })

    // 데모 대화 시뮬레이션
    setTimeout(() => {
      setTranscript([
        { speaker: 'doctor', text: '어떻게 오셨어요?', time: '0:01' },
      ])
    }, 1000)
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { speaker: 'patient', text: '3일 전부터 두통이 있었어요. 앞쪽이요.', time: '0:03' },
      ])
    }, 3000)
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { speaker: 'doctor', text: '얼마나 아프세요? 10점 만점에 몇 점 정도?', time: '0:06' },
      ])
    }, 5000)
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { speaker: 'patient', text: '5점 정도요. 욱신욱신 거려요.', time: '0:08' },
      ])
    }, 7000)
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { speaker: 'doctor', text: '구역감이나 빛에 예민한 건 없으시고요?', time: '0:11' },
      ])
    }, 9000)
    setTimeout(() => {
      setTranscript((prev) => [
        ...prev,
        { speaker: 'patient', text: '아니요 그런 건 없어요.', time: '0:13' },
      ])
    }, 11000)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    setAiProcessing(true)

    // AI 분석 시뮬레이션
    setTimeout(() => {
      setCc('두통 3일 지속, 전두부 위주')
      setPi('3일 전 발생한 전두부 두통. 욱신거리는 양상. NRS 5/10. 구역, 구토 없음. 광과민 없음. 음과민 없음. 시각 증상 없음. 수면 장애 없음.')
      setPmh('특이 과거력 없음')
      setRos('두통 외 특이 증상 없음')
      setPe('의식 명료. 활력징후 안정. 신경학적 검사 정상.')
      setVitals({ bp_sys: '120', bp_dia: '78', hr: '72', temp: '36.5', weight: '74' })
      setSelectedDx([suggestedDiagnoses[0]])
      setPrescriptions([suggestedPrescriptions[0]])
      setClaimRisk('low')
      setAiProcessing(false)
    }, 2500)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const addDiagnosis = (dx: DiagnosisCode) => {
    if (!selectedDx.find((d) => d.code === dx.code)) {
      setSelectedDx([...selectedDx, dx])
    }
  }

  const removeDiagnosis = (code: string) => {
    setSelectedDx(selectedDx.filter((d) => d.code !== code))
  }

  const addPrescription = (rx: PrescriptionItem) => {
    if (!prescriptions.find((p) => p.id === rx.id)) {
      setPrescriptions([...prescriptions, rx])
    }
  }

  const removePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ───── 헤더 ───── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/emr/dashboard" className="btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              AI 진료 차트
              {selectedPatient && (
                <span className="text-muted-foreground font-normal text-base">
                  · {selectedPatient.name} ({selectedPatient.age}세 {selectedPatient.gender === 'M' ? '남' : '여'})
                </span>
              )}
            </h1>
            {isRecording && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-500 font-semibold">녹음 중 {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cc && (
            <>
              <button className="btn-outline btn-sm">
                <RotateCcw className="w-3.5 h-3.5" />
                AI 재분석
              </button>
              <button className="btn-primary btn-sm">
                <Save className="w-3.5 h-3.5" />
                저장
              </button>
              <button className="btn-primary btn-sm bg-emerald-500 hover:bg-emerald-600">
                <Send className="w-3.5 h-3.5" />
                저장 + 약국전송
              </button>
            </>
          )}
        </div>
      </div>

      {/* ───── 메인 그리드 ───── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 좌측: 차트 입력 (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* 녹음 컨트롤 */}
          {!cc && (
            <div className="card p-8 text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse-subtle'
                  : 'bg-primary hover:bg-primary/90 cursor-pointer'
              }`}
                onClick={!isRecording ? handleStartRecording : undefined}
              >
                {isRecording ? (
                  <Volume2 className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </div>

              {!isRecording ? (
                <>
                  <h3 className="text-xl font-bold mb-2">AI 진료를 시작하세요</h3>
                  <p className="text-muted-foreground mb-6">
                    마이크 버튼을 누르고 환자와 대화하면<br />AI가 자동으로 차트를 작성합니다
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-purple-500" />
                      의료용 AI 모델
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      암호화 처리
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      실시간 분석
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2 text-red-500">음성 인식 중...</h3>
                  <p className="text-muted-foreground mb-6">환자와 자연스럽게 대화하세요. AI가 듣고 있습니다.</p>

                  {/* 파형 */}
                  <div className="flex items-center justify-center gap-1 h-12 mb-6">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full transition-all duration-150"
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          animationDelay: `${i * 30}ms`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="btn-outline"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? '재개' : '일시정지'}
                    </button>
                    <button
                      onClick={handleStopRecording}
                      className="btn-primary bg-red-500 hover:bg-red-600"
                    >
                      <Square className="w-4 h-4" />
                      녹음 종료 + AI 분석
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI 처리 중 */}
          {aiProcessing && (
            <div className="card p-8 text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold mb-2">AI가 차트를 작성하고 있습니다</h3>
              <p className="text-muted-foreground">대화 내용을 분석하고 진단코드를 매칭 중...</p>
              <div className="flex items-center justify-center gap-6 mt-6">
                {['음성 분석', '증상 추출', '진단 매칭', '처방 추천'].map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      i < 3 ? 'bg-emerald-500' : 'bg-primary animate-pulse'
                    }`}>
                      {i < 3 ? <Check className="w-3 h-3 text-white" /> : <Loader2 className="w-3 h-3 text-white animate-spin" />}
                    </div>
                    <span className={i < 3 ? 'text-muted-foreground' : 'text-primary font-semibold'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 차트 작성 영역 */}
          {cc && !aiProcessing && (
            <div className="space-y-4">
              {/* 삭감 위험도 알림 */}
              {claimRisk && (
                <div className={`card p-4 flex items-center gap-3 ${
                  claimRisk === 'low' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' :
                  claimRisk === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                  'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  {claimRisk === 'low' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${claimRisk === 'medium' ? 'text-amber-500' : 'text-red-500'}`} />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${
                      claimRisk === 'low' ? 'text-emerald-700 dark:text-emerald-400' :
                      claimRisk === 'medium' ? 'text-amber-700 dark:text-amber-400' :
                      'text-red-700 dark:text-red-400'
                    }`}>
                      삭감 위험도: {claimRisk === 'low' ? '낮음' : claimRisk === 'medium' ? '주의' : '높음'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {claimRisk === 'low' ? 'AI 분석 결과 삭감 위험이 낮습니다. 안전하게 청구 가능합니다.' :
                       claimRisk === 'medium' ? '일부 코드 조합에서 삭감 가능성이 있습니다. 확인해주세요.' :
                       '삭감 위험이 높은 코드가 포함되어 있습니다. 수정을 권장합니다.'}
                    </div>
                  </div>
                </div>
              )}

              {/* 바이탈 입력 */}
              <div className="card p-5">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  바이탈 사인
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="text-2xs text-muted-foreground">수축기 혈압</label>
                    <input className="input text-sm" value={vitals.bp_sys} onChange={(e) => setVitals({ ...vitals, bp_sys: e.target.value })} placeholder="mmHg" />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground">이완기 혈압</label>
                    <input className="input text-sm" value={vitals.bp_dia} onChange={(e) => setVitals({ ...vitals, bp_dia: e.target.value })} placeholder="mmHg" />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground">심박수</label>
                    <input className="input text-sm" value={vitals.hr} onChange={(e) => setVitals({ ...vitals, hr: e.target.value })} placeholder="bpm" />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground">체온</label>
                    <input className="input text-sm" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} placeholder="°C" />
                  </div>
                  <div>
                    <label className="text-2xs text-muted-foreground">체중</label>
                    <input className="input text-sm" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} placeholder="kg" />
                  </div>
                </div>
              </div>

              {/* SOAP 차트 */}
              <div className="card p-5 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  진료 기록
                  <span className="badge-primary text-2xs ml-auto">AI 자동 생성</span>
                </h4>

                {[
                  { label: 'C/C (주호소)', value: cc, setter: setCc, placeholder: '환자의 주된 호소를 입력하세요' },
                  { label: 'P/I (현병력)', value: pi, setter: setPi, placeholder: '현재 질환의 경과를 상세히 입력하세요', multiline: true },
                  { label: 'P/M/H (과거력)', value: pmh, setter: setPmh, placeholder: '과거 질병력, 수술력, 가족력 등' },
                  { label: 'R/O/S (계통별 문진)', value: ros, setter: setRos, placeholder: '전반적인 증상 검토' },
                  { label: 'P/E (이학적 검사)', value: pe, setter: setPe, placeholder: '신체 검사 소견' },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{field.label}</label>
                    {field.multiline ? (
                      <textarea
                        className="textarea text-sm"
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="input text-sm"
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* 진단코드 */}
              <div className="card p-5">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  진단 (Dx)
                  <span className="badge-primary text-2xs">AI 추천</span>
                </h4>

                {/* 선택된 진단 */}
                {selectedDx.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedDx.map((dx) => (
                      <span key={dx.code} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-sm font-medium">
                        <span className="font-mono text-xs">{dx.code}</span>
                        {dx.name}
                        <button onClick={() => removeDiagnosis(dx.code)}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* AI 추천 */}
                <div className="space-y-1.5">
                  {suggestedDiagnoses
                    .filter((dx) => !selectedDx.find((s) => s.code === dx.code))
                    .map((dx) => (
                      <button
                        key={dx.code}
                        onClick={() => addDiagnosis(dx)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{dx.code}</span>
                        <span className="text-sm flex-1">{dx.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dx.confidence >= 80 ? 'bg-emerald-500' :
                                dx.confidence >= 50 ? 'bg-amber-500' : 'bg-muted-foreground'
                              }`}
                              style={{ width: `${dx.confidence}%` }}
                            />
                          </div>
                          <span className="text-2xs text-muted-foreground">{dx.confidence}%</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* 처방 */}
              <div className="card p-5">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  처방 (Rx)
                </h4>

                {/* 선택된 처방 */}
                {prescriptions.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                        <Pill className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{rx.name}</div>
                          <div className="text-xs text-muted-foreground">{rx.frequency} · {rx.days}일분 · {rx.route}</div>
                        </div>
                        <input
                          type="number"
                          className="w-16 input text-sm text-center"
                          value={rx.qty}
                          onChange={(e) => {
                            const updated = prescriptions.map((p) =>
                              p.id === rx.id ? { ...p, qty: parseInt(e.target.value) || 0 } : p
                            )
                            setPrescriptions(updated)
                          }}
                        />
                        <button onClick={() => removePrescription(rx.id)} className="text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 자주 쓰는 약 */}
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-2">자주 처방하는 약</div>
                  <div className="flex flex-wrap gap-1.5">
                    {frequentDrugs.map((drug) => (
                      <button
                        key={drug}
                        className="px-2.5 py-1 bg-secondary rounded-lg text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        + {drug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI 추천 처방 */}
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI 추천 처방
                  </div>
                  {suggestedPrescriptions
                    .filter((rx) => !prescriptions.find((p) => p.id === rx.id))
                    .map((rx) => (
                      <button
                        key={rx.id}
                        onClick={() => addPrescription(rx)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{rx.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{rx.frequency} · {rx.days}일</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 대화 패널 (1/3) */}
        <div className="space-y-4">
          {/* 대화 트랜스크립트 */}
          {transcript.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  대화 내용
                </h4>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showTranscript ? '접기' : '펼치기'}
                </button>
              </div>

              {showTranscript && (
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {transcript.map((t, i) => (
                    <div key={i} className={`flex gap-2 ${t.speaker === 'doctor' ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        t.speaker === 'doctor' ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                        {t.speaker === 'doctor' ? (
                          <Stethoscope className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className={`max-w-[80%] p-2.5 rounded-2xl text-sm ${
                        t.speaker === 'doctor'
                          ? 'bg-primary/10 rounded-tl-sm'
                          : 'bg-secondary rounded-tr-sm'
                      }`}>
                        <div>{t.text}</div>
                        <div className="text-2xs text-muted-foreground mt-1">{t.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DUR 체크 */}
          {prescriptions.length > 0 && (
            <div className="card p-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                DUR 확인
              </h4>
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">이상 없음</div>
                  <div className="text-xs text-muted-foreground">병용금기, 연령금기, 임부금기 확인 완료</div>
                </div>
              </div>
            </div>
          )}

          {/* 환자 정보 요약 */}
          {selectedPatient && (
            <div className="card p-4">
              <h4 className="font-bold text-sm mb-3">환자 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이름</span>
                  <span className="font-medium">{selectedPatient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">나이/성별</span>
                  <span>{selectedPatient.age}세 {selectedPatient.gender === 'M' ? '남' : '여'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">차트번호</span>
                  <span className="font-mono text-xs">{selectedPatient.chartNo}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

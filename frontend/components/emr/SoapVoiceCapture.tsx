'use client'

/**
 * SoapVoiceCapture
 *
 * - 진료 중 마이크 녹음(브라우저 STT) 또는 텍스트 직접 입력
 * - "SOAP으로 분해" → 백엔드 GPT-4o-mini 호출 (없으면 룰 기반 fallback)
 * - 각 섹션·진단·처치·처방 후보를 1클릭으로 차트에 적용
 *
 * onApply는 부모가 받은 patch를 setState로 채워넣는다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Mic, MicOff, Sparkles, Loader2, Square,
  Wand2, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { sttService, StoSoapResponse } from '@/lib/api/stt'

interface SoapPatch {
  chief_complaint?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  diagnoses?: { name: string; code?: string }[]
  procedures?: { name: string }[]
  drugs?: { name: string; dose?: string }[]
}

interface Props {
  /** 차트가 이미 저장된 경우 visit id (저장된 transcript에 누적) */
  visitId?: string
  /** 분해 결과를 차트에 반영 */
  onApply: (patch: SoapPatch) => void
  className?: string
}

// 브라우저 SpeechRecognition 타입 가드
function getRecognition(): any {
  if (typeof window === 'undefined') return null
  const W: any = window
  return W.SpeechRecognition || W.webkitSpeechRecognition || null
}

export default function SoapVoiceCapture({ visitId, onApply, className = '' }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<StoSoapResponse | null>(null)
  const [expanded, setExpanded] = useState(true)
  const recogRef = useRef<any>(null)
  const partialRef = useRef('')

  const supportsSTT = useMemo(() => Boolean(getRecognition()), [])

  useEffect(() => () => {
    try { recogRef.current?.stop?.() } catch {}
  }, [])

  const startRecording = () => {
    const Cls = getRecognition()
    if (!Cls) {
      toast.error('이 브라우저는 음성인식을 지원하지 않아요. 텍스트로 입력해주세요.')
      return
    }
    const recog = new Cls()
    recog.lang = 'ko-KR'
    recog.continuous = true
    recog.interimResults = true
    partialRef.current = text

    recog.onresult = (e: any) => {
      let interim = ''
      let finalAdd = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalAdd += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      if (finalAdd) {
        partialRef.current = (partialRef.current + ' ' + finalAdd).trim()
      }
      const next = (partialRef.current + (interim ? ' ' + interim : '')).trim()
      setText(next)
    }
    recog.onerror = (e: any) => {
      console.warn('STT error', e)
      if (e.error === 'not-allowed') toast.error('마이크 권한을 허용해주세요.')
      setRecording(false)
    }
    recog.onend = () => {
      setRecording(false)
    }
    try {
      recog.start()
      recogRef.current = recog
      setRecording(true)
    } catch (e) {
      toast.error('녹음 시작 실패')
    }
  }

  const stopRecording = () => {
    try { recogRef.current?.stop?.() } catch {}
    setRecording(false)
  }

  const onParse = async () => {
    const t = (text || '').trim()
    if (!t) {
      toast.error('내용을 입력하거나 녹음해 주세요.')
      return
    }
    try {
      setParsing(true)
      const r = await sttService.parse({
        transcript: t,
        visit_id: visitId,
        save_to_visit: !!visitId,
      })
      setResult(r)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || '분석 실패')
    } finally {
      setParsing(false)
    }
  }

  const applyAll = () => {
    if (!result) return
    onApply({
      chief_complaint: result.chief_complaint || undefined,
      subjective: result.subjective || undefined,
      objective: result.objective || undefined,
      assessment: result.assessment || undefined,
      plan: result.plan || undefined,
      diagnoses: result.diagnoses_suggested,
      procedures: result.procedures_suggested,
      drugs: result.drugs_suggested,
    })
    toast.success('차트에 일괄 반영했어요.')
  }

  const applyOne = (patch: SoapPatch, label: string) => {
    onApply(patch)
    toast.success(`${label} 반영`)
  }

  return (
    <section className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold">AI 음성 차팅</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
            STT → SOAP
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-700"
          aria-label={expanded ? '접기' : '펼치기'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={!supportsSTT}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={supportsSTT ? '브라우저 마이크로 녹음 (한국어)' : '이 브라우저는 음성인식을 지원하지 않아요'}
              >
                <Mic className="w-4 h-4" /> 녹음 시작
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" /> 녹음 중지
              </button>
            )}
            <button
              type="button"
              onClick={onParse}
              disabled={parsing || !text.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              SOAP으로 분해
            </button>
            {!supportsSTT && (
              <span className="text-[11px] text-slate-500">
                ※ Chrome/Edge에서 음성인식 가능. 그 외에는 텍스트로 입력하세요.
              </span>
            )}
          </div>

          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[120px] font-mono"
            placeholder={
              recording
                ? '말씀하시면 여기에 받아써집니다…'
                : '예: "환자가 두통이 3일째 지속된다고 호소. 혈압 130/85 정상. 긴장성 두통 추정. 아세트아미노펜 500mg 처방, 1주일 후 재방문."'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={recording}
          />

          {result && (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-violet-700">
                  분해 완료 · 신뢰도 {(result.confidence * 100).toFixed(0)}% · {result.model}
                </div>
                <button
                  type="button"
                  onClick={applyAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600 text-white text-xs font-semibold"
                >
                  <Check className="w-3 h-3" /> 전체 반영
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {result.chief_complaint && (
                  <PreviewBlock
                    label="주증상 (CC)"
                    value={result.chief_complaint}
                    onApply={() => applyOne({ chief_complaint: result.chief_complaint }, '주증상')}
                  />
                )}
                {result.subjective && (
                  <PreviewBlock
                    label="S — 주관"
                    value={result.subjective}
                    onApply={() => applyOne({ subjective: result.subjective }, 'S')}
                  />
                )}
                {result.objective && (
                  <PreviewBlock
                    label="O — 객관"
                    value={result.objective}
                    onApply={() => applyOne({ objective: result.objective }, 'O')}
                  />
                )}
                {result.assessment && (
                  <PreviewBlock
                    label="A — 평가"
                    value={result.assessment}
                    onApply={() => applyOne({ assessment: result.assessment }, 'A')}
                  />
                )}
                {result.plan && (
                  <PreviewBlock
                    label="P — 계획"
                    value={result.plan}
                    onApply={() => applyOne({ plan: result.plan }, 'P')}
                  />
                )}
              </div>

              {(result.diagnoses_suggested.length > 0 ||
                result.procedures_suggested.length > 0 ||
                result.drugs_suggested.length > 0) && (
                <div className="text-xs space-y-1.5 pt-2 border-t border-violet-200">
                  {result.diagnoses_suggested.length > 0 && (
                    <SuggestRow
                      label="진단 후보"
                      items={result.diagnoses_suggested.map((d) => d.name)}
                      onApply={() => applyOne({ diagnoses: result.diagnoses_suggested }, '진단')}
                    />
                  )}
                  {result.procedures_suggested.length > 0 && (
                    <SuggestRow
                      label="처치/검사"
                      items={result.procedures_suggested.map((p) => p.name)}
                      onApply={() => applyOne({ procedures: result.procedures_suggested }, '처치/검사')}
                    />
                  )}
                  {result.drugs_suggested.length > 0 && (
                    <SuggestRow
                      label="처방 후보"
                      items={result.drugs_suggested.map((d) => `${d.name}${d.dose ? ` ${d.dose}` : ''}`)}
                      onApply={() => applyOne({ drugs: result.drugs_suggested }, '처방')}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function PreviewBlock({ label, value, onApply }: { label: string; value: string; onApply: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-violet-100 p-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide">{label}</span>
        <button
          type="button"
          onClick={onApply}
          className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium"
        >
          반영
        </button>
      </div>
      <div className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800">{value}</div>
    </div>
  )
}

function SuggestRow({ label, items, onApply }: { label: string; items: string[]; onApply: () => void }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-violet-700 font-medium shrink-0 w-16">{label}</span>
      <div className="flex flex-wrap gap-1 flex-1">
        {items.map((it, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-violet-200 text-violet-800">
            {it}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onApply}
        className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium"
      >
        반영
      </button>
    </div>
  )
}

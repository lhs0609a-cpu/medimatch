'use client'

/**
 * 약국 픽업 페이지 — 단축키 33종 컨셉의 키보드 우선 UX.
 *
 * F-키 매핑 (PM2000 단축키 문화 차용):
 *   F2  : 픽업코드 입력 포커스
 *   F3  : 디스펜스 (조제 완료)
 *   F4  : 인쇄
 *   F5  : 새로 조회 (현재 화면 초기화)
 *   F6  : 약국명 입력 포커스
 *   F8  : DUR 경고 펼치기/접기
 *   F12 : 도움말
 *   Esc : 결과 초기화
 */
import { useEffect, useRef, useState } from 'react'
import {
  Pill, Search, KeyRound, AlertTriangle, CheckCircle2, Loader2, Printer,
  Phone, User, Clock, ShieldCheck, Building2, Keyboard,
} from 'lucide-react'
import { toast } from 'sonner'
import { pickupService, PickupOut } from '@/lib/api/pharmacyPickup'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export default function PharmacyPickupPage() {
  const [code, setCode] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')
  const [dispensedBy, setDispensedBy] = useState('')
  const [rx, setRx] = useState<PickupOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [dispensing, setDispensing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDur, setShowDur] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  const codeRef = useRef<HTMLInputElement>(null)
  const pharmRef = useRef<HTMLInputElement>(null)

  // 페이지 로드 시 약국명 localStorage에서 복원
  useEffect(() => {
    const saved = localStorage.getItem('pharmacyName') || ''
    if (saved) setPharmacyName(saved)
    setTimeout(() => codeRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (pharmacyName) localStorage.setItem('pharmacyName', pharmacyName)
  }, [pharmacyName])

  const onLookup = async () => {
    if (!code.trim()) {
      setError('픽업코드를 입력하세요.')
      codeRef.current?.focus()
      return
    }
    setError(null)
    setLoading(true)
    try {
      const r = await pickupService.lookupByCode(code.trim().toUpperCase(), phoneLast4 || undefined)
      setRx(r)
      if (r.status === 'DISPENSED') {
        setError(`이미 ${r.pharmacy_name || '다른 약국'}에서 조제된 처방이에요.`)
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || '조회 실패')
      setRx(null)
    } finally {
      setLoading(false)
    }
  }

  const onDispense = async () => {
    if (!rx) {
      setError('먼저 처방을 조회하세요.')
      return
    }
    if (rx.status === 'DISPENSED') {
      setError('이미 조제된 처방입니다.')
      return
    }
    if (!pharmacyName.trim()) {
      setError('약국명을 입력해주세요.')
      pharmRef.current?.focus()
      return
    }
    setDispensing(true)
    try {
      const updated = await pickupService.dispense({
        code: code.trim().toUpperCase(),
        phone_last4: phoneLast4 || undefined,
        pharmacy_name: pharmacyName.trim(),
        dispensed_by: dispensedBy.trim() || undefined,
      })
      setRx(updated)
      toast.success('조제 완료 — 의원 EMR에 자동 반영됐어요.')
    } catch (e: any) {
      setError(e.response?.data?.detail || '디스펜스 실패')
    } finally {
      setDispensing(false)
    }
  }

  const onClear = () => {
    setCode('')
    setPhoneLast4('')
    setRx(null)
    setError(null)
    codeRef.current?.focus()
  }

  // ─── 단축키 ───
  useKeyboardShortcuts({
    'F2': () => codeRef.current?.focus(),
    'F3': () => onDispense(),
    'F4': () => window.print(),
    'F5': () => onClear(),
    'F6': () => pharmRef.current?.focus(),
    'F8': () => setShowDur((v) => !v),
    'F12': () => setShowHelp((v) => !v),
    'Escape': () => { onClear(); setShowHelp(false) },
    'Enter': (e) => {
      // 코드 입력창에서 엔터 → 조회
      if ((e.target as HTMLElement)?.id === 'pickup-code-input') {
        onLookup()
      }
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pill className="w-7 h-7 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold">약국 픽업</h1>
              <p className="text-xs text-slate-500">의원 처방을 코드 한 번에 받아 조제하세요. 단축키 F2/F3/F4/F5</p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium"
            title="단축키 도움말 (F12)"
          >
            <Keyboard className="w-4 h-4" /> F12 단축키
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6 print:p-0">
        {/* 약국 정보 */}
        <section className="card p-4 print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">약국 정보</h2>
            <span className="text-[10px] text-slate-400">(브라우저에 저장됨)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">약국명 (F6)</label>
              <input
                ref={pharmRef}
                className="input mt-1"
                placeholder="OO약국"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">조제자 이름</label>
              <input
                className="input mt-1"
                placeholder="홍길동"
                value={dispensedBy}
                onChange={(e) => setDispensedBy(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 코드 입력 */}
        <section className="card p-5 print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold">픽업코드 (F2)</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-500">6자리 코드</label>
              <input
                ref={codeRef}
                id="pickup-code-input"
                className="input mt-1 text-2xl font-mono tracking-widest text-center uppercase"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={12}
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-slate-500">폰 끝 4자리</label>
              <input
                className="input mt-1 text-center font-mono"
                placeholder="1234"
                value={phoneLast4}
                onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
              />
            </div>
            <button
              type="button"
              onClick={onLookup}
              disabled={loading}
              className="btn-primary px-5 py-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              조회 (Enter)
            </button>
          </div>
          {error && (
            <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}
        </section>

        {/* 처방 결과 */}
        {rx && (
          <section className="card p-6 print:p-0 print:shadow-none">
            <div className="flex items-start justify-between mb-4 print:mb-2">
              <div>
                <div className="text-xs text-slate-500">처방번호</div>
                <div className="font-mono font-semibold">{rx.prescription_no}</div>
              </div>
              <div className="text-right">
                {rx.status === 'DISPENSED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 조제 완료
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> 대기 중
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
              <Field icon={<User className="w-3.5 h-3.5" />} label="환자" value={rx.patient_name_masked || '-'} />
              <Field icon={<Phone className="w-3.5 h-3.5" />} label="폰 끝4자" value={rx.patient_phone_last4 || '-'} />
              <Field label="처방일" value={rx.prescribed_date} />
              <Field label="처방의" value={rx.doctor_name || '-'} />
            </div>

            {/* DUR 경고 */}
            {rx.dur_warnings && rx.dur_warnings.length > 0 && showDur && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <div className="flex items-center gap-1.5 text-rose-800 text-sm font-semibold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  DUR 경고 {rx.dur_warnings.length}건 (F8 토글)
                </div>
                <ul className="space-y-1 text-xs text-rose-900">
                  {rx.dur_warnings.map((w: any, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="font-semibold uppercase text-[10px] mt-0.5 px-1 rounded bg-rose-200 text-rose-800">
                        {w.severity || '?'}
                      </span>
                      <span>{w.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 처방 약품 */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">처방 약품 ({rx.items.length}개)</h3>
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-1.5">약품명</th>
                    <th className="text-center">1회</th>
                    <th className="text-center">하루</th>
                    <th className="text-center">일수</th>
                    <th className="text-center">총량</th>
                    <th className="text-left">용법</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">
                        <div className="font-medium">{it.drug_name}</div>
                        {it.warning && (
                          <div className="text-[10px] text-rose-600 mt-0.5">⚠ {it.warning}</div>
                        )}
                      </td>
                      <td className="text-center tabular-nums">{it.dose_per_time}{it.dose_unit}</td>
                      <td className="text-center tabular-nums">{it.frequency_per_day}회</td>
                      <td className="text-center tabular-nums">{it.duration_days}일</td>
                      <td className="text-center tabular-nums">{it.total_quantity}</td>
                      <td className="text-xs text-slate-600">{it.usage_note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 디스펜스 액션 */}
            <div className="mt-6 flex items-center gap-2 print:hidden">
              {rx.status !== 'DISPENSED' && (
                <button
                  type="button"
                  onClick={onDispense}
                  disabled={dispensing}
                  className="btn-primary px-5 py-2.5 disabled:opacity-50"
                >
                  {dispensing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  조제 완료 처리 (F3)
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary px-4 py-2.5"
              >
                <Printer className="w-4 h-4" /> 인쇄 (F4)
              </button>
              <button
                type="button"
                onClick={onClear}
                className="btn-ghost px-4 py-2.5 text-sm"
              >
                새 처방 (F5)
              </button>
              {rx.dispensed_at && (
                <div className="ml-auto text-xs text-slate-500">
                  {new Date(rx.dispensed_at).toLocaleString('ko-KR')} · {rx.pharmacy_name}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* 도움말 모달 */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-3">단축키</h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['F2', '코드 입력 포커스'],
                  ['F3', '조제 완료 처리'],
                  ['F4', '인쇄'],
                  ['F5', '새 처방 (초기화)'],
                  ['F6', '약국명 입력 포커스'],
                  ['F8', 'DUR 경고 펼치기/접기'],
                  ['F12', '이 도움말'],
                  ['Enter', '코드 조회'],
                  ['Esc', '초기화 / 닫기'],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{k}</kbd>
                    </td>
                    <td className="py-2 text-slate-700">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setShowHelp(false)}
              className="btn-secondary w-full mt-4"
            >
              닫기 (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 flex items-center gap-1">{icon}{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  )
}

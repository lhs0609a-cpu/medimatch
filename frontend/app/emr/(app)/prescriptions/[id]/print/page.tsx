'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertTriangle } from 'lucide-react'
import { prescriptionService } from '@/lib/api/emr'

export default function PrescriptionPrintPage() {
  const params = useParams()
  const id = params.id as string

  const { data: rx, isLoading } = useQuery({
    queryKey: ['rx-print', id],
    queryFn: () => prescriptionService.get(id),
    enabled: !!id,
  })

  // 데이터 로드 완료되면 인쇄 다이얼로그 자동 호출
  useEffect(() => {
    if (rx) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [rx])

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!rx) return <div className="p-6 text-center">처방전을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-black print:p-4">
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { color: #000; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="text-center border-b-2 border-black pb-3 mb-5">
        <div className="text-xs">[별지 제9호 서식]</div>
        <h1 className="text-2xl font-bold mt-1">처 방 전</h1>
        <div className="text-xs text-gray-600 mt-1">의료법 시행규칙 제12조</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-xs text-gray-500">처방전 번호</div>
          <div className="font-mono">{rx.prescription_no}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">발행일</div>
          <div>{rx.prescribed_date}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">담당 의사</div>
          <div>{rx.doctor_name || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">사용 기간</div>
          <div>{rx.duration_days ? `${rx.duration_days}일` : '발급일로부터 7일'}</div>
        </div>
      </div>

      {rx.dur_warnings.length > 0 && (
        <div className="border-2 border-rose-600 rounded p-2 mb-4 text-xs">
          <div className="font-bold text-rose-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DUR 경고
          </div>
          {rx.dur_warnings.map((w: any, i: number) => (
            <div key={i} className="mt-1">· {w.message}</div>
          ))}
        </div>
      )}

      <table className="w-full border-2 border-black text-sm mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-black px-2 py-1.5 text-left">약품명</th>
            <th className="border border-black px-2 py-1.5 text-center w-16">1회분</th>
            <th className="border border-black px-2 py-1.5 text-center w-12">횟수</th>
            <th className="border border-black px-2 py-1.5 text-center w-12">일수</th>
            <th className="border border-black px-2 py-1.5 text-center w-16">총량</th>
            <th className="border border-black px-2 py-1.5 text-left">용법</th>
          </tr>
        </thead>
        <tbody>
          {rx.items.map((it, i) => (
            <tr key={i}>
              <td className="border border-black px-2 py-1.5">
                <div className="font-medium">{it.drug_name}</div>
                {it.ingredient && <div className="text-[10px] text-gray-600">{it.ingredient}</div>}
                {it.warning && <div className="text-[10px] text-rose-600 mt-0.5">⚠ {it.warning}</div>}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">{it.dose_per_time}{it.dose_unit}</td>
              <td className="border border-black px-2 py-1.5 text-center">{it.frequency_per_day}회</td>
              <td className="border border-black px-2 py-1.5 text-center">{it.duration_days}일</td>
              <td className="border border-black px-2 py-1.5 text-center font-medium">{it.total_quantity}{it.dose_unit}</td>
              <td className="border border-black px-2 py-1.5 text-xs">{it.usage_note || '식후 30분'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rx.patient_note && (
        <div className="border border-gray-400 p-2 text-xs mb-4">
          <div className="font-bold mb-1">환자 안내</div>
          <p>{rx.patient_note}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs mt-8 pt-4 border-t border-gray-400">
        <div>
          <div>· 본 처방전은 발행일로부터 7일간 유효합니다.</div>
          <div>· 같은 처방전으로 동일 약국에서 1회 조제 가능.</div>
          {rx.pharmacy_name && <div className="mt-1 font-medium">조제 약국: {rx.pharmacy_name}</div>}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-2">의사 서명</div>
          <div className="border-b border-black h-12 mb-1"></div>
          <div className="text-xs">{rx.doctor_name || ''}</div>
        </div>
      </div>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="btn-primary">인쇄 / PDF로 저장</button>
      </div>
    </div>
  )
}

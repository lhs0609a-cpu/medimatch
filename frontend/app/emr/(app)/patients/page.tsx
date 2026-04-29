'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Search, Plus, Phone, UserPlus, X, Loader2, Users, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface PatientItem {
  id: string
  chart_no?: string
  name: string
  phone?: string
  gender?: string
  birth_date?: string
  inflow_path?: string
  inbound_status?: string
  manager_name?: string
  appointment_date?: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'bg-amber-100 text-amber-700' },
  BOOKED: { label: '예약', color: 'bg-blue-100 text-blue-700' },
  HELD: { label: '보류', color: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: '취소', color: 'bg-rose-100 text-rose-700' },
  VISITED: { label: '내원', color: 'bg-green-100 text-green-700' },
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['patients-list', search, page],
    queryFn: async () => {
      const r = await apiClient.get('/emr/patients/', {
        params: { search: search || undefined, page, size: 20 },
      })
      return r.data as { items: PatientItem[]; total: number; is_demo?: boolean }
    },
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold">환자 관리</h1>
            <p className="text-sm text-muted-foreground">유입 · 상담 · 예약 · 동의 파이프라인</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" /> 신규 환자
        </button>
      </div>

      {data?.is_demo && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          데모 데이터 표시 중 — 실제 환자를 등록하면 자동으로 DB 데이터가 표시됩니다.
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-9"
              placeholder="이름·전화·차트번호 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{data?.total ?? 0}명</span>
        </div>

        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        {!isLoading && (data?.items.length ?? 0) === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>등록된 환자가 없습니다.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-3 inline-flex">
              <UserPlus className="w-4 h-4" /> 첫 환자 등록
            </button>
          </div>
        )}

        {!isLoading && (data?.items.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 px-2">차트번호</th>
                  <th className="py-2 px-2">이름</th>
                  <th className="py-2 px-2">성별·생년월일</th>
                  <th className="py-2 px-2">전화</th>
                  <th className="py-2 px-2">유입</th>
                  <th className="py-2 px-2">예약</th>
                  <th className="py-2 px-2 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    onClick={() => (window.location.href = `/emr/patients/${p.id}`)}
                  >
                    <td className="py-2 px-2 font-mono text-xs">{p.chart_no || '-'}</td>
                    <td className="py-2 px-2 font-medium">{p.name}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {p.gender || '-'} · {p.birth_date || '-'}
                    </td>
                    <td className="py-2 px-2 text-xs">{p.phone ? <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span> : '-'}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{p.inflow_path || '-'}</td>
                    <td className="py-2 px-2 text-xs">{p.appointment_date ? <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.appointment_date.slice(0, 10)}</span> : '-'}</td>
                    <td className="py-2 px-2 text-center">
                      {p.inbound_status && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_LABEL[p.inbound_status]?.color || 'bg-muted text-muted-foreground'}`}>
                          {STATUS_LABEL[p.inbound_status]?.label || p.inbound_status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(data?.total ?? 0) > 20 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost text-xs">이전</button>
            <span className="text-xs text-muted-foreground">{page} / {Math.ceil((data?.total ?? 0) / 20)}</span>
            <button disabled={page >= Math.ceil((data?.total ?? 0) / 20)} onClick={() => setPage((p) => p + 1)} className="btn-ghost text-xs">다음</button>
          </div>
        )}
      </div>

      {showForm && <NewPatientModal onClose={() => setShowForm(false)} onSuccess={() => {
        setShowForm(false)
        qc.invalidateQueries({ queryKey: ['patients-list'] })
      }} />}
    </div>
  )
}

function NewPatientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [chartNo, setChartNo] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [inflowPath, setInflowPath] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [managerName, setManagerName] = useState('')

  const createMut = useMutation({
    mutationFn: async () => {
      const r = await apiClient.post('/emr/patients/', {
        name,
        chart_no: chartNo || undefined,
        phone: phone || undefined,
        gender: gender || undefined,
        birth_date: birthDate || undefined,
        inflow_path: inflowPath || undefined,
        symptoms: symptoms || undefined,
        manager_name: managerName || undefined,
        inflow_date: new Date().toISOString().slice(0, 10),
        inbound_status: 'PENDING',
      })
      return r.data
    },
    onSuccess: () => {
      toast.success('환자 등록 완료')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || '등록 실패'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-xl max-w-lg w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5" /> 신규 환자 등록</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label text-xs">이름 *</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label text-xs">차트번호</label><input className="input" value={chartNo} onChange={(e) => setChartNo(e.target.value)} placeholder="C-20260429-001" /></div>
            <div><label className="label text-xs">전화</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" /></div>
            <div><label className="label text-xs">성별</label><select className="input" value={gender} onChange={(e) => setGender(e.target.value)}><option value="">선택</option><option value="M">남</option><option value="F">여</option></select></div>
            <div><label className="label text-xs">생년월일</label><input type="date" className="input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
            <div><label className="label text-xs">유입 경로</label><input className="input" value={inflowPath} onChange={(e) => setInflowPath(e.target.value)} placeholder="네이버 광고/소개/인스타그램..." /></div>
          </div>
          <div><label className="label text-xs">증상·주소</label><textarea className="input" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="환자가 호소한 증상 또는 내원 사유" /></div>
          <div><label className="label text-xs">담당 실장</label><input className="input" value={managerName} onChange={(e) => setManagerName(e.target.value)} /></div>
        </div>
        <button
          onClick={() => {
            if (!name) {
              toast.error('이름은 필수')
              return
            }
            createMut.mutate()
          }}
          disabled={createMut.isPending}
          className="btn-primary w-full"
        >
          {createMut.isPending ? '등록 중...' : '환자 등록'}
        </button>
      </div>
    </div>
  )
}

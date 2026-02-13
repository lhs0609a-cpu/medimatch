'use client'

import { useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { MonthlyRecord } from '../data/seed'

interface MonthlyInputProps {
  onSave: (record: MonthlyRecord) => void
  onClose: () => void
}

export default function MonthlyInput({ onSave, onClose }: MonthlyInputProps) {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [revenue, setRevenue] = useState('')
  const [patients, setPatients] = useState('')
  const [newPatients, setNewPatients] = useState('')
  const [insuranceRevenue, setInsuranceRevenue] = useState('')
  const [nonInsuranceRevenue, setNonInsuranceRevenue] = useState('')
  const [expenses, setExpenses] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const record: MonthlyRecord = {
      month,
      revenue: Number(revenue) || 0,
      patients: Number(patients) || 0,
      newPatients: Number(newPatients) || 0,
      insuranceRevenue: Number(insuranceRevenue) || 0,
      nonInsuranceRevenue: Number(nonInsuranceRevenue) || 0,
      expenses: Number(expenses) || 0,
    }
    onSave(record)
  }

  const fields = [
    { label: '월 매출 (만원)', value: revenue, onChange: setRevenue, placeholder: '5000' },
    { label: '총 환자수', value: patients, onChange: setPatients, placeholder: '1000' },
    { label: '신규 환자수', value: newPatients, onChange: setNewPatients, placeholder: '150' },
    { label: '보험 수익 (만원)', value: insuranceRevenue, onChange: setInsuranceRevenue, placeholder: '3200' },
    { label: '비보험 수익 (만원)', value: nonInsuranceRevenue, onChange: setNonInsuranceRevenue, placeholder: '1800' },
    { label: '월 지출 (만원)', value: expenses, onChange: setExpenses, placeholder: '2700' },
  ]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">월별 실적 입력</h3>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">기준 월</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <input
                type="number"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                className="input w-full"
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-primary w-full py-2.5 rounded-lg flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          저장
        </button>
      </form>
    </div>
  )
}

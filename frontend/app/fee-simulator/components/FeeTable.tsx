'use client'

import { SpecialtyFees } from '../data/fees'

interface FeeTableProps {
  specialty: SpecialtyFees
  filter: string
}

export default function FeeTable({ specialty, filter }: FeeTableProps) {
  const filtered = filter === 'all'
    ? specialty.fees
    : specialty.fees.filter((f) => f.category === filter)

  const categoryColors: Record<string, string> = {
    초진: 'badge-info',
    재진: 'badge-default',
    처치: 'badge-success',
    검사: 'badge-warning',
    비보험: 'badge-danger',
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">수가코드</th>
              <th className="text-left p-3 font-medium text-muted-foreground">항목명</th>
              <th className="text-center p-3 font-medium text-muted-foreground">구분</th>
              <th className="text-right p-3 font-medium text-muted-foreground">보험 수가</th>
              <th className="text-right p-3 font-medium text-muted-foreground">비보험 가격</th>
              <th className="text-center p-3 font-medium text-muted-foreground">본인부담</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((fee) => (
              <tr key={fee.code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono text-xs text-muted-foreground">{fee.code}</td>
                <td className="p-3 font-medium text-foreground">{fee.name}</td>
                <td className="p-3 text-center">
                  <span className={`${categoryColors[fee.category] || 'badge-default'} text-xs px-2 py-0.5 rounded-full`}>
                    {fee.category}
                  </span>
                </td>
                <td className="p-3 text-right text-foreground">
                  {fee.insuranceFee > 0 ? `${fee.insuranceFee.toLocaleString()}원` : '-'}
                </td>
                <td className="p-3 text-right text-foreground">
                  {fee.nonInsuranceFee ? `${fee.nonInsuranceFee.toLocaleString()}원` : '-'}
                </td>
                <td className="p-3 text-center text-muted-foreground">
                  {fee.selfPayRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">해당 카테고리에 수가 항목이 없습니다.</div>
      )}
    </div>
  )
}

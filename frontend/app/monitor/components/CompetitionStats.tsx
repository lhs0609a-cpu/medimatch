'use client'

import { Building2, TrendingUp, TrendingDown, Users, Activity } from 'lucide-react'
import { RegionStats } from '../data/seed'

interface CompetitionStatsProps {
  stats: RegionStats[]
}

export default function CompetitionStats({ stats }: CompetitionStatsProps) {
  const totalClinics = stats.reduce((s, r) => s + r.totalClinics, 0)
  const totalOpened = stats.reduce((s, r) => s + r.openedThisMonth, 0)
  const totalClosed = stats.reduce((s, r) => s + r.closedThisMonth, 0)
  const avgCompetition = stats.length > 0
    ? Math.round(stats.reduce((s, r) => s + r.competitionIndex, 0) / stats.length)
    : 0

  const summary = [
    { label: '총 의료기관', value: totalClinics.toLocaleString(), unit: '개', icon: Building2, color: '#3B82F6' },
    { label: '이번달 개원', value: totalOpened.toString(), unit: '곳', icon: TrendingUp, color: '#10B981' },
    { label: '이번달 폐원', value: totalClosed.toString(), unit: '곳', icon: TrendingDown, color: '#EF4444' },
    { label: '경쟁 지수', value: avgCompetition.toString(), unit: '/100', icon: Activity, color: '#F59E0B' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <Icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <p className="text-xl font-bold text-foreground">
                {item.value}<span className="text-sm font-normal text-muted-foreground ml-0.5">{item.unit}</span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Region table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground">지역별 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">지역</th>
                <th className="text-center p-3 font-medium text-muted-foreground">의료기관</th>
                <th className="text-center p-3 font-medium text-muted-foreground">개원</th>
                <th className="text-center p-3 font-medium text-muted-foreground">폐원</th>
                <th className="text-center p-3 font-medium text-muted-foreground">순증감</th>
                <th className="text-center p-3 font-medium text-muted-foreground">경쟁지수</th>
                <th className="text-center p-3 font-medium text-muted-foreground">만명당</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((r) => (
                <tr key={r.region} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{r.region}</td>
                  <td className="p-3 text-center">{r.totalClinics.toLocaleString()}</td>
                  <td className="p-3 text-center text-green-600">+{r.openedThisMonth}</td>
                  <td className="p-3 text-center text-red-500">-{r.closedThisMonth}</td>
                  <td className={`p-3 text-center font-medium ${r.netChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {r.netChange >= 0 ? '+' : ''}{r.netChange}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.competitionIndex}%`,
                            backgroundColor: r.competitionIndex >= 80 ? '#EF4444' : r.competitionIndex >= 60 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className="text-xs">{r.competitionIndex}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">{r.clinicsPer10k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

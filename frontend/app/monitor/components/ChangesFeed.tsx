'use client'

import { Building2, X, ArrowRight, Maximize2, Plus } from 'lucide-react'
import { CompetitorChange } from '../data/seed'

interface ChangesFeedProps {
  changes: CompetitorChange[]
  filter: string
}

const typeConfig = {
  open: { label: '개원', color: '#10B981', bgColor: 'bg-green-50 dark:bg-green-950/20', icon: Plus },
  close: { label: '폐원', color: '#EF4444', bgColor: 'bg-red-50 dark:bg-red-950/20', icon: X },
  move: { label: '이전', color: '#3B82F6', bgColor: 'bg-blue-50 dark:bg-blue-950/20', icon: ArrowRight },
  expand: { label: '확장', color: '#8B5CF6', bgColor: 'bg-purple-50 dark:bg-purple-950/20', icon: Maximize2 },
}

export default function ChangesFeed({ changes, filter }: ChangesFeedProps) {
  const filtered = filter === 'all' ? changes : changes.filter((c) => c.type === filter)

  return (
    <div className="card">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          최근 변동 피드
        </h3>
      </div>
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">해당 유형의 변동이 없습니다.</div>
        ) : (
          filtered.map((change) => {
            const config = typeConfig[change.type]
            const Icon = config.icon
            return (
              <div key={change.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bgColor}`}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{change.date}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm">{change.facilityName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {change.specialty} · {change.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{change.details}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

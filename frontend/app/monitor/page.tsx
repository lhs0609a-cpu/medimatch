'use client'

import { useState } from 'react'
import { ArrowLeft, Radar, Settings, Bell } from 'lucide-react'
import Link from 'next/link'
import { recentChanges, regionStats, defaultWatchRegions, WatchRegion } from './data/seed'
import CompetitionStats from './components/CompetitionStats'
import ChangesFeed from './components/ChangesFeed'
import WatchConfig from './components/WatchConfig'

const changeTypes = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '개원' },
  { value: 'close', label: '폐원' },
  { value: 'move', label: '이전' },
  { value: 'expand', label: '확장' },
]

export default function MonitorPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [showConfig, setShowConfig] = useState(false)
  const [watchRegions, setWatchRegions] = useState<WatchRegion[]>(defaultWatchRegions)

  const activeWatchCount = watchRegions.filter((r) => r.enabled).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Radar className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">경쟁 모니터링</h1>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="btn-secondary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 relative"
          >
            <Settings className="w-4 h-4" />
            관심 지역
            {activeWatchCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                {activeWatchCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Watch regions banner */}
        {activeWatchCount > 0 && (
          <div className="card p-3 mb-6 flex items-center gap-3 bg-primary/5 border-primary/20">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 flex flex-wrap gap-2">
              {watchRegions
                .filter((r) => r.enabled)
                .map((r) => (
                  <span key={r.id} className="badge-primary text-xs px-2 py-0.5 rounded-full">
                    {r.name} ({r.specialty})
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <CompetitionStats stats={regionStats} />

        {/* Changes feed */}
        <div className="mt-6">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {changeTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setTypeFilter(ct.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === ct.value
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
          <ChangesFeed changes={recentChanges} filter={typeFilter} />
        </div>
      </main>

      {/* Config modal */}
      {showConfig && (
        <WatchConfig
          regions={watchRegions}
          onUpdate={setWatchRegions}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}

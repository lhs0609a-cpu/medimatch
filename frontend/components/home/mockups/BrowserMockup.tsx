'use client'

import { ReactNode } from 'react'

interface Props {
  url?: string
  children: ReactNode
  className?: string
}

/**
 * 실제 브라우저 윈도우처럼 보이는 frame.
 * EMR 프로그램 목업을 안에 담아 "실제감" 부여.
 */
export function BrowserMockup({ url = 'medi.brandplaton.com/emr', children, className = '' }: Props) {
  return (
    <div className={`rounded-xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ${className}`}>
      {/* 윈도우 크롬 */}
      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 bg-white dark:bg-zinc-900 rounded px-2.5 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
          {url}
        </div>
      </div>
      {/* 콘텐츠 */}
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        {children}
      </div>
    </div>
  )
}

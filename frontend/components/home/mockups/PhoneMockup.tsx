'use client'

import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * 환자용 카톡 알림톡 화면 등을 담는 폰 frame.
 */
export function PhoneMockup({ children, className = '' }: Props) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: '240px' }}>
      {/* 폰 외곽 */}
      <div className="rounded-[2.2rem] bg-zinc-900 p-2 shadow-2xl">
        {/* 노치 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-900 rounded-b-2xl z-10" />
        {/* 화면 */}
        <div className="rounded-[1.8rem] bg-white dark:bg-zinc-950 overflow-hidden aspect-[9/19.5]">
          <div className="pt-7 px-3 pb-3 h-full overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

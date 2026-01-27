'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

// 기본 스켈레톤
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
    />
  )
}

// 텍스트 스켈레톤
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// 아바타 스켈레톤
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return <Skeleton className={cn(sizes[size], 'rounded-full', className)} />
}

// 버튼 스켈레톤
export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} />
}

// 카드 스켈레톤
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-start gap-4 mb-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

// 리스트 아이템 스켈레톤
export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border-b border-gray-100', className)}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  )
}

// 테이블 스켈레톤
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 p-4 border-b border-gray-100 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// 이미지 스켈레톤
export function SkeletonImage({
  aspectRatio = '16/9',
  className,
}: {
  aspectRatio?: string
  className?: string
}) {
  return (
    <Skeleton
      className={cn('w-full rounded-lg', className)}
      style={{ aspectRatio }}
    />
  )
}

// 매물 카드 스켈레톤
export function SkeletonBuildingCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      <SkeletonImage aspectRatio="4/3" className="rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}

// 파트너 카드 스켈레톤
export function SkeletonPartnerCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 p-6', className)}>
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

// 대시보드 통계 스켈레톤
export function SkeletonStat({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

// 프로필 헤더 스켈레톤
export function SkeletonProfileHeader({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <SkeletonAvatar size="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton

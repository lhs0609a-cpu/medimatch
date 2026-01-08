'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { bannerService } from '@/lib/api/services'

interface BannerSlotProps {
  position: 'HOME_TOP' | 'SIDEBAR' | 'SEARCH_RESULT' | 'PARTNERS_LIST' | 'CATEGORY_HEADER'
  className?: string
}

const positionSizes: Record<string, { width: number; height: number }> = {
  HOME_TOP: { width: 1920, height: 400 },
  SIDEBAR: { width: 300, height: 600 },
  SEARCH_RESULT: { width: 728, height: 90 },
  PARTNERS_LIST: { width: 400, height: 300 },
  CATEGORY_HEADER: { width: 1200, height: 300 },
}

export default function BannerSlot({ position, className = '' }: BannerSlotProps) {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`)
  const impressionRecorded = useRef(false)
  const size = positionSizes[position] || { width: 728, height: 90 }

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners', position],
    queryFn: () => bannerService.getBanners(position),
    staleTime: 60000, // 1 minute
  })

  const activeBanner = banners?.items?.[0]

  // Record impression when banner is visible
  useEffect(() => {
    if (activeBanner && !impressionRecorded.current) {
      impressionRecorded.current = true
      bannerService.recordImpression(activeBanner.id, sessionId).catch(() => {
        // Silently fail
      })
    }
  }, [activeBanner, sessionId])

  const handleClick = () => {
    if (activeBanner) {
      bannerService.recordClick(activeBanner.id, sessionId).catch(() => {
        // Silently fail
      })
    }
  }

  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 animate-pulse rounded-lg ${className}`}
        style={{ aspectRatio: `${size.width}/${size.height}` }}
      />
    )
  }

  if (!activeBanner) {
    return null
  }

  const BannerContent = (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ aspectRatio: `${size.width}/${size.height}` }}
    >
      <img
        src={activeBanner.image_url}
        alt={activeBanner.title}
        className="w-full h-full object-cover"
      />
      {/* Overlay with title */}
      {position === 'HOME_TOP' && activeBanner.subtitle && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white">
            <h3 className="text-xl font-bold">{activeBanner.title}</h3>
            <p className="text-sm opacity-80">{activeBanner.subtitle}</p>
          </div>
        </div>
      )}
      {/* Ad label */}
      <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
        AD
      </span>
    </div>
  )

  if (activeBanner.link_url) {
    return (
      <Link
        href={activeBanner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        {BannerContent}
      </Link>
    )
  }

  return BannerContent
}

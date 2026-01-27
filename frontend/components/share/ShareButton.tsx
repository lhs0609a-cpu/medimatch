'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react'
import { useShare, type ShareData, type SharePlatform } from '@/hooks/useShare'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  data: ShareData
  className?: string
  variant?: 'button' | 'icon' | 'dropdown'
  platforms?: SharePlatform[]
  onShare?: (platform: SharePlatform, success: boolean) => void
}

const platformConfig: Record<SharePlatform, { icon: React.ElementType; label: string; color: string }> = {
  native: { icon: Share2, label: '공유', color: 'text-foreground' },
  kakao: { icon: MessageCircle, label: '카카오톡', color: 'text-[#FEE500]' },
  facebook: { icon: Facebook, label: '페이스북', color: 'text-[#1877F2]' },
  twitter: { icon: Twitter, label: '트위터', color: 'text-[#1DA1F2]' },
  linkedin: { icon: Linkedin, label: '링크드인', color: 'text-[#0A66C2]' },
  copy: { icon: Copy, label: '링크 복사', color: 'text-foreground' },
}

const defaultPlatforms: SharePlatform[] = ['kakao', 'facebook', 'twitter', 'copy']

export function ShareButton({
  data,
  className,
  variant = 'dropdown',
  platforms = defaultPlatforms,
  onShare,
}: ShareButtonProps) {
  const { share, canShare, isSharing } = useShare()
  const [isOpen, setIsOpen] = useState(false)
  const [copiedSuccess, setCopiedSuccess] = useState(false)

  const handleShare = async (platform: SharePlatform) => {
    const success = await share(platform, data)

    if (platform === 'copy' && success) {
      setCopiedSuccess(true)
      setTimeout(() => setCopiedSuccess(false), 2000)
    }

    onShare?.(platform, success)
    setIsOpen(false)
  }

  // 단일 버튼 (네이티브 공유 또는 복사)
  if (variant === 'button') {
    const handleClick = () => {
      if (canShare) {
        handleShare('native')
      } else {
        handleShare('copy')
      }
    }

    return (
      <button
        onClick={handleClick}
        disabled={isSharing}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <Share2 className="w-4 h-4" />
        공유하기
      </button>
    )
  }

  // 아이콘만 표시
  if (variant === 'icon') {
    return (
      <button
        onClick={() => (canShare ? handleShare('native') : setIsOpen(!isOpen))}
        disabled={isSharing}
        className={cn(
          'p-2 hover:bg-secondary rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        aria-label="공유하기"
      >
        <Share2 className="w-5 h-5" />
      </button>
    )
  }

  // 드롭다운
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSharing}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Share2 className="w-4 h-4" />
        공유하기
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 py-2 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[160px] animate-scale-in">
            {platforms.map((platform) => {
              const config = platformConfig[platform]
              const Icon = config.icon
              const isCopy = platform === 'copy'

              return (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left"
                >
                  {isCopy && copiedSuccess ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Icon className={cn('w-5 h-5', config.color)} />
                  )}
                  <span className="text-sm">
                    {isCopy && copiedSuccess ? '복사됨!' : config.label}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default ShareButton

'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Facebook, Twitter, Linkedin, MessageCircle, Link2 } from 'lucide-react'
import { useShare, type ShareData, type SharePlatform } from '@/hooks/useShare'
import { cn } from '@/lib/utils'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  data: ShareData
  onShare?: (platform: SharePlatform, success: boolean) => void
}

const platforms: { platform: SharePlatform; icon: React.ElementType; label: string; bgColor: string }[] = [
  { platform: 'kakao', icon: MessageCircle, label: '카카오톡', bgColor: 'bg-[#FEE500] hover:bg-[#FDD835]' },
  { platform: 'facebook', icon: Facebook, label: '페이스북', bgColor: 'bg-[#1877F2] hover:bg-[#166FE5] text-white' },
  { platform: 'twitter', icon: Twitter, label: '트위터', bgColor: 'bg-[#1DA1F2] hover:bg-[#1A94DA] text-white' },
  { platform: 'linkedin', icon: Linkedin, label: '링크드인', bgColor: 'bg-[#0A66C2] hover:bg-[#004182] text-white' },
]

export function ShareModal({ isOpen, onClose, data, onShare }: ShareModalProps) {
  const { share, isSharing } = useShare()
  const [copiedSuccess, setCopiedSuccess] = useState(false)

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleShare = async (platform: SharePlatform) => {
    const success = await share(platform, data)
    onShare?.(platform, success)

    if (platform === 'copy' && success) {
      setCopiedSuccess(true)
      setTimeout(() => {
        setCopiedSuccess(false)
      }, 2000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md pointer-events-auto animate-slide-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold">공유하기</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Preview */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start gap-3">
              {data.imageUrl && (
                <img
                  src={data.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{data.title}</h4>
                {data.text && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{data.text}</p>
                )}
              </div>
            </div>
          </div>

          {/* Share Platforms */}
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {platforms.map(({ platform, icon: Icon, label, bgColor }) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  disabled={isSharing}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                      bgColor,
                      'disabled:opacity-50'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Copy */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{data.url}</span>
              </div>
              <button
                onClick={() => handleShare('copy')}
                disabled={isSharing}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  copiedSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {copiedSuccess ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    복사됨
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="w-4 h-4" />
                    복사
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShareModal

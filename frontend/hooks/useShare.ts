'use client'

import { useCallback, useState } from 'react'

export interface ShareData {
  title: string
  text?: string
  url: string
  imageUrl?: string
}

export type SharePlatform = 'native' | 'kakao' | 'facebook' | 'twitter' | 'linkedin' | 'copy'

interface UseShareReturn {
  share: (platform: SharePlatform, data: ShareData) => Promise<boolean>
  canShare: boolean
  isSharing: boolean
  copyToClipboard: (text: string) => Promise<boolean>
}

export function useShare(): UseShareReturn {
  const [isSharing, setIsSharing] = useState(false)

  // Web Share API 지원 여부
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  // 클립보드 복사
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      }

      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (error) {
      console.error('[Share] Failed to copy to clipboard:', error)
      return false
    }
  }, [])

  // 공유 함수
  const share = useCallback(
    async (platform: SharePlatform, data: ShareData): Promise<boolean> => {
      setIsSharing(true)

      try {
        const { title, text, url, imageUrl } = data
        const encodedUrl = encodeURIComponent(url)
        const encodedTitle = encodeURIComponent(title)
        const encodedText = encodeURIComponent(text || '')

        switch (platform) {
          case 'native': {
            if (canShare) {
              await navigator.share({
                title,
                text: text || title,
                url,
              })
              return true
            }
            return false
          }

          case 'kakao': {
            // 카카오톡 공유 (Kakao SDK 필요)
            if (typeof window !== 'undefined' && (window as any).Kakao?.Share) {
              (window as any).Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                  title,
                  description: text || '',
                  imageUrl: imageUrl || '',
                  link: {
                    mobileWebUrl: url,
                    webUrl: url,
                  },
                },
                buttons: [
                  {
                    title: '자세히 보기',
                    link: {
                      mobileWebUrl: url,
                      webUrl: url,
                    },
                  },
                ],
              })
              return true
            }
            // Kakao SDK가 없으면 모바일 앱으로 시도
            const kakaoUrl = `https://story.kakao.com/share?url=${encodedUrl}`
            window.open(kakaoUrl, '_blank', 'width=600,height=400')
            return true
          }

          case 'facebook': {
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
            window.open(fbUrl, '_blank', 'width=600,height=400')
            return true
          }

          case 'twitter': {
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
            window.open(twitterUrl, '_blank', 'width=600,height=400')
            return true
          }

          case 'linkedin': {
            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
            window.open(linkedinUrl, '_blank', 'width=600,height=400')
            return true
          }

          case 'copy': {
            const shareText = `${title}\n${url}`
            return await copyToClipboard(shareText)
          }

          default:
            return false
        }
      } catch (error) {
        console.error('[Share] Failed to share:', error)
        return false
      } finally {
        setIsSharing(false)
      }
    },
    [canShare, copyToClipboard]
  )

  return { share, canShare, isSharing, copyToClipboard }
}

export default useShare

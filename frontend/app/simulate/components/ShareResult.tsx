'use client'

import React, { useState } from 'react'
import { Share2, Link2, Check, MessageCircle } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface ShareResultProps {
  result: SimulationResponse
}

function formatMoney(v: number): string {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function ShareResult({ result }: ShareResultProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const shareTitle = `${result.clinic_type} 개원 시뮬레이션 결과`
  const shareText = [
    `${result.address} ${result.clinic_type} 개원 시뮬레이션`,
    `예상 월매출: ~${formatMoney(result.estimated_monthly_revenue.avg)}원`,
    `예상 월이익: ~${formatMoney(result.profitability.monthly_profit_avg)}원`,
    `신뢰도: ${result.confidence_score}/100`,
  ].join('\n')

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: create temp textarea
      const ta = document.createElement('textarea')
      ta.value = `${shareText}\n\n${shareUrl}`
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
    setShowMenu(false)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
      } catch {
        // user cancelled
      }
    }
    setShowMenu(false)
  }

  const handleKakaoShare = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=javascript_key&url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    // Fallback: Kakao scheme or just copy
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
      if (isMobile) {
        const kakaoScheme = `kakaolink://send?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        window.location.href = kakaoScheme
        // fallback after timeout
        setTimeout(() => handleCopyLink(), 1500)
      } else {
        handleCopyLink()
      }
    }
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            handleNativeShare()
          } else {
            setShowMenu(!showMenu)
          }
        }}
        className="btn-secondary text-sm"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
        {copied ? '복사됨!' : '공유'}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-1.5 min-w-[180px] animate-scale-in">
            <button
              onClick={handleKakaoShare}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-amber-500" />
              카카오톡 공유
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors"
            >
              <Link2 className="w-4 h-4 text-blue-500" />
              링크 복사
            </button>
          </div>
        </>
      )}
    </div>
  )
}

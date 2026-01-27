'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lock, Eye } from 'lucide-react'

interface BlurredListingImageProps {
  src: string
  alt: string
  className?: string
  isUnlocked?: boolean
  overlayText?: string
  showUnlockHint?: boolean
}

/**
 * 블러 처리된 매물 이미지 컴포넌트
 * - 비로그인/무료 회원: 블러 처리
 * - 유료 회원/문의 완료: 선명하게 표시
 */
export function BlurredListingImage({
  src,
  alt,
  className = '',
  isUnlocked = false,
  overlayText = '상세 정보는 문의 후 확인 가능',
  showUnlockHint = true,
}: BlurredListingImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // 이미지 로드 실패 시 폴백
  if (hasError) {
    return (
      <div className={`bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span className="text-xs">이미지 준비중</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 실제 이미지 - 블러 적용 */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-all duration-300 ${
          isUnlocked ? '' : 'blur-lg scale-105'
        } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* 로딩 중 스켈레톤 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/50 animate-pulse" />
      )}

      {/* 블러 오버레이 (잠금 상태일 때) */}
      {!isUnlocked && isLoaded && showUnlockHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 text-white text-sm">
            <Lock className="w-4 h-4" />
            <span>{overlayText}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 로컬 건물/병원 이미지 (실제 한국 메디컬빌딩 및 병원 인테리어)
export const buildingListingImages = [
  '/images/listings/building-01.jpg', // 병원 대기실 인테리어
  '/images/listings/building-02.jpg', // 고급 로비 (샹들리에)
  '/images/listings/building-03.jpg', // 모던 로비 인테리어
  '/images/listings/building-04.jpg', // 병원 내부
  '/images/listings/building-05.png', // 외과 접수대
  '/images/listings/building-06.png', // 시술실/진료실
  '/images/listings/building-07.png', // 건물 외관 (블루 글라스)
  '/images/listings/building-08.png', // 건물 외관 (모던 상가)
  '/images/listings/building-09.png', // 병원 인테리어
  '/images/listings/building-10.png', // 병원 복도 (채혈실)
  '/images/listings/building-11.png', // 병원 복도 (엘리베이터)
  '/images/listings/building-12.png', // 인테리어 공사중
  '/images/listings/building-13.png', // 공사 현장
  '/images/listings/building-14.png', // 건물 외관 (상업빌딩)
  '/images/listings/building-15.png', // 병원 인테리어
  '/images/listings/building-16.png', // 접수대
]

// 약국용 이미지 (병원 이미지 일부 재활용 + 상점 느낌)
export const pharmacyListingImages = [
  '/images/listings/building-05.png', // 접수대 (약국 카운터와 유사)
  '/images/listings/building-09.png', // 내부 인테리어
  '/images/listings/building-10.png', // 복도/공간
  '/images/listings/building-06.png', // 진료/조제 공간
  '/images/listings/building-08.png', // 상가 건물 외관
  '/images/listings/building-14.png', // 상업 빌딩
  '/images/listings/building-01.jpg', // 대기 공간
  '/images/listings/building-03.jpg', // 로비
]

// 기존 코드 호환성을 위한 별칭
export const unsplashBuildingImages = buildingListingImages
export const unsplashPharmacyImages = pharmacyListingImages

// 랜덤 이미지 선택 함수
export function getRandomBuildingImage(index?: number): string {
  if (index !== undefined) {
    return buildingListingImages[index % buildingListingImages.length]
  }
  return buildingListingImages[Math.floor(Math.random() * buildingListingImages.length)]
}

export function getRandomPharmacyImage(index?: number): string {
  if (index !== undefined) {
    return pharmacyListingImages[index % pharmacyListingImages.length]
  }
  return pharmacyListingImages[Math.floor(Math.random() * pharmacyListingImages.length)]
}

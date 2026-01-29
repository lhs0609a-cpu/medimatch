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
  // 기존 이미지
  '/images/listings/building-01.jpg',
  '/images/listings/building-02.jpg',
  '/images/listings/building-03.jpg',
  '/images/listings/building-04.jpg',
  '/images/listings/building-05.png',
  '/images/listings/building-06.png',
  '/images/listings/building-07.png',
  '/images/listings/building-08.png',
  '/images/listings/building-09.png',
  '/images/listings/building-10.png',
  '/images/listings/building-11.png',
  '/images/listings/building-12.png',
  '/images/listings/building-13.png',
  '/images/listings/building-14.png',
  '/images/listings/building-15.png',
  '/images/listings/building-16.png',
  // 새로운 병원 이미지 (블러 처리됨)
  '/images/listings/hospital-01.jpg',
  '/images/listings/hospital-02.jpg',
  '/images/listings/hospital-03.jpg',
  '/images/listings/hospital-04.jpg',
  '/images/listings/hospital-05.jpg',
  '/images/listings/hospital-06.jpg',
  '/images/listings/hospital-07.jpg',
  '/images/listings/hospital-08.jpg',
  '/images/listings/hospital-09.jpg',
  '/images/listings/hospital-10.jpg',
  '/images/listings/hospital-11.jpg',
  '/images/listings/hospital-12.jpg',
  '/images/listings/hospital-13.jpg',
  '/images/listings/hospital-14.jpg',
  '/images/listings/hospital-15.jpg',
  '/images/listings/hospital-16.jpg',
  '/images/listings/hospital-17.jpg',
  '/images/listings/hospital-18.jpg',
  '/images/listings/hospital-19.jpg',
  '/images/listings/hospital-20.jpg',
  '/images/listings/hospital-21.jpg',
  '/images/listings/hospital-22.jpg',
  '/images/listings/hospital-23.jpg',
  '/images/listings/hospital-24.jpg',
  '/images/listings/hospital-25.jpg',
  '/images/listings/hospital-26.jpg',
  '/images/listings/hospital-27.jpg',
  '/images/listings/hospital-28.jpg',
  '/images/listings/hospital-29.jpg',
  '/images/listings/hospital-30.jpg',
  '/images/listings/hospital-31.jpg',
  '/images/listings/hospital-32.jpg',
  '/images/listings/hospital-33.jpg',
  '/images/listings/hospital-34.jpg',
  '/images/listings/hospital-35.jpg',
  '/images/listings/hospital-36.jpg',
  '/images/listings/hospital-37.jpg',
  '/images/listings/hospital-38.jpg',
]

// 약국용 이미지 (블러 처리된 약국 전용 이미지)
export const pharmacyListingImages = [
  '/images/listings/pharmacy-01.jpg',
  '/images/listings/pharmacy-02.jpg',
  '/images/listings/pharmacy-03.jpg',
  '/images/listings/pharmacy-04.jpg',
  '/images/listings/pharmacy-05.jpg',
  '/images/listings/pharmacy-06.jpg',
  '/images/listings/pharmacy-07.jpg',
  '/images/listings/pharmacy-08.jpg',
  '/images/listings/pharmacy-09.jpg',
  '/images/listings/pharmacy-10.jpg',
  '/images/listings/pharmacy-11.jpg',
  '/images/listings/pharmacy-12.jpg',
  '/images/listings/pharmacy-13.jpg',
  '/images/listings/pharmacy-14.jpg',
  '/images/listings/pharmacy-15.jpg',
  '/images/listings/pharmacy-16.jpg',
  '/images/listings/pharmacy-17.jpg',
  '/images/listings/pharmacy-18.jpg',
  '/images/listings/pharmacy-19.jpg',
  '/images/listings/pharmacy-20.jpg',
  '/images/listings/pharmacy-21.jpg',
  '/images/listings/pharmacy-22.jpg',
  '/images/listings/pharmacy-23.jpg',
  '/images/listings/pharmacy-24.jpg',
  '/images/listings/pharmacy-25.jpg',
  '/images/listings/pharmacy-26.jpg',
  '/images/listings/pharmacy-27.jpg',
  '/images/listings/pharmacy-28.jpg',
  '/images/listings/pharmacy-29.jpg',
  '/images/listings/pharmacy-30.jpg',
  '/images/listings/pharmacy-31.jpg',
  '/images/listings/pharmacy-32.jpg',
  '/images/listings/pharmacy-33.jpg',
  '/images/listings/pharmacy-34.jpg',
  '/images/listings/pharmacy-35.jpg',
  '/images/listings/pharmacy-36.jpg',
  '/images/listings/pharmacy-37.jpg',
  '/images/listings/pharmacy-38.jpg',
  '/images/listings/pharmacy-39.jpg',
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

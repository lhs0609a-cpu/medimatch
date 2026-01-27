'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: string
  aspectRatio?: '1/1' | '4/3' | '16/9' | '3/2' | '2/1'
  showSkeleton?: boolean
}

/**
 * Next.js Image를 래핑한 최적화된 이미지 컴포넌트
 * - 자동 WebP/AVIF 변환
 * - Lazy loading (기본)
 * - 에러 시 폴백 이미지
 * - 로딩 스켈레톤
 * - 반응형 크기 지원
 */
export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.png',
  aspectRatio,
  showSkeleton = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const imageSrc = hasError ? fallback : src

  const aspectRatioStyles: Record<string, string> = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '3/2': 'aspect-[3/2]',
    '2/1': 'aspect-[2/1]',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
        aspectRatio && aspectRatioStyles[aspectRatio],
        className
      )}
    >
      {/* 로딩 스켈레톤 */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        {...props}
      />
    </div>
  )
}

/**
 * 배경 이미지용 최적화 컴포넌트
 */
export function OptimizedBackgroundImage({
  src,
  alt,
  children,
  className,
  overlay = false,
  ...props
}: OptimizedImageProps & { children?: React.ReactNode; overlay?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        {...props}
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  )
}

/**
 * 아바타 이미지용 최적화 컴포넌트
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
  fallbackText,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallbackText?: string
}) {
  const [hasError, setHasError] = useState(false)

  const sizes = {
    xs: { className: 'w-6 h-6', pixels: 24 },
    sm: { className: 'w-8 h-8', pixels: 32 },
    md: { className: 'w-10 h-10', pixels: 40 },
    lg: { className: 'w-12 h-12', pixels: 48 },
    xl: { className: 'w-16 h-16', pixels: 64 },
  }

  const { className: sizeClassName, pixels } = sizes[size]

  if (hasError || !src) {
    return (
      <div
        className={cn(
          sizeClassName,
          'rounded-full bg-primary/10 flex items-center justify-center',
          className
        )}
      >
        <span className="text-primary font-medium text-sm">
          {fallbackText?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(sizeClassName, 'relative rounded-full overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={pixels}
        height={pixels}
        className="object-cover"
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  )
}

export default OptimizedImage

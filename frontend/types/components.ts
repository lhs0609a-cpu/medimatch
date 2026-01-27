/**
 * 메디플라톤 컴포넌트 Props 타입 정의
 *
 * 이 파일은 프로젝트의 주요 재사용 컴포넌트들의 Props 타입을 정의합니다.
 * 새로운 컴포넌트 추가 시 여기에 타입을 정의하세요.
 */

import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'

// ============================================================================
// Common Types
// ============================================================================

/** 컴포넌트 크기 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 컴포넌트 변형 */
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'

/** 상태 타입 */
export type StatusType = 'idle' | 'loading' | 'success' | 'error'

// ============================================================================
// Animation Components
// ============================================================================

/** FadeIn 컴포넌트 Props */
export interface FadeInProps {
  /** 자식 요소 */
  children: ReactNode
  /** 추가 CSS 클래스 */
  className?: string
  /** 애니메이션 방향 */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** 애니메이션 지연 시간 (ms) */
  delay?: number
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 한 번만 트리거할지 여부 */
  triggerOnce?: boolean
  /** Intersection Observer 임계값 */
  threshold?: number
  /** 렌더링할 HTML 태그 */
  as?: keyof JSX.IntrinsicElements
}

/** CountUp 컴포넌트 Props */
export interface CountUpProps {
  /** 최종 숫자 */
  end: number
  /** 시작 숫자 */
  start?: number
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 시작 지연 시간 (ms) */
  delay?: number
  /** 소수점 자릿수 */
  decimals?: number
  /** 숫자 앞에 붙는 문자 (예: "$") */
  prefix?: string
  /** 숫자 뒤에 붙는 문자 (예: "원") */
  suffix?: string
  /** 천 단위 구분자 */
  separator?: string
  /** 추가 CSS 클래스 */
  className?: string
  /** 한 번만 트리거할지 여부 */
  triggerOnce?: boolean
}

/** HoverCard 컴포넌트 Props */
export interface HoverCardProps {
  children: ReactNode
  className?: string
  /** 호버 효과 종류 */
  effect?: 'lift' | 'glow' | 'border' | 'scale' | 'tilt' | Array<'lift' | 'glow' | 'border' | 'scale' | 'tilt'>
  /** 렌더링할 HTML 태그 */
  as?: keyof JSX.IntrinsicElements
}

// ============================================================================
// Form Components
// ============================================================================

/** FormInput 컴포넌트 Props */
export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 라벨 텍스트 */
  label?: string
  /** 에러 메시지 */
  error?: string
  /** 도움말 텍스트 */
  helperText?: string
  /** 입력 필드 크기 */
  size?: ComponentSize
  /** 왼쪽 아이콘 */
  leftIcon?: ReactNode
  /** 오른쪽 아이콘 */
  rightIcon?: ReactNode
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean
}

/** FormSelect 컴포넌트 Props */
export interface FormSelectProps {
  /** 라벨 텍스트 */
  label?: string
  /** 에러 메시지 */
  error?: string
  /** 도움말 텍스트 */
  helperText?: string
  /** 선택 옵션 목록 */
  options: Array<{ value: string; label: string; disabled?: boolean }>
  /** 현재 선택된 값 */
  value?: string
  /** 값 변경 핸들러 */
  onChange?: (value: string) => void
  /** 플레이스홀더 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 필수 입력 여부 */
  required?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/** FormTextarea 컴포넌트 Props */
export interface FormTextareaProps extends HTMLAttributes<HTMLTextAreaElement> {
  /** 라벨 텍스트 */
  label?: string
  /** 에러 메시지 */
  error?: string
  /** 도움말 텍스트 */
  helperText?: string
  /** 최대 글자 수 */
  maxLength?: number
  /** 현재 글자 수 표시 여부 */
  showCount?: boolean
  /** 자동 높이 조절 여부 */
  autoResize?: boolean
  /** 최소 행 수 */
  minRows?: number
  /** 최대 행 수 */
  maxRows?: number
}

// ============================================================================
// Common Components
// ============================================================================

/** Skeleton 컴포넌트 Props */
export interface SkeletonProps {
  /** 너비 (px 또는 CSS 값) */
  width?: string | number
  /** 높이 (px 또는 CSS 값) */
  height?: string | number
  /** 원형 여부 */
  circle?: boolean
  /** 모서리 둥글기 */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 추가 CSS 클래스 */
  className?: string
  /** 애니메이션 여부 */
  animate?: boolean
}

/** ErrorBoundary 컴포넌트 Props */
export interface ErrorBoundaryProps {
  children: ReactNode
  /** 에러 발생 시 표시할 폴백 UI */
  fallback?: ReactNode
  /** 에러 발생 시 호출되는 콜백 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** 재시도 버튼 표시 여부 */
  showRetry?: boolean
}

/** OptimizedImage 컴포넌트 Props */
export interface OptimizedImageProps {
  /** 이미지 URL */
  src: string
  /** 대체 텍스트 */
  alt: string
  /** 너비 */
  width?: number
  /** 높이 */
  height?: number
  /** 화면 채우기 여부 */
  fill?: boolean
  /** 우선 로딩 여부 */
  priority?: boolean
  /** 이미지 품질 (1-100) */
  quality?: number
  /** 추가 CSS 클래스 */
  className?: string
  /** 로딩 방식 */
  loading?: 'lazy' | 'eager'
  /** 객체 맞춤 방식 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  /** 객체 위치 */
  objectPosition?: string
  /** 플레이스홀더 타입 */
  placeholder?: 'blur' | 'empty'
  /** blur 플레이스홀더용 데이터 URL */
  blurDataURL?: string
}

// ============================================================================
// PWA Components
// ============================================================================

/** InstallPrompt 컴포넌트 Props */
export interface InstallPromptProps {
  /** 표시 지연 시간 (ms) */
  delay?: number
}

// ============================================================================
// Theme Components
// ============================================================================

/** ThemeToggle 컴포넌트 Props */
export interface ThemeToggleProps {
  /** 추가 CSS 클래스 */
  className?: string
  /** 버튼 크기 */
  size?: ComponentSize
  /** 라벨 표시 여부 */
  showLabel?: boolean
}

// ============================================================================
// Analytics
// ============================================================================

/** WebVitalsReporter 컴포넌트 Props */
export interface WebVitalsReporterProps {
  /** 메트릭 보고 콜백 */
  onReport?: (metric: {
    id: string
    name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    delta: number
    navigationType: string
  }) => void
  /** 디버그 모드 */
  debug?: boolean
}

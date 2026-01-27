'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 bg-red-50 rounded-xl text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-red-900 mb-2">
            컴포넌트 로딩 중 오류가 발생했습니다
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {this.state.error?.message || '알 수 없는 오류'}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 함수형 컴포넌트를 위한 HOC
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

// 커스텀 폴백 컴포넌트
interface ErrorFallbackProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorFallback({
  title = '문제가 발생했습니다',
  description = '잠시 후 다시 시도해주세요.',
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 rounded-xl text-center">
      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <h3 className="font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-sm text-red-700 mb-4">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      )}
    </div>
  )
}

export default ErrorBoundary

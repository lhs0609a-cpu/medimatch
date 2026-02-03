'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showHomeLink?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              문제가 발생했습니다
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              페이지를 불러오는 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>
              {this.props.showHomeLink !== false && (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Home className="w-4 h-4" />
                  홈으로
                </Link>
              )}
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-1">
                  <ChevronDown className="w-4 h-4" />
                  개발자 정보
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs font-mono overflow-auto max-h-32 bg-red-100 dark:bg-red-900/30 p-2 rounded text-red-600 dark:text-red-400">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <p className="mt-5 text-xs text-muted-foreground">
              문제가 지속되면{' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                고객센터
              </Link>
              로 문의해주세요.
            </p>
          </div>
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
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
      <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-3" />
      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">{title}</h3>
      <p className="text-sm text-red-700 dark:text-red-300 mb-4">{description}</p>
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

// 섹션별 작은 에러 바운더리
export function SectionErrorBoundary({
  children,
  sectionName,
}: {
  children: ReactNode
  sectionName?: string
}) {
  return (
    <ErrorBoundary
      showHomeLink={false}
      fallback={
        <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {sectionName ? `${sectionName}을(를) 불러올 수 없습니다` : '이 섹션을 불러올 수 없습니다'}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary

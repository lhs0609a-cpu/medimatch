'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCharCount?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      hint,
      showCharCount = false,
      className,
      id,
      disabled,
      required,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name
    const hasError = !!error
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="space-y-1.5">
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 텍스트에리어 */}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            value={value}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors resize-y min-h-[100px]',
              hasError
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-border focus:ring-primary/20 focus:border-primary',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${textareaId}-error`
                : hint
                ? `${textareaId}-hint`
                : undefined
            }
            {...props}
          />

          {/* 에러 아이콘 */}
          {hasError && (
            <AlertCircle className="absolute top-3 right-3 w-5 h-5 text-red-500" />
          )}
        </div>

        {/* 하단 정보 */}
        <div className="flex justify-between items-center">
          <div>
            {/* 에러 메시지 */}
            {error && (
              <p
                id={`${textareaId}-error`}
                className="text-sm text-red-500"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* 힌트 */}
            {hint && !error && (
              <p
                id={`${textareaId}-hint`}
                className="text-sm text-muted-foreground"
              >
                {hint}
              </p>
            )}
          </div>

          {/* 글자 수 */}
          {showCharCount && maxLength && (
            <p
              className={cn(
                'text-sm',
                charCount >= maxLength
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

export default FormTextarea

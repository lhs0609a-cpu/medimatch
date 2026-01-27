'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
  showValidation?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      showValidation = true,
      className,
      type,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || props.name

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className="space-y-1.5">
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 입력 필드 */}
        <div className="relative">
          {/* 왼쪽 아이콘 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-background text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              hasError
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : hasSuccess
                ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                : 'border-border focus:ring-primary/20 focus:border-primary',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : hint
                ? `${inputId}-hint`
                : undefined
            }
            {...props}
          />

          {/* 오른쪽 아이콘 / 비밀번호 토글 / 유효성 아이콘 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showValidation && hasError && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {showValidation && hasSuccess && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
            {rightIcon && !isPassword && rightIcon}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 성공 메시지 */}
        {success && !error && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            {success}
          </p>
        )}

        {/* 힌트 */}
        {hint && !error && !success && (
          <p
            id={`${inputId}-hint`}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput

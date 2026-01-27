'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder = '선택하세요',
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name
    const hasError = !!error

    return (
      <div className="space-y-1.5">
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 셀렉트 필드 */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full px-4 py-2.5 pr-10 rounded-lg border bg-background text-foreground',
              'appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors',
              hasError
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-border focus:ring-primary/20 focus:border-primary',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* 드롭다운 아이콘 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            {hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 힌트 */}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'

export default FormSelect

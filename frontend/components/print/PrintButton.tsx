'use client'

import { Printer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrintButtonProps {
  className?: string
  variant?: 'button' | 'icon' | 'text'
  label?: string
  onBeforePrint?: () => void
  onAfterPrint?: () => void
}

export function PrintButton({
  className,
  variant = 'button',
  label = '인쇄',
  onBeforePrint,
  onAfterPrint,
}: PrintButtonProps) {
  const handlePrint = () => {
    onBeforePrint?.()

    // 인쇄 후 콜백 설정
    if (onAfterPrint) {
      const afterPrintHandler = () => {
        onAfterPrint()
        window.removeEventListener('afterprint', afterPrintHandler)
      }
      window.addEventListener('afterprint', afterPrintHandler)
    }

    window.print()
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePrint}
        className={cn(
          'p-2 hover:bg-secondary rounded-lg transition-colors print-button no-print',
          className
        )}
        aria-label="인쇄"
      >
        <Printer className="w-5 h-5" />
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handlePrint}
        className={cn(
          'text-sm text-muted-foreground hover:text-foreground transition-colors no-print',
          className
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handlePrint}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors print-button no-print',
        className
      )}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  )
}

export default PrintButton

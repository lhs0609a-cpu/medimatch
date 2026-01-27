'use client'

import { cn } from '@/lib/utils'

interface PulseButtonProps {
  children: React.ReactNode
  className?: string
  pulseColor?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function PulseButton({
  children,
  className,
  pulseColor = 'rgba(59, 130, 246, 0.4)',
  onClick,
  disabled,
  type = 'button',
}: PulseButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 rounded-inherit animate-ping-slow opacity-75"
        style={{ backgroundColor: pulseColor }}
      />
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center w-full h-full">
        {children}
      </span>
    </button>
  )
}

export default PulseButton

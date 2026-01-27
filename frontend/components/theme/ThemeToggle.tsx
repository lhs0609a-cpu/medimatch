'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5" />
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="w-5 h-5" />
    ) : (
      <Sun className="w-5 h-5" />
    )
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return '라이트 모드'
      case 'dark':
        return '다크 모드'
      case 'system':
        return '시스템 설정'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg hover:bg-secondary transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      aria-label={`현재 ${getLabel()}. 클릭하여 변경`}
    >
      <span className="flex items-center gap-2">
        {getIcon()}
        {showLabel && <span className="text-sm">{getLabel()}</span>}
      </span>
    </button>
  )
}

// 드롭다운 형태의 테마 선택기
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
  ] as const

  return (
    <div className={cn('flex gap-1 p-1 bg-secondary rounded-lg', className)}>
      {options.map((option) => {
        const Icon = option.icon
        const isSelected = theme === option.value

        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={isSelected}
          >
            <Icon className="w-4 h-4" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle

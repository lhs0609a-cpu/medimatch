'use client'

import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { locales, localeNames, type Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'buttons' | 'minimal'
}

export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              locale === loc
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'minimal') {
    const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length]
    return (
      <button
        onClick={() => setLocale(nextLocale)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
        title={`Switch to ${localeNames[nextLocale]}`}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>
    )
  }

  // dropdown variant
  return (
    <div className={cn('relative group', className)}>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[locale]}</span>
      </button>

      <div className="absolute right-0 top-full mt-1 py-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn(
              'w-full px-4 py-2 text-left text-sm transition-colors',
              locale === loc
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-secondary'
            )}
            role="option"
            aria-selected={locale === loc}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageSwitcher

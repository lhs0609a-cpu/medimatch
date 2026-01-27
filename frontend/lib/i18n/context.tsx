'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Locale, Translations, TranslationNamespace, TranslationDictionary } from './types'
import { defaultLocale, locales } from './types'
import { ko } from './locales/ko'
import { en } from './locales/en'

// 번역 데이터
const translations: Record<Locale, Translations> = { ko, en }

// 중첩된 키로 값 가져오기
function getNestedValue(obj: TranslationDictionary, path: string): string {
  const keys = path.split('.')
  let result: string | TranslationDictionary = obj

  for (const key of keys) {
    if (typeof result === 'object' && result !== null && key in result) {
      result = result[key]
    } else {
      return path // 키를 찾지 못하면 원래 경로 반환
    }
  }

  return typeof result === 'string' ? result : path
}

// 컨텍스트 타입
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (namespace: TranslationNamespace, key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

// Provider Props
interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

// Storage 키
const LOCALE_STORAGE_KEY = 'mediplatone-locale'

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale)
  const [isLoading, setIsLoading] = useState(true)

  // 초기 로케일 로드
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    if (stored && locales.includes(stored)) {
      setLocaleState(stored)
    } else {
      // 브라우저 언어 감지
      const browserLang = navigator.language.split('-')[0] as Locale
      if (locales.includes(browserLang)) {
        setLocaleState(browserLang)
      }
    }
    setIsLoading(false)
  }, [])

  // 로케일 변경
  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      document.documentElement.lang = newLocale
    }
  }, [])

  // 번역 함수
  const t = useCallback(
    (namespace: TranslationNamespace, key: string, params?: Record<string, string | number>): string => {
      const dict = translations[locale][namespace]
      let value = getNestedValue(dict, key)

      // 파라미터 치환
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue))
        })
      }

      return value
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  )
}

// 훅
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// 특정 네임스페이스 전용 훅
export function useTranslation(namespace: TranslationNamespace) {
  const { t, locale, isLoading } = useI18n()

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => t(namespace, key, params),
    [t, namespace]
  )

  return { t: translate, locale, isLoading }
}

export default I18nProvider

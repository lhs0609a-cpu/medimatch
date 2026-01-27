// 지원 언어
export type Locale = 'ko' | 'en'

// 기본 언어
export const defaultLocale: Locale = 'ko'

// 지원 언어 목록
export const locales: Locale[] = ['ko', 'en']

// 언어별 메타데이터
export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
}

// 번역 키 네임스페이스
export type TranslationNamespace =
  | 'common'
  | 'navigation'
  | 'auth'
  | 'simulation'
  | 'buildings'
  | 'partners'
  | 'errors'

// 번역 딕셔너리 타입
export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary
}

// 전체 번역 타입
export type Translations = {
  [K in TranslationNamespace]: TranslationDictionary
}

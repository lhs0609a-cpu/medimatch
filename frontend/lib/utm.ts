/**
 * 광고 유입 귀속(first-touch attribution).
 *
 * 랜딩 시 UTM 파라미터 + referrer + 도착 경로를 localStorage에 30일 저장한다.
 * 이미 저장된 값이 유효하면 덮어쓰지 않아 "첫 광고 터치"가 보존된다.
 * 문의 폼 제출 시 getAttribution()으로 읽어 /contact 요청에 첨부 → 캠페인 귀속.
 */
export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  referrer?: string
  landing_path?: string
}

const KEY = 'mp_attribution'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30일

/** 랜딩 시 1회 호출 — first-touch 귀속을 기록(있으면 유지). */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const prev = JSON.parse(raw)
      if (prev?.ts && Date.now() - prev.ts < MAX_AGE_MS) return // 첫 터치 유지
    }
    const sp = new URLSearchParams(window.location.search)
    const g = (k: string) => sp.get(k) || undefined
    const record = {
      utm_source: g('utm_source'),
      utm_medium: g('utm_medium'),
      utm_campaign: g('utm_campaign'),
      utm_term: g('utm_term'),
      utm_content: g('utm_content'),
      referrer: document.referrer || undefined,
      landing_path: window.location.pathname + window.location.search,
      ts: Date.now(),
    }
    window.localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    /* localStorage 비활성/사생활모드 — 무시 */
  }
}

/** 저장된 귀속 정보 반환(ts 제외). 없으면 빈 객체. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const { ts: _ts, ...rest } = JSON.parse(raw)
    return rest as Attribution
  } catch {
    return {}
  }
}

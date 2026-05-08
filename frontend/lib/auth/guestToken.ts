/**
 * Guest Token (medi_token)
 *
 * 메디플라톤은 무로그인 플랫폼.
 * 진단(또는 복구)으로 받은 roadmap_token을 localStorage에 보관해
 * "이 사람이 누구인지" 식별합니다.
 *
 * URL ?token=... 가 있으면 자동으로 저장합니다(다른 기기에서 카톡 링크로 진입).
 *
 * SSR-safe: window 가 없을 땐 모두 noop / null 반환.
 */
const KEY = 'medi_token';
const KEY_PHONE = 'medi_phone'; // 분실 복구 안내용 (마지막 4자리만 보관)

export function getGuestToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setGuestToken(token: string): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* QuotaExceeded 등 무시 */
  }
}

export function clearGuestToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY_PHONE);
  } catch {
    /* noop */
  }
}

export function rememberPhoneTail(phone: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (!phone) return;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return;
  try {
    window.localStorage.setItem(KEY_PHONE, digits.slice(-4));
  } catch { /* noop */ }
}

export function getPhoneTail(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem(KEY_PHONE); } catch { return null; }
}

/**
 * URL ?token=... → localStorage 동기화.
 * 진입 화면(my-roadmap 등)에서 1회 실행하면 카톡으로 들어온 사용자가 바로 인식됨.
 *
 * URL에서 token 파라미터를 정리하지는 않습니다(공유/뒤로가기 보호).
 */
export function syncTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const t = url.searchParams.get('token');
    if (t && t.length >= 16) {
      setGuestToken(t);
      return t;
    }
  } catch { /* noop */ }
  return null;
}

/**
 * 모든 진입 페이지에서 쓰는 통합 헬퍼.
 * URL 토큰 우선, 없으면 localStorage. 둘 다 없으면 null.
 */
export function resolveGuestToken(): string | null {
  return syncTokenFromUrl() || getGuestToken();
}

export function hasGuestToken(): boolean {
  return !!getGuestToken();
}

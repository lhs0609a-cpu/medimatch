import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // 에러 처리
  if (error) {
    const errorDescription = searchParams.get('error_description') || '로그인이 취소되었습니다.'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url)
    )
  }

  // 코드가 없는 경우
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=인증 코드가 없습니다.', request.url)
    )
  }

  try {
    // 백엔드 OAuth 콜백 API 호출
    const response = await fetch(`${API_URL}/oauth/${provider}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || '인증 처리 중 오류가 발생했습니다.'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    const data = await response.json()

    // 클라이언트 측 OAuth 콜백 페이지로 리다이렉트
    const redirectUrl = new URL('/oauth/callback', request.url)

    // 토큰 정보를 쿼리 파라미터로 전달 (클라이언트에서 localStorage에 저장)
    redirectUrl.searchParams.set('access_token', data.access_token)
    redirectUrl.searchParams.set('refresh_token', data.refresh_token)
    redirectUrl.searchParams.set('oauth_success', 'true')

    return NextResponse.redirect(redirectUrl)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=인증 처리 중 오류가 발생했습니다.', request.url)
    )
  }
}

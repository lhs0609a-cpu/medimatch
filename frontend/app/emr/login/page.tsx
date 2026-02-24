'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Stethoscope,
  Pill,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  MessageCircle,
  Globe,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function LoginPage() {
  const [userType, setUserType] = useState<'clinic' | 'pharmacy'>('clinic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요')
      return
    }
    setError('')
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = userType === 'clinic' ? '/emr/dashboard' : '/emr/pharmacy'
    }, 1500)
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 브랜딩 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MediMatch EMR</h1>
              <p className="text-sm text-white/70">AI 기반 통합 의료 플랫폼</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            진료에만<br />집중하세요.
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-md">
            AI가 차트를 쓰고, 청구를 방어하고,<br />약국과 실시간으로 연결됩니다.
          </p>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'AI 음성 차트 — 진료 중 자동 기록' },
              { icon: Shield, text: 'AI 청구 방어 — 삭감율 73% 감소' },
              { icon: MessageCircle, text: '의원-약국 브릿지 — 실시간 처방 전송' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-white/90">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">2,400+</div>
              <div className="text-xs text-white/60">이용 의원</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">850+</div>
              <div className="text-xs text-white/60">연동 약국</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-white/60">가동률</div>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">MediMatch EMR</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold">로그인</h2>
            <p className="text-sm text-muted-foreground mt-1">MediMatch EMR에 오신 것을 환영합니다</p>
          </div>

          {/* 사용자 유형 선택 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setUserType('clinic')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                userType === 'clinic'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-border hover:border-blue-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                userType === 'clinic' ? 'bg-blue-500' : 'bg-secondary'
              }`}>
                <Stethoscope className={`w-5 h-5 ${userType === 'clinic' ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-left">
                <div className={`text-sm font-semibold ${userType === 'clinic' ? 'text-blue-600' : ''}`}>의원</div>
                <div className="text-2xs text-muted-foreground">Clinic EMR</div>
              </div>
              {userType === 'clinic' && <Check className="w-4 h-4 text-blue-500 ml-auto" />}
            </button>
            <button
              onClick={() => setUserType('pharmacy')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                userType === 'pharmacy'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-border hover:border-purple-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                userType === 'pharmacy' ? 'bg-purple-500' : 'bg-secondary'
              }`}>
                <Pill className={`w-5 h-5 ${userType === 'pharmacy' ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-left">
                <div className={`text-sm font-semibold ${userType === 'pharmacy' ? 'text-purple-600' : ''}`}>약국</div>
                <div className="text-2xs text-muted-foreground">Pharmacy</div>
              </div>
              {userType === 'pharmacy' && <Check className="w-4 h-4 text-purple-500 ml-auto" />}
            </button>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-2.5 mb-6">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FEE500] text-[#191919] font-medium text-sm hover:brightness-95 transition-all">
              <MessageCircle className="w-5 h-5" />
              카카오로 시작하기
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#03C75A] text-white font-medium text-sm hover:brightness-95 transition-all">
              <Globe className="w-5 h-5" />
              네이버로 시작하기
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">이메일</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@medimatch.kr"
                  className="input pl-10 py-3"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">비밀번호</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="input pl-10 pr-10 py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-muted-foreground">로그인 유지</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:underline font-medium">
                비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: userType === 'clinic' ? 'rgb(37 99 235)' : 'rgb(168 85 247)' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-muted-foreground">아직 계정이 없으신가요? </span>
            <Link href="/emr/signup" className="text-sm font-semibold text-blue-600 hover:underline">
              무료로 시작하기 <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center text-2xs text-muted-foreground">
            <p>로그인 시 <button className="underline">서비스 이용약관</button> 및 <button className="underline">개인정보 처리방침</button>에 동의합니다</p>
            <p className="mt-2">© 2024 MediMatch. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}


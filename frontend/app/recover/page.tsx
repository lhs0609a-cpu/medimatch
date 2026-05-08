'use client';

/**
 * 미션맵 링크 분실 복구
 *
 * 무로그인 플랫폼이라 비번 재설정이 없습니다.
 * 진단 시 입력한 휴대폰만 받으면 카톡으로 새 링크를 보냅니다.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Phone, Send, Loader2, CheckCircle, ChevronRight,
  Sparkles, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { HomeHeader, HomeFooter } from '@/components/home';
import { getPhoneTail } from '@/lib/auth/guestToken';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function RecoverPage() {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const t = getPhoneTail();
    if (t) setHint(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phone.replace(/\D/g, '').length < 8) {
      setError('정확한 휴대폰 번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/roadmap/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.detail || '잠시 후 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <HomeHeader />
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-foreground/8 rounded-3xl shadow-xl shadow-foreground/5 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-foreground/8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#3182f6]/10 mb-4">
                <MessageCircle className="w-7 h-7 text-[#3182f6]" />
              </div>
              <h1 className="text-xl font-bold mb-2">
                {done ? '카카오톡을 확인해주세요' : '미션맵 링크 다시 받기'}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {done ? (
                  <>
                    등록된 정보가 있다면<br />
                    카카오톡으로 새 링크를 보내드렸어요.
                  </>
                ) : (
                  <>
                    가입·비밀번호 없는 메디플라톤은<br />
                    진단 시 입력한 휴대폰으로만 본인 확인합니다.
                  </>
                )}
              </p>
            </div>

            {/* Body */}
            <div className="p-8">
              {done ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-emerald-900">
                        <div className="font-semibold mb-1">카톡 도착 안 했나요?</div>
                        <ul className="space-y-1 text-emerald-800/90">
                          <li>· 등록된 휴대폰이 다를 수 있어요</li>
                          <li>· 카톡 알림 차단 설정 확인</li>
                          <li>· 그래도 안 오면 다시 진단해주세요</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/diagnose"
                    className="block w-full text-center px-5 py-3 text-sm font-bold border border-foreground/15 rounded-xl hover:bg-muted/40"
                  >
                    1분 진단으로 새로 시작
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      진단 시 입력하신 휴대폰
                      {hint && (
                        <span className="ml-2 text-[#3182f6]">힌트: ····{hint}</span>
                      )}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        inputMode="tel"
                        autoFocus
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        className="w-full pl-9 pr-3 py-3 text-sm border border-foreground/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182f6]"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold bg-[#3182f6] text-white rounded-xl hover:bg-[#3182f6]/90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />발송 중…</>
                    ) : (
                      <><Send className="w-4 h-4" />카톡으로 미션맵 받기</>
                    )}
                  </button>

                  <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      가입 여부가 확인되어도 본인 확인을 위해 동일하게 응답합니다.
                      외부 노출은 없어요.
                    </span>
                  </div>
                </form>
              )}
            </div>

            {/* Footer link */}
            <div className="p-6 bg-muted/20 border-t border-foreground/5 text-center">
              <Link
                href="/diagnose"
                className="inline-flex items-center gap-1 text-sm text-[#3182f6] hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                대신 새로 진단받기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <HomeFooter />
    </>
  );
}

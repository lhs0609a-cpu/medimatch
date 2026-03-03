'use client'

import Link from 'next/link'
import { X, Trophy, ArrowRight, Stethoscope, LayoutDashboard } from 'lucide-react'

interface GraduationModalProps {
  onClose: () => void
}

export default function GraduationModal({ onClose }: GraduationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-3xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Decorative top gradient */}
        <div className="h-2 bg-gradient-to-r from-green-500 via-primary to-amber-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8 text-center">
          {/* Trophy Icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">
            축하합니다!
          </h2>
          <p className="text-lg font-medium text-primary mb-2">
            개원 여정을 완주하셨습니다
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            44개 체크리스트를 모두 완료했습니다.<br />
            이제 EMR로 본격적인 진료를 시작하세요.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">44/44</div>
              <div className="text-xs text-muted-foreground">완료</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8/8</div>
              <div className="text-xs text-muted-foreground">전체 단계</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link
              href="/emr/dashboard"
              className="btn-primary w-full justify-center py-3 text-base"
              onClick={onClose}
            >
              <LayoutDashboard className="w-5 h-5" />
              EMR 대시보드로 이동
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={onClose}
              className="btn-ghost w-full justify-center py-2.5 text-sm"
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

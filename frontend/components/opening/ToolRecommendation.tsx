'use client'

import Link from 'next/link'
import {
  Calculator, MapPin, Stethoscope, Megaphone, FileCheck, Receipt,
  ArrowRight,
} from 'lucide-react'

interface ToolRecommendationProps {
  activePhase: number
}

interface Tool {
  icon: React.ElementType
  label: string
  description: string
  href: string
  highlight?: boolean
}

const PHASE_TOOLS: Record<number, Tool[]> = {
  1: [
    { icon: Calculator, label: '수익성 시뮬레이션', description: '예상 매출·비용·손익분기 분석', href: '/opening-package#simulation' },
  ],
  2: [
    { icon: MapPin, label: '입지 경쟁분석', description: '상권·경쟁의원·인구 데이터', href: '/opening-package#location' },
  ],
  3: [
    { icon: FileCheck, label: '인허가 가이드', description: '개설신고·사업자등록 절차', href: '/opening-package#checklist' },
  ],
  4: [],
  5: [
    { icon: Stethoscope, label: 'EMR 시작하기', description: '클라우드 EMR 무료 체험', href: '/emr/dashboard', highlight: true },
  ],
  6: [],
  7: [
    { icon: Megaphone, label: '마케팅 분석', description: '지역 마케팅 전략 수립', href: '/opening-package#marketing' },
  ],
  8: [
    { icon: Receipt, label: '보험청구 테스트', description: '심평원 EDI 청구 연습', href: '/emr/claims' },
  ],
}

export default function ToolRecommendation({ activePhase }: ToolRecommendationProps) {
  const tools = PHASE_TOOLS[activePhase] || []
  if (tools.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">추천 도구</div>
      {tools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className={`
            flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200
            ${tool.highlight
              ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
              : 'border-border hover:border-primary/30 hover:bg-secondary/50'
            }
          `}
        >
          <div className={`
            w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            ${tool.highlight ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}
          `}>
            <tool.icon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${tool.highlight ? 'text-primary' : ''}`}>
              {tool.label}
            </div>
            <div className="text-xs text-muted-foreground">{tool.description}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Link>
      ))}
    </div>
  )
}

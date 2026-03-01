'use client'

import Link from 'next/link'
import {
  Calculator, MapPin, Stethoscope, Megaphone, FileCheck, Receipt,
  ArrowRight, Landmark, Building2, FolderOpen, Paintbrush,
  ShoppingCart, Monitor, ListChecks, Users, FileText, TrendingUp,
  MapPinned, UserPlus, LayoutDashboard,
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
    { icon: Landmark, label: '대출 계산기', description: '개원 자금 대출 시 월 상환금 계산', href: '/emr/opening/budget?tab=loan' },
  ],
  2: [
    { icon: MapPin, label: '입지 경쟁분석', description: '상권·경쟁의원·인구 데이터', href: '/opening-package#location' },
    { icon: Building2, label: '매물 검색', description: '개원 적합 매물 검색 및 비교', href: '/opening-package#location' },
  ],
  3: [
    { icon: FileCheck, label: '인허가 가이드', description: '개설신고·사업자등록 절차 안내', href: '/emr/opening/permits' },
    { icon: FolderOpen, label: '서류 관리', description: '인허가 서류 진행 상황 추적', href: '/emr/opening/permits' },
  ],
  4: [
    { icon: Paintbrush, label: '인테리어 파트너', description: '검증된 의료 전문 인테리어 업체', href: '/emr/opening/vendors?tab=interior' },
    { icon: ShoppingCart, label: '공동구매', description: '자재 공동구매로 최대 30% 절감', href: '/emr/group-buying', highlight: true },
  ],
  5: [
    { icon: ListChecks, label: '장비 체크리스트', description: '진료과별 필수/권장 장비 목록', href: '/emr/opening/phase/5?tab=checklist' },
    { icon: ShoppingCart, label: '장비 공동구매', description: '의료장비 공동구매 최대 40% 절감', href: '/emr/group-buying', highlight: true },
    { icon: Monitor, label: 'EMR 시스템 세팅', description: '장비와 함께 EMR 무료 시작', href: '/emr/dashboard', highlight: true },
  ],
  6: [
    { icon: Users, label: '인건비 시뮬레이터', description: '직종별 인건비·4대보험 계산', href: '/emr/cost/staff', highlight: true },
    { icon: FileText, label: '채용공고 템플릿', description: '의료기관 채용공고 양식 제공', href: '/emr/opening/phase/6?tab=documents' },
  ],
  7: [
    { icon: TrendingUp, label: '마케팅 ROI 분석', description: '채널별 마케팅 효과 분석', href: '/emr/cost/marketing', highlight: true },
    { icon: MapPinned, label: '네이버 플레이스 가이드', description: '스마트플레이스 등록 및 최적화', href: '/emr/opening/phase/7?tab=documents' },
    { icon: Megaphone, label: '마케팅 채널 체크리스트', description: '개원 시 활용 가능한 마케팅 채널', href: '/emr/opening/phase/7?tab=checklist' },
  ],
  8: [
    { icon: Receipt, label: '보험청구 테스트', description: '심평원 EDI 청구 프로세스 연습', href: '/emr/claims', highlight: true },
    { icon: UserPlus, label: '환자관리 미리보기', description: 'EMR 환자관리 기능 체험', href: '/emr/patients', highlight: true },
    { icon: LayoutDashboard, label: 'EMR 대시보드', description: '개원 후 사용할 EMR 확인', href: '/emr/dashboard' },
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
          key={`${tool.href}-${tool.label}`}
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

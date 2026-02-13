'use client'

import { useState } from 'react'
import { ArrowLeft, FileText, Building2, PaintBucket, UserCheck, HeartHandshake, Monitor, ArrowRightLeft, Download, Eye, ChevronRight, AlertTriangle, CheckCircle2, X, Scale, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string
  clauses: string[]
  warnings: string[]
  tips: string[]
}

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
  templates: Template[]
}

const categoriesData: Category[] = [
  {
    id: 'lease', name: '임대차계약서', icon: <Building2 className="w-6 h-6" />,
    description: '상가 임대차, 전대차 계약에 필요한 핵심 조항을 포함한 템플릿',
    color: 'bg-blue-500/10 text-blue-600',
    templates: [
      {
        id: 'lease-1', name: '상가 임대차계약서', description: '의원/병원 개원을 위한 상가 임대차 표준 계약서',
        clauses: ['임대차 목적물 표시 (주소, 면적, 층)', '보증금 및 월 차임 (인상률 상한)', '임대차 기간 및 갱신 조건', '권리금 보호 조항 (상가임대차보호법)', '원상복구 범위 및 비용 분담', '중도 해지 시 위약금 조항', '시설 변경 및 인테리어 공사 동의'],
        warnings: ['확정일자를 반드시 받으세요', '등기부등본의 근저당 설정 금액을 확인하세요', '임대인의 동의 없는 전대는 해지 사유가 됩니다'],
        tips: ['환산보증금이 지역별 기준을 초과하면 상가임대차보호법 보호 대상에서 제외됩니다', '인테리어 비용 투자 전 최소 5년 이상 임대차 기간을 확보하세요']
      },
      {
        id: 'lease-2', name: '전대차계약서', description: '기존 임차인으로부터 전대(서브리스)받을 때 사용',
        clauses: ['원 임대인 동의서 첨부', '전대차 기간 (원 계약 범위 내)', '전대 보증금 및 차임', '원 계약 해지 시 전대차 효력', '시설물 인수인계 목록'],
        warnings: ['원 임대인의 서면 동의가 반드시 필요합니다', '원 임대차 계약 잔여기간을 확인하세요'],
        tips: ['전대차는 원 계약보다 불안정하므로, 가능하면 임대인과 직접 계약을 추천합니다']
      },
    ]
  },
  {
    id: 'interior', name: '인테리어 도급계약서', icon: <PaintBucket className="w-6 h-6" />,
    description: '설계, 시공, 하자보수까지 포함하는 인테리어 공사 계약서',
    color: 'bg-amber-500/10 text-amber-600',
    templates: [
      {
        id: 'int-1', name: '인테리어 설계 계약서', description: '의원 인테리어 설계 단계 전용 계약서',
        clauses: ['설계 범위 (평면, 입면, 3D 포함 여부)', '설계비 및 지급 일정 (계약/중도/잔금)', '설계 변경 횟수 및 추가비용', '설계도서 저작권 귀속', '납품 기한 및 지체상금'],
        warnings: ['설계 변경 가능 횟수를 명확히 정하세요', '설계도면의 저작권이 누구에게 있는지 반드시 명시하세요'],
        tips: ['의원 전문 설계 경험이 있는 업체를 선정하세요. 감염관리 동선이 중요합니다.']
      },
      {
        id: 'int-2', name: '인테리어 시공 계약서', description: '시공 및 하자보수 조건을 포함한 공사 도급 계약서',
        clauses: ['공사 범위 및 상세 내역서', '총 공사비 및 기성 지급 조건', '공사 기간 및 지체상금 (일 0.1~0.3%)', '하자보수 기간 (준공 후 1~2년)', '추가/변경 공사 절차 및 단가 산정', '안전관리 및 보험 가입 의무', '준공 검사 및 인수 절차'],
        warnings: ['공사비의 10%는 하자보수 보증금으로 유보하세요', '구두 합의는 분쟁의 원인이 됩니다. 변경 사항은 반드시 서면으로'],
        tips: ['공사 중간중간 사진 기록을 남기세요. 하자 발생 시 증거가 됩니다.']
      },
    ]
  },
  {
    id: 'employment', name: '근로계약서', icon: <UserCheck className="w-6 h-6" />,
    description: '간호사, 의료기사, 원무과 직원 등 직종별 표준 근로계약서',
    color: 'bg-green-500/10 text-green-600',
    templates: [
      {
        id: 'emp-1', name: '간호사 근로계약서', description: '의원급 간호사 채용을 위한 근로계약서',
        clauses: ['근무 장소 및 담당 업무', '근로시간 및 휴게시간 (주 40시간)', '임금 (기본급, 야간/휴일 수당, 상여금)', '연차유급휴가 (근로기준법 준수)', '수습기간 및 조건 (최대 3개월)', '비밀유지 의무', '퇴직금 규정'],
        warnings: ['최저임금 미만 급여는 근로기준법 위반입니다', '4대보험 가입은 사업주의 법적 의무입니다'],
        tips: ['수습기간에도 최저임금의 90% 이상을 지급해야 합니다']
      },
      {
        id: 'emp-2', name: '의료기사 근로계약서', description: '방사선사, 임상병리사, 물리치료사 등 의료기사 전용',
        clauses: ['면허/자격 사항 명시', '업무 범위 (면허 범위 내)', '근로시간 및 당직 수당', '임금 및 수당 체계', '경력 인정 기준', '교육/연수 참여 보장'],
        warnings: ['면허 범위를 벗어난 업무 지시는 의료법 위반입니다'],
        tips: ['자격수당을 별도로 책정하면 채용 경쟁력이 높아집니다']
      },
      {
        id: 'emp-3', name: '원무과 직원 근로계약서', description: '접수, 수납, 보험청구 담당 직원 계약서',
        clauses: ['업무 범위 (접수, 수납, 보험청구 등)', '개인정보 취급 동의 및 보안 서약', '근로조건 (시간, 급여, 휴가)', '비밀유지 및 경업금지 조항', '수습기간 조건'],
        warnings: ['환자 개인정보 취급자는 별도의 보안서약서를 받으세요'],
        tips: ['보험청구 경력자에게 별도 수당을 책정하면 경력 이탈을 방지할 수 있습니다']
      },
    ]
  },
  {
    id: 'partnership', name: '동업계약서', icon: <HeartHandshake className="w-6 h-6" />,
    description: '공동개원, 지분 배분, 탈퇴 조건 등 동업 관련 계약서',
    color: 'bg-purple-500/10 text-purple-600',
    templates: [
      {
        id: 'partner-1', name: '공동개원 동업계약서', description: '2인 이상 공동 개원 시 사용하는 동업 계약서',
        clauses: ['출자 비율 및 방법 (현금, 현물, 노무)', '업무 분담 (진료, 경영, 행정)', '수익 배분 비율 및 정산 주기', '의사결정 구조 (의결권, 거부권)', '탈퇴/제명 조건 및 지분 정산', '경업금지 조항 (기간, 지역 범위)', '분쟁 해결 절차 (중재, 소송 관할)'],
        warnings: ['구두 약속만으로 동업하면 99% 분쟁이 발생합니다', '탈퇴 시 지분 정산 방법을 가장 상세하게 정해야 합니다', '지분 양도 시 다른 동업자의 동의 절차를 명시하세요'],
        tips: ['매출이 아닌 영업이익 기준으로 수익을 배분하는 것이 분쟁을 줄입니다', '회계법인을 통한 월별 정산을 추천합니다']
      },
      {
        id: 'partner-2', name: '지분 양도 계약서', description: '동업 중 지분 매매/양도 시 사용',
        clauses: ['양도 지분 비율 및 양도가액', '양도 대금 지급 일정', '기존 동업자 우선매수권', '양도 후 권리/의무 승계', '양도 제한 조건'],
        warnings: ['세무 전문가와 양도소득세를 사전 협의하세요'],
        tips: ['지분 가치 산정은 독립적인 감정 평가를 받는 것이 좋습니다']
      },
    ]
  },
  {
    id: 'equipment', name: '의료기기 리스계약서', icon: <Monitor className="w-6 h-6" />,
    description: '고가 의료장비 리스, 렌탈, 유지보수 관련 계약서',
    color: 'bg-cyan-500/10 text-cyan-600',
    templates: [
      {
        id: 'equip-1', name: '의료기기 리스 계약서', description: 'CT, MRI 등 고가 장비 리스(임대) 계약서',
        clauses: ['리스 대상 기기 명세 (모델, 일련번호)', '리스 기간 및 월 리스료', '소유권 귀속 (운용리스/금융리스)', '리스 만료 후 처리 (반환/매수/연장)', '보험 가입 의무', '하자 발생 시 책임 소재', '중도해지 조건 및 위약금'],
        warnings: ['금융리스와 운용리스는 회계처리가 완전히 다릅니다. 세무사와 상의하세요', '중도해지 위약금이 잔여 리스료의 80~100%인 경우가 많으니 주의하세요'],
        tips: ['리스료는 경비처리 가능하여 절세 효과가 있습니다']
      },
      {
        id: 'equip-2', name: '유지보수(AMC) 계약서', description: '의료기기 연간 유지보수 서비스 계약서',
        clauses: ['대상 장비 목록', '유지보수 범위 (정기점검, 긴급수리, 부품교체)', '서비스 응답시간 (SLA)', '연간 유지보수 비용', '부품 공급 보증 기간', '면책 사항 (사용자 과실, 천재지변)'],
        warnings: ['SLA(서비스 수준 약정)에서 응답시간과 복구시간을 구분하세요'],
        tips: ['장비 구매 시 첫 1~2년은 무상 AS가 일반적이니 중복 계약하지 마세요']
      },
    ]
  },
  {
    id: 'transfer', name: '양도양수 계약서', icon: <ArrowRightLeft className="w-6 h-6" />,
    description: '병원/약국 인수인계에 필요한 양도양수 관련 계약서',
    color: 'bg-rose-500/10 text-rose-600',
    templates: [
      {
        id: 'trans-1', name: '병원 양도양수 계약서', description: '기존 병원/의원을 인수할 때 사용하는 계약서',
        clauses: ['양도 대상 (영업권, 시설, 장비, 인력)', '양도 대금 및 지급 조건', '기존 임대차 승계 조건', '직원 승계 여부 및 조건', '환자 차트/기록 인수 (개인정보보호법 준수)', '양도인 경업금지 (기간, 지역)', '하자담보 책임 (장비 고장, 미고지 채무)'],
        warnings: ['미공개 채무(세금, 카드 미수금 등)를 반드시 실사하세요', '환자 의무기록 이관은 개인정보보호법 절차를 따라야 합니다', '양도인의 의료법 위반 이력을 확인하세요'],
        tips: ['양도 대금의 10~20%를 에스크로에 예치하고, 하자 미발견 확인 후 지급하세요', '회계/세무/법률 전문가 동시 자문을 추천합니다']
      },
      {
        id: 'trans-2', name: '약국 양도양수 계약서', description: '약국 인수인계 전용 계약서',
        clauses: ['양도 대상 (영업권, 재고 약품, 집기)', '약품 재고 실사 및 가치 산정', '처방전 발행 의원 현황', '약사 면허 관련 조건', '양도 대금 및 정산', '매출 보장 조항 유무'],
        warnings: ['마약류 재고는 별도의 인수인계 절차가 필요합니다', '건강보험심사평가원 등록 변경을 잊지 마세요'],
        tips: ['최근 6개월 처방전 발행 데이터를 기준으로 매출을 검증하세요']
      },
    ]
  },
]

const checklistItems = [
  '계약 당사자 정보가 정확한지 확인 (사업자등록번호, 주소, 대표자명)',
  '금액 관련 조항에 오류가 없는지 숫자와 한글 표기를 대조',
  '기간 관련 조항 (시작일, 종료일, 갱신 조건)이 명확한지 확인',
  '위약금/손해배상 조항이 일방적이지 않은지 검토',
  '분쟁 해결 방법 (관할 법원, 중재)이 명시되어 있는지 확인',
]

export default function ContractTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showChecklist, setShowChecklist] = useState(true)

  const currentCategory = categoriesData.find(c => c.id === selectedCategory)
  const currentTemplate = currentCategory?.templates.find(t => t.id === selectedTemplate)

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">계약서 템플릿</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Checklist Banner */}
        <div className="card p-5 mb-6 border-l-4 border-primary">
          <button onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> 계약서 작성 시 반드시 확인해야 할 5가지
            </h2>
            {showChecklist ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showChecklist && (
            <ul className="mt-4 space-y-2">
              {checklistItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Template Detail View */}
        {currentTemplate && currentCategory ? (
          <div>
            <button onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1 text-sm text-primary mb-4 hover:underline">
              <ArrowLeft className="w-4 h-4" /> {currentCategory.name} 목록으로
            </button>

            <div className="card p-5 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${currentCategory.color}`}>
                  {currentCategory.icon} {currentCategory.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{currentTemplate.name}</h2>
              <p className="text-sm text-muted-foreground mb-5">{currentTemplate.description}</p>

              <div className="flex gap-3 mb-6">
                <button className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> 다운로드 (준비중)
                </button>
                <button className="bg-muted text-foreground px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-muted/80 transition-colors">
                  <Eye className="w-4 h-4" /> 미리보기 (준비중)
                </button>
              </div>

              {/* Key Clauses */}
              <div className="mb-6">
                <h3 className="font-bold text-foreground mb-3">주요 조항</h3>
                <div className="space-y-2">
                  {currentTemplate.clauses.map((clause, i) => (
                    <div key={i} className="flex items-start gap-3 bg-muted rounded-lg p-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground">{clause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              <div className="mb-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> 주의사항
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  {currentTemplate.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-amber-800">{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="mb-6">
                <h3 className="font-bold text-foreground mb-3">커스터마이징 팁</h3>
                <div className="space-y-2">
                  {currentTemplate.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <Scale className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800 mb-1">법률 검토 안내</p>
                  <p className="text-red-700">
                    본 템플릿은 참고용이며, 법적 효력을 보장하지 않습니다.
                    실제 계약 체결 전 반드시 법률 전문가의 검토를 받으시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : selectedCategory && currentCategory ? (
          /* Template List View */
          <div>
            <button onClick={() => { setSelectedCategory(null); setSelectedTemplate(null) }}
              className="flex items-center gap-1 text-sm text-primary mb-4 hover:underline">
              <ArrowLeft className="w-4 h-4" /> 전체 카테고리로
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentCategory.color}`}>
                {currentCategory.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentCategory.name}</h2>
                <p className="text-sm text-muted-foreground">{currentCategory.templates.length}개 템플릿</p>
              </div>
            </div>

            <div className="space-y-3">
              {currentCategory.templates.map(template => (
                <div key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className="card p-5 cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground">{template.name}</h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.clauses.slice(0, 4).map((clause, i) => (
                      <span key={i} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md">
                        {clause.length > 20 ? clause.slice(0, 20) + '...' : clause}
                      </span>
                    ))}
                    {template.clauses.length > 4 && (
                      <span className="text-xs text-primary px-2 py-1">+{template.clauses.length - 4}개</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Category Grid View */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {categoriesData.map(category => (
                <div key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="card p-5 cursor-pointer hover:border-primary/30 transition-all hover:-translate-y-0.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      {category.templates.length}개 템플릿
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="card p-6 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <Scale className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-2">법률 자문이 필요하신가요?</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                계약서 검토, 법률 상담, 분쟁 해결까지 의료 전문 법률가를 연결해드립니다.
              </p>
              <Link href="/legal"
                className="inline-flex items-center gap-2 btn-primary px-6 py-2.5 rounded-lg text-sm font-medium">
                법률 자문 연결 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, FileCheck, ChevronDown, ChevronUp, Clock, Building2, FileText, AlertTriangle, Scale, Download, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const steps = [
  {
    id: 1,
    title: '사업자등록',
    subtitle: 'Business Registration',
    icon: '📋',
    duration: '2~3일',
    agency: '관할 세무서',
    cost: '무료',
    documents: [
      '사업자등록 신청서',
      '의사 면허증 사본',
      '임대차 계약서 사본',
      '신분증 사본',
      '인감도장',
    ],
    cautions: [
      '개원 전 반드시 사업자등록을 먼저 완료해야 합니다',
      '업종코드: 의원(851101), 치과의원(851102), 한의원(851103)',
      '간이과세자가 아닌 일반과세자로 등록',
      '공동개원 시 동업계약서 추가 필요',
    ],
    law: '소득세법 제168조, 부가가치세법 제8조',
    tip: '홈택스(hometax.go.kr)에서 온라인 신청도 가능합니다. 세무사를 통해 대행하면 업종코드 오류를 방지할 수 있습니다.',
  },
  {
    id: 2,
    title: '의료기관 개설신고',
    subtitle: 'Medical Facility Registration',
    icon: '🏥',
    duration: '1~2주',
    agency: '관할 보건소',
    cost: '무료',
    documents: [
      '의료기관 개설신고서',
      '의사 면허증 원본',
      '사업자등록증 사본',
      '건물 평면도 (시설 배치도)',
      '임대차 계약서 사본',
      '진료과목별 시설·장비 명세서',
      '의료인 면허증 사본 (고용 의료인 포함)',
      '건축물대장',
    ],
    cautions: [
      '시설기준: 진료실, 처치실 필수 (의료법 시행규칙 제34조)',
      '진료실과 대기실은 칸막이로 구분 필수',
      '보건소 현장실사 후 개설신고증명서 발급',
      '의료기관 명칭 사전 확인 필수 (동일 명칭 불가)',
      '복수 진료과목 표시 시 전문의 자격 확인',
    ],
    law: '의료법 제33조, 의료법 시행규칙 제25조',
    tip: '보건소 담당자와 사전 상담 후 서류를 준비하면 반려를 줄일 수 있습니다. 평면도는 인테리어 업체에서 제공받으세요.',
  },
  {
    id: 3,
    title: '건강보험 요양기관 지정',
    subtitle: 'Health Insurance Provider Designation',
    icon: '💊',
    duration: '1~2주',
    agency: '건강보험심사평가원 (HIRA)',
    cost: '무료',
    documents: [
      '요양기관 지정신청서',
      '의료기관 개설신고증명서 사본',
      '사업자등록증 사본',
      '의사 면허증 사본',
      '시설·장비 명세서',
      '통장 사본 (보험금 입금용)',
    ],
    cautions: [
      '요양기관 미지정 시 건강보험 환자 진료 불가',
      '개설신고 후 즉시 신청 권장',
      '심평원 요양기관 현황 정보시스템(HIRA) 등록',
      'EDI 프로그램 설치 필요 (전자청구)',
      '수가 적용일은 지정일 기준',
    ],
    law: '국민건강보험법 제42조',
    tip: '심평원 지역사무소에 방문하거나 온라인(hira.or.kr)으로 신청 가능합니다. EDI 업체 선정도 동시에 진행하세요.',
  },
  {
    id: 4,
    title: '방사선 발생장치 신고',
    subtitle: 'X-ray Equipment Registration',
    icon: '☢️',
    duration: '1~2주',
    agency: '원자력안전위원회 / 관할 시·군·구',
    cost: '신고 무료, 방어시설 검사비 별도',
    documents: [
      '방사선 발생장치 설치신고서',
      '장비 제조사 허가증 사본',
      '방사선 방어시설 설계도',
      '방사선안전관리자 선임서',
      '방사선 관계종사자 건강진단서',
      '방사선 구역 설정 도면',
    ],
    cautions: [
      'X-ray, CT, C-arm 등 방사선 장비 보유 시 필수',
      '방사선 안전관리자 선임 의무 (의사 본인 가능)',
      '납 차폐 시설 기준 충족 필수',
      '설치 전 사전 신고, 설치 후 검사 합격 필요',
      '정기검사: 3년마다 실시',
    ],
    law: '진단용 방사선 발생장치의 안전관리에 관한 규칙',
    tip: '인테리어 설계 시 방사선 차폐 공사를 함께 진행하면 비용을 절감할 수 있습니다. 장비 납품업체에서 신고 대행해주는 경우도 많습니다.',
  },
  {
    id: 5,
    title: '의료폐기물 처리 계약',
    subtitle: 'Medical Waste Disposal Contract',
    icon: '🗑️',
    duration: '3~5일',
    agency: '의료폐기물 전문 처리업체',
    cost: '월 10~30만원 (배출량에 따라)',
    documents: [
      '의료폐기물 위탁처리 계약서',
      '폐기물 관리대장 비치',
      '전용 용기 구매 (감염성, 손상성 등)',
    ],
    cautions: [
      '의료폐기물 전용용기 사용 의무',
      '보관기간: 감염성 폐기물 7일 이내',
      '폐기물 인계·인수 기록 보관 (3년)',
      '올바로시스템(allbaro.or.kr) 전자인계서 사용',
      '위반 시 300만원 이하 과태료',
    ],
    law: '폐기물관리법 제17조, 의료폐기물 관리 지침',
    tip: '개원 지역 내 허가된 업체 2~3곳 비교견적을 받으세요. 수거 주기와 전용용기 제공 여부를 확인하세요.',
  },
  {
    id: 6,
    title: '전자처방전 시스템 등록',
    subtitle: 'E-Prescription System Registration',
    icon: '💻',
    duration: '3~5일',
    agency: '건강보험심사평가원',
    cost: 'EMR 도입 비용에 포함',
    documents: [
      '전자처방전 발급기관 등록 신청서',
      'EMR/OCS 인증서 사본',
      '의료기관 공인인증서',
    ],
    cautions: [
      '2024년부터 전자처방전 발행 의무화 확대',
      'EMR 시스템에 DUR(의약품안전사용서비스) 연동 필수',
      '마약류 전자처방 별도 등록 필요',
      '처방전 발급 내역 5년 보관 의무',
    ],
    law: '의료법 제18조, 전자처방전 발급 등에 관한 규정',
    tip: 'EMR 업체 선정 시 전자처방전 및 DUR 연동이 기본 포함되어 있는지 반드시 확인하세요.',
  },
  {
    id: 7,
    title: '간판/광고 심의',
    subtitle: 'Signage & Advertising Review',
    icon: '📢',
    duration: '1~2주',
    agency: '대한의사협회 / 관할 구청',
    cost: '심의비 5~10만원',
    documents: [
      '의료광고 심의 신청서',
      '광고 시안 (간판 디자인, 크기, 위치)',
      '의료기관 개설신고증명서 사본',
      '전문의 자격증 사본 (전문의 표기 시)',
    ],
    cautions: [
      '의료법상 과대광고·비교광고 금지',
      '"최고", "최초", "유일" 등 표현 사용 불가',
      '치료 전후 사진 사용 시 심의 필수',
      '네이버 플레이스, 블로그 등 온라인 광고도 심의 대상',
      '옥외광고물법에 따른 간판 크기 규제 확인',
      '위반 시 1년 이하 징역 또는 1천만원 이하 벌금',
    ],
    law: '의료법 제56조, 옥외광고물 등의 관리와 옥외광고산업 진흥에 관한 법률',
    tip: '간판 업체와 협의 전에 의료광고 심의 가이드라인을 먼저 확인하세요. 심의 통과 후 간판 제작에 들어가야 비용 낭비가 없습니다.',
  },
  {
    id: 8,
    title: '개원 신고/완료',
    subtitle: 'Final Opening Notification',
    icon: '🎉',
    duration: '당일',
    agency: '관할 보건소',
    cost: '무료',
    documents: [
      '개원 일자 확정 통보',
      '모든 인허가 서류 완비 확인',
      '소방시설 완비증명서',
      '위생교육 이수증 (해당 시)',
    ],
    cautions: [
      '모든 인허가 절차 완료 후 개원 가능',
      '개원일 = 요양기관 수가 적용 시작일',
      '개원 후 14일 이내 진료시간 등 변경사항 신고',
      '의료기관 평가인증 대비 서류 정리',
      '개원 축하 이벤트 시 의료광고 규정 준수',
    ],
    law: '의료법 제33조, 제40조',
    tip: '개원 당일 건강보험 청구 시스템이 정상 작동하는지 반드시 테스트하세요. 첫 달은 청구 누락이 발생하기 쉬우므로 주의가 필요합니다.',
  },
]

export default function LicenseGuidePage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (id: number) => {
    setExpandedStep(expandedStep === id ? null : id)
  }

  const toggleComplete = (id: number) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const progress = Math.round((completedSteps.length / steps.length) * 100)

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <FileCheck className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">인허가 가이드</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Progress Overview */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">전체 진행률</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completedSteps.length}/{steps.length} 단계 완료 | 전체 예상 소요기간: 4~8주
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`flex flex-col items-center min-w-[60px] ${
                    expandedStep === step.id ? 'scale-110' : ''
                  } transition-transform`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : expandedStep === step.id
                        ? 'bg-primary border-primary text-white'
                        : 'bg-muted border-muted text-muted-foreground'
                    }`}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight whitespace-nowrap">
                    {step.title.length > 5 ? step.title.slice(0, 5) + '..' : step.title}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-6 h-0.5 mx-1 ${
                      completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Accordion */}
        <div className="space-y-3">
          {steps.map((step) => {
            const isExpanded = expandedStep === step.id
            const isCompleted = completedSteps.includes(step.id)
            return (
              <div key={step.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                      isCompleted ? 'bg-green-500/20' : 'bg-muted'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary">STEP {step.id}</span>
                      {isCompleted && (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">완료</span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {step.duration}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {step.agency}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5">
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {/* Info Cards */}
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">소요기간</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.duration}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">담당기관</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.agency}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">비용</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.cost}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">관련법규</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.law}</p>
                        </div>
                      </div>

                      {/* Documents & Cautions */}
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            필요서류
                          </h4>
                          <ul className="space-y-1">
                            {step.documents.map((doc, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="w-4 h-4" />
                            주의사항
                          </h4>
                          <ul className="space-y-1">
                            {step.cautions.map((c, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-amber-400 shrink-0">!</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold text-primary">TIP: </span>
                        {step.tip}
                      </p>
                    </div>

                    {/* Complete Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleComplete(step.id)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isCompleted
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {isCompleted ? '완료 취소' : '이 단계 완료'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Download Note */}
        <div className="card p-5 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">인허가 체크리스트 PDF</h3>
              <p className="text-sm text-muted-foreground">
                모든 단계의 필요서류와 주의사항을 정리한 체크리스트를 다운로드하세요.
              </p>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              다운로드
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6 pb-8">
          본 가이드는 일반적인 인허가 절차를 안내하며, 지역·진료과목에 따라 추가 절차가 필요할 수 있습니다.
          정확한 사항은 관할 보건소 및 전문가에게 문의하세요.
        </p>
      </main>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, Calculator, ChevronDown, ChevronUp, HelpCircle, AlertTriangle, Flame, Users, Monitor, Scale } from 'lucide-react'
import Link from 'next/link'

type InsuranceCategory = '의료배상책임보험' | '화재보험' | '단체상해보험' | '영업배상' | '사이버보험'

interface InsuranceProduct {
  id: string
  company: string
  name: string
  category: InsuranceCategory
  annualPremium: string
  coverageLimit: string
  coverageDetails: string[]
  exclusions: string[]
  isRequired: boolean
  highlight?: string
}

const insuranceProducts: InsuranceProduct[] = [
  {
    id: 'med-1', company: '대한의사협회', name: '단체의료배상책임보험', category: '의료배상책임보험',
    annualPremium: '연 30~50만', coverageLimit: '1억/건, 3억/연',
    coverageDetails: ['의료사고 배상금', '소송비용', '조정/중재비용', '응급처치비'],
    exclusions: ['고의 또는 중과실', '미용시술 일부', '무면허 의료행위'],
    isRequired: false, highlight: '의사협회 단체할인'
  },
  {
    id: 'med-2', company: '삼성화재', name: '의료배상책임보험', category: '의료배상책임보험',
    annualPremium: '연 40~80만', coverageLimit: '3억/건, 10억/연',
    coverageDetails: ['의료과오 배상', '법률비용 지원', '사고 후 평판관리 비용', '휴업손해 보상'],
    exclusions: ['미용 관련 클레임 일부', '고의적 행위'],
    isRequired: false, highlight: '높은 보상한도'
  },
  {
    id: 'med-3', company: 'DB손해보험', name: '의료인배상책임', category: '의료배상책임보험',
    annualPremium: '연 35~70만', coverageLimit: '2억/건, 6억/연',
    coverageDetails: ['배상책임', '방어비용', '긴급조치비용', '대위권 보전비용'],
    exclusions: ['의도적 법규 위반', '계약 이행 보증'],
    isRequired: false
  },
  {
    id: 'med-4', company: '현대해상', name: '프로페셔널배상', category: '의료배상책임보험',
    annualPremium: '연 45~90만', coverageLimit: '5억/건, 15억/연',
    coverageDetails: ['고액 배상 사고 대응', '전문 법률팀 지원', '합의금 보상', '명예훼손 방어'],
    exclusions: ['미승인 시술', '면허 정지 기간 행위'],
    isRequired: false, highlight: '최대 보상 5억/건'
  },
  {
    id: 'fire-1', company: '삼성화재', name: '다중이용업소 화재보험', category: '화재보험',
    annualPremium: '연 10~20만', coverageLimit: '건물 시가, 집기 약정액',
    coverageDetails: ['화재 직접 손해', '소방손해', '피난손해', '잔존물 제거비'],
    exclusions: ['지진/전쟁', '고의 방화'], isRequired: true
  },
  {
    id: 'fire-2', company: 'DB손해보험', name: '일반화재보험', category: '화재보험',
    annualPremium: '연 12~25만', coverageLimit: '약정보험가액',
    coverageDetails: ['건물/집기 화재손해', '폭발사고', '임시거주비', '이웃 피해 배상'],
    exclusions: ['노후 전기시설 방치'], isRequired: true
  },
  {
    id: 'fire-3', company: '현대해상', name: '풍수재보험(특약)', category: '화재보험',
    annualPremium: '연 5~15만 (특약)', coverageLimit: '1~3억',
    coverageDetails: ['태풍/홍수 손해', '배수관 파열', '우박/적설 손해'],
    exclusions: ['해일', '지반침하'], isRequired: false
  },
  {
    id: 'group-1', company: '삼성생명', name: '단체상해보험', category: '단체상해보험',
    annualPremium: '연 5~12만/인', coverageLimit: '사망 1억, 입원일당 5만',
    coverageDetails: ['업무 중 상해', '질병입원', '수술비', '통원치료비'],
    exclusions: ['기존 질병', '레저스포츠 사고'], isRequired: false, highlight: '직원 복지 강화'
  },
  {
    id: 'group-2', company: '한화생명', name: '기업복지보험', category: '단체상해보험',
    annualPremium: '연 7~15만/인', coverageLimit: '사망 2억, 후유장해 2억',
    coverageDetails: ['상해사망/후유장해', '질병사망', '암/뇌/심장 진단비', '실손의료비'],
    exclusions: ['비급여 일부', '치과치료 일부'], isRequired: false
  },
  {
    id: 'biz-1', company: '삼성화재', name: '영업배상책임보험', category: '영업배상',
    annualPremium: '연 15~30만', coverageLimit: '1억/건',
    coverageDetails: ['시설 내 환자 부상', '시설물 하자 사고', '주차장 사고', '음용수 사고'],
    exclusions: ['고의 사고', '차량 사고(별도)'], isRequired: false
  },
  {
    id: 'biz-2', company: 'KB손해보험', name: '시설소유관리자배상', category: '영업배상',
    annualPremium: '연 12~25만', coverageLimit: '2억/건, 5억/연',
    coverageDetails: ['환자 낙상사고', '엘리베이터 사고', '간판 낙하', '누수 피해배상'],
    exclusions: ['자연재해 기인', '공사 중 사고(별도)'], isRequired: false
  },
  {
    id: 'cyber-1', company: '현대해상', name: '사이버배상책임보험', category: '사이버보험',
    annualPremium: '연 20~50만', coverageLimit: '1억/건',
    coverageDetails: ['환자 개인정보 유출', '랜섬웨어 피해', '데이터 복구비용', 'IT 포렌식 비용'],
    exclusions: ['고의적 데이터 삭제', '보안 미조치'], isRequired: false, highlight: '개인정보보호법 대응'
  },
  {
    id: 'cyber-2', company: '삼성화재', name: '개인정보유출배상', category: '사이버보험',
    annualPremium: '연 15~40만', coverageLimit: '2억/건',
    coverageDetails: ['개인정보 유출 배상', '위기관리비용', '법률자문비용', '통지비용'],
    exclusions: ['사전 인지된 위반', '물리적 도난'], isRequired: false
  },
]

const categories: { name: InsuranceCategory; icon: React.ReactNode }[] = [
  { name: '의료배상책임보험', icon: <ShieldAlert className="w-4 h-4" /> },
  { name: '화재보험', icon: <Flame className="w-4 h-4" /> },
  { name: '단체상해보험', icon: <Users className="w-4 h-4" /> },
  { name: '영업배상', icon: <Scale className="w-4 h-4" /> },
  { name: '사이버보험', icon: <Monitor className="w-4 h-4" /> },
]

const faqs = [
  {
    q: '의료사고 발생 시 보험 처리 절차는?',
    a: '1) 사고 인지 즉시 보험사에 통보 → 2) 사고조사 및 서류 제출 → 3) 보험사 손해사정 → 4) 환자측과 합의/조정 → 5) 보험금 지급. 48시간 이내 통보가 원칙입니다.'
  },
  {
    q: '면책사항으로 보상이 안 되는 경우는?',
    a: '고의 또는 중대한 과실, 면허 정지/취소 중 행위, 미승인 시술, 보험 가입 전 사고, 전쟁/테러, 핵위험 등이 일반적 면책사항입니다.'
  },
  {
    q: '보험 갱신 시 주의사항은?',
    a: '클레임 이력이 있으면 보험료가 인상될 수 있습니다. 갱신 30일 전에 조건을 확인하고, 필요시 다른 보험사 견적을 비교하세요. 보장 공백이 생기지 않도록 주의하세요.'
  },
  {
    q: '개원 시 필수 보험은?',
    a: '화재보험(다중이용업소)은 법적 의무가입입니다. 의료배상책임보험은 법적 의무는 아니지만 대한의사협회에서 강력히 권고하며, 사실상 필수입니다.'
  },
  {
    q: '진료과목별로 보험료가 다른가요?',
    a: '네. 외과, 산부인과, 성형외과 등 시술 비중이 높은 과목은 보험료가 높고, 내과, 소아과 등은 상대적으로 저렴합니다. 가입 시 진료과목을 정확히 고지해야 합니다.'
  },
]

export default function InsuranceComparePage() {
  const [activeTab, setActiveTab] = useState<InsuranceCategory>('의료배상책임보험')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [staffCount, setStaffCount] = useState(5)
  const [areaSize, setAreaSize] = useState(100)
  const [showCalc, setShowCalc] = useState(false)

  const filtered = useMemo(() => insuranceProducts.filter(p => p.category === activeTab), [activeTab])

  const estimatedAnnual = useMemo(() => {
    const medLiability = 45
    const fire = 15 + Math.round(areaSize * 0.05)
    const groupIns = staffCount * 10
    const bizLiability = 20
    const cyber = 25
    return { medLiability, fire, groupIns, bizLiability, cyber, total: medLiability + fire + groupIns + bizLiability + cyber }
  }, [staffCount, areaSize])

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">보험 비교</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(cat => (
            <button key={cat.name} onClick={() => setActiveTab(cat.name)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === cat.name ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filtered.map(product => (
            <div key={product.id} className="card p-5 relative">
              <div className="flex items-center gap-2 mb-3">
                {product.isRequired ? (
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">필수가입</span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">선택가입</span>
                )}
                {product.highlight && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">{product.highlight}</span>
                )}
              </div>

              <div className="mb-3">
                <p className="text-sm text-muted-foreground">{product.company}</p>
                <h3 className="font-bold text-foreground text-lg">{product.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">연간 보험료</p>
                  <p className="font-bold text-foreground">{product.annualPremium}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">보상한도</p>
                  <p className="font-bold text-foreground">{product.coverageLimit}</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> 보장내용
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.coverageDetails.map((c, i) => (
                    <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-md">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> 면책사항
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.exclusions.map((e, i) => (
                    <span key={i} className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-md">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage Comparison Table */}
        <div className="card p-5 mb-8 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> 보험 유형별 비교표
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">구분</th>
                <th className="text-left p-2">의료배상</th>
                <th className="text-left p-2">화재</th>
                <th className="text-left p-2">단체상해</th>
                <th className="text-left p-2">영업배상</th>
                <th className="text-left p-2">사이버</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-2 text-muted-foreground">가입 의무</td>
                <td className="p-2"><span className="text-amber-600 font-medium">권고</span></td>
                <td className="p-2"><span className="text-red-600 font-medium">필수</span></td>
                <td className="p-2">선택</td>
                <td className="p-2">선택</td>
                <td className="p-2">선택</td>
              </tr>
              <tr>
                <td className="p-2 text-muted-foreground">연간 보험료</td>
                <td className="p-2">30~90만</td>
                <td className="p-2">10~30만</td>
                <td className="p-2">5~15만/인</td>
                <td className="p-2">12~30만</td>
                <td className="p-2">15~50만</td>
              </tr>
              <tr>
                <td className="p-2 text-muted-foreground">보상한도</td>
                <td className="p-2">1~5억/건</td>
                <td className="p-2">시가/약정</td>
                <td className="p-2">1~2억</td>
                <td className="p-2">1~2억/건</td>
                <td className="p-2">1~2억/건</td>
              </tr>
              <tr>
                <td className="p-2 text-muted-foreground">우선순위</td>
                <td className="p-2"><span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">1순위</span></td>
                <td className="p-2"><span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">1순위</span></td>
                <td className="p-2"><span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">2순위</span></td>
                <td className="p-2"><span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">2순위</span></td>
                <td className="p-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">3순위</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Insurance Calculator */}
        <div className="card p-5 mb-8">
          <button onClick={() => setShowCalc(!showCalc)} className="w-full flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> 연간 보험료 추정 계산기
            </h2>
            {showCalc ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showCalc && (
            <div className="mt-5 space-y-6">
              <div>
                <label className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">직원 수 (본인 제외)</span>
                  <span className="font-bold text-foreground">{staffCount}명</span>
                </label>
                <input type="range" min={1} max={30} value={staffCount}
                  onChange={e => setStaffCount(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1명</span><span>30명</span></div>
              </div>

              <div>
                <label className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">진료실 면적</span>
                  <span className="font-bold text-foreground">{areaSize}평</span>
                </label>
                <input type="range" min={20} max={300} step={10} value={areaSize}
                  onChange={e => setAreaSize(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>20평</span><span>300평</span></div>
              </div>

              <div className="bg-muted rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">추정 연간 보험료 내역</p>
                <div className="space-y-2 text-sm">
                  {[
                    { label: '의료배상책임보험', value: estimatedAnnual.medLiability },
                    { label: '화재보험', value: estimatedAnnual.fire },
                    { label: `단체상해보험 (${staffCount}명)`, value: estimatedAnnual.groupIns },
                    { label: '영업배상책임보험', value: estimatedAnnual.bizLiability },
                    { label: '사이버보험', value: estimatedAnnual.cyber },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">약 {item.value}만 원</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-foreground">합계 (추정)</span>
                  <span className="font-bold text-primary text-lg">약 {estimatedAnnual.total}만 원/년</span>
                </div>
                <p className="text-xs text-muted-foreground">* 실제 보험료는 진료과목, 매출, 클레임 이력 등에 따라 달라질 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" /> 자주 묻는 질문
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground text-sm pr-4">{faq.q}</span>
                  {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Warning banner */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 mb-1">보험 가입 시 주의사항</p>
              <p className="text-amber-700">
                본 페이지의 보험료와 보장내용은 참고용이며, 실제 조건은 보험사 심사에 따라 달라질 수 있습니다.
                가입 전 반드시 약관을 확인하고, 전문 보험설계사와 상담하시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

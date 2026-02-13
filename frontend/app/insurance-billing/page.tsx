'use client'

import { useState } from 'react'
import {
  ArrowLeft, FileText, AlertTriangle, ChevronDown, ChevronUp,
  Shield, TrendingDown, Calculator, Activity, CheckCircle2,
  Info, BarChart3, Target, Zap
} from 'lucide-react'
import Link from 'next/link'

const specialties = [
  { id: 'internal', label: '내과' },
  { id: 'ortho', label: '정형외과' },
  { id: 'derma', label: '피부과' },
  { id: 'pedia', label: '소아과' },
  { id: 'obgyn', label: '산부인과' },
]

const billingData: Record<string, {
  codes: { code: string; name: string; fee: string; risk: '높음' | '보통' | '낮음' }[];
  topCuts: { item: string; rate: string; reason: string }[];
  avgCutRate: number;
  optimalCutRate: number;
}> = {
  internal: {
    codes: [
      { code: 'AA157', name: '초진 진찰료 (의원)', fee: '17,940', risk: '낮음' },
      { code: 'AA261', name: '재진 진찰료 (의원)', fee: '12,600', risk: '낮음' },
      { code: 'E6541', name: '일반혈액검사 (CBC)', fee: '4,010', risk: '보통' },
      { code: 'B0121', name: '흉부 X선 촬영', fee: '9,130', risk: '낮음' },
      { code: 'C5500', name: '복부 초음파', fee: '51,810', risk: '높음' },
      { code: 'E6591', name: '간기능검사 (GOT/GPT)', fee: '3,560', risk: '보통' },
      { code: 'E6711', name: '당화혈색소 (HbA1c)', fee: '8,400', risk: '보통' },
      { code: 'F2011', name: '위내시경 (진단)', fee: '96,760', risk: '높음' },
      { code: 'E6601', name: '갑상선기능검사', fee: '15,470', risk: '보통' },
      { code: 'BB001', name: '심전도 (ECG)', fee: '11,710', risk: '낮음' },
    ],
    topCuts: [
      { item: '복부 초음파 (C5500)', rate: '12.3%', reason: '적응증 미기재 또는 부적합' },
      { item: '위내시경 (F2011)', rate: '8.7%', reason: '검사 주기 미충족 (2년 이내 재검)' },
      { item: '갑상선기능검사 (E6601)', rate: '6.4%', reason: '일괄 검사 의심 (선별검사 불인정)' },
      { item: '당화혈색소 (E6711)', rate: '5.1%', reason: '당뇨 미확진 환자 검사' },
      { item: '일반혈액검사 (E6541)', rate: '3.8%', reason: '불필요한 반복 검사' },
    ],
    avgCutRate: 5.8,
    optimalCutRate: 2.5,
  },
  ortho: {
    codes: [
      { code: 'AA157', name: '초진 진찰료 (의원)', fee: '17,940', risk: '낮음' },
      { code: 'MX131', name: '도수치료 (1회)', fee: '41,800', risk: '높음' },
      { code: 'B0121', name: 'X선 촬영 (2매)', fee: '11,520', risk: '낮음' },
      { code: 'MX801', name: '체외충격파 치료', fee: '50,000', risk: '높음' },
      { code: 'C5210', name: '근골격 초음파', fee: '30,470', risk: '보통' },
      { code: 'HE011', name: 'MRI (무릎)', fee: '357,900', risk: '높음' },
      { code: 'MM101', name: '물리치료 (전기)', fee: '4,140', risk: '낮음' },
      { code: 'MM301', name: '운동치료 (재활)', fee: '15,460', risk: '보통' },
    ],
    topCuts: [
      { item: '도수치료 (MX131)', rate: '15.2%', reason: '횟수 초과 또는 적응증 부적합' },
      { item: '체외충격파 (MX801)', rate: '11.8%', reason: '비급여 항목 혼동, 적응증 미비' },
      { item: 'MRI (HE011)', rate: '9.3%', reason: '보존치료 미실시 후 바로 촬영' },
      { item: '근골격 초음파 (C5210)', rate: '5.6%', reason: '과잉검사 의심' },
      { item: '운동치료 (MM301)', rate: '4.1%', reason: '처방 일수 초과' },
    ],
    avgCutRate: 7.2,
    optimalCutRate: 3.0,
  },
  derma: {
    codes: [
      { code: 'AA157', name: '초진 진찰료 (의원)', fee: '17,940', risk: '낮음' },
      { code: 'SZ081', name: '피부조직검사', fee: '45,320', risk: '보통' },
      { code: 'J0201', name: '진균검사 (KOH)', fee: '3,640', risk: '낮음' },
      { code: 'SZ641', name: '냉동치료 (사마귀)', fee: '12,430', risk: '보통' },
      { code: 'X7011', name: '알레르기 피부반응검사', fee: '18,560', risk: '높음' },
      { code: 'C5700', name: '피부 초음파', fee: '27,430', risk: '높음' },
      { code: 'J0401', name: '세균배양검사', fee: '11,230', risk: '보통' },
    ],
    topCuts: [
      { item: '알레르기 피부반응검사', rate: '10.5%', reason: '검사 항목 수 과다' },
      { item: '피부 초음파 (C5700)', rate: '8.1%', reason: '의학적 필요성 미입증' },
      { item: '피부조직검사 (SZ081)', rate: '5.7%', reason: '임상적 판단 없이 시행' },
      { item: '냉동치료 (SZ641)', rate: '4.3%', reason: '치료 횟수 초과' },
      { item: '세균배양검사 (J0401)', rate: '2.9%', reason: '경험적 치료 중 불필요 검사' },
    ],
    avgCutRate: 4.9,
    optimalCutRate: 2.0,
  },
  pedia: {
    codes: [
      { code: 'AA157', name: '초진 진찰료 (의원)', fee: '17,940', risk: '낮음' },
      { code: 'E6541', name: '일반혈액검사 (CBC)', fee: '4,010', risk: '보통' },
      { code: 'B0121', name: '흉부 X선 촬영', fee: '9,130', risk: '보통' },
      { code: 'KK011', name: '네블라이저 치료', fee: '3,480', risk: '높음' },
      { code: 'E6801', name: '인플루엔자 신속검사', fee: '19,140', risk: '보통' },
      { code: 'J0101', name: '소변검사 (일반)', fee: '2,890', risk: '낮음' },
      { code: 'E6131', name: 'CRP (염증수치)', fee: '4,470', risk: '보통' },
    ],
    topCuts: [
      { item: '네블라이저 (KK011)', rate: '13.4%', reason: '경증 상기도감염에 과잉처방' },
      { item: '흉부 X선 (B0121)', rate: '7.2%', reason: '단순 감기에 불필요한 촬영' },
      { item: 'CRP (E6131)', rate: '5.8%', reason: '바이러스 감염에 반복 검사' },
      { item: '일반혈액검사 (E6541)', rate: '4.5%', reason: '경증 환자 일괄 검사' },
      { item: '인플루엔자 신속검사', rate: '3.2%', reason: '비유행 시기 과잉 검사' },
    ],
    avgCutRate: 6.1,
    optimalCutRate: 2.8,
  },
  obgyn: {
    codes: [
      { code: 'AA157', name: '초진 진찰료 (의원)', fee: '17,940', risk: '낮음' },
      { code: 'C5610', name: '부인과 초음파', fee: '38,210', risk: '보통' },
      { code: 'E7011', name: '자궁경부암 검사', fee: '8,640', risk: '낮음' },
      { code: 'E6601', name: '호르몬검사 (FSH/LH)', fee: '18,540', risk: '보통' },
      { code: 'F2401', name: '자궁경 검사', fee: '67,230', risk: '높음' },
      { code: 'C5620', name: '산전 초음파', fee: '42,530', risk: '보통' },
      { code: 'E6301', name: '풍진항체 검사', fee: '9,870', risk: '낮음' },
    ],
    topCuts: [
      { item: '자궁경 검사 (F2401)', rate: '9.8%', reason: '적응증 불명확' },
      { item: '호르몬검사 (E6601)', rate: '7.4%', reason: '반복 검사 주기 부적합' },
      { item: '부인과 초음파 (C5610)', rate: '5.6%', reason: '과잉 추적검사' },
      { item: '산전 초음파 (C5620)', rate: '3.9%', reason: '횟수 초과 (급여 기준)' },
      { item: '풍진항체 검사 (E6301)', rate: '2.1%', reason: '이미 면역 확인된 환자 재검' },
    ],
    avgCutRate: 5.4,
    optimalCutRate: 2.3,
  },
}

const optimizationTips = [
  { title: '정확한 상병코드 매칭', content: '검사 및 처치의 적응증에 맞는 KCD 상병코드를 정확히 기재하세요. 코드 불일치는 자동 삭감의 가장 큰 원인입니다. 주상병과 부상병을 구분하여 기재하고, 검사별 인정 상병코드를 사전에 확인하십시오.' },
  { title: '검사 사유 기재 요령', content: '특수검사(초음파, 내시경, MRI 등)는 반드시 의학적 필요성을 진료기록에 상세히 기재하세요. "환자 호소", "이학적 검사 소견", "이전 치료 경과" 등 근거를 명시하면 심사 통과율이 현저히 올라갑니다.' },
  { title: '투약 적정성 근거 확보', content: '처방 약물의 용량, 기간, 병용 근거를 기록하세요. 특히 항생제는 경험적 투여 시 배양검사 시행 여부, 가이드라인 준수 내역을 남기는 것이 중요합니다.' },
  { title: '진료기록 작성 원칙', content: 'SOAP 형식(주관적 호소, 객관적 소견, 평가, 계획)으로 진료기록을 작성하면 심사 시 논리적 흐름이 인정됩니다. 약어 사용을 줄이고, 판독 소견은 구체적으로 기재하세요.' },
  { title: '이의신청 절차 및 요령', content: '삭감 통보 후 90일 이내에 이의신청이 가능합니다. 원심사 결과서, 의학적 근거 논문, 가이드라인 문서를 첨부하면 인용률이 높아집니다. 이의신청 성공률은 평균 40% 수준이며, 근거 자료가 충분할 경우 70%까지 올라갑니다.' },
]

export default function InsuranceBillingPage() {
  const [specialty, setSpecialty] = useState('internal')
  const [expandedTip, setExpandedTip] = useState<number | null>(null)
  const [dailyPatients, setDailyPatients] = useState(40)
  const [avgFee, setAvgFee] = useState(35000)

  const data = billingData[specialty]
  const specLabel = specialties.find(s => s.id === specialty)?.label || ''

  const monthlyBilling = dailyPatients * avgFee * 25
  const expectedCut = Math.round(monthlyBilling * data.avgCutRate / 100)
  const expectedPay = monthlyBilling - expectedCut
  const optimalCut = Math.round(monthlyBilling * data.optimalCutRate / 100)
  const savings = expectedCut - optimalCut

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-lg">건강보험 청구 최적화</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">전국 평균 삭감율</span>
            </div>
            <p className="text-2xl font-bold">5.2%</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">목표 삭감율</span>
            </div>
            <p className="text-2xl font-bold text-green-600">3% 이하</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{specLabel} 평균</span>
            </div>
            <p className="text-2xl font-bold">{data.avgCutRate}%</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">{specLabel} 최적</span>
            </div>
            <p className="text-2xl font-bold text-primary">{data.optimalCutRate}%</p>
          </div>
        </div>

        {/* Specialty Selector */}
        <div className="flex gap-2 flex-wrap">
          {specialties.map(s => (
            <button
              key={s.id}
              onClick={() => setSpecialty(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                specialty === s.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Billing Codes Table */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4">{specLabel} 주요 청구 코드</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">코드</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">항목명</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">수가(원)</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">삭감위험도</th>
                </tr>
              </thead>
              <tbody>
                {data.codes.map(c => (
                  <tr key={c.code} className="border-b border-muted/50 hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono text-xs">{c.code}</td>
                    <td className="py-2.5 px-3">{c.name}</td>
                    <td className="py-2.5 px-3 text-right">{c.fee}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.risk === '높음' ? 'bg-red-500/15 text-red-500' :
                        c.risk === '보통' ? 'bg-yellow-500/15 text-yellow-600' :
                        'bg-green-500/15 text-green-600'
                      }`}>
                        {c.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Cuts Warning */}
        <div className="card p-5 border-l-4 border-red-500">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {specLabel} 삭감 빈발 항목 TOP 5
          </h2>
          <div className="space-y-3">
            {data.topCuts.map((cut, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                i < 2 ? 'bg-red-500/10' : i < 4 ? 'bg-yellow-500/10' : 'bg-muted/50'
              }`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i < 2 ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{cut.item}</span>
                    <span className="text-red-500 font-bold text-sm">삭감율 {cut.rate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cut.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Simulator */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            월간 청구 시뮬레이터
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">일평균 환자 수</label>
              <input type="number" value={dailyPatients} onChange={e => setDailyPatients(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border-none text-foreground" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">평균 진료비 (원)</label>
              <input type="number" value={avgFee} onChange={e => setAvgFee(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border-none text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">월 청구액</p>
              <p className="text-lg font-bold">{(monthlyBilling / 10000).toLocaleString()}만원</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">예상 삭감액 ({data.avgCutRate}%)</p>
              <p className="text-lg font-bold text-red-500">{(expectedCut / 10000).toLocaleString()}만원</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">예상 지급액</p>
              <p className="text-lg font-bold text-green-600">{(expectedPay / 10000).toLocaleString()}만원</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">최적화 시 절감</p>
              <p className="text-lg font-bold text-primary">+{(savings / 10000).toLocaleString()}만원</p>
            </div>
          </div>
        </div>

        {/* Optimization Tips Accordion */}
        <div className="card p-5">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            청구 최적화 팁
          </h2>
          <div className="space-y-2">
            {optimizationTips.map((tip, i) => (
              <div key={i} className="border border-muted rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="font-medium text-sm">{tip.title}</span>
                  </div>
                  {expandedTip === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedTip === i && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed pl-9">{tip.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="card p-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">유의사항</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                본 자료는 참고용이며 실제 수가 및 삭감 기준은 건강보험심사평가원의 최신 고시를 확인하시기 바랍니다.
                진료과목, 지역, 의료기관 유형에 따라 심사 기준이 다를 수 있습니다.
                정확한 청구를 위해 전문 청구 대행 서비스 이용을 권장합니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

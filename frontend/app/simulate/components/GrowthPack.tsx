'use client'

import React from 'react'
import { Rocket, GitBranch, Globe2, Heart, GraduationCap, Lightbulb, Building, Users2, LineChart, Crown } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props { result: SimulationResponse }

function Card({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function fmt(v: number) {
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`
  return `${Math.round(v / 10000).toLocaleString()}만`
}

export default function GrowthPack({ result }: Props) {
  const rev = result.estimated_monthly_revenue.avg
  const profit = result.profitability

  return (
    <>
      {/* 1. 2호점 확장 타당성 */}
      <Card icon={GitBranch} title="2호점 확장 타당성 분석" color="text-blue-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-xl font-bold text-blue-600">3년차</div>
            <div className="text-[10px] text-muted-foreground">추천 확장 시점</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">{fmt(450000000)}</div>
            <div className="text-[10px] text-muted-foreground">추가 투자 필요</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">18개월</div>
            <div className="text-[10px] text-muted-foreground">예상 회수 기간</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { condition: '1호점 월 매출 1.2억 이상', met: true, current: `현재 ${fmt(rev)}` },
            { condition: '안정적 수익률 30% 이상', met: true, current: `현재 ${Math.round((profit.monthly_profit_avg / rev) * 100)}%` },
            { condition: '고정 환자 500명 이상', met: false, current: '목표 달성 필요' },
            { condition: '관리 인력 확보', met: false, current: '원장/매니저 필요' },
            { condition: '자기자본 2억 이상 확보', met: false, current: '적립 진행 중' },
          ].map((c) => (
            <div key={c.condition} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                c.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>{c.met ? '✓' : '○'}</span>
              <span className="text-xs text-foreground flex-1">{c.condition}</span>
              <span className="text-[10px] text-muted-foreground">{c.current}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">확장 준비도: <span className="font-bold text-foreground">40%</span> — 3년차에 조건 충족 시 2호점 검토 가능</p>
      </Card>

      {/* 2. 진료과 확장 */}
      <Card icon={Lightbulb} title="진료과 확장 · 부가 수익원" color="text-amber-500">
        <div className="space-y-3">
          {[
            { service: '건강검진 센터', investment: 80000000, monthly: 15000000, timeline: '6개월', synergy: 95 },
            { service: '통증의학 클리닉', investment: 50000000, monthly: 8000000, timeline: '3개월', synergy: 88 },
            { service: '비만/체형 관리', investment: 30000000, monthly: 6000000, timeline: '2개월', synergy: 72 },
            { service: '스포츠의학', investment: 40000000, monthly: 7000000, timeline: '4개월', synergy: 80 },
            { service: '미용/피부 시술', investment: 60000000, monthly: 12000000, timeline: '4개월', synergy: 55 },
          ].map((s) => (
            <div key={s.service} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{s.service}</span>
                <span className="text-xs font-bold text-amber-600">시너지 {s.synergy}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>투자: <span className="font-medium text-foreground">{fmt(s.investment)}</span></div>
                <div>월 매출: <span className="font-medium text-green-600">{fmt(s.monthly)}</span></div>
                <div>소요: <span className="font-medium text-foreground">{s.timeline}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 제휴/파트너십 */}
      <Card icon={Heart} title="제휴 · 파트너십 기회" color="text-green-500">
        <div className="space-y-2">
          {[
            { partner: '인근 약국 (처방전 연계)', benefit: '환자 편의 + 추천 관계', revenue: '간접 효과', difficulty: '쉬움' },
            { partner: '기업 건강검진 (10개사+)', benefit: '안정적 벌크 수익', revenue: '월 2,000-4,000만', difficulty: '보통' },
            { partner: '보험사 지정병원', benefit: '보험 환자 유입', revenue: '월 500-1,000만', difficulty: '보통' },
            { partner: '스포츠 센터/헬스장', benefit: '부상 환자 유입', revenue: '월 300-500만', difficulty: '쉬움' },
            { partner: '학교/학원 (검진)', benefit: '소아/청소년 환자', revenue: '연 500-800만', difficulty: '쉬움' },
            { partner: '의료 관광 에이전시', benefit: '외국인 환자', revenue: '월 500-2,000만', difficulty: '어려움' },
            { partner: '온라인 건강 플랫폼', benefit: '비대면 환자 유입', revenue: '월 200-500만', difficulty: '보통' },
          ].map((p) => (
            <div key={p.partner} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <span className="text-sm text-foreground">{p.partner}</span>
                <p className="text-[10px] text-muted-foreground">{p.benefit}</p>
              </div>
              <span className="text-[10px] font-medium text-green-600 w-24 text-right">{p.revenue}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                p.difficulty === '쉬움' ? 'bg-green-100 text-green-600' :
                p.difficulty === '보통' ? 'bg-blue-100 text-blue-600' :
                'bg-amber-100 text-amber-600'
              }`}>{p.difficulty}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. 직원 성장 계획 */}
      <Card icon={GraduationCap} title="직원 교육 · 성장 계획" color="text-blue-500">
        <div className="space-y-2">
          {[
            { program: '의료 서비스 교육', freq: '월 1회', duration: '2시간', cost: '내부', target: '전 직원', impact: 92 },
            { program: '감염관리 교육', freq: '분기 1회', duration: '3시간', cost: '무료', target: '전 직원', impact: 95 },
            { program: 'EMR/장비 교육', freq: '입사 시', duration: '1주', cost: '내부', target: '신입', impact: 88 },
            { program: '리더십 교육', freq: '연 1회', duration: '8시간', cost: '50만', target: '팀장급', impact: 75 },
            { program: '학술 세미나', freq: '분기 1회', duration: '4시간', cost: '건당 15만', target: '의사/치료사', impact: 82 },
            { program: 'CPR/응급처치', freq: '연 1회', duration: '4시간', cost: '무료', target: '전 직원', impact: 98 },
          ].map((p) => (
            <div key={p.program} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <span className="text-sm text-foreground">{p.program}</span>
                <div className="text-[10px] text-muted-foreground">{p.target} · {p.freq} · {p.duration}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{p.cost}</span>
              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.impact}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">연간 교육 예산: <span className="font-bold text-foreground">약 180만원</span> · 직원 이직률 <span className="font-bold text-green-600">50% 감소</span> 기대</p>
      </Card>

      {/* 5. 브랜드 구축 전략 */}
      <Card icon={Crown} title="지역 브랜드 구축 전략" color="text-blue-500">
        <div className="space-y-3">
          {[
            { phase: '1단계: 인지도 (0-6개월)', items: ['병원명 + 로고 디자인 (200만)', '네이버 플레이스 완성도 100%', '진료과 특화 블로그 50편', '오프닝 이벤트 + 지역 커뮤니티 활동'], budget: '500만' },
            { phase: '2단계: 신뢰 (6-12개월)', items: ['환자 리뷰 200건 달성', '건강 강좌/세미나 월 1회', '지역 언론 보도 2건+', '학술 활동/논문 발표'], budget: '300만' },
            { phase: '3단계: 선호 (1-2년)', items: ['환자 만족도 90점 이상', '추천 환자 비율 30% 이상', '인스타 팔로워 5,000+', '유튜브 구독자 1,000+'], budget: '200만' },
            { phase: '4단계: 지역 1위 (2-3년)', items: ['네이버 검색 1페이지 고정', '기업 검진 10개사+ 제휴', '의료 브랜드 어워드 수상', '2호점 브랜드 확장 가능'], budget: '150만' },
          ].map((p) => (
            <div key={p.phase} className="p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{p.phase}</span>
                <span className="text-[10px] text-blue-600 font-medium">월 {p.budget}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {p.items.map((item) => (
                  <div key={item} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    <span className="text-[10px] text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. 지역 커뮤니티 전략 */}
      <Card icon={Users2} title="지역 커뮤니티 참여 전략" color="text-blue-500">
        <div className="space-y-2">
          {[
            { activity: '무료 건강 강좌 (월 1회)', target: '주민 센터', attendees: '20-30명', cost: '20만', effect: '인지도 + 신뢰' },
            { activity: '학교 건강 교육', target: '초중고', attendees: '100-200명', cost: '무료', effect: '학부모 환자 유입' },
            { activity: '지역 체육대회 의료지원', target: '구청', attendees: '-', cost: '10만', effect: '브랜드 노출' },
            { activity: '노인 무료 검진 (분기)', target: '경로당', attendees: '30-50명', cost: '50만', effect: '노인 환자 확보' },
            { activity: '직장인 건강 세미나', target: '인근 기업', attendees: '30-50명', cost: '30만', effect: '기업 검진 제휴' },
            { activity: 'SNS 건강 챌린지', target: '온라인', attendees: '500명+', cost: '50만', effect: '바이럴 마케팅' },
          ].map((a) => (
            <div key={a.activity} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30">
              <div className="flex-1">
                <span className="text-sm text-foreground">{a.activity}</span>
                <div className="text-[10px] text-muted-foreground">{a.target} · {a.attendees}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{a.cost}</span>
              <span className="text-[10px] text-blue-600 font-medium w-20 text-right">{a.effect}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. 매출 성장 시뮬레이션 */}
      <Card icon={LineChart} title="5년 매출 성장 시뮬레이션" color="text-blue-600">
        <div className="space-y-2">
          {[
            { year: '1년차', quarterly: [rev * 0.7, rev * 0.85, rev * 0.95, rev * 1.05] },
            { year: '2년차', quarterly: [rev * 1.05, rev * 1.12, rev * 1.18, rev * 1.22] },
            { year: '3년차', quarterly: [rev * 1.22, rev * 1.28, rev * 1.32, rev * 1.38] },
            { year: '4년차', quarterly: [rev * 1.38, rev * 1.42, rev * 1.48, rev * 1.52] },
            { year: '5년차', quarterly: [rev * 1.52, rev * 1.55, rev * 1.60, rev * 1.65] },
          ].map((y) => (
            <div key={y.year} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">{y.year}</span>
              <div className="flex-1 flex gap-1">
                {y.quarterly.map((q, i) => (
                  <div key={i} className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-blue-600 rounded" style={{ width: `${(q / (rev * 1.7)) * 100}%`, opacity: 0.5 + i * 0.15 }} />
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-medium text-foreground w-14 text-right">{fmt(y.quarterly[3])}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{fmt(rev * 1.65)}</div>
            <div className="text-[10px] text-muted-foreground">5년차 월 매출</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-green-600">+{Math.round(((rev * 1.65) / rev - 1) * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">5년 성장률</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">{fmt(rev * 1.65 * 12)}</div>
            <div className="text-[10px] text-muted-foreground">5년차 연매출</div>
          </div>
        </div>
      </Card>

      {/* 8. 디지털 전환 로드맵 */}
      <Card icon={Globe2} title="디지털 전환 로드맵" color="text-blue-600">
        <div className="space-y-3">
          {[
            { phase: 'Phase 1: 기본 디지털화', items: ['EMR + PACS 도입', '온라인 예약 시스템', '카카오 알림톡', '네이버 플레이스'], timeline: '개원 시', cost: '500만' },
            { phase: 'Phase 2: 자동화', items: ['키오스크 접수', 'CRM 자동 마케팅', '자동 리마인더', '전자 동의서'], timeline: '6개월', cost: '800만' },
            { phase: 'Phase 3: AI 도입', items: ['AI 영상 판독 보조', 'AI 예약 최적화', '챗봇 상담', 'AI 청구 검증'], timeline: '12개월', cost: '600만' },
            { phase: 'Phase 4: 스마트 클리닉', items: ['비대면 진료', '원격 모니터링', '웨어러블 연동', '데이터 기반 경영'], timeline: '24개월', cost: '400만' },
          ].map((p, i) => (
            <div key={p.phase} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                  ['bg-blue-400', 'bg-blue-600', 'bg-blue-600', 'bg-blue-700'][i]
                }`}>{i + 1}</div>
                {i < 3 && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{p.phase}</span>
                  <span className="text-[10px] text-muted-foreground">{p.timeline} · {p.cost}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.items.map((item) => (
                    <span key={item} className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-full">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 리스크 대비 시나리오 */}
      <Card icon={Rocket} title="위기 대응 시나리오 플래닝" color="text-red-500">
        <div className="space-y-3">
          {[
            { scenario: '감염병 대유행', probability: 15, impact: 'HIGH', plan: '비대면 진료 즉시 전환, 운전자금 6개월 확보', preparation: '원격 진료 시스템 사전 구축' },
            { scenario: '핵심 직원 이탈', probability: 30, impact: 'MEDIUM', plan: '크로스 트레이닝 + 인력풀 확보', preparation: '업무 매뉴얼 문서화, 채용 네트워크 유지' },
            { scenario: '건보 수가 인하', probability: 25, impact: 'MEDIUM', plan: '비보험 비중 확대 + 비용 절감', preparation: '비보험 특화 서비스 준비' },
            { scenario: '대형 경쟁자 진입', probability: 20, impact: 'HIGH', plan: '차별화 서비스 강화 + 충성도 프로그램', preparation: '브랜드/리뷰 경쟁력 조기 확보' },
            { scenario: '임대료 급등', probability: 35, impact: 'MEDIUM', plan: '장기 임대 계약 + 이전 옵션 확보', preparation: '5년 이상 장기 계약 권장' },
          ].map((s) => (
            <div key={s.scenario} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{s.scenario}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">확률 {s.probability}%</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    s.impact === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>{s.impact === 'HIGH' ? '고영향' : '중영향'}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">대응: {s.plan}</p>
              <p className="text-[10px] text-blue-600">사전 준비: {s.preparation}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 장기 비전 */}
      <Card icon={Building} title="10년 장기 비전 로드맵" color="text-slate-600">
        <div className="space-y-3">
          {[
            { year: '1-2년', vision: '지역 신뢰 구축', kpi: '환자 1,000명 확보', revenue: `월 ${fmt(rev * 1.2)}`, icon: '🌱' },
            { year: '3-4년', vision: '지역 1위 달성', kpi: '시장 점유율 20%', revenue: `월 ${fmt(rev * 1.5)}`, icon: '🌿' },
            { year: '5-6년', vision: '2호점 확장', kpi: '2개 지점 운영', revenue: `총 월 ${fmt(rev * 2.5)}`, icon: '🌳' },
            { year: '7-8년', vision: '그룹 경영', kpi: '3-4개 지점 + 검진센터', revenue: `총 월 ${fmt(rev * 4)}`, icon: '🏢' },
            { year: '9-10년', vision: '의료 그룹 완성', kpi: '연 매출 100억+ 달성', revenue: `총 월 ${fmt(rev * 6)}`, icon: '🏆' },
          ].map((v, i) => (
            <div key={v.year} className="flex gap-3 items-start">
              <div className="text-2xl">{v.icon}</div>
              <div className="flex-1 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{v.year}: {v.vision}</span>
                  <span className="text-xs font-bold text-foreground">{v.revenue}</span>
                </div>
                <p className="text-xs text-muted-foreground">{v.kpi}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

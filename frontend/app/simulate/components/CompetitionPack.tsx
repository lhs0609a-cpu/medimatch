'use client'

import React from 'react'
import { Target, Search, Star, BarChart, Users, DollarSign, TrendingUp, Shield, Zap, Award } from 'lucide-react'
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

export default function CompetitionPack({ result }: Props) {
  const competitors = result.competitors.length || 5

  return (
    <>
      {/* 1. 경쟁자 프로파일 */}
      <Card icon={Search} title="핵심 경쟁자 상세 프로파일" color="text-red-500">
        <div className="space-y-3">
          {(() => {
            const comps = result.competitors || []
            if (comps.length > 0) {
              return comps.slice(0, 4).map((c, i) => ({
                name: c.name, dist: c.distance_m, years: c.years_open || 5,
                doctors: Math.max(1, Math.ceil(((c as any).est_monthly_revenue || 50000000) / 40000000)),
                specialty: c.specialty_detail || '일반 진료', strength: i === 0 ? '높은 인지도' : i === 1 ? '최신 장비' : i === 2 ? '대형 규모' : '접근성 좋음',
                weakness: i === 0 ? '높은 가격' : i === 1 ? '낮은 인지도' : i === 2 ? '긴 대기시간' : '소규모',
                rating: c.rating || 4.0, share: Math.round(100 / (comps.length + 1)),
              }))
            }
            const cnt = result.competition?.same_dept_count || 0
            return cnt > 0 ? [
              { name: `${result.clinic_type} A의원`, dist: 250, years: 8, doctors: 2, specialty: '전문 진료', strength: '높은 인지도', weakness: '노후 시설', rating: 4.5, share: 28 },
              { name: `${result.clinic_type} B클리닉`, dist: 400, years: 3, doctors: 1, specialty: '비보험 특화', strength: '최신 장비', weakness: '낮은 인지도', rating: 4.3, share: 15 },
            ] : [
              { name: '인접 진료과 의원 A', dist: 300, years: 5, doctors: 1, specialty: '유사 진료', strength: '기존 환자', weakness: '전문성 부족', rating: 4.2, share: 20 },
            ]
          })().map((c) => (
            <div key={c.name} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{c.dist}m · {c.years}년차</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-foreground">{c.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                <div>의사: <span className="text-foreground font-medium">{c.doctors}명</span></div>
                <div>특화: <span className="text-foreground font-medium">{c.specialty}</span></div>
                <div>점유율: <span className="text-foreground font-medium">{c.share}%</span></div>
                <div>강점: <span className="text-green-600 font-medium">{c.strength}</span></div>
              </div>
              <p className="text-[10px] text-red-500 mt-1">약점: {c.weakness}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. 시장 점유율 */}
      <Card icon={Target} title="지역 시장 점유율 분석" color="text-blue-600">
        <div className="space-y-2 mb-4">
          {(() => {
            const comps = result.competitors || []
            const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
            const myShare = result.competition_detail?.estimated_market_share || 10
            const others = comps.slice(0, 4).map((c, i) => ({
              name: c.name.slice(0, 8), share: Math.round((100 - myShare) / Math.max(comps.length, 1)), color: colors[i % colors.length],
            }))
            return [...others, { name: '내 의원 (예상)', share: Math.round(myShare), color: '#8b5cf6' }]
          })().map((m) => (
            <div key={m.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
              <span className="text-xs text-foreground flex-1">{m.name}</span>
              <div className="w-40 h-4 bg-muted rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${m.share * 2.5}%`, backgroundColor: m.color }} />
              </div>
              <span className="text-xs font-bold text-foreground w-10 text-right">{m.share}%</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">10%</div>
            <div className="text-[10px] text-muted-foreground">1년차 목표 점유율</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">18%</div>
            <div className="text-[10px] text-muted-foreground">3년차 목표 점유율</div>
          </div>
        </div>
      </Card>

      {/* 3. 가격 포지셔닝 */}
      <Card icon={DollarSign} title="가격 포지셔닝 전략" color="text-green-600">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">시술/항목</th>
                <th className="text-right py-2 text-muted-foreground text-xs">경쟁사 최저</th>
                <th className="text-right py-2 text-muted-foreground text-xs">경쟁사 평균</th>
                <th className="text-right py-2 text-muted-foreground text-xs">경쟁사 최고</th>
                <th className="text-right py-2 text-muted-foreground text-xs">추천 가격</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: '도수치료 (1회)', low: '6만', avg: '8만', high: '12만', rec: '7.5만' },
                { item: '체외충격파', low: '3만', avg: '5만', high: '7만', rec: '4.5만' },
                { item: '프롤로치료', low: '8만', avg: '12만', high: '18만', rec: '11만' },
                { item: 'PRP 주사', low: '15만', avg: '20만', high: '30만', rec: '18만' },
                { item: '건강검진 기본', low: '8만', avg: '15만', high: '25만', rec: '12만' },
                { item: '건강검진 정밀', low: '25만', avg: '40만', high: '60만', rec: '35만' },
              ].map((p) => (
                <tr key={p.item} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{p.item}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.low}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.avg}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.high}</td>
                  <td className="py-1.5 text-right text-green-600 text-xs font-bold">{p.rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded">전략: 평균 대비 5-10% 저렴하게 진입 → 6개월 후 점진적 인상 (리뷰/인지도 확보 후)</p>
      </Card>

      {/* 4. 온라인 존재감 비교 */}
      <Card icon={Star} title="온라인 존재감 비교 분석" color="text-amber-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">병원</th>
                <th className="text-right py-2 text-muted-foreground text-xs">네이버 리뷰</th>
                <th className="text-right py-2 text-muted-foreground text-xs">블로그</th>
                <th className="text-right py-2 text-muted-foreground text-xs">인스타</th>
                <th className="text-right py-2 text-muted-foreground text-xs">유튜브</th>
                <th className="text-right py-2 text-muted-foreground text-xs">점수</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'A의원', reviews: 284, blogs: 45, insta: '2.1K', youtube: '850', score: 82 },
                { name: 'B클리닉', reviews: 89, blogs: 22, insta: '5.2K', youtube: '3.2K', score: 75 },
                { name: 'C병원', reviews: 512, blogs: 120, insta: '8.5K', youtube: '12K', score: 95 },
                { name: 'D의원', reviews: 156, blogs: 18, insta: '1.8K', youtube: '-', score: 58 },
                { name: '내 목표 (1년)', reviews: 150, blogs: 50, insta: '3K', youtube: '1K', score: 72 },
              ].map((h) => (
                <tr key={h.name} className={`border-b border-border/50 ${h.name.includes('목표') ? 'bg-amber-50 dark:bg-amber-950/20 font-medium' : ''}`}>
                  <td className="py-1.5 text-foreground text-xs">{h.name}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{h.reviews}건</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{h.blogs}편</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{h.insta}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{h.youtube}</td>
                  <td className="py-1.5 text-right text-amber-600 text-xs font-bold">{h.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. 환자 획득 비용 */}
      <Card icon={Users} title="환자 획득 비용(CAC) 비교" color="text-violet-500">
        <div className="space-y-2 mb-4">
          {[
            { channel: '지인 추천', cac: 0, ltv: 1200000, ratio: 999, quality: 95, color: '#22c55e' },
            { channel: '네이버 검색', cac: 18000, ltv: 850000, ratio: 47, quality: 82, color: '#3b82f6' },
            { channel: '블로그/SEO', cac: 12000, ltv: 920000, ratio: 77, quality: 85, color: '#06b6d4' },
            { channel: 'SNS 광고', cac: 25000, ltv: 650000, ratio: 26, quality: 68, color: '#8b5cf6' },
            { channel: '카카오 광고', cac: 22000, ltv: 720000, ratio: 33, quality: 72, color: '#f59e0b' },
            { channel: '오프라인', cac: 35000, ltv: 580000, ratio: 17, quality: 60, color: '#ef4444' },
          ].map((ch) => (
            <div key={ch.channel} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
              <span className="text-xs text-foreground flex-1">{ch.channel}</span>
              <span className="text-[10px] text-muted-foreground w-14 text-right">CAC {ch.cac === 0 ? '0원' : `${ch.cac / 10000}만`}</span>
              <span className="text-[10px] text-muted-foreground w-14 text-right">LTV {ch.ltv / 10000}만</span>
              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(ch.quality, 100)}%`, backgroundColor: ch.color }} />
              </div>
              <span className="text-[10px] font-bold text-foreground w-12 text-right">{ch.ratio > 100 ? '∞' : `${ch.ratio}x`}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground p-2 bg-violet-50 dark:bg-violet-950/20 rounded">평균 CAC: <span className="font-bold text-foreground">약 1.9만원</span> · 목표 LTV/CAC 비율: <span className="font-bold text-green-600">40x 이상</span></p>
      </Card>

      {/* 6. 서비스 차별화 매트릭스 */}
      <Card icon={Zap} title="서비스 차별화 매트릭스" color="text-orange-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">차별화 요소</th>
                <th className="text-center py-2 text-muted-foreground text-xs">A의원</th>
                <th className="text-center py-2 text-muted-foreground text-xs">B</th>
                <th className="text-center py-2 text-muted-foreground text-xs">C병원</th>
                <th className="text-center py-2 text-muted-foreground text-xs">내 의원</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: '야간 진료', a: '×', b: '○', c: '×', me: '○', priority: true },
                { item: '주말 진료', a: '△', b: '○', c: '○', me: '○', priority: false },
                { item: '온라인 예약', a: '○', b: '○', c: '○', me: '○', priority: false },
                { item: '비대면 진료', a: '×', b: '×', c: '△', me: '○', priority: true },
                { item: '최신 장비 (AI)', a: '×', b: '○', c: '△', me: '○', priority: true },
                { item: '무료 주차', a: '○', b: '×', c: '○', me: '△', priority: false },
                { item: '영어 진료', a: '×', b: '×', c: '○', me: '○', priority: true },
                { item: '키즈 공간', a: '×', b: '×', c: '○', me: '△', priority: false },
              ].map((s) => (
                <tr key={s.item} className={`border-b border-border/50 ${s.priority ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}>
                  <td className="py-1.5 text-foreground text-xs">
                    {s.item}
                    {s.priority && <span className="text-[9px] text-orange-500 ml-1">★차별화</span>}
                  </td>
                  <td className="py-1.5 text-center text-xs">{s.a}</td>
                  <td className="py-1.5 text-center text-xs">{s.b}</td>
                  <td className="py-1.5 text-center text-xs">{s.c}</td>
                  <td className="py-1.5 text-center text-xs font-bold text-orange-600">{s.me}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. SWOT 경쟁 분석 */}
      <Card icon={Shield} title="경쟁 SWOT 분석" color="text-emerald-500">
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: '강점 (Strength)', items: ['신규 장비/시설', '디지털 마케팅 역량', '비대면 진료 가능', '젊은 의사 이미지'], color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300' },
            { title: '약점 (Weakness)', items: ['낮은 초기 인지도', '신뢰 구축 필요', '작은 규모', '경력 부족 인식'], color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300' },
            { title: '기회 (Opportunity)', items: ['노인 인구 증가', '비보험 수요 확대', '디지털 전환 트렌드', '주변 재개발 호재'], color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300' },
            { title: '위협 (Threat)', items: ['기존 경쟁자 대응', '임대료 상승', '의료 정책 변화', '인력 수급 어려움'], color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300' },
          ].map((quad) => (
            <div key={quad.title} className={`p-4 rounded-xl border ${quad.color}`}>
              <h4 className={`text-xs font-semibold mb-2 ${quad.textColor}`}>{quad.title}</h4>
              <ul className="space-y-1">
                {quad.items.map((item, idx) => (
                  <li key={idx} className="text-[10px] text-foreground flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 경쟁자 매출 추정 */}
      <Card icon={BarChart} title="경쟁자 월 매출 추정 비교" color="text-sky-500">
        <div className="space-y-2">
          {[
            { name: 'C병원 (대형)', rev: 280000000, patients: 85, years: 15, color: '#ef4444' },
            { name: 'A의원 (중견)', rev: 120000000, patients: 48, years: 8, color: '#f59e0b' },
            { name: 'B클리닉', rev: 65000000, patients: 28, years: 3, color: '#3b82f6' },
            { name: 'D의원', rev: 52000000, patients: 22, years: 5, color: '#22c55e' },
            { name: '내 의원 (1년차)', rev: result.estimated_monthly_revenue.avg, patients: 38, years: 1, color: '#8b5cf6' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-foreground w-28 flex-shrink-0">{c.name}</span>
              <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${(c.rev / 280000000) * 100}%`, backgroundColor: c.color }} />
              </div>
              <span className="text-xs font-medium text-foreground w-14 text-right">{c.rev >= 100000000 ? `${(c.rev / 100000000).toFixed(1)}억` : `${Math.round(c.rev / 10000)}만`}</span>
              <span className="text-[10px] text-muted-foreground w-10 text-right">{c.patients}명/일</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 성장 속도 비교 */}
      <Card icon={TrendingUp} title="성장 속도 벤치마크" color="text-fuchsia-500">
        <p className="text-xs text-muted-foreground mb-3">개원 후 시기별 평균 성과 (지역 {result.clinic_type} 기준)</p>
        <div className="space-y-3">
          {[
            { period: '1-3개월', patients: '15-20명/일', revenue: '3,000-4,500만', breakeven: '60%', milestone: '기반 구축기' },
            { period: '4-6개월', patients: '25-30명/일', revenue: '5,000-6,500만', breakeven: '85%', milestone: '인지도 확보' },
            { period: '7-12개월', patients: '35-42명/일', revenue: '7,000-8,500만', breakeven: '110%', milestone: '안정 성장' },
            { period: '2년차', patients: '40-50명/일', revenue: '8,500-1.1억', breakeven: '130%', milestone: '성장 가속' },
            { period: '3년차', patients: '48-58명/일', revenue: '1.0-1.3억', breakeven: '155%', milestone: '시장 확립' },
          ].map((p) => (
            <div key={p.period} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{p.period}</span>
                <span className="text-[10px] px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 rounded-full">{p.milestone}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>환자: <span className="font-medium text-foreground">{p.patients}</span></div>
                <div>매출: <span className="font-medium text-foreground">{p.revenue}</span></div>
                <div>BEP: <span className={`font-medium ${parseInt(p.breakeven) >= 100 ? 'text-green-600' : 'text-amber-600'}`}>{p.breakeven}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 경쟁 우위 전략 */}
      <Card icon={Award} title="경쟁 우위 확보 전략 로드맵" color="text-indigo-600">
        <div className="space-y-3">
          {[
            { phase: '1단계: 진입 (0-3개월)', strategies: ['공격적 가격 책정 (시장가 -10%)', '오프라인 인지도 확보 (배너, 전단)', '네이버 플레이스 최적화', '개원 이벤트 + SNS 바이럴'], color: 'bg-blue-100 dark:bg-blue-900/30' },
            { phase: '2단계: 안착 (4-6개월)', strategies: ['리뷰 100건 달성 목표', '블로그 건강 콘텐츠 30편 발행', '기업 검진 2-3개사 제휴', '추천 환자 리워드 프로그램'], color: 'bg-indigo-100 dark:bg-indigo-900/30' },
            { phase: '3단계: 성장 (7-12개월)', strategies: ['비보험 특화 분야 브랜딩', 'CRM 기반 재방문 유도 자동화', '인스타/유튜브 콘텐츠 강화', '가격 정상화 + 프리미엄 라인 도입'], color: 'bg-violet-100 dark:bg-violet-900/30' },
            { phase: '4단계: 확장 (2-3년차)', strategies: ['지역 1위 {ct} 브랜드 확립'.replace('{ct}', result.clinic_type), '비대면 진료 + 원격 관리 도입', '제2 진료실 또는 2호점 검토', '후배 의사 네트워크 구축'], color: 'bg-purple-100 dark:bg-purple-900/30' },
          ].map((p) => (
            <div key={p.phase} className={`p-3 rounded-xl ${p.color}`}>
              <div className="text-sm font-medium text-foreground mb-2">{p.phase}</div>
              <div className="grid grid-cols-2 gap-1">
                {p.strategies.map((s) => (
                  <div key={s} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    <span className="text-[10px] text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

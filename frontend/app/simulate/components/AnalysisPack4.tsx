'use client'

import React from 'react'
import { Smartphone, Video, Cpu, Watch, QrCode, Globe, MessageSquare, Wifi, Monitor, Zap } from 'lucide-react'
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

export default function AnalysisPack4({ result }: Props) {
  const rev = result.estimated_monthly_revenue.avg

  return (
    <>
      {/* 1. 비대면 진료 수요 */}
      <Card icon={Video} title="비대면 진료 수요 분석" color="text-blue-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">34%</div>
            <div className="text-[10px] text-muted-foreground">비대면 진료 선호율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">2.8배</div>
            <div className="text-[10px] text-muted-foreground">전년 대비 성장</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">월 85건</div>
            <div className="text-[10px] text-muted-foreground">예상 비대면 건수</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { type: '재진 상담', pct: 42, rev: Math.round(rev * 0.04) },
            { type: '처방전 발급', pct: 28, rev: Math.round(rev * 0.025) },
            { type: '검사 결과 상담', pct: 18, rev: Math.round(rev * 0.015) },
            { type: '초진 예비 상담', pct: 12, rev: Math.round(rev * 0.01) },
          ].map((t) => (
            <div key={t.type} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{t.type}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${t.pct * 2}%` }} />
              </div>
              <span className="text-xs text-foreground w-8 text-right">{t.pct}%</span>
              <span className="text-xs font-medium text-foreground w-14 text-right">{(t.rev / 10000).toFixed(0)}만</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">비대면 진료 도입 시 월 추가 매출 약 {Math.round(rev * 0.09 / 10000)}만원 예상</p>
      </Card>

      {/* 2. 모바일 예약 분석 */}
      <Card icon={Smartphone} title="모바일 예약 · 접수 분석" color="text-green-500">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-green-600">72%</div>
            <div className="text-xs text-muted-foreground">모바일 예약 비율</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-foreground">28%</div>
            <div className="text-xs text-muted-foreground">전화 예약 비율</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { platform: '네이버 예약', pct: 38, color: '#22c55e' },
            { platform: '카카오 예약', pct: 18, color: '#f59e0b' },
            { platform: '똑닥/캐시닥', pct: 12, color: '#3b82f6' },
            { platform: '병원 자체 앱', pct: 4, color: '#8b5cf6' },
            { platform: '전화 예약', pct: 28, color: '#6b7280' },
          ].map((p) => (
            <div key={p.platform} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{p.platform}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.pct * 2}%`, backgroundColor: p.color }} />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">{p.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">네이버 예약 최적화 필수. 모바일 예약 노쇼율 5% vs 전화 예약 12%</p>
      </Card>

      {/* 3. AI 진단 보조 도구 */}
      <Card icon={Cpu} title="AI 진단 보조 도구 도입 분석" color="text-purple-500">
        <div className="space-y-3">
          {[
            { tool: 'AI X-ray 판독 보조', cost: '월 50만', accuracy: '95.2%', roi: 280, status: '도입 권장' },
            { tool: 'AI 초음파 분석', cost: '월 80만', accuracy: '91.8%', roi: 220, status: '도입 고려' },
            { tool: 'AI 자세 분석', cost: '월 30만', accuracy: '88.5%', roi: 350, status: '도입 권장' },
            { tool: 'AI 통증 평가', cost: '월 25만', accuracy: '86.3%', roi: 310, status: '도입 고려' },
            { tool: 'AI 처방 추천', cost: '월 40만', accuracy: '93.1%', roi: 190, status: '도입 고려' },
          ].map((t) => (
            <div key={t.tool} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{t.tool}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  t.status === '도입 권장' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>{t.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>비용: <span className="font-bold text-foreground">{t.cost}</span></div>
                <div>정확도: <span className="font-bold text-foreground">{t.accuracy}</span></div>
                <div>ROI: <span className="font-bold text-purple-600">{t.roi}%</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">AI 도구 전체 도입 시 진료 효율 </span>
          <span className="text-sm font-bold text-purple-600">+25% 향상</span>
          <span className="text-xs text-muted-foreground"> · 오진율 </span>
          <span className="text-sm font-bold text-green-600">-40% 감소</span>
        </div>
      </Card>

      {/* 4. 웨어러블 연동 */}
      <Card icon={Watch} title="웨어러블 · IoT 연동 분석" color="text-cyan-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-cyan-600">45%</div>
            <div className="text-[10px] text-muted-foreground">환자 웨어러블 보유율</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">3.2배</div>
            <div className="text-[10px] text-muted-foreground">데이터 활용 시 재방문율</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { device: 'Apple Watch/건강', users: 28, data: '심박수, 활동량, 수면' },
            { device: 'Galaxy Watch', users: 15, data: '혈압, 체성분, 심전도' },
            { device: '스마트 체중계', users: 22, data: '체중, BMI, 체지방률' },
            { device: '혈당 모니터', users: 8, data: '연속 혈당 측정' },
            { device: '스마트 혈압계', users: 12, data: '자동 혈압 기록' },
          ].map((d) => (
            <div key={d.device} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground flex-1">{d.device}</span>
              <span className="text-xs text-muted-foreground w-24">{d.data}</span>
              <span className="text-xs font-bold text-cyan-600 w-10 text-right">{d.users}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">웨어러블 데이터 연동 프로그램 운영 시 만성질환 관리 효율 극대화</p>
      </Card>

      {/* 5. 온라인 평판 분석 */}
      <Card icon={Globe} title="온라인 평판 · 리뷰 분석" color="text-amber-500">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { platform: '네이버', avg: 4.5, reviews: 127, color: 'text-green-600' },
            { platform: '카카오', avg: 4.3, reviews: 84, color: 'text-amber-600' },
            { platform: '구글', avg: 4.4, reviews: 56, color: 'text-blue-600' },
            { platform: '모두닥', avg: 4.2, reviews: 38, color: 'text-purple-600' },
          ].map((p) => (
            <div key={p.platform} className="text-center p-2 bg-secondary/50 rounded-lg">
              <div className={`text-lg font-bold ${p.color}`}>{p.avg}</div>
              <div className="text-[10px] text-muted-foreground">{p.platform}</div>
              <div className="text-[10px] text-muted-foreground">{p.reviews}건</div>
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-foreground mb-2">지역 {result.clinic_type} 평균 리뷰 키워드</p>
        <div className="flex flex-wrap gap-1.5">
          {['친절', '설명 잘해줌', '대기시간 짧음', '치료 효과 좋음', '시설 깔끔', '야간 진료', '주차 편리', '재방문 의사', '비용 적절', '전문적'].map((kw) => (
            <span key={kw} className="text-[10px] px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-full">{kw}</span>
          ))}
        </div>
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
          <p className="text-xs text-muted-foreground">리뷰 평점 0.1 상승 시 신규 환자 <span className="font-bold text-foreground">8-12% 증가</span> 효과</p>
        </div>
      </Card>

      {/* 6. 키오스크/무인 접수 */}
      <Card icon={QrCode} title="키오스크 · 무인접수 효과 분석" color="text-indigo-500">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl">
            <div className="text-2xl font-bold text-indigo-600">-65%</div>
            <div className="text-xs text-muted-foreground">접수 대기시간 단축</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="text-2xl font-bold text-foreground">+18%</div>
            <div className="text-xs text-muted-foreground">환자 만족도 향상</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">구분</th>
                <th className="text-right py-2 text-muted-foreground text-xs">기존</th>
                <th className="text-right py-2 text-muted-foreground text-xs">키오스크</th>
                <th className="text-right py-2 text-muted-foreground text-xs">개선</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: '접수 시간', before: '5분', after: '1.5분', improve: '-70%' },
                { item: '수납 시간', before: '3분', after: '1분', improve: '-67%' },
                { item: '인력 절감', before: '접수 2명', after: '접수 1명', improve: '280만/월' },
                { item: '오류율', before: '3.2%', after: '0.5%', improve: '-84%' },
              ].map((r) => (
                <tr key={r.item} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{r.item}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{r.before}</td>
                  <td className="py-1.5 text-right text-foreground text-xs font-medium">{r.after}</td>
                  <td className="py-1.5 text-right text-green-600 text-xs font-bold">{r.improve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">키오스크 도입비: <span className="font-bold text-foreground">500-800만원</span> · 투자 회수: <span className="font-bold text-foreground">3-4개월</span></p>
      </Card>

      {/* 7. 카카오/네이버 챗봇 */}
      <Card icon={MessageSquare} title="챗봇 · 자동 응답 시스템 분석" color="text-green-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-xl font-bold text-green-600">68%</div>
            <div className="text-[10px] text-muted-foreground">자동 응답 처리율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">24시간</div>
            <div className="text-[10px] text-muted-foreground">응답 가능 시간</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">-45%</div>
            <div className="text-[10px] text-muted-foreground">전화 문의 감소</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { query: '진료 시간 안내', pct: 32, auto: true },
            { query: '예약 확인/변경', pct: 25, auto: true },
            { query: '위치/주차 안내', pct: 18, auto: true },
            { query: '진료비 문의', pct: 12, auto: true },
            { query: '증상 상담', pct: 8, auto: false },
            { query: '기타 복잡 문의', pct: 5, auto: false },
          ].map((q) => (
            <div key={q.query} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${q.auto ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{q.query}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${q.auto ? 'bg-green-400' : 'bg-amber-400'}`} style={{ width: `${q.pct * 2.5}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">{q.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 원격 모니터링 */}
      <Card icon={Wifi} title="원격 모니터링 · 만성질환 관리" color="text-rose-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-rose-600">120명</div>
            <div className="text-[10px] text-muted-foreground">월 원격 관리 대상 환자</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">{Math.round(rev * 0.06 / 10000)}만</div>
            <div className="text-[10px] text-muted-foreground">월 추가 수익 예상</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { condition: '고혈압 관리', patients: 45, fee: '월 5만', compliance: 88 },
            { condition: '당뇨 관리', patients: 30, fee: '월 6만', compliance: 82 },
            { condition: '관절염 재활', patients: 25, fee: '월 4만', compliance: 75 },
            { condition: '통증 관리', patients: 20, fee: '월 5만', compliance: 78 },
          ].map((c) => (
            <div key={c.condition} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-xs text-foreground flex-1">{c.condition}</span>
              <span className="text-[10px] text-muted-foreground">{c.patients}명</span>
              <span className="text-[10px] text-muted-foreground">{c.fee}</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${c.compliance}%` }} />
              </div>
              <span className="text-[10px] font-medium text-foreground w-10 text-right">{c.compliance}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 스마트 클리닉 */}
      <Card icon={Monitor} title="스마트 클리닉 구축 비용 분석" color="text-violet-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">시스템</th>
                <th className="text-right py-2 text-muted-foreground text-xs">초기비용</th>
                <th className="text-right py-2 text-muted-foreground text-xs">월비용</th>
                <th className="text-right py-2 text-muted-foreground text-xs">효과</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sys: '스마트 조명/공조', init: '800만', monthly: '절감 15만', effect: '에너지 30% 절감' },
                { sys: '전자 차트 연동', init: '500만', monthly: '30만', effect: '기록시간 40% 단축' },
                { sys: '대기순번 디스플레이', init: '300만', monthly: '5만', effect: '민원 60% 감소' },
                { sys: '자동 소독 시스템', init: '400만', monthly: '10만', effect: '감염 리스크 90% 감소' },
                { sys: 'IoT 장비 모니터링', init: '200만', monthly: '8만', effect: '고장 사전 예방 85%' },
                { sys: '환자 호출 시스템', init: '150만', monthly: '3만', effect: '대기 불만 50% 감소' },
              ].map((r) => (
                <tr key={r.sys} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{r.sys}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{r.init}</td>
                  <td className="py-1.5 text-right text-foreground text-xs">{r.monthly}</td>
                  <td className="py-1.5 text-right text-violet-600 text-xs font-medium">{r.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">총 스마트화 비용: </span>
          <span className="text-sm font-bold text-violet-600">약 2,350만원</span>
          <span className="text-xs text-muted-foreground"> · 투자 회수: </span>
          <span className="text-sm font-bold text-violet-600">약 14개월</span>
        </div>
      </Card>

      {/* 10. 디지털 마케팅 ROI */}
      <Card icon={Zap} title="디지털 마케팅 채널별 ROI" color="text-orange-500">
        <div className="space-y-2 mb-4">
          {[
            { channel: '네이버 플레이스 광고', spend: 80, conversions: 42, cpa: 19000, roi: 520, color: '#22c55e' },
            { channel: '인스타그램 릴스', spend: 50, conversions: 28, cpa: 17800, roi: 380, color: '#8b5cf6' },
            { channel: '유튜브 숏츠', spend: 40, conversions: 15, cpa: 26600, roi: 250, color: '#ef4444' },
            { channel: '카카오 비즈보드', spend: 60, conversions: 35, cpa: 17100, roi: 410, color: '#f59e0b' },
            { channel: '구글 검색 광고', spend: 70, conversions: 25, cpa: 28000, roi: 290, color: '#3b82f6' },
            { channel: '블로그 SEO', spend: 30, conversions: 22, cpa: 13600, roi: 620, color: '#06b6d4' },
          ].map((ch) => (
            <div key={ch.channel} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
              <span className="text-xs text-foreground flex-1">{ch.channel}</span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">{ch.spend}만</span>
              <span className="text-[10px] text-muted-foreground w-10 text-right">{ch.conversions}건</span>
              <div className="w-14 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(ch.roi / 620) * 100}%`, backgroundColor: ch.color }} />
              </div>
              <span className="text-[10px] font-bold text-foreground w-14 text-right">ROI {ch.roi}%</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-lg font-bold text-orange-600">330만</div>
            <div className="text-[10px] text-muted-foreground">월 추천 예산</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">167건</div>
            <div className="text-[10px] text-muted-foreground">월 신규 환자</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-green-600">412%</div>
            <div className="text-[10px] text-muted-foreground">평균 ROI</div>
          </div>
        </div>
      </Card>
    </>
  )
}

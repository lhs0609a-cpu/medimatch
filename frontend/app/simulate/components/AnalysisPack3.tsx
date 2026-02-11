'use client'

import React from 'react'
import { Building, MapPin, Home, Car, School, ShoppingBag, Banknote, Train, Landmark, TreePine } from 'lucide-react'
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

export default function AnalysisPack3({ result }: Props) {
  const pop = result.demographics.population_1km

  return (
    <>
      {/* 1. 부동산 시세 추이 */}
      <Card icon={Building} title="부동산 시세 추이 (5년)" color="text-blue-600">
        <div className="space-y-2 mb-4">
          {[
            { year: '2021', rent: 185, deposit: 6500 },
            { year: '2022', rent: 195, deposit: 7000 },
            { year: '2023', rent: 210, deposit: 7500 },
            { year: '2024', rent: 225, deposit: 8000 },
            { year: '2025', rent: 235, deposit: 8200 },
          ].map((d) => (
            <div key={d.year} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">{d.year}</span>
              <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${(d.rent / 250) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-20 text-right">{d.rent}만원/평</span>
              <span className="text-[10px] text-muted-foreground w-20 text-right">보증금 {(d.deposit / 10000).toFixed(1)}억</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600">+27%</div>
            <div className="text-[10px] text-muted-foreground">5년 상승률</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">5.4%</div>
            <div className="text-[10px] text-muted-foreground">연평균 상승</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded-lg">
            <div className="text-lg font-bold text-foreground">상위 18%</div>
            <div className="text-[10px] text-muted-foreground">서울 임대료 순위</div>
          </div>
        </div>
      </Card>

      {/* 2. 상권 분석 */}
      <Card icon={ShoppingBag} title="상권 유형 · 활성화 분석" color="text-pink-500">
        <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">상권 유형</span>
            <span className="text-sm font-bold text-pink-600">오피스 밀집 상권</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">상권 등급</span>
            <span className="text-sm font-bold text-pink-600">A등급</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: '매출 규모', score: 88 }, { name: '유동인구', score: 92 },
            { name: '체류시간', score: 75 }, { name: '업종 다양성', score: 82 },
            { name: '폐업률(낮을수록 ↑)', score: 85 }, { name: '신규 창업률', score: 78 },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{s.name}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.score >= 85 ? 'bg-green-500' : s.score >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${s.score}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">{s.score}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 배후 인구 분석 */}
      <Card icon={Home} title="배후 인구 상세 분석" color="text-teal-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { range: '500m', pop: Math.round(pop * 0.4), color: 'bg-teal-600' },
            { range: '1km', pop: pop, color: 'bg-teal-500' },
            { range: '3km', pop: Math.round(pop * 2.8), color: 'bg-teal-400' },
          ].map((d) => (
            <div key={d.range} className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className={`inline-block w-8 h-8 rounded-full ${d.color} text-white text-xs font-bold flex items-center justify-center mb-1`}>
                <span>{d.range}</span>
              </div>
              <div className="text-lg font-bold text-foreground">{(d.pop / 10000).toFixed(1)}만</div>
              <div className="text-[10px] text-muted-foreground">반경 {d.range}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { type: '주거 인구', pct: 55, count: Math.round(pop * 0.55) },
            { type: '직장 인구', pct: 35, count: Math.round(pop * 0.35) },
            { type: '학생/기타', pct: 10, count: Math.round(pop * 0.10) },
          ].map((t) => (
            <div key={t.type} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">{t.type}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="text-xs text-foreground w-12 text-right">{(t.count / 1000).toFixed(1)}천</span>
              <span className="text-xs font-bold text-foreground w-10 text-right">{t.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. 유동인구 시간대 */}
      <Card icon={MapPin} title="유동인구 시간대별 분석" color="text-violet-500">
        <div className="space-y-1">
          {[
            { time: '06-08', count: 12500, label: '출근' },
            { time: '08-10', count: 28000, label: '오전피크' },
            { time: '10-12', count: 22000, label: '' },
            { time: '12-14', count: 35000, label: '점심피크' },
            { time: '14-16', count: 18000, label: '' },
            { time: '16-18', count: 25000, label: '' },
            { time: '18-20', count: 32000, label: '퇴근피크' },
            { time: '20-22', count: 15000, label: '' },
          ].map((t) => {
            const max = 35000
            const pct = (t.count / max) * 100
            const isPeak = t.count >= 28000
            return (
              <div key={t.time} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-10 font-mono">{t.time}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div className={`h-full rounded ${isPeak ? 'bg-violet-500' : 'bg-violet-300 dark:bg-violet-700'}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-medium text-foreground w-14 text-right">{(t.count / 10000).toFixed(1)}만</span>
                {t.label && <span className="text-[10px] text-violet-600 w-14">{t.label}</span>}
                {!t.label && <span className="w-14" />}
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-violet-600">평일 9.2만</div>
            <div className="text-[10px] text-muted-foreground">일 평균</div>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">주말 6.5만</div>
            <div className="text-[10px] text-muted-foreground">일 평균</div>
          </div>
        </div>
      </Card>

      {/* 5. 주변 개발 계획 */}
      <Card icon={Landmark} title="주변 개발 계획 · 호재 분석" color="text-amber-600">
        <div className="space-y-3">
          {[
            { project: 'GTX-C 교대역 환승역 확정', year: '2028', impact: '매우 긍정', desc: '유동인구 30% 증가 예상' },
            { project: '서초역 역세권 재개발', year: '2027', impact: '긍정', desc: '상주인구 5,000명 증가' },
            { project: '서리풀공원 확장', year: '2026', impact: '긍정', desc: '주거 매력도 상승' },
            { project: '강남대로 버스전용차로 확대', year: '2026', impact: '보통', desc: '교통 접근성 변화' },
          ].map((p) => (
            <div key={p.project} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{p.project}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.impact === '매우 긍정' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  p.impact === '긍정' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>{p.impact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{p.desc}</span>
                <span className="text-xs text-muted-foreground">{p.year}년</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. 교육시설 분포 */}
      <Card icon={School} title="교육시설 분포 분석" color="text-indigo-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { type: '초등학교', count: 4, students: 3200 },
            { type: '중학교', count: 3, students: 2800 },
            { type: '고등학교', count: 3, students: 2500 },
            { type: '대학교', count: 1, students: 12000 },
          ].map((s) => (
            <div key={s.type} className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-sm font-medium text-foreground">{s.type}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg font-bold text-indigo-600">{s.count}개</span>
                <span className="text-xs text-muted-foreground">{(s.students / 1000).toFixed(1)}천명</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
          학생 인구 약 {((3200 + 2800 + 2500 + 12000) / 1000).toFixed(1)}천명 — 소아/청소년 진료, 학교 건강검진 제휴 기회
        </p>
      </Card>

      {/* 7. 소득 수준 분석 */}
      <Card icon={Banknote} title="지역 소득 수준 분석" color="text-green-600">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-center">
            <div className="text-2xl font-bold text-green-600">650만원</div>
            <div className="text-xs text-muted-foreground">가구 평균 월소득</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <div className="text-2xl font-bold text-foreground">상위 15%</div>
            <div className="text-xs text-muted-foreground">서울 소득 순위</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { range: '300만 미만', pct: 12 }, { range: '300-500만', pct: 25 },
            { range: '500-700만', pct: 32 }, { range: '700-1000만', pct: 22 },
            { range: '1000만 이상', pct: 9 },
          ].map((d) => (
            <div key={d.range} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{d.range}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${d.pct * 2.5}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">{d.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">고소득층 비중 높아 비보험 진료 수용도 높음. 프리미엄 진료 전략 유리.</p>
      </Card>

      {/* 8. 주거 유형 분석 */}
      <Card icon={Home} title="주거 유형 · 세대 구성" color="text-rose-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { type: '아파트', pct: 45 }, { type: '오피스텔', pct: 25 },
            { type: '빌라/다세대', pct: 20 }, { type: '단독주택', pct: 10 },
          ].map((h) => (
            <div key={h.type} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-sm text-foreground flex-1">{h.type}</span>
              <span className="text-sm font-bold text-rose-600">{h.pct}%</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-sm text-muted-foreground">1인 가구</span>
            <span className="text-sm font-medium text-foreground">35%</span>
          </div>
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-sm text-muted-foreground">2인 가구</span>
            <span className="text-sm font-medium text-foreground">22%</span>
          </div>
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-sm text-muted-foreground">3-4인 가구</span>
            <span className="text-sm font-medium text-foreground">35%</span>
          </div>
          <div className="flex items-center justify-between p-2">
            <span className="text-sm text-muted-foreground">5인+ 가구</span>
            <span className="text-sm font-medium text-foreground">8%</span>
          </div>
        </div>
      </Card>

      {/* 9. 통근 패턴 */}
      <Card icon={Car} title="통근 · 이동 패턴 분석" color="text-sky-600">
        <div className="space-y-3 mb-4">
          {[
            { method: '지하철', pct: 42, time: '35분' },
            { method: '버스', pct: 22, time: '45분' },
            { method: '자가용', pct: 25, time: '40분' },
            { method: '도보/자전거', pct: 8, time: '15분' },
            { method: '기타', pct: 3, time: '-' },
          ].map((m) => (
            <div key={m.method} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">{m.method}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${m.pct * 2}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-10 text-right">{m.pct}%</span>
              <span className="text-xs text-muted-foreground w-12 text-right">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-950/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            평균 통근 시간 <span className="font-bold text-foreground">38분</span>. 대중교통 이용 비율 높아 역세권 입지 유리.
          </p>
        </div>
      </Card>

      {/* 10. 녹지/공원 */}
      <Card icon={TreePine} title="환경 · 녹지 접근성" color="text-emerald-600">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { name: '서리풀공원', dist: '350m', size: '12만m²' },
            { name: '우면산 자연공원', dist: '1.2km', size: '85만m²' },
            { name: '잠원한강공원', dist: '2.5km', size: '45만m²' },
            { name: '방배근린공원', dist: '800m', size: '3만m²' },
          ].map((p) => (
            <div key={p.name} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="text-sm font-medium text-foreground">{p.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{p.dist}</span>
                <span className="text-xs text-emerald-600">{p.size}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-emerald-600">82</div>
            <div className="text-[10px] text-muted-foreground">녹지 접근성 점수</div>
          </div>
          <div className="flex-1 p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">A-</div>
            <div className="text-[10px] text-muted-foreground">환경 등급</div>
          </div>
        </div>
      </Card>
    </>
  )
}

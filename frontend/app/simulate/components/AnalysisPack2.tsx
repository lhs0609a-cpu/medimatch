'use client'

import React from 'react'
import { Users, Baby, Briefcase, Heart, Brain, Bone, Eye, Ear, Droplets, Accessibility } from 'lucide-react'
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

export default function AnalysisPack2({ result }: Props) {
  const pop = result.demographics.population_1km
  const floating = result.demographics.floating_population_daily

  return (
    <>
      {/* 1. 지역 의료수요 */}
      <Card icon={Heart} title="지역 의료수요 심층 분석" color="text-red-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
            <div className="text-2xl font-bold text-red-600">{Math.round(pop * 0.78 / 1000)}천명</div>
            <div className="text-xs text-muted-foreground">연간 의료이용 인구</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="text-2xl font-bold text-foreground">18.5회</div>
            <div className="text-xs text-muted-foreground">1인당 연간 외래방문</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { disease: '근골격계 질환', pct: 32, patients: Math.round(pop * 0.32) },
            { disease: '호흡기 질환', pct: 18, patients: Math.round(pop * 0.18) },
            { disease: '소화기 질환', pct: 15, patients: Math.round(pop * 0.15) },
            { disease: '피부 질환', pct: 12, patients: Math.round(pop * 0.12) },
            { disease: '순환기 질환', pct: 10, patients: Math.round(pop * 0.10) },
            { disease: '정신건강', pct: 8, patients: Math.round(pop * 0.08) },
            { disease: '기타', pct: 5, patients: Math.round(pop * 0.05) },
          ].map((d) => (
            <div key={d.disease} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{d.disease}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-red-400 dark:bg-red-600 rounded-full" style={{ width: `${d.pct * 3}%` }} />
              </div>
              <span className="text-xs text-foreground w-16 text-right">{(d.patients / 1000).toFixed(1)}천명</span>
              <span className="text-xs font-bold text-foreground w-10 text-right">{d.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. 만성질환 비율 */}
      <Card icon={Droplets} title="만성질환 유병률 분석" color="text-amber-500">
        <p className="text-sm text-muted-foreground mb-4">반경 1km 거주 인구 기반 추정 만성질환 유병률</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '고혈압', rate: 28.3, trend: '+1.2%', patients: Math.round(pop * 0.283) },
            { name: '당뇨', rate: 13.8, trend: '+0.8%', patients: Math.round(pop * 0.138) },
            { name: '고지혈증', rate: 22.1, trend: '+2.5%', patients: Math.round(pop * 0.221) },
            { name: '관절염', rate: 15.5, trend: '+0.5%', patients: Math.round(pop * 0.155) },
            { name: '디스크', rate: 8.2, trend: '+1.8%', patients: Math.round(pop * 0.082) },
            { name: '골다공증', rate: 6.8, trend: '+0.9%', patients: Math.round(pop * 0.068) },
          ].map((d) => (
            <div key={d.name} className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <span className="text-xs text-green-600">{d.trend} ↑</span>
              </div>
              <div className="text-xl font-bold text-amber-600">{d.rate}%</div>
              <div className="text-[10px] text-muted-foreground">약 {(d.patients / 1000).toFixed(1)}천명</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 노인인구 의료이용 */}
      <Card icon={Accessibility} title="노인인구 의료이용 패턴" color="text-violet-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
            <div className="text-2xl font-bold text-violet-600">{Math.round(pop * 0.14 / 1000)}천명</div>
            <div className="text-[10px] text-muted-foreground">60세+ 인구</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">32.5회</div>
            <div className="text-[10px] text-muted-foreground">연간 외래 이용</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">4.2개</div>
            <div className="text-[10px] text-muted-foreground">평균 진료과목</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {['오전 9-10시 (최다)', '오전 10-11시', '오후 2-3시', '오전 11-12시'].map((time, i) => (
            <div key={time} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex-1">{time}</span>
              <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${[100, 85, 70, 65][i]}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-8 text-right">{[38, 32, 27, 25][i]}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-secondary/30 rounded">노인 환자 피크타임: 오전 9-11시. 오전 진료 집중 운영 시 효율 극대화</p>
      </Card>

      {/* 4. 소아환자 분석 */}
      <Card icon={Baby} title="소아/청소년 환자 분석" color="text-pink-500">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
            <div className="text-2xl font-bold text-pink-600">{Math.round(pop * 0.17 / 1000)}천명</div>
            <div className="text-xs text-muted-foreground">0-19세 인구</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl">
            <div className="text-2xl font-bold text-foreground">22.8회</div>
            <div className="text-xs text-muted-foreground">연간 외래 방문</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { age: '0-4세', count: Math.round(pop * 0.04), visits: 28.5 },
            { age: '5-9세', count: Math.round(pop * 0.04), visits: 24.2 },
            { age: '10-14세', count: Math.round(pop * 0.05), visits: 18.8 },
            { age: '15-19세', count: Math.round(pop * 0.04), visits: 15.5 },
          ].map((a) => (
            <div key={a.age} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground w-16">{a.age}</span>
              <span className="text-xs text-muted-foreground w-16">{(a.count / 1000).toFixed(1)}천명</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full" style={{ width: `${(a.visits / 30) * 100}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-14 text-right">{a.visits}회/년</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 직장인 건강검진 */}
      <Card icon={Briefcase} title="직장인 건강검진 수요 분석" color="text-blue-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{Math.round(floating * 0.6 / 1000)}천명</div>
            <div className="text-[10px] text-muted-foreground">일 직장인 유동인구</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">82%</div>
            <div className="text-[10px] text-muted-foreground">건강검진 수검률</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">35%</div>
            <div className="text-[10px] text-muted-foreground">2차 검진 전환</div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg mb-3">
          <div className="text-sm font-medium text-foreground mb-2">기업 건강검진 제휴 예상 수익</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>제휴 기업: <span className="font-bold">8-12개</span></div>
            <div>월 검진 인원: <span className="font-bold">120-180명</span></div>
            <div>건당 수익: <span className="font-bold">15-25만원</span></div>
            <div>월 추가 매출: <span className="font-bold">1,800-4,500만원</span></div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">오피스 밀집 지역으로 기업 건강검진 수요 높음. 점심시간 활용 가능.</p>
      </Card>

      {/* 6. 외래/입원 비율 */}
      <Card icon={Heart} title="외래 · 입원 수요 분석" color="text-emerald-500">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-emerald-600">92%</div>
            <div className="text-xs text-muted-foreground">외래 비율</div>
          </div>
          <div className="flex-1 p-4 bg-secondary/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-foreground">8%</div>
            <div className="text-xs text-muted-foreground">입원/시술</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">구분</th>
                <th className="text-right py-2 text-muted-foreground">건수/월</th>
                <th className="text-right py-2 text-muted-foreground">단가</th>
                <th className="text-right py-2 text-muted-foreground">매출 기여</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: '외래 진료', count: '780건', unit: '5.5만', rev: '4,290만' },
                { type: '물리치료', count: '420건', unit: '3.2만', rev: '1,344만' },
                { type: '주사/시술', count: '85건', unit: '8.5만', rev: '723만' },
                { type: '검사/영상', count: '120건', unit: '4.8만', rev: '576만' },
                { type: '입원', count: '12건', unit: '45만', rev: '540만' },
              ].map((r) => (
                <tr key={r.type} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{r.type}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.count}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.unit}</td>
                  <td className="py-2 text-right font-medium text-foreground">{r.rev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. 물리치료 수요 */}
      <Card icon={Bone} title="물리치료 · 재활 수요 분석" color="text-orange-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">420건</div>
            <div className="text-[10px] text-muted-foreground">월 예상 물리치료 건수</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">1,344만</div>
            <div className="text-[10px] text-muted-foreground">월 물리치료 매출</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { therapy: '도수치료', pct: 35, rev: '470만' },
            { therapy: '체외충격파', pct: 22, rev: '295만' },
            { therapy: '전기치료', pct: 18, rev: '242만' },
            { therapy: '운동치료', pct: 15, rev: '202만' },
            { therapy: '온열/냉각', pct: 10, rev: '134만' },
          ].map((t) => (
            <div key={t.therapy} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t.therapy}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 dark:bg-orange-600 rounded-full" style={{ width: `${t.pct * 2.5}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{t.pct}%</span>
              <span className="text-xs font-medium text-foreground w-14 text-right">{t.rev}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">도수치료 비보험 특화 시 마진율 70% 이상 달성 가능</p>
      </Card>

      {/* 8. 경쟁 진료과 분석 */}
      <Card icon={Eye} title="인접 진료과 경쟁 분석" color="text-sky-500">
        <p className="text-sm text-muted-foreground mb-3">동일 진료과 외 환자를 공유하는 인접 진료과 현황</p>
        <div className="space-y-2">
          {[
            { dept: '재활의학과', count: 3, overlap: 45, threat: '높음' },
            { dept: '신경외과', count: 2, overlap: 35, threat: '중간' },
            { dept: '통증의학과', count: 4, overlap: 55, threat: '높음' },
            { dept: '한의원', count: 8, overlap: 30, threat: '중간' },
            { dept: '마취통증과', count: 1, overlap: 25, threat: '낮음' },
          ].filter((d) => d.dept !== result.clinic_type).map((d) => (
            <div key={d.dept} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
              <span className="text-sm text-foreground flex-1">{d.dept}</span>
              <span className="text-xs text-muted-foreground">{d.count}개</span>
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${d.overlap}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-12">겹침 {d.overlap}%</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                d.threat === '높음' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                d.threat === '중간' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>{d.threat}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 전문의 분포 */}
      <Card icon={Brain} title="지역 전문의 분포 분석" color="text-fuchsia-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-fuchsia-50 dark:bg-fuchsia-950/20 rounded-lg">
            <div className="text-2xl font-bold text-fuchsia-600">42명</div>
            <div className="text-[10px] text-muted-foreground">반경 1km 전문의</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">5명</div>
            <div className="text-[10px] text-muted-foreground">{result.clinic_type} 전문의</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">12.3년</div>
            <div className="text-[10px] text-muted-foreground">평균 경력</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">전문분야</th>
                <th className="text-right py-2 text-muted-foreground">인원</th>
                <th className="text-right py-2 text-muted-foreground">평균 경력</th>
                <th className="text-right py-2 text-muted-foreground">인구 대비</th>
              </tr>
            </thead>
            <tbody>
              {[
                { field: '정형외과', count: 5, exp: '14.2년', ratio: '1:9,000' },
                { field: '재활의학', count: 3, exp: '11.5년', ratio: '1:15,000' },
                { field: '신경외과', count: 2, exp: '18.3년', ratio: '1:22,500' },
                { field: '통증의학', count: 4, exp: '9.8년', ratio: '1:11,250' },
                { field: '내과', count: 12, exp: '15.1년', ratio: '1:3,750' },
              ].map((r) => (
                <tr key={r.field} className="border-b border-border/50">
                  <td className={`py-2 ${r.field === result.clinic_type ? 'font-bold text-fuchsia-600' : 'text-foreground'}`}>{r.field}</td>
                  <td className="py-2 text-right text-foreground">{r.count}명</td>
                  <td className="py-2 text-right text-muted-foreground">{r.exp}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 10. 의료 접근성 */}
      <Card icon={Ear} title="의료 접근성 종합 평가" color="text-lime-600">
        <div className="space-y-3">
          {[
            { name: '1차 의료기관 접근성', score: 88, grade: 'A', detail: '도보 10분 내 의원 12개' },
            { name: '2차 병원 접근성', score: 72, grade: 'B+', detail: '차량 15분 내 종합병원 3개' },
            { name: '3차 상급종합 접근성', score: 65, grade: 'B', detail: '차량 25분 내 대학병원 2개' },
            { name: '약국 접근성', score: 92, grade: 'A+', detail: '도보 5분 내 약국 5개' },
            { name: '응급의료 접근성', score: 78, grade: 'B+', detail: '응급실 도달 12분' },
          ].map((a) => (
            <div key={a.name} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{a.name}</span>
                <span className={`text-sm font-bold ${a.score >= 85 ? 'text-green-600' : a.score >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>{a.grade}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full bg-lime-500 dark:bg-lime-600 rounded-full" style={{ width: `${a.score}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{a.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

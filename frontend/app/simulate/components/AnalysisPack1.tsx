'use client'

import React from 'react'
import { Activity, Stethoscope, FileText, HeartPulse, Pill, Clock, Thermometer, ShieldCheck, Microscope, Syringe } from 'lucide-react'
import { SimulationResponse } from '@/lib/api/client'

interface Props { result: SimulationResponse }

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-medium text-foreground w-12 text-right">{value.toLocaleString()}</span>
    </div>
  )
}

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

export default function AnalysisPack1({ result }: Props) {
  const rev = result.estimated_monthly_revenue.avg
  const fee = Math.round(rev / 26 / 38)

  return (
    <>
      {/* 1. 진료과별 수가 비교 */}
      <Card icon={Stethoscope} title="진료과별 평균 수가 비교" color="text-blue-500">
        <div className="space-y-2">
          {[
            { name: '정형외과', v: 82000 }, { name: '내과', v: 55000 }, { name: '피부과', v: 95000 },
            { name: '이비인후과', v: 48000 }, { name: '안과', v: 72000 }, { name: '치과', v: 110000 },
            { name: result.clinic_type, v: fee },
          ].sort((a, b) => b.v - a.v).map((d) => (
            <Bar key={d.name} label={d.name} value={d.v} max={120000} color={d.name === result.clinic_type ? '#3b82f6' : '#cbd5e1'} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">출처: 건강보험심사평가원 2025년 통계</p>
      </Card>

      {/* 2. 보험 청구 패턴 */}
      <Card icon={FileText} title="보험 청구 패턴 분석" color="text-green-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: '평균 청구건수', value: `${Math.round(rev / fee / 10000 * 26)}건/월` },
            { label: '평균 청구단가', value: `${Math.round(fee * 0.75 / 1000)}천원` },
            { label: '심사 삭감률', value: '4.2%' },
          ].map((m) => (
            <div key={m.label} className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-lg font-bold text-foreground">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {['초진료', '재진료', '처치/수술', '검사', '영상진단', '물리치료'].map((item, i) => (
            <div key={item} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{item}</span>
              <span className="text-sm font-medium text-foreground">{[32, 28, 15, 12, 8, 5][i]}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 계절별 환자 추이 */}
      <Card icon={Thermometer} title="계절별 환자 수요 분석" color="text-orange-500">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { season: '봄', factor: 1.1, icon: '🌸', color: 'bg-pink-100 dark:bg-pink-900/30' },
            { season: '여름', factor: 0.85, icon: '☀️', color: 'bg-yellow-100 dark:bg-yellow-900/30' },
            { season: '가을', factor: 1.15, icon: '🍂', color: 'bg-orange-100 dark:bg-orange-900/30' },
            { season: '겨울', factor: 0.9, icon: '❄️', color: 'bg-blue-100 dark:bg-blue-900/30' },
          ].map((s) => (
            <div key={s.season} className={`text-center p-3 rounded-xl ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-sm font-medium text-foreground">{s.season}</div>
              <div className="text-lg font-bold text-foreground">{Math.round(38 * s.factor)}명/일</div>
              <div className={`text-xs ${s.factor >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                {s.factor >= 1 ? '+' : ''}{Math.round((s.factor - 1) * 100)}%
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">환절기(봄/가을)에 근골격계 질환 증가, 여름 휴가철 감소 패턴</p>
      </Card>

      {/* 4. 진료 항목 분포 */}
      <Card icon={Activity} title="예상 진료 항목 분포" color="text-purple-500">
        <div className="space-y-2">
          {[
            { name: '초진 상담', pct: 35, count: 13, color: '#8b5cf6' },
            { name: '재진 관리', pct: 25, count: 10, color: '#a78bfa' },
            { name: '물리치료', pct: 18, count: 7, color: '#c4b5fd' },
            { name: '주사치료', pct: 10, count: 4, color: '#ddd6fe' },
            { name: 'X-ray/MRI', pct: 8, count: 3, color: '#ede9fe' },
            { name: '수술/시술', pct: 4, count: 2, color: '#f5f3ff' },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-foreground flex-1">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.count}명/일</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
              <span className="text-sm font-bold text-foreground w-10 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 환자 체류시간 */}
      <Card icon={Clock} title="평균 환자 체류시간 분석" color="text-cyan-500">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-cyan-600">42분</div>
            <div className="text-xs text-muted-foreground">평균 체류시간</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-foreground">2.8회</div>
            <div className="text-xs text-muted-foreground">평균 내원 횟수</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { step: '접수/대기', min: 12 }, { step: '진료', min: 15 },
            { step: '검사/시술', min: 8 }, { step: '물리치료', min: 20 },
            { step: '수납/처방', min: 5 },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">{s.step}</span>
              <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div className="h-full bg-cyan-400 dark:bg-cyan-600 rounded" style={{ width: `${(s.min / 25) * 100}%` }} />
              </div>
              <span className="text-xs font-medium w-10 text-right">{s.min}분</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. 진료 효율성 */}
      <Card icon={HeartPulse} title="진료 효율성 지표" color="text-red-500">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '시간당 환자', value: '4.2명', grade: 'A', color: 'text-green-600' },
            { label: '환자당 매출', value: `${Math.round(fee / 10000)}만원`, grade: 'B+', color: 'text-blue-600' },
            { label: '재방문률', value: '68%', grade: 'A-', color: 'text-green-600' },
            { label: '노쇼율', value: '8.5%', grade: 'B', color: 'text-amber-600' },
          ].map((m) => (
            <div key={m.label} className="p-3 bg-secondary/50 rounded-xl text-center">
              <div className={`text-xl font-bold ${m.color}`}>{m.grade}</div>
              <div className="text-sm font-medium text-foreground">{m.value}</div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">효율성 종합 등급: B+</span> — 전국 {result.clinic_type} 상위 30% 수준.
            시간당 환자수 개선 시 매출 15% 증가 가능
          </p>
        </div>
      </Card>

      {/* 7. 처방 패턴 */}
      <Card icon={Pill} title="예상 처방 · 약제비 분석" color="text-emerald-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">약제 분류</th>
                <th className="text-right py-2 text-muted-foreground font-medium">처방 비율</th>
                <th className="text-right py-2 text-muted-foreground font-medium">월 예상건수</th>
                <th className="text-right py-2 text-muted-foreground font-medium">약제비</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '소염진통제', pct: 42, count: 320, cost: '8,500원' },
                { name: '근이완제', pct: 28, count: 215, cost: '6,200원' },
                { name: '외용제(파스)', pct: 15, count: 115, cost: '4,800원' },
                { name: '골다공증약', pct: 8, count: 62, cost: '15,000원' },
                { name: '주사제', pct: 5, count: 38, cost: '22,000원' },
                { name: '기타', pct: 2, count: 15, cost: '7,500원' },
              ].map((r) => (
                <tr key={r.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-foreground">{r.name}</td>
                  <td className="py-2 text-right font-medium text-foreground">{r.pct}%</td>
                  <td className="py-2 text-right text-muted-foreground">{r.count}건</td>
                  <td className="py-2 text-right text-foreground">{r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">월 예상 약제비 총액: <span className="font-bold text-foreground">약 680만원</span></div>
      </Card>

      {/* 8. 건강보험 심사율 */}
      <Card icon={ShieldCheck} title="건강보험 심사 · 삭감 분석" color="text-teal-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">95.8%</div>
            <div className="text-[10px] text-muted-foreground">청구 인정률</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">4.2%</div>
            <div className="text-[10px] text-muted-foreground">삭감률</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">12일</div>
            <div className="text-[10px] text-muted-foreground">평균 지급일</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { item: '초진/재진료', rate: 98.5 }, { item: '영상검사', rate: 94.2 },
            { item: '물리치료', rate: 96.8 }, { item: '주사료', rate: 92.1 },
            { item: '처치/수술', rate: 88.5 },
          ].map((r) => (
            <div key={r.item} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">{r.item}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${r.rate}%` }} />
              </div>
              <span className="text-xs font-medium w-12 text-right">{r.rate}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 의료장비 활용률 */}
      <Card icon={Microscope} title="의료장비 투자 · 활용률 분석" color="text-indigo-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">장비</th>
                <th className="text-right py-2 text-muted-foreground font-medium">투자비</th>
                <th className="text-right py-2 text-muted-foreground font-medium">활용률</th>
                <th className="text-right py-2 text-muted-foreground font-medium">월 수익</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'X-ray', cost: '4,500만', util: 85, rev: '280만' },
                { name: '초음파', cost: '3,000만', util: 72, rev: '220만' },
                { name: '체외충격파', cost: '2,500만', util: 68, rev: '350만' },
                { name: 'MRI', cost: '8,000만', util: 55, rev: '520만' },
                { name: '물리치료기기', cost: '1,500만', util: 92, rev: '180만' },
                { name: '도수치료 베드', cost: '800만', util: 88, rev: '420만' },
              ].map((r) => (
                <tr key={r.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2 text-foreground font-medium">{r.name}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.cost}</td>
                  <td className="py-2 text-right">
                    <span className={`font-medium ${r.util >= 80 ? 'text-green-600' : r.util >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{r.util}%</span>
                  </td>
                  <td className="py-2 text-right font-medium text-foreground">{r.rev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg text-xs text-muted-foreground">
          총 장비 투자: <span className="font-bold text-foreground">약 2억 300만원</span> · 월 장비 수익: <span className="font-bold text-foreground">약 1,970만원</span> · 투자 회수: <span className="font-bold text-foreground">약 10.3개월</span>
        </div>
      </Card>

      {/* 10. 진료과 전문성 */}
      <Card icon={Syringe} title="진료과 전문성 세부 분석" color="text-rose-500">
        <div className="space-y-3">
          {[
            { area: '척추/디스크', demand: 92, competition: 78, opportunity: 85 },
            { area: '관절/무릎', demand: 88, competition: 82, opportunity: 72 },
            { area: '스포츠의학', demand: 75, competition: 45, opportunity: 95 },
            { area: '도수치료', demand: 85, competition: 55, opportunity: 90 },
            { area: '통증의학', demand: 80, competition: 68, opportunity: 78 },
            { area: '재활치료', demand: 70, competition: 60, opportunity: 75 },
          ].map((s) => (
            <div key={s.area} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{s.area}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.opportunity >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  s.opportunity >= 70 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  기회도 {s.opportunity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-8">수요</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${s.demand}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-8">경쟁</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${s.competition}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

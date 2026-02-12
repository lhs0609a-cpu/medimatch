'use client'

import React from 'react'
import { Smile, ThumbsUp, Clock, UserCheck, Star, Frown, Heart, MessageCircle, Gift, BarChart3 } from 'lucide-react'
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

export default function AnalysisPack5({ result }: Props) {
  return (
    <>
      {/* 1. 환자 여정 분석 */}
      <Card icon={UserCheck} title="환자 여정(Patient Journey) 분석" color="text-blue-500">
        <div className="space-y-3">
          {[
            { stage: '인지', desc: '병원 검색/발견', touchpoint: '네이버, 지인 추천', conversion: 100, color: 'bg-blue-500' },
            { stage: '관심', desc: '리뷰/정보 확인', touchpoint: '블로그, 리뷰, SNS', conversion: 65, color: 'bg-blue-400' },
            { stage: '예약', desc: '전화/온라인 예약', touchpoint: '네이버 예약, 전화', conversion: 42, color: 'bg-indigo-500' },
            { stage: '내원', desc: '접수/대기/진료', touchpoint: '키오스크, 대기실', conversion: 38, color: 'bg-violet-500' },
            { stage: '치료', desc: '진료/시술/처방', touchpoint: '진료실, 물리치료실', conversion: 38, color: 'bg-purple-500' },
            { stage: '수납', desc: '결제/처방전 발행', touchpoint: 'POS, 간편결제', conversion: 38, color: 'bg-fuchsia-500' },
            { stage: '재방문', desc: '사후관리/재예약', touchpoint: 'CRM, 알림톡', conversion: 26, color: 'bg-pink-500' },
          ].map((s, i) => (
            <div key={s.stage} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{s.stage}</span>
                  <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.conversion}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-foreground w-10 text-right">{s.conversion}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">전환율 핵심 이탈 구간: 관심→예약 (35% 이탈). 리뷰 관리 + 예약 편의성 개선 필요</p>
      </Card>

      {/* 2. 환자 만족도 벤치마크 */}
      <Card icon={ThumbsUp} title="환자 만족도 벤치마크" color="text-green-500">
        <div className="space-y-3">
          {[
            { factor: '의사 친절도', my: 88, avg: 82, top: 95 },
            { factor: '진료 설명', my: 85, avg: 78, top: 93 },
            { factor: '대기시간', my: 72, avg: 65, top: 88 },
            { factor: '시설 청결도', my: 90, avg: 85, top: 97 },
            { factor: '치료 결과', my: 86, avg: 80, top: 94 },
            { factor: '가격 적절성', my: 78, avg: 72, top: 85 },
            { factor: '접수 편의', my: 82, avg: 75, top: 92 },
            { factor: '주차 편의', my: 70, avg: 68, top: 90 },
          ].map((f) => (
            <div key={f.factor}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{f.factor}</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-muted-foreground">평균 {f.avg}</span>
                  <span className="font-bold text-green-600">예상 {f.my}</span>
                  <span className="text-muted-foreground">상위10% {f.top}</span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <div className="h-full bg-gray-300 dark:bg-gray-600 rounded-full absolute" style={{ width: `${f.top}%` }} />
                <div className="h-full bg-green-500 rounded-full absolute" style={{ width: `${f.my}%` }} />
                <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full absolute" style={{ width: `${f.avg}%`, opacity: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. 대기시간 최적화 */}
      <Card icon={Clock} title="대기시간 최적화 시뮬레이션" color="text-amber-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">23분</div>
            <div className="text-[10px] text-muted-foreground">현재 평균 대기</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">12분</div>
            <div className="text-[10px] text-muted-foreground">최적화 후 대기</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">-48%</div>
            <div className="text-[10px] text-muted-foreground">단축률</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { time: '09:00', wait: 8, patients: 3 },
            { time: '10:00', wait: 18, patients: 6 },
            { time: '11:00', wait: 28, patients: 8 },
            { time: '12:00', wait: 15, patients: 4 },
            { time: '14:00', wait: 22, patients: 7 },
            { time: '15:00', wait: 25, patients: 7 },
            { time: '16:00', wait: 20, patients: 6 },
            { time: '17:00', wait: 12, patients: 4 },
          ].map((t) => (
            <div key={t.time} className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-10 font-mono">{t.time}</span>
              <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div className={`h-full rounded ${t.wait >= 25 ? 'bg-red-400' : t.wait >= 15 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${(t.wait / 30) * 100}%` }} />
              </div>
              <span className="text-[11px] font-medium text-foreground w-10 text-right">{t.wait}분</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{t.patients}명</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">피크타임 10-11시, 14-16시 집중. 시간대별 예약 슬롯 제한 권장.</p>
      </Card>

      {/* 4. 불만/클레임 예방 */}
      <Card icon={Frown} title="불만 · 클레임 예방 분석" color="text-red-500">
        <div className="space-y-2 mb-4">
          {[
            { complaint: '긴 대기시간', pct: 32, severity: 'HIGH', prevention: '시간 예약제 + 실시간 안내' },
            { complaint: '불친절한 응대', pct: 22, severity: 'HIGH', prevention: '월 1회 CS 교육 + 모니터링' },
            { complaint: '진료비 불투명', pct: 18, severity: 'MEDIUM', prevention: '사전 견적 + 항목별 설명' },
            { complaint: '치료 효과 불만', pct: 15, severity: 'HIGH', prevention: '치료 전후 기록 + 기대치 관리' },
            { complaint: '주차 어려움', pct: 8, severity: 'LOW', prevention: '인근 주차장 제휴 + 발레파킹' },
            { complaint: '예약 불편', pct: 5, severity: 'LOW', prevention: '다채널 예약 시스템 구축' },
          ].map((c) => (
            <div key={c.complaint} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{c.complaint}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{c.pct}%</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    c.severity === 'HIGH' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    c.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>{c.severity === 'HIGH' ? '심각' : c.severity === 'MEDIUM' ? '보통' : '경미'}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">예방: {c.prevention}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. NPS 예측 */}
      <Card icon={Star} title="NPS(순추천지수) 예측 분석" color="text-yellow-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
            <div className="text-3xl font-bold text-green-600">62%</div>
            <div className="text-xs text-muted-foreground">추천자</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-xl">
            <div className="text-3xl font-bold text-foreground">25%</div>
            <div className="text-xs text-muted-foreground">중립자</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
            <div className="text-3xl font-bold text-red-500">13%</div>
            <div className="text-xs text-muted-foreground">비추천자</div>
          </div>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl text-center mb-4">
          <div className="text-xs text-muted-foreground mb-1">예상 NPS 점수</div>
          <div className="text-4xl font-bold text-yellow-600">+49</div>
          <div className="text-xs text-muted-foreground mt-1">업계 평균 +32 대비 <span className="text-green-600 font-bold">+17p 우수</span></div>
        </div>
        <div className="space-y-1.5">
          {[
            { factor: '진료 품질', impact: 35, score: 'A' },
            { factor: '서비스 친절도', impact: 25, score: 'A-' },
            { factor: '시설/환경', impact: 20, score: 'B+' },
            { factor: '가격 경쟁력', impact: 12, score: 'B+' },
            { factor: '접근성', impact: 8, score: 'A' },
          ].map((f) => (
            <div key={f.factor} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{f.factor}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${f.impact * 2.5}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">기여 {f.impact}%</span>
              <span className="text-xs font-bold text-foreground w-6 text-right">{f.score}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. 재방문율 분석 */}
      <Card icon={Heart} title="재방문율 · 충성도 분석" color="text-pink-500">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-pink-600">68%</div>
            <div className="text-xs text-muted-foreground">예상 재방문율</div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <div className="text-3xl font-bold text-foreground">2.8회</div>
            <div className="text-xs text-muted-foreground">평균 방문 횟수</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { visit: '1회 방문', pct: 32, revenue: 100 },
            { visit: '2-3회 방문', pct: 28, revenue: 180 },
            { visit: '4-6회 방문', pct: 22, revenue: 350 },
            { visit: '7-12회 방문', pct: 12, revenue: 580 },
            { visit: '12회+ (단골)', pct: 6, revenue: 1200 },
          ].map((v) => (
            <div key={v.visit} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{v.visit}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full" style={{ width: `${v.pct * 2.5}%` }} />
              </div>
              <span className="text-xs text-foreground w-8 text-right">{v.pct}%</span>
              <span className="text-[10px] text-muted-foreground w-16 text-right">LTV {v.revenue}만</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">상위 18% 단골 환자가 전체 매출의 42%를 차지. 충성도 프로그램 필수.</p>
      </Card>

      {/* 7. 구전 효과 */}
      <Card icon={MessageCircle} title="구전(WOM) 효과 분석" color="text-teal-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
            <div className="text-xl font-bold text-teal-600">3.2명</div>
            <div className="text-[10px] text-muted-foreground">1인당 추천 수</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">42%</div>
            <div className="text-[10px] text-muted-foreground">추천 전환율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">0원</div>
            <div className="text-[10px] text-muted-foreground">획득 비용</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { source: '가족/친척 추천', pct: 35, quality: 95 },
            { source: '직장 동료 추천', pct: 25, quality: 88 },
            { source: '친구/지인 추천', pct: 22, quality: 85 },
            { source: '온라인 커뮤니티', pct: 12, quality: 72 },
            { source: 'SNS 공유', pct: 6, quality: 65 },
          ].map((s) => (
            <div key={s.source} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-xs text-foreground flex-1">{s.source}</span>
              <span className="text-xs text-muted-foreground">{s.pct}%</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.quality}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-14 text-right">전환 {s.quality}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-teal-50 dark:bg-teal-950/20 rounded">추천 환자는 일반 환자 대비 LTV <span className="font-bold text-foreground">2.4배</span>, 이탈률 <span className="font-bold text-foreground">50% 낮음</span></p>
      </Card>

      {/* 8. 로열티 프로그램 */}
      <Card icon={Gift} title="로열티 프로그램 효과 시뮬레이션" color="text-purple-500">
        <div className="space-y-3">
          {[
            { program: '방문 포인트 적립', cost: '월 50만', retention: '+15%', revenue: '+180만', roi: 360 },
            { program: '정기 검진 할인', cost: '월 30만', retention: '+22%', revenue: '+250만', roi: 833 },
            { program: '가족 패키지', cost: '월 20만', retention: '+12%', revenue: '+150만', roi: 750 },
            { program: '생일 쿠폰', cost: '월 15만', retention: '+8%', revenue: '+80만', roi: 533 },
            { program: '추천인 리워드', cost: '월 40만', retention: '+18%', revenue: '+320만', roi: 800 },
          ].map((p) => (
            <div key={p.program} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{p.program}</span>
                <span className="text-xs font-bold text-purple-600">ROI {p.roi}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>비용: <span className="font-medium text-foreground">{p.cost}</span></div>
                <div>재방문: <span className="font-medium text-green-600">{p.retention}</span></div>
                <div>추가매출: <span className="font-medium text-foreground">{p.revenue}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 환자 커뮤니케이션 */}
      <Card icon={Smile} title="환자 커뮤니케이션 채널 분석" color="text-emerald-500">
        <div className="space-y-2">
          {[
            { channel: '카카오 알림톡', reach: 92, open: 85, cost: '건당 8원', pref: 45 },
            { channel: '문자 메시지', reach: 98, open: 62, cost: '건당 20원', pref: 28 },
            { channel: '앱 푸시 알림', reach: 55, open: 35, cost: '무료', pref: 12 },
            { channel: '이메일', reach: 78, open: 22, cost: '무료', pref: 8 },
            { channel: '전화', reach: 95, open: 75, cost: '건당 100원', pref: 7 },
          ].map((ch) => (
            <div key={ch.channel} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-sm text-foreground flex-1">{ch.channel}</span>
              <div className="text-center w-12">
                <div className="text-xs font-bold text-foreground">{ch.reach}%</div>
                <div className="text-[9px] text-muted-foreground">도달</div>
              </div>
              <div className="text-center w-12">
                <div className="text-xs font-bold text-foreground">{ch.open}%</div>
                <div className="text-[9px] text-muted-foreground">열람</div>
              </div>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{ch.cost}</span>
              <span className="text-xs font-bold text-emerald-600 w-10 text-right">{ch.pref}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">카카오 알림톡 주력 + 앱 푸시 보조 채널 운영 권장. 연간 통신비: 약 180만원</p>
      </Card>

      {/* 10. 서비스 품질 KPI */}
      <Card icon={BarChart3} title="서비스 품질 KPI 대시보드" color="text-slate-600">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { kpi: '환자 만족도', target: '90점', current: '86점', status: 'good' },
            { kpi: '평균 대기시간', target: '15분', current: '23분', status: 'warn' },
            { kpi: '재방문율', target: '70%', current: '68%', status: 'good' },
            { kpi: '노쇼율', target: '5%', current: '8.5%', status: 'warn' },
          ].map((k) => (
            <div key={k.kpi} className="p-3 bg-secondary/50 rounded-lg text-center">
              <div className={`text-lg font-bold ${k.status === 'good' ? 'text-green-600' : 'text-amber-600'}`}>{k.current}</div>
              <div className="text-[10px] text-muted-foreground">{k.kpi}</div>
              <div className="text-[9px] text-muted-foreground mt-1">목표: {k.target}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { metric: '진료 시간 준수율', value: 82, target: 90, unit: '%' },
            { metric: '예약 이행율', value: 91.5, target: 95, unit: '%' },
            { metric: '리뷰 응답률', value: 75, target: 90, unit: '%' },
            { metric: '직원 이직률', value: 12, target: 10, unit: '%' },
            { metric: '감염 사고율', value: 0.1, target: 0.5, unit: '%' },
          ].map((m) => (
            <div key={m.metric} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{m.metric}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  m.metric === '직원 이직률' || m.metric === '감염 사고율'
                    ? (m.value <= m.target ? 'bg-green-500' : 'bg-amber-500')
                    : (m.value >= m.target ? 'bg-green-500' : 'bg-amber-500')
                }`} style={{ width: `${Math.min((m.value / (m.target * 1.5)) * 100, 100)}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-12 text-right">{m.value}{m.unit}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

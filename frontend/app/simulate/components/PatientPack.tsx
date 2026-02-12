'use client'

import React from 'react'
import { UserCircle, MapPinned, HeartPulse, Salad, Brain, Stethoscope, BabyIcon, Pill, Activity, Dumbbell } from 'lucide-react'
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

export default function PatientPack({ result }: Props) {
  const pop = result.demographics.population_1km

  return (
    <>
      {/* 1. 환자 세분화 */}
      <Card icon={UserCircle} title="환자 세분화(Segmentation) 분석" color="text-blue-500">
        <div className="space-y-3">
          {[
            { segment: '직장인 급성 통증', pct: 28, age: '25-45세', freq: '1-3회', value: 'HIGH', desc: '점심/퇴근 시간 내원, 빠른 진료 선호' },
            { segment: '노인 만성질환', pct: 22, age: '60세+', freq: '월 2-4회', value: 'VERY HIGH', desc: '오전 집중, 꾸준한 재방문' },
            { segment: '주부 건강관리', pct: 18, age: '35-55세', freq: '월 1-2회', value: 'HIGH', desc: '오전 10시-오후 2시, 비보험 관심' },
            { segment: '학생/청년', pct: 15, age: '15-25세', freq: '분기 1회', value: 'LOW', desc: '스포츠 부상, 저녁 시간대' },
            { segment: '소아 동반 부모', pct: 10, age: '0-14세', freq: '분기 2회', value: 'MEDIUM', desc: '소아 성장 검진, 주말 선호' },
            { segment: '외국인', pct: 7, age: '다양', freq: '분기 1회', value: 'MEDIUM', desc: '영어 진료 니즈, 비보험 비율 높음' },
          ].map((s) => (
            <div key={s.segment} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{s.segment}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">{s.pct}%</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    s.value === 'VERY HIGH' ? 'bg-green-100 text-green-700' :
                    s.value === 'HIGH' ? 'bg-blue-100 text-blue-700' :
                    s.value === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>LTV {s.value}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">{s.age} · {s.freq} · {s.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. 지리적 환자 분포 */}
      <Card icon={MapPinned} title="환자 유입 권역 분석" color="text-green-500">
        <div className="space-y-2 mb-4">
          {[
            { zone: '500m 이내 (도보 5분)', pct: 35, patients: Math.round(38 * 0.35), type: '주변 주민/직장인' },
            { zone: '500m-1km (도보 15분)', pct: 28, patients: Math.round(38 * 0.28), type: '인근 아파트/오피스' },
            { zone: '1-3km (차량 10분)', pct: 22, patients: Math.round(38 * 0.22), type: '주변 동네/역세권' },
            { zone: '3-5km (차량 20분)', pct: 10, patients: Math.round(38 * 0.10), type: '추천/특화 진료' },
            { zone: '5km+ (원거리)', pct: 5, patients: Math.round(38 * 0.05), type: '온라인/추천 환자' },
          ].map((z) => (
            <div key={z.zone} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-36 flex-shrink-0">{z.zone}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${z.pct * 2.5}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-8 text-right">{z.pct}%</span>
              <span className="text-[10px] text-muted-foreground w-8 text-right">{z.patients}명</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground p-2 bg-green-50 dark:bg-green-950/20 rounded">
          주 타겟: 1km 이내 주민/직장인 (63%). 3km 이내 커버리지로 환자 90% 확보.
        </p>
      </Card>

      {/* 3. 생활습관 건강 수요 */}
      <Card icon={Salad} title="생활습관 · 예방 의학 수요" color="text-lime-600">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { item: '비만 유병률', value: '32.8%', patients: Math.round(pop * 0.328), trend: '+2.1%' },
            { item: '흡연율', value: '18.2%', patients: Math.round(pop * 0.182), trend: '-1.5%' },
            { item: '음주율 (과음)', value: '14.5%', patients: Math.round(pop * 0.145), trend: '+0.8%' },
            { item: '운동 부족', value: '42.3%', patients: Math.round(pop * 0.423), trend: '+3.2%' },
          ].map((h) => (
            <div key={h.item} className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-sm font-medium text-foreground">{h.item}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-lime-600">{h.value}</span>
                <span className="text-[10px] text-red-500">{h.trend} ↑</span>
              </div>
              <div className="text-[10px] text-muted-foreground">약 {(h.patients / 1000).toFixed(1)}천명</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">비만+운동부족 인구 높음 → 체형관리/재활운동 프로그램 수요 높음</p>
      </Card>

      {/* 4. 정신건강 수요 */}
      <Card icon={Brain} title="정신건강 · 스트레스 수요" color="text-purple-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">28%</div>
            <div className="text-[10px] text-muted-foreground">스트레스 인지율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">12%</div>
            <div className="text-[10px] text-muted-foreground">우울 증상 경험</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">8%</div>
            <div className="text-[10px] text-muted-foreground">수면장애</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { symptom: '만성 두통', pct: 22, related: result.clinic_type },
            { symptom: '근육 긴장/통증', pct: 35, related: result.clinic_type },
            { symptom: '소화 장애', pct: 18, related: '내과' },
            { symptom: '불면증', pct: 15, related: '정신건강의학' },
            { symptom: '만성 피로', pct: 28, related: '가정의학' },
          ].map((s) => (
            <div key={s.symptom} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{s.symptom}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${s.pct * 2.5}%` }} />
              </div>
              <span className="text-xs text-foreground w-8 text-right">{s.pct}%</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                s.related === result.clinic_type ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>{s.related === result.clinic_type ? '직접' : '연계'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">스트레스 관련 근골격계 질환 환자 35% — {result.clinic_type} 직접 타겟</p>
      </Card>

      {/* 5. 계층별 의료 소비 */}
      <Card icon={HeartPulse} title="소득 계층별 의료 소비 패턴" color="text-red-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">소득 계층</th>
                <th className="text-right py-2 text-muted-foreground text-xs">비율</th>
                <th className="text-right py-2 text-muted-foreground text-xs">월 의료비</th>
                <th className="text-right py-2 text-muted-foreground text-xs">비보험 수용</th>
                <th className="text-right py-2 text-muted-foreground text-xs">방문 빈도</th>
              </tr>
            </thead>
            <tbody>
              {[
                { class: '고소득 (상위 20%)', pct: 31, spending: '45만', nonInsurance: '높음', visits: '월 2.5회' },
                { class: '중상소득', pct: 22, spending: '28만', nonInsurance: '보통', visits: '월 1.8회' },
                { class: '중간소득', pct: 25, spending: '18만', nonInsurance: '선택적', visits: '월 1.5회' },
                { class: '중하소득', pct: 15, spending: '12만', nonInsurance: '낮음', visits: '월 1.2회' },
                { class: '저소득', pct: 7, spending: '8만', nonInsurance: '거의 없음', visits: '월 0.8회' },
              ].map((c) => (
                <tr key={c.class} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{c.class}</td>
                  <td className="py-1.5 text-right text-foreground text-xs font-medium">{c.pct}%</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{c.spending}</td>
                  <td className="py-1.5 text-right text-xs">
                    <span className={`${c.nonInsurance === '높음' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>{c.nonInsurance}</span>
                  </td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{c.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">고소득층 31% — 비보험 프리미엄 서비스 시장 매우 유리</p>
      </Card>

      {/* 6. 만성통증 환자 분석 */}
      <Card icon={Activity} title="만성통증 환자 심층 분석" color="text-orange-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(pop * 0.18 / 1000)}천명</div>
            <div className="text-[10px] text-muted-foreground">만성통증 추정 인구</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">68%</div>
            <div className="text-[10px] text-muted-foreground">적극 치료 의향</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { pain: '허리/요통', pct: 32, severity: 'VAS 5.2', treatment: '물리치료+주사' },
            { pain: '목/어깨 통증', pct: 28, severity: 'VAS 4.8', treatment: '도수+체외충격파' },
            { pain: '무릎 관절', pct: 18, severity: 'VAS 5.5', treatment: 'PRP+운동치료' },
            { pain: '손목/팔꿈치', pct: 12, severity: 'VAS 4.2', treatment: '주사+물리치료' },
            { pain: '발/발목', pct: 10, severity: 'VAS 4.5', treatment: '체외충격파+깔창' },
          ].map((p) => (
            <div key={p.pain} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-xs text-foreground flex-1">{p.pain}</span>
              <span className="text-xs font-bold text-orange-600 w-8 text-right">{p.pct}%</span>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{p.severity}</span>
              <span className="text-[10px] text-muted-foreground w-24 text-right">{p.treatment}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. 약물 복용 패턴 */}
      <Card icon={Pill} title="지역 주민 약물 복용 패턴" color="text-teal-500">
        <div className="space-y-2">
          {[
            { drug: '진통소염제', pct: 42, self: 65, prescription: 35, risk: '위장장애' },
            { drug: '혈압약', pct: 28, self: 0, prescription: 100, risk: '복약 순응도' },
            { drug: '당뇨약', pct: 14, self: 0, prescription: 100, risk: '저혈당' },
            { drug: '수면제/신경안정제', pct: 8, self: 15, prescription: 85, risk: '의존성' },
            { drug: '영양제/건기식', pct: 55, self: 90, prescription: 10, risk: '과다복용' },
            { drug: '외용제 (파스/연고)', pct: 38, self: 80, prescription: 20, risk: '피부자극' },
          ].map((d) => (
            <div key={d.drug} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-xs text-foreground flex-1">{d.drug}</span>
              <span className="text-xs font-bold text-teal-600 w-10 text-right">{d.pct}%</span>
              <div className="w-20 h-3 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: `${d.prescription}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${d.self}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{d.risk}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />처방</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />자가 구매</div>
        </div>
      </Card>

      {/* 8. 스포츠/운동 환자 */}
      <Card icon={Dumbbell} title="스포츠 · 운동 관련 환자 분석" color="text-indigo-500">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">38%</div>
            <div className="text-[10px] text-muted-foreground">주민 운동 참여율</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-foreground">12%</div>
            <div className="text-[10px] text-muted-foreground">운동 중 부상 경험</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { sport: '헬스/웨이트', participants: 25, injury: 15, common: '어깨/허리 부상' },
            { sport: '러닝/마라톤', participants: 18, injury: 12, common: '무릎/발목 통증' },
            { sport: '골프', participants: 12, injury: 18, common: '팔꿈치/허리 통증' },
            { sport: '테니스/배드민턴', participants: 8, injury: 14, common: '어깨/팔꿈치' },
            { sport: '등산', participants: 15, injury: 8, common: '무릎 관절' },
            { sport: '수영', participants: 10, injury: 5, common: '어깨 통증' },
          ].map((s) => (
            <div key={s.sport} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-xs text-foreground flex-1">{s.sport}</span>
              <span className="text-[10px] text-muted-foreground">참여 {s.participants}%</span>
              <span className="text-[10px] text-red-500">부상 {s.injury}%</span>
              <span className="text-[10px] text-muted-foreground w-24 text-right">{s.common}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">스포츠의학 특화 시 연간 추가 환자 <span className="font-bold text-foreground">약 240명</span> 확보 가능</p>
      </Card>

      {/* 9. 진료과별 환자 유입 */}
      <Card icon={Stethoscope} title="추천 환자 유입 경로 분석" color="text-rose-500">
        <div className="space-y-2">
          {[
            { source: '자발적 검색 (네이버/구글)', pct: 35, quality: 78, cost: '마케팅 포함' },
            { source: '지인/가족 추천', pct: 25, quality: 95, cost: '0원' },
            { source: '타 병원 의뢰', pct: 12, quality: 88, cost: '0원' },
            { source: '인근 약국 추천', pct: 8, quality: 82, cost: '0원' },
            { source: 'SNS/블로그 콘텐츠', pct: 10, quality: 72, cost: '콘텐츠 비용' },
            { source: '보험사 지정', pct: 5, quality: 75, cost: '계약 비용' },
            { source: '기업 제휴 (검진)', pct: 5, quality: 80, cost: '영업 비용' },
          ].map((s) => (
            <div key={s.source} className="flex items-center gap-2">
              <span className="text-xs text-foreground flex-1">{s.source}</span>
              <span className="text-xs font-bold text-rose-600 w-8 text-right">{s.pct}%</span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${s.quality}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right">Q.{s.quality}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 예방접종/검진 수요 */}
      <Card icon={BabyIcon} title="예방접종 · 건강검진 수요" color="text-cyan-500">
        <div className="space-y-2">
          {[
            { item: '독감 예방접종', season: '10-12월', demand: 85, patients: Math.round(pop * 0.15 / 100) * 100, price: '3-5만' },
            { item: '폐렴구균 접종', season: '연중', demand: 45, patients: Math.round(pop * 0.04 / 100) * 100, price: '10-15만' },
            { item: '대상포진 접종', season: '연중', demand: 38, patients: Math.round(pop * 0.03 / 100) * 100, price: '15-20만' },
            { item: '기본 건강검진', season: '연중', demand: 72, patients: Math.round(pop * 0.12 / 100) * 100, price: '10-25만' },
            { item: '정밀 건강검진', season: '연중', demand: 35, patients: Math.round(pop * 0.05 / 100) * 100, price: '30-60만' },
            { item: '골밀도 검사', season: '연중', demand: 28, patients: Math.round(pop * 0.02 / 100) * 100, price: '5-8만' },
          ].map((v) => (
            <div key={v.item} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
              <span className="text-xs text-foreground flex-1">{v.item}</span>
              <span className="text-[10px] text-muted-foreground">{v.season}</span>
              <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${v.demand}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right">{v.patients}명</span>
              <span className="text-[10px] font-medium text-foreground w-14 text-right">{v.price}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded">
          예방접종+검진 연 추가 매출: <span className="font-bold text-foreground">약 {Math.round((pop * 0.15 * 40000 + pop * 0.12 * 175000 + pop * 0.05 * 450000) / 100000000 * 10) / 10}억원</span>
        </p>
      </Card>
    </>
  )
}

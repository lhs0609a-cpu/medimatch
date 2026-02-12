'use client'

import React from 'react'
import { MapPin, Navigation, Footprints, Building2, Sun, Cloud, Mountain, ParkingCircle, Accessibility, Eye } from 'lucide-react'
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

export default function LocationPack({ result }: Props) {
  const floating = result.demographics.floating_population_daily

  return (
    <>
      {/* 1. 보행자 동선 분석 */}
      <Card icon={Footprints} title="보행자 동선 · 유동인구 핫스팟" color="text-blue-500">
        <div className="space-y-2 mb-4">
          {[
            { spot: '지하철 출구 앞', flow: 35000, type: '출퇴근 집중', peak: '08:00-09:00', score: 98 },
            { spot: '대로변 횡단보도', flow: 28000, type: '상시 유동', peak: '12:00-13:00', score: 88 },
            { spot: '오피스 단지 입구', flow: 22000, type: '직장인', peak: '08:30-09:30', score: 82 },
            { spot: '버스 정류장', flow: 18000, type: '대중교통', peak: '18:00-19:00', score: 75 },
            { spot: '아파트 단지 후문', flow: 12000, type: '주민', peak: '09:00-10:00', score: 65 },
            { spot: '상가 골목', flow: 8000, type: '상권', peak: '12:00-14:00', score: 55 },
          ].map((s) => (
            <div key={s.spot} className="flex items-center gap-2">
              <span className="text-xs text-foreground w-28 flex-shrink-0">{s.spot}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(s.flow / 35000) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-20 text-right">{(s.flow / 10000).toFixed(1)}만/일</span>
              <span className="text-[10px] font-bold text-blue-600 w-8 text-right">{s.score}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/20 rounded">최적 입지: 지하철 출구 50m 이내, 대로변 1층 또는 2층 (간판 가시성 확보)</p>
      </Card>

      {/* 2. 주차 환경 분석 */}
      <Card icon={ParkingCircle} title="주차 환경 상세 분석" color="text-gray-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">15대</div>
            <div className="text-[10px] text-muted-foreground">건물 내 주차</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">3곳</div>
            <div className="text-[10px] text-muted-foreground">인근 공영주차장</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">78%</div>
            <div className="text-[10px] text-muted-foreground">주차 편의 점수</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">주차장</th>
                <th className="text-right py-2 text-muted-foreground text-xs">거리</th>
                <th className="text-right py-2 text-muted-foreground text-xs">규모</th>
                <th className="text-right py-2 text-muted-foreground text-xs">요금</th>
                <th className="text-right py-2 text-muted-foreground text-xs">제휴 가능</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '건물 지하주차장', dist: '0m', size: '15대', fee: '1시간 3,000원', partner: '가능 (무료 1시간)' },
                { name: '구청 공영주차장', dist: '150m', size: '200대', fee: '10분 500원', partner: '불가' },
                { name: '인근 타워주차장', dist: '80m', size: '85대', fee: '30분 2,000원', partner: '가능 (할인)' },
                { name: '노상 주차', dist: '50m', size: '12면', fee: '5분 200원', partner: '-' },
              ].map((p) => (
                <tr key={p.name} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{p.name}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.dist}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.size}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{p.fee}</td>
                  <td className="py-1.5 text-right text-blue-600 text-xs">{p.partner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. 층별 임대료 비교 */}
      <Card icon={Building2} title="층별 임대 조건 비교" color="text-violet-500">
        <div className="space-y-2">
          {[
            { floor: '1층', rent: 350, deposit: 15000, visibility: 98, access: 100, recommend: true },
            { floor: '2층', rent: 250, deposit: 10000, visibility: 75, access: 90, recommend: true },
            { floor: '3층', rent: 200, deposit: 8000, visibility: 50, access: 80, recommend: false },
            { floor: '4-5층', rent: 170, deposit: 7000, visibility: 30, access: 70, recommend: false },
            { floor: '지하1층', rent: 150, deposit: 5000, visibility: 15, access: 60, recommend: false },
          ].map((f) => (
            <div key={f.floor} className={`flex items-center gap-3 p-3 rounded-lg ${f.recommend ? 'bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800' : 'bg-secondary/30'}`}>
              <span className="text-sm font-medium text-foreground w-14">{f.floor}</span>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>임대료: <span className="font-medium text-foreground">{f.rent}만/평</span></div>
                  <div>보증금: <span className="font-medium text-foreground">{(f.deposit / 10000).toFixed(1)}억</span></div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">가시성</span>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${f.visibility}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">접근성</span>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${f.access}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              {f.recommend && <span className="text-[10px] px-2 py-0.5 bg-violet-500 text-white rounded-full">추천</span>}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">2층 추천: 1층 대비 임대료 30% 절감, 엘리베이터 + 간판으로 가시성 보완</p>
      </Card>

      {/* 4. 대중교통 접근성 */}
      <Card icon={Navigation} title="대중교통 접근성 상세" color="text-green-500">
        <div className="space-y-3">
          {[
            { type: '지하철 2호선 교대역', dist: '180m', time: '도보 3분', daily: '12.5만명', lines: '2, 3호선' },
            { type: '지하철 3호선 남부터미널역', dist: '450m', time: '도보 7분', daily: '8.2만명', lines: '3호선' },
            { type: '버스 정류장 (서초역 앞)', dist: '80m', time: '도보 1분', daily: '3.5만명', lines: '12개 노선' },
            { type: '버스 정류장 (교대역 앞)', dist: '200m', time: '도보 3분', daily: '4.8만명', lines: '18개 노선' },
          ].map((t) => (
            <div key={t.type} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{t.type}</span>
                <span className="text-xs text-green-600 font-medium">{t.time}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>거리: {t.dist}</div>
                <div>일 승하차: {t.daily}</div>
                <div>노선: {t.lines}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">교통 접근성 종합 점수: </span>
          <span className="text-lg font-bold text-green-600">92/100 (A등급)</span>
        </div>
      </Card>

      {/* 5. 가시성/간판 분석 */}
      <Card icon={Eye} title="간판 · 가시성 분석" color="text-amber-500">
        <div className="space-y-2 mb-4">
          {[
            { factor: '도로변 노출도', score: 85, desc: '대로변 직접 면함, 보행자 눈높이', weight: 35 },
            { factor: '간판 크기 허용', score: 72, desc: '최대 가로 5m × 세로 1.5m', weight: 25 },
            { factor: '야간 조명 효과', score: 68, desc: 'LED 채널간판 설치 가능', weight: 20 },
            { factor: '차량 가시성', score: 78, desc: '2차선 도로, 차량 속도 30km/h', weight: 15 },
            { factor: '입구 인지성', score: 82, desc: '건물 입구 바로 옆, 안내판 설치 가능', weight: 5 },
          ].map((f) => (
            <div key={f.factor}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{f.factor} <span className="text-muted-foreground">(가중치 {f.weight}%)</span></span>
                <span className="text-xs font-bold text-amber-600">{f.score}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${f.score}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">가시성 종합: </span>
          <span className="text-sm font-bold text-amber-600">79점</span>
          <span className="text-xs text-muted-foreground"> — 외부 돌출 간판 + 지상 안내판 추가 시 </span>
          <span className="text-sm font-bold text-green-600">92점</span>
        </div>
      </Card>

      {/* 6. 날씨/계절 영향 */}
      <Card icon={Cloud} title="날씨 · 계절 영향 분석" color="text-sky-500">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { season: '봄', rain: 8, temp: '8-18°C', impact: '+12%', icon: '🌸' },
            { season: '여름', rain: 15, temp: '22-33°C', impact: '-15%', icon: '☀️' },
            { season: '가을', rain: 6, temp: '8-22°C', impact: '+15%', icon: '🍂' },
            { season: '겨울', rain: 4, temp: '-8-5°C', impact: '-8%', icon: '❄️' },
          ].map((s) => (
            <div key={s.season} className="text-center p-3 bg-secondary/50 rounded-xl">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-sm font-medium text-foreground">{s.season}</div>
              <div className="text-xs text-muted-foreground">{s.temp}</div>
              <div className={`text-xs font-bold mt-1 ${s.impact.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                환자수 {s.impact}
              </div>
              <div className="text-[10px] text-muted-foreground">비 {s.rain}일/월</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">비/눈 오는 날 환자수 -20~30% 감소. 우산 대여, 주차 서비스로 이탈 방지</p>
      </Card>

      {/* 7. 소음/환경 */}
      <Card icon={Mountain} title="소음 · 주변 환경 평가" color="text-emerald-600">
        <div className="space-y-3">
          {[
            { item: '도로 소음', level: 62, unit: 'dB', grade: 'B', desc: '2차선 도로, 보통 수준', limit: '65dB 이하 권장' },
            { item: '공사 소음', level: 0, unit: 'dB', grade: 'A', desc: '인근 공사 현장 없음', limit: '-' },
            { item: '대기질 (PM2.5)', level: 28, unit: 'µg/m³', grade: 'B+', desc: '보통 수준, 공기청정기 권장', limit: '35 이하 보통' },
            { item: '일조권', level: 85, unit: '%', grade: 'A', desc: '남향, 일조 충분', limit: '70% 이상 양호' },
            { item: '조망', level: 72, unit: '점', grade: 'B+', desc: '앞 건물 5층, 시야 일부 차단', limit: '-' },
          ].map((e) => (
            <div key={e.item} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{e.item}</span>
                  <span className={`text-xs font-bold ${
                    e.grade.startsWith('A') ? 'text-green-600' : e.grade.startsWith('B') ? 'text-blue-600' : 'text-amber-600'
                  }`}>{e.grade}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{e.desc}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{e.level}{e.unit}</div>
                {e.limit !== '-' && <div className="text-[9px] text-muted-foreground">{e.limit}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 건물 적합성 */}
      <Card icon={Building2} title="건물 시설 적합성 평가" color="text-rose-500">
        <div className="space-y-2">
          {[
            { item: '전기 용량', score: 88, requirement: '100kW 이상', current: '150kW', pass: true },
            { item: '급수/배수', score: 92, requirement: '의료시설 기준', current: '적합', pass: true },
            { item: '환기 시스템', score: 75, requirement: '시간당 6회 환기', current: '4회 (보강 필요)', pass: false },
            { item: '엘리베이터', score: 85, requirement: '환자 이동 가능', current: '2대 (13인승)', pass: true },
            { item: '하중', score: 90, requirement: '500kg/m² 이상', current: '600kg/m²', pass: true },
            { item: '방수/방습', score: 82, requirement: '습도 40-60%', current: '적합', pass: true },
            { item: '소방 시설', score: 95, requirement: '스프링클러 + 소화기', current: '완비', pass: true },
            { item: '장애인 접근성', score: 70, requirement: '경사로/점자블록', current: '경사로만 (보강 필요)', pass: false },
          ].map((i) => (
            <div key={i.item} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i.pass ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
              }`}>{i.pass ? '✓' : '!'}</span>
              <span className="text-xs text-foreground flex-1">{i.item}</span>
              <span className="text-[10px] text-muted-foreground w-24 text-right">{i.current}</span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${i.score >= 85 ? 'bg-green-500' : i.score >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${i.score}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-8 text-right">{i.score}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">건물 적합성: </span>
          <span className="text-sm font-bold text-foreground">85/100</span>
          <span className="text-xs text-muted-foreground"> — 환기 보강 + 장애인 접근성 개선 시 </span>
          <span className="text-sm font-bold text-green-600">94점</span>
        </div>
      </Card>

      {/* 9. 일/야간 환경 비교 */}
      <Card icon={Sun} title="주간 · 야간 환경 비교" color="text-yellow-500">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl">
            <div className="text-sm font-medium text-foreground mb-3">☀️ 주간 (09:00-18:00)</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">유동인구</span><span className="font-medium">{Math.round(floating * 0.65 / 10000)}만명</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">주 구성</span><span className="font-medium">직장인 60%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">체류시간</span><span className="font-medium">8-10시간</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">가시성</span><span className="font-bold text-green-600">92점</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">안전도</span><span className="font-bold text-green-600">95점</span></div>
            </div>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            <div className="text-sm font-medium text-foreground mb-3">🌙 야간 (18:00-22:00)</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">유동인구</span><span className="font-medium">{Math.round(floating * 0.35 / 10000)}만명</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">주 구성</span><span className="font-medium">퇴근자 45%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">체류시간</span><span className="font-medium">1-3시간</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">가시성</span><span className="font-bold text-amber-600">68점</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">안전도</span><span className="font-bold text-green-600">85점</span></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-secondary/30 rounded">야간 진료(20시까지) 시 퇴근 직장인 환자 확보 가능. LED 간판 필수.</p>
      </Card>

      {/* 10. 장애인/어르신 접근성 */}
      <Card icon={Accessibility} title="장애인 · 어르신 접근성 평가" color="text-teal-500">
        <div className="space-y-2">
          {[
            { item: '건물 출입 경사로', status: '설치됨', score: 90, note: '기울기 1/12 적합' },
            { item: '자동문', status: '설치됨', score: 95, note: '감지식 자동문' },
            { item: '엘리베이터 점자', status: '있음', score: 88, note: '음성 안내 포함' },
            { item: '장애인 화장실', status: '1개', score: 80, note: '1층 공용 화장실' },
            { item: '장애인 주차구역', status: '2면', score: 85, note: '건물 입구 인접' },
            { item: '점자 블록', status: '일부', score: 65, note: '건물 앞 구간만 설치' },
            { item: '원내 휠체어 통행', status: '가능', score: 82, note: '복도 1.5m 이상' },
            { item: '낮은 접수대', status: '미설치', score: 40, note: '설치 권장 (50만원)' },
          ].map((a) => (
            <div key={a.item} className="flex items-center gap-2">
              <span className="text-xs text-foreground flex-1">{a.item}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                a.score >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                a.score >= 60 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>{a.status}</span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${a.score >= 80 ? 'bg-teal-500' : a.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${a.score}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-8 text-right">{a.score}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
          <p className="text-xs text-muted-foreground">종합 접근성: <span className="font-bold text-foreground">78점</span> → 낮은 접수대 + 점자블록 보강 시 <span className="font-bold text-green-600">88점</span></p>
        </div>
      </Card>
    </>
  )
}

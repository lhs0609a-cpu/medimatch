'use client'

import { BrowserMockup } from './BrowserMockup'
import { PhoneMockup } from './PhoneMockup'
import {
  Target, Rocket, Building2, BarChart3, CheckCircle2, Circle,
  TrendingUp, Calendar, MapPin, Calculator, ShoppingCart,
  Users, Wallet, AlertTriangle, ArrowRight,
} from 'lucide-react'

// ====================================================================
// 1. 진단 결과 — 1분 진단 후 받는 첫 화면
// ====================================================================
export function DiagnoseMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/my-roadmap">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">김원장님의 개원 미션맵</span>
          </div>
          <span className="text-xs text-emerald-600 font-bold">개원까지 D-187</span>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">전체 진행</span>
            <span className="font-bold text-primary text-base">34%</span>
          </div>
          <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full" style={{ width: '34%' }} />
          </div>
        </div>
        <div className="space-y-2">
          {[
            { phase: '1', title: '입지·자금 분석', status: '완료', color: 'emerald', icon: CheckCircle2 },
            { phase: '2', title: '매물 검색·계약', status: '진행중 (2/5)', color: 'blue', icon: Circle },
            { phase: '3', title: '인테리어·기기 견적', status: '대기', color: 'zinc', icon: Circle },
            { phase: '4', title: '인허가·개설 신고', status: '대기', color: 'zinc', icon: Circle },
          ].map((s) => {
            const I = s.icon
            return (
              <div key={s.phase} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center ${
                  s.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                  s.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  'bg-zinc-100 text-zinc-500'
                }`}>{s.phase}</span>
                <span className="flex-1 text-sm font-semibold">{s.title}</span>
                <I className={`w-4 h-4 ${
                  s.color === 'emerald' ? 'text-emerald-500' :
                  s.color === 'blue' ? 'text-blue-500' : 'text-zinc-300'
                }`} />
                <span className={`text-xs font-semibold ${
                  s.color === 'emerald' ? 'text-emerald-600' :
                  s.color === 'blue' ? 'text-blue-600' : 'text-muted-foreground'
                }`}>{s.status}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
          <Rocket className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>다음 액션: <b className="text-foreground">매물 후보 3곳 임장 일정 잡기</b></span>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 2. 매물 검색 결과
// ====================================================================
export function BuildingsMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/buildings">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">매물 검색 결과</span>
          </div>
          <span className="text-xs text-muted-foreground">서울 강남구 · 470건</span>
        </div>
        <div className="flex gap-2 mb-3">
          {['전체', '메디컬빌딩', '근린상가', '오피스'].map((f, i) => (
            <span key={f} className={`text-xs px-3 py-1 rounded-full font-semibold ${
              i === 0 ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground'
            }`}>{f}</span>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { name: '강남역 메디컬빌딩 7층', area: '42평', dep: '8,000만', monthly: '650만', score: 92, tone: 'emerald' },
            { name: '논현동 메디스퀘어 3층', area: '38평', dep: '1.2억', monthly: '780만', score: 87, tone: 'emerald' },
            { name: '역삼동 근린상가 2층', area: '55평', dep: '6,000만', monthly: '520만', score: 78, tone: 'amber' },
          ].map((b) => (
            <div key={b.name} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.area} · 보증금 {b.dep} · 월세 {b.monthly}</div>
              </div>
              <div className={`text-sm font-bold ${
                b.tone === 'emerald' ? 'text-emerald-600' : 'text-amber-600'
              }`}>적합도 {b.score}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>AI 분석: <b className="text-foreground">강남역 메디컬빌딩</b> — 내과 5km내 7곳, 환자 유입 우위</span>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 3. 입지 시뮬레이션 결과
// ====================================================================
export function SimulateMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/simulate">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">강남역 · 내과 시뮬레이션</span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold">VERY_POSITIVE</span>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-3">
          <div className="text-xs text-muted-foreground mb-1 font-semibold">예상 월 매출 (95% 신뢰구간)</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            8,200<span className="text-base font-normal ml-1">만원</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">최소 6,400 · 최대 11,200만원</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">반경 1km 인구</div>
            <div className="font-bold text-base">42,800명</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">동일과 경쟁의원</div>
            <div className="font-bold text-base">7곳 (1km)</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">손익분기</div>
            <div className="font-bold text-base text-emerald-600">8개월</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">5년 생존 확률</div>
            <div className="font-bold text-base text-emerald-600">87%</div>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            <b>주의:</b> 임대료 상승 가능성 12% (3년 시그널) · 임대 협상 시 고정 조항 권장
          </span>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 4. 개원 D-Day 체크리스트
// ====================================================================
export function OpeningProjectMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/opening-project">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">개원 D-Day 체크리스트</span>
          </div>
          <span className="text-sm text-primary font-bold">D-32</span>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { p: '계획', n: 100 },
            { p: '인허가', n: 80 },
            { p: '시공', n: 60 },
            { p: '기기', n: 20 },
            { p: '인력', n: 0 },
          ].map((s) => (
            <div key={s.p} className="text-center">
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${
                  s.n === 100 ? 'bg-emerald-500' :
                  s.n > 0 ? 'bg-blue-500' : 'bg-zinc-300'
                }`} style={{ width: `${s.n}%` }} />
              </div>
              <div className="text-xs text-muted-foreground font-semibold">{s.p}</div>
            </div>
          ))}
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">오늘의 할 일 (4)</div>
        <div className="space-y-2">
          {[
            { task: '의료기기 견적 3곳 비교', due: 'D-30', done: true },
            { task: '인테리어 도면 최종 컨펌', due: 'D-29', done: true },
            { task: '간호조무사 면접 2명', due: 'D-28', done: false },
            { task: '심평원 개설신고 서류 제출', due: 'D-27', done: false },
          ].map((t) => (
            <div key={t.task} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              {t.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-300 flex-shrink-0" />
              )}
              <span className={`text-sm flex-1 ${t.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>{t.task}</span>
              <span className="text-xs text-muted-foreground font-semibold">{t.due}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 5. 공동구매 코호트
// ====================================================================
export function GroupBuyingMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/group-buying">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">2026년 6월 개원 코호트</span>
          </div>
          <span className="text-xs text-amber-600 font-bold">D-12 마감</span>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-semibold">참여 의원</span>
            <span className="font-bold text-2xl text-orange-600 dark:text-orange-400">
              28<span className="text-sm font-normal text-muted-foreground"> / 30명</span>
            </span>
          </div>
          <div className="h-2.5 bg-white dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '93%' }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">2명만 더 모이면 최대 할인 적용</div>
        </div>
        <div className="space-y-2">
          {[
            { cat: '의료기기 (X-ray, 초음파, ECG)', orig: '8,400만', save: '1,920만', pct: 23 },
            { cat: '인테리어 (가구·간판)',         orig: '4,200만', save: '1,050만', pct: 25 },
            { cat: '소모품 (월 정기)',             orig: '180만',   save: '36만',    pct: 20 },
          ].map((c) => (
            <div key={c.cat} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.cat}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.orig}원 → -{c.save}</div>
              </div>
              <div className="text-sm font-bold text-emerald-600">-{c.pct}%</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <span className="text-xs text-muted-foreground font-semibold">총 예상 절감</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">3,006만원</span>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 6. 약국 양도양수 익명 매칭
// ====================================================================
export function PharmacyMatchMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/pharmacy-match">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">익명 약국 매칭</span>
          </div>
          <span className="text-xs text-muted-foreground">서울 · 120건</span>
        </div>
        <div className="space-y-2">
          {[
            { id: 'PM-2451', loc: '강남구', monthly: '월 매출 3,200만', area: '18평', match: 92 },
            { id: 'PM-2438', loc: '서초구', monthly: '월 매출 2,800만', area: '22평', match: 85 },
            { id: 'PM-2415', loc: '송파구', monthly: '월 매출 4,100만', area: '28평', match: 78 },
          ].map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{p.id} · {p.loc}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.monthly} · {p.area}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-primary">매칭 {p.match}%</div>
                <div className="text-xs text-muted-foreground">상호 관심 시 공개</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse flex-shrink-0" />
          <span>2명이 회원님 프로필을 보고 관심 표시함</span>
        </div>
      </div>
    </BrowserMockup>
  )
}

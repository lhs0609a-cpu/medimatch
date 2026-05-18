'use client'

import { BrowserMockup } from './BrowserMockup'
import { PhoneMockup } from './PhoneMockup'
import {
  Mic, Brain, Send, Receipt, Bell, Calendar, Phone,
  TrendingUp, Users, AlertCircle, CheckCircle2, Circle, Pill,
  FileText, Search, ChevronRight, MoreHorizontal, Star,
} from 'lucide-react'

// 디자인 원칙: 한눈에 확 들어오게 — 본문 text-sm(14px), 보조 text-xs(12px),
// 라벨 text-[11px]. 충분히 큰 패딩으로 자신감 있는 비주얼.

// ====================================================================
// 1. AI 음성 차트 작성 화면
// ====================================================================
export function ChartMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/chart/new">
      <div className="p-6 text-sm flex gap-5">
        <div className="w-32 space-y-1.5 flex-shrink-0">
          {['진료', '환자', '처방·청구', 'CRM', '리포트', '발견'].map((m, i) => (
            <div key={m} className={`px-3 py-2 rounded-lg text-xs ${
              i === 0 ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground'
            }`}>{m}</div>
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <div>
              <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">김환자 · 남 · 38세</div>
              <div className="text-xs text-muted-foreground mt-0.5">차트 A-1024 · 2026-05-15 14:30</div>
            </div>
            <div className="flex items-center gap-1.5 text-red-500 text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              REC 01:42
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wider">CC · 주호소</div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 text-sm">
              3일 전부터 시작된 우측 하복부 통증, 식후 악화
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wider">PI · 현병력</div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 text-sm">
              지속 통증 NRS 6/10, 발열·구토 동반 없음. 최근 회식 후 발생
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> AI 진단코드 추천
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md font-mono text-xs">K59.0 변비</span>
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md font-mono text-xs">K30 소화불량</span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md font-mono text-xs">R10.4 복통 NOS</span>
            </div>
          </div>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 2. 보험청구 검증 화면 (삭감 방어)
// ====================================================================
export function ClaimsMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/claims">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">보험청구 검증</span>
          </div>
          <span className="text-xs text-muted-foreground">2026-05-15 일일 점검 16건</span>
        </div>
        {/* 위험도 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">안전</div>
            <div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">12</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">주의</div>
            <div className="font-bold text-2xl text-amber-600 dark:text-amber-400">3</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">위험</div>
            <div className="font-bold text-2xl text-red-600 dark:text-red-400">1</div>
          </div>
        </div>
        {/* 위험 청구 알림 */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-bold text-red-700 dark:text-red-400">차트 A-1019 · 삭감 위험 87%</div>
              <div className="text-xs text-muted-foreground mt-1">N20.0 + N20.1 동시 청구는 지난 분기 4건 모두 삭감됨</div>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono">→ N20.0 단일</span>
                <span className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-semibold">대안 적용</span>
              </div>
            </div>
          </div>
        </div>
        {/* 정상 청구 리스트 */}
        <div className="space-y-1.5">
          {[
            { id: 'A-1020', dx: 'J06.9', amt: '8,420' },
            { id: 'A-1021', dx: 'K59.0', amt: '12,150' },
            { id: 'A-1022', dx: 'M54.5', amt: '15,800' },
          ].map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs">
              <span className="font-mono text-muted-foreground">{r.id}</span>
              <span className="font-mono font-semibold">{r.dx}</span>
              <span className="font-mono">{r.amt}원</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 3. CRM 환자 리콜 화면
// ====================================================================
export function CRMMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/crm">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">환자 리콜 캠페인</span>
          </div>
          <button className="text-xs bg-primary text-white px-3 py-1.5 rounded-md font-semibold">+ 신규 캠페인</button>
        </div>
        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">대상</div>
            <div className="font-bold text-xl">142</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">발송</div>
            <div className="font-bold text-xl">138</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">예약</div>
            <div className="font-bold text-xl text-emerald-600">34</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-0.5">전환율</div>
            <div className="font-bold text-xl text-primary">24.6%</div>
          </div>
        </div>
        {/* 진행 캠페인 */}
        <div className="space-y-2">
          {[
            { name: '3개월 미방문 일반 검진', sent: '138/142', status: '진행중', tone: 'emerald' },
            { name: '만성질환 정기검진 안내', sent: '예약중', status: '오늘 19:00 발송', tone: 'amber' },
            { name: '고객만족도 평가 요청', sent: '88/92', status: '완료', tone: 'zinc' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-[#FEE500] flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-zinc-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.sent}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                c.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                c.tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-zinc-100 text-zinc-600'
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 4. 예약/접수 캘린더 화면
// ====================================================================
export function BookingMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/appointments">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">2026-05-15 (목)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md font-semibold">예약 24</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md font-semibold">도착 18</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { time: '14:00', name: '김환자', type: '초진', status: '도착', color: 'emerald' },
            { time: '14:15', name: '이환자', type: '재진', status: '진료중', color: 'blue' },
            { time: '14:30', name: '박환자', type: '검진', status: '대기', color: 'amber' },
            { time: '14:45', name: '최환자', type: '초진', status: '예약', color: 'zinc' },
            { time: '15:00', name: '정환자', type: '재진', status: '예약', color: 'zinc' },
          ].map((a) => (
            <div key={a.time} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <span className="font-mono text-xs w-12 text-muted-foreground font-semibold">{a.time}</span>
              <span className="font-semibold text-sm flex-1">{a.name}</span>
              <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded font-medium">{a.type}</span>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                a.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                a.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                a.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-zinc-100 text-zinc-600'
              }`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 5. 경영 대시보드 화면
// ====================================================================
export function DashboardMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr-dashboard">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">비즈니스 분석</span>
          </div>
          <span className="text-xs text-muted-foreground">2026-05</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">월 매출</div>
            <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">8,420만</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">▲ 12%</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">환자수</div>
            <div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">1,284</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">▲ 8%</div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">재방문율</div>
            <div className="font-bold text-2xl text-violet-600 dark:text-violet-400">68%</div>
            <div className="text-xs text-emerald-600 mt-1 font-semibold">▲ 25%</div>
          </div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg p-4 mb-3">
          <div className="text-xs text-muted-foreground mb-2 font-semibold">최근 6개월 매출 추이</div>
          <div className="flex items-end gap-1.5 h-20">
            {[42, 48, 55, 62, 71, 84].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-primary rounded-t" style={{ height: `${h}%` }} />
                <span className="text-xs text-muted-foreground">{12 + i}월</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">
          <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span><b className="text-foreground">AI 인사이트:</b> 수요일 14:00~16:00 공실율 38% — 리콜 캠페인 권장</span>
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 6. 환자 카톡 알림톡 (폰)
// ====================================================================
export function PatientPhoneMockup() {
  return (
    <PhoneMockup>
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-700 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center text-sm font-bold text-zinc-800">메디</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">메디매치 내과의원</div>
          <div className="text-xs text-muted-foreground">알림톡</div>
        </div>
      </div>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/40 rounded-xl p-3 mb-2.5 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-yellow-700 dark:text-yellow-400">
          <Calendar className="w-3.5 h-3.5" /> 예약 확정
        </div>
        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
          김환자님, <b>2026-05-16 (금) 14:30</b> 진료 예약이 확정되었습니다.
        </div>
        <button className="mt-2 w-full text-xs text-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 font-medium">지도 보기</button>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-3 mb-2.5 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
          <FileText className="w-3.5 h-3.5" /> 사전 문진 (1분)
        </div>
        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">내원 전 11문항 작성하시면<br />대기 시간 없이 진료 시작됩니다.</div>
        <button className="mt-2 w-full text-xs text-center bg-blue-500 text-white rounded-md py-1.5 font-semibold">문진 시작 →</button>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <Pill className="w-3.5 h-3.5" /> 복약 시간
        </div>
        <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">점심 식후 처방약 복용 시간입니다.</div>
        <div className="flex gap-1.5 mt-2">
          <button className="flex-1 text-xs bg-emerald-500 text-white rounded-md py-1.5 font-semibold">복용 완료</button>
          <button className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 font-medium">부작용 보고</button>
        </div>
      </div>
    </PhoneMockup>
  )
}

// ====================================================================
// 7. 환자 관리 리스트
// ====================================================================
export function PatientListMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/patients">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">환자 관리</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">이름·전화·차트 검색</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { chart: 'A-1024', name: '김환자', sex: '남 · 38', last: '오늘', tag: '진행중', tone: 'blue' },
            { chart: 'A-1015', name: '이환자', sex: '여 · 52', last: '5월 8일', tag: '재방문', tone: 'emerald' },
            { chart: 'A-0998', name: '박환자', sex: '남 · 67', last: '5월 1일', tag: '만성질환', tone: 'violet' },
            { chart: 'A-0987', name: '최환자', sex: '여 · 29', last: '4월 22일', tag: '리콜 대상', tone: 'amber' },
            { chart: 'A-0972', name: '정환자', sex: '남 · 45', last: '4월 18일', tag: '미수금', tone: 'red' },
          ].map((p) => (
            <div key={p.chart} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <span className="font-mono text-xs text-muted-foreground w-14 font-semibold">{p.chart}</span>
              <span className="font-semibold text-sm flex-1">{p.name}</span>
              <span className="text-xs text-muted-foreground w-16">{p.sex}</span>
              <span className="text-xs text-muted-foreground w-20">{p.last}</span>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                p.tone === 'blue' ? 'bg-blue-100 text-blue-700' :
                p.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                p.tone === 'violet' ? 'bg-violet-100 text-violet-700' :
                p.tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>{p.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  )
}

// ====================================================================
// 8. 약국 처방 픽업 화면
// ====================================================================
export function PharmacyBridgeMockup() {
  return (
    <BrowserMockup url="medi.brandplaton.com/emr/bridge">
      <div className="p-6 text-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">약국 브릿지</span>
          </div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            실시간 연결 12곳
          </span>
        </div>
        <div className="space-y-2">
          {[
            { time: '14:32', code: 'P-742', drug: '타이레놀 500mg ×3', status: '조제 완료', tone: 'emerald' },
            { time: '14:28', code: 'P-741', drug: '아목시실린 250mg ×6', status: '조제 중', tone: 'amber' },
            { time: '14:21', code: 'P-740', drug: '레보탁신 50mcg ×30', status: 'DUR 확인 중', tone: 'blue' },
          ].map((rx) => (
            <div key={rx.code} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <span className="font-mono text-xs text-muted-foreground w-12 font-semibold">{rx.time}</span>
              <span className="font-mono font-bold text-sm w-14">{rx.code}</span>
              <span className="flex-1 text-sm truncate font-medium">{rx.drug}</span>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                rx.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                rx.tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>{rx.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground px-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          평균 전송 시간 <b className="text-emerald-600">3초</b> · DUR 자동 검증 · 위변조 방지
        </div>
      </div>
    </BrowserMockup>
  )
}

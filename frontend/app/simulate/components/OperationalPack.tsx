'use client'

import React from 'react'
import { Calendar, ClipboardList, Megaphone, UserCheck, Phone, Wifi, Shield, Wrench, Award, BookOpen } from 'lucide-react'
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

export default function OperationalPack({ result }: Props) {
  return (
    <>
      {/* 1. 개원 준비 타임라인 */}
      <Card icon={Calendar} title="개원 준비 타임라인 (6개월)" color="text-blue-500">
        <div className="space-y-3">
          {[
            { month: '1개월', phase: '입지 선정 · 계약', tasks: ['부동산 탐색', '임대차 계약', '인허가 준비'], color: 'bg-blue-500', pct: 100 },
            { month: '2개월', phase: '인허가 · 설계', tasks: ['의료기관 개설신고', '인테리어 설계', '장비 선정'], color: 'bg-indigo-500', pct: 100 },
            { month: '3-4개월', phase: '인테리어 · 장비', tasks: ['시공 착공', '의료장비 발주', '가구/집기 구매'], color: 'bg-violet-500', pct: 100 },
            { month: '5개월', phase: '인력 채용 · 교육', tasks: ['간호사/직원 채용', '업무 매뉴얼 작성', '시스템 세팅'], color: 'bg-purple-500', pct: 100 },
            { month: '6개월', phase: '마케팅 · 오픈', tasks: ['온라인 마케팅 시작', '시범 운영 2주', '정식 개원'], color: 'bg-fuchsia-500', pct: 100 },
          ].map((p, idx) => (
            <div key={p.month} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${p.color} text-white text-xs font-bold flex items-center justify-center`}>
                  {idx + 1}
                </div>
                {idx < 4 && <div className="w-0.5 h-full bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{p.month}</span>
                  <span className="text-sm font-medium text-foreground">{p.phase}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.tasks.map((task) => (
                    <span key={task} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{task}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. 인력 구성 계획 */}
      <Card icon={UserCheck} title="최적 인력 구성 계획" color="text-green-500">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">직종</th>
                <th className="text-right py-2 text-muted-foreground">인원</th>
                <th className="text-right py-2 text-muted-foreground">평균 급여</th>
                <th className="text-right py-2 text-muted-foreground">월 소계</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: '원장(의사)', count: 1, salary: '-', total: '-', note: '사업소득' },
                { role: '간호사', count: 2, salary: '320만', total: '640만', note: '면허 필수' },
                { role: '물리치료사', count: 1, salary: '300만', total: '300만', note: '면허 필수' },
                { role: '간호조무사', count: 1, salary: '260만', total: '260만', note: '자격증' },
                { role: '행정/접수', count: 2, salary: '280만', total: '560만', note: '' },
                { role: '방사선사', count: 1, salary: '340만', total: '340만', note: '면허 필수' },
              ].map((s) => (
                <tr key={s.role} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{s.role}</td>
                  <td className="py-2 text-right text-foreground">{s.count}명</td>
                  <td className="py-2 text-right text-muted-foreground">{s.salary}</td>
                  <td className="py-2 text-right font-medium text-foreground">{s.total}</td>
                </tr>
              ))}
              <tr className="font-bold bg-secondary/30">
                <td className="py-2">합계</td>
                <td className="py-2 text-right">8명</td>
                <td className="py-2 text-right">-</td>
                <td className="py-2 text-right">2,100만</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">32%</div>
            <div className="text-[10px] text-muted-foreground">인건비/매출 비율</div>
          </div>
          <div className="p-2 bg-secondary/50 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">적정</div>
            <div className="text-[10px] text-muted-foreground">업계 평균 35% 대비</div>
          </div>
        </div>
      </Card>

      {/* 3. 마케팅 실행 계획 */}
      <Card icon={Megaphone} title="마케팅 실행 로드맵" color="text-pink-500">
        <div className="space-y-3">
          {[
            { phase: '개원 전 (D-30)', items: ['네이버 플레이스 등록', '인스타그램 계정 개설', '블로그 건강 콘텐츠 5편', '당근마켓 비즈프로필'], color: 'bg-pink-100 dark:bg-pink-900/30' },
            { phase: '개원 1주차', items: ['개원 이벤트 (초진 할인)', '오프라인 배너/현수막', '주변 아파트 전단지', '카카오톡 채널 개설'], color: 'bg-rose-100 dark:bg-rose-900/30' },
            { phase: '1-3개월', items: ['네이버 키워드 광고', '리뷰 관리 시스템 구축', '기업 건강검진 영업', '지역 커뮤니티 활동'], color: 'bg-orange-100 dark:bg-orange-900/30' },
            { phase: '3-6개월', items: ['콘텐츠 마케팅 강화', '환자 추천 프로그램', '인스타 릴스/숏폼', 'CRM 재방문 유도'], color: 'bg-amber-100 dark:bg-amber-900/30' },
          ].map((p) => (
            <div key={p.phase} className={`p-3 rounded-xl ${p.color}`}>
              <div className="text-sm font-medium text-foreground mb-2">{p.phase}</div>
              <div className="grid grid-cols-2 gap-1">
                {p.items.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-pink-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. 진료 프로세스 */}
      <Card icon={ClipboardList} title="최적 진료 프로세스 설계" color="text-cyan-500">
        <div className="space-y-2">
          {[
            { step: 1, name: '접수/예약', time: '3분', staff: '접수', tool: 'EMR', tip: '온라인 예약 시스템으로 대기시간 단축' },
            { step: 2, name: '기본 검사', time: '10분', staff: '간호사', tool: 'X-ray/초음파', tip: '사전 검사로 진료 효율 극대화' },
            { step: 3, name: '의사 진료', time: '15분', staff: '원장', tool: 'EMR', tip: '환자당 평균 15분 배분' },
            { step: 4, name: '치료/시술', time: '20분', staff: '간호사/치료사', tool: '치료기기', tip: '물리치료 예약제 운영' },
            { step: 5, name: '처방/수납', time: '5분', staff: '접수', tool: 'POS', tip: '전자처방전 + 카드/간편결제' },
            { step: 6, name: '예약관리', time: '2분', staff: '접수', tool: 'CRM', tip: '재방문 알림 자동 발송' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">{s.time}</span>
                  <span className="text-[10px] text-muted-foreground">{s.staff}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{s.tip}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">총 프로세스 시간: </span>
          <span className="text-sm font-bold text-cyan-600">약 55분/환자</span>
          <span className="text-xs text-muted-foreground"> · 시간당 처리: </span>
          <span className="text-sm font-bold text-cyan-600">4-5명</span>
        </div>
      </Card>

      {/* 5. IT 인프라 */}
      <Card icon={Wifi} title="IT · 디지털 인프라 계획" color="text-indigo-500">
        <div className="space-y-2">
          {[
            { system: 'EMR (전자의무기록)', cost: '월 30만', priority: '필수', vendor: '메디칼소프트/닥터팔레트' },
            { system: 'PACS (영상저장전송)', cost: '월 15만', priority: '필수', vendor: '인피니트/마로테크' },
            { system: '예약관리 시스템', cost: '월 10만', priority: '권장', vendor: '똑닥/캐시닥' },
            { system: 'CRM/마케팅', cost: '월 8만', priority: '권장', vendor: '채널톡/카카오비즈' },
            { system: 'CCTV/보안', cost: '설치 200만', priority: '필수', vendor: '한화비전' },
            { system: '인터넷/와이파이', cost: '월 5만', priority: '필수', vendor: 'KT/SKB' },
            { system: 'POS/결제단말기', cost: '월 3만', priority: '필수', vendor: '토스/KIS' },
          ].map((s) => (
            <div key={s.system} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{s.system}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    s.priority === '필수' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>{s.priority}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{s.vendor}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{s.cost}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">IT 인프라 월 비용: </span>
          <span className="text-sm font-bold text-indigo-600">약 71만원</span>
        </div>
      </Card>

      {/* 6. 환자 만족도 전략 */}
      <Card icon={Award} title="환자 만족도 향상 전략" color="text-amber-500">
        <div className="space-y-2">
          {[
            { strategy: '대기시간 최소화', impact: 95, method: '온라인 예약 + 실시간 대기 안내' },
            { strategy: '친절한 응대', impact: 92, method: '서비스 교육 월 1회 + 미스터리 쇼핑' },
            { strategy: '쾌적한 환경', impact: 88, method: '대기실 인테리어 + 공기청정 + 음료 제공' },
            { strategy: '치료 결과 설명', impact: 90, method: '진료 후 영상/사진 기반 설명' },
            { strategy: '사후 관리', impact: 85, method: '치료 후 2일차 안부 문자 발송' },
            { strategy: '리뷰 관리', impact: 82, method: '만족 환자 리뷰 요청 + 불만 즉시 대응' },
          ].map((s) => (
            <div key={s.strategy} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{s.strategy}</span>
                <span className="text-xs font-bold text-amber-600">영향도 {s.impact}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${s.impact}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{s.method}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. 의료사고 리스크 */}
      <Card icon={Shield} title="의료사고 리스크 관리" color="text-red-600">
        <div className="space-y-2">
          {[
            { risk: '진료 과실', level: '중간', prob: 35, mitigation: '표준 진료 지침 준수, 정기 교육' },
            { risk: '감염 관리', level: '낮음', prob: 15, mitigation: '멸균 프로토콜, 격월 감사' },
            { risk: '투약 오류', level: '낮음', prob: 12, mitigation: 'EMR 약물 상호작용 체크' },
            { risk: '환자 정보 유출', level: '중간', prob: 25, mitigation: '보안 시스템 + 직원 교육' },
            { risk: '장비 고장', level: '낮음', prob: 18, mitigation: '정기 점검 + 유지보수 계약' },
          ].map((r) => (
            <div key={r.risk} className="flex items-start gap-3 p-3 border border-border rounded-lg">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                r.level === '높음' ? 'bg-red-100 text-red-700' : r.level === '중간' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>{r.level}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{r.risk}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 장비 유지보수 */}
      <Card icon={Wrench} title="장비 유지보수 스케줄" color="text-gray-600">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">장비</th>
                <th className="text-right py-2 text-muted-foreground">점검 주기</th>
                <th className="text-right py-2 text-muted-foreground">연 비용</th>
                <th className="text-right py-2 text-muted-foreground">교체 주기</th>
              </tr>
            </thead>
            <tbody>
              {[
                { equip: 'X-ray', cycle: '6개월', cost: '120만', replace: '10년' },
                { equip: '초음파', cycle: '6개월', cost: '80만', replace: '8년' },
                { equip: '체외충격파', cycle: '3개월', cost: '150만', replace: '5년' },
                { equip: '물리치료기기', cycle: '3개월', cost: '60만', replace: '7년' },
                { equip: 'EMR 서버', cycle: '1개월', cost: '30만', replace: '4년' },
                { equip: '에어컨/환기', cycle: '6개월', cost: '50만', replace: '10년' },
              ].map((e) => (
                <tr key={e.equip} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{e.equip}</td>
                  <td className="py-2 text-right text-muted-foreground">{e.cycle}</td>
                  <td className="py-2 text-right font-medium text-foreground">{e.cost}</td>
                  <td className="py-2 text-right text-muted-foreground">{e.replace}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">연간 유지보수 예산: <span className="font-bold text-foreground">약 490만원</span></p>
      </Card>

      {/* 9. 전화 상담 분석 */}
      <Card icon={Phone} title="전화 상담 · 예약 분석" color="text-teal-500">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
            <div className="text-xl font-bold text-teal-600">45건</div>
            <div className="text-[10px] text-muted-foreground">일 평균 전화</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">62%</div>
            <div className="text-[10px] text-muted-foreground">예약 전환율</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">85%</div>
            <div className="text-[10px] text-muted-foreground">내원 실현율</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { type: '예약 문의', pct: 45 }, { type: '진료 상담', pct: 25 },
            { type: '가격 문의', pct: 15 }, { type: '위치/주차', pct: 10 },
            { type: '기타', pct: 5 },
          ].map((t) => (
            <div key={t.type} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">{t.type}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${t.pct * 2}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{t.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 법규 체크리스트 */}
      <Card icon={BookOpen} title="의료기관 법규 · 인허가 체크리스트" color="text-purple-600">
        <div className="space-y-2">
          {[
            { item: '의료기관 개설신고', status: '필수', dept: '관할 보건소', time: '2-4주' },
            { item: '사업자등록', status: '필수', dept: '국세청', time: '1주' },
            { item: '건강보험 요양기관 지정', status: '필수', dept: '건보공단', time: '2-3주' },
            { item: '방사선 안전관리', status: '필수', dept: '원안위', time: '3-4주' },
            { item: '의료폐기물 처리 계약', status: '필수', dept: '전문업체', time: '1주' },
            { item: '소방시설 점검', status: '필수', dept: '소방서', time: '2주' },
            { item: '개인정보처리방침 수립', status: '필수', dept: '자체', time: '1주' },
            { item: '의료광고 심의', status: '해당시', dept: '의사협회', time: '2-4주' },
          ].map((c, idx) => (
            <div key={c.item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
              <span className="text-sm text-foreground flex-1">{c.item}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                c.status === '필수' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>{c.status}</span>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{c.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

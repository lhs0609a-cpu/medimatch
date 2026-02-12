'use client'

import React from 'react'
import { Scale, FileCheck, Shield, AlertTriangle, Gavel, BookOpen, Fingerprint, Flame, Trash2, FileWarning } from 'lucide-react'
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

export default function AnalysisPack6({ result }: Props) {
  return (
    <>
      {/* 1. 의료법 주요 규제 */}
      <Card icon={Gavel} title="의료법 주요 규제 체크" color="text-red-600">
        <div className="space-y-2">
          {[
            { law: '의료법 제33조 (개설)', risk: '필수 준수', desc: '의료인만 의료기관 개설 가능, 복수 개설 불가', penalty: '개설 취소' },
            { law: '의료법 제56조 (광고)', risk: '주의 필요', desc: '치료 효과 과장, 환자 치험례 광고 금지', penalty: '1년 이하 징역' },
            { law: '의료법 제21조 (기록)', risk: '필수 준수', desc: '진료기록부 작성·보관 의무 (10년)', penalty: '300만원 이하 벌금' },
            { law: '의료법 제59조 (지도감독)', risk: '상시 대비', desc: '보건소 현장 점검 연 1-2회 실시', penalty: '업무 정지' },
            { law: '국민건강보험법', risk: '필수 준수', desc: '요양기관 지정 및 급여기준 준수', penalty: '지정 취소' },
            { law: '약사법 제23조', risk: '주의 필요', desc: '원내 조제 범위, 의약품 관리 기준', penalty: '500만원 이하 벌금' },
          ].map((l) => (
            <div key={l.law} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{l.law}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  l.risk === '필수 준수' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  l.risk === '주의 필요' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>{l.risk}</span>
              </div>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
              <p className="text-[10px] text-red-500 mt-1">위반시: {l.penalty}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 2. 의료광고 심의 */}
      <Card icon={FileCheck} title="의료광고 심의 가이드" color="text-blue-600">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">허용 광고</p>
            <div className="space-y-1">
              {['의료기관 명칭/위치', '진료과목/진료시간', '의료인 성명/자격', '시설/장비 안내', '건강 정보 제공'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[10px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">금지 광고</p>
            <div className="space-y-1">
              {['치료 효과 보장', '환자 후기 (사전동의 없이)', '비교 광고', 'Before/After 사진', '가격 할인 과장'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[10px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">심의 기간: 2-4주</span> · 심의 비용: 건당 5-10만원 · 온라인 광고도 심의 대상
          </p>
        </div>
      </Card>

      {/* 3. 개인정보보호 */}
      <Card icon={Fingerprint} title="개인정보보호 컴플라이언스" color="text-purple-600">
        <div className="space-y-2">
          {[
            { item: '개인정보처리방침 수립·공개', status: '필수', effort: '1주', cost: '50만' },
            { item: '개인정보 수집·이용 동의서', status: '필수', effort: '3일', cost: '30만' },
            { item: '제3자 제공 동의서 (보험사 등)', status: '필수', effort: '3일', cost: '20만' },
            { item: '영상정보(CCTV) 안내판', status: '필수', effort: '1일', cost: '5만' },
            { item: '개인정보 암호화 조치', status: '필수', effort: '1주', cost: '100만' },
            { item: '접근 권한 관리 체계', status: '필수', effort: '3일', cost: '50만' },
            { item: '개인정보 파기 절차', status: '필수', effort: '2일', cost: '20만' },
            { item: '정보보호 교육 (연 1회)', status: '필수', effort: '반일', cost: '무료' },
          ].map((c, idx) => (
            <div key={c.item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
              <span className="text-xs text-foreground flex-1">{c.item}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded">{c.status}</span>
              <span className="text-[10px] text-muted-foreground w-10 text-right">{c.effort}</span>
              <span className="text-[10px] font-medium text-foreground w-12 text-right">{c.cost}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg text-center">
          <span className="text-xs text-muted-foreground">컴플라이언스 구축 총 비용: </span>
          <span className="text-sm font-bold text-purple-600">약 275만원</span>
          <span className="text-xs text-muted-foreground"> · 위반 시 최대 과태료: </span>
          <span className="text-sm font-bold text-red-600">5천만원</span>
        </div>
      </Card>

      {/* 4. 소방/안전 */}
      <Card icon={Flame} title="소방 · 안전 관리 체크리스트" color="text-orange-600">
        <div className="space-y-2">
          {[
            { item: '소화기 비치', detail: '바닥면적 33m² 마다 1개', cycle: '월 1회 점검', cost: '개당 3만' },
            { item: '스프링클러', detail: '11층 이상 또는 6000m² 이상', cycle: '6개월 점검', cost: '설치 시 포함' },
            { item: '비상구/피난 경로', detail: '양방향 피난 확보', cycle: '상시 확인', cost: '-' },
            { item: '화재 감지기', detail: '모든 실에 설치', cycle: '6개월 점검', cost: '실당 5만' },
            { item: '소방 안전 교육', detail: '전 직원 대상 연 2회', cycle: '6개월', cost: '무료' },
            { item: '비상 발전기', detail: '수술실/중환자실 해당 시', cycle: '월 1회', cost: '설치 2000만' },
          ].map((c) => (
            <div key={c.item} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <div className="text-sm text-foreground">{c.item}</div>
                <div className="text-[10px] text-muted-foreground">{c.detail}</div>
              </div>
              <span className="text-[10px] text-muted-foreground w-16 text-right">{c.cycle}</span>
              <span className="text-[10px] font-medium text-foreground w-16 text-right">{c.cost}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. 의료폐기물 관리 */}
      <Card icon={Trash2} title="의료폐기물 관리 분석" color="text-gray-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">85kg</div>
            <div className="text-[10px] text-muted-foreground">월 예상 발생량</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">42만</div>
            <div className="text-[10px] text-muted-foreground">월 처리 비용</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">7일</div>
            <div className="text-[10px] text-muted-foreground">최대 보관 기간</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground text-xs">폐기물 종류</th>
                <th className="text-right py-2 text-muted-foreground text-xs">월 발생</th>
                <th className="text-right py-2 text-muted-foreground text-xs">처리 단가</th>
                <th className="text-right py-2 text-muted-foreground text-xs">보관 방법</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: '격리의료폐기물', amount: '25kg', unit: 'kg당 3,500원', storage: '전용 용기 (적색)' },
                { type: '위해의료폐기물 (주사침)', amount: '15kg', unit: 'kg당 4,000원', storage: '손상방지용기' },
                { type: '일반의료폐기물', amount: '30kg', unit: 'kg당 2,500원', storage: '전용 봉투 (황색)' },
                { type: '조직물류폐기물', amount: '5kg', unit: 'kg당 5,000원', storage: '전용 용기 (적색)' },
                { type: '일반 사업장폐기물', amount: '10kg', unit: 'kg당 800원', storage: '일반 분리수거' },
              ].map((w) => (
                <tr key={w.type} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground text-xs">{w.type}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{w.amount}</td>
                  <td className="py-1.5 text-right text-foreground text-xs">{w.unit}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs">{w.storage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. 근로기준법 체크 */}
      <Card icon={Scale} title="근로기준법 · 인사관리 체크" color="text-indigo-600">
        <div className="space-y-2">
          {[
            { item: '근로계약서 작성', detail: '채용 즉시, 2부 작성 (1부 교부)', risk: '500만원 과태료' },
            { item: '최저임금 준수', detail: '2026년 시간급 11,200원 이상', risk: '3년 이하 징역' },
            { item: '주 52시간 근무', detail: '연장근로 포함 주 52시간 이내', risk: '2년 이하 징역' },
            { item: '연차 유급휴가', detail: '1년 미만 월 1일, 이후 15일', risk: '2년 이하 징역' },
            { item: '야간근무 수당', detail: '22시~06시 통상임금 50% 가산', risk: '3년 이하 징역' },
            { item: '퇴직급여', detail: '1년 이상 근무 시 퇴직금/퇴직연금', risk: '3년 이하 징역' },
            { item: '직장 내 괴롭힘 방지', detail: '예방 교육 연 1회, 신고 체계 구축', risk: '1천만원 과태료' },
            { item: '직장 내 성희롱 예방', detail: '예방 교육 연 1회 (10인 이상)', risk: '500만원 과태료' },
          ].map((l) => (
            <div key={l.item} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <span className="text-sm text-foreground">{l.item}</span>
                <p className="text-[10px] text-muted-foreground">{l.detail}</p>
              </div>
              <span className="text-[10px] text-red-500 flex-shrink-0">{l.risk}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. 감염관리 */}
      <Card icon={Shield} title="감염관리 · 방역 체계" color="text-teal-600">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { item: '손 위생 시설', status: '진료실당 1개', cost: '실당 30만' },
            { item: '멸균 시스템', status: 'EO 가스 또는 오토클레이브', cost: '500-2000만' },
            { item: '공기 정화', status: '환기 + HEPA 필터', cost: '실당 100만' },
            { item: '방역 계약', status: '격월 정기 방역', cost: '월 15만' },
          ].map((i) => (
            <div key={i.item} className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
              <div className="text-sm font-medium text-foreground">{i.item}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{i.status}</div>
              <div className="text-[10px] font-medium text-teal-600 mt-0.5">{i.cost}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            { protocol: '손 소독 프로토콜', compliance: 95 },
            { protocol: '기구 멸균 관리', compliance: 98 },
            { protocol: '환경 소독 (일 2회)', compliance: 88 },
            { protocol: '리넨 관리', compliance: 92 },
            { protocol: '감염환자 격리 절차', compliance: 85 },
          ].map((p) => (
            <div key={p.protocol} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{p.protocol}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.compliance}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">{p.compliance}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. 의료사고 배상 */}
      <Card icon={AlertTriangle} title="의료사고 · 배상 리스크 분석" color="text-amber-600">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="text-xl font-bold text-amber-600">2.3%</div>
            <div className="text-[10px] text-muted-foreground">{result.clinic_type} 사고 발생률</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">4,200만</div>
            <div className="text-[10px] text-muted-foreground">건당 평균 배상</div>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">240만</div>
            <div className="text-[10px] text-muted-foreground">연 보험료</div>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { type: '진단 오류', pct: 32, avgCost: '5,500만', prevention: '이중 확인 체계, AI 보조' },
            { type: '치료/시술 합병증', pct: 28, avgCost: '3,800만', prevention: '동의서 철저, 기록 관리' },
            { type: '투약 사고', pct: 18, avgCost: '2,200만', prevention: 'EMR 약물 상호작용 체크' },
            { type: '감염', pct: 12, avgCost: '6,500만', prevention: '멸균 프로토콜 강화' },
            { type: '기타', pct: 10, avgCost: '1,500만', prevention: '안전 매뉴얼 정비' },
          ].map((t) => (
            <div key={t.type} className="p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground">{t.type} ({t.pct}%)</span>
                <span className="text-xs font-bold text-amber-600">평균 {t.avgCost}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">예방: {t.prevention}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 9. 건강보험 심사 */}
      <Card icon={FileWarning} title="건강보험 심사 · 현지 조사 대비" color="text-sky-600">
        <div className="space-y-3">
          {[
            { item: '현지 조사 주기', desc: '개원 후 1-2년 내 1차 조사 예상', tip: '개원 초부터 청구 기준 철저 준수' },
            { item: '청구 자료 관리', desc: '진료기록·처방전·검사결과 일치 확인', tip: 'EMR 자동 검증 기능 활용' },
            { item: '주요 삭감 항목', desc: result.clinic_type + ' 물리치료·검사 과잉 청구 주의', tip: '급여기준 업데이트 상시 확인' },
            { item: '본인부담금 수납', desc: '비급여 가격표 게시 의무', tip: '비급여 진료비 투명하게 안내' },
            { item: '이의 신청 절차', desc: '삭감 통보 90일 이내 이의 신청', tip: '전문 심사 청구 대행 업체 활용' },
          ].map((i) => (
            <div key={i.item} className="p-3 border border-border rounded-lg">
              <div className="text-sm font-medium text-foreground mb-1">{i.item}</div>
              <p className="text-xs text-muted-foreground mb-1">{i.desc}</p>
              <p className="text-[10px] text-sky-600">TIP: {i.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 10. 종합 법적 리스크 점수 */}
      <Card icon={BookOpen} title="종합 법적 리스크 평가" color="text-rose-600">
        <div className="space-y-3">
          {[
            { area: '의료법 준수', score: 85, grade: 'A-', risk: '낮음' },
            { area: '개인정보보호', score: 72, grade: 'B+', risk: '보통' },
            { area: '노동법 준수', score: 78, grade: 'B+', risk: '보통' },
            { area: '소방/안전', score: 88, grade: 'A', risk: '낮음' },
            { area: '감염관리', score: 82, grade: 'A-', risk: '낮음' },
            { area: '세무/회계', score: 75, grade: 'B+', risk: '보통' },
            { area: '의료광고', score: 68, grade: 'B', risk: '주의' },
            { area: '환경/폐기물', score: 90, grade: 'A', risk: '낮음' },
          ].map((a) => (
            <div key={a.area} className="flex items-center gap-3">
              <span className="text-xs text-foreground w-24 flex-shrink-0">{a.area}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  a.score >= 85 ? 'bg-green-500' : a.score >= 75 ? 'bg-blue-500' : a.score >= 65 ? 'bg-amber-500' : 'bg-red-500'
                }`} style={{ width: `${a.score}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground w-6 text-right">{a.grade}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                a.risk === '낮음' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                a.risk === '보통' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>{a.risk}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg text-center">
          <div className="text-xs text-muted-foreground mb-1">종합 법적 리스크 점수</div>
          <div className="text-3xl font-bold text-foreground">80 <span className="text-sm font-normal text-green-600">(양호)</span></div>
          <p className="text-[10px] text-muted-foreground mt-1">의료광고 심의 + 개인정보보호 강화 시 A등급 달성 가능</p>
        </div>
      </Card>
    </>
  )
}

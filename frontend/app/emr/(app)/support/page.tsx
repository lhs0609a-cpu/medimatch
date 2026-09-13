'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowUpRight, MessageCircle, BookOpen } from 'lucide-react'
const faqs = [
  { q: '기존 환자 정보를 가져오려면 어떻게 하나요?', a: '환자 관리의 가져오기에서 CSV 또는 엑셀 파일을 선택하세요. 컬럼 매핑과 미리보기에서 이름·연락처·차트번호를 확인한 후 가져오기를 실행합니다.', href: '/emr/patients/import' },
  { q: '예약 환자의 진료를 시작하려면 어떻게 하나요?', a: '예약·접수 또는 대기실에서 도착 확인을 누르세요. 진료 시작을 누르면 예약 상태가 저장되고 환자 정보와 예약 사유가 채워진 차트 작성 화면으로 이동합니다.', href: '/emr/waiting' },
  { q: '차트 작성 후 수납은 어떻게 하나요?', a: '저장한 진료 기록의 상세 화면에서 수납을 생성할 수 있습니다. 수납·결제 메뉴에서 청구서와 결제·미수금 내역을 확인하세요.', href: '/emr/billing' },
  { q: '의원 이름과 운영 시간을 바꾸고 싶어요.', a: '의원 설정에서 기본 정보와 진료 시간을 수정하고 변경사항 저장을 누르세요. 저장한 의원 이름은 사이드바에도 반영됩니다.', href: '/emr/settings' },
  { q: '음성 입력이 작동하지 않아요.', a: '브라우저의 마이크 권한을 허용하고 입력 장치를 확인해주세요. 음성 처리에는 서버 연결과 음성 서비스 설정이 필요합니다.', href: '/emr/chart/new' },
  { q: '직원을 추가하려면 어떻게 하나요?', a: '직원 ID 관리 화면에서 이름과 역할을 입력해 추가하고, 직원별 활성 상태를 관리할 수 있습니다.', href: '/emr/seats' },
]
export default function SupportPage() {
  const [search, setSearch] = useState('')
  const items = faqs.filter(f => (f.q + f.a).includes(search))
  return <div className="mx-auto max-w-5xl space-y-8"><div className="rounded-2xl bg-slate-900 p-8 text-white"><p className="text-xs font-semibold tracking-widest text-blue-300">WE ARE HERE TO HELP</p><h1 className="mt-3 text-3xl font-bold">어떤 도움이 필요하신가요?</h1><p className="mt-3 text-sm text-slate-300">진료 준비부터 일상 업무까지, 필요한 사용 방법을 찾아보세요.</p><div className="relative mt-6"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="도움말 검색" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400" placeholder="예약, 수납, 직원 등 검색" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2">{[{ href: '/emr/setup-wizard', title: '시작 가이드', desc: '의원 환경을 설정하고 진료 준비하기', icon: BookOpen }, { href: '/contact', title: '문의하기', desc: '오류 신고와 서비스 이용 문의', icon: MessageCircle }].map(a => <Link key={a.href} href={a.href} className="card flex items-center gap-4 p-6"><a.icon className="h-6 w-6 text-blue-600" /><div className="flex-1"><h2 className="font-bold">{a.title}</h2><p className="mt-1 text-xs text-muted-foreground">{a.desc}</p></div><ArrowUpRight className="h-4 w-4" /></Link>)}</div>
    <section><h2 className="mb-4 text-lg font-bold">자주 묻는 질문</h2><div className="space-y-3">{items.map(f => <details key={f.q} className="card p-5"><summary className="cursor-pointer text-sm font-semibold">{f.q}</summary><p className="mt-4 text-sm leading-7 text-muted-foreground">{f.a}</p><Link href={f.href} className="mt-3 inline-block text-sm text-blue-600">해당 메뉴 열기 →</Link></details>)}{items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다. 문의하기에서 도움을 요청해주세요.</p>}</div></section>
  </div>
}

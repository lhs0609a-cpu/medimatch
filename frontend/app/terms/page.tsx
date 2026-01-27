'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">이용약관</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="card p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">이용약관</h1>
          <p className="text-muted-foreground mb-8">최종 수정일: 2025년 1월 1일</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            {/* TODO: 법인 설립 후 실제 회사명으로 교체 필요 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제1조 (목적)</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 약관은 [회사명](이하 "회사")이 제공하는 메디플라톤 서비스(이하 "서비스")의
                이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  ⚠️ 서비스 출시 전 법인 정보 확인 필요
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제2조 (정의)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>"서비스"란 회사가 제공하는 개원 시뮬레이션, 개원지 탐지, 약국 매칭 등 의료 개원 관련 플랫폼 서비스를 말합니다.</li>
                  <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                  <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 말합니다.</li>
                  <li>"비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제3조 (약관의 효력 및 변경)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                  <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                  <li>변경된 약관은 적용일자 7일 전부터 서비스 화면에 공지됩니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제4조 (서비스의 제공)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 다음과 같은 서비스를 제공합니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>OpenSim: AI 기반 개원 시뮬레이션 서비스</li>
                  <li>SalesScanner: 실시간 개원 예정지 탐지 서비스</li>
                  <li>PharmMatch: 익명 약국 매물 매칭 서비스</li>
                  <li>지도 기반 의료기관 정보 제공 서비스</li>
                  <li>파트너사 연결 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제5조 (회원가입)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
                  <li>회사는 전항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</li>
                  <li>등록 신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제6조 (회원의 의무)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>신청 또는 변경 시 허위 내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제7조 (서비스 이용료)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>서비스의 기본 이용은 무료입니다.</li>
                  <li>유료 서비스의 이용료는 서비스 내에 별도로 표시됩니다.</li>
                  <li>회사는 유료 서비스 이용료를 변경할 수 있으며, 변경 시 7일 전에 공지합니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제8조 (환불 정책)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>결제일로부터 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.</li>
                  <li>시뮬레이션 리포트 등 이미 제공된 서비스는 환불 대상에서 제외됩니다.</li>
                  <li>구독 서비스의 경우 해지 요청 후 현재 결제 주기가 끝날 때까지 서비스를 이용할 수 있습니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제9조 (면책조항)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                  <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                  <li>시뮬레이션 결과 등 서비스에서 제공하는 정보는 참고용이며, 실제 개원 결정에 따른 결과에 대해 회사는 책임을 지지 않습니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제10조 (분쟁해결)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>회사와 이용자 간에 제기된 소송은 대한민국 법을 적용합니다.</li>
                  <li>회사와 이용자 간에 발생한 분쟁에 관한 소송은 서울중앙지방법원을 관할 법원으로 합니다.</li>
                </ol>
              </div>
            </section>

            <section className="pt-8 border-t border-border">
              <p className="text-muted-foreground text-sm">
                본 약관은 2025년 1월 1일부터 적용됩니다.
              </p>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/privacy" className="btn-secondary">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="btn-ghost">
            문의하기
          </Link>
        </div>
      </main>
    </div>
  )
}

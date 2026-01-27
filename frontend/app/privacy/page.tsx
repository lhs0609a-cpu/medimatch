'use client'

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
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
                  <Shield className="w-4 h-4 text-background" />
                </div>
                <span className="text-lg font-semibold text-foreground">개인정보처리방침</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="card p-8 md:p-12">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">개인정보처리방침</h1>
          <p className="text-muted-foreground mb-8">최종 수정일: 2025년 1월 1일</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                주식회사 메디플라톤(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고
                개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제1조 (개인정보의 수집 및 이용 목적)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li><strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지</li>
                  <li><strong>서비스 제공:</strong> 개원 시뮬레이션, 개원지 탐지, 약국 매칭, 파트너 연결 등 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공</li>
                  <li><strong>마케팅 및 광고:</strong> 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
                  <li><strong>결제 처리:</strong> 유료 서비스 이용에 따른 요금 결제·정산</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제2조 (수집하는 개인정보 항목)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">1. 필수 수집 항목</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>이메일 주소</li>
                    <li>비밀번호</li>
                    <li>이름</li>
                    <li>역할(의사, 약사, 영업사원, 건물주, 파트너사)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">2. 선택 수집 항목</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>전화번호</li>
                    <li>주소</li>
                    <li>사업자등록번호(파트너사)</li>
                    <li>전문의 자격정보(의사)</li>
                    <li>약사 면허번호(약사)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">3. 자동 수집 항목</h3>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>IP 주소</li>
                    <li>쿠키</li>
                    <li>서비스 이용 기록</li>
                    <li>접속 로그</li>
                    <li>기기 정보</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제3조 (개인정보의 보유 및 이용기간)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계법령에 따라 보존할 필요가 있는 경우 해당 기간)</li>
                  <li>재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료 시까지</li>
                  <li>전자상거래에서의 계약·청약철회, 대금결제, 재화 등 공급기록: 5년</li>
                  <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                  <li>접속에 관한 로그기록: 3개월</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제4조 (개인정보의 제3자 제공)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>서비스 제공에 따른 요금정산을 위하여 필요한 경우</li>
                  <li>법령의 규정에 의한 경우</li>
                  <li>약국 매칭 등 서비스 특성상 상호 정보 공개에 동의한 경우</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제5조 (개인정보처리의 위탁)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="border border-border p-3 text-left">수탁업체</th>
                        <th className="border border-border p-3 text-left">위탁업무</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3">토스페이먼츠(주)</td>
                        <td className="border border-border p-3">결제 처리</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3">Amazon Web Services</td>
                        <td className="border border-border p-3">클라우드 서비스 제공</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3">(주)카카오</td>
                        <td className="border border-border p-3">지도 API, 소셜 로그인</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>개인정보 열람 요구</li>
                  <li>오류 등이 있을 경우 정정 요구</li>
                  <li>삭제 요구</li>
                  <li>처리정지 요구</li>
                </ol>
                <p className="mt-4">
                  위 권리 행사는 회사에 대해 서면, 전화, 이메일 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제7조 (개인정보의 파기)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
                  <li>전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                  <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제8조 (개인정보의 안전성 확보조치)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제9조 (쿠키의 사용)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
                  <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나 거부할 수 있습니다.</li>
                  <li>쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제10조 (개인정보 보호책임자)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                {/* TODO: 실제 개인정보 보호책임자 정보로 교체 필요 (법적 필수사항) */}
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-800 dark:text-amber-200 text-sm mb-2 font-medium">
                    ⚠️ 서비스 출시 전 실제 정보로 교체 필요
                  </p>
                  <p><strong>개인정보 보호책임자</strong></p>
                  <p>성명: [담당자 성명 입력]</p>
                  <p>직책: [직책 입력]</p>
                  <p>이메일: [이메일 입력]</p>
                  <p>전화: [연락처 입력]</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">제11조 (권익침해 구제방법)</h2>
              <div className="text-muted-foreground leading-relaxed space-y-2">
                <p>이용자는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
                <ul className="list-disc list-inside space-y-1 pl-4 mt-4">
                  <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
                  <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
                  <li>대검찰청: 1301 (www.spo.go.kr)</li>
                  <li>경찰청: 182 (ecrm.cyber.go.kr)</li>
                </ul>
              </div>
            </section>

            <section className="pt-8 border-t border-border">
              <p className="text-muted-foreground text-sm">
                본 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
              </p>
            </section>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/terms" className="btn-secondary">
            이용약관
          </Link>
          <Link href="/contact" className="btn-ghost">
            문의하기
          </Link>
        </div>
      </main>
    </div>
  )
}

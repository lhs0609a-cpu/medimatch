'use client'

import { useState } from 'react'
import {
  Settings,
  Building2,
  User,
  Stethoscope,
  Bell,
  Shield,
  Database,
  Download,
  Printer,
  Palette,
  Mic,
  CreditCard,
  ChevronRight,
  Check,
  X,
  Upload,
  HelpCircle,
  ExternalLink,
  Key,
  Globe,
  Clock,
  FileText,
  Pill,
  Users,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  Lock,
  Save,
} from 'lucide-react'

type SettingsTab = 'clinic' | 'account' | 'notification' | 'ai' | 'security' | 'data' | 'subscription'

const tabs: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
  { key: 'clinic', label: '의원 정보', icon: Building2 },
  { key: 'account', label: '계정 설정', icon: User },
  { key: 'ai', label: 'AI 설정', icon: Mic },
  { key: 'notification', label: '알림 설정', icon: Bell },
  { key: 'security', label: '보안', icon: Shield },
  { key: 'data', label: '데이터 관리', icon: Database },
  { key: 'subscription', label: '구독 관리', icon: CreditCard },
]

export default function EMRSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('clinic')

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">EMR 시스템 설정을 관리합니다</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* 사이드 탭 */}
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 의원 정보 */}
          {activeTab === 'clinic' && (
            <>
              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">의원 기본 정보</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">의원 이름 *</label>
                    <input className="input" defaultValue="메디매치 내과의원" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">요양기관번호</label>
                    <input className="input" defaultValue="12345678" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">진료과목</label>
                    <select className="select">
                      <option>내과</option>
                      <option>가정의학과</option>
                      <option>소아청소년과</option>
                      <option>피부과</option>
                      <option>정형외과</option>
                      <option>이비인후과</option>
                      <option>안과</option>
                      <option>신경과</option>
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">대표 전화번호</label>
                    <input className="input" defaultValue="02-1234-5678" />
                  </div>
                </div>

                <div>
                  <label className="label mb-1.5 block">주소</label>
                  <input className="input" defaultValue="서울시 강남구 테헤란로 123, 4층" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">팩스 번호</label>
                    <input className="input" placeholder="02-1234-5679" />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">이메일</label>
                    <input className="input" defaultValue="info@medimatch-clinic.co.kr" />
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">진료 시간 설정</h3>

                <div className="space-y-3">
                  {[
                    { day: '월요일', open: '09:00', close: '18:00', lunch: '12:00-14:00', active: true },
                    { day: '화요일', open: '09:00', close: '18:00', lunch: '12:00-14:00', active: true },
                    { day: '수요일', open: '09:00', close: '18:00', lunch: '12:00-14:00', active: true },
                    { day: '목요일', open: '09:00', close: '18:00', lunch: '12:00-14:00', active: true },
                    { day: '금요일', open: '09:00', close: '18:00', lunch: '12:00-14:00', active: true },
                    { day: '토요일', open: '09:00', close: '13:00', lunch: '', active: true },
                    { day: '일요일', open: '', close: '', lunch: '', active: false },
                  ].map((schedule, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${schedule.active ? 'bg-secondary/30' : 'bg-secondary/10 opacity-50'}`}>
                      <div className="w-16 text-sm font-semibold">{schedule.day}</div>
                      <div className="flex items-center gap-2 flex-1">
                        {schedule.active ? (
                          <>
                            <input className="input text-sm w-24" defaultValue={schedule.open} type="time" />
                            <span className="text-muted-foreground">~</span>
                            <input className="input text-sm w-24" defaultValue={schedule.close} type="time" />
                            {schedule.lunch && (
                              <span className="text-xs text-muted-foreground ml-2">점심: {schedule.lunch}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">휴진</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">
                  <Save className="w-4 h-4" />
                  저장하기
                </button>
              </div>
            </>
          )}

          {/* 계정 설정 */}
          {activeTab === 'account' && (
            <div className="card p-6 space-y-5">
              <h3 className="font-bold text-lg">계정 정보</h3>

              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                <div className="avatar avatar-xl bg-primary/10 text-primary">
                  <span className="text-xl font-bold">김</span>
                </div>
                <div>
                  <div className="font-bold">김원장</div>
                  <div className="text-sm text-muted-foreground">doctor@medimatch.kr</div>
                </div>
                <button className="btn-outline btn-sm ml-auto">사진 변경</button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">이름</label>
                  <input className="input" defaultValue="김원장" />
                </div>
                <div>
                  <label className="label mb-1.5 block">면허번호</label>
                  <input className="input" defaultValue="12345" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">이메일</label>
                  <input className="input" defaultValue="doctor@medimatch.kr" />
                </div>
                <div>
                  <label className="label mb-1.5 block">연락처</label>
                  <input className="input" defaultValue="010-1234-5678" />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button className="btn-primary">
                  <Save className="w-4 h-4" />
                  저장하기
                </button>
              </div>
            </div>
          )}

          {/* AI 설정 */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">AI 음성 차트 설정</h3>

                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold text-sm">음성 인식 자동 시작</div>
                      <div className="text-xs text-muted-foreground">진료 시작 시 마이크 자동 활성화</div>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-sm">음성 피드백</div>
                      <div className="text-xs text-muted-foreground">인식 완료 시 알림음 재생</div>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-secondary rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm" />
                  </button>
                </div>

                <div>
                  <label className="label mb-1.5 block">AI 모델 언어</label>
                  <select className="select">
                    <option>한국어 (의료 전문)</option>
                    <option>한국어 (일반)</option>
                    <option>English (Medical)</option>
                  </select>
                </div>

                <div>
                  <label className="label mb-1.5 block">처방 추천 민감도</label>
                  <select className="select">
                    <option>높음 (더 많은 추천)</option>
                    <option>보통 (균형)</option>
                    <option>낮음 (정확한 것만)</option>
                  </select>
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">삭감 방어 AI</h3>

                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="font-semibold text-sm">실시간 삭감 체크</div>
                      <div className="text-xs text-muted-foreground">차트 작성 시 실시간 위험도 분석</div>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
                  </button>
                </div>

                <div>
                  <label className="label mb-1.5 block">위험 임계값</label>
                  <select className="select">
                    <option>10% 이상이면 경고</option>
                    <option>20% 이상이면 경고</option>
                    <option>30% 이상이면 경고</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notification' && (
            <div className="card p-6 space-y-5">
              <h3 className="font-bold text-lg">알림 설정</h3>

              {[
                { icon: Bell, label: '예약 알림', desc: '환자 예약 확인/변경 알림', enabled: true },
                { icon: Pill, label: '약국 연동 알림', desc: '조제 완료/DUR 경고 알림', enabled: true },
                { icon: Shield, label: '삭감 위험 알림', desc: 'AI 삭감 위험 감지 시 알림', enabled: true },
                { icon: CreditCard, label: '결제 알림', desc: '수납 완료/미수금 알림', enabled: false },
                { icon: Users, label: '환자 리콜 알림', desc: '미방문 환자 리콜 시점 알림', enabled: true },
                { icon: Monitor, label: '시스템 알림', desc: '업데이트, 장애 알림', enabled: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                  <button className={`w-12 h-6 rounded-full relative ${item.enabled ? 'bg-primary' : 'bg-secondary'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm ${item.enabled ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 보안 */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">비밀번호 변경</h3>
                <div>
                  <label className="label mb-1.5 block">현재 비밀번호</label>
                  <input type="password" className="input" />
                </div>
                <div>
                  <label className="label mb-1.5 block">새 비밀번호</label>
                  <input type="password" className="input" />
                </div>
                <div>
                  <label className="label mb-1.5 block">비밀번호 확인</label>
                  <input type="password" className="input" />
                </div>
                <button className="btn-primary btn-sm">비밀번호 변경</button>
              </div>

              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">접근 로그</h3>
                <div className="text-sm text-muted-foreground">최근 로그인 이력을 확인합니다.</div>
                <div className="space-y-2">
                  {[
                    { time: '2025-02-21 09:15', device: 'Chrome / Windows', ip: '192.168.1.100', status: '성공' },
                    { time: '2025-02-20 18:30', device: 'Safari / iPhone', ip: '10.0.0.25', status: '성공' },
                    { time: '2025-02-20 08:45', device: 'Chrome / Windows', ip: '192.168.1.100', status: '성공' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl text-sm">
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground w-32">{log.time}</span>
                      <span className="flex-1">{log.device}</span>
                      <span className="text-xs text-muted-foreground">{log.ip}</span>
                      <span className="badge-success text-2xs">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 데이터 관리 */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">데이터 내보내기</h3>
                <p className="text-sm text-muted-foreground">
                  원장님의 데이터는 원장님의 것입니다. 언제든 전체 데이터를 내보낼 수 있습니다.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <button className="p-4 bg-secondary/30 rounded-xl text-left hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">전체 데이터 Export</span>
                    </div>
                    <div className="text-xs text-muted-foreground">환자, 차트, 처방, 청구 전체 데이터를 CSV로 내보냅니다</div>
                  </button>

                  <button className="p-4 bg-secondary/30 rounded-xl text-left hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-sm">HL7 FHIR Export</span>
                    </div>
                    <div className="text-xs text-muted-foreground">국제 표준 형식(HL7 FHIR)으로 내보냅니다</div>
                  </button>
                </div>
              </div>

              <div className="card p-6 space-y-5">
                <h3 className="font-bold text-lg">데이터 가져오기</h3>
                <p className="text-sm text-muted-foreground">
                  타 EMR에서 데이터를 가져올 수 있습니다. 전담 엔지니어가 무료로 지원합니다.
                </p>

                <div className="p-4 border-2 border-dashed border-border rounded-xl text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm font-semibold">파일을 드래그하거나 클릭하세요</div>
                  <div className="text-xs text-muted-foreground mt-1">CSV, XML, HL7 형식 지원</div>
                </div>
              </div>

              <div className="card p-6 space-y-5 border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-lg text-red-500">위험 영역</h3>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div>
                    <div className="font-semibold text-sm">계정 삭제</div>
                    <div className="text-xs text-muted-foreground">모든 데이터가 영구적으로 삭제됩니다</div>
                  </div>
                  <button className="btn-outline btn-sm text-red-500 border-red-300 hover:bg-red-50">
                    계정 삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 구독 관리 */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="badge-primary mb-2">현재 플랜</div>
                    <h3 className="text-2xl font-bold">Clinic</h3>
                    <div className="text-muted-foreground">월 19만원 · 무료 체험 기간</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">무료 체험 남은 기간</div>
                    <div className="text-3xl font-bold text-primary">67<span className="text-lg">일</span></div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">AI 음성 차트</div>
                    <div className="font-semibold">무제한</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">약국 브릿지</div>
                    <div className="font-semibold text-emerald-500">활성</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">삭감 방어 AI</div>
                    <div className="font-semibold text-emerald-500">활성</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">전담 매니저</div>
                    <div className="font-semibold text-emerald-500">배정됨</div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4">결제 정보</h3>
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">아직 결제 수단이 등록되지 않았습니다</div>
                    <div className="text-xs text-muted-foreground">무료 체험 종료 전에 등록해주세요</div>
                  </div>
                  <button className="btn-primary btn-sm ml-auto">등록하기</button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4">플랜 변경</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: 'Starter', price: '무료', desc: '1인 의원 체험', current: false },
                    { name: 'Clinic', price: '19만원/월', desc: '1~3인 의원', current: true },
                    { name: 'Clinic Pro', price: '29만원/월', desc: '4인+ 의원', current: false },
                  ].map((plan) => (
                    <div key={plan.name} className={`p-4 rounded-xl border ${plan.current ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <div className="font-bold text-sm">{plan.name}</div>
                      <div className="text-lg font-bold mt-1">{plan.price}</div>
                      <div className="text-xs text-muted-foreground">{plan.desc}</div>
                      {plan.current ? (
                        <div className="badge-primary text-2xs mt-3">현재 플랜</div>
                      ) : (
                        <button className="btn-outline btn-sm w-full mt-3 text-xs">변경하기</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

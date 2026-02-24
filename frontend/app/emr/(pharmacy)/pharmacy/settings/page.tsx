'use client'

import { useState } from 'react'
import {
  Settings,
  Building2,
  User,
  Bell,
  Shield,
  Database,
  CreditCard,
  Truck,
  Phone,
  Mail,
  Clock,
  MapPin,
  FileText,
  Save,
  Plus,
  X,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  Link,
  Zap,
  RefreshCw,
  Download,
  Upload,
  ChevronRight,
  Pill,
  Stethoscope,
  Key,
  Globe,
  Smartphone,
  Monitor,
  Crown,
  Sparkles,
  Star,
} from 'lucide-react'

/* ─── 타입 ─── */
type SettingsTab = 'pharmacy' | 'clinics' | 'wholesalers' | 'notifications' | 'security' | 'data' | 'subscription'

/* ─── 더미 데이터 ─── */
const pharmacyInfo = {
  name: '메디매치 온누리약국',
  owner: '박약사',
  licenseNo: '서울-약-12345',
  bizNo: '123-45-67890',
  phone: '02-1234-5678',
  fax: '02-1234-5679',
  email: 'pharmacy@medimatch.kr',
  address: '서울시 강남구 테헤란로 123 1층',
  hours: {
    weekday: { open: '09:00', close: '19:00' },
    saturday: { open: '09:00', close: '14:00' },
    sunday: { open: '', close: '' },
  },
}

const linkedClinics = [
  { id: 'C001', name: '메디매치내과', doctor: '김원장', phone: '02-1111-2222', status: 'connected', since: '2023-06-15', todayRx: 12 },
  { id: 'C002', name: '하나이비인후과', doctor: '이원장', phone: '02-3333-4444', status: 'connected', since: '2023-08-20', todayRx: 8 },
  { id: 'C003', name: '강남정형외과', doctor: '박원장', phone: '02-5555-6666', status: 'connected', since: '2023-11-01', todayRx: 5 },
]

const wholesalerSettings = [
  { id: 'W001', name: '백제약품', account: 'BJ-2024-001', contact: '010-9876-5432', autoOrder: true, priority: 1, lastOrder: '오늘 10:30' },
  { id: 'W002', name: '지오영', account: 'GY-2024-045', contact: '010-8765-4321', autoOrder: true, priority: 2, lastOrder: '어제 15:20' },
  { id: 'W003', name: '한국유나이티드', account: 'KU-2024-012', contact: '010-7654-3210', autoOrder: false, priority: 3, lastOrder: '3일 전' },
]

const notificationSettings = [
  { key: 'rx_received', label: '처방전 수신', description: '새 처방전이 도착하면 알림', enabled: true, sound: true },
  { key: 'dur_alert', label: 'DUR 알림', description: 'DUR 점검 결과 주의사항 발생 시', enabled: true, sound: true },
  { key: 'inventory_low', label: '재고 부족 알림', description: '안전재고 이하로 감소 시', enabled: true, sound: false },
  { key: 'order_status', label: '발주 상태', description: '도매상 발주 처리 상태 변경 시', enabled: true, sound: false },
  { key: 'clinic_message', label: '의원 메시지', description: '연동 의원에서 메시지 수신 시', enabled: true, sound: true },
  { key: 'system_update', label: '시스템 업데이트', description: '수가 변경, 시스템 점검 등', enabled: false, sound: false },
]

const accessLogs = [
  { time: '14:05', user: '박약사', action: '처방전 조제 완료', ip: '192.168.1.100', device: 'PC' },
  { time: '13:58', user: '박약사', action: 'DUR 점검 확인', ip: '192.168.1.100', device: 'PC' },
  { time: '13:45', user: '김약사', action: '재고 수정 (이부프로펜)', ip: '192.168.1.101', device: '태블릿' },
  { time: '13:20', user: '박약사', action: '처방전 접수', ip: '192.168.1.100', device: 'PC' },
  { time: '12:55', user: '박약사', action: '로그인', ip: '192.168.1.100', device: 'PC' },
]

export default function PharmacySettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('pharmacy')
  const [notifications, setNotifications] = useState(notificationSettings)

  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'pharmacy', label: '약국 정보', icon: Building2 },
    { key: 'clinics', label: '연동 의원', icon: Stethoscope },
    { key: 'wholesalers', label: '도매상 관리', icon: Truck },
    { key: 'notifications', label: '알림 설정', icon: Bell },
    { key: 'security', label: '보안', icon: Shield },
    { key: 'data', label: '데이터', icon: Database },
    { key: 'subscription', label: '구독/결제', icon: CreditCard },
  ]

  const toggleNotification = (key: string, field: 'enabled' | 'sound') => {
    setNotifications(prev =>
      prev.map(n => n.key === key ? { ...n, [field]: !n[field] } : n)
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">약국 정보, 연동, 알림, 보안 설정</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드 탭 */}
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
          {/* 약국 정보 */}
          {activeTab === 'pharmacy' && (
            <>
              <div className="card p-5">
                <h3 className="font-semibold mb-4">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">약국명</label>
                    <input type="text" defaultValue={pharmacyInfo.name} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">대표약사</label>
                    <input type="text" defaultValue={pharmacyInfo.owner} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">약국허가번호</label>
                    <input type="text" defaultValue={pharmacyInfo.licenseNo} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">사업자번호</label>
                    <input type="text" defaultValue={pharmacyInfo.bizNo} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">전화번호</label>
                    <input type="text" defaultValue={pharmacyInfo.phone} className="input mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">팩스번호</label>
                    <input type="text" defaultValue={pharmacyInfo.fax} className="input mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">이메일</label>
                    <input type="email" defaultValue={pharmacyInfo.email} className="input mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">주소</label>
                    <input type="text" defaultValue={pharmacyInfo.address} className="input mt-1" />
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">운영 시간</h3>
                <div className="space-y-3">
                  {[
                    { label: '평일', ...pharmacyInfo.hours.weekday },
                    { label: '토요일', ...pharmacyInfo.hours.saturday },
                    { label: '일요일/공휴일', ...pharmacyInfo.hours.sunday },
                  ].map((day, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-28">{day.label}</span>
                      {day.open ? (
                        <div className="flex items-center gap-2">
                          <input type="time" defaultValue={day.open} className="input py-1.5 text-sm w-32" />
                          <span className="text-muted-foreground">~</span>
                          <input type="time" defaultValue={day.close} className="input py-1.5 text-sm w-32" />
                        </div>
                      ) : (
                        <span className="text-sm text-red-500 font-medium">휴무</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-sm" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                  <Save className="w-3.5 h-3.5" /> 저장
                </button>
              </div>
            </>
          )}

          {/* 연동 의원 */}
          {activeTab === 'clinics' && (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">연동 의원 관리</h3>
                  <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                    <Plus className="w-3 h-3" /> 의원 연동 요청
                  </button>
                </div>
                <div className="space-y-3">
                  {linkedClinics.map(clinic => (
                    <div key={clinic.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{clinic.name}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-2xs font-semibold text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> 연동중
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{clinic.doctor}</span>
                          <span>{clinic.phone}</span>
                          <span>연동일: {clinic.since}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-purple-600">{clinic.todayRx}</div>
                        <div className="text-2xs text-muted-foreground">오늘 처방</div>
                      </div>
                      <button className="btn-icon flex-shrink-0">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-3">연동 설정</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">자동 처방전 접수</span>
                      <p className="text-2xs text-muted-foreground mt-0.5">연동 의원의 처방전을 자동으로 접수합니다</p>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-purple-500 relative cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 right-1 shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">조제 완료 자동 알림</span>
                      <p className="text-2xs text-muted-foreground mt-0.5">조제 완료 시 의원에 자동 알림 전송</p>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-purple-500 relative cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 right-1 shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">DUR 결과 공유</span>
                      <p className="text-2xs text-muted-foreground mt-0.5">DUR 점검 결과를 처방의에게 자동 공유</p>
                    </div>
                    <div className="w-10 h-6 rounded-full bg-secondary relative cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-1 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 도매상 관리 */}
          {activeTab === 'wholesalers' && (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">도매상 관리</h3>
                  <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                    <Plus className="w-3 h-3" /> 도매상 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {wholesalerSettings.map((ws, i) => (
                    <div key={ws.id} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{ws.name}</span>
                          {ws.priority === 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-2xs font-bold text-purple-600 dark:bg-purple-900/30">기본</span>
                          )}
                          {ws.autoOrder && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-2xs font-bold text-emerald-600 dark:bg-emerald-900/30">자동발주</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>계정: {ws.account}</span>
                          <span>담당: {ws.contact}</span>
                          <span>최근: {ws.lastOrder}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">우선순위 {ws.priority}</span>
                        <button className="p-1.5 rounded-lg hover:bg-secondary"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-3">자동 발주 규칙</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">발주 기준</label>
                      <select className="input mt-1">
                        <option>안전재고 도달 시</option>
                        <option>안전재고 50% 도달 시</option>
                        <option>수동 발주만</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">발주 수량 기준</label>
                      <select className="input mt-1">
                        <option>최대재고까지 채우기</option>
                        <option>1개월치 발주</option>
                        <option>2주치 발주</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">발주 확인</label>
                      <select className="input mt-1">
                        <option>자동 발주 (확인 불필요)</option>
                        <option>발주 전 승인 필요</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">마약류 발주</label>
                      <select className="input mt-1">
                        <option>수동 발주만 (자동 제외)</option>
                        <option>자동 포함 (승인 필요)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                      <Save className="w-3 h-3" /> 저장
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4">알림 설정</h3>
              <div className="space-y-1">
                {notifications.map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/30 transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{n.label}</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">{n.description}</div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-muted-foreground">알림</span>
                        <button
                          onClick={() => toggleNotification(n.key, 'enabled')}
                          className={`w-10 h-6 rounded-full relative transition-colors ${n.enabled ? 'bg-purple-500' : 'bg-secondary'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${n.enabled ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-muted-foreground">소리</span>
                        <button
                          onClick={() => toggleNotification(n.key, 'sound')}
                          className={`w-10 h-6 rounded-full relative transition-colors ${n.sound ? 'bg-purple-500' : 'bg-secondary'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${n.sound ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 보안 */}
          {activeTab === 'security' && (
            <>
              <div className="card p-5">
                <h3 className="font-semibold mb-4">계정 보안</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">현재 비밀번호</label>
                      <input type="password" className="input mt-1" placeholder="현재 비밀번호" />
                    </div>
                    <div />
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">새 비밀번호</label>
                      <input type="password" className="input mt-1" placeholder="새 비밀번호" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">비밀번호 확인</label>
                      <input type="password" className="input mt-1" placeholder="비밀번호 확인" />
                    </div>
                  </div>
                  <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                    <Key className="w-3 h-3" /> 비밀번호 변경
                  </button>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">접근 로그</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">시간</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">사용자</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">활동</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">IP</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">기기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {accessLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-secondary/30">
                          <td className="px-3 py-2.5 text-muted-foreground">{log.time}</td>
                          <td className="px-3 py-2.5 font-medium">{log.user}</td>
                          <td className="px-3 py-2.5">{log.action}</td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">{log.ip}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-secondary text-2xs">{log.device}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 데이터 */}
          {activeTab === 'data' && (
            <>
              <div className="card p-5">
                <h3 className="font-semibold mb-4">데이터 내보내기</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-200 dark:hover:border-purple-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Download className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">처방전/조제 내역</div>
                      <div className="text-2xs text-muted-foreground">CSV 형식으로 내보내기</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-200 dark:hover:border-purple-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">재고 현황</div>
                      <div className="text-2xs text-muted-foreground">Excel 형식으로 내보내기</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-200 dark:hover:border-purple-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">환자 기록</div>
                      <div className="text-2xs text-muted-foreground">HL7 FHIR 형식</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple-200 dark:hover:border-purple-800 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Download className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">경영 분석 리포트</div>
                      <div className="text-2xs text-muted-foreground">PDF 형식으로 내보내기</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">데이터 가져오기</h3>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-purple-300 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">파일을 드래그하거나 클릭하세요</p>
                  <p className="text-2xs text-muted-foreground mt-1">CSV, Excel, HL7 FHIR 형식 지원</p>
                </div>
              </div>

              <div className="card p-5 border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> 위험 영역
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
                </p>
                <div className="flex gap-3">
                  <button className="btn-sm text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30">
                    전체 데이터 초기화
                  </button>
                  <button className="btn-sm text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30">
                    계정 삭제
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 구독/결제 */}
          {activeTab === 'subscription' && (
            <>
              <div className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Pharmacy 플랜</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-2xs font-bold text-purple-600">현재 플랜</span>
                    </div>
                    <p className="text-sm text-muted-foreground">무료 체험 중 · 67일 남음</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">무료 체험 기간</span>
                    <span className="text-sm font-bold text-purple-600">67일 남음</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-purple-200 dark:bg-purple-800">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: '25%' }} />
                  </div>
                  <p className="text-2xs text-muted-foreground mt-2">2024.04.01까지 모든 기능을 무료로 이용하실 수 있습니다</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-purple-500 relative">
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-purple-500 text-white text-2xs font-bold rounded">현재 플랜</div>
                    <h4 className="font-bold text-lg mt-1">Pharmacy</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">₩9</span>
                      <span className="text-sm text-muted-foreground">만원/월</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 실시간 처방전 수신</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> DUR 자동 점검</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 재고 자동 관리</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> AI 복약지도 생성</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 경영분석 대시보드</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 의원 3곳 연동</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-lg">Pharmacy Pro</h4>
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">₩15</span>
                      <span className="text-sm text-muted-foreground">만원/월</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> Pharmacy 모든 기능</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 도매상 연동 자동발주</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 다점포 통합 관리</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 의원 무제한 연동</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> 전담 고객지원</li>
                      <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-500" /> API 연동 제공</li>
                    </ul>
                    <button className="w-full btn-sm text-xs mt-3" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                      업그레이드
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">결제 수단</h3>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">등록된 결제 수단 없음</div>
                    <div className="text-2xs text-muted-foreground">무료 체험 종료 전 결제 수단을 등록해주세요</div>
                  </div>
                  <button className="btn-sm text-xs" style={{ backgroundColor: 'rgb(168 85 247)', color: 'white' }}>
                    <Plus className="w-3 h-3" /> 등록
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

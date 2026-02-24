'use client'

import { useState } from 'react'
import {
  QrCode,
  Smartphone,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Printer,
  Copy,
  Eye,
  Settings,
  RefreshCw,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Bell,
  MessageSquare,
  MapPin,
  Star,
  ExternalLink,
  Palette,
  Globe,
  X,
  Link,
} from 'lucide-react'

/* ─── 더미 데이터 ─── */
const bookingStats = {
  totalBookings: 1842,
  thisMonth: 186,
  qrScans: 423,
  conversionRate: 44.0,
  mobileRatio: 72.4,
  avgBookingTime: '42초',
}

const recentBookings = [
  { id: 'BK001', name: '김*수', time: '10:30', date: '내일', type: '재진', method: 'QR', status: 'confirmed' as const },
  { id: 'BK002', name: '이*경', time: '11:00', date: '내일', type: '재진', method: 'QR', status: 'confirmed' as const },
  { id: 'BK003', name: '박*호', time: '14:00', date: '모레', type: '초진', method: '링크', status: 'pending' as const },
  { id: 'BK004', name: '강*원', time: '15:30', date: '모레', type: '초진', method: 'QR', status: 'confirmed' as const },
  { id: 'BK005', name: '정*현', time: '09:30', date: '1/25', type: '재진', method: '링크', status: 'pending' as const },
]

const hourlyDistribution = [
  { hour: '09시', count: 28 },
  { hour: '10시', count: 35 },
  { hour: '11시', count: 31 },
  { hour: '12시', count: 8 },
  { hour: '14시', count: 32 },
  { hour: '15시', count: 38 },
  { hour: '16시', count: 25 },
  { hour: '17시', count: 15 },
]

const maxHourly = Math.max(...hourlyDistribution.map(h => h.count))

const qrPlacements = [
  { location: '접수대 카운터', type: '스탠드형 QR', scans: 156, status: 'active' as const },
  { location: '대기실 벽면', type: '포스터형 QR', scans: 98, status: 'active' as const },
  { location: '진료실 입구', type: '안내판 QR', scans: 67, status: 'active' as const },
  { location: '주차장 엘리베이터', type: '스티커형 QR', scans: 52, status: 'active' as const },
  { location: '카카오톡 메시지', type: '디지털 QR', scans: 50, status: 'active' as const },
]

export default function SmartBookingPage() {
  const [activeTab, setActiveTab] = useState<'qr' | 'stats' | 'settings'>('qr')
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">스마트 예약 (QR)</h1>
            <p className="text-sm text-muted-foreground">QR 스캔 → 모바일 예약 · 앱 설치 불필요</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="btn-sm text-xs bg-violet-600 text-white hover:bg-violet-700">
            <Eye className="w-3.5 h-3.5" /> 환자 화면 미리보기
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+24%</span>
          </div>
          <div className="text-2xl font-bold">{bookingStats.thisMonth}건</div>
          <div className="text-xs text-muted-foreground">이번 달 예약</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <QrCode className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{bookingStats.qrScans}회</div>
          <div className="text-xs text-muted-foreground">QR 스캔</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold">{bookingStats.conversionRate}%</div>
          <div className="text-xs text-muted-foreground">스캔→예약 전환율</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Smartphone className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold">{bookingStats.avgBookingTime}</div>
          <div className="text-xs text-muted-foreground">평균 예약 소요</div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { key: 'qr', label: 'QR 관리', icon: QrCode },
          { key: 'stats', label: '예약 현황', icon: BarChart3 },
          { key: 'settings', label: '설정', icon: Settings },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ QR 관리 ═══ */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* QR 코드 */}
          <div className="card p-6 text-center">
            <h2 className="font-bold text-sm mb-4">예약 QR 코드</h2>
            <div className="w-52 h-52 mx-auto bg-white rounded-2xl border-2 border-border p-4 mb-4 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center relative">
                <QrCode className="w-24 h-24 text-white" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <span className="text-xs font-black text-violet-600">M</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              이 QR을 스캔하면 환자가 모바일에서 바로 예약할 수 있습니다
            </p>
            <div className="flex items-center justify-center gap-2">
              <button className="btn-sm text-xs bg-violet-600 text-white hover:bg-violet-700">
                <Download className="w-3 h-3" /> 다운로드
              </button>
              <button className="btn-sm text-xs bg-secondary text-foreground">
                <Printer className="w-3 h-3" /> 포스터 인쇄
              </button>
              <button className="btn-sm text-xs bg-secondary text-foreground">
                <Copy className="w-3 h-3" /> 링크 복사
              </button>
            </div>

            <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Link className="w-3 h-3" /> 예약 링크
              </div>
              <div className="flex items-center gap-2">
                <code className="text-2xs bg-secondary px-2 py-1 rounded flex-1 truncate">
                  https://book.medimatch.kr/clinic/medimatch-gangnam
                </code>
                <button className="p-1 rounded hover:bg-secondary">
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* QR 배치 현황 */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4">QR 배치 위치별 스캔 현황</h2>
              <div className="space-y-3">
                {qrPlacements.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{p.location}</span>
                        <span className="text-xs font-bold">{p.scans}회</span>
                      </div>
                      <div className="text-2xs text-muted-foreground">{p.type}</div>
                      <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.scans / 156) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-violet-600" /> QR 디자인 옵션
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {['기본 QR', '로고 QR', '컬러 QR'].map((style, i) => (
                  <div key={i} className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-colors ${
                    i === 1 ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10' : 'border-border hover:border-violet-300'
                  }`}>
                    <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                      <QrCode className={`w-8 h-8 ${i === 1 ? 'text-violet-600' : 'text-gray-400'}`} />
                    </div>
                    <span className="text-2xs font-medium">{style}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 예약 현황 ═══ */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 최근 예약 */}
            <div className="card">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-sm">최근 모바일 예약</h2>
              </div>
              <div className="divide-y divide-border">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      booking.method === 'QR' ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {booking.method === 'QR' ? <QrCode className="w-5 h-5 text-violet-600" /> : <Globe className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{booking.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                          booking.type === '초진' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                        }`}>{booking.type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                          booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                        }`}>{booking.status === 'confirmed' ? '확정' : '대기'}</span>
                      </div>
                      <div className="text-2xs text-muted-foreground">{booking.date} {booking.time} · {booking.method} 예약</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 시간대별 예약 분포 */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4">시간대별 예약 분포</h2>
              <div className="flex items-end gap-2 h-40">
                {hourlyDistribution.map((h, i) => {
                  const height = (h.count / maxHourly) * 100
                  const isPeak = h.count === maxHourly
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-2xs font-bold">{h.count}</span>
                      <div
                        className={`w-full rounded-t-lg ${isPeak ? 'bg-violet-500' : 'bg-violet-200 dark:bg-violet-800/40'}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className={`text-2xs ${isPeak ? 'font-bold text-violet-600' : 'text-muted-foreground'}`}>{h.hour}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl p-3 flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                <p className="text-2xs text-violet-700 dark:text-violet-300">
                  15시가 가장 인기 시간대입니다. 12시(점심)은 예약 희소 → 점심 진료 홍보 시 수요 창출 가능.
                </p>
              </div>
            </div>
          </div>

          {/* 예약 채널 비교 */}
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4">예약 채널별 비교</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { channel: 'QR 스캔', icon: QrCode, count: 82, ratio: 44.1, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
                { channel: '링크 공유', icon: Link, count: 45, ratio: 24.2, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                { channel: '전화 예약', icon: MessageSquare, count: 38, ratio: 20.4, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
                { channel: '현장 접수', icon: MapPin, count: 21, ratio: 11.3, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
              ].map((ch, i) => (
                <div key={i} className="card p-4 border border-border text-center">
                  <div className={`w-10 h-10 rounded-xl ${ch.color} flex items-center justify-center mx-auto mb-2`}>
                    <ch.icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-lg">{ch.count}건</div>
                  <div className="text-xs text-muted-foreground">{ch.channel}</div>
                  <div className="text-2xs font-bold text-violet-600 mt-1">{ch.ratio}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 설정 ═══ */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4">예약 설정</h2>
            <div className="space-y-4">
              {[
                { label: '예약 가능 시간', desc: '환자가 예약할 수 있는 시간대 설정', value: '09:00 ~ 17:30' },
                { label: '예약 간격', desc: '예약 슬롯 간격', value: '15분' },
                { label: '최대 선행 예약', desc: '최대 며칠 후까지 예약 가능', value: '30일' },
                { label: '시간당 최대 예약', desc: '시간당 받을 수 있는 최대 예약 수', value: '6건' },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">{setting.label}</div>
                    <div className="text-2xs text-muted-foreground">{setting.desc}</div>
                  </div>
                  <span className="text-sm font-bold text-violet-600">{setting.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-4">알림 설정</h2>
            <div className="space-y-3">
              {[
                { label: '예약 확인 알림', desc: '예약 완료 시 환자에게 카카오 알림톡 발송', enabled: true },
                { label: '리마인더 알림', desc: '예약 1시간 전 환자에게 알림 발송', enabled: true },
                { label: '도착 확인 요청', desc: '예약 시간 10분 전 도착 여부 확인', enabled: false },
                { label: '노쇼 시 알림', desc: '예약 시간 15분 경과 후 미도착 시 원장님 알림', enabled: true },
                { label: '대기 현황 공유', desc: '접수 완료 시 실시간 대기 순서 알림', enabled: true },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">{setting.label}</div>
                    <div className="text-2xs text-muted-foreground">{setting.desc}</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${setting.enabled ? 'bg-violet-500 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 환자 화면 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-80 overflow-hidden border-4 border-gray-800" onClick={e => e.stopPropagation()}>
            {/* 폰 상단 바 */}
            <div className="bg-gray-800 h-8 flex items-center justify-center">
              <div className="w-16 h-4 bg-gray-700 rounded-full" />
            </div>

            {/* 앱 콘텐츠 */}
            <div className="p-5">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <h2 className="font-bold text-lg">메디매치 내과의원</h2>
                <p className="text-xs text-gray-500 mt-0.5">서울 강남구 테헤란로 123</p>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <div className="text-2xs text-blue-600 font-semibold mb-1">현재 대기</div>
                  <div className="text-lg font-bold text-blue-600">3명 · 약 15분</div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-2">예약 날짜 선택</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['오늘', '내일', '1/25', '1/26', '1/27'].map((d, i) => (
                      <button key={i} className={`py-2 rounded-lg text-2xs font-medium ${i === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-2">시간 선택</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'].map((t, i) => (
                      <button key={i} className={`py-2 rounded-lg text-2xs font-medium ${i === 3 ? 'bg-blue-500 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm">
                  예약 확정하기
                </button>
                <p className="text-2xs text-center text-gray-400">앱 설치 없이 바로 예약</p>
              </div>
            </div>

            {/* 폰 하단 바 */}
            <div className="bg-gray-800 h-5 flex items-center justify-center">
              <div className="w-24 h-1 bg-gray-600 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

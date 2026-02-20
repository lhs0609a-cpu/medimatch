'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import {
  DollarSign, PieChart as PieIcon, TrendingUp, Target, Users, MapPin,
  LineChart as LineIcon, Shield, Brain, ChevronRight, Star, ArrowUpRight,
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { SimulationResponse } from '@/lib/api/client'
import ScoreGauge from './components/ScoreGauge'

interface PremiumAnalysisProps {
  result: SimulationResponse
}

function formatCurrency(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`
  if (value >= 10000) return `${(value / 10000).toLocaleString()}만원`
  return `${value.toLocaleString()}원`
}

function formatShortCurrency(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${(value / 10000).toLocaleString()}만`
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

function SectionHeader({ icon, title, iconColor, iconShadow }: { icon: any; title: string; iconColor?: string; iconShadow?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <TossIcon icon={icon} color={iconColor || 'from-blue-500 to-indigo-500'} size="sm" shadow={iconShadow} />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-4 bg-secondary/50 rounded-xl text-center">
      <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'LOW': return 'text-green-600'
    case 'MEDIUM': return 'text-amber-600'
    case 'HIGH': return 'text-red-600'
    default: return 'text-muted-foreground'
  }
}

function getRiskBg(level: string): string {
  switch (level) {
    case 'LOW': return 'bg-green-100 dark:bg-green-900/30'
    case 'MEDIUM': return 'bg-amber-100 dark:bg-amber-900/30'
    case 'HIGH': return 'bg-red-100 dark:bg-red-900/30'
    default: return 'bg-secondary'
  }
}

function getRiskLabel(level: string): string {
  switch (level) {
    case 'LOW': return '낮음'
    case 'MEDIUM': return '보통'
    case 'HIGH': return '높음'
    default: return level
  }
}

export default function PremiumAnalysis({ result }: PremiumAnalysisProps) {
  const rd = result.revenue_detail
  const cd = result.cost_detail
  const pd = result.profitability_detail
  const compD = result.competition_detail
  const dd = result.demographics_detail
  const la = result.location_analysis
  const gp = result.growth_projection
  const ra = result.risk_analysis
  const ai = result.ai_insights

  return (
    <div className="space-y-6">
      {/* ─── 1. Revenue Detail ─── */}
      {rd && (
        <section className="card p-6">
          <SectionHeader icon={DollarSign} title="매출 상세 분석" iconColor="from-green-500 to-emerald-500" iconShadow="shadow-green-500/25" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue Bar Chart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">월 매출 범위</h4>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '최소', value: result.estimated_monthly_revenue.min },
                    { name: '평균', value: result.estimated_monthly_revenue.avg },
                    { name: '최대', value: result.estimated_monthly_revenue.max },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatShortCurrency(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insurance Pie */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">보험/비보험 비율</h4>
              <div className="flex items-center gap-4">
                <div style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '보험', value: rd.insurance_ratio },
                          { name: '비보험', value: rd.non_insurance_ratio },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>보험 {(rd.insurance_ratio * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>비보험 {(rd.non_insurance_ratio * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            <StatCard label="일 평균 환자수" value={`${rd.daily_patients_avg}명`} sub={`${rd.daily_patients_min}~${rd.daily_patients_max}명`} />
            <StatCard label="평균 진료비" value={formatCurrency(rd.avg_treatment_fee)} />
            <StatCard label="신환 비율" value={`${(rd.new_patient_ratio * 100).toFixed(0)}%`} />
            <StatCard label="재진 비율" value={`${(rd.return_patient_ratio * 100).toFixed(0)}%`} />
          </div>
        </section>
      )}

      {/* ─── 2. Cost Detail ─── */}
      {cd && (
        <section className="card p-6">
          <SectionHeader icon={PieIcon} title="비용 구조 분석" iconColor="from-orange-500 to-red-500" iconShadow="shadow-orange-500/25" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Cost Donut */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">월 비용 구성</h4>
              {(() => {
                const costItems = [
                  { name: '임대료', value: cd.rent_monthly + cd.maintenance_fee },
                  { name: '인건비', value: (cd.nurse_count * cd.avg_nurse_salary) + (cd.admin_count * cd.avg_admin_salary) },
                  { name: '장비/리스', value: cd.equipment_monthly },
                  { name: '마케팅', value: cd.marketing_monthly },
                  { name: '소모품', value: cd.supplies_monthly },
                  { name: '관리비/기타', value: cd.utilities_monthly + cd.insurance_monthly },
                ]
                return (
                  <div className="flex items-center gap-4">
                    <div style={{ width: 180, height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costItems}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {costItems.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {costItems.map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-medium text-foreground ml-auto">{formatShortCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Initial Investment */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">초기 투자비</h4>
              <div className="space-y-3">
                {[
                  { label: '보증금', value: cd.rent_deposit },
                  { label: '의료장비', value: cd.initial_equipment },
                  { label: '인테리어', value: cd.initial_interior },
                  { label: '기타 비용', value: cd.initial_other },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-semibold text-foreground">
                  <span>총 투자비</span>
                  <span>{formatCurrency(cd.rent_deposit + cd.initial_equipment + cd.initial_interior + cd.initial_other)}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>의사 {cd.doctor_count}명 · 간호사 {cd.nurse_count}명 · 행정 {cd.admin_count}명</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. Profitability ─── */}
      {pd && (
        <section className="card p-6">
          <SectionHeader icon={TrendingUp} title="수익성 분석" iconColor="from-blue-500 to-indigo-500" iconShadow="shadow-blue-500/25" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="영업이익률" value={`${pd.profit_margin_percent}%`} color="text-green-600" />
            <StatCard label="연 ROI" value={`${result.profitability.annual_roi_percent}%`} color="text-blue-600" />
            <StatCard label="IRR" value={`${pd.irr_percent}%`} color="text-violet-600" />
            <StatCard label="3년 NPV" value={formatCurrency(pd.npv_3years)} color="text-teal-600" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <StatCard label="월 평균 이익" value={formatCurrency(pd.monthly_profit_avg)} sub={`${formatShortCurrency(pd.monthly_profit_min)} ~ ${formatShortCurrency(pd.monthly_profit_max)}`} />
            <StatCard label="연간 이익 추정" value={formatCurrency(pd.annual_profit_estimate)} />
            <StatCard label="투자금 회수" value={`${pd.payback_months}개월`} sub={`총 투자 ${formatCurrency(pd.total_investment)}`} />
          </div>
        </section>
      )}

      {/* ─── 4. Competition Detail ─── */}
      {compD && (
        <section className="card p-6">
          <SectionHeader icon={Target} title="경쟁 심층 분석" iconColor="from-red-500 to-orange-500" iconShadow="shadow-red-500/25" />

          {/* Market Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="시장 포화도" value={`${compD.market_saturation}%`} color={compD.market_saturation > 70 ? 'text-red-600' : 'text-amber-600'} />
            <StatCard label="경쟁 지수" value={`${compD.competition_index}`} />
            <StatCard label="예상 점유율" value={`${compD.estimated_market_share}%`} color="text-blue-600" />
            <StatCard label="월 잠재환자" value={`${compD.potential_patients_monthly.toLocaleString()}명`} />
          </div>

          {/* Competitor Table */}
          {result.competitors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">경쟁 병원 상세</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">병원명</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">거리</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">추정 월매출</th>
                      <th className="py-2 pr-4 font-medium text-muted-foreground">평점</th>
                      <th className="py-2 font-medium text-muted-foreground">특화분야</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.competitors.map((comp, idx) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 font-medium text-foreground">{comp.name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{comp.distance_m}m</td>
                        <td className="py-2.5 pr-4 text-foreground">{comp.est_monthly_revenue ? formatShortCurrency(comp.est_monthly_revenue) : '-'}</td>
                        <td className="py-2.5 pr-4">
                          {comp.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {comp.rating}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{comp.specialty_detail || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── 5. Demographics Detail ─── */}
      {dd && (
        <section className="card p-6">
          <SectionHeader icon={Users} title="인구 상세 분석" iconColor="from-purple-500 to-pink-500" iconShadow="shadow-purple-500/25" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Age Distribution Bar */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">연령대 분포</h4>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '0-9세', value: dd.age_0_9 * 100 },
                    { name: '10대', value: dd.age_10_19 * 100 },
                    { name: '20대', value: dd.age_20_29 * 100 },
                    { name: '30대', value: dd.age_30_39 * 100 },
                    { name: '40대', value: dd.age_40_49 * 100 },
                    { name: '50대', value: dd.age_50_59 * 100 },
                    { name: '60+', value: dd.age_60_plus * 100 },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demo stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="500m 인구" value={dd.population_500m.toLocaleString()} />
                <StatCard label="1km 인구" value={dd.population_1km.toLocaleString()} />
                <StatCard label="3km 인구" value={dd.population_3km.toLocaleString()} />
                <StatCard label="평균 가구소득" value={`${dd.avg_household_income}만원`} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">남/여 비율</span>
                  <span className="font-medium">{(dd.male_ratio * 100).toFixed(0)}% / {(dd.female_ratio * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">의료이용률</span>
                  <span className="font-medium">{(dd.medical_utilization_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">연평균 병원 방문</span>
                  <span className="font-medium">{dd.avg_annual_visits}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">유동인구 피크</span>
                  <span className="font-medium">{dd.floating_peak_hour}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">평일/주말 유동</span>
                  <span className="font-medium">{(dd.floating_weekday_avg / 10000).toFixed(1)}만 / {(dd.floating_weekend_avg / 10000).toFixed(1)}만</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. Location Analysis ─── */}
      {la && (
        <section className="card p-6">
          <SectionHeader icon={MapPin} title="입지 분석" iconColor="from-orange-500 to-red-500" iconShadow="shadow-orange-500/25" />

          {/* 4 Score Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '교통 접근성', score: la.transit_score, color: '#3b82f6' },
              { label: '주차 편의성', score: la.parking_score, color: '#8b5cf6' },
              { label: '상권 활성도', score: la.commercial_score, color: '#22c55e' },
              { label: '가시성', score: la.visibility_score, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <ScoreGauge score={item.score} size={110} color={item.color} label={item.label} />
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground mb-2">교통 정보</h4>
              {la.subway_stations.map((st) => (
                <div key={st.name} className="flex justify-between">
                  <span className="text-muted-foreground">{st.name} ({st.lines.join(', ')})</span>
                  <span className="font-medium">{st.distance_m}m</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">버스 정류장 / 노선</span>
                <span className="font-medium">{la.bus_stops_count}개 / {la.bus_routes_count}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">주차 (건물/인근)</span>
                <span className="font-medium">{la.parking_spaces}대 / 인근 {la.nearby_parking_lots}곳</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground mb-2">건물 및 상권</h4>
              <div className="flex justify-between">
                <span className="text-muted-foreground">건물 유형</span>
                <span className="font-medium">{la.building_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">건물 연식 / 층</span>
                <span className="font-medium">{la.building_age}년 / {la.floor_info}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">상권 유형</span>
                <span className="font-medium">{la.commercial_district_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">유동인구 등급</span>
                <span className="font-medium">{la.foot_traffic_rank}등급</span>
              </div>
              {la.nearby_facilities && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {Object.entries(la.nearby_facilities).map(([key, val]) => (
                    <span key={key} className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {key === 'pharmacy' ? '약국' : key === 'restaurant' ? '음식점' : key === 'cafe' ? '카페' : key === 'bank' ? '은행' : key} {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. Growth Projection ─── */}
      {gp && (
        <section className="card p-6">
          <SectionHeader icon={LineIcon} title="3년 성장 전망" iconColor="from-violet-500 to-purple-500" iconShadow="shadow-violet-500/25" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue/Profit LineChart */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">연도별 매출 예측</h4>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: '1년차', revenue: gp.revenue_projection.year1, profit: gp.revenue_projection.year1 * (pd?.profit_margin_percent || 49) / 100 },
                    { name: '2년차', revenue: gp.revenue_projection.year2, profit: gp.revenue_projection.year2 * (pd?.profit_margin_percent || 49) / 100 },
                    { name: '3년차', revenue: gp.revenue_projection.year3, profit: gp.revenue_projection.year3 * (pd?.profit_margin_percent || 49) / 100 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => formatShortCurrency(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="매출" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="profit" name="이익" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth stats & dev plans */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard label="1년차 성장" value={`+${gp.growth_rate_year1}%`} color="text-green-600" />
                <StatCard label="2년차 성장" value={`+${gp.growth_rate_year2}%`} color="text-green-600" />
                <StatCard label="3년차 성장" value={`+${gp.growth_rate_year3}%`} color="text-green-600" />
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">5년 후 월 매출 추정</span>
                  <span className="font-medium">{formatCurrency(gp.year5_revenue_estimate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">5년 누적 이익</span>
                  <span className="font-medium text-green-600">{formatCurrency(gp.cumulative_profit_5years)}</span>
                </div>
              </div>
              {gp.development_plans.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">주변 개발 계획</h4>
                  <div className="space-y-1.5">
                    {gp.development_plans.map((plan, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. Risk Analysis ─── */}
      {ra && (
        <section className="card p-6">
          <SectionHeader icon={Shield} title="리스크 분석" iconColor="from-amber-500 to-orange-500" iconShadow="shadow-amber-500/25" />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Risk Score Gauge + factors */}
            <div>
              <div className="flex items-center gap-6 mb-5">
                <ScoreGauge
                  score={100 - ra.overall_risk_score}
                  size={120}
                  color={ra.overall_risk_level === 'LOW' ? '#22c55e' : ra.overall_risk_level === 'MEDIUM' ? '#f59e0b' : '#ef4444'}
                  label="안전도"
                />
                <div>
                  <div className={`text-lg font-semibold ${getRiskColor(ra.overall_risk_level)}`}>
                    종합 리스크: {getRiskLabel(ra.overall_risk_level)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">리스크 점수 {ra.overall_risk_score}/100</p>
                </div>
              </div>

              {/* Risk category badges */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '경쟁 리스크', level: ra.competition_risk },
                  { label: '입지 리스크', level: ra.location_risk },
                  { label: '시장 리스크', level: ra.market_risk },
                  { label: '재무 리스크', level: ra.financial_risk },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-lg ${getRiskBg(item.level)}`}>
                    <span className="text-xs text-foreground">{item.label}</span>
                    <span className={`text-xs font-semibold ${getRiskColor(item.level)}`}>{getRiskLabel(item.level)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk factors & Opportunities */}
            <div>
              {ra.risk_factors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">주요 리스크 요인</h4>
                  <div className="space-y-2">
                    {ra.risk_factors.map((rf, idx) => (
                      <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{rf.factor}</span>
                          <span className={`text-xs font-semibold ${getRiskColor(rf.level)}`}>{getRiskLabel(rf.level)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rf.description}</p>
                        <p className="text-xs text-blue-600 mt-1">대응: {rf.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ra.opportunities.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">기회 요인</h4>
                  <div className="space-y-1.5">
                    {ra.opportunities.map((opp, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <ArrowUpRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 9. AI Insights ─── */}
      {ai && (
        <section className="card p-6">
          <SectionHeader icon={Brain} title="AI 전략 리포트" iconColor="from-indigo-500 to-purple-500" iconShadow="shadow-indigo-500/25" />

          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-foreground leading-relaxed">{ai.executive_summary}</p>
          </div>

          {/* SWOT Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { title: '강점 (S)', items: ai.strengths, color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300' },
              { title: '약점 (W)', items: ai.weaknesses, color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300' },
              { title: '기회 (O)', items: ai.opportunities, color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300' },
              { title: '위협 (T)', items: ai.threats, color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-300' },
            ].map((quad) => (
              <div key={quad.title} className={`p-4 rounded-xl border ${quad.color}`}>
                <h4 className={`text-sm font-semibold mb-2 ${quad.textColor}`}>{quad.title}</h4>
                <ul className="space-y-1">
                  {quad.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-foreground flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Strategy & Marketing */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">추천 전략</h4>
              <div className="space-y-2">
                {ai.recommended_strategies.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-sm flex-shrink-0">{['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'][idx] || `${idx+1}.`}</span>
                    <span className="text-foreground">{s}</span>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-medium text-foreground mt-5 mb-3">차별화 포인트</h4>
              <div className="flex flex-wrap gap-2">
                {ai.differentiation_points.map((d, idx) => (
                  <span key={idx} className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2.5 py-1 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">타겟 환자층</h4>
              <div className="space-y-1.5 mb-4">
                {ai.target_patient_groups.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-foreground">{g}</span>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-medium text-foreground mb-3">마케팅 제안</h4>
              <div className="space-y-1.5 mb-4">
                {ai.marketing_suggestions.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{m}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">추천 개원 시기</span>
                  <span className="font-medium text-foreground">{ai.recommended_opening_season}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ai.opening_timing_reason}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

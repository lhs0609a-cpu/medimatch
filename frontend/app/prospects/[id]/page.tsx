'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, Clock, TrendingUp, Users,
  FileText, Download, Star, Target, BarChart3, AlertCircle
} from 'lucide-react'
import { TossIcon } from '@/components/ui/TossIcon'
import { prospectsService } from '@/lib/api/services'

const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
  NEW_BUILD: { label: '신축', color: 'text-blue-700', bg: 'bg-blue-100' },
  VACANCY: { label: '공실', color: 'text-orange-700', bg: 'bg-orange-100' },
  RELOCATION: { label: '이전예정', color: 'text-purple-700', bg: 'bg-purple-100' },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: '신규', color: 'bg-green-100 text-green-700' },
  CONTACTED: { label: '컨택중', color: 'bg-yellow-100 text-yellow-700' },
  CONVERTED: { label: '계약완료', color: 'bg-purple-100 text-purple-700' },
  CLOSED: { label: '종료', color: 'bg-gray-100 text-gray-700' },
}

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [showReport, setShowReport] = useState(false)

  const prospectId = params.id as string

  const { data: prospect, isLoading } = useQuery({
    queryKey: ['prospect', prospectId],
    queryFn: () => prospectsService.get(prospectId),
    enabled: !!prospectId,
  })

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['prospect-report', prospectId],
    queryFn: () => prospectsService.getReport(prospectId),
    enabled: !!prospectId && showReport,
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-blue-100'
    if (score >= 40) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">개원지 정보를 찾을 수 없습니다</p>
          <Link href="/prospects" className="text-green-600 mt-2 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const typeInfo = typeLabels[prospect.type] || typeLabels.NEW_BUILD

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-900">개원지 상세</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.bg} ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[prospect.status].color}`}>
              {statusLabels[prospect.status].label}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Score Banner */}
        <div className={`rounded-2xl p-6 mb-6 ${getScoreBg(prospect.clinic_fit_score || 0)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 mb-1">병원 입점 적합도</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(prospect.clinic_fit_score || 0)}`}>
                  {prospect.clinic_fit_score || 0}
                </span>
                <span className="text-lg opacity-60">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-70 mb-1">탐지일</p>
              <p className="font-medium">{formatDate(prospect.detected_at)}</p>
            </div>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <div className="flex items-start gap-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{prospect.address}</h1>
              {prospect.floor_info && <p className="text-gray-500">{prospect.floor_info}</p>}
            </div>
          </div>

          {prospect.previous_clinic && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-orange-700">
                <strong>이전 의료기관:</strong> {prospect.previous_clinic}
              </p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">용도지역</p>
              <p className="font-medium text-gray-900">{prospect.zoning || '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">전용면적</p>
              <p className="font-medium text-gray-900">
                {prospect.floor_area ? `${prospect.floor_area}㎡` : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">예상 임대료</p>
              <p className="font-medium text-gray-900">
                {prospect.rent_estimate
                  ? `${(prospect.rent_estimate / 10000).toLocaleString()}만원`
                  : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">층</p>
              <p className="font-medium text-gray-900">{prospect.floor_info || '-'}</p>
            </div>
          </div>
        </div>

        {/* Recommended Departments */}
        {prospect.recommended_dept && prospect.recommended_dept.length > 0 && (
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TossIcon icon={Target} color="from-red-500 to-orange-500" size="sm" shadow="shadow-red-500/25" />
              추천 진료과목
            </h2>
            <div className="flex flex-wrap gap-2">
              {prospect.recommended_dept.map((dept, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              * 주변 인구 구조와 기존 의료기관 분포를 기반으로 추천된 진료과목입니다
            </p>
          </div>
        )}

        {/* Description */}
        {prospect.description && (
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              상세 설명
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{prospect.description}</p>
          </div>
        )}

        {/* AI Report Section */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TossIcon icon={BarChart3} color="from-green-500 to-emerald-500" size="sm" shadow="shadow-green-500/25" />
            AI 영업 리포트
          </h2>

          {!showReport ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                AI가 분석한 상세 영업 리포트를 확인하세요
              </p>
              <button
                onClick={() => setShowReport(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700"
              >
                리포트 생성하기
              </button>
            </div>
          ) : reportLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">AI가 분석 중입니다...</p>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-medium text-green-800 mb-2">분석 요약</h3>
                <p className="text-green-700 whitespace-pre-wrap">{report.analysis}</p>
              </div>

              {/* Opportunity Score */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-3xl">&#x1F3AF;</span>
                  <span className={`text-2xl font-bold ${getScoreColor(report.opportunity_score)}`}>
                    {report.opportunity_score}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">기회 점수</p>
                  <p className="text-sm text-gray-500">영업 성공 가능성 지표</p>
                </div>
              </div>

              {/* Market Insights */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">시장 인사이트</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{report.market_insights}</p>
                </div>
              </div>

              {/* Competition Analysis */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">경쟁 분석</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{report.competition_analysis}</p>
                </div>
              </div>

              {/* Demographics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">인구통계 요약</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{report.demographic_summary}</p>
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">추천 액션</h3>
                <ul className="space-y-2">
                  {report.recommended_actions.map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Export */}
              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50">
                  <Download className="w-5 h-5" />
                  PDF 저장
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50">
                  <Download className="w-5 h-5" />
                  Excel 저장
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Map Placeholder */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TossIcon icon={MapPin} color="from-orange-500 to-red-500" size="sm" shadow="shadow-orange-500/25" />
            위치
          </h2>
          <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>위도: {prospect.latitude}</p>
              <p>경도: {prospect.longitude}</p>
              <p className="text-sm mt-2">(카카오맵 연동 시 지도 표시)</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

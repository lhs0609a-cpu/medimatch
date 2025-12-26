'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Pill, Heart, MessageCircle, Calendar, CheckCircle,
  Clock, XCircle, ChevronRight, Users
} from 'lucide-react'
import { pharmacyMatchService } from '@/lib/api/services'
import { MatchStatus } from '@/lib/api/client'

const statusConfig: Record<MatchStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: '관심 대기', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  MUTUAL: { label: '상호 관심', color: 'bg-green-100 text-green-700', icon: Heart },
  CHATTING: { label: '대화중', color: 'bg-blue-100 text-blue-700', icon: MessageCircle },
  MEETING: { label: '미팅 진행', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  CONTRACTED: { label: '계약 완료', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

export default function MatchesPage() {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['pharmacy-match-matches'],
    queryFn: pharmacyMatchService.getMatches,
  })

  const { data: interests } = useQuery({
    queryKey: ['pharmacy-match-interests'],
    queryFn: pharmacyMatchService.getInterests,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/pharmacy-match" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">매칭 현황</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{interests?.total_sent || 0}</p>
            <p className="text-sm text-gray-600">보낸 관심</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{interests?.total_received || 0}</p>
            <p className="text-sm text-gray-600">받은 관심</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {matches?.items.filter(m => m.status === 'MUTUAL' || m.status === 'CHATTING' || m.status === 'MEETING').length || 0}
            </p>
            <p className="text-sm text-gray-600">활성 매칭</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
            매칭 ({matches?.total || 0})
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            보낸 관심 ({interests?.total_sent || 0})
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            받은 관심 ({interests?.total_received || 0})
          </button>
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">매칭 목록을 불러오는 중...</p>
          </div>
        ) : matches?.items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 매칭이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              매물에 관심을 표시하고, 상대방도 관심을 표시하면<br />
              매칭이 성사됩니다.
            </p>
            <Link
              href="/pharmacy-match"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              매물 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches?.items.map((match) => {
              const config = statusConfig[match.status]
              const StatusIcon = config.icon

              return (
                <Link
                  key={match.id}
                  href={`/pharmacy-match/matches/${match.id}`}
                  className="block bg-white rounded-xl border hover:shadow-md transition group"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          매칭률 {match.match_score?.toFixed(0) || '-'}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(match.created_at)}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      {/* Listing Info */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">매물</p>
                        <p className="font-medium text-gray-900">{match.listing_info.region_name}</p>
                        <p className="text-sm text-gray-600">
                          {match.listing_info.premium_min && `권리금 ${(match.listing_info.premium_min / 10000).toFixed(0)}억~`}
                        </p>
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">약사</p>
                        <p className="font-medium text-gray-900">{match.profile_info.anonymous_id}</p>
                        <p className="text-sm text-gray-600">
                          경력 {match.profile_info.experience_years}년
                        </p>
                      </div>
                    </div>

                    {/* Contact Info (if revealed) */}
                    {match.contact_revealed_at && match.listing_private && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          연락처 공개됨
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 bg-gray-50 rounded-b-xl flex items-center justify-between group-hover:bg-purple-50">
                    <span className="text-sm text-gray-600 group-hover:text-purple-700">
                      상세 보기
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Interests Section */}
        {interests && (interests.total_received > 0 || interests.total_sent > 0) && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">관심 표시</h2>

            {/* Received Interests */}
            {interests.received.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">받은 관심</h3>
                <div className="space-y-2">
                  {interests.received.map((interest) => (
                    <div
                      key={interest.id}
                      className="bg-white rounded-lg border p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{interest.target_anonymous_id}</p>
                        <p className="text-sm text-gray-600">{interest.target_summary}</p>
                        {interest.message && (
                          <p className="text-sm text-gray-500 mt-1">"{interest.message}"</p>
                        )}
                      </div>
                      <Link
                        href={`/pharmacy-match/listings/${interest.listing_id}`}
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        보기
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Interests */}
            {interests.sent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">보낸 관심</h3>
                <div className="space-y-2">
                  {interests.sent.map((interest) => (
                    <div
                      key={interest.id}
                      className="bg-white rounded-lg border p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{interest.target_anonymous_id}</p>
                        <p className="text-sm text-gray-600">{interest.target_summary}</p>
                      </div>
                      <span className="text-sm text-yellow-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        대기중
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MessageSquare, Eye, Heart, Clock,
  Search, TrendingUp, Users, Award, Flame, Star
} from 'lucide-react'
import { generateCommunityPosts, generateActivityFeed, platformStats } from '@/lib/data/seedListings'
import PostCard from './components/PostCard'

const allPosts = generateCommunityPosts(150)
const activityFeed = generateActivityFeed(20)

const categories = ['전체', '개원정보', '약국운영', '매물후기', '질문답변', '업계소식', '세무/법률', '장비/인테리어']

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % activityFeed.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      if (selectedCategory !== '전체' && post.category !== selectedCategory) return false
      if (searchQuery && !post.title.includes(searchQuery) && !post.category.includes(searchQuery)) return false
      return true
    })
  }, [selectedCategory, searchQuery])

  const popularPosts = useMemo(() => {
    return [...allPosts].filter(p => !p.isPinned).sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)
  }, [])

  const trendingPosts = useMemo(() => {
    return [...allPosts].filter(p => p.isHot && !p.isPinned).slice(0, 3)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">커뮤니티</span>
                <span className="badge-info">{platformStats.totalMembers.toLocaleString()}+ 회원</span>
              </div>
            </div>
            <Link href="/community/write" className="btn-primary">글쓰기</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Stats Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 text-white rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-xl font-bold mb-1">개원/약국 전문 커뮤니티</h1>
                  <p className="text-white/80 text-sm">의사, 약사, 전문가가 함께하는 정보 공유 공간</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{platformStats.totalMembers.toLocaleString()}</div>
                    <div className="text-xs text-white/70">전체 회원</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{allPosts.length}</div>
                    <div className="text-xs text-white/70">게시글</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      {platformStats.onlineNow}
                    </div>
                    <div className="text-xs text-white/70">접속 중</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Activity */}
            <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-muted-foreground">실시간</span>
                <span className="text-foreground font-medium">{activityFeed[currentActivityIndex]?.message}</span>
                <span className="text-muted-foreground text-xs ml-auto">{activityFeed[currentActivityIndex]?.timeAgo}</span>
              </div>
            </div>

            {/* Trending */}
            {trendingPosts.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-red-500" />
                  <h2 className="font-semibold text-foreground">실시간 인기</h2>
                </div>
                <div className="space-y-2">
                  {trendingPosts.map((post, idx) => (
                    <Link key={post.id} href={`/community/${post.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                      <span className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                      <span className="flex-1 text-sm text-foreground line-clamp-1">{post.title}</span>
                      <span className="text-xs text-red-600 flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="card p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="제목, 내용 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12 w-full"
                />
              </div>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="card overflow-hidden">
              {selectedCategory === '전체' && filteredPosts.filter(p => p.isPinned).map((post) => (
                <PostCard key={post.id} post={post} isPinned />
              ))}
              {filteredPosts.filter(p => !p.isPinned).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">실시간 현황</h2>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-primary">{platformStats.onlineNow}</div>
                  <div className="text-xs text-muted-foreground">현재 접속</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{platformStats.todayPosts}</div>
                  <div className="text-xs text-muted-foreground">오늘 게시글</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-foreground">{platformStats.todayActiveUsers}</div>
                  <div className="text-xs text-muted-foreground">오늘 방문</div>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">+{platformStats.weeklyNewMembers}</div>
                  <div className="text-xs text-muted-foreground">이번주 가입</div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-foreground">인기 게시글</h2>
              </div>
              <div className="space-y-3">
                {popularPosts.map((post, idx) => (
                  <Link key={post.id} href={`/community/${post.id}`} className="flex items-start gap-3 group">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      idx < 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-secondary text-muted-foreground'
                    }`}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">조회 {post.viewCount} · 댓글 {post.commentCount}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-foreground">활발한 회원</h2>
              </div>
              <div className="space-y-3">
                {['강남내과의사', '10년차약사', '의료컨설턴트', '개원준비중의사', '분당약국장'].map((name, idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{name[0]}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">게시글 {30 - idx * 5}개</p>
                    </div>
                    {idx < 3 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded">TOP {idx + 1}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">#</span>
                <h2 className="font-semibold text-foreground">인기 태그</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['꿀팁', '개원후기', '약국운영', '인테리어', '세금절감', '입지선정', 'EMR추천', '직원관리', '마케팅'].map((tag) => (
                  <button key={tag} className="px-3 py-1.5 bg-secondary hover:bg-accent hover:text-primary rounded-full text-sm text-muted-foreground transition-colors">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-2">커뮤니티에 참여하세요</h3>
              <p className="text-sm text-white/80 mb-4">{platformStats.totalMembers.toLocaleString()}명의 의료인과 정보를 공유하세요</p>
              <Link href="/register" className="block w-full py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-center">
                무료 가입하기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

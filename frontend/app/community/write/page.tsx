'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Image, Bold, Italic, List, Link as LinkIcon, X } from 'lucide-react'

const categories = ['개원정보', '약국운영', '매물후기', '질문답변', '업계소식', '세무/법률', '장비/인테리어']

export default function CommunityWritePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !category || !content.trim()) return
    // MVP: localStorage에 저장 후 목록으로 이동
    const posts = JSON.parse(localStorage.getItem('medimatch_community_posts') || '[]')
    posts.unshift({
      id: `user-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      tags,
      authorType: 'doctor',
      authorName: '나',
      createdAt: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    })
    localStorage.setItem('medimatch_community_posts', JSON.stringify(posts))
    router.push('/community')
  }

  const isValid = title.trim() && category && content.trim()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/community" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">취소</span>
            </Link>
            <h1 className="font-bold text-foreground">글쓰기</h1>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isValid ? 'btn-primary' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" /> 등록
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">카테고리 *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="input w-full"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">내용 *</label>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border border-b-0 rounded-t-lg bg-muted/30">
              <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Bold className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Italic className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><List className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><LinkIcon className="w-4 h-4" /></button>
              <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Image className="w-4 h-4" /></button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요. 마크다운 문법을 지원합니다."
              rows={15}
              className="textarea rounded-t-none w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">태그 (최대 5개)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                placeholder="#태그 입력 후 Enter"
                className="input flex-1"
              />
              <button type="button" onClick={handleAddTag} className="btn-secondary px-4 rounded-lg">
                추가
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="card p-4 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">커뮤니티 가이드라인</p>
            <ul className="text-xs text-amber-600 dark:text-amber-500 space-y-1">
              <li>• 상호 존중하는 커뮤니케이션을 부탁드립니다.</li>
              <li>• 광고/홍보 글은 관리자에 의해 삭제될 수 있습니다.</li>
              <li>• 개인정보가 포함된 글은 작성을 자제해주세요.</li>
              <li>• 의료 관련 질문은 전문가 답변을 참고용으로만 활용하세요.</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  )
}

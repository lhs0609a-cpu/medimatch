'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Eye, ChevronLeft } from 'lucide-react';

interface Post {
  id: number; category: string; title: string; is_pinned: boolean;
  view_count: number; comment_count: number; created_at: string;
}

interface PostDetail {
  id: number; category: string; title: string; content: string;
  is_pinned: boolean; view_count: number; comment_count: number;
  created_at: string;
  comments: { id: number; content: string; parent_id: number | null; author_id: string; created_at: string }[];
}

const CAT_LABELS: Record<string, string> = { NOTICE: '공지', QNA: 'Q&A', TIP: '팁', DISCUSSION: '자유' };
const CAT_COLORS: Record<string, string> = { NOTICE: 'bg-red-100 text-red-700', QNA: 'bg-blue-100 text-blue-700', TIP: 'bg-green-100 text-green-700', DISCUSSION: 'bg-gray-100 text-gray-700' };

export default function BrokerBoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [selectedPost, setSelectedPost] = useState<PostDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ category: 'DISCUSSION', title: '', content: '' });
  const [comment, setComment] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (category) params.set('category', category);
      const res = await fetch(`${apiUrl}/broker/board?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setPosts(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
  };

  const fetchPost = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/broker/board/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSelectedPost(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPosts(); }, [page, category]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/broker/board`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowCreate(false); fetchPosts(); setForm({ category: 'DISCUSSION', title: '', content: '' }); }
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!comment.trim() || !selectedPost) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${apiUrl}/broker/board/${selectedPost.id}/comments`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      setComment('');
      fetchPost(selectedPost.id);
    } catch (e) { console.error(e); }
  };

  if (selectedPost) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </button>
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[selectedPost.category] || ''}`}>{CAT_LABELS[selectedPost.category]}</span>
            {selectedPost.is_pinned && <span className="text-xs text-blue-600">고정</span>}
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{selectedPost.title}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{selectedPost.view_count}</span>
            <span>{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString('ko-KR') : ''}</span>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPost.content}</div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">댓글 ({selectedPost.comments.length})</h3>
          <div className="space-y-3 mb-4">
            {selectedPost.comments.map((c) => (
              <div key={c.id} className={`text-sm p-3 bg-gray-50 rounded-lg ${c.parent_id ? 'ml-6 border-l-2 border-gray-200' : ''}`}>
                <p className="text-gray-700">{c.content}</p>
                <p className="text-xs text-gray-400 mt-1">{c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : ''}</p>
              </div>
            ))}
            {selectedPost.comments.length === 0 && <p className="text-sm text-gray-400 text-center">댓글이 없습니다</p>}
          </div>
          <div className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="댓글을 입력하세요" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
            <button onClick={handleComment} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">작성</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">게시판</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 글쓰기
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'NOTICE', 'QNA', 'TIP', 'DISCUSSION'].map((c) => (
          <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm ${category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c ? CAT_LABELS[c] : '전체'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {posts.map((p) => (
          <div key={p.id} onClick={() => fetchPost(p.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[p.category] || ''}`}>{CAT_LABELS[p.category]}</span>
            <span className="flex-1 text-sm font-medium text-gray-900 truncate">{p.is_pinned ? '[고정] ' : ''}{p.title}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3 h-3" />{p.view_count}</span>
            <span className="text-xs text-gray-400">{p.comment_count}댓글</span>
            <span className="text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''}</span>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">게시글이 없습니다</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">글쓰기</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">카테고리</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="QNA">Q&A</option>
                  <option value="TIP">팁</option>
                  <option value="DISCUSSION">자유</option>
                </select>
              </div>
              <div><label className="block text-xs text-gray-500 mb-1">제목</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">내용</label><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">취소</button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">작성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

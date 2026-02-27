'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, Plus, Pin, Trash2, Eye } from 'lucide-react';

interface Post {
  id: number; category: string; title: string; is_pinned: boolean;
  view_count: number; comment_count: number; created_at: string;
}

const CAT_LABELS: Record<string, string> = { NOTICE: '공지', QNA: 'Q&A', TIP: '팁', DISCUSSION: '자유' };
const CAT_COLORS: Record<string, string> = { NOTICE: 'bg-red-100 text-red-700', QNA: 'bg-blue-100 text-blue-700', TIP: 'bg-green-100 text-green-700', DISCUSSION: 'bg-gray-100 text-gray-700' };

export default function BrokerBoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ category: 'NOTICE', title: '', content: '', is_pinned: false });
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

  useEffect(() => { fetchPosts(); }, [page, category]);

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/admin/broker/board`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowCreate(false); fetchPosts(); setForm({ category: 'NOTICE', title: '', content: '', is_pinned: false }); }
    } catch (e) { console.error(e); }
  };

  const handlePin = async (id: number) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${apiUrl}/admin/broker/board/${id}/pin`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`${apiUrl}/admin/broker/board/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchPosts();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <MessageSquarePlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">중개인 게시판</h1>
            <p className="text-sm text-gray-500">공지 작성 및 관리</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> 공지 작성
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
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
            {p.is_pinned && <Pin className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${CAT_COLORS[p.category] || ''}`}>{CAT_LABELS[p.category] || p.category}</span>
            <span className="flex-1 text-sm font-medium text-gray-900 truncate">{p.title}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3 h-3" />{p.view_count}</span>
            <span className="text-xs text-gray-400">{p.comment_count}댓글</span>
            <span className="text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''}</span>
            <button onClick={() => handlePin(p.id)} className="p-1 hover:bg-gray-200 rounded"><Pin className="w-3.5 h-3.5 text-gray-400" /></button>
            <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">게시글이 없습니다</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">공지 작성</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">카테고리</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="NOTICE">공지</option><option value="TIP">팁</option><option value="DISCUSSION">자유</option></select></div>
                <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_pinned} onChange={e => setForm({...form, is_pinned: e.target.checked})} /> 상단 고정</label></div>
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

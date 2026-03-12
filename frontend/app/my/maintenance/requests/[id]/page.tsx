'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Send, Clock, CheckCircle2, User, Shield, Loader2,
} from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  is_admin_reply: boolean;
  author_id: string | null;
  created_at: string | null;
}

interface RequestDetail {
  id: number;
  contract_id: number;
  project_name: string | null;
  category: string;
  priority: string;
  title: string;
  content: string;
  status: string;
  resolved_at: string | null;
  created_at: string | null;
  comments: Comment[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  RECEIVED: { label: '접수', color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: '처리중', color: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: '종결', color: 'bg-gray-100 text-gray-600' },
};

const CATEGORY_MAP: Record<string, string> = {
  MODIFICATION: '수정 요청',
  FEATURE: '기능 추가',
  BUG: '버그 신고',
  CONTENT: '콘텐츠 변경',
  OTHER: '기타',
};

const PRIORITY_MAP: Record<string, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export default function RequestDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const requestId = params.id as string;
  const contractId = searchParams.get('contractId');

  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  useEffect(() => {
    fetchDetail();
    fetchCurrentUser();
  }, [requestId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/me`, { headers: getHeaders() });
      if (res.ok) {
        const user = await res.json();
        setCurrentUserId(user.id);
      }
    } catch (e) { /* ignore */ }
  };

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${apiUrl}/maintenance/requests/${requestId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (e) {
      console.error('Failed to fetch request:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/requests/${requestId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: newComment, is_internal: false }),
      });
      if (res.ok) {
        setNewComment('');
        fetchDetail();
      } else {
        const err = await res.json();
        alert(err.detail || '댓글 등록에 실패했습니다.');
      }
    } catch (e) {
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">요청을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const st = STATUS_MAP[detail.status] || STATUS_MAP.RECEIVED;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/my/maintenance/requests?contractId=${contractId || detail.contract_id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{detail.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {CATEGORY_MAP[detail.category] || detail.category}
              </span>
              <span className="text-xs text-gray-400">
                {PRIORITY_MAP[detail.priority] || detail.priority}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                {st.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {detail.project_name || '요청자'}
              </p>
              <p className="text-xs text-gray-400">
                {detail.created_at ? new Date(detail.created_at).toLocaleString('ko-KR') : ''}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {detail.content}
          </div>
          {detail.resolved_at && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">
                {new Date(detail.resolved_at).toLocaleDateString('ko-KR')} 해결됨
              </span>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-3 mb-4">
          {detail.comments.map((c) => {
            const isMe = currentUserId && c.author_id === currentUserId;
            const isAdmin = c.is_admin_reply || (!isMe && c.author_id !== null);

            return (
              <div
                key={c.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isMe
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-100'
                }`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">관리자</span>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'text-white' : 'text-gray-700'}`}>
                    {c.content}
                  </p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {c.created_at ? new Date(c.created_at).toLocaleString('ko-KR') : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment Input */}
        {detail.status !== 'CLOSED' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-end gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="메시지를 입력하세요..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
            />
            <button
              onClick={handleSendComment}
              disabled={sending || !newComment.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

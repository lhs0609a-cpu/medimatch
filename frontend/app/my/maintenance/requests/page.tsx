'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Plus, MessageSquare, Clock, CheckCircle2,
  Loader2, ChevronRight, AlertCircle,
} from 'lucide-react';

interface RequestItem {
  id: number;
  category: string;
  priority: string;
  title: string;
  status: string;
  created_at: string | null;
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

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  LOW: { label: '낮음', color: 'text-gray-400' },
  NORMAL: { label: '보통', color: 'text-blue-500' },
  HIGH: { label: '높음', color: 'text-orange-500' },
  URGENT: { label: '긴급', color: 'text-red-500' },
};

export default function MaintenanceRequestsPage() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    category: 'MODIFICATION',
    priority: 'NORMAL',
    title: '',
    content: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  useEffect(() => {
    if (contractId) fetchRequests();
  }, [contractId]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${apiUrl}/maintenance/${contractId}/requests?size=50`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/${contractId}/requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ category: 'MODIFICATION', priority: 'NORMAL', title: '', content: '' });
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.detail || '요청 등록에 실패했습니다.');
      }
    } catch (e) {
      alert('요청 등록 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  if (!contractId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">계약 정보가 없습니다.</p>
          <Link href="/my/maintenance" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/my/maintenance" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">요청 게시판</h1>
              <p className="text-sm text-gray-500">수정/기능 요청, 버그 신고</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 요청
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">요청이 없습니다</h3>
            <p className="text-sm text-gray-500">수정이나 기능 추가가 필요하면 새 요청을 등록하세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => {
              const st = STATUS_MAP[r.status] || STATUS_MAP.RECEIVED;
              const pr = PRIORITY_MAP[r.priority] || PRIORITY_MAP.NORMAL;
              return (
                <Link
                  key={r.id}
                  href={`/my/maintenance/requests/${r.id}?contractId=${contractId}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {CATEGORY_MAP[r.category] || r.category}
                      </span>
                      <span className={`text-xs ${pr.color}`}>{pr.label}</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 truncate">{r.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                      {st.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">새 요청 등록</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="요청 제목"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="요청 내용을 상세히 작성해주세요"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

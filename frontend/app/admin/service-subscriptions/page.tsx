'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Cog, Search, Filter, Play, Pause,
  Loader2, RefreshCw, ChevronLeft, ChevronRight, Stethoscope
} from 'lucide-react';

interface ServiceSub {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string;
  service_type: string;
  tier: string;
  status: string;
  monthly_amount: number;
  company_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_date: string | null;
  card_info: string | null;
  retry_count: number;
  canceled_at: string | null;
  created_at: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'bg-green-100 text-green-700' },
  CANCELED: { label: '취소예정', color: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { label: '만료', color: 'bg-gray-100 text-gray-600' },
  PAST_DUE: { label: '결제실패', color: 'bg-red-100 text-red-700' },
  SUSPENDED: { label: '정지', color: 'bg-red-200 text-red-800' },
};

const TYPE_LABELS: Record<string, { label: string; icon: typeof Globe }> = {
  HOMEPAGE: { label: '홈페이지', icon: Globe },
  PROGRAM: { label: '프로그램', icon: Cog },
  EMR: { label: 'EMR', icon: Stethoscope },
};

export default function AdminServiceSubscriptionsPage() {
  const [items, setItems] = useState<ServiceSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filterType) params.set('service_type', filterType);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`${API_URL}/api/v1/admin/service-subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'suspend' | 'activate') => {
    if (!confirm(action === 'suspend' ? '이 구독을 정지하시겠습니까?' : '이 구독을 활성화하시겠습니까?')) return;

    try {
      setActionLoading(id);
      const token = localStorage.getItem('access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${API_URL}/api/v1/admin/service-subscriptions/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
    } catch {
      alert('작업에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">서비스 구독 관리</h1>
          <p className="text-sm text-gray-500 mt-1">홈페이지 제작 / 프로그램 개발 / EMR 구독 현황</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">전체 서비스</option>
          <option value="HOMEPAGE">홈페이지</option>
          <option value="PROGRAM">프로그램</option>
          <option value="EMR">EMR</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="CANCELED">취소예정</option>
          <option value="EXPIRED">만료</option>
          <option value="PAST_DUE">결제실패</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">
          총 {total}건
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          해당 조건의 구독이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">서비스</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">고객</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">회사/기관</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">상태</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">월 금액</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">다음 결제</th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const typeInfo = TYPE_LABELS[item.service_type] || { label: item.service_type, icon: Globe };
                  const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-600' };
                  const TypeIcon = typeInfo.icon;

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">{item.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-sm font-medium">{typeInfo.label}</span>
                            <span className="text-xs text-gray-400 ml-1">{item.tier}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{item.user_name || '-'}</div>
                        <div className="text-xs text-gray-400">{item.user_email}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {item.company_name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {item.retry_count > 0 && (
                          <span className="ml-1 text-xs text-red-500">({item.retry_count}회 실패)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        ₩{item.monthly_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.next_billing_date
                          ? new Date(item.next_billing_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'ACTIVE' || item.status === 'PAST_DUE' ? (
                          <button
                            onClick={() => handleAction(item.id, 'suspend')}
                            disabled={actionLoading === item.id}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Pause className="w-3 h-3 inline mr-1" />}
                            정지
                          </button>
                        ) : item.status === 'SUSPENDED' || item.status === 'EXPIRED' ? (
                          <button
                            onClick={() => handleAction(item.id, 'activate')}
                            disabled={actionLoading === item.id}
                            className="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Play className="w-3 h-3 inline mr-1" />}
                            활성화
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total}건
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

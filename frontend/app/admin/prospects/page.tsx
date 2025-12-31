'use client';

import { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Building2,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface Prospect {
  ykiho: string;
  name: string;
  address: string;
  phone: string;
  years_operated: number;
  est_pharmacist_age: number;
  monthly_revenue: number;
  nearby_hospital_count: number;
  nearby_pharmacy_count: number;
  prospect_score: number;
  prospect_grade: string;
  score_factors: string[];
  contact_status: string;
  last_contact_date: string | null;
}

interface ProspectStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  contacted: number;
  interested: number;
  not_contacted: number;
}

export default function ProspectManagePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    fetchProspects();
    fetchStats();
  }, [page, gradeFilter, statusFilter]);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (gradeFilter) params.append('grade', gradeFilter);
      if (statusFilter) params.append('contact_status', statusFilter);
      if (region) params.append('region', region);

      const response = await fetch(`${apiUrl}/pharmacy-prospects?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProspects(data.items || []);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/pharmacy-prospects/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const triggerScan = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/pharmacy-prospects/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('스캔이 시작되었습니다. 완료까지 시간이 걸릴 수 있습니다.');
      }
    } catch (error) {
      console.error('Failed to trigger scan:', error);
    }
  };

  const updateContactStatus = async (ykiho: string, status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      await fetch(`${apiUrl}/pharmacy-prospects/${ykiho}/contact`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      fetchProspects();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getGradeBadge = (grade: string) => {
    const styles: Record<string, string> = {
      HOT: 'bg-rose-100 text-rose-700',
      WARM: 'bg-amber-100 text-amber-700',
      COLD: 'bg-sky-100 text-sky-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[grade] || 'bg-gray-100'}`}>
        {grade}
      </span>
    );
  };

  const getContactBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_contacted: 'bg-gray-100 text-gray-600',
      contacted: 'bg-violet-100 text-violet-700',
      interested: 'bg-emerald-100 text-emerald-700',
      not_interested: 'bg-rose-100 text-rose-700',
    };
    const labels: Record<string, string> = {
      not_contacted: '미연락',
      contacted: '연락완료',
      interested: '관심',
      not_interested: '무관심',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatRevenue = (revenue: number) => {
    if (!revenue) return '-';
    if (revenue >= 100000000) {
      return `월 ${(revenue / 100000000).toFixed(1)}억`;
    }
    return `월 ${(revenue / 10000).toLocaleString()}만`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">약국 타겟팅</h1>
          <p className="text-gray-500 mt-1">양도 가능성이 높은 약국을 분석합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerScan}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            스캔 시작
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
            <Send className="w-4 h-4" />
            대량 발송
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">전체</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">HOT</p>
            <p className="text-2xl font-bold text-rose-600">{stats.hot}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">WARM</p>
            <p className="text-2xl font-bold text-amber-600">{stats.warm}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">COLD</p>
            <p className="text-2xl font-bold text-sky-600">{stats.cold}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">미연락</p>
            <p className="text-2xl font-bold text-gray-600">{stats.not_contacted}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">관심</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.interested}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="지역, 약국명으로 검색..."
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProspects()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">모든 등급</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">모든 상태</option>
            <option value="not_contacted">미연락</option>
            <option value="contacted">연락완료</option>
            <option value="interested">관심</option>
            <option value="not_interested">무관심</option>
          </select>
          <button
            onClick={fetchProspects}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            검색
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">약국</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">점수</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">운영</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">주변</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">분석</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  타겟 약국이 없습니다. 스캔을 시작해주세요.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect.ykiho} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{prospect.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {prospect.address.split(' ').slice(0, 3).join(' ')}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getGradeBadge(prospect.prospect_grade)}
                      <span className="text-sm font-semibold text-gray-900">
                        {prospect.prospect_score}점
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{prospect.years_operated}년</p>
                      <p className="text-gray-500">
                        추정 {prospect.est_pharmacist_age}세
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">
                      {formatRevenue(prospect.monthly_revenue)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="flex items-center gap-1 text-gray-700">
                        <Building2 className="w-3 h-3" />
                        병원 {prospect.nearby_hospital_count}개
                      </p>
                      <p className="flex items-center gap-1 text-gray-500">
                        <Pill className="w-3 h-3" />
                        약국 {prospect.nearby_pharmacy_count}개
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {prospect.score_factors?.slice(0, 2).map((factor, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full truncate max-w-[120px]">
                          {factor.substring(0, 15)}...
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getContactBadge(prospect.contact_status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {prospect.phone && (
                        <a
                          href={`tel:${prospect.phone}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="전화"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => updateContactStatus(prospect.ykiho, 'contacted')}
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                        title="연락 완료"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateContactStatus(prospect.ykiho, 'interested')}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="관심 표시"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              페이지 {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

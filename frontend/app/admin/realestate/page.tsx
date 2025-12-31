'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  address: string;
  floor: string;
  area_pyeong: number;
  listing_type: string;
  rent_deposit: number;
  rent_monthly: number;
  sale_price: number;
  status: string;
  suitable_for: string[];
  view_count: number;
  created_at: string;
}

interface ListingStats {
  total_listings: number;
  available: number;
  reserved: number;
  contracted: number;
}

export default function RealEstateManagePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, [page, statusFilter, typeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('listing_type', typeFilter);
      if (search) params.append('search', search);

      const response = await fetch(`${apiUrl}/realestate?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.items || []);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/realestate/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const triggerCrawl = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/realestate/crawl`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('크롤링이 시작되었습니다. 잠시 후 새로고침하세요.');
      }
    } catch (error) {
      console.error('Failed to trigger crawl:', error);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return '-';
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억`;
    }
    return `${(price / 10000).toLocaleString()}만`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-emerald-100 text-emerald-700',
      RESERVED: 'bg-amber-100 text-amber-700',
      CONTRACTED: 'bg-violet-100 text-violet-700',
      CLOSED: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      AVAILABLE: '가능',
      RESERVED: '예약',
      CONTRACTED: '계약',
      CLOSED: '마감',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">부동산 매물 관리</h1>
          <p className="text-gray-500 mt-1">의료시설 적합 부동산 매물을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerCrawl}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            크롤링 시작
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700">
            <Plus className="w-4 h-4" />
            매물 등록
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">전체 매물</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_listings}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">가능</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">예약</p>
            <p className="text-2xl font-bold text-amber-600">{stats.reserved}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">계약</p>
            <p className="text-2xl font-bold text-violet-600">{stats.contracted}</p>
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
              placeholder="주소, 건물명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">모든 상태</option>
            <option value="AVAILABLE">가능</option>
            <option value="RESERVED">예약</option>
            <option value="CONTRACTED">계약</option>
            <option value="CLOSED">마감</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">모든 유형</option>
            <option value="RENT">임대</option>
            <option value="SALE">매매</option>
            <option value="SUBLEASE">전대</option>
          </select>
          <button
            onClick={fetchListings}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매물</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">면적</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">추천 진료과</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">조회</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  매물이 없습니다.
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{listing.title}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {listing.address}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {listing.listing_type === 'RENT' ? '임대' :
                       listing.listing_type === 'SALE' ? '매매' : '전대'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {listing.area_pyeong?.toFixed(1) || '-'}평
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {listing.listing_type === 'SALE' ? (
                        <span className="text-gray-900 font-medium">
                          {formatPrice(listing.sale_price)}
                        </span>
                      ) : (
                        <>
                          <span className="text-gray-900">
                            {formatPrice(listing.rent_deposit)} / {formatPrice(listing.rent_monthly)}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {listing.suitable_for?.slice(0, 2).map((dept) => (
                        <span key={dept} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(listing.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{listing.view_count}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
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

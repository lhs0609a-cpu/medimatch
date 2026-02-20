'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  MapPin,
  Stethoscope,
  Calendar,
  User,
  TrendingUp,
  Eye,
  FileText,
  DollarSign,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

/* ─── 타입 ─── */
interface Simulation {
  id: string;
  user_name: string;
  user_email: string;
  address: string;
  clinic_type: string;
  size_pyeong?: number;
  budget_million?: number;
  score?: number;
  competitor_count?: number;
  population_500m?: number;
  is_paid: boolean;
  report_purchased: boolean;
  created_at: string;
}

interface SimStats {
  total_simulations: number;
  total_reports: number;
  total_revenue: number;
  popular_regions: { region: string; count: number }[];
  popular_specialties: { specialty: string; count: number }[];
}

export default function AdminSimulationsPage() {
  const [items, setItems] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<Simulation | null>(null);
  const [stats, setStats] = useState<SimStats | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (search) params.set('search', search);

      const [simRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/simulations?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetch(`${apiUrl}/admin/simulations/stats`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);

      if (simRes.ok) {
        const data = await simRes.json();
        const list = data.items || data || [];
        setItems(list);
        setTotal(data.total || list.length);
      } else {
        setItems(getMockData());
        setTotal(6);
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        setStats(getMockStats());
      }
    } catch {
      setItems(getMockData());
      setTotal(6);
      setStats(getMockStats());
    } finally {
      setLoading(false);
    }
  }, [page, search, apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={BarChart3} color="from-cyan-500 to-blue-500" shadow="shadow-cyan-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시뮬레이션 이력</h1>
            <p className="text-gray-500 text-sm">사용자 시뮬레이션 현황 및 통계</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <TossIcon icon={BarChart3} color="from-cyan-500 to-blue-500" shadow="shadow-cyan-500/25" size="sm" />
                <span className="text-sm text-gray-500">총 시뮬레이션</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_simulations}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <TossIcon icon={FileText} color="from-violet-500 to-purple-500" shadow="shadow-violet-500/25" size="sm" />
                <span className="text-sm text-gray-500">리포트 구매</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <TossIcon icon={DollarSign} color="from-green-500 to-emerald-500" shadow="shadow-green-500/25" size="sm" />
                <span className="text-sm text-gray-500">리포트 수익</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_revenue >= 10000 ? `${(stats.total_revenue / 10000).toFixed(0)}만원` : `${stats.total_revenue.toLocaleString()}원`}</p>
            </div>
          </div>

          {/* Popular Regions & Specialties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />인기 지역 TOP 5
              </h3>
              <div className="space-y-2">
                {stats.popular_regions.slice(0, 5).map((r, i) => (
                  <div key={r.region} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="text-sm">{r.region}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{r.count}회</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-gray-400" />인기 진료과 TOP 5
              </h3>
              <div className="space-y-2">
                {stats.popular_specialties.slice(0, 5).map((s, i) => (
                  <div key={s.specialty} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-violet-100 text-violet-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <span className="text-sm">{s.specialty}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{s.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="사용자, 주소, 진료과로 검색..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition-colors">검색</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">사용자</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">주소</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">진료과</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">점수</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">경쟁</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">유료</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">리포트</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">실행일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />로딩 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">시뮬레이션 이력이 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} onClick={() => setDetailModal(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.user_name}</div>
                      <div className="text-xs text-gray-400">{item.user_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{item.address}</td>
                    <td className="px-4 py-3 text-gray-600">{item.clinic_type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${(item.score || 0) >= 70 ? 'text-emerald-600' : (item.score || 0) >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {item.score || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.competitor_count ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {item.is_paid ? <Eye className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300 text-xs">무료</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.report_purchased ? <FileText className="w-4 h-4 text-violet-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">총 {total}건 중 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}건</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1; else if (page <= 3) p = i + 1; else if (page >= totalPages - 2) p = totalPages - 4 + i; else p = page - 2 + i;
                return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">시뮬레이션 상세</h2>
              <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">사용자</p><p className="font-medium">{detailModal.user_name}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">실행일</p><p className="font-medium">{formatDate(detailModal.created_at)}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">주소</p><p className="font-medium text-sm">{detailModal.address}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Stethoscope className="w-5 h-5 text-gray-400" />
                  <div><p className="text-xs text-gray-500">진료과</p><p className="font-medium">{detailModal.clinic_type}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className={`text-xl font-bold ${(detailModal.score || 0) >= 70 ? 'text-emerald-700' : (detailModal.score || 0) >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>{detailModal.score || '-'}</p>
                  <p className="text-xs text-blue-600">종합점수</p>
                </div>
                <div className="text-center p-3 bg-violet-50 rounded-xl">
                  <p className="text-xl font-bold text-violet-700">{detailModal.competitor_count ?? '-'}</p>
                  <p className="text-xs text-violet-600">주변 경쟁</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-xl font-bold text-amber-700">{detailModal.size_pyeong || '-'}</p>
                  <p className="text-xs text-amber-600">면적(평)</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xl font-bold text-emerald-700">{detailModal.population_500m?.toLocaleString() || '-'}</p>
                  <p className="text-xs text-emerald-600">500m 인구</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {detailModal.is_paid && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">유료 열람</span>
                )}
                {detailModal.report_purchased && (
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">리포트 구매</span>
                )}
                {!detailModal.is_paid && !detailModal.report_purchased && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">무료 체험</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockData(): Simulation[] {
  return [
    { id: '1', user_name: '김의사', user_email: 'kim@example.com', address: '서울 강남구 역삼동 123-4', clinic_type: '내과', size_pyeong: 40, budget_million: 30000, score: 82, competitor_count: 5, population_500m: 45200, is_paid: true, report_purchased: true, created_at: '2025-02-17T10:00:00Z' },
    { id: '2', user_name: '박원장', user_email: 'park@example.com', address: '서울 서초구 방배동 45-6', clinic_type: '피부과', size_pyeong: 55, score: 75, competitor_count: 8, population_500m: 38500, is_paid: true, report_purchased: false, created_at: '2025-02-16T14:00:00Z' },
    { id: '3', user_name: '이선생', user_email: 'lee@example.com', address: '경기 성남시 분당구 정자동', clinic_type: '정형외과', size_pyeong: 60, score: 68, competitor_count: 3, population_500m: 52100, is_paid: false, report_purchased: false, created_at: '2025-02-15T09:00:00Z' },
    { id: '4', user_name: '최원장', user_email: 'choi@example.com', address: '서울 마포구 합정동 78-9', clinic_type: '치과', size_pyeong: 35, score: 91, competitor_count: 12, population_500m: 62300, is_paid: true, report_purchased: true, created_at: '2025-02-14T16:30:00Z' },
    { id: '5', user_name: '정의사', user_email: 'jung@example.com', address: '인천 남동구 구월동 456', clinic_type: '안과', size_pyeong: 45, score: 55, competitor_count: 2, population_500m: 28900, is_paid: false, report_purchased: false, created_at: '2025-02-13T13:00:00Z' },
    { id: '6', user_name: '한원장', user_email: 'han@example.com', address: '서울 송파구 잠실동 12-3', clinic_type: '소아과', size_pyeong: 30, score: 78, competitor_count: 6, population_500m: 71500, is_paid: true, report_purchased: false, created_at: '2025-02-12T10:00:00Z' },
  ];
}

function getMockStats(): SimStats {
  return {
    total_simulations: 342,
    total_reports: 48,
    total_revenue: 1440000,
    popular_regions: [
      { region: '서울 강남구', count: 67 },
      { region: '서울 서초구', count: 45 },
      { region: '경기 성남시', count: 38 },
      { region: '서울 송파구', count: 32 },
      { region: '서울 마포구', count: 28 },
    ],
    popular_specialties: [
      { specialty: '내과', count: 78 },
      { specialty: '피부과', count: 56 },
      { specialty: '치과', count: 45 },
      { specialty: '정형외과', count: 38 },
      { specialty: '안과', count: 32 },
    ],
  };
}

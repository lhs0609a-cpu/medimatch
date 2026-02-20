'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  MapPin,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

interface Listing {
  id: string;
  title: string;
  address: string;
  building_name: string | null;
  floor: string;
  area_pyeong: number;
  area_m2: number | null;
  listing_type: string;
  rent_deposit: number;
  rent_monthly: number;
  sale_price: number;
  premium: number | null;
  maintenance_fee: number | null;
  status: string;
  suitable_for: string[];
  previous_use: string | null;
  has_parking: boolean;
  has_elevator: boolean;
  description: string | null;
  features: string[];
  contact_name: string | null;
  contact_phone: string | null;
  contact_company: string | null;
  view_count: number;
  source: string;
  created_at: string;
}

interface ListingStats {
  total_listings: number;
  available: number;
  reserved: number;
  contracted: number;
}

const EMPTY_FORM = {
  title: '', address: '', building_name: '', floor: '', area_pyeong: '',
  listing_type: 'RENT', rent_deposit: '', rent_monthly: '', sale_price: '',
  premium: '', maintenance_fee: '', suitable_for: '',
  previous_use: '', has_parking: false, has_elevator: false,
  description: '', features: '', contact_name: '', contact_phone: '', contact_company: '',
};

export default function RealEstateManagePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [viewItem, setViewItem] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [actionLoading, setActionLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, [page, statusFilter, typeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), page_size: '20' });
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('listing_type', typeFilter);
      if (search) params.append('search', search);

      const response = await fetch(`${apiUrl}/realestate?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
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
      const response = await fetch(`${apiUrl}/realestate/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) setStats(await response.json());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const triggerCrawl = async () => {
    try {
      const response = await fetch(`${apiUrl}/realestate/crawl`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) alert('크롤링이 시작되었습니다.');
    } catch (error) {
      console.error('Failed to trigger crawl:', error);
    }
  };

  const openView = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/realestate/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setViewItem(await res.json());
    } catch (e) {
      console.error('Failed to fetch detail:', e);
    }
  };

  const openEdit = (listing: Listing) => {
    setForm({
      title: listing.title || '',
      address: listing.address || '',
      building_name: listing.building_name || '',
      floor: listing.floor || '',
      area_pyeong: listing.area_pyeong?.toString() || '',
      listing_type: listing.listing_type || 'RENT',
      rent_deposit: listing.rent_deposit?.toString() || '',
      rent_monthly: listing.rent_monthly?.toString() || '',
      sale_price: listing.sale_price?.toString() || '',
      premium: listing.premium?.toString() || '',
      maintenance_fee: listing.maintenance_fee?.toString() || '',
      suitable_for: listing.suitable_for?.join(', ') || '',
      previous_use: listing.previous_use || '',
      has_parking: listing.has_parking || false,
      has_elevator: listing.has_elevator || false,
      description: listing.description || '',
      features: listing.features?.join(', ') || '',
      contact_name: listing.contact_name || '',
      contact_phone: listing.contact_phone || '',
      contact_company: listing.contact_company || '',
    });
    setEditItem(listing);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const handleSave = async () => {
    setActionLoading(true);
    const isEdit = !!editItem;
    const url = isEdit ? `${apiUrl}/realestate/${editItem!.id}` : `${apiUrl}/realestate`;
    const method = isEdit ? 'PATCH' : 'POST';

    const body: any = { title: form.title, address: form.address };
    if (form.building_name) body.building_name = form.building_name;
    if (form.floor) body.floor = form.floor;
    if (form.area_pyeong) body.area_pyeong = parseFloat(form.area_pyeong);
    if (form.listing_type) body.listing_type = form.listing_type;
    if (form.rent_deposit) body.rent_deposit = parseInt(form.rent_deposit);
    if (form.rent_monthly) body.rent_monthly = parseInt(form.rent_monthly);
    if (form.sale_price) body.sale_price = parseInt(form.sale_price);
    if (form.premium) body.premium = parseInt(form.premium);
    if (form.maintenance_fee) body.maintenance_fee = parseInt(form.maintenance_fee);
    if (form.suitable_for) body.suitable_for = form.suitable_for.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (form.previous_use) body.previous_use = form.previous_use;
    body.has_parking = form.has_parking;
    body.has_elevator = form.has_elevator;
    if (form.description) body.description = form.description;
    if (form.features) body.features = form.features.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (form.contact_name) body.contact_name = form.contact_name;
    if (form.contact_phone) body.contact_phone = form.contact_phone;
    if (form.contact_company) body.contact_company = form.contact_company;

    // Edit only sends changed fields
    if (isEdit) {
      const editBody: any = {};
      if (form.title !== editItem!.title) editBody.title = form.title;
      if (form.rent_deposit && parseInt(form.rent_deposit) !== editItem!.rent_deposit) editBody.rent_deposit = parseInt(form.rent_deposit);
      if (form.rent_monthly && parseInt(form.rent_monthly) !== editItem!.rent_monthly) editBody.rent_monthly = parseInt(form.rent_monthly);
      if (form.description !== (editItem!.description || '')) editBody.description = form.description;
      if (form.sale_price && parseInt(form.sale_price) !== editItem!.sale_price) editBody.sale_price = parseInt(form.sale_price);
      if (form.premium && parseInt(form.premium) !== (editItem!.premium || 0)) editBody.premium = parseInt(form.premium);
      if (form.features) editBody.features = form.features.split(',').map((s: string) => s.trim()).filter(Boolean);
      Object.assign(body, editBody);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? body : body),
      });
      if (res.ok) {
        setEditItem(null);
        setShowCreate(false);
        fetchListings();
        fetchStats();
      } else {
        const err = await res.json();
        alert(err.detail || '저장 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/realestate/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setDeleteId(null);
        fetchListings();
        fetchStats();
      } else {
        alert('삭제 실패');
      }
    } catch (e) {
      alert('요청 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (!price) return '-';
    if (price >= 100000000) return `${(price / 100000000).toFixed(1)}억`;
    return `${(price / 10000).toLocaleString()}만`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      AVAILABLE: 'bg-emerald-100 text-emerald-700', RESERVED: 'bg-amber-100 text-amber-700',
      CONTRACTED: 'bg-violet-100 text-violet-700', CLOSED: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = { AVAILABLE: '가능', RESERVED: '예약', CONTRACTED: '계약', CLOSED: '마감' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>;
  };

  const renderFormModal = (title: string, onClose: () => void) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
            <input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">건물명</label>
            <input value={form.building_name} onChange={(e) => setForm({...form, building_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">층</label>
            <input value={form.floor} onChange={(e) => setForm({...form, floor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면적 (평)</label>
            <input type="number" value={form.area_pyeong} onChange={(e) => setForm({...form, area_pyeong: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select value={form.listing_type} onChange={(e) => setForm({...form, listing_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200">
              <option value="RENT">임대</option><option value="SALE">매매</option><option value="SUBLEASE">전대</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보증금</label>
            <input type="number" value={form.rent_deposit} onChange={(e) => setForm({...form, rent_deposit: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월세</label>
            <input type="number" value={form.rent_monthly} onChange={(e) => setForm({...form, rent_monthly: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매매가</label>
            <input type="number" value={form.sale_price} onChange={(e) => setForm({...form, sale_price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">권리금</label>
            <input type="number" value={form.premium} onChange={(e) => setForm({...form, premium: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">추천 진료과 (쉼표 구분)</label>
            <input value={form.suitable_for} onChange={(e) => setForm({...form, suitable_for: e.target.value})}
              placeholder="내과, 피부과, 치과" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이전용도</label>
            <input value={form.previous_use} onChange={(e) => setForm({...form, previous_use: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_parking} onChange={(e) => setForm({...form, has_parking: e.target.checked})}
                className="rounded border-gray-300" /> 주차 가능
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_elevator} onChange={(e) => setForm({...form, has_elevator: e.target.checked})}
                className="rounded border-gray-300" /> 엘리베이터
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
            <input value={form.contact_name} onChange={(e) => setForm({...form, contact_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input value={form.contact_phone} onChange={(e) => setForm({...form, contact_phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">취소</button>
          <button onClick={handleSave} disabled={actionLoading || !form.title || !form.address}
            className="px-6 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
            {actionLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={Building2} color="from-blue-500 to-indigo-500" shadow="shadow-blue-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">부동산 매물 관리</h1>
            <p className="text-gray-500 mt-1">의료시설 적합 부동산 매물을 관리합니다.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={triggerCrawl} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> 크롤링 시작
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700">
            <Plus className="w-4 h-4" /> 매물 등록
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
            <input type="text" placeholder="주소, 건물명으로 검색..." value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">모든 상태</option><option value="AVAILABLE">가능</option><option value="RESERVED">예약</option><option value="CONTRACTED">계약</option><option value="CLOSED">마감</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option value="">모든 유형</option><option value="RENT">임대</option><option value="SALE">매매</option><option value="SUBLEASE">전대</option>
          </select>
          <button onClick={fetchListings} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">검색</button>
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
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">로딩 중...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">매물이 없습니다.</td></tr>
            ) : listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{listing.title}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.address}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{listing.listing_type === 'RENT' ? '임대' : listing.listing_type === 'SALE' ? '매매' : '전대'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{listing.area_pyeong?.toFixed(1) || '-'}평</td>
                <td className="px-6 py-4 text-sm">
                  {listing.listing_type === 'SALE' ? (
                    <span className="text-gray-900 font-medium">{formatPrice(listing.sale_price)}</span>
                  ) : (
                    <span className="text-gray-900">{formatPrice(listing.rent_deposit)} / {formatPrice(listing.rent_monthly)}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {listing.suitable_for?.slice(0, 2).map((dept) => (
                      <span key={dept} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full">{dept}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(listing.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{listing.view_count}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openView(listing.id)} className="p-1 text-gray-400 hover:text-violet-600" title="상세보기"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(listing)} className="p-1 text-gray-400 hover:text-blue-600" title="수정"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(listing.id)} className="p-1 text-gray-400 hover:text-rose-600" title="삭제"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">페이지 {page} / {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">매물 상세</h2>
              <button onClick={() => setViewItem(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <h3 className="text-lg font-bold text-gray-900">{viewItem.title}</h3>
              <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {viewItem.address}</p>
              <div className="grid grid-cols-2 gap-3">
                <p><span className="text-gray-500">유형:</span> {viewItem.listing_type}</p>
                <p><span className="text-gray-500">층:</span> {viewItem.floor || '-'}</p>
                <p><span className="text-gray-500">면적:</span> {viewItem.area_pyeong}평</p>
                <p><span className="text-gray-500">상태:</span> {viewItem.status}</p>
                <p><span className="text-gray-500">보증금:</span> {formatPrice(viewItem.rent_deposit)}</p>
                <p><span className="text-gray-500">월세:</span> {formatPrice(viewItem.rent_monthly)}</p>
                <p><span className="text-gray-500">주차:</span> {viewItem.has_parking ? '가능' : '불가'}</p>
                <p><span className="text-gray-500">엘리베이터:</span> {viewItem.has_elevator ? '있음' : '없음'}</p>
                <p><span className="text-gray-500">출처:</span> {viewItem.source}</p>
                <p><span className="text-gray-500">조회수:</span> {viewItem.view_count}</p>
              </div>
              {viewItem.description && <div><p className="text-gray-500 mb-1">설명</p><p className="text-gray-700 whitespace-pre-line">{viewItem.description}</p></div>}
              {viewItem.contact_name && <p><span className="text-gray-500">담당:</span> {viewItem.contact_name} {viewItem.contact_phone}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && renderFormModal('매물 등록', () => setShowCreate(false))}

      {/* Edit Modal */}
      {editItem && renderFormModal('매물 수정', () => setEditItem(null))}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <span className="text-3xl block mx-auto mb-3">🏠</span>
              <h3 className="text-lg font-bold text-gray-900">매물 삭제</h3>
              <p className="text-sm text-gray-500 mt-1">이 매물을 삭제하시겠습니까? 되돌릴 수 없습니다.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">취소</button>
              <button onClick={handleDelete} disabled={actionLoading} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50">
                {actionLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

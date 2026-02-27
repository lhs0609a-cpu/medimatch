'use client';

import { useState, useEffect } from 'react';
import { Building2, Search, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Listing {
  id: string; title: string; address: string; region_name: string;
  rent_deposit: number; rent_monthly: number; premium: number;
  area_pyeong: number; created_at: string;
}

export default function BrokerListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [claimModal, setClaimModal] = useState<Listing | null>(null);
  const [claimTitle, setClaimTitle] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (region) params.set('region', region);
      const res = await fetch(`${apiUrl}/broker/listings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setListings(d.items); setTotal(d.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [page]);

  const handleClaim = async () => {
    if (!claimModal || !claimTitle) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/broker/deals/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: claimModal.id, title: claimTitle }),
      });
      if (res.ok) {
        const d = await res.json();
        alert(`딜이 생성되었습니다: ${d.deal_number}`);
        setClaimModal(null);
        setClaimTitle('');
      }
    } catch (e) { console.error(e); }
  };

  const fmt = (n: number) => n?.toLocaleString('ko-KR') || '0';
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">매물 검색</h1>
          <p className="text-sm text-gray-500">담당 지역 ACTIVE 매물 {total}건</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={region} onChange={(e) => setRegion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchListings()} placeholder="지역 검색..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {listings.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{l.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <MapPin className="w-3 h-3" /> {l.address}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div><span className="text-gray-400 block">보증금</span><span className="font-medium text-gray-700">{fmt(l.rent_deposit)}원</span></div>
                <div><span className="text-gray-400 block">월세</span><span className="font-medium text-gray-700">{fmt(l.rent_monthly)}원</span></div>
                <div><span className="text-gray-400 block">면적</span><span className="font-medium text-gray-700">{l.area_pyeong || '-'}평</span></div>
              </div>
              <button onClick={() => { setClaimModal(l); setClaimTitle(`${l.title} - 중개 딜`); }} className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                <Plus className="w-4 h-4" /> 딜 생성
              </button>
            </div>
          ))}
          {listings.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">매물이 없습니다</div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* Claim Modal */}
      {claimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">딜 생성</h2>
            <p className="text-sm text-gray-500 mb-4">{claimModal.title}</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">딜 제목</label>
              <input value={claimTitle} onChange={(e) => setClaimTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setClaimModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">취소</button>
              <button onClick={handleClaim} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

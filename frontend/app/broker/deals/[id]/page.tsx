'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send, Building2, User, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DealTimeline from '@/components/broker/DealTimeline';

interface DealDetail {
  id: string; deal_number: string; title: string; description: string;
  status: string; close_reason?: string; close_note?: string;
  expected_rent_deposit?: number; expected_monthly_rent?: number;
  expected_premium?: number; expected_commission?: number;
  actual_rent_deposit?: number; actual_monthly_rent?: number;
  actual_premium?: number; actual_commission?: number;
  landlord_commission?: number; marketing_cost?: number; ad_cost?: number;
  viewing_scheduled_at?: string; viewed_at?: string;
  contract_date?: string; move_in_date?: string;
  broker_notes?: string; activity_log: any[];
  circumvention_flag: boolean; lead_source?: string; lead_score?: number;
  doctor?: { id: string; name: string; specialty?: string; opening_status?: string; opening_region?: string };
  listing?: { id: string; title: string; address: string; rent_deposit?: number; rent_monthly?: number; premium?: number };
  commissions: { id: number; commission_type: string; gross_amount: number; net_amount: number; payment_status: string }[];
  created_at: string; updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  LEAD: '리드', CONTACTED: '컨택 완료', VIEWING_SCHEDULED: '내방 예정', VIEWED: '내방 완료',
  NEGOTIATING: '협상 중', CONTRACT_PENDING: '계약 대기', CONTRACTED: '계약 완료',
  CLOSED_WON: '성사', CLOSED_LOST: '종료',
};

const NEXT_STATUS: Record<string, string> = {
  LEAD: 'CONTACTED', CONTACTED: 'VIEWING_SCHEDULED', VIEWING_SCHEDULED: 'VIEWED',
  VIEWED: 'NEGOTIATING', NEGOTIATING: 'CONTRACT_PENDING',
  CONTRACT_PENDING: 'CONTRACTED', CONTRACTED: 'CLOSED_WON',
};

const CLOSE_REASONS: Record<string, string> = {
  DOCTOR_CANCELLED: '의사 취소', LANDLORD_CANCELLED: '건물주 취소',
  PRICE_MISMATCH: '가격 불일치', LOCATION_MISMATCH: '입지 불일치',
  COMPETITOR: '타 중개사', CIRCUMVENTION: '우회 거래', OTHER: '기타',
};

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [showClose, setShowClose] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchDeal = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${apiUrl}/broker/deals/${dealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDeal(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeal(); }, [dealId]);

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const body: any = { new_status: newStatus, note: statusNote };
      if (reason) body.close_reason = reason;
      const res = await fetch(`${apiUrl}/broker/deals/${dealId}/update-status`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { setStatusNote(''); setShowClose(false); fetchDeal(); }
      else { const err = await res.json(); alert(err.detail || '오류'); }
    } catch (e) { console.error(e); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${apiUrl}/broker/deals/${dealId}/log`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      setNote('');
      fetchDeal();
    } catch (e) { console.error(e); }
  };

  const fmt = (n?: number) => (n || 0).toLocaleString('ko-KR');

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  if (!deal) return <div className="p-8 text-center text-gray-500">딜을 찾을 수 없습니다</div>;

  const nextStatus = NEXT_STATUS[deal.status];
  const isTerminal = ['CLOSED_WON', 'CLOSED_LOST'].includes(deal.status);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/broker/deals" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{deal.title}</h1>
            {deal.circumvention_flag && <AlertTriangle className="w-5 h-5 text-red-500" />}
          </div>
          <p className="text-sm text-gray-500">{deal.deal_number}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
          {STATUS_LABELS[deal.status] || deal.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-4">
          {/* Status Actions */}
          {!isTerminal && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">상태 변경</h3>
              <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="메모 (선택)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3" />
              <div className="flex gap-2">
                {nextStatus && (
                  <button onClick={() => handleStatusChange(nextStatus)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    {STATUS_LABELS[nextStatus]}으로 진행
                  </button>
                )}
                <button onClick={() => setShowClose(!showClose)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                  딜 종료
                </button>
              </div>
              {showClose && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <select value={closeReason} onChange={(e) => setCloseReason(e.target.value)} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm mb-2">
                    <option value="">종료 사유 선택</option>
                    {Object.entries(CLOSE_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={() => closeReason && handleStatusChange('CLOSED_LOST', closeReason)} disabled={!closeReason} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50">
                    딜 종료
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">활동 이력</h3>
            <DealTimeline logs={deal.activity_log} />
          </div>

          {/* Add Note */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">메모 추가</h3>
            <div className="flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="메모를 입력하세요" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
              <button onClick={handleAddNote} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Financial */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-700">재무 정보</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">보증금</span><span className="font-medium">{fmt(deal.actual_rent_deposit || deal.expected_rent_deposit)}원</span></div>
              <div className="flex justify-between"><span className="text-gray-500">월세</span><span className="font-medium">{fmt(deal.actual_monthly_rent || deal.expected_monthly_rent)}원</span></div>
              <div className="flex justify-between"><span className="text-gray-500">권리금</span><span className="font-medium">{fmt(deal.actual_premium || deal.expected_premium)}원</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="text-gray-700 font-medium">수수료</span><span className="font-bold text-green-600">{fmt(deal.actual_commission || deal.expected_commission)}원</span></div>
            </div>
          </div>

          {/* Doctor */}
          {deal.doctor && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">의사 정보</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{deal.doctor.name}</p>
                {deal.doctor.specialty && <p className="text-gray-500">{deal.doctor.specialty}</p>}
                {deal.doctor.opening_region && <p className="text-gray-500">희망지역: {deal.doctor.opening_region}</p>}
                {deal.doctor.opening_status && <p className="text-gray-500">상태: {deal.doctor.opening_status}</p>}
              </div>
            </div>
          )}

          {/* Listing */}
          {deal.listing && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-semibold text-gray-700">매물 정보</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{deal.listing.title}</p>
                <p className="text-gray-500">{deal.listing.address}</p>
                <p className="text-gray-500">보증금 {fmt(deal.listing.rent_deposit)} / 월세 {fmt(deal.listing.rent_monthly)}</p>
              </div>
            </div>
          )}

          {/* Commissions */}
          {deal.commissions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">커미션</h3>
              <div className="space-y-2">
                {deal.commissions.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">{c.commission_type}</span>
                    <div className="text-right">
                      <p className="font-medium">{fmt(c.net_amount)}원</p>
                      <p className="text-xs text-gray-400">{c.payment_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

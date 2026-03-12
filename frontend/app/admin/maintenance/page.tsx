'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Wrench,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Send,
  AlertTriangle,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
  Users,
  CreditCard,
  Clock,
  MessageSquare,
  Trash2,
  Edit3,
  Save,
  Mail,
  Bell,
  FileText,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface DashboardData {
  mrr: number;
  total_contracts: number;
  active_count: number;
  past_due_count: number;
  pending_setup_count: number;
  suspended_count: number;
  canceled_count: number;
  this_month_billing_count: number;
  pending_requests_count: number;
}

interface Contract {
  id: number;
  project_name: string;
  service_type: string;
  monthly_amount: number;
  billing_day: number;
  status: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  description: string | null;
  admin_memo: string | null;
  next_billing_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  user_email: string | null;
}

interface MaintRequest {
  id: number;
  contract_id: number;
  project_name: string;
  company_name: string;
  category: string;
  title: string;
  description: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  comments: RequestComment[];
}

interface RequestComment {
  id: number;
  content: string;
  is_internal: boolean;
  author_name: string;
  created_at: string;
}

interface Preset {
  id: number;
  name: string;
  amount: number;
  description: string | null;
  sort_order: number;
}

// ============================================================
// Constants
// ============================================================

type TabKey = 'dashboard' | 'contracts' | 'requests' | 'presets';

const CONTRACT_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_SETUP: { label: '미등록', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ACTIVE:        { label: '정상',   bg: 'bg-green-100',  text: 'text-green-700' },
  PAST_DUE:      { label: '미납',   bg: 'bg-red-100',    text: 'text-red-700' },
  SUSPENDED:     { label: '정지',   bg: 'bg-red-100',    text: 'text-red-700' },
  CANCELED:      { label: '해지',   bg: 'bg-gray-100',   text: 'text-gray-500' },
  EXPIRED:       { label: '만료',   bg: 'bg-gray-100',   text: 'text-gray-500' },
};

const SERVICE_TYPES: Record<string, string> = {
  HOMEPAGE: '홈페이지',
  PROGRAM: '프로그램',
};

const REQUEST_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  RECEIVED:    { label: '접수',   bg: 'bg-blue-100',   text: 'text-blue-700' },
  IN_PROGRESS: { label: '처리중', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COMPLETED:   { label: '완료',   bg: 'bg-green-100',  text: 'text-green-700' },
  CLOSED:      { label: '종결',   bg: 'bg-gray-100',   text: 'text-gray-500' },
};

const REQUEST_CATEGORY: Record<string, string> = {
  MODIFICATION: '수정',
  FEATURE: '기능추가',
  BUG: '버그',
  CONTENT: '콘텐츠',
  OTHER: '기타',
};

const EMPTY_FORM = {
  service_type: 'HOMEPAGE',
  project_name: '',
  monthly_amount: 0,
  billing_day: 1,
  company_name: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  description: '',
  admin_memo: '',
};

// ============================================================
// Component
// ============================================================

export default function AdminMaintenancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // Contracts
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractTotal, setContractTotal] = useState(0);
  const [contractPage, setContractPage] = useState(1);
  const [contractStatusFilter, setContractStatusFilter] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState('');
  const [contractSearch, setContractSearch] = useState('');
  const [contractSearchInput, setContractSearchInput] = useState('');
  const [contractLoading, setContractLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [editMemoId, setEditMemoId] = useState<number | null>(null);
  const [editMemoText, setEditMemoText] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
  const [createLoading, setCreateLoading] = useState(false);

  // Requests
  const [requests, setRequests] = useState<MaintRequest[]>([]);
  const [requestTotal, setRequestTotal] = useState(0);
  const [requestPage, setRequestPage] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [requestLoading, setRequestLoading] = useState(true);
  const [replyRequestId, setReplyRequestId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState<number | null>(null);

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetLoading, setPresetLoading] = useState(true);
  const [editPresetId, setEditPresetId] = useState<number | null>(null);
  const [presetForm, setPresetForm] = useState({ name: '', amount: 0, description: '', sort_order: 0 });
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);

  const pageSize = 20;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const getToken = () => localStorage.getItem('access_token') || '';

  // ============================================================
  // Fetch helpers
  // ============================================================

  const fetchDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/admin/dashboard`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setDashLoading(false);
    }
  }, [apiUrl]);

  const fetchContracts = useCallback(async () => {
    setContractLoading(true);
    try {
      const params = new URLSearchParams({ page: contractPage.toString(), size: pageSize.toString() });
      if (contractStatusFilter) params.set('status', contractStatusFilter);
      if (contractTypeFilter) params.set('service_type', contractTypeFilter);
      if (contractSearch) params.set('search', contractSearch);

      const res = await fetch(`${apiUrl}/maintenance/admin/contracts?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.items || []);
        setContractTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Contracts fetch error:', e);
    } finally {
      setContractLoading(false);
    }
  }, [apiUrl, contractPage, contractStatusFilter, contractTypeFilter, contractSearch]);

  const fetchRequests = useCallback(async () => {
    setRequestLoading(true);
    try {
      const params = new URLSearchParams({ page: requestPage.toString(), size: pageSize.toString() });
      if (requestStatusFilter) params.set('status', requestStatusFilter);

      const res = await fetch(`${apiUrl}/maintenance/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items || []);
        setRequestTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Requests fetch error:', e);
    } finally {
      setRequestLoading(false);
    }
  }, [apiUrl, requestPage, requestStatusFilter]);

  const fetchPresets = useCallback(async () => {
    setPresetLoading(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/admin/presets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPresets(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error('Presets fetch error:', e);
    } finally {
      setPresetLoading(false);
    }
  }, [apiUrl]);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'contracts') fetchContracts();
    else if (activeTab === 'requests') fetchRequests();
    else if (activeTab === 'presets') fetchPresets();
  }, [activeTab, fetchDashboard, fetchContracts, fetchRequests, fetchPresets]);

  // ============================================================
  // Actions
  // ============================================================

  const handleCreateContract = async () => {
    setCreateLoading(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/admin/contracts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ ...EMPTY_FORM });
        fetchContracts();
        fetchDashboard();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.detail || '생성에 실패했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleContractAction = async (id: number, action: 'suspend' | 'activate') => {
    const msg = action === 'suspend' ? '이 계약을 정지하시겠습니까?' : '이 계약을 활성화하시겠습니까?';
    if (!confirm(msg)) return;
    setActionLoading(id);
    try {
      await fetch(`${apiUrl}/maintenance/admin/contracts/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchContracts();
      fetchDashboard();
    } catch {
      alert('작업에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendReminder = async (id: number) => {
    if (!confirm('독촉 메일을 발송하시겠습니까?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${apiUrl}/maintenance/admin/contracts/${id}/send-reminder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        alert('독촉 메일이 발송되었습니다.');
      } else {
        alert('발송에 실패했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvite = async (id: number) => {
    if (!confirm('초대 메일을 발송하시겠습니까?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${apiUrl}/maintenance/admin/contracts/${id}/send-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        alert('초대 메일이 발송되었습니다.');
      } else {
        alert('발송에 실패했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveMemo = async (id: number) => {
    try {
      await fetch(`${apiUrl}/maintenance/admin/contracts/${id}/memo`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: editMemoText }),
      });
      setEditMemoId(null);
      fetchContracts();
    } catch {
      alert('메모 저장에 실패했습니다.');
    }
  };

  const handleRequestStatusChange = async (requestId: number, newStatus: string) => {
    setStatusChangeLoading(requestId);
    try {
      await fetch(`${apiUrl}/maintenance/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRequests();
    } catch {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const handleReplySubmit = async (requestId: number) => {
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`${apiUrl}/maintenance/requests/${requestId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent, is_internal: replyInternal }),
      });
      if (res.ok) {
        setReplyContent('');
        setReplyInternal(false);
        setReplyRequestId(null);
        fetchRequests();
      }
    } catch {
      alert('댓글 등록에 실패했습니다.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleSavePreset = async (id?: number) => {
    setPresetSaving(true);
    try {
      const url = id
        ? `${apiUrl}/maintenance/admin/presets/${id}`
        : `${apiUrl}/maintenance/admin/presets`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presetForm),
      });
      if (res.ok) {
        setEditPresetId(null);
        setShowNewPreset(false);
        setPresetForm({ name: '', amount: 0, description: '', sort_order: 0 });
        fetchPresets();
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setPresetSaving(false);
    }
  };

  const handleDeletePreset = async (id: number) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return;
    try {
      await fetch(`${apiUrl}/maintenance/admin/presets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchPresets();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  // ============================================================
  // Helpers
  // ============================================================

  const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString() + '원';
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const contractTotalPages = Math.ceil(contractTotal / pageSize);
  const requestTotalPages = Math.ceil(requestTotal / pageSize);

  const refreshCurrent = () => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'contracts') fetchContracts();
    else if (activeTab === 'requests') fetchRequests();
    else if (activeTab === 'presets') fetchPresets();
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리유지비 관리</h1>
            <p className="text-sm text-gray-500">유지보수 계약 및 요청을 관리합니다</p>
          </div>
        </div>
        <button
          onClick={refreshCurrent}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${dashLoading || contractLoading || requestLoading || presetLoading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'dashboard' as TabKey, label: '대시보드', icon: BarChart3 },
          { key: 'contracts' as TabKey, label: '고객사 목록', icon: Users },
          { key: 'requests' as TabKey, label: '요청 관리', icon: MessageSquare },
          { key: 'presets' as TabKey, label: '플랜 프리셋', icon: FileText },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Dashboard Tab                                                 */}
      {/* ============================================================ */}
      {activeTab === 'dashboard' && (
        <>
          {dashLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : dashboard ? (
            <div className="space-y-6">
              {/* MRR Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <p className="text-blue-100 text-sm mb-1">월 반복 매출 (MRR)</p>
                <p className="text-4xl font-bold">{dashboard.mrr.toLocaleString()}원</p>
                <p className="text-blue-200 text-sm mt-2">총 {dashboard.total_contracts}건의 계약</p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm text-gray-500">정상</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{dashboard.active_count}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-sm text-gray-500">미납</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{dashboard.past_due_count}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <p className="text-sm text-gray-500">미등록</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{dashboard.pending_setup_count}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">이번달 청구</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{dashboard.this_month_billing_count}건</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">대기 요청</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{dashboard.pending_requests_count}건</p>
                </div>
              </div>

              {/* Quick counts row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">정지</p>
                  <p className="text-xl font-bold text-red-600">{dashboard.suspended_count}건</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">해지</p>
                  <p className="text-xl font-bold text-gray-500">{dashboard.canceled_count}건</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">대시보드 데이터를 불러올 수 없습니다.</div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* Contracts Tab                                                 */}
      {/* ============================================================ */}
      {activeTab === 'contracts' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트명, 고객사, 이메일 검색..."
                value={contractSearchInput}
                onChange={(e) => setContractSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setContractSearch(contractSearchInput);
                    setContractPage(1);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <select
              value={contractStatusFilter}
              onChange={(e) => { setContractStatusFilter(e.target.value); setContractPage(1); }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">전체 상태</option>
              {Object.entries(CONTRACT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={contractTypeFilter}
              onChange={(e) => { setContractTypeFilter(e.target.value); setContractPage(1); }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">전체 서비스</option>
              {Object.entries(SERVICE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              onClick={() => { setContractSearch(contractSearchInput); setContractPage(1); }}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
            >
              검색
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> 계약 추가
            </button>
          </div>

          {/* Contract List */}
          {contractLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">해당 조건의 계약이 없습니다.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">서비스</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">프로젝트명</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">고객사</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500">상태</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-gray-500">월 금액</th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-500">결제일</th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-500">액션</th>
                      <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => {
                      const st = CONTRACT_STATUS[c.status] || { label: c.status, bg: 'bg-gray-100', text: 'text-gray-600' };
                      const isExpanded = expandedId === c.id;

                      return (
                        <Fragment key={c.id}>
                          <tr className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">{c.id}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {SERVICE_TYPES[c.service_type] || c.service_type}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{c.project_name}</div>
                              {c.user_email && <div className="text-xs text-gray-400">{c.user_email}</div>}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-700">{c.company_name || '-'}</div>
                              <div className="text-xs text-gray-400">{c.contact_person || ''}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium">{formatPrice(c.monthly_amount)}</td>
                            <td className="py-3 px-4 text-sm text-center text-gray-600">매월 {c.billing_day}일</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                {c.status === 'PAST_DUE' && (
                                  <button
                                    onClick={() => handleSendReminder(c.id)}
                                    disabled={actionLoading === c.id}
                                    className="px-2.5 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                                    title="독촉 메일 발송"
                                  >
                                    {actionLoading === c.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Bell className="w-3 h-3 inline mr-0.5" />}
                                    독촉
                                  </button>
                                )}
                                {c.status === 'PENDING_SETUP' && (
                                  <button
                                    onClick={() => handleSendInvite(c.id)}
                                    disabled={actionLoading === c.id}
                                    className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    title="초대 메일 발송"
                                  >
                                    {actionLoading === c.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Mail className="w-3 h-3 inline mr-0.5" />}
                                    초대
                                  </button>
                                )}
                                {(c.status === 'ACTIVE' || c.status === 'PAST_DUE') && (
                                  <button
                                    onClick={() => handleContractAction(c.id, 'suspend')}
                                    disabled={actionLoading === c.id}
                                    className="px-2.5 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                  >
                                    {actionLoading === c.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Pause className="w-3 h-3 inline mr-0.5" />}
                                    정지
                                  </button>
                                )}
                                {(c.status === 'SUSPENDED' || c.status === 'EXPIRED') && (
                                  <button
                                    onClick={() => handleContractAction(c.id, 'activate')}
                                    disabled={actionLoading === c.id}
                                    className="px-2.5 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                  >
                                    {actionLoading === c.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Play className="w-3 h-3 inline mr-0.5" />}
                                    활성화
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                {isExpanded
                                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                                }
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="bg-gray-50 border-b border-gray-200">
                                <div className="p-5 space-y-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">담당자</span>
                                      <span className="text-gray-900">{c.contact_person || '-'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">이메일</span>
                                      <span className="text-gray-900">{c.contact_email || '-'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">전화번호</span>
                                      <span className="text-gray-900">{c.contact_phone || '-'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">다음 결제일</span>
                                      <span className="text-gray-900">{formatDate(c.next_billing_date)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">생성일</span>
                                      <span className="text-gray-900">{formatDate(c.created_at)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 block text-xs mb-0.5">수정일</span>
                                      <span className="text-gray-900">{formatDate(c.updated_at)}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-gray-500 block text-xs mb-0.5">설명</span>
                                      <span className="text-gray-900">{c.description || '-'}</span>
                                    </div>
                                  </div>

                                  {/* Admin Memo */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-gray-500">관리자 메모</span>
                                      {editMemoId !== c.id && (
                                        <button
                                          onClick={() => { setEditMemoId(c.id); setEditMemoText(c.admin_memo || ''); }}
                                          className="text-xs text-blue-600 hover:underline"
                                        >
                                          편집
                                        </button>
                                      )}
                                    </div>
                                    {editMemoId === c.id ? (
                                      <div className="flex gap-2">
                                        <textarea
                                          value={editMemoText}
                                          onChange={(e) => setEditMemoText(e.target.value)}
                                          rows={2}
                                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                        />
                                        <div className="flex flex-col gap-1">
                                          <button
                                            onClick={() => handleSaveMemo(c.id)}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                                          >
                                            <Save className="w-3 h-3 inline mr-0.5" /> 저장
                                          </button>
                                          <button
                                            onClick={() => setEditMemoId(null)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"
                                          >
                                            취소
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-100">
                                        {c.admin_memo || '(메모 없음)'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {contractTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {(contractPage - 1) * pageSize + 1}-{Math.min(contractPage * pageSize, contractTotal)} / {contractTotal}건
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setContractPage((p) => Math.max(1, p - 1))}
                      disabled={contractPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{contractPage} / {contractTotalPages}</span>
                    <button
                      onClick={() => setContractPage((p) => Math.min(contractTotalPages, p + 1))}
                      disabled={contractPage === contractTotalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* Requests Tab                                                  */}
      {/* ============================================================ */}
      {activeTab === 'requests' && (
        <>
          {/* Filter */}
          <div className="flex items-center gap-3 mb-6">
            <select
              value={requestStatusFilter}
              onChange={(e) => { setRequestStatusFilter(e.target.value); setRequestPage(1); }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">전체 상태</option>
              {Object.entries(REQUEST_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <span className="ml-auto text-sm text-gray-500">총 {requestTotal}건</span>
          </div>

          {/* Request List */}
          {requestLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 text-gray-500">해당 조건의 요청이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const rs = REQUEST_STATUS[req.status] || { label: req.status, bg: 'bg-gray-100', text: 'text-gray-600' };
                const cat = REQUEST_CATEGORY[req.category] || req.category;

                return (
                  <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Request Header */}
                    <div className="p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rs.bg} ${rs.text}`}>
                            {rs.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {cat}
                          </span>
                          <span className="text-xs text-gray-400">#{req.id}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{req.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{req.project_name}</span>
                          <span>{req.company_name}</span>
                          <span>{formatDateTime(req.created_at)}</span>
                        </div>
                      </div>

                      {/* Status Change */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={req.status}
                          onChange={(e) => handleRequestStatusChange(req.id, e.target.value)}
                          disabled={statusChangeLoading === req.id}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                        >
                          {Object.entries(REQUEST_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        {statusChangeLoading === req.id && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                      </div>
                    </div>

                    {/* Comments */}
                    {req.comments && req.comments.length > 0 && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                        {req.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`text-sm rounded-lg px-3 py-2 ${
                              comment.is_internal
                                ? 'bg-yellow-50 border border-yellow-100'
                                : 'bg-white border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                              <span className="font-medium text-gray-600">{comment.author_name}</span>
                              {comment.is_internal && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px]">내부</span>
                              )}
                              <span>{formatDateTime(comment.created_at)}</span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply */}
                    <div className="border-t border-gray-100 px-4 py-3">
                      {replyRequestId === req.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="답변을 입력하세요..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-gray-500">
                              <input
                                type="checkbox"
                                checked={replyInternal}
                                onChange={(e) => setReplyInternal(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              내부 메모 (고객에게 비공개)
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setReplyRequestId(null); setReplyContent(''); setReplyInternal(false); }}
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleReplySubmit(req.id)}
                                disabled={replyLoading || !replyContent.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                {replyLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                등록
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyRequestId(req.id)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> 답변 작성
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {requestTotalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-3">
                  <span className="text-sm text-gray-500">
                    {(requestPage - 1) * pageSize + 1}-{Math.min(requestPage * pageSize, requestTotal)} / {requestTotal}건
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                      disabled={requestPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{requestPage} / {requestTotalPages}</span>
                    <button
                      onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
                      disabled={requestPage === requestTotalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* Presets Tab                                                    */}
      {/* ============================================================ */}
      {activeTab === 'presets' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">금액 프리셋을 관리합니다. 계약 생성 시 빠르게 금액을 선택할 수 있습니다.</p>
            <button
              onClick={() => {
                setShowNewPreset(true);
                setEditPresetId(null);
                setPresetForm({ name: '', amount: 0, description: '', sort_order: presets.length });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> 프리셋 추가
            </button>
          </div>

          {presetLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* New preset form */}
              {showNewPreset && (
                <div className="bg-white rounded-xl border-2 border-blue-200 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">새 프리셋</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">이름</label>
                      <input
                        type="text"
                        value={presetForm.name}
                        onChange={(e) => setPresetForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="예: 기본 홈페이지"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">금액</label>
                      <input
                        type="number"
                        value={presetForm.amount || ''}
                        onChange={(e) => setPresetForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">설명</label>
                      <input
                        type="text"
                        value={presetForm.description}
                        onChange={(e) => setPresetForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="설명 (선택)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
                      <input
                        type="number"
                        value={presetForm.sort_order}
                        onChange={(e) => setPresetForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => { setShowNewPreset(false); setPresetForm({ name: '', amount: 0, description: '', sort_order: 0 }); }}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleSavePreset()}
                      disabled={presetSaving || !presetForm.name || !presetForm.amount}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {presetSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      저장
                    </button>
                  </div>
                </div>
              )}

              {/* Preset List */}
              {presets.length === 0 && !showNewPreset ? (
                <div className="text-center py-20 text-gray-500">등록된 프리셋이 없습니다.</div>
              ) : (
                presets.map((preset) => {
                  const isEditing = editPresetId === preset.id;

                  return (
                    <div key={preset.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">이름</label>
                              <input
                                type="text"
                                value={presetForm.name}
                                onChange={(e) => setPresetForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">금액</label>
                              <input
                                type="number"
                                value={presetForm.amount || ''}
                                onChange={(e) => setPresetForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">설명</label>
                              <input
                                type="text"
                                value={presetForm.description}
                                onChange={(e) => setPresetForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
                              <input
                                type="number"
                                value={presetForm.sort_order}
                                onChange={(e) => setPresetForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => { setEditPresetId(null); setPresetForm({ name: '', amount: 0, description: '', sort_order: 0 }); }}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSavePreset(preset.id)}
                              disabled={presetSaving || !presetForm.name || !presetForm.amount}
                              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {presetSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              저장
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{preset.name}</h3>
                              {preset.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-blue-600">{formatPrice(preset.amount)}</span>
                            <span className="text-xs text-gray-400">순서: {preset.sort_order}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditPresetId(preset.id);
                                setShowNewPreset(false);
                                setPresetForm({
                                  name: preset.name,
                                  amount: preset.amount,
                                  description: preset.description || '',
                                  sort_order: preset.sort_order,
                                });
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                              title="편집"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* Create Contract Modal                                         */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">새 유지보수 계약</h2>
              <button
                onClick={() => { setShowCreateModal(false); setCreateForm({ ...EMPTY_FORM }); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">서비스 종류</label>
                <select
                  value={createForm.service_type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, service_type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {Object.entries(SERVICE_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
                <input
                  type="text"
                  value={createForm.project_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, project_name: e.target.value }))}
                  placeholder="예: 메디플라톤 홈페이지"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Amount + Preset Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={createForm.monthly_amount || ''}
                    onChange={(e) => setCreateForm((f) => ({ ...f, monthly_amount: Number(e.target.value) }))}
                    placeholder="0"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-sm text-gray-500">원/월</span>
                </div>
                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCreateForm((f) => ({ ...f, monthly_amount: p.amount }))}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          createForm.monthly_amount === p.amount
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p.name} ({formatPrice(p.amount)})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">결제일</label>
                <select
                  value={createForm.billing_day}
                  onChange={(e) => setCreateForm((f) => ({ ...f, billing_day: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>매월 {d}일</option>
                  ))}
                </select>
              </div>

              {/* Company & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">고객사명</label>
                  <input
                    type="text"
                    value={createForm.company_name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, company_name: e.target.value }))}
                    placeholder="병원/약국명"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자명</label>
                  <input
                    type="text"
                    value={createForm.contact_person}
                    onChange={(e) => setCreateForm((f) => ({ ...f, contact_person: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={createForm.contact_email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, contact_email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={createForm.contact_phone}
                    onChange={(e) => setCreateForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="프로젝트 설명 (선택)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* Admin Memo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모</label>
                <textarea
                  value={createForm.admin_memo}
                  onChange={(e) => setCreateForm((f) => ({ ...f, admin_memo: e.target.value }))}
                  rows={2}
                  placeholder="내부 메모 (선택)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => { setShowCreateModal(false); setCreateForm({ ...EMPTY_FORM }); }}
                className="px-5 py-2.5 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleCreateContract}
                disabled={createLoading || !createForm.project_name || !createForm.company_name || !createForm.monthly_amount}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                계약 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

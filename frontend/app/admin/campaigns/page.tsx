'use client';

import { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  Plus,
  Eye,
  Play,
  Pause,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
} from 'lucide-react';
import { TossIcon } from '@/components/ui/TossIcon';

interface CampaignStats {
  sms_balance: number;
  total_sent: number;
  by_grade: Record<string, number>;
}

interface CampaignHistoryItem {
  id: string;
  name: string;
  campaign_type: string;
  target_grade: string;
  status: string;
  total_targets: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function CampaignManagePage() {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignType, setCampaignType] = useState<'SMS' | 'EMAIL'>('SMS');
  const [targetGrade, setTargetGrade] = useState<'HOT' | 'WARM' | 'COLD'>('HOT');
  const [limit, setLimit] = useState(100);
  const [sending, setSending] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');
  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchTemplate();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/campaigns/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/campaigns/templates/sms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSmsTemplate(data.template);
        previewTemplate(data.template);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  };

  const previewTemplate = async (template: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/campaigns/preview?template=${encodeURIComponent(template)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewMessage(data.rendered);
      }
    } catch (error) {
      setPreviewMessage(template);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/campaigns/history?page_size=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const startCampaign = async () => {
    if (!confirm(`${targetGrade} 등급 타겟 ${limit}명에게 ${campaignType}를 발송하시겠습니까?`)) {
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${apiUrl}/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${targetGrade} 타겟 ${campaignType} 캠페인`,
          campaign_type: campaignType,
          target_grade: targetGrade,
          limit: limit,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`캠페인이 시작되었습니다!\nID: ${result.id}`);
        setShowNewCampaign(false);
        fetchStats();
        fetchHistory();
      } else {
        alert('캠페인 시작에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to start campaign:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TossIcon icon={Send} color="from-blue-400 to-cyan-500" shadow="shadow-blue-500/25" size="md" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">아웃바운드 캠페인</h1>
            <p className="text-gray-500 mt-1">SMS/이메일 캠페인을 관리합니다.</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700"
        >
          <Plus className="w-4 h-4" />
          새 캠페인
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <TossIcon icon={Wallet} color="from-green-500 to-emerald-500" shadow="shadow-green-500/25" size="sm" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : stats?.sms_balance?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">SMS 잔액 (원)</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <TossIcon icon={CheckCircle} color="from-emerald-500 to-teal-500" shadow="shadow-emerald-500/25" size="sm" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : stats?.total_sent || 0}
          </p>
          <p className="text-sm text-gray-500">발송 완료</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <TossIcon icon={TrendingUp} color="from-rose-500 to-pink-500" shadow="shadow-rose-500/25" size="sm" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '-' : stats?.by_grade?.HOT || 0}
          </p>
          <p className="text-sm text-gray-500">HOT 발송</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <TossIcon icon={Clock} color="from-amber-500 to-orange-500" shadow="shadow-amber-500/25" size="sm" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
          <p className="text-sm text-gray-500">예약 대기</p>
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">새 캠페인 시작</h2>

            {/* Campaign Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발송 채널
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setCampaignType('SMS')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    campaignType === 'SMS'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${
                    campaignType === 'SMS' ? 'text-sky-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    campaignType === 'SMS' ? 'text-sky-700' : 'text-gray-600'
                  }`}>SMS</p>
                </button>
                <button
                  onClick={() => setCampaignType('EMAIL')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    campaignType === 'EMAIL'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail className={`w-6 h-6 mx-auto mb-2 ${
                    campaignType === 'EMAIL' ? 'text-sky-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium ${
                    campaignType === 'EMAIL' ? 'text-sky-700' : 'text-gray-600'
                  }`}>이메일</p>
                </button>
              </div>
            </div>

            {/* Target Grade */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                타겟 등급
              </label>
              <div className="flex gap-4">
                {(['HOT', 'WARM', 'COLD'] as const).map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setTargetGrade(grade)}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                      targetGrade === grade
                        ? grade === 'HOT'
                          ? 'border-rose-500 bg-rose-50'
                          : grade === 'WARM'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-bold ${
                      targetGrade === grade
                        ? grade === 'HOT'
                          ? 'text-rose-700'
                          : grade === 'WARM'
                          ? 'text-amber-700'
                          : 'text-sky-700'
                        : 'text-gray-600'
                    }`}>{grade}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Limit */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                발송 대상 수
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={1}
                max={1000}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Message Preview */}
            {campaignType === 'SMS' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메시지 미리보기
                </label>
                <div className="bg-gray-100 rounded-xl p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {previewMessage || smsTemplate}
                  </pre>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{(previewMessage || smsTemplate).length}자</span>
                    <span>
                      {(previewMessage || smsTemplate).length > 90 ? 'LMS' : 'SMS'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={startCampaign}
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    캠페인 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign History */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">최근 캠페인</h3>
        </div>

        {historyLoading ? (
          <div className="text-center py-12 text-gray-400">로딩 중...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">아직 캠페인 이력이 없습니다.</p>
            <button onClick={() => setShowNewCampaign(true)} className="text-sky-600 hover:text-sky-700 font-medium">
              첫 캠페인 시작하기
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600">캠페인명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">채널</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등급</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">대상</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">발송일</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.campaign_type === 'SMS' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                      {c.campaign_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.target_grade === 'HOT' ? 'bg-rose-100 text-rose-700' :
                      c.target_grade === 'WARM' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                    }`}>{c.target_grade}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.total_targets}명</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl p-6 border border-sky-100">
        <h3 className="font-semibold text-gray-900 mb-3">캠페인 발송 팁</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-sky-500">•</span>
            HOT 타겟부터 우선 연락하면 전환율이 높습니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-500">•</span>
            오전 10시~12시, 오후 2시~4시에 발송하면 응답률이 높습니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-sky-500">•</span>
            첫 문자 발송 후 3일 이내 전화 연락을 권장합니다.
          </li>
        </ul>
      </div>
    </div>
  );
}

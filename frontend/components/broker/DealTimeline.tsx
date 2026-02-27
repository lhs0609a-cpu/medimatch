'use client';

import { CheckCircle2, Clock, MessageSquare, AlertTriangle, ArrowRight, User } from 'lucide-react';

interface ActivityLog {
  timestamp: string;
  actor: string;
  actor_name?: string;
  action: string;
  from?: string;
  to?: string;
  note?: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  DEAL_CREATED: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: '딜 생성' },
  STATUS_CHANGE: { icon: ArrowRight, color: 'text-blue-600 bg-blue-100', label: '상태 변경' },
  NOTE: { icon: MessageSquare, color: 'text-gray-600 bg-gray-100', label: '메모' },
  BROKER_ASSIGNED: { icon: User, color: 'text-purple-600 bg-purple-100', label: '중개사 배정' },
  CIRCUMVENTION_FLAGGED: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: '우회 의심' },
};

const STATUS_LABELS: Record<string, string> = {
  LEAD: '리드',
  CONTACTED: '컨택 완료',
  VIEWING_SCHEDULED: '내방 예정',
  VIEWED: '내방 완료',
  NEGOTIATING: '협상 중',
  CONTRACT_PENDING: '계약 대기',
  CONTRACTED: '계약 완료',
  CLOSED_WON: '성사',
  CLOSED_LOST: '종료',
};

export default function DealTimeline({ logs }: { logs: ActivityLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        활동 이력이 없습니다
      </div>
    );
  }

  const sortedLogs = [...logs].reverse();

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {sortedLogs.map((log, i) => {
          const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.NOTE;
          const Icon = config.icon;
          const ts = new Date(log.timestamp);
          const timeStr = ts.toLocaleDateString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          });

          return (
            <div key={i} className="relative flex gap-3 ml-0">
              <div className={`z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{config.label}</span>
                  {log.from && log.to && (
                    <span className="text-xs text-gray-500">
                      {STATUS_LABELS[log.from] || log.from} → {STATUS_LABELS[log.to] || log.to}
                    </span>
                  )}
                </div>
                {log.note && (
                  <p className="text-sm text-gray-600 mt-0.5">{log.note}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{timeStr}</span>
                  {log.actor_name && (
                    <span className="text-xs text-gray-400">by {log.actor_name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

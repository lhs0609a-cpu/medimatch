'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { notificationService } from '@/lib/api/services'
import { errorMessage } from '@/lib/emr/workflow'
import QueryState from '@/components/emr/QueryState'
export default function NotificationsPage() {
  const [unread, setUnread] = useState(false)
  const [page, setPage] = useState(0)
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['emr-notifications', unread, page], queryFn: () => notificationService.getNotifications({ unread_only: unread, skip: page * 30, limit: 30 }) })
  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: 'read' | 'all' | 'delete'; id?: string }) => action === 'all' ? notificationService.markAllAsRead() : action === 'read' ? notificationService.markAsRead(id!) : notificationService.deleteNotification(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emr-notifications'] }),
    onError: error => toast.error(errorMessage(error)),
  })
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">알림</h1><p className="mt-2 text-sm text-muted-foreground">읽지 않은 알림 {query.data?.unread_count ?? '—'}개</p></div><button disabled={mutation.isPending || !query.data?.unread_count} className="btn-secondary" onClick={() => mutation.mutate({ action: 'all' })}><CheckCheck className="h-4 w-4" /> 모두 읽음</button></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={unread} onChange={e => { setUnread(e.target.checked); setPage(0) }} />읽지 않은 알림만 보기</label>
    <QueryState loading={query.isLoading} error={query.isError} retry={() => query.refetch()} />
    {query.data && <><div className="overflow-hidden rounded-2xl border border-border bg-card">{query.data.notifications.map(n => <article key={n.id} className={'flex gap-4 border-b border-border p-5 last:border-0 ' + (!n.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : '')}><Bell className="mt-1 h-5 w-5 shrink-0 text-blue-600" /><div className="min-w-0 flex-1"><h2 className="text-sm font-bold">{n.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p><p className="mt-3 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('ko-KR')}</p>{typeof n.data?.url === 'string' && n.data.url.startsWith('/') && !n.data.url.startsWith('//') && <Link href={n.data.url} className="mt-3 inline-block text-xs text-blue-600">자세히 보기 →</Link>}</div><div className="flex shrink-0 items-start gap-1">{!n.is_read && <button aria-label={n.title + ' 읽음 처리'} disabled={mutation.isPending} className="btn-icon" onClick={() => mutation.mutate({ action: 'read', id: n.id })}><Check className="h-4 w-4" /></button>}<button aria-label={n.title + ' 삭제'} disabled={mutation.isPending} className="btn-icon" onClick={() => { if (window.confirm('이 알림을 삭제하시겠습니까?')) mutation.mutate({ action: 'delete', id: n.id }) }}><Trash2 className="h-4 w-4" /></button></div></article>)}{query.data.notifications.length === 0 && <p className="p-12 text-center text-sm text-muted-foreground">새로운 알림이 없습니다.</p>}</div><div className="flex justify-end gap-2"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary">이전</button><span className="self-center px-3 text-sm">{page + 1}</span><button disabled={(page + 1) * 30 >= query.data.total} onClick={() => setPage(p => p + 1)} className="btn-secondary">다음</button></div></>}
  </div>
}

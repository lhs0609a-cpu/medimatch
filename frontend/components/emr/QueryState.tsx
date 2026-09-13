import { AlertCircle, Loader2 } from 'lucide-react'

export default function QueryState({ loading, error, retry }: { loading?: boolean; error?: boolean; retry: () => void }) {
  if (loading) return <div role="status" className="flex justify-center items-center gap-2 p-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 데이터를 불러오고 있습니다.</div>
  if (error) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800"><AlertCircle className="mx-auto mb-2 h-5 w-5" /><p className="text-sm">데이터를 불러오지 못했습니다. 연결 상태를 확인해주세요.</p><button onClick={retry} className="btn-secondary mt-3">다시 시도</button></div>
  return null
}

import { Construction } from 'lucide-react'

interface ComingSoonBannerProps {
  /** 추가 안내 문구 (선택). 미지정 시 기본 문구만 표시 */
  note?: string
}

/**
 * 아직 백엔드가 연동되지 않은 "준비 중" 화면 상단에 다는 정직성 배너.
 * 표시된 데이터가 예시임을 사용자에게 명확히 알린다.
 */
export default function ComingSoonBanner({ note }: ComingSoonBannerProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-900/20 dark:border-amber-800">
      <Construction className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800 dark:text-amber-200">
        <p>
          <span className="font-semibold">준비 중인 기능입니다.</span> 표시된 데이터는 예시이며,
          실제 연동 시 자동으로 전환됩니다.
        </p>
        {note && <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">{note}</p>}
      </div>
    </div>
  )
}

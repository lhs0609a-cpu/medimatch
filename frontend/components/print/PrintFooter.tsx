'use client'

interface PrintFooterProps {
  showPageNumber?: boolean
  disclaimer?: string
}

export function PrintFooter({
  showPageNumber = true,
  disclaimer = '본 자료는 참고용이며, 실제 결과와 다를 수 있습니다.',
}: PrintFooterProps) {
  return (
    <footer className="print-only print-footer mt-8 pt-4 border-t border-gray-300">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          <p>{disclaimer}</p>
          <p className="mt-1">© {new Date().getFullYear()} 메디플라톤. All rights reserved.</p>
        </div>
        {showPageNumber && (
          <div className="print-page-number">
            Page <span></span>
          </div>
        )}
      </div>
    </footer>
  )
}

export default PrintFooter

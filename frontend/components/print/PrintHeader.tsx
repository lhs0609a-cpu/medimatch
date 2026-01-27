'use client'

interface PrintHeaderProps {
  title?: string
  subtitle?: string
  date?: Date
  showLogo?: boolean
}

export function PrintHeader({
  title,
  subtitle,
  date = new Date(),
  showLogo = true,
}: PrintHeaderProps) {
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="print-only print-header mb-8 pb-4 border-b-2 border-gray-300">
      <div className="flex items-center justify-between">
        <div>
          {showLogo && (
            <div className="text-2xl font-bold mb-1">메디플라톤</div>
          )}
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>출력일: {formattedDate}</div>
          <div>mediplatone.kr</div>
        </div>
      </div>
    </header>
  )
}

export default PrintHeader

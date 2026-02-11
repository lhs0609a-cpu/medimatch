import React from 'react'

interface BlurredCardProps {
  icon: React.ReactNode
  title: string
  description: string
  itemCount?: number
}

export default function BlurredCard({ icon, title, description, itemCount }: BlurredCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
      </div>
      <div className="blur-[6px] select-none pointer-events-none">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full" style={{ width: '65%' }} />
        </div>
      </div>
      {itemCount && (
        <div className="absolute top-4 right-4">
          <span className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {itemCount}개 항목
          </span>
        </div>
      )}
    </div>
  )
}

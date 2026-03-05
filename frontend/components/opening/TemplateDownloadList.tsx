'use client'

import { FileDown, ExternalLink, Clock } from 'lucide-react'
import type { TaskResource } from '@/app/checklist/data/task-guides'

interface TemplateDownloadListProps {
  resources: TaskResource[]
}

export default function TemplateDownloadList({ resources }: TemplateDownloadListProps) {
  const templates = resources.filter(r => r.type === 'template')
  if (templates.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <FileDown className="w-3.5 h-3.5 text-orange-500" />
        <span>문서 템플릿</span>
      </div>
      <div className="grid gap-1.5">
        {templates.map((tmpl, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2"
          >
            <FileDown className="w-3.5 h-3.5 flex-shrink-0 text-orange-500" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground">{tmpl.name}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
            </div>
            {tmpl.templateUrl ? (
              <a
                href={tmpl.templateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline flex-shrink-0 bg-primary/10 px-2 py-1 rounded-md"
              >
                다운로드
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded flex-shrink-0">
                준비중
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

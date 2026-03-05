'use client'

import { Globe, Building2, FileText, Wrench, Users, ExternalLink, FileDown, CheckCircle2 } from 'lucide-react'
import type { TaskResource } from '@/app/checklist/data/task-guides'

const TYPE_CONFIG: Record<TaskResource['type'], { icon: React.ElementType; color: string }> = {
  website: { icon: Globe, color: 'text-blue-500' },
  government: { icon: Building2, color: 'text-green-600' },
  template: { icon: FileText, color: 'text-orange-500' },
  tool: { icon: Wrench, color: 'text-purple-500' },
  community: { icon: Users, color: 'text-pink-500' },
}

interface TaskResourceListProps {
  resources: TaskResource[]
}

export default function TaskResourceList({ resources }: TaskResourceListProps) {
  if (!resources || resources.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Globe className="w-3.5 h-3.5 text-blue-500" />
        <span>추천 리소스</span>
      </div>
      <div className="grid gap-1.5">
        {resources.map((resource, i) => {
          const config = TYPE_CONFIG[resource.type]
          const Icon = config.icon
          return (
            <div
              key={i}
              className="flex items-start gap-2 bg-secondary/30 rounded-lg px-3 py-2"
            >
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      {resource.name}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-foreground">{resource.name}</span>
                  )}
                  {resource.lastVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {new Date(resource.lastVerified).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })} 검증
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
              </div>
              {resource.templateUrl && (
                <a
                  href={resource.templateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline flex-shrink-0 bg-primary/10 px-2 py-1 rounded-md mt-0.5"
                >
                  <FileDown className="w-3 h-3" />
                  다운로드
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

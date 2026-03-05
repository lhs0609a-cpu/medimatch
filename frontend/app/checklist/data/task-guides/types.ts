export interface TaskResource {
  name: string
  url?: string
  description: string
  type: 'website' | 'government' | 'template' | 'tool' | 'community'
  templateUrl?: string     // 실제 다운로드 링크
  lastVerified?: string    // 검증일 ISO date
}

export interface TaskBenchmark {
  label: string
  value: string
  source?: string
  note?: string
}

export interface TaskTimeline {
  recommendedStart: string
  duration: string
  deadline?: string
  seasonalTip?: string
  durationRange?: [number, number]  // [min, max] 일
  seasonalImpact?: string[]         // 계절별 영향
  regionalVariation?: string        // 지역별 처리 시간 차이
}

export interface TaskSubChecklist {
  label: string
  items: string[]
}

export interface FailureCase {
  title: string
  description: string
  consequence: string
  prevention: string
}

export interface RegionalInfo {
  cost?: string
  tips?: string[]
  processingTime?: string
  contacts?: ContactInfo[]
}

export interface ContactInfo {
  organization: string
  department?: string
  phone?: string
  url?: string
  description?: string
}

export interface TaskGuide {
  // 기존 필드
  steps: string[]
  tips: string[]
  warnings?: string[]
  documents?: string[]

  // 신규 필드
  resources?: TaskResource[]
  benchmarks?: TaskBenchmark[]
  timeline?: TaskTimeline
  subChecklists?: TaskSubChecklist[]
  costBreakdown?: TaskBenchmark[]
  expertAdvice?: string
  regulations?: string[]

  // 보강 필드
  failureCases?: FailureCase[]
  regionalData?: Record<string, RegionalInfo>
  contacts?: ContactInfo[]
  legalRisks?: string[]
  specialtyOverrides?: Record<string, Partial<TaskGuide>>
}

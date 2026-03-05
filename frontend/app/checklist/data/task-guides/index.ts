import type { TaskGuide } from './types'
import { phase1Guides } from './phase1-guides'
import { phase2Guides } from './phase2-guides'
import { phase3Guides } from './phase3-guides'
import { phase4Guides } from './phase4-guides'
import { phase5Guides } from './phase5-guides'
import { phase6Guides } from './phase6-guides'
import { phase7Guides } from './phase7-guides'
import { phase8Guides } from './phase8-guides'
import { phase9Guides } from './phase9-guides'

export type { TaskGuide } from './types'
export type { TaskResource, TaskBenchmark, TaskTimeline, TaskSubChecklist, FailureCase, RegionalInfo, ContactInfo } from './types'

export const taskGuides: Record<string, TaskGuide> = {
  ...phase1Guides,
  ...phase2Guides,
  ...phase3Guides,
  ...phase4Guides,
  ...phase5Guides,
  ...phase6Guides,
  ...phase7Guides,
  ...phase8Guides,
  ...phase9Guides,
}

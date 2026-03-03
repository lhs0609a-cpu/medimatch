'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { phases } from '@/app/checklist/data/phases'
import { getMilestoneByPhase } from '@/app/checklist/data/milestones'

interface MilestoneCelebrationProps {
  completedTasks: string[]
  seenMilestones: string[]
  onMilestoneSeen: (id: string) => void
  onAllComplete: () => void
}

export default function MilestoneCelebration({
  completedTasks, seenMilestones, onMilestoneSeen, onAllComplete,
}: MilestoneCelebrationProps) {
  const prevCompleted = useRef<string[]>(completedTasks)

  useEffect(() => {
    // Skip on first render
    if (prevCompleted.current === completedTasks) return
    prevCompleted.current = completedTasks

    // Check each phase for completion
    for (const phase of phases) {
      const allDone = phase.subtasks.every(s => completedTasks.includes(s.id))
      const milestone = getMilestoneByPhase(phase.id)
      if (allDone && milestone && !seenMilestones.includes(milestone.id)) {
        toast.success(milestone.title, {
          description: milestone.description,
          duration: 5000,
        })
        onMilestoneSeen(milestone.id)
      }
    }

    // Check all complete
    const totalTasks = phases.reduce((sum, p) => sum + p.subtasks.length, 0)
    if (completedTasks.length === totalTasks && !seenMilestones.includes('all-complete')) {
      onMilestoneSeen('all-complete')
      // Small delay to let phase toast show first
      setTimeout(() => onAllComplete(), 1500)
    }
  }, [completedTasks, seenMilestones, onMilestoneSeen, onAllComplete])

  return null
}

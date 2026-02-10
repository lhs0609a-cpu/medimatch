'use client'

import React from 'react'
import { SimulationResponse } from '@/lib/api/client'

interface PremiumAnalysisProps {
  result: SimulationResponse
}

export default function PremiumAnalysis({ result }: PremiumAnalysisProps) {
  return (
    <div>
      <p>Premium Analysis placeholder</p>
    </div>
  )
}

'use client'

interface JourneyConnectorProps {
  color: string
  completed: boolean
}

export default function JourneyConnector({ color, completed }: JourneyConnectorProps) {
  return (
    <div className="flex justify-center py-1">
      <div
        className="w-0.5 h-8 rounded-full transition-colors duration-500"
        style={{ backgroundColor: completed ? '#22c55e' : color + '40' }}
      />
    </div>
  )
}

'use client'

import { Eye, EyeOff, Lock, Unlock, Shield, ShieldCheck } from 'lucide-react'

export type AccessLevel = 'MINIMAL' | 'PARTIAL' | 'FULL'

interface AccessLevelBadgeProps {
  level: AccessLevel
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const levelConfig = {
  MINIMAL: {
    label: '기본 정보',
    description: '지역, 약국 유형만 공개',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: EyeOff,
    upgradeText: '부분 정보 열람',
    upgradeCost: 50000,
  },
  PARTIAL: {
    label: '부분 정보',
    description: '권리금, 매출, 면적 범위 공개',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Eye,
    upgradeText: '전체 정보 열람',
    upgradeCost: 100000,
  },
  FULL: {
    label: '전체 정보',
    description: '주소, 연락처, 상세 매출 공개',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: ShieldCheck,
    upgradeText: null,
    upgradeCost: 0,
  },
}

export default function AccessLevelBadge({
  level,
  size = 'md',
  showLabel = true
}: AccessLevelBadgeProps) {
  const config = levelConfig[level]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && config.label}
    </span>
  )
}

export function AccessLevelProgress({ currentLevel }: { currentLevel: AccessLevel }) {
  const levels: AccessLevel[] = ['MINIMAL', 'PARTIAL', 'FULL']
  const currentIndex = levels.indexOf(currentLevel)

  return (
    <div className="flex items-center gap-2">
      {levels.map((level, index) => {
        const isActive = index <= currentIndex
        const isCurrentLevel = index === currentIndex
        const config = levelConfig[level]

        return (
          <div key={level} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              } ${isCurrentLevel ? 'ring-2 ring-purple-300 ring-offset-2' : ''}`}
            >
              {index + 1}
            </div>
            {index < levels.length - 1 && (
              <div
                className={`w-8 h-1 ${
                  index < currentIndex ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AccessLevelCard({
  level,
  isCurrentLevel = false,
  onClick,
}: {
  level: AccessLevel
  isCurrentLevel?: boolean
  onClick?: () => void
}) {
  const config = levelConfig[level]
  const Icon = config.icon

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all ${
        isCurrentLevel
          ? 'border-purple-600 bg-purple-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {isCurrentLevel && (
        <span className="absolute -top-3 right-4 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          현재
        </span>
      )}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCurrentLevel ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{config.label}</h4>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
      </div>
      {config.upgradeText && !isCurrentLevel && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-purple-600 font-medium">
            {config.upgradeCost.toLocaleString()}원으로 업그레이드
          </p>
        </div>
      )}
    </div>
  )
}

export { levelConfig }

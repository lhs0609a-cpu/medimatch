'use client'

import { useState } from 'react'
import {
  X, Lock, Unlock, CreditCard, Check, AlertCircle,
  Eye, EyeOff, ShieldCheck, Loader2, ArrowRight
} from 'lucide-react'
import { AccessLevel, levelConfig, AccessLevelCard } from './AccessLevelBadge'

interface UpgradeAccessModalProps {
  isOpen: boolean
  onClose: () => void
  currentLevel: AccessLevel
  listingId: string
  onUpgrade: (targetLevel: AccessLevel) => Promise<void>
  isLoading?: boolean
}

const upgradeInfo = {
  MINIMAL_TO_PARTIAL: {
    price: 50000,
    features: [
      '권리금 범위 확인',
      '예상 월매출 범위',
      '약국 면적 정보',
      '직원 수 및 시설 정보',
    ],
  },
  PARTIAL_TO_FULL: {
    price: 100000,
    features: [
      '정확한 주소 확인',
      '약국 연락처 공개',
      '상세 매출 데이터',
      '양도인 직접 연락 가능',
    ],
  },
  MINIMAL_TO_FULL: {
    price: 130000,
    features: [
      '모든 부분 정보 포함',
      '정확한 주소 확인',
      '약국 연락처 공개',
      '상세 매출 데이터',
      '양도인 직접 연락 가능',
    ],
    savings: 20000,
  },
}

export default function UpgradeAccessModal({
  isOpen,
  onClose,
  currentLevel,
  listingId,
  onUpgrade,
  isLoading = false,
}: UpgradeAccessModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<AccessLevel | null>(null)
  const [step, setStep] = useState<'select' | 'confirm'>('select')

  if (!isOpen) return null

  const getAvailableUpgrades = (): Array<{
    target: AccessLevel
    key: keyof typeof upgradeInfo
    price: number
    features: string[]
    savings?: number
  }> => {
    const upgrades = []

    if (currentLevel === 'MINIMAL') {
      upgrades.push({
        target: 'PARTIAL' as AccessLevel,
        key: 'MINIMAL_TO_PARTIAL' as keyof typeof upgradeInfo,
        ...upgradeInfo.MINIMAL_TO_PARTIAL,
      })
      upgrades.push({
        target: 'FULL' as AccessLevel,
        key: 'MINIMAL_TO_FULL' as keyof typeof upgradeInfo,
        ...upgradeInfo.MINIMAL_TO_FULL,
      })
    } else if (currentLevel === 'PARTIAL') {
      upgrades.push({
        target: 'FULL' as AccessLevel,
        key: 'PARTIAL_TO_FULL' as keyof typeof upgradeInfo,
        ...upgradeInfo.PARTIAL_TO_FULL,
      })
    }

    return upgrades
  }

  const availableUpgrades = getAvailableUpgrades()
  const selectedUpgrade = availableUpgrades.find((u) => u.target === selectedTarget)

  const handleUpgrade = async () => {
    if (!selectedTarget) return
    await onUpgrade(selectedTarget)
    onClose()
  }

  const handleClose = () => {
    setSelectedTarget(null)
    setStep('select')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Unlock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">정보 업그레이드</h3>
              <p className="text-sm text-gray-500">더 많은 매물 정보를 확인하세요</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' ? (
            <>
              {/* Current Level */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">현재 열람 레벨</p>
                <AccessLevelCard level={currentLevel} isCurrentLevel />
              </div>

              {/* Available Upgrades */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">업그레이드 옵션</p>
                <div className="space-y-3">
                  {availableUpgrades.map((upgrade) => (
                    <div
                      key={upgrade.target}
                      onClick={() => setSelectedTarget(upgrade.target)}
                      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        selectedTarget === upgrade.target
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {selectedTarget === upgrade.target && (
                        <div className="absolute top-4 right-4">
                          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            upgrade.target === 'FULL'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {upgrade.target === 'FULL' ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {levelConfig[upgrade.target].label}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {levelConfig[upgrade.target].description}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-1 mb-3">
                        {upgrade.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-lg font-bold text-purple-600">
                          {upgrade.price.toLocaleString()}원
                        </span>
                        {upgrade.savings && (
                          <span className="text-sm text-green-600 font-medium">
                            {upgrade.savings.toLocaleString()}원 할인
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedTarget}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                다음
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Confirm Step */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">결제 확인</h4>
                <p className="text-gray-500">
                  {levelConfig[selectedTarget!].label} 정보를 열람하시겠습니까?
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">상품</span>
                  <span className="font-medium">
                    {levelConfig[selectedTarget!].label} 열람권
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="font-semibold">결제 금액</span>
                  <span className="font-bold text-purple-600">
                    {selectedUpgrade?.price.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">결제 전 확인사항</p>
                    <ul className="space-y-1 text-amber-700">
                      <li>- 결제 후 환불이 불가합니다</li>
                      <li>- 열람 권한은 해당 매물에만 적용됩니다</li>
                      <li>- 매물 삭제 시 열람 권한도 소멸됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      처리중...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      결제하기
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

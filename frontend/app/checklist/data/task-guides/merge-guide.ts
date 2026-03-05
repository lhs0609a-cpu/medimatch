import { taskGuides } from './index'
import type { TaskGuide } from './types'
import { regionMultipliers } from '../budget-benchmarks'

/**
 * base guide + specialtyOverrides 머지
 * specialtyId에 해당하는 오버라이드가 있으면 base에 병합
 */
export function getGuideForSpecialty(taskId: string, specialtyId?: string): TaskGuide | undefined {
  const base = taskGuides[taskId]
  if (!base) return undefined
  if (!specialtyId || !base.specialtyOverrides?.[specialtyId]) return base

  const override = base.specialtyOverrides[specialtyId]
  return {
    ...base,
    ...override,
    // 배열 필드는 override가 있으면 대체, 없으면 base 유지
    steps: override.steps ?? base.steps,
    tips: override.tips ?? base.tips,
    warnings: override.warnings ?? base.warnings,
    documents: override.documents ?? base.documents,
    resources: override.resources ?? base.resources,
    benchmarks: override.benchmarks ?? base.benchmarks,
    failureCases: override.failureCases ?? base.failureCases,
    contacts: override.contacts ?? base.contacts,
    legalRisks: override.legalRisks ?? base.legalRisks,
    regulations: override.regulations ?? base.regulations,
  }
}

/**
 * 주소 문자열 → 7개 지역 코드 매핑
 * budget-benchmarks.ts의 regionMultipliers 코드 활용
 */
export function inferRegionCode(locationAddress?: string): string {
  if (!locationAddress) return 'metro' // 기본값: 광역시 평균

  const addr = locationAddress.trim()

  // 서울 강남/서초
  if (/강남|서초|송파/.test(addr)) return 'seoul-gangnam'
  // 서울 기타
  if (/서울/.test(addr)) return 'seoul-etc'
  // 경기 분당/판교
  if (/분당|판교|성남/.test(addr)) return 'gyeonggi-bundang'
  // 경기 기타
  if (/경기|수원|용인|고양|안양|화성|파주|김포|시흥|평택|안산|의정부|하남|광명/.test(addr)) return 'gyeonggi-etc'
  // 세종/제주
  if (/세종|제주/.test(addr)) return 'sejong-jeju'
  // 6대 광역시
  if (/부산|대구|인천|광주|대전|울산/.test(addr)) return 'metro'

  return 'rural'
}

/**
 * 지역 코드 → 지역 표시명
 */
export function getRegionDisplayName(regionCode: string): string {
  const region = regionMultipliers.find(r => r.code === regionCode)
  return region?.region ?? regionCode
}

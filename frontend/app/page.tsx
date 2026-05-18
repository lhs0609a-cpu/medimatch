'use client'

import { useState, useEffect } from 'react'
import OnboardingModal, { useOnboarding } from '@/components/onboarding/OnboardingModal'
import { generateBuildingListings, generatePharmacyListings } from '@/lib/data/seedListings'
import {
  HomeHeader,
  HeroSection,
  EMRFeatureSections,
  EcosystemInsideEMR,
  SocialProof,
  ConsultingSection,
  FinalCTA,
  HomeFooter,
  HomeAppShowcase,
  HomePricingFree,
  HomeFAQ,
} from '@/components/home'

export default function HomePage() {
  const { showOnboarding, setShowOnboarding } = useOnboarding()

  const [mapMarkers, setMapMarkers] = useState<
    Array<{ id: string; lat: number; lng: number; title: string; type: 'hospital' | 'pharmacy' }>
  >([])

  useEffect(() => {
    const buildings = generateBuildingListings()
    const pharmacies = generatePharmacyListings()

    const buildingMarkers = buildings.map((b) => ({
      id: b.id,
      lat: b.lat,
      lng: b.lng,
      title: b.title,
      type: 'hospital' as const,
    }))

    const pharmacyMarkers = pharmacies.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      title: `${p.subArea} 약국`,
      type: 'pharmacy' as const,
    }))

    setMapMarkers([...buildingMarkers, ...pharmacyMarkers])
  }, [])

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      <div className="min-h-screen bg-background">
        <HomeHeader />

        <main id="main-content" role="main">
          {/* 1. Hero — 거대 타이포 + 입체 mockup + 부유 메트릭 카드 */}
          <HeroSection markers={mapMarkers} />

          {/* 2. EMR 6대 기능 풀-블리드 zigzag 섹션 (각 화면 = 풀스크린, 거대 mockup) */}
          <EMRFeatureSections />

          {/* 3. 의사 EMR + 환자 카톡 듀얼 쇼케이스 */}
          <HomeAppShowcase />

          {/* 4. EMR 안의 발견 — 매물·개원·공동구매·약국 */}
          <EcosystemInsideEMR />

          {/* 5. 사회적 증거 — 의원 후기·통계 */}
          <SocialProof />

          {/* 6. 무료 비교 + ID 과금 — 가격 투명성 */}
          <HomePricingFree />

          {/* 7. 컨설팅 — 데이터 기반 의사결정 */}
          <ConsultingSection />

          {/* 8. FAQ — 무료·보안·이관 신뢰 빌딩 */}
          <HomeFAQ />

          {/* 9. 최종 CTA */}
          <FinalCTA />
        </main>

        <HomeFooter />
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import OnboardingModal, { useOnboarding } from '@/components/onboarding/OnboardingModal'
import { generateBuildingListings, generatePharmacyListings } from '@/lib/data/seedListings'
import {
  HomeHeader,
  HeroSection,
  ServiceCards,
  EcosystemInsideEMR,
  InteractiveDemo,
  SocialProof,
  ConsultingSection,
  FinalCTA,
  HomeFooter,
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
          {/* 1. Hero — EMR·CRM 평생 무료 + CRM/EMR 바로 시작 */}
          <HeroSection markers={mapMarkers} />

          {/* 2. EMR 핵심 3가치 — AI 차트·삭감 방어·CRM */}
          <ServiceCards />

          {/* 3. EMR 실사용 데모 (음성→차트→처방) */}
          <InteractiveDemo />

          {/* 4. EMR 안의 발견 — 매물·개원·공동구매·약국 */}
          <EcosystemInsideEMR />

          {/* 5. 사회적 증거 — 의원 후기·통계 */}
          <SocialProof />

          {/* 6. 컨설팅 — 데이터 기반 의사결정 */}
          <ConsultingSection />

          {/* 7. 최종 CTA */}
          <FinalCTA />
        </main>

        <HomeFooter />
      </div>
    </>
  )
}

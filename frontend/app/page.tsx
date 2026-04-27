'use client'

import { useState, useEffect } from 'react'
import OnboardingModal, { useOnboarding } from '@/components/onboarding/OnboardingModal'
import { generateBuildingListings, generatePharmacyListings } from '@/lib/data/seedListings'
import {
  HomeHeader,
  HeroSection,
  ServiceCards,
  InteractiveDemo,
  SocialProof,
  ConsultingSection,
  MapPreview,
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
          <HeroSection markers={mapMarkers} />
          <ServiceCards />
          <InteractiveDemo />
          <SocialProof />
          <ConsultingSection />
          <MapPreview markers={mapMarkers} />
          <FinalCTA />
        </main>

        <HomeFooter />
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, Pill, MapPin, Building2, Store } from 'lucide-react'
import Link from 'next/link'
import { sampleLocations, LocationData } from './data/seed'
import NearbyHospitals from './components/NearbyHospitals'
import PrescriptionEstimate from './components/PrescriptionEstimate'
import RevenueProjection from './components/RevenueProjection'

export default function PharmacyForecastPage() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [step, setStep] = useState<'select' | 'result'>('select')

  const handleSelect = (loc: LocationData) => {
    setSelectedLocation(loc)
    setStep('result')
  }

  const handleBack = () => {
    setStep('select')
    setSelectedLocation(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          {step === 'result' ? (
            <button onClick={handleBack} className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/dashboard" className="btn-ghost p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <Pill className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">처방전 예측</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {step === 'select' ? (
          <div className="space-y-6">
            {/* Info */}
            <div className="card p-5 bg-primary/5 border-primary/20">
              <h2 className="font-bold text-foreground mb-2">약국 입지 분석</h2>
              <p className="text-sm text-muted-foreground">
                위치를 선택하면 주변 병원 현황을 기반으로 일일 처방전 수량과 예상 매출을 분석합니다.
              </p>
            </div>

            {/* Location cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {sampleLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className="card-interactive p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{loc.address}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          병원 {loc.hospitalCount}개
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Store className="w-3.5 h-3.5" />
                          약국 {loc.pharmacyCount}개
                        </div>
                        <div className="text-muted-foreground">
                          인구 {(loc.population / 10000).toFixed(1)}만명
                        </div>
                        <div className="text-muted-foreground">
                          일 처방 ~{loc.avgDailyPrescriptions}건
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              * 실제 서비스에서는 원하는 주소를 직접 입력하여 분석할 수 있습니다.
            </p>
          </div>
        ) : selectedLocation ? (
          <div className="space-y-6">
            {/* Location header */}
            <div className="card p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-bold text-foreground">{selectedLocation.address}</h2>
                <p className="text-sm text-muted-foreground">
                  인구 {(selectedLocation.population / 10000).toFixed(1)}만 · 병원 {selectedLocation.hospitalCount}개 · 약국 {selectedLocation.pharmacyCount}개
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Hospitals table */}
              <div className="lg:col-span-2">
                <NearbyHospitals
                  hospitals={selectedLocation.hospitals}
                  pharmacyCount={selectedLocation.pharmacyCount}
                />
              </div>

              {/* Right: Estimates */}
              <div className="space-y-4">
                <PrescriptionEstimate
                  hospitals={selectedLocation.hospitals}
                  pharmacyCount={selectedLocation.pharmacyCount}
                />
                <RevenueProjection
                  hospitals={selectedLocation.hospitals}
                  pharmacyCount={selectedLocation.pharmacyCount}
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

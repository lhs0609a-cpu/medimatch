'use client'

import { MapPin, Building2 } from 'lucide-react'
import { NearbyHospital, calculatePrescriptions } from '../data/seed'

interface NearbyHospitalsProps {
  hospitals: NearbyHospital[]
  pharmacyCount: number
}

export default function NearbyHospitals({ hospitals, pharmacyCount }: NearbyHospitalsProps) {
  const sorted = [...hospitals].sort((a, b) => a.distance - b.distance)

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          주변 병원 현황
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{hospitals.length}개 병원 · 반경 300m 이내</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">병원명</th>
              <th className="text-center p-3 font-medium text-muted-foreground">진료과</th>
              <th className="text-center p-3 font-medium text-muted-foreground">거리</th>
              <th className="text-center p-3 font-medium text-muted-foreground">일 환자수</th>
              <th className="text-center p-3 font-medium text-muted-foreground">처방률</th>
              <th className="text-center p-3 font-medium text-muted-foreground">예상 처방전</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const calc = calculatePrescriptions(h, pharmacyCount)
              return (
                <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{h.name}</td>
                  <td className="p-3 text-center">
                    <span className="badge-default text-xs px-2 py-0.5 rounded-full">{h.specialty}</span>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">
                    <span className="flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" />{h.distance}m
                    </span>
                  </td>
                  <td className="p-3 text-center text-foreground">{h.dailyPatients}명</td>
                  <td className="p-3 text-center text-foreground">{h.prescriptionRate}%</td>
                  <td className="p-3 text-center font-semibold text-primary">
                    ~{calc.myPrescriptions}건/일
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Eye, MapPin, Flame, Shield } from 'lucide-react'
import Link from 'next/link'
import { Equipment, conditionLabels } from '../data/seed'

const categoryEmoji: Record<string, string> = {
  '초음파': '🔬', '내시경': '🏥', '치과장비': '🦷', '안과장비': '👁️',
  'EMR/IT': '💻', '가구/집기': '🪑', '영상진단': '📡', '물리치료': '💪',
  '수술장비': '🔧', '검사장비': '🧪',
}

interface EquipmentCardProps {
  equipment: Equipment
}

export default function EquipmentCard({ equipment: eq }: EquipmentCardProps) {
  const cond = conditionLabels[eq.condition]
  const discount = eq.originalPrice ? Math.round((1 - eq.price / eq.originalPrice) * 100) : 0
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/equipment/${eq.id}`} className="card-interactive overflow-hidden group">
      {/* Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
        {eq.imageUrl && !imgError ? (
          <img
            src={eq.imageUrl}
            alt={eq.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="text-4xl text-muted-foreground/30">
            {categoryEmoji[eq.category] ?? '⚕️'}
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {eq.isHot && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full flex items-center gap-0.5">
              <Flame className="w-3 h-3" /> HOT
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-xs rounded-full text-white" style={{ backgroundColor: cond.color }}>
            {cond.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{eq.brand} · {eq.category}</p>
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {eq.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-primary">{eq.price.toLocaleString()}만원</span>
          {eq.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{eq.originalPrice.toLocaleString()}만</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {eq.location}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {eq.viewCount}
          </span>
        </div>
        {eq.warranty && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <Shield className="w-3 h-3" /> 보증 {eq.warranty}
          </div>
        )}
      </div>
    </Link>
  )
}

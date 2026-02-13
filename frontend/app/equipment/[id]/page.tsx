'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Eye, Shield, Calendar, Clock, Phone,
  MessageSquare, Heart, Share2, Check, Package, ChevronRight
} from 'lucide-react'
import { equipmentList, conditionLabels } from '../data/seed'

export default function EquipmentDetailPage() {
  const params = useParams()
  const eq = useMemo(() => equipmentList.find((e) => e.id === params.id) || equipmentList[0], [params.id])
  const [liked, setLiked] = useState(false)
  const [imgError, setImgError] = useState(false)

  const cond = conditionLabels[eq.condition]
  const discount = eq.originalPrice ? Math.round((1 - eq.price / eq.originalPrice) * 100) : 0

  const relatedItems = equipmentList
    .filter((e) => e.category === eq.category && e.id !== eq.id)
    .slice(0, 3)

  const sellerLabel = eq.sellerType === 'dealer' ? '딜러/유통사' : eq.sellerType === 'manufacturer' ? '제조사 직판' : '의원 직거래'

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/equipment" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">목록</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-lg transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center overflow-hidden">
            {eq.imageUrl && !imgError ? (
              <img
                src={eq.imageUrl}
                alt={eq.name}
                className="w-full h-full object-contain p-6"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-8xl text-muted-foreground/20">
                {eq.category === '초음파' ? '🔬' : eq.category === '내시경' ? '🏥' : eq.category === '치과장비' ? '🦷' : '⚕️'}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-default text-xs">{eq.category}</span>
              <span className="text-xs rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: cond.color }}>
                {cond.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{eq.brand} · {eq.model}</p>
            <h1 className="text-2xl font-bold text-foreground mb-4">{eq.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">{eq.price.toLocaleString()}만원</span>
              {eq.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{eq.originalPrice.toLocaleString()}만</span>
                  <span className="text-sm font-bold text-red-500">-{discount}%</span>
                </>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" /> {eq.location}
              </div>
              {eq.yearMade && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> {eq.yearMade}년 제조
                  {eq.usageMonths && ` · ${eq.usageMonths}개월 사용`}
                </div>
              )}
              {eq.warranty && (
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="w-4 h-4" /> 보증 {eq.warranty}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" /> 조회 {eq.viewCount}회
              </div>
            </div>

            {/* Seller */}
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{eq.seller}</span>
                <span className="badge-default text-xs">{sellerLabel}</span>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5">
                  <Phone className="w-4 h-4" /> 전화 문의
                </button>
                <button className="btn-secondary flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> 채팅 문의
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-foreground mb-3">상세 설명</h2>
          <p className="text-sm text-foreground leading-relaxed">{eq.description}</p>
        </div>

        {/* Features */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-foreground mb-3">주요 특징</h2>
          <div className="grid grid-cols-2 gap-2">
            {eq.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        {relatedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">같은 카테고리 장비</h2>
              <Link href="/equipment" className="text-sm text-primary flex items-center gap-0.5 hover:underline">
                더보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedItems.map((item) => (
                <Link key={item.id} href={`/equipment/${item.id}`} className="card-interactive p-4">
                  <p className="text-xs text-muted-foreground">{item.brand}</p>
                  <h3 className="font-medium text-foreground text-sm line-clamp-1 mb-2">{item.name}</h3>
                  <p className="font-bold text-primary">{item.price.toLocaleString()}만원</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

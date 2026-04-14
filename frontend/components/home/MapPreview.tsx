'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight, Globe } from 'lucide-react'
import { platformStats } from '@/lib/data/seedListings'
import { fadeInUp, viewportConfig } from '@/components/animation/MotionWrapper'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-secondary animate-pulse" />,
})

interface MapPreviewProps {
  markers: Array<{ id: string; lat: number; lng: number; title: string; type: 'hospital' | 'pharmacy' }>
}

export function MapPreview({ markers }: MapPreviewProps) {
  return (
    <section className="py-[80px] md:py-[120px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            전국 {platformStats.totalListings}개 매물을 지도에서
          </h2>
          <p className="text-muted-foreground">원하는 지역의 매물을 한눈에 확인하세요</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          variants={fadeInUp}
          className="relative rounded-3xl overflow-hidden border border-border shadow-2xl"
        >
          <div className="h-[500px]">
            <KakaoMap
              center={{ lat: 36.5, lng: 127.5 }}
              level={12}
              markers={markers}
              className="w-full h-full"
            />
          </div>

          {/* Overlay info */}
          <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3182f6]" />
                <span>병원 매물</span>
                <span className="font-bold">{platformStats.activeBuildingListings}</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3182f6]" />
                <span>약국 매물</span>
                <span className="font-bold">{platformStats.activePharmacyListings}</span>
              </div>
            </div>
          </div>

          {/* CTA overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Link href="/map" className="btn-primary btn-lg shadow-2xl">
              <Globe className="w-5 h-5" />
              지도에서 매물 탐색하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

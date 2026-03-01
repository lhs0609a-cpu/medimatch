'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Star, BadgeCheck, ExternalLink, Phone, Mail,
  Paintbrush, Stethoscope, Megaphone, Briefcase, Armchair,
  Loader2, Search,
} from 'lucide-react'

interface VendorPartner {
  id: string
  name: string
  category: string
  subCategory: string
  rating: number
  reviewCount: number
  certified: boolean
  tags: string[]
  description: string
  phone?: string
  website?: string
}

const TABS = [
  { id: 'interior', label: '인테리어', icon: Paintbrush },
  { id: 'equipment', label: '의료장비', icon: Stethoscope },
  { id: 'marketing', label: '마케팅', icon: Megaphone },
  { id: 'consulting', label: '컨설팅', icon: Briefcase },
  { id: 'others', label: '기타', icon: Armchair },
]

// Demo vendor data
const DEMO_VENDORS: Record<string, VendorPartner[]> = {
  interior: [
    { id: 'v1', name: '메디인테리어', category: 'interior', subCategory: '의료전문 인테리어', rating: 4.8, reviewCount: 127, certified: true, tags: ['의료전문', '10년+', '포트폴리오 100+'], description: '병·의원 전문 인테리어 시공. 내과, 피부과, 정형외과 등 300건 이상 시공 경험.', phone: '02-1234-5678' },
    { id: 'v2', name: '클린메디컬디자인', category: 'interior', subCategory: '의료전문 인테리어', rating: 4.6, reviewCount: 89, certified: true, tags: ['감염관리', '친환경', '3D 설계'], description: '감염관리 기준에 맞는 의료 공간 설계 및 시공 전문.' },
    { id: 'v3', name: '한빛설계사무소', category: 'interior', subCategory: '설계사무소', rating: 4.5, reviewCount: 45, certified: false, tags: ['건축설계', '인허가 대행'], description: '의료시설 건축설계 및 인허가 대행 서비스 제공.' },
  ],
  equipment: [
    { id: 'v4', name: '한국의료기기', category: 'equipment', subCategory: '장비 공급업체', rating: 4.7, reviewCount: 203, certified: true, tags: ['종합장비', '리스가능', 'AS 2년'], description: '의료장비 종합 공급. 초음파, X-ray, 심전도 등 전 품목 취급.', phone: '02-2345-6789' },
    { id: 'v5', name: '메디리스', category: 'equipment', subCategory: '리스회사', rating: 4.4, reviewCount: 67, certified: true, tags: ['장비리스', '운용리스', '금융리스'], description: '의료장비 전문 리스. 초기 자금 부담 없이 장비 도입 가능.' },
    { id: 'v6', name: '디지털메디텍', category: 'equipment', subCategory: '장비 공급업체', rating: 4.3, reviewCount: 34, certified: false, tags: ['디지털장비', 'IT장비', 'EMR연동'], description: '디지털 의료장비 및 IT 인프라 전문. EMR 연동 장비 공급.' },
  ],
  marketing: [
    { id: 'v7', name: '닥터마케팅', category: 'marketing', subCategory: '병원 마케팅 전문', rating: 4.6, reviewCount: 156, certified: true, tags: ['네이버', '블로그', 'SNS'], description: '병·의원 전문 마케팅 대행. 네이버 플레이스 최적화, 블로그 마케팅.', phone: '02-3456-7890' },
    { id: 'v8', name: '메디소셜', category: 'marketing', subCategory: 'SNS 대행', rating: 4.5, reviewCount: 78, certified: false, tags: ['인스타그램', '유튜브', '릴스'], description: 'SNS 전문 의료 마케팅. 인스타그램 운영 대행 및 콘텐츠 제작.' },
  ],
  consulting: [
    { id: 'v9', name: '메디컨설팅그룹', category: 'consulting', subCategory: '개원 컨설팅', rating: 4.9, reviewCount: 89, certified: true, tags: ['개원전문', '입지분석', '사업계획'], description: '개원 전 과정 컨설팅. 입지분석부터 개원 후 안정화까지 토탈 서비스.' },
    { id: 'v10', name: '의료세무회계', category: 'consulting', subCategory: '세무/노무/법률', rating: 4.7, reviewCount: 234, certified: true, tags: ['의료세무', '절세', '경정청구'], description: '의료업 전문 세무법인. 개원 세무 설계 및 절세 컨설팅.' },
    { id: 'v11', name: '메디노무법인', category: 'consulting', subCategory: '세무/노무/법률', rating: 4.5, reviewCount: 56, certified: false, tags: ['노무관리', '근로계약', '4대보험'], description: '의료기관 전문 노무법인. 근로계약서, 취업규칙, 4대보험 관리.' },
  ],
  others: [
    { id: 'v12', name: '메디퍼니처', category: 'others', subCategory: '가구', rating: 4.4, reviewCount: 45, certified: false, tags: ['의료가구', '대기실', '맞춤제작'], description: '의료기관 전문 가구. 대기실 의자, 진료 데스크, 수납장 맞춤 제작.' },
    { id: 'v13', name: '사인매직', category: 'others', subCategory: '간판', rating: 4.3, reviewCount: 67, certified: false, tags: ['LED간판', '실내사인', '층별안내'], description: '병·의원 간판 전문 제작. LED 채널사인, 실내 안내판.' },
    { id: 'v14', name: '메디IT솔루션', category: 'others', subCategory: 'IT/네트워크', rating: 4.6, reviewCount: 89, certified: true, tags: ['네트워크', 'CCTV', '전화시스템'], description: '의료기관 IT 인프라 전문. 네트워크, CCTV, 전화 시스템 설치.' },
  ],
}

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState('interior')
  const [searchQuery, setSearchQuery] = useState('')

  const vendors = DEMO_VENDORS[activeTab] || []
  const filtered = searchQuery
    ? vendors.filter(v =>
        v.name.includes(searchQuery) ||
        v.tags.some(t => t.includes(searchQuery)) ||
        v.subCategory.includes(searchQuery)
      )
    : vendors

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/emr/opening" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold">파트너 / 업체 매칭</h1>
          <p className="text-sm text-muted-foreground">개원에 필요한 검증된 파트너를 찾아보세요</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}
            `}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="업체명, 전문분야 검색..."
          className="w-full text-sm bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Vendor Cards */}
      <div className="space-y-3">
        {filtered.map(vendor => (
          <div key={vendor.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground flex-shrink-0">
                {vendor.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{vendor.name}</h3>
                  {vendor.certified && (
                    <span className="flex items-center gap-0.5 text-xs text-primary">
                      <BadgeCheck className="w-3.5 h-3.5" /> 인증
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{vendor.subCategory}</div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(vendor.rating) ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{vendor.rating}</span>
                  <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {vendor.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{vendor.description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <button className="btn-primary btn-sm flex-1 text-center">견적 요청</button>
              <button className="btn-secondary btn-sm flex-1 text-center">포트폴리오</button>
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} className="btn-icon flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <div className="text-sm text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 파트너가 없습니다'}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-secondary/30 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">원하는 업체를 찾지 못하셨나요?</p>
        <button className="text-sm text-primary font-medium hover:underline mt-1">파트너 등록 요청하기</button>
      </div>
    </div>
  )
}

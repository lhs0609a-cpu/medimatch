import { Metadata } from 'next'

export const siteConfig = {
  name: '메디플라톤',
  description: '의료 개원 생태계의 모든 이해관계자를 연결하는 데이터 기반 통합 플랫폼',
  url: 'https://mediplatone.kr',
  ogImage: '/og-image.png',
  twitterHandle: '@mediplatone',
  email: 'support@mediplatone.kr',
  phone: '02-1234-5678',
}

// JSON-LD 구조화 데이터 생성
export const jsonLd = {
  // 조직 스키마
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: [
      'https://twitter.com/mediplatone',
      'https://www.linkedin.com/company/mediplatone',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.phone,
      contactType: 'customer service',
      availableLanguage: 'Korean',
    },
  },

  // 웹사이트 스키마
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/buildings?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },

  // 소프트웨어 애플리케이션 스키마
  softwareApp: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '메디플라톤 개원 시뮬레이터',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
      description: '무료 개원 시뮬레이션',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  },

  // FAQ 스키마 생성기
  faq: (items: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }),

  // 서비스 스키마 생성기
  service: (name: string, description: string, url: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Medical Practice Consulting',
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
    name,
    description,
    url: `${siteConfig.url}${url}`,
    areaServed: {
      '@type': 'Country',
      name: 'South Korea',
    },
  }),

  // 부동산 매물 스키마 생성기
  realEstateListing: (listing: {
    name: string
    description: string
    address: string
    price: number
    size: number
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.name,
    description: listing.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressCountry: 'KR',
    },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'KRW',
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: listing.size,
      unitCode: 'MTK', // 평방미터
    },
  }),
}

interface PageSEOProps {
  title: string
  description: string
  path?: string
  ogImage?: string
  noIndex?: boolean
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  ogImage,
  noIndex = false,
}: PageSEOProps): Metadata {
  const url = `${siteConfig.url}${path}`
  const image = ogImage || siteConfig.ogImage

  return {
    title,
    description,
    alternates: {
      canonical: path || '/',
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'ko_KR',
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

// 자주 사용되는 페이지 메타데이터 프리셋
export const pageSEO = {
  home: generatePageMetadata({
    title: '메디플라톤 - 의료 개원 통합 솔루션',
    description: '개원 시뮬레이션, 매물 탐색, 파트너 매칭을 한 곳에서. AI 기반 데이터로 성공적인 개원을 시작하세요.',
    path: '/',
  }),

  simulate: generatePageMetadata({
    title: '개원 시뮬레이션',
    description: '3분만에 예상 매출, 비용, 경쟁 현황을 분석하세요. 주소와 진료과목만 입력하면 AI가 개원 타당성을 분석합니다.',
    path: '/simulate',
  }),

  buildings: generatePageMetadata({
    title: '입점 건물 찾기',
    description: '건물주가 직접 등록한 의료시설 적합 상가를 찾아보세요. 보증금, 월세, 주차 등 조건별 필터링.',
    path: '/buildings',
  }),

  partners: generatePageMetadata({
    title: '개원 파트너',
    description: '검증된 인테리어, 의료장비, 컨설팅 파트너를 만나보세요. 성공적인 개원을 위한 전문 업체 연결.',
    path: '/partners',
  }),

  pricing: generatePageMetadata({
    title: 'SalesScanner 요금제',
    description: '개원 준비중인 의사 리드를 확보하세요. 월 10건 30만원부터, 무응답 시 자동 환불.',
    path: '/pricing',
  }),

  pharmacyMatch: generatePageMetadata({
    title: '약국 매매 플랫폼',
    description: '익명으로 안전하게 약국을 사고 파세요. 양측 관심 표시 시에만 연락처가 공개됩니다.',
    path: '/pharmacy-match',
  }),

  prospects: generatePageMetadata({
    title: '개원지 탐색',
    description: '신축 건물, 폐업 병원, 공실 정보를 실시간으로 탐지하세요. 맞춤 알림으로 기회를 놓치지 마세요.',
    path: '/prospects',
  }),

  map: generatePageMetadata({
    title: '개원 지도',
    description: '전국 의료기관, 매물, 인구 데이터를 지도에서 한눈에 확인하세요.',
    path: '/map',
  }),

  dashboard: generatePageMetadata({
    title: '대시보드',
    description: '내 시뮬레이션, 관심 매물, 활동 내역을 한눈에 확인하세요.',
    path: '/dashboard',
    noIndex: true,
  }),

  login: generatePageMetadata({
    title: '로그인',
    description: '메디플라톤에 로그인하여 개원 여정을 시작하세요.',
    path: '/login',
    noIndex: true,
  }),

  register: generatePageMetadata({
    title: '회원가입',
    description: '메디플라톤에 가입하고 무료로 개원 시뮬레이션을 받아보세요.',
    path: '/register',
    noIndex: true,
  }),

  privacy: generatePageMetadata({
    title: '개인정보처리방침',
    description: '메디플라톤의 개인정보처리방침을 확인하세요.',
    path: '/privacy',
  }),

  terms: generatePageMetadata({
    title: '이용약관',
    description: '메디플라톤 서비스 이용약관을 확인하세요.',
    path: '/terms',
  }),

  faq: generatePageMetadata({
    title: '자주 묻는 질문',
    description: '메디플라톤 이용에 대한 자주 묻는 질문과 답변을 확인하세요.',
    path: '/faq',
  }),

  contact: generatePageMetadata({
    title: '문의하기',
    description: '메디플라톤에 문의사항이 있으신가요? 빠르게 답변드리겠습니다.',
    path: '/contact',
  }),
}

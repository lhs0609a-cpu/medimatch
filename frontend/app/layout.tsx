import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { SkipLink } from '@/components/common/SkipLink'
import { GoogleAnalytics, WebVitalsReporter } from '@/components/analytics'
import { InstallPrompt, UpdatePrompt, OfflineIndicator } from '@/components/pwa'
import { jsonLd } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })

const siteConfig = {
  name: '메디플라톤',
  description: '의료 개원 생태계의 모든 이해관계자를 연결하는 데이터 기반 통합 플랫폼. 개원 시뮬레이션, 매물 탐색, 파트너 매칭을 한 곳에서.',
  url: 'https://mediplatone.kr',
  ogImage: '/og-image.png',
  twitterHandle: '@mediplatone',
}

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - 의료 개원 통합 솔루션`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    '개원',
    '병원 개원',
    '의원 개원',
    '약국 개국',
    '개원 컨설팅',
    '의료 부동산',
    '병원 인테리어',
    '의료기기',
    '개원 시뮬레이션',
    '의료 창업',
  ],
  authors: [{ name: '메디플라톤', url: siteConfig.url }],
  creator: '메디플라톤',
  publisher: '메디플라톤',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteConfig.url,
    title: `${siteConfig.name} - 의료 개원 통합 솔루션`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: '메디플라톤 - 의료 개원 통합 솔루션',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - 의료 개원 통합 솔루션`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd.organization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd.website),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd.softwareApp),
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <WebVitalsReporter />
        <SkipLink />
        <Providers>
          <OfflineIndicator />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              classNames: {
                toast: 'bg-background border border-border shadow-lg',
                title: 'text-foreground font-medium',
                description: 'text-muted-foreground text-sm',
                success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
                error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
                warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
                info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
              },
            }}
            richColors
            closeButton
          />
          <InstallPrompt delay={60000} />
          <UpdatePrompt />
        </Providers>
      </body>
    </html>
  )
}

import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/mypage/',
          '/admin/',
          '/payment/',
          '/chat/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}

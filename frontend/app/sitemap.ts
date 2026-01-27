import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url

  // 정적 페이지
  const staticPages = [
    '',
    '/simulate',
    '/buildings',
    '/partners',
    '/pricing',
    '/pharmacy-match',
    '/prospects',
    '/map',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/login',
    '/register',
  ]

  const staticSitemap: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/simulate' ? 0.9 : 0.8,
  }))

  // TODO: 동적 페이지 (buildings/[id], partners/[id] 등)는
  // 실제 DB에서 데이터를 가져와 추가해야 함
  // const dynamicPages = await fetchDynamicPages()

  return staticSitemap
}

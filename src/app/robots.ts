import { MetadataRoute } from 'next'

/**
 * Robots.txt configuration
 * Tells search engines which pages they can crawl
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quotd.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/login',
          '/signup',
        ],
        disallow: [
          '/dashboard/*',
          '/api/*',
          '/finish-setup',
          '/update-password',
          '/settings/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

import {siteUrl} from '@/site-url'
import type {MetadataRoute} from 'next'

export default function robots(): MetadataRoute.Robots {
  return {rules: {userAgent: '*', allow: '/'}, sitemap: `${siteUrl}/sitemap.xml`}
}

import {siteUrl} from '@/site-url'
import type {MetadataRoute} from 'next'
import {client} from '@/sanity/client'
import {PROJECT_SLUGS_QUERY} from '@/sanity/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await client.fetch(PROJECT_SLUGS_QUERY)
  return [
    {url: siteUrl, changeFrequency: 'weekly', priority: 1},
    ...projects.map((p) => ({url: `${siteUrl}/work/${p.slug}`, changeFrequency: 'monthly' as const})),
  ]
}

import {defineQuery} from 'next-sanity'

export const HOME_QUERY = defineQuery(`{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    name, role, location, availability, headline, headlineAccent, intro,
    portrait{asset, hotspot, crop, alt},
    contactHeading, email, whatsapp,
    socials[]{_key, label, url}
  },
  "services": *[_type == "service"] | order(order asc){
    _id, title, track, need, summary,
    proof[]{_key, title, detail, url, "slug": project->slug.current}
  },
  "projects": *[_type == "project" && defined(slug.current)] | order(order asc){
    _id, title, "slug": slug.current, sector, role, period, summary, tags, accent,
    coverImage{asset, hotspot, crop, alt}
  }
}`)

export const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  name, role, location, availability, email, whatsapp, contactHeading,
  socials[]{_key, label, url},
  seo,
  "portraitUrl": portrait.asset->url
}`)

export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id, title, sector, role, period, url, summary, body, outcomes, tags, accent,
  coverImage{asset, hotspot, crop, alt},
  "next": *[_type == "project" && defined(slug.current) && order > ^.order] | order(order asc)[0]{title, "slug": slug.current},
  "first": *[_type == "project" && defined(slug.current)] | order(order asc)[0]{title, "slug": slug.current}
}`)

export const PROJECT_SLUGS_QUERY = defineQuery(
  `*[_type == "project" && defined(slug.current)]{"slug": slug.current}`,
)

export const PRICING_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  pricingIntro,
  pricingPlans[]{_key, name, price, unit, description, includes, actionLabel}
}`)

export const POSTS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, excerpt
}`)

export const POST_QUERY = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  _id, title, publishedAt, excerpt, body, coverImage{asset, hotspot, crop, alt}
}`)

export const POST_SLUGS_QUERY = defineQuery(`*[_type == "post" && defined(slug.current)]{"slug": slug.current}`)

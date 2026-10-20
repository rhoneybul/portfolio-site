import {defineQuery} from 'next-sanity'

export const HOME_QUERY = defineQuery(`{
  "settings": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    name, role, location, availability, headline, headlineAccent, intro,
    portrait{asset, hotspot, crop, alt},
    about,
    stats[]{_key, value, label},
    process[]{_key, title, description},
    "tools": tools[featured == true]{_key, name, icon},
    contactHeading, email, whatsapp, bookingUrl,
    socials[]{_key, label, url}
  },
  "services": *[_type == "service"] | order(order asc){_id, title, summary, deliverables},
  "projects": *[_type == "project" && defined(slug.current)] | order(order asc){
    _id, title, "slug": slug.current, sector, role, period, summary, tags, accent,
    coverImage{asset, hotspot, crop, alt}
  },
  "experience": *[_type == "experience"] | order(startDate desc){
    _id, role, company, descriptor, location, period, badge, summary, highlights, tags
  }
}`)

export const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  name, role, location, availability, email, whatsapp, bookingUrl, contactHeading,
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
  pricingPlans[]{_key, name, price, unit, description, includes, action, actionLabel, bookingUrl}
}`)

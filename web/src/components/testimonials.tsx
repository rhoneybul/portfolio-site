import Link from 'next/link'
import {Arrow} from '@/components/arrow'

type Testimonial = {
  _id: string
  quote: string | null
  name: string | null
  role: string | null
  company: string | null
  slug?: string | null
}

// A client's words, set large under one giant quotation mark
export function Testimonials({items}: {items: Testimonial[]}) {
  if (!items.length) return null
  return (
    <section className="testimonials">
      <h2 className="sr-only">What clients say</h2>
      {items.map((t) => (
        <figure key={t._id} className="testimonial">
          <span className="testimonial__mark" aria-hidden>
            “
          </span>
          <blockquote className="testimonial__quote">
            <p>{t.quote}</p>
          </blockquote>
          <figcaption className="testimonial__by">
            <span>{t.name}</span>
            <span>
              {t.role}
              {t.role && t.company && ', '}
              {t.company && <Company name={t.company} slug={t.slug} />}
            </span>
          </figcaption>
        </figure>
      ))}
    </section>
  )
}

// Links to the company's case study when there is one to go to
function Company({name, slug}: {name: string; slug?: string | null}) {
  if (!slug) return name
  return (
    <Link href={`/work/${slug}`}>
      {name} <Arrow />
    </Link>
  )
}

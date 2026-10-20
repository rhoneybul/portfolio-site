import type {Metadata} from 'next'
import {stegaClean} from 'next-sanity'
import {sanityFetch} from '@/sanity/live'
import {PRICING_QUERY} from '@/sanity/queries'
import {getSettings} from '@/sanity/settings'
import {TopBar} from '@/components/top-bar'
import {SiteFooter} from '@/components/site-footer'
import {ContactSection} from '@/components/contact-section'
import {BookCall} from '@/components/book-call'
import {Marquee} from '@/components/marquee'

export const metadata: Metadata = {title: 'Pricing'}

export default async function PricingPage() {
  const [{data}, settings] = await Promise.all([sanityFetch({query: PRICING_QUERY}), getSettings()])
  const whatsapp = settings?.whatsapp

  return (
    <>
      <TopBar settings={settings} active="pricing" />
      <main>
        <section className="pricing">
          <h1 className="case__title">Pricing</h1>
          {data?.pricingIntro && <Marquee items={[data.pricingIntro, data.pricingIntro]} className="marquee-role" />}

          <ol className="plans">
            {data?.pricingPlans?.map((plan, i) => {
              const bookingUrl = plan.bookingUrl ?? settings?.bookingUrl
              return (
                <li key={plan._key} className="plan">
                  <span className="plan__index">{String(i + 1).padStart(2, '0')}</span>
                  <div className="plan__head">
                    <h2 className="plan__name">{plan.name}</h2>
                    <p className="plan__price">
                      {plan.price}
                      {plan.unit && <span className="plan__unit"> / {plan.unit}</span>}
                    </p>
                  </div>
                  <div className="plan__body">
                    {plan.description && <p>{plan.description}</p>}
                    {!!plan.includes?.length && (
                      <ul className="highlights">
                        {plan.includes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {stegaClean(plan.action) === 'whatsapp' && whatsapp ? (
                      <a
                        className="btn btn-primary"
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                          `Hi Rob, I'd like to talk about ${plan.name?.toLowerCase() ?? 'working together'}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {plan.actionLabel ?? 'Get in touch'} <span aria-hidden>↗</span>
                      </a>
                    ) : (
                      bookingUrl && <BookCall url={bookingUrl} label={plan.actionLabel ?? 'Book a call'} />
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
        <ContactSection settings={settings} />
      </main>
      <SiteFooter settings={settings} />
    </>
  )
}

import {Arrow} from '@/components/arrow'

// The site's one way to get in touch: opens WhatsApp with a message pre-filled
export function WhatsAppButton({number, message, label = 'Message on WhatsApp', variant = 'primary'}: {
  number: string
  message: string
  label?: string
  variant?: 'primary' | 'outline'
}) {
  return (
    <a
      className={`btn btn-${variant}`}
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
    >
      {label} <Arrow />
    </a>
  )
}

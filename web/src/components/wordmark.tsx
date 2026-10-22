import {BRAND, BRAND_MARK} from '@/brand'

// The logo as live type: OLAZ in the display face on its soft swell.
export function Wordmark({className = ''}: {className?: string}) {
  return (
    <p className={`wordmark ${className}`} aria-label={BRAND}>
      <span aria-hidden>{BRAND_MARK}</span>
      <svg className="wordmark__wave" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
        <path d="M0 18.6C24 18.6 36 0 58 0S86 18.6 100 18.6C70 30 30 30 0 18.6Z" />
      </svg>
    </p>
  )
}

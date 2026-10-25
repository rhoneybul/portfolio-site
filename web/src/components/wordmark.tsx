import {BRAND} from '@/brand'

// The logo itself (fohm, the symbol as its o), drawn from the brand kit so it matches exactly.
export function Wordmark({className = ''}: {className?: string}) {
  return (
    <p className={`wordmark-logo ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/svg/fohm-wordmark-tight.svg" alt={BRAND} width={478} height={148} />
    </p>
  )
}

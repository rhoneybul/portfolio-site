import {BRAND} from '@/brand'

// The logo itself (OLAZ at its waterline), drawn from the brand kit so it matches exactly.
export function Wordmark({className = ''}: {className?: string}) {
  return (
    <p className={`wordmark-logo ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/svg/olaz-wordmark-signal.svg" alt={BRAND} width={600} height={220} />
    </p>
  )
}

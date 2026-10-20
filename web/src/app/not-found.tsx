import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="not-found">
      <h1 className="wordmark">404</h1>
      <p className="label">This page doesn’t exist.</p>
      <Link href="/" className="btn btn-primary">
        Back home <span aria-hidden>→</span>
      </Link>
    </main>
  )
}

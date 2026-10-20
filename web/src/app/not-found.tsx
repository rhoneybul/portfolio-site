import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="card hero-404">
        <span className="pill">404</span>
        <h1 className="display">This page doesn’t exist.</h1>
        <Link href="/" className="btn btn-primary">
          Back home <span aria-hidden>→</span>
        </Link>
      </section>
    </main>
  )
}

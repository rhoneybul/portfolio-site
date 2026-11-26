import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {DM_Sans, Space_Grotesk} from 'next/font/google'
import {AppPrototype} from '@/components/app-prototype'
import {resolveOptions} from '@/app-builder/options'
import {readSubmission} from '@/app-builder/submissions'

// The prototype the visitor tapped through, alone: for the owner and Claude to start the app from.
// No answers beyond what it draws, and never their contact details. Found only from the brief.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: 'App prototype', robots: {index: false, follow: false}}

const display = Space_Grotesk({subsets: ['latin'], weight: ['500', '600'], variable: '--x-display'})
const text = DM_Sans({subsets: ['latin'], weight: ['400', '500', '600'], variable: '--x-text'})

export default async function PrototypePage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const s = await readSubmission(id)
  if (!s) notFound()
  const {options} = resolveOptions(s.answers)
  return (
    <main className={`submission__prototype ${display.variable} ${text.variable}`}>
      <AppPrototype o={options} />
    </main>
  )
}

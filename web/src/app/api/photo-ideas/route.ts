import {NextResponse} from 'next/server'
import {ideaAnswers, photoIdeas, templateHint, tidy} from '@/app-builder/photo-ideas'
import type {Answers} from '@/app-builder/options'

/**
 * Turns what a visitor has said about their app into a few photo searches, with Claude through
 * Vercel's AI Gateway: the project's OIDC token on Vercel, or AI_GATEWAY_API_KEY anywhere. If
 * Claude can't be reached, the searches come from the answers alone (photoIdeas), so the photo
 * step always has something to show.
 */

const MODEL = 'anthropic/claude-haiku-5.5'

const ASK = `You pick photo searches for a new app's landing page, onboarding and home screen.
The photos come from Wikimedia Commons, whose search matches words in file titles and descriptions, so plain, concrete words work best.
Reply with JSON only, like {"terms": ["road cycling", "peloton", "alpine pass road", "bike race"]}:
four searches, best first, each one to three plain English words naming something a camera can photograph: an activity, a scene, a place or an object.
No abstract words (events, community, success, wellbeing), no app or brand names.`

// One instance's memory: the same answers never ask twice.
const known = new Map<string, string[]>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const a = ideaAnswers(body?.answers ?? {})
  const fallback = photoIdeas(a)
  const key = JSON.stringify(a)
  if (known.has(key)) return NextResponse.json({terms: known.get(key), from: 'claude'})

  const token = process.env.AI_GATEWAY_API_KEY || request.headers.get('x-vercel-oidc-token') || process.env.VERCEL_OIDC_TOKEN
  const told = [
    a.name && `Name: ${a.name}`,
    a.idea && `What it does, for whom: ${a.idea}`,
    a.business && `The business behind it: ${a.business}`,
    templateHint(a) && `Closest kind of app: ${templateHint(a)}`,
    a.doing && `What people do in it: ${a.doing}`,
    a.interests && `What people are there for: ${a.interests}`,
    a.goals && `What people work towards: ${a.goals}`,
  ].filter(Boolean)
  if (!token || !told.length) return NextResponse.json({terms: fallback, from: 'answers'})

  try {
    const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [
          {role: 'system', content: ASK},
          {role: 'user', content: told.join('\n')},
        ],
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`AI Gateway ${res.status}`)
    const text: string = (await res.json())?.choices?.[0]?.message?.content ?? ''
    const terms = tidy(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}').terms)
    if (!terms.length) throw new Error('No terms')
    if (known.size > 500) known.clear()
    known.set(key, terms)
    return NextResponse.json({terms, from: 'claude'})
  } catch (e) {
    console.warn('photo-ideas: from the answers instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({terms: fallback, from: 'answers'})
  }
}

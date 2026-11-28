import {NextResponse} from 'next/server'
import {Meter, metered} from '@/app-builder/cost'
import {builderPaused} from '@/app-builder/switch'
import {claudeSearches, searchesFromAnswers} from '@/app-builder/photo-searches'
import type {Answers} from '@/app-builder/options'

/**
 * Turns what a visitor has said about their app into a few photo searches, with Claude
 * (app-builder/photo-searches.ts, the same searches the build makes). If Claude can't be reached,
 * the searches come from the answers alone, so the photo step always has something to show.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {answers?: Answers} | null
  const answers = body?.answers ?? {}
  const fallback = () => NextResponse.json({terms: searchesFromAnswers(answers).terms, from: 'answers'})
  if (await builderPaused()) return fallback()
  const meter = new Meter()
  try {
    const {terms} = await metered(meter, () => claudeSearches(answers, Date.now() + 15_000))
    return NextResponse.json({terms, from: 'claude', spent: meter.spent})
  } catch (e) {
    console.warn('photo-ideas: from the answers instead of Claude', e instanceof Error ? e.message : e)
    return NextResponse.json({terms: searchesFromAnswers(answers).terms, from: 'answers', spent: meter.spent})
  }
}

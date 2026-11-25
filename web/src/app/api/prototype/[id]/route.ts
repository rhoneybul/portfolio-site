import {NextResponse} from 'next/server'
import {deployment, prototypesOn} from '@/app-builder/deploy'

/** Where a prototype's build has got to: waiting, building, ready (with its address) or failed. */
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  if (!/^dpl_[A-Za-z0-9]{8,40}$/.test(id)) return NextResponse.json({error: 'No such prototype.'}, {status: 404})
  if (!prototypesOn()) return NextResponse.json({error: 'Building prototypes is off.'}, {status: 503})
  try {
    const {state, url} = await deployment(id)
    return NextResponse.json({state, ...(state === 'ready' ? {url} : {})}, {headers: {'Cache-Control': 'no-store'}})
  } catch (error) {
    console.error('[prototype] state', error)
    return NextResponse.json({error: 'No such prototype.'}, {status: 404})
  }
}

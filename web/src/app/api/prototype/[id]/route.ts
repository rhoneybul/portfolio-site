import {NextResponse} from 'next/server'
import {prototypeState, prototypeUrl, prototypesOn} from '@/app-builder/github'

/** Where a prototype's build has got to: waiting, building, ready (with its address) or failed. */
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  if (!/^[a-z0-9]{8,16}$/.test(id)) return NextResponse.json({error: 'No such prototype.'}, {status: 404})
  if (!prototypesOn()) return NextResponse.json({error: 'Building prototypes is off.'}, {status: 503})
  try {
    const state = await prototypeState(id)
    return NextResponse.json({state, ...(state === 'ready' ? {url: prototypeUrl(id)} : {})}, {headers: {'Cache-Control': 'no-store'}})
  } catch (error) {
    console.error('[prototype] state', error)
    return NextResponse.json({state: 'waiting'})
  }
}

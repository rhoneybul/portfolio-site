import {sanityFetch} from './live'
import {SETTINGS_QUERY} from './queries'

export async function getSettings() {
  const {data} = await sanityFetch({query: SETTINGS_QUERY})
  return data
}

export type Settings = Awaited<ReturnType<typeof getSettings>>

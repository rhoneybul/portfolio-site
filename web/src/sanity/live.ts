import {defineLive} from 'next-sanity/live'
import {client} from './client'

// Published content only; content edits in the Studio appear on the site live.
export const {sanityFetch, SanityLive} = defineLive({client})

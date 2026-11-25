/**
 * The website's builder options (web/src/app-builder/options.ts), so the job resolves answers
 * exactly as the page did. web/ is CommonJS to Node, so they're loaded through require.
 */
import {createRequire} from 'node:module'
import type * as Builder from '../web/src/app-builder/options.ts'

export type {Answers, Options} from '../web/src/app-builder/options.ts'

const builder: typeof Builder = createRequire(import.meta.url)('../web/src/app-builder/options.ts')
export const {emptyAnswers, resolveOptions, slugify} = builder

/**
 * Makes a visitor's app, server side: downloads fohm-scaffold at SCAFFOLD_REF, runs its `new` with
 * the answers as flags (no AI), writes the app's content in (one Claude call, or the answers alone),
 * and returns the files ready to deploy. Runs in the API route's function, in its /tmp.
 */
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {x as untar} from 'tar'
import {contentFromClaude} from './content'
import {contentFromAnswers, writeBrand, writeProgression} from './fill'
import type {Options} from './options'

/** The scaffold's branch: its latest work, until that merges to main. */
const SCAFFOLD_REF = process.env.SCAFFOLD_REF || 'claude/tender-allen-ejoycv'

/** The scaffold, downloaded once per warm function. */
async function scaffold(root: string) {
  const dir = path.join(root, 'scaffold')
  if (fs.existsSync(path.join(dir, 'bin/fohm-scaffold.mjs'))) return dir
  fs.mkdirSync(dir, {recursive: true})
  const res = await fetch(`https://codeload.github.com/rhoneybul/fohm-scaffold/tar.gz/${encodeURIComponent(SCAFFOLD_REF).replace(/%2F/g, '/')}`)
  if (!res.ok || !res.body) throw new Error(`The scaffold didn't download (${res.status}).`)
  await pipeline(Readable.fromWeb(res.body as never), untar({cwd: dir, strip: 1}))
  return dir
}

export interface AppFile {
  file: string
  data: Buffer
}

function filesIn(dir: string, base = dir): AppFile[] {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.git' ? [] : filesIn(full, base)
    return [{file: path.relative(base, full).split(path.sep).join('/'), data: fs.readFileSync(full)}]
  })
}

/** The scaffolder's flags for these options. Arguments go straight to node: no shell reads them. */
function flags(o: Options) {
  const pairs: [string, string][] = [
    ['name', o.name],
    ['idea', o.idea],
    ['business', o.business],
    ['kind', o.kind],
    ['coach', o.coach],
    ['routes', o.routes],
    ['inspiration', o.inspiration],
    ['tagline', o.tagline],
    ['member-word', o.memberWord],
    ['owner-word', o.ownerWord],
    ['operator', o.operator],
    ['country', o.country],
    ['registration', o.registration],
    ['support-email', o.supportEmail],
    ['domain', o.domain],
    ['bundle-id', o.bundleId],
    ['accent', o.accent.toUpperCase()],
  ]
  return pairs.filter(([, v]) => v).flatMap(([k, v]) => [`--${k}`, v])
}

export async function makeApp(o: Options, id: string): Promise<AppFile[]> {
  const root = path.join(os.tmpdir(), 'fohm-builder')
  const from = await scaffold(root)
  const out = path.join(root, 'apps', id)
  fs.rmSync(out, {recursive: true, force: true})
  try {
    execFileSync(process.execPath, [path.join(from, 'bin/fohm-scaffold.mjs'), 'new', out, ...flags(o), '--no-git', '--no-install', '--yes', '--json'], {stdio: 'pipe'})
    const content = (await contentFromClaude(o)) ?? contentFromAnswers(o)
    const progression = path.join(out, 'src/lib/progression.ts')
    const brand = path.join(out, 'src/lib/brand.ts')
    fs.writeFileSync(progression, writeProgression(fs.readFileSync(progression, 'utf8'), content, o))
    fs.writeFileSync(brand, writeBrand(fs.readFileSync(brand, 'utf8'), content))
    return filesIn(out)
  } finally {
    fs.rmSync(out, {recursive: true, force: true})
  }
}

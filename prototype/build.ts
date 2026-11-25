/**
 * The background job behind the website's "Build my real app" (.github/workflows/prototype.yml):
 * makes the visitor's app with fohm-scaffold's `new` from their answers, writes its content in
 * (from one Claude call, or the answers alone), and leaves the folder for the workflow to deploy
 * to Vercel, where it runs in demo mode with no database.
 *
 *   ID=<id> ANSWERS=<base64 JSON> SCAFFOLD_DIR=<scaffold checkout> OUT_DIR=<folder> npx tsx build.ts
 */
import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {resolveOptions, type Answers} from './options.ts'
import {contentFromClaude} from './content.ts'
import {contentFromAnswers, writeBrand, writeProgression} from './fill.ts'

const id = process.env.ID ?? ''
if (!/^[a-z0-9]{8,16}$/.test(id)) throw new Error('ID must be 8 to 16 lower-case letters and digits.')
const scaffold = path.resolve(process.env.SCAFFOLD_DIR ?? '')
const out = path.resolve(process.env.OUT_DIR ?? '')
if (!fs.existsSync(path.join(scaffold, 'bin/fohm-scaffold.mjs'))) throw new Error('SCAFFOLD_DIR is not a fohm-scaffold checkout.')

const answers = JSON.parse(Buffer.from(process.env.ANSWERS ?? '', 'base64').toString('utf8')) as Answers
const {options: o, errors} = resolveOptions(answers)
if (Object.keys(errors).length) throw new Error(`The answers don't pass the scaffolder's checks: ${Object.keys(errors).join(', ')}`)

// The scaffolder's own command, its answers as flags. Arguments go straight to node: nothing is parsed by a shell.
const flags: [string, string][] = [
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
const args = flags.filter(([, v]) => v).flatMap(([k, v]) => [`--${k}`, v])
fs.rmSync(out, {recursive: true, force: true})
execFileSync(process.execPath, [path.join(scaffold, 'bin/fohm-scaffold.mjs'), 'new', out, ...args, '--no-git', '--no-install', '--yes', '--json'], {stdio: 'inherit'})

const content = (await contentFromClaude(o)) ?? contentFromAnswers(o)
const progression = path.join(out, 'src/lib/progression.ts')
const brand = path.join(out, 'src/lib/brand.ts')
fs.writeFileSync(progression, writeProgression(fs.readFileSync(progression, 'utf8'), content, o))
fs.writeFileSync(brand, writeBrand(fs.readFileSync(brand, 'utf8'), content))
console.log(`[build] ${o.name} (${o.kind}) is ready to deploy from ${out}`)

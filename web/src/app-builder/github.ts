/**
 * The prototype job's side of GitHub, for the API routes: starting a run of
 * .github/workflows/prototype.yml with a visitor's answers, and finding it again by its name
 * (`prototype <id>`). Server only: it reads GITHUB_DISPATCH_TOKEN, a fine-grained token with
 * Actions read and write on the site's repository. Without it, building prototypes is off.
 */

const REPO = process.env.PROTOTYPE_REPO || 'rhoneybul/portfolio-site'
const WORKFLOW = 'prototype.yml'
/** How many prototypes may start in an hour, across everyone: the cap on what they cost. */
const HOURLY = Number(process.env.PROTOTYPE_HOURLY_LIMIT || 6)

export const prototypesOn = () => Boolean(process.env.GITHUB_DISPATCH_TOKEN)
export const prototypeUrl = (id: string) => `https://fohm-${id}.vercel.app`

async function github(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? {'Content-Type': 'application/json'} : {}),
    },
  })
  if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`)
  return res.status === 204 ? null : res.json()
}

interface Run {
  display_title: string
  status: string
  conclusion: string | null
  created_at: string
}

const recentRuns = async (since?: string): Promise<Run[]> =>
  (await github(`/actions/workflows/${WORKFLOW}/runs?per_page=100${since ? `&created=>=${since}` : ''}`)).workflow_runs

export async function startedThisHour() {
  return (await recentRuns(new Date(Date.now() - 3600_000).toISOString())).length
}

export const underCap = async () => (await startedThisHour()) < HOURLY

export async function startPrototype(id: string, answers: Record<string, string>) {
  const {default_branch: ref} = await github('')
  await github(`/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ref, inputs: {id, answers: Buffer.from(JSON.stringify(answers)).toString('base64')}}),
  })
}

export type State = 'waiting' | 'building' | 'ready' | 'failed'

/** Where a prototype's run has got to. A run just started may not be listed yet: that's still waiting. */
export async function prototypeState(id: string): Promise<State> {
  const run = (await recentRuns()).find((r) => r.display_title === `prototype ${id}`)
  if (!run) return 'waiting'
  if (run.status !== 'completed') return run.status === 'in_progress' ? 'building' : 'waiting'
  return run.conclusion === 'success' ? 'ready' : 'failed'
}

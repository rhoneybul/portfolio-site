import Image from 'next/image'
import Link from 'next/link'
import {urlFor} from '@/sanity/image'
import {Arrow} from '@/components/arrow'

type Project = {
  _id: string
  title: string | null
  slug: string | null
  sector: string | null
  role: string | null
  accent: string | null
  coverImage: Parameters<typeof urlFor>[0] & {asset?: unknown} | null
}

// A row per project. On hover each shows a preview: its cover image, or for a project without one,
// a card in its accent colour with its name, so every row previews the same way.
export function WorkList({projects}: {projects: Project[]}) {
  return (
    <ol className="work-list">
      {projects.map((project) => (
        <li key={project._id}>
          <Link href={`/work/${project.slug}`} className="work-row">
            <span className="work-row__title">{project.title}</span>
            <span className="work-row__meta">
              <span>{project.sector}</span>
              <span>{project.role}</span>
            </span>
            <span className="work-row__arrow">
              <Arrow />
            </span>
            <Preview project={project} />
          </Link>
        </li>
      ))}
    </ol>
  )
}

function Preview({project}: {project: Project}) {
  if (project.coverImage?.asset) {
    return (
      <Image
        src={urlFor(project.coverImage).width(640).height(420).url()}
        alt=""
        width={640}
        height={420}
        className="work-row__preview"
      />
    )
  }
  return (
    <div
      className="work-row__preview work-row__preview--card"
      style={{background: project.accent ?? undefined}}
      aria-hidden="true"
    >
      <span>{project.title}</span>
      <small>{project.sector}</small>
    </div>
  )
}

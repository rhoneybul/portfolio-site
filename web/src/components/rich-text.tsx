import {PortableText, type PortableTextComponents} from 'next-sanity'
import type {RichText as RichTextValue} from '@/../sanity.types'

const components: PortableTextComponents = {
  marks: {
    link: ({value, children}) => (
      <a href={value?.href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  },
}

export function RichText({value}: {value?: RichTextValue | null}) {
  if (!value?.length) return null
  return <PortableText value={value} components={components} />
}

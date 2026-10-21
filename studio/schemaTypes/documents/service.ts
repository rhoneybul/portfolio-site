import {defineArrayMember, defineField, defineType} from 'sanity'
import {BoltIcon} from '@sanity/icons/Bolt'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: BoltIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({
      name: 'deliverables',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'proof',
      title: 'Proof',
      description: 'Work that shows this service in action, cited under it on the site',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'proofPoint',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'detail', type: 'text', rows: 2}),
            defineField({
              name: 'project',
              title: 'Case study',
              type: 'reference',
              to: [{type: 'project'}],
            }),
            defineField({name: 'url', title: 'External link', type: 'url'}),
          ],
          preview: {select: {title: 'title', subtitle: 'detail'}},
        }),
      ],
    }),
    defineField({
      name: 'order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 10,
    }),
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
})

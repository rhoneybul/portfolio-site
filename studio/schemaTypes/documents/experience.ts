import {defineArrayMember, defineField, defineType} from 'sanity'
import {CaseIcon} from '@sanity/icons/Case'

export const experience = defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({name: 'role', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'company', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'descriptor', type: 'string', description: 'e.g. "Climate tech"'}),
    defineField({name: 'location', type: 'string'}),
    defineField({name: 'period', type: 'string', description: 'e.g. "Mar 2024 — 2026"'}),
    defineField({
      name: 'startDate',
      type: 'date',
      description: 'Used to sort the timeline (newest first)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'badge',
      type: 'string',
      description: 'Optional label, e.g. "Current" or "Flagship"',
    }),
    defineField({name: 'summary', type: 'richText'}),
    defineField({
      name: 'highlights',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 3})],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
  ],
  orderings: [{title: 'Newest first', name: 'startDesc', by: [{field: 'startDate', direction: 'desc'}]}],
  preview: {select: {title: 'role', subtitle: 'company'}},
})

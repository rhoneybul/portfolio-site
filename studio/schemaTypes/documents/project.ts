import {defineArrayMember, defineField, defineType} from 'sanity'
import {ProjectsIcon} from '@sanity/icons/Projects'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Where it shows',
      description:
        'Work: products built through Fohm (the portfolio). Background: roles held before it (career history).',
      type: 'string',
      options: {
        list: [
          {title: 'Work', value: 'work'},
          {title: 'Background', value: 'background'},
        ],
        layout: 'radio',
      },
      initialValue: 'work',
    }),
    defineField({name: 'sector', type: 'string', description: 'e.g. "Consumer cycling app"'}),
    defineField({name: 'role', type: 'string'}),
    defineField({name: 'period', type: 'string', description: 'e.g. "2026 — Present"'}),
    defineField({name: 'url', title: 'Website', type: 'url'}),
    defineField({name: 'summary', type: 'text', rows: 3, validation: (rule) => rule.max(280)}),
    defineField({name: 'body', type: 'richText'}),
    defineField({
      name: 'outcomes',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      description: 'A square logo or app icon, shown beside the name across the site',
      type: 'image',
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'accent',
      title: 'Accent colour',
      description: 'Hex colour used for the card when there is no cover image, e.g. #E8F0E3',
      type: 'string',
      validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/),
    }),
    defineField({name: 'order', type: 'number', initialValue: 10}),
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'role', media: 'coverImage'}},
})

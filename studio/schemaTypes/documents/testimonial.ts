import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'quote',
      description: 'Their words, without quotation marks: the site adds them',
      type: 'text',
      rows: 6,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'role', type: 'string', description: 'e.g. "Founder & CEO"'}),
    defineField({name: 'company', type: 'string'}),
    defineField({
      name: 'project',
      title: 'Case study',
      description: 'Also shows the quote on this case study, and links the company to it',
      type: 'reference',
      to: [{type: 'project'}],
    }),
    defineField({name: 'order', type: 'number', description: 'Lower numbers appear first', initialValue: 10}),
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'company'}},
})

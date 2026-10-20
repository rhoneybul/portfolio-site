import {defineField, defineType} from 'sanity'
import {StarIcon} from '@sanity/icons/Star'

export const certification = defineType({
  name: 'certification',
  title: 'Certification',
  type: 'document',
  icon: StarIcon,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'issuer', type: 'string', description: 'e.g. "Connectd by LinkExec"'}),
    defineField({
      name: 'accreditation',
      type: 'string',
      description: 'Optional accrediting body, e.g. "CPD Certified"',
    }),
    defineField({name: 'issued', title: 'Date issued', type: 'date'}),
    defineField({name: 'description', type: 'text', rows: 3}),
    defineField({
      name: 'image',
      title: 'Certificate image',
      type: 'image',
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'certificate',
      title: 'Certificate (PDF)',
      type: 'file',
      options: {accept: 'application/pdf'},
    }),
    defineField({name: 'credentialUrl', title: 'Verification link', type: 'url'}),
    defineField({name: 'order', type: 'number', initialValue: 10}),
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'issuer', media: 'image'}},
})

import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'about', title: 'About'},
    {name: 'credentials', title: 'Skills & education'},
    {name: 'contact', title: 'Contact'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({name: 'name', type: 'string', group: 'hero', validation: (rule) => rule.required()}),
    defineField({
      name: 'role',
      title: 'Role / positioning',
      description: 'Short line shown under your name, e.g. "Fractional CTO & AI engineering consultant"',
      type: 'string',
      group: 'hero',
    }),
    defineField({name: 'location', type: 'string', group: 'hero'}),
    defineField({
      name: 'availability',
      title: 'Availability',
      description: 'Shown as a status pill in the header',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({
          name: 'status',
          type: 'string',
          options: {
            list: [
              {title: 'Available', value: 'available'},
              {title: 'Limited', value: 'limited'},
              {title: 'Booked', value: 'booked'},
            ],
            layout: 'radio',
          },
          initialValue: 'available',
        }),
        defineField({name: 'label', type: 'string'}),
      ],
    }),
    defineField({
      name: 'headline',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'headlineAccent',
      title: 'Headline accent',
      description: 'Words from the headline to set in the italic serif accent',
      type: 'string',
      group: 'hero',
    }),
    defineField({name: 'intro', type: 'text', rows: 3, group: 'hero'}),
    defineField({
      name: 'portrait',
      type: 'image',
      group: 'hero',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({name: 'about', type: 'richText', group: 'about'}),
    defineField({
      name: 'stats',
      title: 'By the numbers',
      type: 'array',
      group: 'about',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            defineField({name: 'value', type: 'string'}),
            defineField({name: 'label', type: 'string'}),
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({
      name: 'process',
      title: 'How I work',
      type: 'array',
      group: 'about',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'description', type: 'text', rows: 3}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'skillLevels',
      title: 'Core skills',
      type: 'array',
      group: 'credentials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'skillLevel',
          fields: [
            defineField({name: 'name', type: 'string'}),
            defineField({
              name: 'level',
              type: 'string',
              options: {
                list: [
                  {title: 'Expert', value: 'expert'},
                  {title: 'Advanced', value: 'advanced'},
                  {title: 'Proficient', value: 'proficient'},
                ],
                layout: 'radio',
              },
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'level'}},
        }),
      ],
    }),
    defineField({
      name: 'skillGroups',
      title: 'Toolkit',
      type: 'array',
      group: 'credentials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'skillGroup',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'items', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'tools',
      title: 'Tools I use',
      description: 'Shown as an icon grid. Featured tools also float around your portrait.',
      type: 'array',
      group: 'credentials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tool',
          fields: [
            defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'icon',
              type: 'string',
              description:
                'Simple Icons slug, e.g. "supabase" or "nextdotjs" (search at simpleicons.org). Leave empty to show initials.',
            }),
            defineField({
              name: 'category',
              type: 'string',
              options: {
                list: [
                  {title: 'AI', value: 'ai'},
                  {title: 'Build & ship', value: 'build'},
                  {title: 'Cloud & data', value: 'cloud'},
                  {title: 'Product & team', value: 'product'},
                ],
                layout: 'radio',
              },
              initialValue: 'build',
            }),
            defineField({name: 'url', type: 'url'}),
            defineField({name: 'featured', type: 'boolean', initialValue: false}),
          ],
          preview: {select: {title: 'name', subtitle: 'category'}},
        }),
      ],
    }),
    defineField({
      name: 'education',
      type: 'array',
      group: 'credentials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'qualification',
          fields: [
            defineField({name: 'qualification', type: 'string'}),
            defineField({name: 'institution', type: 'string'}),
            defineField({name: 'field', type: 'string'}),
            defineField({name: 'period', type: 'string'}),
            defineField({name: 'description', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'qualification', subtitle: 'institution'}},
        }),
      ],
    }),
    defineField({name: 'contactHeading', type: 'string', group: 'contact'}),
    defineField({name: 'email', type: 'string', group: 'contact', validation: (rule) => rule.email()}),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp number',
      description: 'International format, digits only, e.g. 447432590745',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.regex(/^\d{8,15}$/),
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Booking link',
      description: 'Cal.com or Calendly link for intro calls, e.g. https://cal.com/rob-honeybul/intro. Embedded on the site when set.',
      type: 'url',
      group: 'contact',
    }),
    defineField({
      name: 'cv',
      title: 'CV (PDF)',
      type: 'file',
      group: 'contact',
      options: {accept: 'application/pdf'},
    }),
    defineField({name: 'socials', type: 'array', group: 'contact', of: [defineArrayMember({type: 'link'})]}),
    defineField({
      name: 'seo',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'description', type: 'text', rows: 3}),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})

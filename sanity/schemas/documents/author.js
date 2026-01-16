/**
 * Author Schema - Blog post authors
 */
export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true }
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description: 'A short biography (2-3 sentences)'
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g., "Content Writer", "Marketing Director"'
    },
    {
      name: 'social',
      title: 'Social Links',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          type: 'url',
          title: 'Twitter/X Profile'
        },
        {
          name: 'linkedin',
          type: 'url',
          title: 'LinkedIn Profile'
        },
        {
          name: 'website',
          type: 'url',
          title: 'Personal Website'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image'
    }
  }
};

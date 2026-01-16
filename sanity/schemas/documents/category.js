/**
 * Category Schema - Blog categories
 */
export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Brief description of what this category covers'
    },
    {
      name: 'color',
      title: 'Brand Color',
      type: 'string',
      description: 'Tailwind color class for styling',
      options: {
        list: [
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Purple', value: 'purple' },
          { title: 'Orange', value: 'orange' },
          { title: 'Red', value: 'red' },
          { title: 'Teal', value: 'teal' },
          { title: 'Indigo', value: 'indigo' },
          { title: 'Pink', value: 'pink' }
        ]
      },
      initialValue: 'blue'
    },
    {
      name: 'seo',
      title: 'Category SEO',
      type: 'seo',
      description: 'SEO settings for the category archive page'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description'
    }
  }
};

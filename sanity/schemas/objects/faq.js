/**
 * FAQ Item - For generating FAQPage schema markup
 */
export default {
  name: 'faq',
  title: 'FAQ Item',
  type: 'object',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: Rule => Rule.required().error('Question is required')
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' }
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' }
                ]
              }
            ]
          }
        }
      ],
      validation: Rule => Rule.required().error('Answer is required')
    }
  ],
  preview: {
    select: {
      title: 'question'
    }
  }
};

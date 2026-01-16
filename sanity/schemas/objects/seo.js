/**
 * SEO Settings - Reusable object for SEO metadata
 */
export default {
  name: 'seo',
  title: 'SEO Settings',
  type: 'object',
  fields: [
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Override the default page title (50-60 chars ideal)',
      validation: Rule => Rule.max(70).warning('Keep under 70 characters for best display')
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: '150-160 characters recommended for search results',
      validation: Rule => Rule.max(160).warning('Keep under 160 characters')
    },
    {
      name: 'primaryKeyword',
      title: 'Primary Keyword',
      type: 'string',
      description: 'The main keyword this content targets'
    },
    {
      name: 'secondaryKeywords',
      title: 'Secondary Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Supporting keywords (3-5 recommended)',
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      description: 'Only set if this page should point to a different canonical'
    },
    {
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'Prevent search engines from indexing this page',
      initialValue: false
    },
    {
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      description: '1200x630px recommended for Facebook/LinkedIn, 1200x600px for Twitter',
      options: { hotspot: true }
    }
  ]
};

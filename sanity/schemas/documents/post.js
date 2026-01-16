/**
 * Blog Post Schema - Full blog post with SEO, FAQs, and HowTo steps
 */
export default {
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'metadata', title: 'Metadata' },
    { name: 'schema', title: 'Structured Data' }
  ],
  fields: [
    // ==========================================
    // CONTENT GROUP
    // ==========================================
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: Rule => Rule.required().max(100).error('Title is required and should be under 100 characters')
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required().error('Slug is required for the URL')
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Brief summary shown in blog listings and social shares (150-200 chars)',
      validation: Rule => Rule.required().max(250).error('Excerpt is required and should be under 250 characters')
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Describe the image for accessibility and SEO'
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption'
        }
      ]
    },
    {
      name: 'body',
      title: 'Body Content',
      type: 'array',
      group: 'content',
      of: [
        // Standard block (paragraphs, headings, lists)
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' }
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' }
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
              { title: 'Highlight', value: 'highlight' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strike', value: 'strike-through' }
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'External Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: Rule => Rule.uri({
                      scheme: ['http', 'https', 'mailto', 'tel']
                    })
                  },
                  {
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: true
                  }
                ]
              },
              {
                name: 'internalLink',
                type: 'object',
                title: 'Internal Link',
                fields: [
                  {
                    name: 'reference',
                    type: 'reference',
                    to: [{ type: 'post' }],
                    title: 'Link to Post'
                  }
                ]
              }
            ]
          }
        },
        // Image block
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              description: 'Important for accessibility and SEO'
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            }
          ]
        },
        // Callout box
        {
          type: 'object',
          name: 'callout',
          title: 'Callout Box',
          fields: [
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Tip', value: 'tip' },
                  { title: 'Warning', value: 'warning' },
                  { title: 'Info', value: 'info' },
                  { title: 'Example', value: 'example' }
                ]
              },
              initialValue: 'info'
            },
            {
              name: 'title',
              title: 'Title (optional)',
              type: 'string'
            },
            {
              name: 'content',
              title: 'Content',
              type: 'array',
              of: [{ type: 'block' }]
            }
          ],
          preview: {
            select: {
              type: 'type',
              title: 'title'
            },
            prepare({ type, title }) {
              return {
                title: title || `${type} callout`,
                subtitle: 'Callout Box'
              };
            }
          }
        },
        // Code block
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Code Block',
          fields: [
            {
              name: 'language',
              title: 'Language',
              type: 'string',
              options: {
                list: [
                  { title: 'JavaScript', value: 'javascript' },
                  { title: 'TypeScript', value: 'typescript' },
                  { title: 'HTML', value: 'html' },
                  { title: 'CSS', value: 'css' },
                  { title: 'JSON', value: 'json' },
                  { title: 'Bash', value: 'bash' },
                  { title: 'Python', value: 'python' },
                  { title: 'SQL', value: 'sql' },
                  { title: 'Plain Text', value: 'text' }
                ]
              },
              initialValue: 'javascript'
            },
            {
              name: 'filename',
              title: 'Filename (optional)',
              type: 'string',
              description: 'e.g., "app.js" or "package.json"'
            },
            {
              name: 'code',
              title: 'Code',
              type: 'text',
              rows: 10
            }
          ],
          preview: {
            select: {
              language: 'language',
              filename: 'filename'
            },
            prepare({ language, filename }) {
              return {
                title: filename || `${language} code`,
                subtitle: 'Code Block'
              };
            }
          }
        },
        // Table
        {
          type: 'object',
          name: 'table',
          title: 'Table',
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            },
            {
              name: 'rows',
              title: 'Rows',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {
                      name: 'cells',
                      title: 'Cells',
                      type: 'array',
                      of: [{ type: 'string' }]
                    },
                    {
                      name: 'isHeader',
                      title: 'Header Row',
                      type: 'boolean',
                      initialValue: false
                    }
                  ],
                  preview: {
                    select: {
                      cells: 'cells',
                      isHeader: 'isHeader'
                    },
                    prepare({ cells, isHeader }) {
                      return {
                        title: cells?.slice(0, 3).join(' | ') || 'Empty row',
                        subtitle: isHeader ? 'Header' : 'Data row'
                      };
                    }
                  }
                }
              ]
            }
          ],
          preview: {
            select: {
              caption: 'caption'
            },
            prepare({ caption }) {
              return {
                title: caption || 'Table',
                subtitle: 'Data Table'
              };
            }
          }
        },
        // YouTube embed
        {
          type: 'object',
          name: 'youtube',
          title: 'YouTube Video',
          fields: [
            {
              name: 'url',
              title: 'YouTube URL',
              type: 'url',
              description: 'Paste the full YouTube video URL'
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ],
          preview: {
            select: {
              url: 'url'
            },
            prepare({ url }) {
              return {
                title: 'YouTube Video',
                subtitle: url
              };
            }
          }
        }
      ]
    },

    // ==========================================
    // METADATA GROUP
    // ==========================================
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'metadata'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'metadata',
      validation: Rule => Rule.required().error('Category is required')
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'metadata',
      validation: Rule => Rule.required().error('Publish date is required'),
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      group: 'metadata',
      description: 'Set when content is significantly updated'
    },
    {
      name: 'readingTime',
      title: 'Reading Time (minutes)',
      type: 'number',
      group: 'metadata',
      description: 'Auto-calculated if left empty, or override manually',
      validation: Rule => Rule.min(1).max(60)
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'metadata',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'To Write', value: 'to-write' },
          { title: 'In Progress', value: 'in-progress' },
          { title: 'Needs Review', value: 'needs-review' }
        ],
        layout: 'radio'
      },
      initialValue: 'published',
      description: 'Content status for editorial workflow'
    },
    {
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      group: 'metadata',
      options: {
        list: [
          { title: 'In-Depth Guide', value: 'guide' },
          { title: 'How-To Tutorial', value: 'how-to' },
          { title: 'Listicle', value: 'listicle' },
          { title: 'Problem-Solution', value: 'problem-solution' },
          { title: 'Case Study', value: 'case-study' },
          { title: 'Industry News', value: 'news' },
          { title: 'Product Update', value: 'product' },
          { title: 'Comparison', value: 'comparison' }
        ]
      },
      description: 'Type of content for analytics and internal organization'
    },
    {
      name: 'funnelStage',
      title: 'Funnel Stage',
      type: 'string',
      group: 'metadata',
      options: {
        list: [
          { title: 'Top of Funnel (Awareness)', value: 'tofu' },
          { title: 'Middle of Funnel (Consideration)', value: 'mofu' },
          { title: 'Bottom of Funnel (Decision)', value: 'bofu' }
        ]
      },
      description: 'Where this content fits in the buyer journey'
    },
    {
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
      group: 'metadata',
      description: 'Manually select related posts (max 3)',
      validation: Rule => Rule.max(3)
    },

    // ==========================================
    // SEO GROUP
    // ==========================================
    {
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
      group: 'seo'
    },

    // ==========================================
    // SCHEMA GROUP (Structured Data)
    // ==========================================
    {
      name: 'faqs',
      title: 'FAQ Section',
      type: 'array',
      of: [{ type: 'faq' }],
      group: 'schema',
      description: 'FAQ items that will generate FAQPage schema markup for Google rich results'
    },
    {
      name: 'howToSteps',
      title: 'How-To Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Step Title',
              validation: Rule => Rule.required()
            },
            {
              name: 'text',
              type: 'text',
              title: 'Step Description',
              rows: 3,
              validation: Rule => Rule.required()
            },
            {
              name: 'image',
              type: 'image',
              title: 'Step Image (optional)',
              options: { hotspot: true }
            },
            {
              name: 'url',
              type: 'string',
              title: 'Step URL (optional)',
              description: 'Deep link to this step in the article'
            }
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'text'
            }
          }
        }
      ],
      group: 'schema',
      description: 'Steps that will generate HowTo schema markup for Google rich results'
    }
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      category: 'category.title',
      media: 'featuredImage',
      publishedAt: 'publishedAt',
      status: 'status'
    },
    prepare({ title, author, category, media, publishedAt, status }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Draft';
      const statusLabel = status === 'to-write' ? '📝 TO WRITE | ' :
                          status === 'in-progress' ? '✏️ IN PROGRESS | ' :
                          status === 'needs-review' ? '👀 NEEDS REVIEW | ' : '';
      return {
        title: `${statusLabel}${title}`,
        subtitle: `${category || 'No category'} | ${author || 'No author'} | ${date}`,
        media
      };
    }
  },

  orderings: [
    {
      title: 'Published Date (Newest)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }]
    },
    {
      title: 'Published Date (Oldest)',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }]
    },
    {
      title: 'Title (A-Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }]
    }
  ]
};

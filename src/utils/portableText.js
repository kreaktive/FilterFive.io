/**
 * Portable Text to HTML Renderer
 *
 * Converts Sanity's Portable Text format to semantic HTML
 * with visually stunning Tailwind CSS classes.
 */

const { toHTML } = require('@portabletext/to-html');
const logger = require('../services/logger');

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extract YouTube video ID from URL
 */
function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

/**
 * Custom serializers for Portable Text blocks
 */
const components = {
  // ==========================================
  // Custom Block Types
  // ==========================================
  types: {
    // Image block
    image: ({ value }) => {
      if (!value?.asset?.url && !value?.url) {
        return '';
      }
      const url = value.asset?.url || value.url || value;
      const alt = value.alt || '';
      const caption = value.caption || '';

      return `
        <figure class="my-12 group">
          <div class="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-900/5">
            <img
              src="${escapeHtml(url)}"
              alt="${escapeHtml(alt)}"
              class="w-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 ring-1 ring-inset ring-gray-900/10 rounded-2xl"></div>
          </div>
          ${caption ? `<figcaption class="text-sm text-gray-500 mt-4 text-center italic">${escapeHtml(caption)}</figcaption>` : ''}
        </figure>
      `;
    },

    // Callout box - Clean white card design
    callout: ({ value }) => {
      const typeConfig = {
        tip: {
          accentColor: 'emerald',
          iconBg: 'bg-emerald-500',
          iconColor: 'text-white',
          titleColor: 'text-gray-900',
          borderAccent: 'border-l-emerald-500',
          icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>',
          defaultTitle: 'Pro Tip'
        },
        warning: {
          accentColor: 'amber',
          iconBg: 'bg-amber-500',
          iconColor: 'text-white',
          titleColor: 'text-gray-900',
          borderAccent: 'border-l-amber-500',
          icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
          defaultTitle: 'Warning'
        },
        info: {
          accentColor: 'blue',
          iconBg: 'bg-blue-500',
          iconColor: 'text-white',
          titleColor: 'text-gray-900',
          borderAccent: 'border-l-blue-500',
          icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
          defaultTitle: 'Note'
        },
        example: {
          accentColor: 'violet',
          iconBg: 'bg-violet-500',
          iconColor: 'text-white',
          titleColor: 'text-gray-900',
          borderAccent: 'border-l-violet-500',
          icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
          defaultTitle: 'Example'
        }
      };

      const config = typeConfig[value.style] || typeConfig[value.type] || typeConfig.tip;
      const title = value.title || config.defaultTitle;
      const contentHtml = value.content ? renderPortableText(value.content) : '';

      return `
        <div class="my-10 relative">
          <div class="bg-white rounded-xl border border-gray-200 ${config.borderAccent} border-l-4 p-5 md:p-6 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center ${config.iconColor} shadow-sm">
                ${config.icon}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold ${config.titleColor} text-base mb-1">${escapeHtml(title)}</h4>
                <div class="text-gray-600 leading-relaxed [&>p]:mb-0 [&>p]:text-base">${contentHtml}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Key Takeaways box - Summary at top of article
    keyTakeaways: ({ value }) => {
      const title = value.title || 'Key Takeaways';
      const items = value.items || [];

      if (items.length === 0) return '';

      const itemsHtml = items.map(item => `
        <li class="flex gap-3 items-start">
          <span class="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </span>
          <span class="text-gray-700 text-base leading-relaxed">${escapeHtml(item)}</span>
        </li>
      `).join('');

      return `
        <div class="my-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 md:p-8">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900">${escapeHtml(title)}</h3>
          </div>
          <ul class="space-y-3">
            ${itemsHtml}
          </ul>
        </div>
      `;
    },

    // Code block - Modern dark theme
    codeBlock: ({ value }) => {
      const { language, code, filename } = value;
      const langClass = language ? `language-${language}` : '';

      return `
        <div class="my-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <div class="bg-gradient-to-r from-gray-800 to-gray-900">
            ${filename ? `
              <div class="flex items-center gap-3 px-5 py-3 border-b border-gray-700/50">
                <div class="flex gap-1.5">
                  <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                  <span class="w-3 h-3 rounded-full bg-green-500/80"></span>
                </div>
                <span class="text-gray-400 text-sm font-mono">${escapeHtml(filename)}</span>
              </div>
            ` : `
              <div class="flex gap-1.5 px-5 py-3 border-b border-gray-700/50">
                <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-green-500/80"></span>
              </div>
            `}
            <pre class="p-5 overflow-x-auto text-sm leading-relaxed"><code class="${langClass} text-gray-100">${escapeHtml(code || '')}</code></pre>
          </div>
        </div>
      `;
    },

    // Table - Beautiful card-style table
    table: ({ value }) => {
      const { caption, rows } = value;
      if (!rows || rows.length === 0) return '';

      const rowsHtml = rows.map((row, index) => {
        const isHeader = row.isHeader || index === 0;
        const cellTag = isHeader ? 'th' : 'td';
        const rowBg = isHeader ? 'bg-gray-50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50');
        const cellClass = isHeader
          ? 'px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider'
          : 'px-6 py-4 text-sm text-gray-700';

        const cellsHtml = (row.cells || [])
          .map(cell => `<${cellTag} class="${cellClass}">${escapeHtml(cell)}</${cellTag}>`)
          .join('');

        return `<tr class="${rowBg} transition-colors hover:bg-blue-50/50">${cellsHtml}</tr>`;
      }).join('');

      return `
        <div class="my-10 overflow-hidden rounded-2xl shadow-lg ring-1 ring-gray-200">
          ${caption ? `<div class="px-6 py-3 bg-gray-100 border-b border-gray-200"><span class="text-sm font-medium text-gray-600">${escapeHtml(caption)}</span></div>` : ''}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <tbody class="divide-y divide-gray-100">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // YouTube embed - Modern rounded container
    youtube: ({ value }) => {
      const videoId = getYouTubeId(value.url);
      if (!videoId) return '';

      const caption = value.caption || '';

      return `
        <figure class="my-12">
          <div class="relative pb-[56.25%] h-0 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-gray-900/5">
            <iframe
              class="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube-nocookie.com/embed/${videoId}"
              title="YouTube video"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          ${caption ? `<figcaption class="text-sm text-gray-500 mt-4 text-center italic">${escapeHtml(caption)}</figcaption>` : ''}
        </figure>
      `;
    }
  },

  // ==========================================
  // Mark Annotations (inline elements)
  // ==========================================
  marks: {
    // External link
    link: ({ children, value }) => {
      const href = value?.href || '#';
      const target = value?.openInNewTab !== false ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(href)}" style="color: var(--brand-accent); text-decoration: underline; text-decoration-color: var(--brand-accent); text-decoration-thickness: 2px; text-underline-offset: 2px; transition: all 0.2s;" onmouseover="this.style.color='var(--brand-accent-hover)'; this.style.textDecorationColor='var(--brand-accent-hover)'" onmouseout="this.style.color='var(--brand-accent)'; this.style.textDecorationColor='var(--brand-accent)'" class="font-medium"${target}>${children}</a>`;
    },

    // Internal link (to other posts)
    internalLink: ({ children, value }) => {
      const slug = value?.reference?.slug?.current || value?.reference?.slug || '';
      return `<a href="/blog/${escapeHtml(slug)}" style="color: var(--brand-accent); text-decoration: underline; text-decoration-color: var(--brand-accent); text-decoration-thickness: 2px; text-underline-offset: 2px; transition: all 0.2s;" onmouseover="this.style.color='var(--brand-accent-hover)'; this.style.textDecorationColor='var(--brand-accent-hover)'" onmouseout="this.style.color='var(--brand-accent)'; this.style.textDecorationColor='var(--brand-accent)'" class="font-medium">${children}</a>`;
    },

    // Highlight
    highlight: ({ children }) => {
      return `<mark class="bg-gradient-to-r from-yellow-100 to-amber-100 px-1.5 py-0.5 rounded-md">${children}</mark>`;
    },

    // Inline code
    code: ({ children }) => {
      return `<code class="bg-gray-100 text-pink-600 px-2 py-1 rounded-lg text-sm font-mono font-medium">${children}</code>`;
    },

    // Strong/bold
    strong: ({ children }) => {
      return `<strong class="font-bold text-gray-900">${children}</strong>`;
    },

    // Emphasis/italic
    em: ({ children }) => {
      return `<em class="italic">${children}</em>`;
    },

    // Underline
    underline: ({ children }) => {
      return `<span class="underline decoration-2 underline-offset-2">${children}</span>`;
    },

    // Strike-through
    'strike-through': ({ children }) => {
      return `<del class="text-gray-400 line-through">${children}</del>`;
    }
  },

  // ==========================================
  // Block Styles - Optimized for readability
  // ==========================================
  block: {
    normal: ({ children }) => {
      if (!children || children === '') return '';
      return `<p class="mb-7 text-gray-600 text-[18px] leading-[1.9]">${children}</p>`;
    },

    h2: ({ children }) => {
      const id = children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `
        <div class="section-divider"></div>
        <h2 id="${id}" class="text-2xl md:text-3xl font-bold mb-5 scroll-mt-24" style="color: var(--brand-dark);">
          ${children}
        </h2>
      `;
    },

    h3: ({ children }) => {
      return `
        <h3 class="text-xl font-bold mb-4 mt-10" style="color: var(--brand-dark);">
          ${children}
        </h3>
      `;
    },

    h4: ({ children }) => {
      return `<h4 class="text-lg font-semibold mb-3 mt-8" style="color: var(--brand-accent);">${children}</h4>`;
    },

    blockquote: ({ children }) => {
      return `
        <blockquote class="my-10 relative border-l-4 border-amber-400 pl-6 py-2 bg-amber-50/50 rounded-r-lg pr-6">
          <p class="text-xl text-gray-700 italic leading-relaxed">${children}</p>
        </blockquote>
      `;
    }
  },

  // ==========================================
  // Lists - Visually engaging design
  // ==========================================
  list: {
    bullet: ({ children }) => {
      return `<ul class="my-8 ml-4 space-y-2">${children}</ul>`;
    },

    number: ({ children }) => {
      return `<ol class="my-8 ml-4 space-y-2 counter-reset-list">${children}</ol>`;
    }
  },

  listItem: {
    bullet: ({ children }) => {
      return `
        <li class="flex gap-4 items-start pl-2 py-2 rounded-lg hover:bg-gray-50 transition-colors -ml-2">
          <span class="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center mt-0.5">
            <svg class="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
          </span>
          <span class="text-gray-700 text-[17px] leading-relaxed flex-1">${children}</span>
        </li>
      `;
    },

    number: ({ children }) => {
      return `
        <li class="flex gap-4 items-start counter-increment-list pl-2 py-2 rounded-lg hover:bg-gray-50 transition-colors -ml-2">
          <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mt-0.5 text-white font-bold text-sm shadow-sm counter-display"></span>
          <span class="text-gray-700 text-[17px] leading-relaxed flex-1">${children}</span>
        </li>
      `;
    }
  }
};

/**
 * Render Portable Text blocks to HTML
 * @param {Array} blocks - Portable Text block array
 * @returns {string} HTML string
 */
function renderPortableText(blocks) {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return '';
  }

  try {
    return toHTML(blocks, { components });
  } catch (error) {
    logger.error('Error rendering Portable Text', { error: error.message });
    return '<p class="text-red-500">Content could not be rendered.</p>';
  }
}

/**
 * Render FAQ items for display - Accordion style
 * @param {Array} faqs - FAQ items array
 * @returns {string} HTML string
 */
function renderFAQs(faqs) {
  if (!faqs || faqs.length === 0) return '';

  const faqsHtml = faqs.map((faq, index) => `
    <div class="faq-item group" data-faq-index="${index}">
      <button type="button" class="faq-toggle w-full text-left py-6 flex items-start justify-between gap-4 focus:outline-none rounded-lg" style="--focus-ring-color: var(--brand-accent);" onblur="this.style.outline='none'" onfocus="this.style.outline='2px solid'; this.style.outlineColor='var(--brand-accent)'; this.style.outlineOffset='2px'">
        <span class="flex items-start gap-4">
          <span class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md" style="background: linear-gradient(to bottom right, var(--brand-accent), var(--brand-accent-hover));">${index + 1}</span>
          <span class="text-lg font-bold text-gray-900 transition-colors pt-0.5" style="cursor: pointer;" onmouseover="this.style.color='var(--brand-accent)'" onmouseout="this.style.color='rgb(17, 24, 39)'">${escapeHtml(faq.question)}</span>
        </span>
        <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 transition-colors" onmouseover="this.style.background='rgba(161, 67, 142, 0.1)'" onmouseout="this.style.background='rgb(243, 244, 246)'">
          <svg class="w-5 h-5 text-gray-500 transform transition-transform duration-300 faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>
      <div class="faq-content hidden overflow-hidden">
        <div class="pb-6 pl-12 pr-4 text-gray-600 leading-relaxed text-lg">
          ${typeof faq.answer === 'string' ? escapeHtml(faq.answer) : renderPortableText(faq.answer)}
        </div>
      </div>
    </div>
  `).join('');

  return `
    <section class="mt-20 mb-12">
      <div class="text-center mb-12">
        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm mb-4" style="background: rgba(161, 67, 142, 0.1); color: var(--brand-accent);">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          FAQ
        </span>
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
      </div>
      <div class="bg-white rounded-3xl shadow-xl ring-1 ring-gray-100 divide-y divide-gray-100 overflow-hidden">
        ${faqsHtml}
      </div>
    </section>
    <script>
      document.querySelectorAll('.faq-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          const item = toggle.closest('.faq-item');
          const content = item.querySelector('.faq-content');
          const icon = item.querySelector('.faq-icon');
          const isOpen = !content.classList.contains('hidden');

          // Close all others
          document.querySelectorAll('.faq-item').forEach(other => {
            if (other !== item) {
              other.querySelector('.faq-content').classList.add('hidden');
              other.querySelector('.faq-icon').classList.remove('rotate-180');
            }
          });

          // Toggle current
          content.classList.toggle('hidden');
          icon.classList.toggle('rotate-180');
        });
      });
    </script>
  `;
}

/**
 * Generate FAQPage JSON-LD schema markup
 * @param {Array} faqs - FAQ items array
 * @returns {string} JSON-LD script tag
 */
function generateFAQSchema(faqs) {
  if (!faqs || faqs.length === 0) return '';

  const faqItems = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: typeof faq.answer === 'string' ? faq.answer : renderPortableText(faq.answer).replace(/<[^>]*>/g, '')
    }
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Generate HowTo JSON-LD schema markup
 * @param {Object} post - Post object with howToSteps
 * @returns {string} JSON-LD script tag
 */
function generateHowToSchema(post) {
  if (!post.howToSteps || post.howToSteps.length === 0) return '';

  const steps = post.howToSteps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.title || step.name,
    text: step.description || step.text,
    ...(step.image?.asset?.url && { image: step.image.asset.url }),
    ...(step.url && { url: `https://morestars.io/blog/${post.slug}${step.url}` })
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.excerpt,
    step: steps
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Generate Article JSON-LD schema markup
 * @param {Object} post - Post object
 * @returns {string} JSON-LD script tag
 */
function generateArticleSchema(post) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage?.url || post.imageUrl,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'MoreStars Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'MoreStars',
      logo: {
        '@type': 'ImageObject',
        url: 'https://morestars.io/images/Logo%20MoreStars.io.svg'
      }
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://morestars.io/blog/${post.slug}`
    }
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Generate BreadcrumbList schema for blog posts
 * @param {Object} post - Post object
 * @returns {string} JSON-LD script tag
 */
function generateBreadcrumbSchema(post) {
  const categoryTitle = post.categoryData?.title || post.category || 'Blog';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://morestars.io'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://morestars.io/blog'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://morestars.io/blog/${post.slug}`
      }
    ]
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Generate all schema markup for a post
 * @param {Object} post - Post object
 * @returns {string} Combined JSON-LD script tags
 */
function generateAllSchemas(post) {
  let schemas = generateArticleSchema(post);

  // Add BreadcrumbList schema
  schemas += '\n' + generateBreadcrumbSchema(post);

  if (post.faqs && post.faqs.length > 0) {
    schemas += '\n' + generateFAQSchema(post.faqs);
  }

  if (post.howToSteps && post.howToSteps.length > 0) {
    schemas += '\n' + generateHowToSchema(post);
  }

  return schemas;
}

module.exports = {
  renderPortableText,
  renderFAQs,
  generateFAQSchema,
  generateHowToSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateAllSchemas,
  escapeHtml
};

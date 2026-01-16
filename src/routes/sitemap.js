const express = require('express');
const router = express.Router();
const industries = require('../data/industries');
const sanityService = require('../services/sanityService');
const logger = require('../services/logger');

const DOMAIN = 'https://morestars.io';

/**
 * Helper to escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Static pages with optional images
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/pricing', priority: '0.9', changefreq: 'monthly' },
      { url: '/features', priority: '0.9', changefreq: 'monthly' },
      { url: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
      { url: '/faq', priority: '0.7', changefreq: 'monthly' },
      { url: '/partners', priority: '0.7', changefreq: 'monthly' },
      { url: '/blog', priority: '0.8', changefreq: 'weekly' },
      { url: '/industries', priority: '0.8', changefreq: 'monthly' },
      { url: '/demo', priority: '0.6', changefreq: 'monthly' },
      // Excluding legal pages from sitemap (they have noindex)
    ];

    // Industry pages
    const industryPages = Object.keys(industries).map(slug => ({
      url: `/industries/${slug}`,
      priority: '0.7',
      changefreq: 'monthly'
    }));

    // Blog posts from Sanity (with images for image sitemap)
    let blogPosts = [];
    try {
      const posts = await sanityService.getPostsForSitemap();
      blogPosts = posts.map(post => ({
        url: `/blog/${post.slug}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: post.updatedAt
          ? new Date(post.updatedAt).toISOString().split('T')[0]
          : post.publishedAt
            ? new Date(post.publishedAt).toISOString().split('T')[0]
            : today,
        // Image sitemap data (if featured image exists)
        image: post.featuredImage ? {
          url: post.featuredImage,
          title: post.title,
          caption: post.excerpt
        } : null
      }));
    } catch (error) {
      logger.error('Error fetching blog posts for sitemap', { error: error.message });
      // blogPosts remains empty, sitemap will still work
    }

    const allPages = [...staticPages, ...industryPages, ...blogPosts];

    // Build sitemap with image namespace for blog posts with images
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages.map(page => {
  let entry = `  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;

  // Add image data if present (for blog posts)
  if (page.image) {
    entry += `
    <image:image>
      <image:loc>${escapeXml(page.image.url)}</image:loc>
      <image:title>${escapeXml(page.image.title)}</image:title>
      <image:caption>${escapeXml(page.image.caption)}</image:caption>
    </image:image>`;
  }

  entry += `
  </url>`;
  return entry;
}).join('\n')}
</urlset>`;

    // Cache sitemap for 1 hour (Google recommends updating at most every few hours)
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(sitemap);
  } catch (error) {
    logger.error('Error generating sitemap', { error: error.message });
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;

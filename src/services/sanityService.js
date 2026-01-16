/**
 * Sanity CMS Service
 * Handles content fetching from Sanity with Redis caching
 *
 * Features:
 * - GROQ queries for efficient data fetching
 * - Redis caching via cacheService
 * - Graceful fallback to hardcoded data if Sanity unavailable
 * - Cache invalidation via webhooks
 */

const { client, previewClient, isConfigured } = require('../config/sanity');
const cacheService = require('./cacheService');
const logger = require('./logger');

// Fallback data for graceful degradation
const {
  getAllPosts: getFallbackPosts,
  getPostBySlug: getFallbackPost,
  getRelatedPosts: getFallbackRelatedPosts
} = require('../data/blogPosts');

// ============================================
// Cache Configuration
// ============================================

const CACHE_KEYS = {
  ALL_POSTS: 'sanity:posts:all',
  POST: (slug) => `sanity:posts:slug:${slug}`,
  CATEGORY_POSTS: (slug) => `sanity:posts:category:${slug}`,
  RELATED_POSTS: (slug) => `sanity:posts:related:${slug}`,
  CATEGORIES: 'sanity:categories:all',
  AUTHORS: 'sanity:authors:all',
  SITEMAP_POSTS: 'sanity:posts:sitemap'
};

const TTL = {
  POSTS_LIST: 300,      // 5 minutes for blog listing
  POST_SINGLE: 600,     // 10 minutes for individual post
  CATEGORIES: 1800,     // 30 minutes for categories
  AUTHORS: 1800,        // 30 minutes for authors
  SITEMAP: 300          // 5 minutes for sitemap data
};

// ============================================
// GROQ Queries
// ============================================

const QUERIES = {
  ALL_POSTS: `
    *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      readingTime,
      contentType,
      "category": category->{
        _id,
        title,
        "slug": slug.current,
        color
      },
      "author": author->{
        name,
        "slug": slug.current,
        "image": image.asset->url
      },
      "featuredImage": featuredImage.asset->url,
      "featuredImageAlt": featuredImage.alt
    }
  `,

  POST_BY_SLUG: `
    *[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      body,
      publishedAt,
      updatedAt,
      readingTime,
      contentType,
      funnelStage,
      faqs,
      howToSteps,
      "category": category->{
        _id,
        title,
        "slug": slug.current,
        color,
        description
      },
      "author": author->{
        name,
        "slug": slug.current,
        "image": image.asset->url,
        bio,
        role,
        social
      },
      "featuredImage": featuredImage.asset->url,
      "featuredImageAlt": featuredImage.alt,
      "featuredImageCaption": featuredImage.caption,
      seo,
      "relatedPosts": relatedPosts[]->{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        "category": category->{title, color},
        "featuredImage": featuredImage.asset->url,
        readingTime
      }
    }
  `,

  RELATED_POSTS_BY_CATEGORY: `
    *[_type == "post" && slug.current != $slug && category._ref == $categoryId && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...3] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      "category": category->{title, color},
      "featuredImage": featuredImage.asset->url,
      readingTime
    }
  `,

  POSTS_FOR_SITEMAP: `
    *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      "slug": slug.current,
      publishedAt,
      updatedAt
    }
  `,

  CATEGORIES: `
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      color
    }
  `,

  POSTS_BY_CATEGORY: `
    *[_type == "post" && category->slug.current == $categorySlug && !(_id in path("drafts.**"))] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      readingTime,
      "category": category->{title, "slug": slug.current, color},
      "author": author->{name},
      "featuredImage": featuredImage.asset->url,
      "featuredImageAlt": featuredImage.alt
    }
  `
};

// ============================================
// Service Class
// ============================================

class SanityService {
  constructor() {
    this.client = client;
    this.previewClient = previewClient;
    this.isConfigured = isConfigured;

    if (!this.isConfigured) {
      logger.warn('Sanity not configured - using fallback blog data');
    }
  }

  /**
   * Get the appropriate Sanity client
   */
  _getClient(preview = false) {
    return preview ? this.previewClient : this.client;
  }

  // ============================================
  // Blog Post Methods
  // ============================================

  /**
   * Get all published blog posts
   * @param {Object} options - Query options
   * @param {boolean} options.preview - Use preview client for drafts
   * @param {boolean} options.bypassCache - Skip cache lookup
   * @returns {Promise<Array>} List of posts
   */
  async getAllPosts({ preview = false, bypassCache = false } = {}) {
    // Fallback if not configured
    if (!this.isConfigured) {
      return this._transformFallbackPosts(getFallbackPosts());
    }

    const cacheKey = CACHE_KEYS.ALL_POSTS;

    // Try cache first (unless preview or bypass)
    if (!preview && !bypassCache && cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const client = this._getClient(preview);
      const posts = await client.fetch(QUERIES.ALL_POSTS);
      const transformed = this._transformPosts(posts);

      // Cache the result
      if (!preview && cacheService.isAvailable()) {
        await cacheService.set(cacheKey, transformed, TTL.POSTS_LIST);
      }

      return transformed;
    } catch (error) {
      logger.error('Error fetching posts from Sanity', { error: error.message });
      // Graceful degradation to hardcoded data
      return this._transformFallbackPosts(getFallbackPosts());
    }
  }

  /**
   * Get a single post by slug
   * @param {string} slug - Post slug
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Post or null
   */
  async getPostBySlug(slug, { preview = false, bypassCache = false } = {}) {
    if (!this.isConfigured) {
      const fallbackPost = getFallbackPost(slug);
      return fallbackPost ? this._transformFallbackPost(fallbackPost) : null;
    }

    const cacheKey = CACHE_KEYS.POST(slug);

    // Try cache first
    if (!preview && !bypassCache && cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const client = this._getClient(preview);
      const post = await client.fetch(QUERIES.POST_BY_SLUG, { slug });

      if (!post) {
        // Try fallback
        const fallbackPost = getFallbackPost(slug);
        return fallbackPost ? this._transformFallbackPost(fallbackPost) : null;
      }

      const transformed = this._transformPost(post);

      // Cache the result
      if (!preview && cacheService.isAvailable()) {
        await cacheService.set(cacheKey, transformed, TTL.POST_SINGLE);
      }

      return transformed;
    } catch (error) {
      logger.error('Error fetching post from Sanity', { slug, error: error.message });
      const fallbackPost = getFallbackPost(slug);
      return fallbackPost ? this._transformFallbackPost(fallbackPost) : null;
    }
  }

  /**
   * Get related posts (by same category, excluding current)
   * @param {string} slug - Current post slug to exclude
   * @param {string} categoryId - Sanity category document ID
   * @param {number} limit - Max number of posts
   * @returns {Promise<Array>} Related posts
   */
  async getRelatedPosts(slug, categoryId, limit = 3) {
    if (!this.isConfigured || !categoryId) {
      return this._transformFallbackPosts(
        getFallbackRelatedPosts(slug, limit)
      );
    }

    const cacheKey = CACHE_KEYS.RELATED_POSTS(slug);

    // Try cache first
    if (cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached.slice(0, limit);
      }
    }

    try {
      const posts = await this.client.fetch(QUERIES.RELATED_POSTS_BY_CATEGORY, {
        slug,
        categoryId
      });

      const result = posts.slice(0, limit);

      // Cache the result
      if (cacheService.isAvailable()) {
        await cacheService.set(cacheKey, result, TTL.POSTS_LIST);
      }

      return result;
    } catch (error) {
      logger.error('Error fetching related posts', { slug, error: error.message });
      return this._transformFallbackPosts(getFallbackRelatedPosts(slug, limit));
    }
  }

  /**
   * Get posts for sitemap generation
   * @returns {Promise<Array>} Posts with slugs and dates
   */
  async getPostsForSitemap() {
    if (!this.isConfigured) {
      return getFallbackPosts().map(p => ({
        slug: p.slug,
        publishedAt: p.date,
        updatedAt: null
      }));
    }

    const cacheKey = CACHE_KEYS.SITEMAP_POSTS;

    // Try cache
    if (cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const posts = await this.client.fetch(QUERIES.POSTS_FOR_SITEMAP);

      if (cacheService.isAvailable()) {
        await cacheService.set(cacheKey, posts, TTL.SITEMAP);
      }

      return posts;
    } catch (error) {
      logger.error('Error fetching posts for sitemap', { error: error.message });
      return getFallbackPosts().map(p => ({ slug: p.slug }));
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    if (!this.isConfigured) {
      // Extract unique categories from fallback posts
      const posts = getFallbackPosts();
      const unique = [...new Set(posts.map(p => p.category))];
      return unique.map(c => ({
        title: c,
        slug: c.toLowerCase().replace(/\s+/g, '-'),
        color: 'blue'
      }));
    }

    const cacheKey = CACHE_KEYS.CATEGORIES;

    if (cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const categories = await this.client.fetch(QUERIES.CATEGORIES);

      if (cacheService.isAvailable()) {
        await cacheService.set(cacheKey, categories, TTL.CATEGORIES);
      }

      return categories;
    } catch (error) {
      logger.error('Error fetching categories', { error: error.message });
      return [];
    }
  }

  /**
   * Get posts by category slug
   * @param {string} categorySlug - Category slug
   * @returns {Promise<Array>} Posts in category
   */
  async getPostsByCategory(categorySlug) {
    if (!this.isConfigured) {
      const posts = getFallbackPosts().filter(
        p => p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug
      );
      return this._transformFallbackPosts(posts);
    }

    const cacheKey = CACHE_KEYS.CATEGORY_POSTS(categorySlug);

    if (cacheService.isAvailable()) {
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const posts = await this.client.fetch(QUERIES.POSTS_BY_CATEGORY, { categorySlug });
      const transformed = this._transformPosts(posts);

      if (cacheService.isAvailable()) {
        await cacheService.set(cacheKey, transformed, TTL.POSTS_LIST);
      }

      return transformed;
    } catch (error) {
      logger.error('Error fetching posts by category', { categorySlug, error: error.message });
      return [];
    }
  }

  // ============================================
  // Cache Invalidation
  // ============================================

  /**
   * Invalidate all blog-related cache
   * Called by webhook on content publish
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateAllBlogCache() {
    const deleted = await cacheService.delPattern('sanity:*');
    logger.info('Invalidated all Sanity cache', { keysDeleted: deleted });
    return deleted;
  }

  /**
   * Invalidate cache for a specific post
   * @param {string} slug - Post slug
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidatePostCache(slug) {
    if (!cacheService.isAvailable()) return 0;

    let deleted = 0;

    // Delete specific post cache
    if (await cacheService.del(CACHE_KEYS.POST(slug))) deleted++;

    // Delete related posts cache for this post
    if (await cacheService.del(CACHE_KEYS.RELATED_POSTS(slug))) deleted++;

    // Also invalidate the posts list (since it contains this post)
    if (await cacheService.del(CACHE_KEYS.ALL_POSTS)) deleted++;

    // Invalidate sitemap cache
    if (await cacheService.del(CACHE_KEYS.SITEMAP_POSTS)) deleted++;

    logger.info('Invalidated post cache', { slug, keysDeleted: deleted });
    return deleted;
  }

  // ============================================
  // Data Transformation
  // ============================================

  /**
   * Transform Sanity post to consistent format for views
   */
  _transformPost(post) {
    return {
      id: post._id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body, // Portable Text array - rendered in view
      htmlContent: null, // Not used for Sanity posts
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      date: this._formatDate(post.publishedAt), // Formatted date for display
      readTime: `${post.readingTime || this._estimateReadingTime(post.body)} min read`,
      readingTime: post.readingTime || this._estimateReadingTime(post.body),
      contentType: post.contentType,
      funnelStage: post.funnelStage,
      category: post.category?.title || 'Uncategorized',
      categoryData: post.category,
      author: post.author || { name: 'MoreStars Team' },
      imageUrl: post.featuredImage, // Compatibility with old views
      featuredImage: {
        url: post.featuredImage,
        alt: post.featuredImageAlt || post.title,
        caption: post.featuredImageCaption
      },
      seo: {
        metaTitle: post.seo?.metaTitle || `${post.title} | MoreStars Blog`,
        metaDescription: post.seo?.metaDescription || post.excerpt,
        primaryKeyword: post.seo?.primaryKeyword,
        secondaryKeywords: post.seo?.secondaryKeywords || [],
        ogImage: post.seo?.ogImage?.asset?.url || post.featuredImage,
        canonicalUrl: post.seo?.canonicalUrl,
        noIndex: post.seo?.noIndex || false
      },
      faqs: post.faqs || [],
      howToSteps: post.howToSteps || [],
      relatedPosts: post.relatedPosts || []
    };
  }

  /**
   * Transform multiple Sanity posts (for listings)
   */
  _transformPosts(posts) {
    return posts.map(post => ({
      id: post._id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      date: this._formatDate(post.publishedAt),
      readTime: `${post.readingTime || 5} min read`,
      readingTime: post.readingTime || 5,
      contentType: post.contentType,
      category: post.category?.title || 'Uncategorized',
      categoryData: post.category,
      author: post.author,
      imageUrl: post.featuredImage,
      featuredImage: {
        url: post.featuredImage,
        alt: post.featuredImageAlt || post.title
      }
    }));
  }

  /**
   * Transform fallback post to match Sanity format
   */
  _transformFallbackPost(post) {
    return {
      id: `fallback-${post.slug}`,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      body: null, // No Portable Text for fallback
      htmlContent: post.content, // Original HTML content
      publishedAt: post.date,
      updatedAt: null,
      date: post.date,
      readTime: post.readTime,
      readingTime: parseInt(post.readTime) || 5,
      contentType: null,
      funnelStage: null,
      category: post.category,
      categoryData: {
        title: post.category,
        slug: post.category.toLowerCase().replace(/\s+/g, '-'),
        color: 'blue'
      },
      author: { name: 'MoreStars Team' },
      imageUrl: post.imageUrl,
      featuredImage: {
        url: post.imageUrl,
        alt: post.title,
        caption: null
      },
      seo: {
        metaTitle: `${post.title} | MoreStars Blog`,
        metaDescription: post.excerpt,
        primaryKeyword: null,
        secondaryKeywords: [],
        ogImage: post.imageUrl,
        canonicalUrl: null,
        noIndex: false
      },
      faqs: [],
      howToSteps: [],
      relatedPosts: []
    };
  }

  /**
   * Transform multiple fallback posts
   */
  _transformFallbackPosts(posts) {
    return posts.map(post => ({
      id: `fallback-${post.slug}`,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.date,
      date: post.date,
      readTime: post.readTime,
      readingTime: parseInt(post.readTime) || 5,
      category: post.category,
      categoryData: {
        title: post.category,
        slug: post.category.toLowerCase().replace(/\s+/g, '-'),
        color: 'blue'
      },
      author: { name: 'MoreStars Team' },
      imageUrl: post.imageUrl,
      featuredImage: {
        url: post.imageUrl,
        alt: post.title
      }
    }));
  }

  /**
   * Format ISO date to display format
   */
  _formatDate(isoDate) {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoDate;
    }
  }

  /**
   * Estimate reading time from Portable Text blocks
   */
  _estimateReadingTime(body) {
    if (!body || !Array.isArray(body)) return 5;

    const text = body
      .filter(block => block._type === 'block')
      .map(block => block.children?.map(c => c.text).join(' ') || '')
      .join(' ');

    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }
}

// Export singleton instance
module.exports = new SanityService();

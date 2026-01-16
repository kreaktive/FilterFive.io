/**
 * Blog posts data - Fallback when Sanity CMS is not configured
 * Production should use Sanity CMS for blog content
 */

const BLOG_POSTS = [];

/**
 * Get all blog posts
 * @returns {Array} All blog posts
 */
function getAllPosts() {
  return BLOG_POSTS;
}

/**
 * Get a single blog post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} The blog post or null if not found
 */
function getPostBySlug(slug) {
  return BLOG_POSTS.find(post => post.slug === slug) || null;
}

/**
 * Get related posts (excluding the current post)
 * @param {string} currentSlug - The slug to exclude
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} Related posts
 */
function getRelatedPosts(currentSlug, limit = 3) {
  return BLOG_POSTS.filter(post => post.slug !== currentSlug).slice(0, limit);
}

module.exports = {
  BLOG_POSTS,
  getAllPosts,
  getPostBySlug,
  getRelatedPosts
};

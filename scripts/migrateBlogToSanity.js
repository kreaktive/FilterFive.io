#!/usr/bin/env node
/**
 * Sanity Blog Migration Script
 *
 * This script helps set up initial content structure in Sanity.
 * It creates:
 * - Default author (MoreStars Team)
 * - Categories from existing blog posts
 * - Basic post stubs (HTML content needs manual conversion to Portable Text)
 *
 * Usage:
 *   1. Set up environment variables in .env
 *   2. Run: node scripts/migrateBlogToSanity.js
 *
 * Note: This creates document stubs. You'll need to manually convert
 * HTML content to Portable Text in Sanity Studio.
 */

require('dotenv').config();
const { createClient } = require('@sanity/client');

// Sanity configuration
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // Needs write access
  useCdn: false
});

// Legacy blog posts for reference (we'll create stubs in Sanity)
const LEGACY_POSTS = [
  {
    slug: 'how-to-ask-for-reviews',
    title: "How to Ask for Reviews Without Being Awkward",
    excerpt: "Asking for a favor can feel uncomfortable. Here are 3 scripts to make it natural, professional, and effective.",
    date: "2024-10-24",
    readTime: "4 min read",
    category: "Guides"
  },
  {
    slug: 'google-reviews-seo-2025',
    title: "Why Google Reviews Matter More Than You Think in 2025",
    excerpt: "It's not just about social proof. Reviews are a top ranking factor for local SEO. Here is the data.",
    date: "2024-11-02",
    readTime: "5 min read",
    category: "Strategy"
  },
  {
    slug: 'handling-negative-reviews',
    title: "The Art of Handling Negative Reviews",
    excerpt: "One bad review isn't the end of the world. In fact, if handled correctly, it can actually win you new customers.",
    date: "2024-11-15",
    readTime: "3 min read",
    category: "Reputation"
  },
  {
    slug: 'qr-codes-vs-sms',
    title: "QR Codes vs. SMS: Which is Better for Reviews?",
    excerpt: "Should you print a code or send a text? We analyze response rates, convenience, and use cases for both methods.",
    date: "2024-11-28",
    readTime: "6 min read",
    category: "Guides"
  }
];

// Category definitions with colors and SEO
const CATEGORIES = {
  'Guides': {
    title: 'Guides',
    slug: 'guides',
    description: 'Step-by-step guides and tutorials for getting more reviews.',
    color: '#3B82F6' // Blue
  },
  'Strategy': {
    title: 'Strategy',
    slug: 'strategy',
    description: 'Strategic insights on reputation management and local SEO.',
    color: '#10B981' // Green
  },
  'Reputation': {
    title: 'Reputation',
    slug: 'reputation',
    description: 'Tips for managing and improving your online reputation.',
    color: '#8B5CF6' // Purple
  },
  'Case Studies': {
    title: 'Case Studies',
    slug: 'case-studies',
    description: 'Real success stories from MoreStars customers.',
    color: '#F59E0B' // Amber
  },
  'Product Updates': {
    title: 'Product Updates',
    slug: 'product-updates',
    description: 'New features and improvements to MoreStars.',
    color: '#EC4899' // Pink
  }
};

/**
 * Create the default author
 */
async function createAuthor() {
  const authorId = 'author-morestars-team';

  const author = {
    _id: authorId,
    _type: 'author',
    name: 'MoreStars Team',
    slug: { _type: 'slug', current: 'morestars-team' },
    bio: [
      {
        _type: 'block',
        _key: 'bio1',
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 'span1',
            text: 'The MoreStars team helps local businesses get more 5-star reviews through smart SMS and QR code campaigns.'
          }
        ]
      }
    ],
    role: 'Content Team'
  };

  try {
    const result = await client.createOrReplace(author);
    console.log(`✅ Created author: ${result.name}`);
    return result._id;
  } catch (error) {
    console.error(`❌ Error creating author:`, error.message);
    throw error;
  }
}

/**
 * Create all categories
 */
async function createCategories() {
  const categoryIds = {};

  for (const [name, data] of Object.entries(CATEGORIES)) {
    const categoryId = `category-${data.slug}`;

    const category = {
      _id: categoryId,
      _type: 'category',
      title: data.title,
      slug: { _type: 'slug', current: data.slug },
      description: data.description,
      color: data.color
    };

    try {
      const result = await client.createOrReplace(category);
      console.log(`✅ Created category: ${result.title}`);
      categoryIds[name] = result._id;
    } catch (error) {
      console.error(`❌ Error creating category ${name}:`, error.message);
    }
  }

  return categoryIds;
}

/**
 * Create post stubs (without full content - needs manual Portable Text conversion)
 */
async function createPostStubs(authorId, categoryIds) {
  for (const post of LEGACY_POSTS) {
    const postId = `post-${post.slug}`;
    const categoryId = categoryIds[post.category];

    // Parse date string to ISO format
    const publishedAt = new Date(post.date).toISOString();

    // Extract reading time number
    const readingTime = parseInt(post.readTime) || 5;

    const sanityPost = {
      _id: postId,
      _type: 'post',
      title: post.title,
      slug: { _type: 'slug', current: post.slug },
      excerpt: post.excerpt,
      author: { _type: 'reference', _ref: authorId },
      category: categoryId ? { _type: 'reference', _ref: categoryId } : undefined,
      publishedAt,
      readingTime,
      contentType: 'guide',
      funnelStage: 'awareness',
      // Placeholder body - needs manual conversion
      body: [
        {
          _type: 'block',
          _key: 'placeholder1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: `[PLACEHOLDER] This post needs content migration. Original excerpt: ${post.excerpt}`
            }
          ]
        },
        {
          _type: 'block',
          _key: 'placeholder2',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span2',
              text: 'Please edit this post in Sanity Studio to add the full content using Portable Text.'
            }
          ]
        }
      ],
      // SEO metadata stub
      seo: {
        _type: 'seo',
        metaTitle: post.title,
        metaDescription: post.excerpt
      }
    };

    try {
      const result = await client.createOrReplace(sanityPost);
      console.log(`✅ Created post stub: ${result.title}`);
    } catch (error) {
      console.error(`❌ Error creating post ${post.slug}:`, error.message);
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n🚀 Starting Sanity Blog Migration\n');
  console.log('Project ID:', process.env.SANITY_PROJECT_ID);
  console.log('Dataset:', process.env.SANITY_DATASET || 'production');
  console.log('');

  // Verify configuration
  if (!process.env.SANITY_PROJECT_ID) {
    console.error('❌ SANITY_PROJECT_ID is not set. Please configure your .env file.');
    process.exit(1);
  }

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN is not set. A token with write access is required.');
    process.exit(1);
  }

  try {
    // Step 1: Create author
    console.log('\n📝 Creating author...');
    const authorId = await createAuthor();

    // Step 2: Create categories
    console.log('\n📁 Creating categories...');
    const categoryIds = await createCategories();

    // Step 3: Create post stubs
    console.log('\n📄 Creating post stubs...');
    await createPostStubs(authorId, categoryIds);

    console.log('\n✨ Migration complete!\n');
    console.log('Next steps:');
    console.log('1. Open Sanity Studio at your-project.sanity.studio');
    console.log('2. Edit each post to convert HTML content to Portable Text');
    console.log('3. Add featured images to each post');
    console.log('4. Add SEO keywords and metadata');
    console.log('5. Publish the posts when ready');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate();

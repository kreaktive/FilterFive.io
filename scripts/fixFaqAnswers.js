#!/usr/bin/env node
/**
 * Fix FAQ Answers in Sanity
 *
 * Converts FAQ answer fields from plain strings to Portable Text arrays
 */

require('dotenv').config();
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});

// Helper to create Portable Text block from string
function textToPortableText(text) {
  return [
    {
      _type: 'block',
      _key: `block-${Math.random().toString(36).substr(2, 9)}`,
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: `span-${Math.random().toString(36).substr(2, 9)}`,
          text: text,
          marks: []
        }
      ],
      markDefs: []
    }
  ];
}

async function fixFaqAnswers() {
  console.log('🔧 Fixing FAQ answers in Sanity...\n');

  // Fetch all posts with FAQs
  const posts = await client.fetch(`*[_type == "post" && defined(faqs)]{ _id, title, faqs }`);

  console.log(`Found ${posts.length} posts with FAQs\n`);

  for (const post of posts) {
    console.log(`📝 Processing: ${post.title}`);

    if (!post.faqs || post.faqs.length === 0) {
      console.log('   No FAQs found, skipping...\n');
      continue;
    }

    // Check if any FAQ has string answers (needs fixing)
    const needsFix = post.faqs.some(faq => typeof faq.answer === 'string');

    if (!needsFix) {
      console.log('   FAQs already in correct format, skipping...\n');
      continue;
    }

    // Fix the FAQs
    const fixedFaqs = post.faqs.map(faq => {
      if (typeof faq.answer === 'string') {
        console.log(`   🔄 Converting FAQ: "${faq.question.substring(0, 50)}..."`);
        return {
          ...faq,
          answer: textToPortableText(faq.answer)
        };
      }
      return faq;
    });

    // Update the post
    try {
      await client
        .patch(post._id)
        .set({ faqs: fixedFaqs })
        .commit();
      console.log(`   ✅ Fixed ${fixedFaqs.length} FAQs\n`);
    } catch (error) {
      console.error(`   ❌ Error updating post: ${error.message}\n`);
    }
  }

  console.log('✅ Done fixing FAQ answers!');
}

fixFaqAnswers().catch(console.error);

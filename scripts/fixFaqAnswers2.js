#!/usr/bin/env node
/**
 * Fix FAQ Answers in Sanity - Complete Rewrite
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

// Helper to create a proper Portable Text block
function createAnswerBlock(text) {
  return [
    {
      _type: 'block',
      _key: 'block-' + Math.random().toString(36).substr(2, 9),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'span-' + Math.random().toString(36).substr(2, 9),
          text: text,
          marks: []
        }
      ]
    }
  ];
}

const faqData = [
  {
    question: 'Is it legal to ask customers for Google reviews?',
    answerText: "Yes. Google explicitly allows businesses to ask for reviews. What's NOT allowed: offering incentives, only asking happy customers (review gating), or asking for a specific star rating. Simply asking customers to share their honest experience is completely fine."
  },
  {
    question: 'How many Google reviews do I need to rank higher on Google?',
    answerText: "There's no magic number. What matters is having more reviews than your competitors, maintaining a high average rating, and getting reviews consistently over time (not in suspicious bursts). Search your service + \"near me\" and see what the top 3 results have. That's your benchmark."
  },
  {
    question: 'What if I get a bad review after asking?',
    answerText: 'This is what volume is for. If you have 200 reviews and get one 1-star, your rating barely moves. Respond professionally, take the conversation offline, and let your volume absorb it.'
  },
  {
    question: 'Can I offer incentives for reviews?',
    answerText: "No. This violates Google's policies and FTC regulations. Reviews obtained through incentives can be removed, and your listing can be penalized. The good news: you don't need incentives. Making it easy and asking at the right time works."
  },
  {
    question: 'How long does it take to see results?',
    answerText: "If you implement consistent asking, you'll see reviews start coming in within the first week. Meaningful transformation (doubling or tripling your review count) typically takes 60-90 days of consistent effort."
  },
  {
    question: 'Should I respond to every review?',
    answerText: 'Ideally, yes. At minimum, respond to all negative reviews within 48 hours and thank customers for detailed positive reviews. Google considers response rate as a signal of business engagement.'
  },
  {
    question: "What's the best way to ask for a review?",
    answerText: 'SMS with a direct link, sent same-day after positive service. Keep the message short, personal, and low-pressure. Example: "Hi [Name], thanks for choosing us! If you have 30 seconds, we\'d appreciate a Google review: [link]"'
  },
  {
    question: 'Do Google reviews help SEO?',
    answerText: 'Yes. Google uses review quantity, review velocity (how consistently you get new reviews), and overall sentiment as ranking factors for local search. More positive reviews generally means higher visibility in "near me" searches.'
  }
];

async function fixFaqs() {
  console.log('🔧 Fixing FAQs with proper Portable Text...\n');

  // Both draft and published versions
  const postIds = [
    'post-how-to-get-more-google-reviews',
    'drafts.post-how-to-get-more-google-reviews'
  ];

  // Build proper FAQs array
  const faqs = faqData.map((faq) => ({
    _key: 'faq-' + Math.random().toString(36).substr(2, 9),
    _type: 'faq',
    question: faq.question,
    answer: createAnswerBlock(faq.answerText)
  }));

  console.log('📋 Sample FAQ structure:');
  console.log(JSON.stringify(faqs[0], null, 2));

  for (const postId of postIds) {
    console.log(`\n📝 Updating: ${postId}`);

    try {
      await client
        .patch(postId)
        .set({ faqs: faqs })
        .commit();

      console.log(`   ✅ Updated with ${faqs.length} FAQs`);
    } catch (error) {
      console.log(`   ⚠️  Skipped (${error.message})`);
    }
  }

  console.log('\n✅ Done!');
}

fixFaqs().catch(console.error);

#!/usr/bin/env node
/**
 * Upload First Blog Post to Sanity
 *
 * This script creates:
 * 1. MoreStars Team author
 * 2. Guides category
 * 3. The first blog post with full Portable Text content
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

// Helper to create Portable Text blocks
function createBlock(text, style = 'normal', key) {
  return {
    _type: 'block',
    _key: key || `block-${Math.random().toString(36).substr(2, 9)}`,
    style,
    children: [{ _type: 'span', _key: `span-${Math.random().toString(36).substr(2, 9)}`, text }]
  };
}

function createBlockWithMarks(children, style = 'normal', key) {
  return {
    _type: 'block',
    _key: key || `block-${Math.random().toString(36).substr(2, 9)}`,
    style,
    children
  };
}

function createSpan(text, marks = []) {
  return {
    _type: 'span',
    _key: `span-${Math.random().toString(36).substr(2, 9)}`,
    text,
    marks
  };
}

// Helper to create Portable Text from plain string (for FAQ answers)
function textToPortableText(text) {
  return [createBlock(text)];
}

async function createAuthor() {
  const authorId = 'author-morestars-team';

  const author = {
    _id: authorId,
    _type: 'author',
    name: 'MoreStars Team',
    slug: { _type: 'slug', current: 'morestars-team' },
    bio: [createBlock('The MoreStars team helps local businesses get more 5-star reviews through smart SMS and QR code campaigns.')],
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

async function createCategory() {
  const categoryId = 'category-guides';

  const category = {
    _id: categoryId,
    _type: 'category',
    title: 'Guides',
    slug: { _type: 'slug', current: 'guides' },
    description: 'Step-by-step guides and tutorials for getting more reviews.',
    color: '#3B82F6'
  };

  try {
    const result = await client.createOrReplace(category);
    console.log(`✅ Created category: ${result.title}`);
    return result._id;
  } catch (error) {
    console.error(`❌ Error creating category:`, error.message);
    throw error;
  }
}

async function createPost(authorId, categoryId) {
  const postId = 'post-how-to-get-more-google-reviews';

  // Build the full Portable Text body
  const body = [
    // Intro
    createBlock('You just finished a job. The customer said "This was amazing, thank you so much!" They shook your hand and left. Two weeks later, no review.'),
    createBlock('Sound familiar?'),
    createBlock("You're not alone. Most businesses have Google ratings that don't reflect how good they actually are. The problem isn't your service. It's human nature."),
    createBlock("Here's what's at stake: 88% of consumers trust online reviews as much as personal recommendations. Businesses with 4.5+ stars get 28% more clicks than those with 4.0 stars. Google uses review quantity, velocity, and sentiment as ranking factors for local search. Reviews aren't just nice to have. They determine whether customers find you at all."),
    createBlock("This guide is for any local business owner who knows reviews matter but isn't getting enough. You'll learn the exact strategies to turn happy customers into reviewers, including scripts, timing, and the math behind review accumulation."),
    createBlock('No fluff. No vague advice. Just what works.'),

    // Section 1
    createBlock("Why You're Not Getting Reviews (The Real Problem)", 'h2'),
    createBlock("It's Not Your Service. It's Human Nature.", 'h3'),
    createBlock("Here's a frustrating truth: 99% of your customers are happy with you. But that 1% who aren't? They're 10x more likely to leave a review."),
    createBlock("Why don't happy customers leave reviews? They meant to. Then life happened. They got in their car, checked their phone, saw 47 notifications, and forgot. The task dropped off their mental to-do list before they even left your parking lot."),
    createBlock("Studies show people overestimate their likelihood of completing future tasks by 40%. When a customer says \"I'll definitely leave you a review,\" they genuinely mean it. They just won't do it."),
    createBlock("Here's the math that explains your rating:"),
    createBlock("• If 5% of unhappy customers leave reviews"),
    createBlock("• And only 0.5% of happy customers do"),
    createBlock("• And 95% of your customers are satisfied"),
    createBlock("Your reviews will skew negative even though most people love you. You end up with a 3.8-star rating when you deserve a 4.7."),
    createBlock("This creates a Google profile that doesn't reflect reality. The solution isn't working harder or providing better service (you're already doing that). The solution is making reviewing so easy that your happy customers actually do it."),

    // Section 2
    createBlock('How Many Reviews Do You Need?', 'h2'),
    createBlock('The Math That Actually Matters', 'h3'),
    createBlock("There's no magic number, but more is always better."),
    createBlock('Start by benchmarking against your competitors. Search "[your service] near me" and count the reviews of the top 3 results. That\'s your target.'),
    createBlock('Some rough thresholds:'),
    createBlock('• 10+ reviews: The minimum before most customers will trust you'),
    createBlock('• 50+ reviews: Signals an established, credible business'),
    createBlock('• 100+ reviews: Puts you ahead of most local competitors'),
    createBlock("• 200+ reviews: One bad review becomes noise, not catastrophe"),
    createBlock("That last point is critical. Here's a simple formula: one bad review drops your rating by approximately 1 ÷ (total reviews + 1)."),
    createBlock('• At 20 reviews: one 1-star drops you about 0.15 stars'),
    createBlock('• At 100 reviews: one 1-star drops you about 0.03 stars'),
    createBlock('• At 200 reviews: one 1-star is barely noticeable'),
    createBlock("Volume is your defense. The goal isn't preventing bad reviews. It's having enough good ones that complaints become context, not catastrophe."),

    // Section 3
    createBlock('Strategy #1: Make It Stupidly Easy (Direct Links and QR Codes)', 'h2'),
    createBlock('Every Extra Step Loses Half Your Customers', 'h3'),
    createBlock("Picture what happens when a customer says they'll leave a review:"),
    createBlock('1. They have to remember to do it later'),
    createBlock('2. They have to find Google'),
    createBlock('3. They have to search your business name'),
    createBlock('4. They have to find the right listing (not the one three towns over)'),
    createBlock('5. They have to click "Write a review"'),
    createBlock('6. They have to actually write it'),
    createBlock('Each step loses about 50% of people. By the end, maybe 3% of customers who intended to review actually do.'),
    createBlock('The solution? Remove every step you can.'),

    createBlock('Direct Links: One Tap to Google', 'h3'),
    createBlock('A direct review link takes customers straight to your Google review popup. They tap it, the review box opens, and they start typing. No searching, no scrolling, no friction.'),
    createBlock("Every business has one. Here's how to find yours:"),
    createBlock('1. Go to business.google.com'),
    createBlock('2. Sign in and select your business'),
    createBlock('3. Look for "Ask for reviews" or "Get more reviews"'),
    createBlock('4. Copy the short link (looks like g.page/yourbusiness/review)'),
    createBlock('Once you have your link, use it everywhere:'),
    createBlock('• Text messages (highest response rate)'),
    createBlock('• Email signatures'),
    createBlock('• Receipts and invoices'),
    createBlock('• Business cards'),
    createBlock('• Your website\'s "Review Us" button'),

    createBlock('QR Codes: For In-Person Moments', 'h3'),
    createBlock('Print QR codes that link directly to your review page. Customers scan with their phone camera and land on Google, ready to write.'),
    createBlock('Where to put them:'),
    createBlock('• Checkout counter (while they\'re standing there, phone in hand)'),
    createBlock('• Receipts and invoices'),
    createBlock('• Table tents (restaurants)'),
    createBlock('• Waiting room signs (healthcare, salons)'),
    createBlock("• Technician's clipboard or work order"),
    createBlock('QR code scan rates range from 3-10% depending on placement and how you prompt customers. Not as high as text messages, but they work passively without any staff effort.'),

    // Section 4
    createBlock('Strategy #2: Time It Right', 'h2'),
    createBlock('Gratitude Has a Half-Life', 'h3'),
    createBlock("The warm feeling after great service doesn't last. It fades within hours, not days."),
    createBlock('Same-day review requests outperform next-week requests by 3-5x. The "perfect" email sent three days later loses to a quick "Hey, would you leave us a review?" sent while gratitude is fresh.'),

    createBlock('Industry-Specific Timing', 'h3'),
    createBlock('The best moment to ask depends on your business:'),
    createBlock("• Plumbers, HVAC, Electricians: Within 1 hour of job completion - They're looking at the fixed problem, feeling relief"),
    createBlock('• Auto Repair: At pickup, keys in hand - Car runs perfectly, gratitude is immediate'),
    createBlock('• Dentists: Same day, after appointment - No more pain, clean teeth, experience is fresh'),
    createBlock('• Restaurants: While still at table or within 30 min - Meal is fresh in mind'),
    createBlock('• Salons and Spas: Before they leave - Looking at their new hair, taking selfies'),

    // Section 5
    createBlock('Strategy #3: Ask Everyone, Every Time', 'h2'),
    createBlock('Systems Beat Willpower', 'h3'),
    createBlock("Most businesses ask for reviews sporadically. You remember when you're not busy. You forget when things get hectic (which is when you're serving the most customers). Result: you ask maybe 20% of your customers."),
    createBlock("Here's the math of consistent asking:"),
    createBlock('• 100 customers per month'),
    createBlock('• Ask everyone: 100 asks'),
    createBlock('• 25-35% SMS response rate = 25-35 reviews per month'),
    createBlock('Compare that to asking 20% of customers:'),
    createBlock('• 100 customers per month'),
    createBlock('• Ask 20 of them'),
    createBlock('• 25-35% response rate = 5-7 reviews per month'),
    createBlock('Consistency is a 5x multiplier.'),

    createBlock("Why \"Ask Everyone\" Works", 'h3'),
    createBlock("It's simpler. No judgment calls about whether this particular customer seems happy enough."),
    createBlock("It's compliant. Selective asking (called \"review gating\") violates Google's policies. Asking everyone keeps you on the right side of the rules."),
    createBlock("It captures customers you'd misjudge. That quiet customer you thought was unhappy? They might leave your best review."),

    // Section 6
    createBlock('Strategy #4: Remove Every Possible Obstacle', 'h2'),
    createBlock('What "Friction" Actually Looks Like', 'h3'),
    createBlock('Every unnecessary step in the review process kills your conversion rate.'),
    createBlock('Common friction points and solutions:'),
    createBlock('• Email requests (5-10% open rates) → Use SMS (25-35% response rate)'),
    createBlock('"Please take our survey first" → Skip the survey. Go direct to Google.'),
    createBlock('• Intermediate landing pages → Link directly to Google review popup'),
    createBlock('• Long request messages → Keep it under 160 characters'),
    createBlock('• Asking without a link → Always include a clickable link'),

    createBlock('What Perfect Looks Like', 'h3'),
    createBlock("Here's a review request that works:"),
    {
      _type: 'callout',
      _key: `callout-${Math.random().toString(36).substr(2, 9)}`,
      style: 'tip',
      content: [createBlock('"Hi Sarah, thanks for choosing ABC Plumbing! If you have 30 seconds, we\'d really appreciate a Google review: [link]"')]
    },
    createBlock("That's 147 characters. It's personal (uses their name), low-pressure (\"if you have 30 seconds\"), clear about the ask (\"Google review\"), and includes a one-tap link."),

    // Section 7 - Mistakes
    createBlock('Common Mistakes That Kill Your Review Rate', 'h2'),
    createBlock('Mistake #1: Review Gating (Only Asking Happy Customers)', 'h3'),
    createBlock("What it is: Asking customers how they feel first, then only sending review links to the happy ones."),
    createBlock("Why it's wrong: It violates Google's policies. Google can detect the pattern and penalize your listing."),
    createBlock('What to do instead: Ask everyone. Let volume absorb the occasional negative review.'),

    createBlock('Mistake #2: Offering Incentives', 'h3'),
    createBlock('What it is: "Leave a review and get 10% off your next visit."'),
    createBlock("Why it's wrong: It violates Google's terms of service. Reviews can be removed if Google detects incentivization."),
    createBlock('What to do instead: Make it easy and ask at the right time. That\'s enough.'),

    createBlock('Mistake #3: Asking Too Late', 'h3'),
    createBlock('What it is: Sending review requests days or weeks after service.'),
    createBlock('Why it kills reviews: Gratitude fades, the experience feels distant, customers have moved on.'),
    createBlock('What to do instead: Same-day requests. Build the ask into your process or automate it.'),

    createBlock('Mistake #4: Making It Complicated', 'h3'),
    createBlock('What it is: Multi-step processes, surveys, account creation requirements.'),
    createBlock('Why it kills reviews: Every step loses 50% of people.'),
    createBlock('What to do instead: One tap to Google. Get the review.'),

    createBlock('Mistake #5: Not Asking at All', 'h3'),
    createBlock("What it is: Hoping customers will review on their own."),
    createBlock("Why it kills reviews: Happy customers don't think about reviews unless prompted."),
    createBlock("What to do instead: Ask everyone. It's normal. It's expected. It's legal."),

    // Section 8 - Responding
    createBlock('Responding to Reviews (The Often-Missed Step)', 'h2'),
    createBlock('Get the Review. Then Respond to It.', 'h3'),
    createBlock('Why responding matters:'),
    createBlock("• Shows potential customers you're engaged and attentive"),
    createBlock('• Google considers response rate as a ranking factor'),
    createBlock('• Turns a one-time review into an ongoing relationship signal'),

    createBlock('How to Respond to Positive Reviews', 'h3'),
    createBlock('• Thank them by name'),
    createBlock('• Reference something specific about their experience'),
    createBlock('• Keep it brief (2-3 sentences)'),
    createBlock('Example: "Thanks, Sarah! We\'re glad the AC repair went smoothly. Stay cool out there."'),

    createBlock('How to Respond to Negative Reviews', 'h3'),
    createBlock('• Respond promptly (within 24-48 hours)'),
    createBlock('• Acknowledge their frustration without being defensive'),
    createBlock('• Take the conversation offline'),
    createBlock('• Never argue, blame, or make excuses publicly'),
    createBlock('Example: "I\'m sorry this wasn\'t the experience you expected, Tom. Please call me directly at 555-1234 so we can make it right."'),

    // CTA Section
    createBlock('Ready to Get More Reviews?', 'h2'),
    createBlock('You now have the complete playbook. The strategies work. The math is real. The only question is whether you\'ll implement them consistently.'),
    createBlock('Your options:'),
    createBlock('DIY approach: Find your Google review link, create QR codes, train your staff, set reminders, and ask every customer manually. It works if you stick with it.'),
    createBlock('Automate it: MoreStars sends the review request for you. Customer gets a text, taps once, lands on Google, leaves a review. No staff training. No remembering to ask. No friction.'),
    createBlock('Try it free: 14-day free trial. No credit card required. See how many reviews you can collect in two weeks.'),
    createBlock('$77/month. 1,000 SMS included. Cancel anytime.')
  ];

  // FAQs - answers must be Portable Text (array of blocks)
  const faqs = [
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'Is it legal to ask customers for Google reviews?',
      answer: textToPortableText("Yes. Google explicitly allows businesses to ask for reviews. What's NOT allowed: offering incentives, only asking happy customers (review gating), or asking for a specific star rating. Simply asking customers to share their honest experience is completely fine.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'How many Google reviews do I need to rank higher on Google?',
      answer: textToPortableText("There's no magic number. What matters is having more reviews than your competitors, maintaining a high average rating, and getting reviews consistently over time (not in suspicious bursts). Search your service + \"near me\" and see what the top 3 results have. That's your benchmark.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'What if I get a bad review after asking?',
      answer: textToPortableText("This is what volume is for. If you have 200 reviews and get one 1-star, your rating barely moves. Respond professionally, take the conversation offline, and let your volume absorb it.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'Can I offer incentives for reviews?',
      answer: textToPortableText("No. This violates Google's policies and FTC regulations. Reviews obtained through incentives can be removed, and your listing can be penalized. The good news: you don't need incentives. Making it easy and asking at the right time works.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'How long does it take to see results?',
      answer: textToPortableText("If you implement consistent asking, you'll see reviews start coming in within the first week. Meaningful transformation (doubling or tripling your review count) typically takes 60-90 days of consistent effort.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'Should I respond to every review?',
      answer: textToPortableText("Ideally, yes. At minimum, respond to all negative reviews within 48 hours and thank customers for detailed positive reviews. Google considers response rate as a signal of business engagement.")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: "What's the best way to ask for a review?",
      answer: textToPortableText("SMS with a direct link, sent same-day after positive service. Keep the message short, personal, and low-pressure. Example: \"Hi [Name], thanks for choosing us! If you have 30 seconds, we'd appreciate a Google review: [link]\"")
    },
    {
      _key: `faq-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'faq',
      question: 'Do Google reviews help SEO?',
      answer: textToPortableText("Yes. Google uses review quantity, review velocity (how consistently you get new reviews), and overall sentiment as ranking factors for local search. More positive reviews generally means higher visibility in \"near me\" searches.")
    }
  ];

  // HowTo Steps
  const howToSteps = [
    {
      _key: `step-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'howToStep',
      title: 'Get Your Direct Review Link',
      description: "Find your Google Business Profile review link at business.google.com. Sign in, select your business, and look for 'Ask for reviews' to copy your direct link."
    },
    {
      _key: `step-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'howToStep',
      title: 'Create QR Codes',
      description: 'Generate QR codes linking to your review page. Place them at checkout counters, on receipts, and anywhere customers might have their phones ready.'
    },
    {
      _key: `step-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'howToStep',
      title: 'Time Your Requests',
      description: 'Send review requests same-day while gratitude is fresh. For service businesses, ask within 1 hour of job completion. For retail, ask at checkout or within 24 hours.'
    },
    {
      _key: `step-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'howToStep',
      title: 'Ask Every Customer',
      description: 'Build a system to ask every customer for a review. Train staff to ask at specific moments, or automate with SMS. Consistency is a 5x multiplier.'
    },
    {
      _key: `step-${Math.random().toString(36).substr(2, 9)}`,
      _type: 'howToStep',
      title: 'Remove All Friction',
      description: 'Use SMS over email (25-35% vs 5-10% response rate). Skip surveys. Link directly to Google. Keep messages under 160 characters.'
    }
  ];

  const post = {
    _id: postId,
    _type: 'post',
    title: 'The Complete Guide to Getting More Google Reviews for Your Business (2025)',
    slug: { _type: 'slug', current: 'how-to-get-more-google-reviews' },
    excerpt: "Learn proven strategies to get more Google reviews for your business. Includes templates, timing tips, and the exact methods that turn happy customers into reviewers.",
    author: { _type: 'reference', _ref: authorId },
    category: { _type: 'reference', _ref: categoryId },
    publishedAt: new Date().toISOString(),
    readingTime: 15,
    contentType: 'guide',
    funnelStage: 'awareness',
    body,
    faqs,
    howToSteps,
    seo: {
      _type: 'seo',
      metaTitle: 'How to Get More Google Reviews (2025 Guide)',
      metaDescription: "Learn proven strategies to get more Google reviews for your business. Includes templates, timing tips, and the exact methods that turn happy customers into reviewers.",
      primaryKeyword: 'how to get more google reviews',
      secondaryKeywords: [
        'increase google reviews',
        'google review strategy',
        'more 5 star reviews',
        'get more reviews for business',
        'boost google reviews',
        'improve google rating',
        'get customers to leave reviews'
      ]
    }
  };

  try {
    const result = await client.createOrReplace(post);
    console.log(`✅ Created post: ${result.title}`);
    console.log(`   Slug: ${result.slug.current}`);
    return result._id;
  } catch (error) {
    console.error(`❌ Error creating post:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 Uploading First Blog Post to Sanity\n');
  console.log('Project ID:', process.env.SANITY_PROJECT_ID);
  console.log('Dataset:', process.env.SANITY_DATASET || 'production');
  console.log('');

  if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
    console.error('❌ Missing Sanity credentials. Check your .env file.');
    process.exit(1);
  }

  try {
    // Step 1: Create author
    console.log('📝 Creating author...');
    const authorId = await createAuthor();

    // Step 2: Create category
    console.log('\n📁 Creating category...');
    const categoryId = await createCategory();

    // Step 3: Create post
    console.log('\n📄 Creating blog post...');
    await createPost(authorId, categoryId);

    console.log('\n✨ Upload complete!');
    console.log('\nView your post at:');
    console.log('  Studio: http://localhost:3333');
    console.log('  Blog: http://localhost:3000/blog/how-to-get-more-google-reviews');
    console.log('');

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

main();

import React from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl?: string;
  content: React.ReactNode;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: 'how-to-ask-for-reviews',
        title: "How to Ask for Reviews Without Being Awkward",
        excerpt: "Asking for a favor can feel uncomfortable. Here are 3 scripts to make it natural, professional, and effective.",
        date: "Oct 24, 2024",
        readTime: "4 min read",
        category: "Guides",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: (
            <>
                <p className="mb-6 text-xl leading-relaxed text-gray-600">We've all been there. You finish a job, the customer is smiling, and you know a 5-star review would help your business. But the words get stuck in your throat.</p>
                <p className="mb-6"><em>"Um, if you liked it, maybe check us out on Google?"</em></p>
                <p className="mb-8">It feels desperate. It feels pushy. But it doesn't have to be.</p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">1. The "Feedback" Frame</h3>
                <p className="mb-4">Don't ask for a review. Ask for feedback. It's a subtle psychological shift that lowers the pressure.</p>
                <div className="mb-8 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                    <p className="italic text-gray-700 font-medium">"Hey Sarah, we're always trying to get better. Would you mind sharing your feedback on your experience today? It really helps us out."</p>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">2. The "Help Us Grow" Frame</h3>
                <p className="mb-4">People like helping local businesses. If they had a good experience, they want you to succeed. Frame the request as a way they can support a local team.</p>
                <div className="mb-8 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                    <p className="italic text-gray-700 font-medium">"If you were happy with the service, a Google review goes a long way for a small business like ours. It helps other neighbors find us."</p>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">3. The "Set and Forget" Method</h3>
                <p className="mb-4">The least awkward way? Don't ask face-to-face at all. Use a tool like MoreStars to send a text 30 minutes after they leave.</p>
                <p className="mb-4">It gives them space. It catches them when they aren't rushed. And most importantly, it provides a direct link so they don't have to search for your business profile.</p>
                <p className="mb-4">By automating the ask, you ensure 100% of happy customers get the chance to review you, without you ever having to feel awkward about it.</p>
            </>
        )
    },
    {
        slug: 'google-reviews-seo-2025',
        title: "Why Google Reviews Matter More Than You Think in 2025",
        excerpt: "It's not just about social proof. Reviews are a top ranking factor for local SEO. Here is the data.",
        date: "Nov 02, 2024",
        readTime: "5 min read",
        category: "Strategy",
        imageUrl: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: (
            <>
                <p className="mb-6 text-xl leading-relaxed text-gray-600">You know reviews look good to customers. But did you know they are one of the primary signals Google uses to decide who shows up in the "Map Pack"?</p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">The Local SEO Landscape</h3>
                <p className="mb-6">When someone searches "plumber near me" or "best italian restaurant", Google wants to return the most relevant, trustworthy result. They can't visit every business, so they rely on crowdsourced data.</p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">Three Signals Google Watches</h3>
                <ul className="list-disc pl-6 mb-8 space-y-4 marker:text-[#FFBA49]">
                    <li><strong>Review Quantity:</strong> A business with 200 reviews looks more active and established than one with 5.</li>
                    <li><strong>Review Velocity:</strong> Getting 10 reviews in one month is better than getting 10 reviews over 5 years. A steady stream shows you are currently relevant.</li>
                    <li><strong>Review Diversity:</strong> Keywords in reviews matter. If customers keep mentioning "fast service" or "great pizza," Google associates your business with those terms.</li>
                </ul>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">The Click-Through Bonus</h3>
                <p className="mb-4">Beyond ranking, reviews affect Click-Through Rate (CTR). Studies show that listings with a 4.5+ star rating get significantly more clicks than those with 4.0 or lower.</p>
                <p className="mb-4">More clicks tells Google your listing is relevant, which improves your ranking further. It's a positive feedback loop.</p>
            </>
        )
    },
    {
        slug: 'handling-negative-reviews',
        title: "The Art of Handling Negative Reviews",
        excerpt: "One bad review isn't the end of the world. In fact, if handled correctly, it can actually win you new customers.",
        date: "Nov 15, 2024",
        readTime: "3 min read",
        category: "Reputation",
        imageUrl: "https://images.unsplash.com/photo-1555421689-491a97ff2040?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: (
            <>
                <p className="mb-6 text-xl leading-relaxed text-gray-600">Your heart sinks. You get a notification. 1 Star. A paragraph of angry text. Panic sets in.</p>
                <p className="mb-6">First: <strong>Don't panic.</strong></p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">Why Bad Reviews Happen</h3>
                <p className="mb-6">You can't please everyone. Sometimes you have an off day. Sometimes the customer is unreasonable. It happens to the best businesses.</p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">How to Respond</h3>
                <p className="mb-4">Potential customers aren't looking for a business with zero bad reviews (that actually looks suspicious). They are looking to see how you handle problems.</p>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                    <h4 className="font-bold mb-2">The GOLD Framework:</h4>
                    <ul className="space-y-2">
                        <li><strong>G</strong>rateful: Thank them for the feedback.</li>
                        <li><strong>O</strong>wn it: Don't make excuses. Apologize for their experience.</li>
                        <li><strong>L</strong>ight: Keep it brief and professional. Don't get into a keyboard war.</li>
                        <li><strong>D</strong>irect: Take it offline. "Please call us at..."</li>
                    </ul>
                </div>

                <p className="mb-4">A professional response to an angry review shows other customers that you are reasonable and care about service. It can turn a negative into a neutral or even a positive signal for future buyers.</p>
            </>
        )
    },
    {
        slug: 'qr-codes-vs-sms',
        title: "QR Codes vs. SMS: Which is Better for Reviews?",
        excerpt: "Should you print a code or send a text? We analyze response rates, convenience, and use cases for both methods.",
        date: "Nov 28, 2024",
        readTime: "6 min read",
        category: "Guides",
        imageUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        content: (
            <>
                <p className="mb-6 text-xl leading-relaxed text-gray-600">At MoreStars, we offer both QR codes and SMS requests. But which one should you focus on?</p>
                
                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">The Case for SMS</h3>
                <p className="mb-4">SMS is proactive. You reach out to the customer. It has the highest conversion rate (typically 20-40%) because it arrives on their personal device, often after they've left your store and have downtime.</p>
                <p className="mb-6"><strong>Best for:</strong> Auto repair, dentists, salons, contractors, real estate.</p>

                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">The Case for QR Codes</h3>
                <p className="mb-4">QR codes are passive but accessible. They are great for high-volume environments where collecting phone numbers isn't practical.</p>
                <p className="mb-6"><strong>Best for:</strong> Restaurants, retail stores, coffee shops, waiting rooms.</p>

                <h3 className="text-2xl font-bold mb-4 text-[#23001E]">The Verdict?</h3>
                <p className="mb-4">Use both if you can. Capture phone numbers when possible for the high conversion rate of SMS. Use QR codes as a fallback for walk-in traffic.</p>
            </>
        )
    }
];
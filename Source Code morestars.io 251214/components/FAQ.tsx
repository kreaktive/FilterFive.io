import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus, Minus } from 'lucide-react';
import { COLORS } from '../constants';

export const defaultFaqs = [
  {
    question: "Is this allowed by Google?",
    answer: "Yes. Google allows businesses to ask customers for reviews. You can't incentivize reviews or fake them, but asking is completely fine. MoreStars simply makes asking easier and gives customers a direct link to your review page."
  },
  {
    question: "How many reviews will I get?",
    answer: "Results vary, but typically 20-40% of customers respond to SMS requests. If you see 100 customers a month and send requests to all of them, you could add 20-40 reviews monthly. Your dashboard tracks your actual numbers."
  },
  {
    question: "What if someone leaves a bad review?",
    answer: "That can happen. The goal is to get more stars from happy customers so your overall rating reflects reality. One bad review among fifty good ones has minimal impact."
  },
  {
    question: "How long does setup take?",
    answer: "About 5 minutes. Create your account, paste your Google review link, and you're ready to send your first request or download your QR code."
  },
  {
    question: "Do I need technical skills?",
    answer: "No. If you can send a text, you can use MoreStars. The dashboard is intuitive and we have email support if you get stuck."
  },
  {
    question: "What review platforms do you support?",
    answer: "Google, Facebook, Yelp, TripAdvisor, Vitals, and any platform with a review URL. You paste the link, we handle the rest."
  },
  {
    question: "Is there a contract?",
    answer: "No. Month-to-month. Cancel anytime from your dashboard. No cancellation fees."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export your data anytime. After cancellation, we retain your data for 30 days in case you change your mind, then delete it."
  },
  {
    question: "Can I use this for multiple locations?",
    answer: "Yes. Track each location separately, see analytics by location, and manage everything from one dashboard."
  },
  {
    question: "Do you integrate with my POS?",
    answer: "We integrate with Square and Shopify. After a sale, we can automatically send a review request. You can also connect any tool via Zapier or our API."
  },
  {
    question: "How is this different from other review software?",
    answer: "Simpler and cheaper. Most review tools cost $300-500/month and come with features you don't need. MoreStars is $77/month and does one thing well: helps you get more stars."
  },
  {
    question: "What if I run out of SMS?",
    answer: "You get 1,000 SMS per month. We'll notify you at 80% usage (800 messages) so you have time to plan. If you hit 1,000, sending pauses until you either buy more or your allowance resets next month. You can add another 1,000 SMS for $17 anytime from your dashboard. No surprise charges, ever. Most businesses never hit the limit."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes. 14 days free, 10 SMS included, no credit card required. Try it before you commit."
  },
  {
    question: "What kind of support do you offer?",
    answer: "Email support with 24-hour response time. Real humans, not bots."
  },
  {
    question: "Can I customize the text message?",
    answer: "Yes. Choose from pre-built tones (friendly, professional, grateful) or write your own message. Just include the review link and you're set."
  }
];

export const FAQItem: React.FC<{ question: string; answer: string | React.ReactNode }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="faq-item border-b border-gray-200 last:border-0">
      <button
        className="w-full flex justify-between items-center py-6 text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-bold group-hover:text-blue-600 transition-colors" style={{ color: COLORS.dark }}>{question}</span>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? <Minus size={20} className="text-gray-500" /> : <Plus size={20} className="text-gray-500" />}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="text-gray-600 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
};

interface FAQProps {
  items?: { question: string; answer: string }[];
  title?: string;
  description?: string;
}

const FAQ: React.FC<FAQProps> = ({ 
  items = defaultFaqs, 
  title = "Frequently Asked Questions",
  description = "Have a question we didn't answer? Email us at support@morestars.io"
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.faq-item', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.05,
        scrollTrigger: {
          trigger: '.faq-list',
          start: 'top 80%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>
            {title}
          </h2>
          {description && (
            <p className="text-lg text-gray-600">
              {description}
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 faq-list">
            {items.map((faq, index) => (
            <FAQItem key={index} {...faq} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
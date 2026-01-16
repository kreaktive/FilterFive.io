import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { FAQItem } from './FAQ';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Search, FileText, Settings, Shield, Zap, DollarSign } from 'lucide-react';
import gsap from 'gsap';

const FAQ_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Zap size={20} />,
    questions: [
      {
        question: "How long does setup take?",
        answer: "About 5 minutes. Create your account, paste your Google review link, and you're ready to send your first request or download your QR code. No technical skills required. No sales calls. No waiting for someone to \"provision your account.\""
      },
      {
        question: "Do I need technical skills?",
        answer: "No. If you can send a text message and copy-paste a link, you can use MoreStars. The dashboard is self-explanatory. Most customers never contact support because they don't need to."
      },
      {
        question: "What do I need to get started?",
        answer: (
          <div>
            <p className="mb-2">Three things:</p>
            <ol className="list-decimal pl-5 space-y-1 mb-2">
              <li>An email address (to create your account)</li>
              <li>Your Google Business Profile review link (we show you exactly where to find it)</li>
              <li>Either customer phone numbers OR a printer for QR codes</li>
            </ol>
            <p>That's it.</p>
          </div>
        )
      },
      {
        question: "Is there a setup fee?",
        answer: "No. Never. Your only cost is $77/month (or $770/year) after your free trial ends."
      },
      {
        question: "Can I try it before paying?",
        answer: "Yes. 14-day free trial. 10 SMS messages included. No credit card required. Your account pauses after 14 days if you don't upgrade. No surprise charges."
      }
    ]
  },
  {
    id: "how-it-works",
    title: "How It Works",
    icon: <Settings size={20} />,
    questions: [
      {
        question: "What exactly does MoreStars do?",
        answer: "MoreStars sends your customers a link to your Google review page. They tap it. They leave a review. That's it. We make it effortless to ask for reviews (via text message or QR code) and effortless for customers to respond (one tap, they're on your Google page, ready to write)."
      },
      {
        question: "How does SMS review requesting work?",
        answer: "You add customer phone numbers (manually, via CSV upload, or automatically through Square/Shopify). MoreStars sends them a personalized text message asking for a review. The message includes a link that takes them directly to your Google review page. They tap, they review."
      },
      {
        question: "How do QR codes work?",
        answer: "You download your unique QR code from your dashboard. Print it. Put it at checkout, on receipts, on table tents, on invoices. Customers scan with their phone camera and land directly on your Google review page. No app needed. Unlimited scans, no extra cost."
      },
      {
        question: "What does the customer see?",
        answer: (
          <div>
            <p className="mb-2">A friendly text message like:</p>
            <blockquote className="bg-gray-100 border-l-4 border-blue-500 pl-4 py-2 italic mb-2 text-sm text-gray-700">
              "Hi Sarah, thanks for visiting Main Street Auto today! If we took good care of you, would you mind leaving us a quick review? [link]"
            </blockquote>
            <p>When they tap the link, they land directly on your Google review page. No MoreStars branding. No surveys. No intermediate pages. Just Google, ready for their review.</p>
          </div>
        )
      },
      {
        question: "Can I customize the text message?",
        answer: "Yes. Write your own message or choose from templates (friendly, professional, grateful). Match your tone and brand."
      },
      {
        question: "When should I send review requests?",
        answer: "Best practice: a few hours after service, while the experience is fresh but they've had time to get home and relax. For restaurants, same day. For auto repair or HVAC, within 24 hours. MoreStars lets you control timing based on what works for your business."
      },
      {
        question: "What review platforms do you support?",
        answer: "Google, Facebook, Yelp, TripAdvisor, Healthgrades, Vitals, and any platform with a review URL. You paste the link, we handle the rest. Most businesses focus on Google since that's where customers search."
      }
    ]
  },
  {
    id: "results",
    title: "Results & Expectations",
    icon: <FileText size={20} />,
    questions: [
      {
        question: "How many reviews will I get?",
        answer: "Results vary by business. Typical SMS response rates are 25-35%. If you see 100 customers a month and send requests to all of them, you could see 25-35 new reviews monthly. Your dashboard tracks your actual numbers so you know what's working."
      },
      {
        question: "How quickly will I see reviews?",
        answer: "First reviews typically come in within 24-48 hours of sending requests. You'll see momentum build over the first few weeks."
      },
      {
        question: "What if customers don't respond to the text?",
        answer: "Not everyone will. That's normal. A 25-35% response rate means 65-75% don't respond. But here's the thing: without MoreStars, maybe 2-3% leave reviews. Even if only a quarter of your customers respond, you've multiplied your review volume by 10x."
      },
      {
        question: "Can you guarantee results?",
        answer: "No. And anyone who guarantees a specific number of reviews is lying or doing something against Google's rules. We make it easy to ask for reviews. We can't force customers to leave them. Your results depend on your customer volume and how consistently you use the tool."
      },
      {
        question: "What if someone leaves a bad review?",
        answer: "That can happen. MoreStars helps you get more reviews from happy customers, which means your overall rating better reflects reality. One bad review among fifty good ones has minimal impact. The goal isn't to prevent negative reviews (that's against Google's rules). It's to make sure your happy customers show up too."
      }
    ]
  },
  {
    id: "compliance",
    title: "Google Compliance",
    icon: <Shield size={20} />,
    questions: [
      {
        question: "Is this allowed by Google?",
        answer: (
          <div>
            <p className="mb-2">Yes. Google explicitly allows businesses to ask customers for reviews. You can ask via email, text, in person, on receipts, anywhere.</p>
            <p className="mb-2 font-bold text-gray-800">What's NOT allowed:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
                <li>Paying for reviews or offering incentives</li>
                <li>Fake reviews from people who weren't customers</li>
                <li>Review gating (only asking happy customers)</li>
                <li>Being deceptive about who's leaving reviews</li>
            </ul>
            <p>MoreStars doesn't do any of that. We send customers a direct link to your Google page. They choose whether to leave a review and what to say. Completely compliant.</p>
          </div>
        )
      },
      {
        question: "What is review gating? Why is it bad?",
        answer: "Review gating means asking customers how their experience was, then only sending happy customers to Google while directing unhappy customers elsewhere. Google banned this practice in 2018. MoreStars doesn't gate. Every customer who receives your text gets the same link to your Google page. What they write is up to them."
      },
      {
        question: "Will my Google Business Profile get suspended?",
        answer: "Not from using MoreStars. We follow Google's guidelines. The risk of suspension comes from fake reviews, incentivized reviews, or review gating. We don't do any of that."
      },
      {
        question: "What about Yelp? I heard they don't like businesses asking for reviews.",
        answer: "Yelp's recommendation algorithm filters reviews it considers suspicious, including some solicited reviews. That's why most businesses focus on Google. If you want to use MoreStars for Yelp, you can. Just know Yelp may filter some reviews."
      }
    ]
  },
  {
    id: "pricing",
    title: "Pricing & Billing",
    icon: <DollarSign size={20} />,
    questions: [
      {
        question: "How much does MoreStars cost?",
        answer: "$77/month or $770/year (save $154). All features included in both plans. No tiers. No upsells."
      },
      {
        question: "What's included in the $77/month?",
        answer: (
            <div>
                <p className="mb-2">Everything:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <li className="flex gap-2"><span className="text-green-500">✓</span> 1,000 SMS messages per month</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Unlimited QR codes</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Full analytics dashboard</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Multi-location support</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Square and Shopify integrations</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> API and Zapier access</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Custom message templates</li>
                    <li className="flex gap-2"><span className="text-green-500">✓</span> Email support (24-hour response)</li>
                </ul>
            </div>
        )
      },
      {
        question: "Is there a contract?",
        answer: "No. Month-to-month. Cancel from your dashboard anytime. No cancellation fees. No phone calls required. No guilt trips."
      },
      {
        question: "What happens after the free trial?",
        answer: "Your trial ends after 14 days. If you haven't upgraded, your account pauses. No automatic charges. Upgrade whenever you're ready. Your data stays intact."
      },
      {
        question: "What payment methods do you accept?",
        answer: "All major credit cards via Stripe. No invoicing, checks, or wire transfers."
      },
      {
        question: "Can I switch from monthly to annual?",
        answer: "Yes. Contact support@morestars.io and we'll apply credit for your remaining monthly period toward the annual plan."
      },
      {
        question: "Do you offer discounts?",
        answer: "The annual plan saves 17% ($154/year). We don't do other discounts or negotiated pricing. But if you're a non-profit or have special circumstances, reach out. We'll see what we can do."
      },
      {
        question: "What's your refund policy?",
        answer: "Monthly plans: No refunds, but you can cancel anytime to stop future billing. Annual plans: Contact support within 30 days if you're unhappy. We'll make it right."
      }
    ]
  },
  {
    id: "sms-limits",
    title: "SMS Limits & Usage",
    icon: <Mail size={20} />,
    questions: [
      {
        question: "What happens if I run out of SMS messages?",
        answer: (
            <div>
                <p className="mb-2">At 80% usage (800 messages), you get an email and dashboard notification. At 100% (1,000 messages), SMS sending pauses. No surprise charges ever.</p>
                <p className="mb-2 font-bold text-sm text-gray-800">Your options at the limit:</p>
                <ol className="list-decimal pl-5 space-y-1 mb-2 text-sm">
                    <li>Add 1,000 SMS for $17 (one click from your dashboard, available immediately)</li>
                    <li>Wait for your monthly reset (your 1,000 refresh on your billing date)</li>
                </ol>
                <p className="text-sm">QR codes keep working regardless of SMS usage.</p>
            </div>
        )
      },
      {
        question: "Do unused SMS roll over?",
        answer: "No. Your 1,000 SMS reset on your billing date each month. If you're near the limit close to your reset date, it might make sense to wait rather than buying more."
      },
      {
        question: "How much do additional SMS cost?",
        answer: "$17 per 1,000 messages. Buy them from your dashboard whenever you need them."
      },
      {
        question: "What if I need way more than 1,000 SMS per month?",
        answer: "Most businesses don't. But if you consistently need more, buy additional bundles as needed. At very high volumes, contact support and we'll discuss options."
      },
      {
        question: "Are you going to surprise me with charges?",
        answer: "Never. We don't charge without explicit action from you. At your SMS limit, sending pauses. You choose whether to buy more or wait. No automatic overage charges."
      }
    ]
  },
  {
    id: "technical",
    title: "Technical & Integrations",
    icon: <Settings size={20} />,
    questions: [
      {
        question: "Do you integrate with my point-of-sale system?",
        answer: "We integrate directly with Square and Shopify. Connect your account and MoreStars can send review requests automatically after every sale. For other POS systems: export your customer list as a CSV and upload to MoreStars, or connect via Zapier."
      },
      {
        question: "How does the Zapier integration work?",
        answer: "Connect MoreStars to thousands of apps through Zapier. Common uses: automatically add customers from your CRM, trigger review requests after appointments, sync data with your other tools. Details in our help center after you sign up."
      },
      {
        question: "Do you have an API?",
        answer: "Yes. Full API access included in all plans. Documentation available after signup. Build custom integrations if you need them."
      },
      {
        question: "Can I use MoreStars for multiple locations?",
        answer: "Yes. Multi-location support is included at no extra cost. Track each location separately. See which ones are generating reviews and which need attention."
      },
      {
        question: "Does this work on mobile?",
        answer: "The dashboard works on any device with a web browser. No app to download. Your customers don't need an app either. The SMS link opens their browser, which opens Google."
      }
    ]
  },
  {
    id: "data-privacy",
    title: "Data & Privacy",
    icon: <Shield size={20} />,
    questions: [
      {
        question: "What do you do with my customer data?",
        answer: "Your customer information (names, phone numbers) is used for one thing: sending review requests. We don't sell your data. We don't share it. We don't use it for marketing. We don't mine it. It's yours."
      },
      {
        question: "Can I export my data?",
        answer: "Yes. Export your customer list and analytics anytime from your dashboard. Your data, your control."
      },
      {
        question: "What happens to my data if I cancel?",
        answer: "You can export everything before canceling. After cancellation, we keep your data for 30 days in case you change your mind, then delete it permanently."
      },
      {
        question: "Is MoreStars HIPAA compliant?",
        answer: "MoreStars doesn't store protected health information. We only need customer name and phone number. The review request message is generic. No mention of treatments, conditions, diagnoses, or anything covered by HIPAA. If you're a healthcare provider, the text your patients receive is something like: \"Thanks for visiting Main Street Dental! If we took good care of you, would you mind leaving us a quick review?\" No PHI."
      },
      {
        question: "Is my data secure?",
        answer: "Yes. Data encrypted in transit and at rest. We use Stripe for payments (we never see your full card number). Standard security practices. We're a small company that takes this seriously."
      }
    ]
  },
  {
    id: "account",
    title: "Account Management",
    icon: <Settings size={20} />,
    questions: [
      {
        question: "How do I cancel?",
        answer: "From your dashboard. Settings > Cancel Account. No phone call required. No cancellation fees. No retention specialists trying to talk you out of it. Click the button, you're done."
      },
      {
        question: "Can I pause my account instead of canceling?",
        answer: "Not currently. But since there's no contract, you can cancel and restart whenever you want. Your account data is kept for 30 days after cancellation."
      },
      {
        question: "What if I forget my password?",
        answer: "Click \"Forgot Password\" on the login page. Reset link sent to your email. Standard stuff."
      },
      {
        question: "Can I have multiple users on one account?",
        answer: "Not currently. Single login per account. If you need multiple people accessing the dashboard, share the login. (Yes, we know this isn't ideal. It's on our roadmap.)"
      }
    ]
  },
  {
    id: "support",
    title: "Support",
    icon: <Mail size={20} />,
    questions: [
      {
        question: "How do I get help?",
        answer: "Email support@morestars.io. Real humans, not bots. We typically respond within 24 hours, often faster."
      },
      {
        question: "Do you have phone support?",
        answer: "No. Email only. We're a small team focused on keeping the product simple and the price low. Email lets us give you thoughtful answers without keeping you on hold."
      },
      {
        question: "Is there a help center or documentation?",
        answer: "Yes. After signup, you'll have access to guides covering setup, integrations, best practices, and troubleshooting. Most questions are answered there."
      },
      {
        question: "What if something breaks?",
        answer: "Email us. We'll fix it. If it's urgent, say so in your subject line."
      }
    ]
  },
  {
    id: "concerns",
    title: "Common Concerns",
    icon: <Search size={20} />,
    questions: [
      {
        question: "I don't have time for another tool.",
        answer: "Setup takes 5 minutes. After that, it runs on autopilot. Upload a customer list or put up a QR code. Reviews come in. Check your dashboard when you feel like it. This isn't another thing to manage. It's a thing that manages itself."
      },
      {
        question: "I've tried asking for reviews before. It didn't work.",
        answer: "Asking face-to-face is awkward. Handing out cards doesn't work. They end up in the trash. The difference with MoreStars: the ask comes later, via text, when the customer has a quiet moment. And the link goes directly to your Google page. No searching. No friction. That's why it works."
      },
      {
        question: "Is $77/month worth it?",
        answer: "One new customer typically pays for a year of MoreStars. For most businesses, that customer shows up in the first month. The real question: what's it costing you to let competitors collect reviews while you don't?"
      },
      {
        question: "My competitor has way more reviews. Can I catch up?",
        answer: "Yes. It takes consistency, not magic. If you see 100 customers a month and 30% leave reviews, that's 30 new reviews monthly. In 6 months, you've added 180 reviews. That changes your competitive position."
      },
      {
        question: "What if my business doesn't see that many customers?",
        answer: "MoreStars works best for businesses seeing 50+ customers per month. If you're lower volume, it still works, just takes longer to see dramatic results. QR codes (unlimited, no per-use cost) might be more cost-effective than SMS for very low volumes."
      },
      {
        question: "I'm worried about getting negative reviews.",
        answer: "Unhappy customers are already leaving reviews. They don't need encouragement. MoreStars helps your happy customers match that energy. The result: your rating reflects reality instead of being skewed by the loudest complainers."
      }
    ]
  }
];

const FAQPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(FAQ_SECTIONS[0].id);

  useEffect(() => {
    document.title = "FAQ | MoreStars Review Software for Small Business";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Common questions about MoreStars review software. Setup, pricing, Google compliance, SMS limits, and more. Get answers before you start your free trial.');
    }
    window.scrollTo(0, 0);

    // GSAP Animation for sections on load
    gsap.from('.faq-group', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.2
    });
  }, []);

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Trigger point 150px from top

      let currentSectionId = FAQ_SECTIONS[0].id;
      
      for (const section of FAQ_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          if (element.offsetTop <= scrollPosition) {
            currentSectionId = section.id;
          }
        }
      }
      
      setActiveSection(currentSectionId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      // Allow scroll event to eventually set state, or set it immediately for responsiveness
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-20 bg-gray-50 border-b border-gray-200">
           <div className="max-w-4xl mx-auto px-4 text-center">
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                   Questions? We've Got Answers.
               </h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                   Everything you need to know about getting more Google reviews with MoreStars.
               </p>
           </div>
        </section>

        {/* --- Main Content Layout --- */}
        <section className="py-12 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Sidebar Navigation (Desktop) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-28 space-y-8">
                            
                            {/* Simpler CTA above TOC */}
                            <div className="bg-[#23001E] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group text-center">
                                 {/* Decorative element */}
                                 <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFBA49] rounded-full blur-2xl opacity-20 -mr-10 -mt-10"></div>
                                 
                                 <h3 className="font-bold text-lg mb-2">Ready to start?</h3>
                                 <p className="text-gray-300 text-xs mb-4 leading-relaxed">Get set up in 5 minutes. No credit card required.</p>
                                 <Link to="/pricing" className="block w-full py-3 rounded-full bg-[#FFBA49] text-[#23001E] text-sm font-bold hover:bg-white transition-colors">
                                    Start Free Trial
                                 </Link>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4 px-3">Table of Contents</h3>
                                {FAQ_SECTIONS.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSection === section.id ? 'bg-gray-100 text-[#23001E]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span className={activeSection === section.id ? 'text-[#FFBA49]' : 'text-gray-400'}>{section.icon}</span>
                                        {section.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FAQ Content Area */}
                    <div className="lg:col-span-9 space-y-16">
                        {FAQ_SECTIONS.map((section) => (
                            <div key={section.id} id={section.id} className="faq-group scroll-mt-28">
                                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                                    <div className="p-2 rounded-lg bg-gray-50 text-[#FFBA49]">
                                        {React.cloneElement(section.icon as React.ReactElement<any>, { size: 24 })}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.dark }}>{section.title}</h2>
                                </div>
                                <div className="space-y-0">
                                    {section.questions.map((q, i) => (
                                        <FAQItem key={i} question={q.question} answer={q.answer} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>

        {/* --- Final CTA Section --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Ready to Get More Stars?
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                  14-day free trial. No credit card required. Set up in 5 minutes.
              </p>
              <div className="flex justify-center mb-8">
                  <Link to="/pricing" className="px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-[#23001E] text-white flex items-center gap-3">
                     Start Free Trial <ArrowRight />
                  </Link>
              </div>
              <p className="text-lg font-medium" style={{ color: COLORS.dark }}>
                  Still have questions? <a href="mailto:support@morestars.io" className="underline hover:opacity-80">Email us at support@morestars.io</a>
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { ArrowRight, CheckCircle, ShieldCheck, Heart, XCircle, Lock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = "About MoreStars | Review Software Built for Small Business";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'MoreStars helps local businesses get more Google reviews through SMS and QR codes. Built by Digital Marketing Services. Simple, affordable, effective.');
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-[#F9F7FA]" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="pt-20 pb-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
              Built for Small Business. <br/>By People Who Get It.
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              MoreStars exists because enterprise review tools are overpriced, overcomplicated, and overkill for local businesses.
            </p>
          </div>
        </section>

        {/* The Problem We Saw */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.dark }}>Review Software Shouldn't Cost $500/Month</h2>
            <div className="prose prose-lg text-gray-600 text-lg">
              <p className="mb-4">Here's what we kept seeing:</p>
              <p className="mb-4">
                Local businesses know they need more Google reviews. They search for a solution. They find tools like Podium and Birdeye. They see the price tag: $300-500/month. They see the 12-month contracts. They schedule a sales call, sit through a demo, and realize they're being sold features they'll never use.
              </p>
              <p className="mb-4">
                Most just give up. They go back to awkwardly asking customers face-to-face. Or they stop asking altogether.
              </p>
              <p className="mb-6 font-bold text-gray-800">That's ridiculous.</p>
              <p className="mb-4">
                Getting more reviews shouldn't require an enterprise budget or a dedicated marketing team. It should be simple, affordable, and something any business owner can set up in 5 minutes.
              </p>
              <p className="font-bold text-xl" style={{ color: COLORS.accent }}>So we built MoreStars.</p>
            </div>
          </div>
        </section>

        {/* What MoreStars Does */}
        <section className="py-20 bg-[#F9F7FA]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.dark }}>One Job. Done Well. More Stars.</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              MoreStars sends review requests via SMS or QR code. Customers tap a link and land directly on your Google page. They leave a review.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              That's it. No surveys. No complicated funnels. No AI sentiment analysis you'll never look at. No features that sound impressive in a demo but collect dust in real life.
            </p>
            <p className="text-lg font-bold mb-8" style={{ color: COLORS.dark }}>
              Just more stars on Google from happy customers who would have otherwise forgotten.
            </p>
            <div className="inline-block px-6 py-3 rounded-lg font-bold text-white shadow-md text-lg" style={{ backgroundColor: COLORS.positive }}>
              $77/month. No contracts. Cancel anytime.
            </div>
          </div>
        </section>

        {/* Who We Are */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.dark }}>Built by Digital Marketing Services</h2>
            <div className="prose prose-lg text-gray-600 text-lg">
              <p className="mb-4">
                MoreStars is built by <a href="https://digitalmarketingservices.pro" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Digital Marketing Services</a>, a team that's been helping small businesses grow online since 2011.
              </p>
              <p className="mb-4">
                After years of recommending expensive review tools to clients (and watching them struggle with the complexity and cost), we decided to build something better. Something designed specifically for local businesses with limited time and realistic budgets.
              </p>
              <p className="mb-4">MoreStars is that tool.</p>
              <p>
                We're based in Colorado Springs, but we serve businesses across the United States. Every feature in MoreStars exists because a real business needed it, not because it looked good on a feature comparison chart.
              </p>
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="py-20 bg-gray-50">
           <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: COLORS.dark }}>Our Principles</h2>
              <div className="grid md:grid-cols-2 gap-8">
                 {[
                    { title: "Simple Beats Complicated", text: "If a feature doesn't directly help you get more stars, it doesn't belong in the product. We'd rather do one thing exceptionally well than ten things poorly." },
                    { title: "Transparent Beats Tricky", text: "Our pricing is on the website. No \"contact us for a quote.\" No hidden fees. No surprise charges. You know exactly what you're paying before you sign up." },
                    { title: "Fair Beats Locked-In", text: "Month-to-month. Cancel anytime. If we're not delivering value, you should be free to leave. We'd rather earn your business every month than trap you with a contract." },
                    { title: "Affordable Beats Overpriced", text: "$77/month is enough to build a great product and run a sustainable business. We don't need to charge $500/month for features you don't need." }
                 ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.accent }}>{item.title}</h3>
                       <p className="text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Who MoreStars Is For */}
        <section className="py-20">
           <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: COLORS.dark }}>Built for Businesses Like These</h2>
              <div className="grid md:grid-cols-2 gap-12">
                 <div>
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}><Users size={24} className="text-blue-500"/> Perfect For:</h3>
                    <ul className="space-y-4 text-gray-600">
                       <li className="flex gap-3"><span className="font-bold text-gray-800">See a lot of customers.</span> The more customers you have, the more reviews you can collect. If you see 50+ customers per month, MoreStars will move the needle.</li>
                       <li className="flex gap-3"><span className="font-bold text-gray-800">Have short sales cycles.</span> Service-based businesses, restaurants, retail, healthcare. Customers come in, get served, leave. Perfect for a quick review request.</li>
                       <li className="flex gap-3"><span className="font-bold text-gray-800">Depend on Google reviews.</span> If potential customers Google your business before choosing you, your review count and rating directly impact your revenue.</li>
                       <li className="flex gap-3"><span className="font-bold text-gray-800">Don't have time for complicated tools.</span> You need something you can set up in 5 minutes and run on autopilot. Not another software project.</li>
                    </ul>
                 </div>
                 <div className="bg-gray-50 p-8 rounded-2xl">
                    <h3 className="font-bold text-xl mb-4" style={{ color: COLORS.dark }}>Industries we serve:</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                       {["Auto repair and mechanics", "Dental and healthcare", "HVAC, plumbing, contractors", "Restaurants and cafes", "Salons, spas, barbershops", "Real estate agents", "Chiropractors & PT", "Pet groomers", "Car washes", "Any local service business"].map((ind, i) => (
                          <li key={i} className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500 shrink-0"/> {ind}</li>
                       ))}
                    </ul>
                 </div>
              </div>
           </div>
        </section>

        {/* What We Don't Do */}
        <section className="py-20 bg-gray-50">
           <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: COLORS.dark }}>We're Not For Everyone</h2>
              <div className="space-y-6">
                 {[
                    { title: "An enterprise solution", text: "If you're a Fortune 500 company with a dedicated reputation management team, you probably want something more complex. We're built for small business." },
                    { title: "A magic wand", text: "We make it easy to ask for reviews. We can't force customers to leave them. Results depend on your customer volume and how consistently you use the tool." },
                    { title: "A way to fake reviews", text: "We help you get real reviews from real customers. No fake reviews. No review manipulation. Google compliant." },
                    { title: "A way to block bad reviews", text: "We help you get more good reviews. If a customer wants to leave a bad review, they still can. We're not hiding anything." }
                 ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-white rounded-lg shadow-sm">
                       <XCircle className="text-red-400 shrink-0 mt-1" />
                       <div>
                          <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                          <p className="text-gray-600">{item.text}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Compliance, Privacy, Support */}
        <section className="py-20">
           <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                 <ShieldCheck className="w-10 h-10 text-green-600 mb-4" />
                 <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.dark }}>We Play by the Rules</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    Google allows businesses to ask for reviews. You can't incentivize or fake them. MoreStars is 100% compliant. We help you ask customers for reviews and give them a direct link. No tricks. No gray areas.
                 </p>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                 <Lock className="w-10 h-10 text-blue-600 mb-4" />
                 <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.dark }}>Your Data Is Yours</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    We don't sell data. Your customer information is used for one thing: sending review requests. You own everything. Export anytime. We're transparent—read our Privacy Policy in plain English.
                 </p>
              </div>
              <div className="p-6 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                 <Heart className="w-10 h-10 text-pink-500 mb-4" />
                 <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.dark }}>Real Humans. Real Help.</h3>
                 <p className="text-gray-600 text-sm leading-relaxed">
                    Support is via email: <a href="mailto:support@morestars.io" className="underline font-medium hover:text-blue-600">support@morestars.io</a>. We respond within 24 hours. You'll talk to a real person who knows the product.
                 </p>
              </div>
           </div>
        </section>

        {/* CTA Section */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Ready to Get More Stars?
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                 14-day free trial. No credit card required. Set up in 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </button>
                  <Link to="/how-it-works"
                    className="px-10 py-5 rounded-full text-xl font-bold border-2 border-[#23001E] text-[#23001E] hover:bg-white/50 flex items-center justify-center"
                  >
                     See How It Works
                  </Link>
              </div>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
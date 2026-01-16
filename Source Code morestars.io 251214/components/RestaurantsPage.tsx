import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FAQ from './FAQ';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Star,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  XCircle,
  Utensils,
  QrCode,
  Receipt,
  Users,
} from 'lucide-react';

const RestaurantsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Restaurants | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your restaurant. QR codes for tables. Let happy diners speak up. $77/month. Start free.');
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />

      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-24 relative overflow-hidden bg-gray-50">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-red-50 opacity-50 skew-x-12 transform origin-top-right"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Utensils size={14} /> Restaurant Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            100 Happy Diners. <br/>
                            1 Angry Yelper. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                                Guess Who Writes the Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Your satisfied customers leave without a trace. MoreStars changes that.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 bg-[#FFBA49] text-[#23001E]">
                                Start Free Trial <ArrowRight size={20} />
                            </button>
                        </div>
                        <p className="mt-6 text-sm text-gray-500 font-medium flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" /> 14-day free trial. No credit card required.
                        </p>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform rotate-1">
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xl">
                                     <Utensils fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Sarah & Tom</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">1 hour ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Perfect date night spot! The pasta was incredible and our server was so attentive. <span className="bg-yellow-100 font-bold px-1">Best Italian in the city!</span> Will definitely be back."
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                4.8 <Star fill="#FFBA49" className="text-[#FFBA49]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- The Pain Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                        The Pain You Know Too Well
                    </h2>
                    <p className="text-xl text-gray-600">
                        You served 500 people this week. Reviews this week? One. (And it wasn't good).
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                           It's a 2-star from the guy whose steak was medium instead of medium-rare. He wrote four paragraphs. He mentioned the server by name. He said he'd "never come back."
                        </p>

                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Review Paradox</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 Everyone's a food critic. But the people who use the megaphone are the unhappy ones.
                             </p>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-red-500"/> Anniversary couple? Told each other, not Google.</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-red-500"/> Happy family? Kids were tired, went home.</li>
                                <li className="flex items-center gap-2"><XCircle size={14} className="text-red-500"/> Tourist? On a plane, forgot.</li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, every kitchen delay or off night gets documented permanently. A 4.2 vs 4.6 rating is the difference between "let's try it" and "let's go somewhere else."
                        </p>
                    </div>

                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Users size={64} className="text-red-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>500 Diners. 1 Review.</h3>
                        <p className="text-gray-600 mb-4">
                            You create hundreds of great experiences. But without a nudge, they vanish into thin air.
                        </p>
                        <p className="font-bold text-gray-800">Only the anger remains.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Turn your tables into review magnets.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <QrCode />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Customers Show Up</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            QR codes on tables. Customer scans, taps, lands on Google. They're already on their phones posting food photos. Scanning fits right in.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            Table Tent: "Enjoying your meal? Leave us a review!"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Volume Matches Traffic</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">150 Reviews</p>
                                <p className="text-xs text-gray-500">Over 3 years</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">450+ Reviews</p>
                                <p className="text-xs text-gray-500">Active & Thriving</p>
                            </div>
                        </div>
                        <p className="text-gray-300">If just 5% of 500 diners/week scan, that's 100 new reviews a month.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Utensils />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture the Perfect Moment</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Post-meal is ideal. They're satisfied, relaxed, waiting for the check. A QR code catches them right then—when the experience is fresh.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Bad Reviews Become Context</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Kitchen mistakes happen. But when you have 500 reviews, one 1-star is 0.2% of your rating. The math changes everything.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Scenarios --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Real World Scenarios</h2>
                    <p className="text-gray-600">The difference a QR code makes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-red-100 p-4 border-b border-red-200">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <Utensils size={20}/> Scenario 1: The Date Night
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Couple has a fantastic dinner. Great food, great service. They pay and leave.</p>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They tell each other it was great. Maybe tell friends. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She sees the QR code on the table tent. Scans it while he pays. <span className="font-semibold text-green-600">5 Stars.</span> "Perfect date night spot. Food was incredible."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Users size={20}/> Scenario 2: The Regular
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Customer comes every week. Loves your place. Coming for two years.</p>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Loyal customer who is <span className="font-semibold text-red-500">invisible online.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They finally notice the QR code. <span className="font-semibold text-green-600">5 Stars.</span> "Best Thai food in the city. Been coming for years and it's always consistent."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Placement Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Where to Put QR Codes</h2>
                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4"><Utensils size={20}/></div>
                            <h3 className="font-bold text-lg mb-2">Table Tents</h3>
                            <p className="text-gray-600 text-sm">"Enjoying your meal? Leave us a review!" Works for full-service and fast casual.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4"><Receipt size={20}/></div>
                            <h3 className="font-bold text-lg mb-2">Check Presenters</h3>
                            <p className="text-gray-600 text-sm">Customer is wrapping up. Perfect timing while they wait for the card to run.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"><QrCode size={20}/></div>
                            <h3 className="font-bold text-lg mb-2">Receipts & Takeout</h3>
                            <p className="text-gray-600 text-sm">Print it right on the receipt. Put a card in takeout bags for home diners.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Restaurants --- */}
        <FAQ
            title="Restaurant FAQ"
            items={[
                {
                    question: "QR codes or SMS?",
                    answer: "QR codes work best for most restaurants. No phone numbers needed, no follow-up required. If you have a reservation system with phone numbers, SMS can supplement—but QR codes are the core."
                },
                {
                    question: "What if we get a bad review?",
                    answer: "You will. Every restaurant does. The goal is enough volume that individual bad reviews don't define you. 10 complaints among 500 reviews is context. 10 complaints among 50 reviews is a problem."
                },
                {
                    question: "Does this work for fast casual?",
                    answer: "Yes. QR codes at the pickup counter or on receipts. Customers can scan while they wait or after they eat."
                },
                {
                    question: "What about Yelp?",
                    answer: "MoreStars works with any platform. You can send customers to Google, Yelp, TripAdvisor—whatever matters most in your market."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Let Your Happy Customers Speak Up
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You create hundreds of great experiences every week. Right now, the angry exceptions tell your story online. Time to change that.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </button>
                  <Link to="/pricing"
                    className="px-10 py-5 rounded-full text-xl font-bold border-2 border-[#23001E] text-[#23001E] hover:bg-white/50 flex items-center justify-center"
                  >
                     See Pricing
                  </Link>
              </div>
              <p className="mt-8 text-sm font-bold opacity-75" style={{ color: COLORS.dark }}>
                 14-day free trial. Unlimited QR codes. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default RestaurantsPage;
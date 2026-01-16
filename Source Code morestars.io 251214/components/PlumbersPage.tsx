import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FAQ from './FAQ';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  MessageSquare, 
  ShieldCheck,
  XCircle,
  ThumbsUp,
  Wrench,
  Droplet,
  DollarSign,
  Umbrella
} from 'lucide-react';

const PlumbersPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Plumbers | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your plumbing business. Fight back against the angry minority. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-cyan-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Wrench size={14} /> Plumbing Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Plumbers Get Hammered Online. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                Time to Fight Back.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            For every angry review about pricing, you have 20 happy customers who said nothing. Let's change that.
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
                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                     <Droplet fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">David K.</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">1 day ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Had a pipe burst at 10pm. Reliable Plumbing was here in 45 minutes and stopped the flooding. Saved us from a disaster. <span className="bg-yellow-100 font-bold px-1">Worth every penny.</span>"
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                4.9 <Star fill="#FFBA49" className="text-[#FFBA49]" />
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
                        Plumbers get more angry reviews than almost any other trade.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            They don't see the $50,000 truck, the tools, the license, or the insurance. They see "20 minutes of work" and write a review about how you're a ripoff.
                        </p>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Math Destroys You</h4>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>You do 100 jobs.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>95 are happy (and silent).</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>5 complain about price.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>3 leave angry 1-star reviews.</li>
                             </ul>
                             <p className="font-bold text-red-800 mt-4">Result: Three 1-star reviews. Zero 5-star reviews.</p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your happy customers? The toilet flushes. The leak stopped. Crisis over. They forget to review you within an hour.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <AlertTriangle size={64} className="text-orange-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>It's Not Fair. But It's Reality.</h3>
                        <p className="text-gray-600 mb-4">
                            The people most motivated to review are the ones who are upset about the bill. Satisfaction doesn't create urgency. Anger does.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Volume is your defense against angry reviews.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Customers Finally Show Up</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            After every job, the customer gets a text. One tap. They're on Google.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for calling Reliable Plumbing! If we solved your problem, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Build a Wall of Positive Reviews</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-red-400 font-bold text-lg">4.1 Stars</p>
                                <p className="text-xs text-gray-500">Price complaints</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 90 Days</p>
                                <p className="text-green-400 font-bold text-lg">4.6 Stars</p>
                                <p className="text-xs text-gray-500">"Professional" & "Fair"</p>
                            </div>
                        </div>
                        <p className="text-gray-300">If 30% of your happy customers respond, that's 25-30 new positive reviews per month.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Angry Reviews Become Noise</h3>
                        <p className="text-gray-300 leading-relaxed">
                            With 150+ reviews, one complaint is less than 1%. It's context. New customers see it, see 50 other reviews saying you're great, and understand: sometimes people are just unhappy.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <CheckCircle />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Reputation Matches Referrals</h3>
                        <p className="text-gray-300 leading-relaxed">
                             When your Google page has 200 reviews confirming you're trustworthy, the referral becomes a sure thing. They call with confidence.
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
                    <p className="text-gray-600">Making it easy for happy customers.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-cyan-100 p-4 border-b border-cyan-200">
                            <h3 className="font-bold text-cyan-800 flex items-center gap-2">
                                <Droplet size={20}/> Scenario 1: The Clogged Drain
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">You snake a drain. 30 minutes. $175. Problem solved. Customer is happy.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Drain works. They don't think about you again. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out that afternoon. <span className="font-semibold text-green-600">5 Stars.</span> "Fast, professional, fair price. Will call again."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Umbrella size={20}/> Scenario 2: The Emergency
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Pipe burst at 10pm. You stop the flooding. $450. They're grateful but exhausted.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They go to bed. In the morning, they've moved on. No review.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out next morning. <span className="font-semibold text-green-600">5 Stars.</span> "Saved us from a disaster. Worth every penny."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Math Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Math That Protects You</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-red-600">Current State</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Total Reviews</span> <span className="font-bold">35</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Angry 1-Stars</span> <span className="font-bold text-red-500">5 (14%)</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Rating</span> <span className="font-bold">4.1</span></li>
                                <li className="flex justify-between pt-2"><span>Vibe</span> <span className="text-sm">Complaints dominate</span></li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">6 MONTHS LATER</div>
                            <h3 className="font-bold text-xl mb-4 text-green-600">With MoreStars</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Total Reviews</span> <span className="font-bold">200+</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Angry 1-Stars</span> <span className="font-bold text-green-600">5 (2.5%)</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Rating</span> <span className="font-bold">4.7</span></li>
                                <li className="flex justify-between pt-2"><span>Vibe</span> <span className="text-sm">Overwhelmingly positive</span></li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-8 text-gray-500 text-sm max-w-2xl mx-auto">
                        The angry customers didn't go away. But they became a tiny percentage of your total. Their complaints have context now.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Plumbers --- */}
        <FAQ 
            title="Plumber FAQ" 
            items={[
                {
                    question: "What about customers upset about pricing?",
                    answer: "They'll still exist. You can't prevent someone from feeling surprised by a plumbing bill. But when 95% of your reviews are positive, the 5% who complain about pricing are clearly the exception, not the rule."
                },
                {
                    question: "Should I send requests after expensive jobs?",
                    answer: "Yes. If you did honest work and explained the situation, most customers will leave positive reviews even if the bill was high. People appreciate professionalism and competence."
                },
                {
                    question: "When should I send requests?",
                    answer: "Same day or next morning. While they're still relieved that the problem is fixed."
                },
                {
                    question: "Does this work for commercial plumbing?",
                    answer: "Absolutely. Commercial customers often leave more detailed, thoughtful reviews. They understand business reputation."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Build the Review Wall That Protects Your Business
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You can't stop angry people from reviewing. But you can drown them out with the satisfied majority who've been silent until now.
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
                 14-day free trial. 10 SMS included. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default PlumbersPage;
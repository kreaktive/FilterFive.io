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
  Sprout,
  Trees,
  Sun,
  Snowflake,
  Leaf,
  Flower,
  Truck,
  Scissors
} from 'lucide-react';

const LawnCarePage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Landscapers | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your lawn care or landscaping business. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-green-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Trees size={14} /> Landscaper Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Their Lawn Looks Amazing. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                                You've Mowed It for 2 Years.
                            </span> <br/>
                            No Review.
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Your work is visible to the whole neighborhood. Help it become visible on Google too.
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
                                 <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
                                     <Sprout fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">The Henderson Yard</div>
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
                                "Green Thumb has done our lawn for 3 years. Always reliable, yard looks better than ever. <span className="bg-yellow-100 font-bold px-1">Best crew in town.</span>"
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
                        Your truck is a billboard. Your work is an advertisement. But your Google page is empty.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You pull up every Thursday. You mow, edge, blow. The lawn looks perfect. The homeowner waves from the window. <strong className="text-gray-900">This has been happening for two years.</strong>
                        </p>
                        
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                             <h4 className="font-bold text-green-800 mb-2">The Silent Majority</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 They pay every month. They wave. They're clearly happy.
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 But Google? It's never crossed their mind. Your Thursday service is just part of their routine now.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, guys with a pickup and no insurance undercut your prices. They have 8 reviews. You have 28 reviews (mostly old). When a neighbor searches "lawn care," they don't see the difference in quality. They just see numbers.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Scissors size={64} className="text-green-600 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>50 Lawns a Week.</h3>
                        <p className="text-gray-600 mb-4">
                            That's 50 happy clients who could be vouching for you online.
                        </p>
                        <p className="font-bold text-gray-800">Instead, you're invisible.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Turn your route into a reputation engine.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Recurring Clients Finally Review</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            A simple text unlocks years of stored-up goodwill. "If you're happy with our work, mind leaving a review?"
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for trusting Green Thumb Lawn Care! If you're happy with how the yard looks, mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Proof of Reliability</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">28 Reviews</p>
                                <p className="text-xs text-gray-500">Looks small-time</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">120+ Reviews</p>
                                <p className="text-xs text-gray-500">"Reliable & Consistent"</p>
                            </div>
                        </div>
                        <p className="text-gray-300">"They've done my lawn for 3 years" is the most powerful review you can get. It proves you show up.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Differentiate From Lowballers</h3>
                        <p className="text-gray-300 leading-relaxed">
                            The guy with a truck charges less. But can he show 150 reviews describing years of reliable service? You compete on trust, not just price.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Sun />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Year-Round Advocates</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Build reviews during your busy season. They work for you all year. A strong review from March doesn't expire in October.
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
                    <p className="text-gray-600">Different services, same opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-green-100 p-4 border-b border-green-200">
                            <h3 className="font-bold text-green-800 flex items-center gap-2">
                                <Truck size={20}/> Scenario 1: The Weekly Mow
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Lawn looks perfect. You've handled it all summer. They're thrilled.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They appreciate you. They pay you. They don't think about Google. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get a mid-season check-in. <span className="font-semibold text-green-600">5 Stars.</span> "They've done my lawn all summer. Always reliable, best it's ever looked."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-emerald-100 p-4 border-b border-emerald-200">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                <Flower size={20}/> Scenario 2: The Landscape Project
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Backyard redesign. Patio, plantings, lighting. Client is blown away.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They show it off to neighbors. Post on Facebook. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">You send a request upon completion. <span className="font-semibold text-green-600">5 Stars + Photos.</span> "Completely transformed our backyard. Design was beautiful, crew was professional."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Seasonal Strategy --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-green-50 rounded-3xl p-8 md:p-12 border border-green-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Seasonal Strategy</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="text-green-500 mb-2"><Sprout size={24}/></div>
                            <h3 className="font-bold mb-1">Spring</h3>
                            <p className="text-xs text-gray-600">Rush of new clients. Perfect time to start collecting.</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="text-orange-500 mb-2"><Sun size={24}/></div>
                            <h3 className="font-bold mb-1">Summer</h3>
                            <p className="text-xs text-gray-600">Peak season. Lawns look best. Clients are happiest.</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="text-red-500 mb-2"><Leaf size={24}/></div>
                            <h3 className="font-bold mb-1">Fall</h3>
                            <p className="text-xs text-gray-600">Leaf cleanup & aeration. Another service touchpoint.</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                            <div className="text-blue-500 mb-2"><Snowflake size={24}/></div>
                            <h3 className="font-bold mb-1">Winter</h3>
                            <p className="text-xs text-gray-600">Snow removal creates urgent, grateful customers.</p>
                        </div>
                    </div>
                    <p className="mt-8 text-green-800 text-sm font-medium max-w-2xl mx-auto">
                        Build reviews during peak season. They work for you during slow months.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Lawn Care --- */}
        <FAQ 
            title="Landscaper FAQ" 
            items={[
                {
                    question: "Should I ask clients every week?",
                    answer: "No. Ask once. Maybe follow up next season if they haven't reviewed. Don't annoy recurring clients."
                },
                {
                    question: "When's the best time to ask mowing clients?",
                    answer: "During peak season when the lawn looks best and they're most satisfied. A June request beats an October request."
                },
                {
                    question: "What about one-time projects?",
                    answer: "Definitely ask. Landscape design, hardscaping, tree work—these are great review opportunities. Clients are excited about the result."
                },
                {
                    question: "What about commercial properties?",
                    answer: "Property managers and business owners leave reviews. Commercial reviews often emphasize reliability—exactly what other commercial clients want to hear."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Make Your Best Lawns Work for You Online
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your work is visible to every neighbor on every street you service. Now make it visible to everyone searching Google for a lawn crew they can trust.
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

export default LawnCarePage;
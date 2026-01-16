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
  Home,
  Search,
  Key,
  Users,
  MapPin,
  Award
} from 'lucide-react';

const RealEstatePage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Real Estate Agents | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews as a realtor. Referrals get Googled. Make sure they like what they find. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Home size={14} /> Real Estate Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Referrals Get Googled. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                                What Will They Find?
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Someone refers you. The prospect Googles your name. Your reviews either close the deal or lose it.
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
                                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                                     <Key fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">The Miller Family</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">1 week ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "We were nervous first-time buyers, but Sarah made it easy. She walked us through everything and fought for us during negotiations. <span className="bg-yellow-100 font-bold px-1">Highly recommend!</span>"
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                5.0 <Star fill="#FFBA49" className="text-[#FFBA49]" />
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
                        The referral opened the door. Your online presence decides if they walk through it.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Real estate is a referral business. But before they call, they search your name. If you have 15 reviews from 2021, they wonder if you're still active. If you have 2 bad reviews, they wonder if the referral was a fluke.
                        </p>
                        
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                             <h4 className="font-bold text-indigo-800 mb-2">The Math Leaves You Exposed</h4>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>You close 60 deals in 3 years.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>Maybe 12 leave reviews.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>It looks thin compared to competitors.</li>
                             </ul>
                             <p className="font-bold text-indigo-800 mt-4">Result: You look new, even though you're not.</p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            At the closing table, they promise to leave a review. But then they start moving, unpacking, and changing addresses. They forget.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Search size={64} className="text-blue-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Google Test</h3>
                        <p className="text-gray-600 mb-4">
                            Your competitor has 75 reviews. Are they better than you? Maybe not. But they look more established.
                        </p>
                        <p className="font-bold text-gray-800">When a referral Googles you both, who do they call first?</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Your reputation compounds with every closing.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Key />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Closing-Day Enthusiasm</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Post-closing is the emotional peak. They just got the keys. They're thrilled. That's the moment they'll write the best review.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Congratulations again on your new home! If you had a great experience working with me, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Every Deal Counts</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">12 Reviews</p>
                                <p className="text-xs text-gray-500">Over 3 years</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 2 Years</p>
                                <p className="text-green-400 font-bold text-lg">50+ Reviews</p>
                                <p className="text-xs text-gray-500">Recent & Active</p>
                            </div>
                        </div>
                        <p className="text-gray-300">You close 20 deals a year. With MoreStars, 10-15 of those clients leave reviews instead of 2-3.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Users />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Referrals Convert Higher</h3>
                        <p className="text-gray-300 leading-relaxed">
                            The referral creates trust. Your reviews confirm it. When someone sees 50 people describing great experiences, the referral becomes a sure thing.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Reputation Compounds</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Every review is permanent. Two years of consistent review collection means your Google presence keeps growing while competitors stay static.
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
                    <p className="text-gray-600">Capturing the moment matters.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-indigo-100 p-4 border-b border-indigo-200">
                            <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                                <Key size={20}/> Scenario 1: The First-Time Buyer
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Young couple. First home. You walked them through everything. They're thrilled.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They're unpacking boxes and changing addresses. Months pass. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out day after closing. <span className="font-semibold text-green-600">5 Stars.</span> "Made our first home purchase stress-free. Answered every question."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Award size={20}/> Scenario 2: The Tough Deal
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Deal almost fell apart twice. Inspection issues. Financing delays. You held it together.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Client is exhausted. They're just glad it's over. They move on.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They reflect on how hard you worked. <span className="font-semibold text-green-600">5 Stars.</span> "Kept a difficult deal together. True professional."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Volume / Platforms --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Volume Problem & The Platform Solution</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-indigo-600">Every Deal Matters</h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                Most businesses see 100+ customers per month. You close 20-30 deals per year.
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed font-bold">
                                Missing a review opportunity costs you 5% of your annual potential. MoreStars ensures you capture every single one.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-indigo-600">Beyond Google</h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                MoreStars works with any platform. Send clients to Google, Zillow, Realtor.com—wherever reviews matter in your market.
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed font-bold">
                                Strategy: Build Google first (that's where people search). Then add Zillow reviews. Layer credibility.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Real Estate --- */}
        <FAQ 
            title="Real Estate Agent FAQ" 
            items={[
                {
                    question: "When should I send the review request?",
                    answer: "Day of closing or day after. While they're still on the emotional high of getting the keys."
                },
                {
                    question: "What about buyers AND sellers in the same transaction?",
                    answer: "Ask both. That's two opportunities from one deal to boost your profile."
                },
                {
                    question: "What about clients from years ago?",
                    answer: "You can reach out! Upload past client info and send requests. Many will remember you fondly and leave a review—even if it's been a while."
                },
                {
                    question: "Should I ask even after a difficult transaction?",
                    answer: "If the client is happy with the outcome, yes. Difficult deals often produce the strongest testimonials: 'She held this together when I thought it was falling apart.'"
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Build the Online Reputation Your Career Deserves
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Referrals get verified now. Make sure when people Google you, they find confirmation that you're as good as the referral promised.
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

export default RealEstatePage;
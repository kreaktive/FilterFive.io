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
  Sparkles,
  Key,
  Calendar,
  SprayCan as Spray, // Using SprayCan or generic icon if unavailable, mapped to Spray
  UserCheck
} from 'lucide-react';

const HomeCleaningPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Cleaning Services | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your cleaning business. Build trust for a service that enters people\'s homes. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-sky-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Sparkles size={14} /> Cleaning Service Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            You've Cleaned Her House for 3 Years. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
                                She's Never Left a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Your loyal clients love you. Help them tell the people who are still searching for a trustworthy cleaner.
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
                                 <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xl">
                                     <Home fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Jennifer M.</div>
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
                                "Sparkle Clean has been cleaning my home for 5 years. I trust them completely with my keys and my pets. <span className="bg-yellow-100 font-bold px-1">My house has never looked better.</span>"
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
                        She pays on time. She refers neighbors. But on Google? Silence.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You have 50 weekly clients. You have keys to their homes. You water their plants. <strong className="text-gray-900">Your relationship exists entirely offline.</strong>
                        </p>
                        
                        <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
                             <h4 className="font-bold text-sky-800 mb-2">The Google Disconnect</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 A new customer searches for you. They see 23 reviews over 4 years.
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 They see one 1-star review from a client who canceled after a single visit because you "missed a spot behind the toilet."
                             </p>
                             <p className="text-red-600 text-sm mt-4 font-bold">
                                 They don't see the 50 families who trust you implicitly.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Hiring a cleaner is high-stakes. People are nervous about strangers in their home. If they don't see overwhelming proof of trust, they move on.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Key size={64} className="text-gray-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Trust Barrier</h3>
                        <p className="text-gray-600 mb-4">
                            "Will they steal from me?" "Are they reliable?" These are the questions keeping new customers up at night.
                        </p>
                        <p className="font-bold text-gray-800">Your current reviews aren't answering them.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Make your hidden reputation visible.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Loyal Clients Finally Speak Up</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Your best marketing is the client you've had for 5 years. A simple text gives them the platform to vouch for you.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for trusting Sparkle Clean with your home! If you're happy with our work, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Trust Before the First Visit</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">23 Reviews</p>
                                <p className="text-xs text-gray-500">Looks risky</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">100+ Reviews</p>
                                <p className="text-xs text-gray-500">Looks established</p>
                            </div>
                        </div>
                        <p className="text-gray-300">150 reviews describing reliability makes new clients feel safe handing over a key.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Calendar />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Long-Term Value Visible</h3>
                        <p className="text-gray-300 leading-relaxed">
                            "They've cleaned my house for 5 years" is the gold standard of reviews. It proves consistency, not just a one-time good job.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <XCircle />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Drive-By Complaints Buried</h3>
                        <p className="text-gray-300 leading-relaxed">
                             One-time clients who complain about a missed spot lose power when surrounded by 100 reviews from weekly clients who love you.
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
                    <p className="text-gray-600">The difference between invisible and 5-star.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-sky-100 p-4 border-b border-sky-200">
                            <h3 className="font-bold text-sky-800 flex items-center gap-2">
                                <Sparkles size={20}/> Scenario 1: The New Client
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">First cleaning. House is spotless. They're impressed.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They think "good service, I'll keep using them." <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives that evening. <span className="font-semibold text-green-600">5 Stars.</span> "First cleaning and I'm blown away. Every surface spotless."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Calendar size={20}/> Scenario 2: The Long-Term Client
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Cleaning bi-weekly for 2 years. They refer friends. They trust you completely.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Loyal client, <span className="font-semibold text-red-500">zero online presence.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They finally get asked. <span className="font-semibold text-green-600">5 Stars.</span> "Been using them for 2 years. Completely trustworthy. Wouldn't use anyone else."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Trust Factor --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Trust Factor</h2>
                    <div className="max-w-3xl mx-auto mb-8 text-gray-600">
                        Cleaning services require more trust than almost any other home service. Reviews answer the fears of new customers.
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-red-600 flex items-center gap-2"><XCircle/> What They Worry About</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>Will they steal from me?</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>Will they actually clean well?</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>Will they show up reliably?</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>Are they professional?</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm relative overflow-hidden">
                            <h3 className="font-bold text-xl mb-4 text-green-600 flex items-center gap-2"><ShieldCheck/> What Reviews Prove</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"Completely trustworthy, they have my key"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"My house has never looked better"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"Been using them for 3 years"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"Always on time, great communication"</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Recurring Advantage --- */}
        <section className="py-24 bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-6">The Recurring Service Advantage</h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Other businesses get one shot to ask for a review. You have an ongoing relationship.
                </p>
                <div className="bg-white/10 p-8 rounded-2xl border border-white/20">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-left">
                        <div className="flex-shrink-0 w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center text-white">
                            <UserCheck size={32} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl mb-2 text-[#FFBA49]">Your Secret Weapon: Long-Term Clients</h3>
                            <p className="text-gray-200">
                                Your 3-year client can leave a review that says "3 years of experience." That creates immense credibility. Strategy: Reach out to long-term clients first. Their reviews carry the most weight.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Cleaners --- */}
        <FAQ 
            title="Cleaning Service FAQ" 
            items={[
                {
                    question: "Should I ask clients every time I clean?",
                    answer: "No. Ask once. Maybe check back in a year if they haven't reviewed. Don't over-ask—you have an ongoing relationship to maintain."
                },
                {
                    question: "When's the best time to ask long-term clients?",
                    answer: "Anytime. They're already happy. A text saying 'If you've been happy with our service, would you mind leaving a review?' is perfectly appropriate."
                },
                {
                    question: "What about commercial cleaning?",
                    answer: "Same principle. Office managers and business owners can review you. Commercial reviews often mention reliability and consistency—exactly what new clients want to hear."
                },
                {
                    question: "What if we have turnover in cleaning staff?",
                    answer: "Reviews are for your company, not individual cleaners. 'Great service' builds your brand even if the specific cleaner changes."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Loyal Clients Into Online Proof
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your weekly clients trust you with their homes, their keys, their peace of mind. That trust is invisible to new customers searching Google. Time to change that.
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

export default HomeCleaningPage;
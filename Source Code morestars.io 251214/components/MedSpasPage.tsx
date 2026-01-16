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
  Sparkles,
  Smile,
  Lock,
  Clock,
  Calendar,
  Heart
} from 'lucide-react';

const MedSpasPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Med Spas | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your med spa or aesthetic clinic. Build trust for procedures people are nervous about. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-violet-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Sparkles size={14} /> Med Spa Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            She Looks 10 Years Younger. <br/>
                            She Told Her Friends. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
                                She Didn't Leave a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Med spa clients are thrilled with results but private about treatments. MoreStars bridges the gap.
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
                                 <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl">
                                     <Smile fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Rebecca S.</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">3 days ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "I was so nervous about looking overdone. She talked me through everything and the results are perfect. <span className="bg-yellow-100 font-bold px-1">So glad I finally did it.</span>"
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
                        She loves her results. But she keeps them a secret.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your client looks amazing. The Botox settled perfectly. She's thrilled. She tells close friends in hushed tones. "You should try it." <strong className="text-gray-900">But she doesn't tell Google.</strong>
                        </p>
                        
                        <div className="bg-violet-50 p-6 rounded-xl border border-violet-100">
                             <h4 className="font-bold text-violet-800 mb-2">The Anxiety Barrier</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 People are nervous about med spa treatments. They've heard horror stories.
                             </p>
                             <ul className="space-y-2 text-sm text-gray-700 font-medium">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>"What if it looks fake?"</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>"What if something goes wrong?"</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>"What if I hate it?"</li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Reviews answer these fears. "Natural results." "I felt so comfortable." Without enough reviews, you're asking people to take a leap of faith. Most won't.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Lock size={64} className="text-violet-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Private Satisfaction</h3>
                        <p className="text-gray-600 mb-4">
                            It's not that they're unhappy. It's just that publicly announcing "I got work done" feels... private.
                        </p>
                        <p className="font-bold text-gray-800">You need to give them permission to share.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Turn private enthusiasm into public proof.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Sparkles />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Satisfaction</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            After results settle, clients get a text. It's a gentle nudge giving them an easy way to advocate for you.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for visiting Glow Aesthetics! If you're happy with your results, would you mind leaving us a review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Ease First-Timer Anxiety</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">45 Reviews</p>
                                <p className="text-xs text-gray-500">New clients nervous</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">150+ Reviews</p>
                                <p className="text-xs text-gray-500">Clients expect quality</p>
                            </div>
                        </div>
                        <p className="text-gray-300">150 reviews describing positive experiences reduces fear. They walk in expecting the experience others described.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Treatment-Specific Confidence</h3>
                        <p className="text-gray-300 leading-relaxed">
                            "My Botox looks natural." "Best lip filler ever." These reviews build confidence in specific treatments. Potential clients know you're good at exactly what they want.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Heart />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Many Will Share</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Not everyone wants privacy. Many are proud of their results. They want to share. MoreStars gives them the platform.
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
                    <p className="text-gray-600">Different treatments, same opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-violet-100 p-4 border-b border-violet-200">
                            <h3 className="font-bold text-violet-800 flex items-center gap-2">
                                <Sparkles size={20}/> Scenario 1: The Botox Refresh
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Client came in for quarterly Botox. Two weeks later, it's settled perfectly. She looks refreshed.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She tells her sister. That's it. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives at the 2-week mark. <span className="font-semibold text-green-600">5 Stars.</span> "Natural results every time. She really listens. Been coming for 2 years."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-pink-100 p-4 border-b border-pink-200">
                            <h3 className="font-bold text-pink-800 flex items-center gap-2">
                                <Smile size={20}/> Scenario 2: The First-Timer
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Nervous client tried lip filler. Scared it would look fake. It's perfect.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She texts her best friend "You HAVE to try this." <span className="font-semibold text-red-500">No public review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She gets a nudge. <span className="font-semibold text-green-600">5 Stars.</span> "I was so nervous but the results are perfect. So glad I finally did it."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Treatment Timing & Privacy --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-violet-50 rounded-3xl p-8 md:p-12 border border-violet-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Timing & Privacy</h2>
                    
                    <div className="grid md:grid-cols-2 gap-12 text-left mb-12">
                        <div className="bg-white p-6 rounded-xl border border-violet-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-violet-600 flex items-center gap-2"><Lock/> The Privacy Balance</h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                Many clients value privacy. They don't want to announce treatments. But many others are fine with it. They're proud.
                            </p>
                            <p className="text-gray-800 text-sm font-bold">
                                MoreStars asks. Clients who want privacy can ignore it. Clients who want to share have an easy way to do it. You don't need 100% to review.
                            </p>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl border border-violet-200 shadow-sm">
                             <h3 className="font-bold text-xl mb-4 text-violet-600 flex items-center gap-2"><Clock/> Treatment Timing</h3>
                             <div className="space-y-3 text-sm">
                                 <div className="flex justify-between border-b border-gray-100 pb-2">
                                     <span className="font-bold text-gray-700">Facials / Skincare</span>
                                     <span className="text-gray-500">Same day or next day</span>
                                 </div>
                                 <div className="flex justify-between border-b border-gray-100 pb-2">
                                     <span className="font-bold text-gray-700">Botox / Dysport</span>
                                     <span className="text-gray-500">10-14 days (after settling)</span>
                                 </div>
                                 <div className="flex justify-between border-b border-gray-100 pb-2">
                                     <span className="font-bold text-gray-700">Fillers</span>
                                     <span className="text-gray-500">1-2 weeks (after swelling)</span>
                                 </div>
                                 <div className="flex justify-between pt-1">
                                     <span className="font-bold text-gray-700">Body Contouring</span>
                                     <span className="text-gray-500">After results visible</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                    
                    <p className="text-violet-800 text-sm font-medium max-w-2xl mx-auto">
                        Ask when they can see the results. That's when they're happiest.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Med Spas --- */}
        <FAQ 
            title="Med Spa FAQ" 
            items={[
                {
                    question: "Won't clients feel weird reviewing treatments?",
                    answer: "Some will. They can simply ignore the request. But many clients are happy to share, especially when results are natural and they're proud. You'll be surprised how many respond."
                },
                {
                    question: "Should I mention specific treatments in the request?",
                    answer: "Keep it general ('Thanks for visiting Glow Aesthetics'). Let clients decide what they want to share in their review. Some will mention 'Botox' specifically, others will just say 'great service'."
                },
                {
                    question: "What about clients who had complications?",
                    answer: "If there was an issue or they weren't 100% happy, don't send a review request. Handle the situation privately first. Focus requests on your happy success stories."
                },
                {
                    question: "What about Yelp?",
                    answer: "MoreStars works with any platform. Med spas often benefit from Google, Yelp, and RealSelf. You can choose where to send clients based on what matters most in your market."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Private Satisfaction Into Public Proof
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your clients love their results. They tell friends. They refer people. Now help them tell the nervous strangers who need reassurance before booking their first appointment.
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

export default MedSpasPage;
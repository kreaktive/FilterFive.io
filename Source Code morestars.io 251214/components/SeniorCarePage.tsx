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
  Heart,
  Users,
  Clock,
  Home,
  Activity,
  Calendar
} from 'lucide-react';

const SeniorCarePage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Home Care Agencies | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your home care agency. Families research obsessively. Be the choice they trust. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-teal-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Heart size={14} /> Senior Care Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            You Cared for Mom Like Family. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                                The Family Never Left a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Families agonize over senior care decisions. Reviews ease the hardest choice they'll make.
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
                                 <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">
                                     <Home fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">The Williams Family</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">2 days ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "For 3 years, they were there every single day. Our caregiver became part of the family. <span className="bg-yellow-100 font-bold px-1">Compassionate, reliable, and treated Dad with dignity.</span>"
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
                        The gratitude is real, but the reviews are missing.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your caregiver helped with bathing, meals, and held her hand during hard days. When mom passed, the daughter hugged you in tears. <strong className="text-gray-900">But she never reviewed you.</strong>
                        </p>
                        
                        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
                             <h4 className="font-bold text-teal-800 mb-2">The Silence of Grief</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 She was grieving. She was busy with the estate. Your agency was the last thing on her mind.
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 Months later, the gratitude is distant. She never thinks about Google. Your page stays empty.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Now, a family desperately searching for help sees your 22 reviews vs. a competitor's 85. They call the competitor. You never get the chance to show the compassion you offer.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <ShieldCheck size={64} className="text-teal-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Highest Stakes</h3>
                        <p className="text-gray-600 mb-4">
                            This isn't hiring a plumber. Families are scared. "Will they neglect mom? Will they show up?"
                        </p>
                        <p className="font-bold text-gray-800">Without reviews, you're asking for a leap of faith.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Capture gratitude while it's accessible.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Heart />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Gratitude</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            At the right moment—not during crisis—families get a text. One tap. They share what you meant to their family.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thank you for trusting Compassionate Home Care. If you've had a positive experience, would you mind sharing a review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Ease the Hardest Decision</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">22 Reviews</p>
                                <p className="text-xs text-gray-500">Families unsure</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 1 Year</p>
                                <p className="text-green-400 font-bold text-lg">60+ Reviews</p>
                                <p className="text-xs text-gray-500">Stories of compassion</p>
                            </div>
                        </div>
                        <p className="text-gray-300">60 reviews from families who were in the same position provide reassurance.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Clock />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Long-Term Proof</h3>
                        <p className="text-gray-300 leading-relaxed">
                            "They cared for mom for 4 years." That sentence is powerful. It shows reliability, consistency, and quality that lasts.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Real Experiences Visible</h3>
                        <p className="text-gray-300 leading-relaxed">
                             "Treated my father with dignity." "Reliable for 3 years." These reviews answer fears that brochures never can.
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
                    <p className="text-gray-600">Timing is sensitive, but critical.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-teal-100 p-4 border-b border-teal-200">
                            <h3 className="font-bold text-teal-800 flex items-center gap-2">
                                <Heart size={20}/> Scenario 1: The Grateful Daughter
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Care for mom has been going well for 18 months. Daughter is relieved and happy with the caregiver.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She tells friends. Maybe refers someone. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She gets a check-in. <span className="font-semibold text-green-600">5 Stars.</span> "They've been caring for mother for over a year. I don't know what we'd do without them."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Clock size={20}/> Scenario 2: The End of Care
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Mom passed peacefully. Caregiver was there. Family is grieving but grateful.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They move through grief. Time passes. They never think about reviewing.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Weeks later, when appropriate: <span className="font-semibold text-green-600">5 Stars.</span> "Compassionate, professional, and genuinely caring until the end."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Trust & Timing Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-teal-50 rounded-3xl p-8 md:p-12 border border-teal-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Trust & Timing</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-teal-600 flex items-center gap-2"><ShieldCheck/> The Trust Factor</h3>
                            <ul className="space-y-3 text-gray-600 text-sm">
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Will they neglect mom?</span> <span className="font-bold text-gray-800">"Treated her with dignity"</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Will they show up?</span> <span className="font-bold text-gray-800">"Reliable for 3 years"</span></li>
                                <li className="flex justify-between border-b border-gray-100 pb-2"><span>Can we trust them?</span> <span className="font-bold text-gray-800">"Became part of family"</span></li>
                                <li className="flex justify-between pt-2"><span>Will they care?</span> <span className="font-bold text-gray-800">"Genuinely compassionate"</span></li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm">
                             <h3 className="font-bold text-xl mb-4 text-teal-600 flex items-center gap-2"><Calendar/> Timing Sensitivity</h3>
                             <p className="text-xs text-gray-500 mb-4 uppercase font-bold tracking-wide">Trust your team's judgment</p>
                             <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><CheckCircle size={14} className="text-green-500"/> <span className="font-bold text-gray-800 text-sm">When to Ask</span></div>
                                    <p className="text-xs text-gray-600 pl-6">When care is stable, after positive milestones, or when families express gratitude.</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><XCircle size={14} className="text-red-500"/> <span className="font-bold text-gray-800 text-sm">When NOT to Ask</span></div>
                                    <p className="text-xs text-gray-600 pl-6">During crisis, immediately after a death, or when families are overwhelmed with grief.</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Senior Care --- */}
        <FAQ 
            title="Senior Care FAQ" 
            items={[
                {
                    question: "How do we handle timing around sensitive situations?",
                    answer: "This requires judgment. Your team knows the families. Ask when care is going well and families are in a stable place—not during crisis or grief."
                },
                {
                    question: "What about HIPAA?",
                    answer: "You're not sharing health information. Families choose what to share in their reviews. You're simply asking them to share their experience with your agency."
                },
                {
                    question: "What if we get a complaint?",
                    answer: "Respond professionally and compassionately. With enough positive reviews, one complaint is context. Focus on collecting reviews from the many families you've helped to balance the narrative."
                },
                {
                    question: "Should we ask families after care has ended?",
                    answer: "If appropriate and the relationship was positive. Some families will still be in grief; others will have processed and be willing to share as a way to honor the care their loved one received."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Help Families Find the Care Their Loved Ones Deserve
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Families searching for senior care are scared and overwhelmed. Your happy families can tell them: there's help, there's hope, there's someone they can trust. They just need a nudge.
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

export default SeniorCarePage;
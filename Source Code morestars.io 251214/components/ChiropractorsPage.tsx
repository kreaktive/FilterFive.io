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
  Activity,
  UserCheck,
  ThumbsUp,
  Clock,
  Heart
} from 'lucide-react';

const ChiropractorsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Chiropractors | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your chiropractic or PT practice. Help patients share their results. $77/month. Start free.');
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
                            <Activity size={14} /> Practice Growth
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            They Feel Better. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-green-600">
                                Now They Can Tell Google.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Your patients get results. Help them share that with people still searching for relief.
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
                                     <UserCheck fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Mark D.</div>
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
                                "I came in barely able to walk. After 6 weeks with Dr. Martinez, I'm back to running. <span className="bg-yellow-100 font-bold px-1">Avoided back surgery</span> thanks to this team."
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
                        Your actual results are invisible online.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your patient walks in hunched over. Eight weeks later, they're playing with their kids again. They thank you constantly. But they don't think about Google. They're focused on staying healthy.
                        </p>
                        
                        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
                             <h4 className="font-bold text-teal-800 mb-2">The Skeptic Problem</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 The internet is full of people who call your work "pseudoscience" without ever visiting. Or impatient patients who leave 1-star reviews after two visits because they aren't miraculously healed yet.
                             </p>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>The 50-year-old playing golf again? <strong>Silent.</strong></li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>The athlete who avoided surgery? <strong>Silent.</strong></li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>The skeptic? <strong>Loud.</strong></li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            The skeptics and the impatient are defining your reputation. Your success stories are going untold.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Activity size={64} className="text-teal-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Invisible Success</h3>
                        <p className="text-gray-600 mb-4">
                            The office worker whose headaches finally stopped. The runner back on the trail. These people exist. They're grateful. They just need a nudge.
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
                    <p className="text-xl text-gray-300">Turn clinical success into social proof.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Clock />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Breakthrough Moments</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            You don't ask after the first visit. You ask when they say, "I can't believe how much better I feel."
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "We're so glad you're feeling better! If you've had a positive experience at Wellness Chiropractic, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Outcomes Become Visible</h3>
                        <p className="text-gray-300 leading-relaxed">
                            "Chronic headaches finally gone." "Back to running." Real patient stories provide the proof that new patients are searching for.
                        </p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Drown Out Skeptics</h3>
                        <p className="text-gray-300 leading-relaxed">
                            One "pseudoscience" review among 200 patient success stories is irrelevant. Volume changes the narrative. Your results define you, not the critics.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Heart />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Hope Wins Patients</h3>
                        <p className="text-gray-300 leading-relaxed">
                             When someone finds you on Google, they read stories of people with similar problems getting better. They arrive hopeful instead of skeptical.
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
                    <p className="text-gray-600">Timing is everything in healthcare.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-teal-100 p-4 border-b border-teal-200">
                            <h3 className="font-bold text-teal-800 flex items-center gap-2">
                                <Activity size={20}/> Scenario 1: The Breakthrough
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Patient came in with chronic pain. After 6 weeks, they're moving freely. "I haven't felt this good in years."</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They keep coming for maintenance. Life improves. Google never knows.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out that day. <span className="font-semibold text-green-600">5 Stars.</span> "Dr. Chen changed my life. I was skeptical but my back pain is gone."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <UserCheck size={20}/> Scenario 2: The Skeptic Convert
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Patient was dragged in by their spouse. Didn't believe it worked. Now they're a convert.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They become a loyal patient. Tell friends at dinner. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get the link. <span className="font-semibold text-green-600">5 Stars.</span> "Was skeptical but now I'm a believer. Wish I'd started years ago."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Timing Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-teal-50 rounded-3xl p-8 md:p-12 border border-teal-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Timing Is Everything</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-teal-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-green-600 flex items-center gap-2"><CheckCircle/> When To Ask</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>When they express gratitude ("I feel so much better")</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>When they report significant improvement</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>When they refer a friend (they're already advocating)</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>After completing a treatment plan</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm opacity-90">
                             <h3 className="font-bold text-xl mb-4 text-red-600 flex items-center gap-2"><XCircle/> When Not To Ask</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>After the first visit (too early)</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>During initial acute pain phase</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>If they seem frustrated with progress</li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-8 text-teal-800 text-sm font-medium max-w-2xl mx-auto">
                        The moment of gratitude is the moment to ask. MoreStars makes that ask effortless.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Chiros --- */}
        <FAQ 
            title="Chiropractor & PT FAQ" 
            items={[
                {
                    question: "Is this okay for healthcare practices?",
                    answer: "Yes. We only need patient name and phone number. We don't store or transmit any protected health information. The message is generic—no mention of specific conditions or treatments."
                },
                {
                    question: "What about Healthgrades or Vitals?",
                    answer: "MoreStars works with any platform. Send patients to Google, Healthgrades, Vitals—whatever matters in your market. Many practices focus on Google first, then expand."
                },
                {
                    question: "What if a patient had unrealistic expectations?",
                    answer: "Some patients expect instant results. Chiropractic takes time. If they leave a negative review early, that's frustrating—but when you have 100 reviews from patients who stuck with it and got results, one impatient complaint is context."
                },
                {
                    question: "Does this work for physical therapy too?",
                    answer: "Same idea. PT results take time. Ask when patients hit milestones or complete their treatment. 'After ACL surgery, I didn't think I'd run again. 12 weeks later, I'm training for a 5K.'"
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Let Your Results Speak for Themselves
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your patients get better. That's the point of everything you do. Now help them share those results with people still searching for relief.
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

export default ChiropractorsPage;
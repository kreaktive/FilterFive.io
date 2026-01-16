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
  Dog,
  Heart,
  Stethoscope,
  Activity,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const VeterinariansPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Veterinarians | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your veterinary practice. Pet parents research before they trust. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Stethoscope size={14} /> Veterinary Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            You Saved Their Dog. <br/>
                            They Cried. <br/>
                            They Hugged You. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
                                They Didn't Leave a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Pet parents trust you with their family. Help them tell Google.
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
                                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl">
                                     <Dog fill="currentColor" />
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
                                 <div className="ml-auto text-xs text-gray-400">2 hours ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "They saved Buster's life. We were terrified and Dr. Smith was calm, professional, and caring. <span className="bg-yellow-100 font-bold px-1">Can't thank them enough.</span>"
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
                        You're a hero in the exam room, but a villain online.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            The dog came in barely breathing. You worked for two hours. You saved him. The family sobbed with relief. A week later, they're back to normal life. <strong className="text-gray-900">You're a distant memory.</strong>
                        </p>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Unfair Math</h4>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>You see 200 pets a month.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>You save lives and ease suffering.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>5 reviews come in.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>3 are from grieving families or shocked bill-payers.</li>
                             </ul>
                             <p className="font-bold text-red-800 mt-4">Result: Grief and sticker shock dominate your profile.</p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            "They only care about money." "They killed my cat." It's not fair. You did everything right. But grief needs an outlet, and your Google page becomes it.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <AlertTriangle size={64} className="text-orange-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Silent Heroes</h3>
                        <p className="text-gray-600 mb-4">
                            The successful surgeries. The managed chronic conditions. The midnight emergencies handled perfectly. These stories exist. They just aren't being told.
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
                    <p className="text-xl text-gray-300">Give a voice to the happy outcomes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Heart />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Gratitude When It's Real</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The text arrives while they're still relieved. While their pet is healthy. One tap. They share their experience.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for bringing Max to Riverside Veterinary today! If we took good care of him, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Successful Outcomes Visible</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">45 Reviews</p>
                                <p className="text-xs text-gray-500">Grief-driven complaints</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">200+ Reviews</p>
                                <p className="text-xs text-gray-500">"Saved my dog" stories</p>
                            </div>
                        </div>
                        <p className="text-gray-300">New clients see what you actually do—not just the worst moments.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Difficult Reviews Get Context</h3>
                        <p className="text-gray-300 leading-relaxed">
                            You can't prevent grief reviews. But when that review sits among 200 others describing compassionate care and saved lives, new clients understand. Veterinary medicine has hard moments. That doesn't mean you're bad.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Stethoscope />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Pet Parents Choose You First</h3>
                        <p className="text-gray-300 leading-relaxed">
                             When someone's pet is sick, they're scared. 200 reviews describing how you saved animals and comforted families builds trust before the first phone call.
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
                    <p className="text-gray-600">The difference is in the ask.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-emerald-100 p-4 border-b border-emerald-200">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                                <Activity size={20}/> Scenario 1: The Emergency Save
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Dog ate something toxic. You stabilized him, kept him overnight, sent him home healthy.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Family is relieved and grateful. Life goes back to normal. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives next day. <span className="font-semibold text-green-600">5 Stars.</span> "They saved Buster's life. We were terrified and they were calm, professional, and caring."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Stethoscope size={20}/> Scenario 2: The Routine Wellness
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Cat comes in for annual checkup and vaccines. Everything's healthy. Owner is happy.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Routine visit. Forgettable. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get the link. <span className="font-semibold text-green-600">5 Stars.</span> "Always a great experience. Dr. Martinez is so gentle with Luna."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Grief Reality Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Grief Review Reality</h2>
                    <div className="max-w-3xl mx-auto">
                        <p className="text-gray-600 mb-8 text-lg">
                            Some reviews will come from grieving families. You can't prevent that. When pets die, emotions are raw and people look for someone to blame.
                        </p>
                        <div className="grid md:grid-cols-2 gap-8 text-left">
                            <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-2 text-red-600">Current State</h3>
                                <p className="text-gray-600 text-sm">One grief review among 50 total.</p>
                                <div className="mt-4 text-3xl font-bold text-red-500">2%</div>
                                <p className="text-xs text-gray-400 mt-1">Defines your online story.</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm">
                                <h3 className="font-bold text-lg mb-2 text-green-600">With MoreStars</h3>
                                <p className="text-gray-600 text-sm">One grief review among 300 total.</p>
                                <div className="mt-4 text-3xl font-bold text-green-500">0.3%</div>
                                <p className="text-xs text-gray-400 mt-1">Buried in success stories.</p>
                            </div>
                        </div>
                        <p className="mt-8 text-gray-500 text-sm font-medium">
                            Let 200 "they saved my pet" stories speak louder than 5 "they let my pet die" accusations.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Vets --- */}
        <FAQ 
            title="Veterinarian FAQ" 
            items={[
                {
                    question: "Should I send requests after every visit?",
                    answer: "Focus on positive outcomes. Wellness visits, successful treatments, good news appointments. Skip review requests after difficult conversations or losses. Use your judgment."
                },
                {
                    question: "What about emergency clinics?",
                    answer: "Perfect fit. Emergency visits are high emotion. When you save a pet at 3am, that family is incredibly grateful—capture it while the relief is fresh."
                },
                {
                    question: "Is this okay for veterinary practices?",
                    answer: "Yes. We only need client name, pet name, and phone number. No medical information. The message is generic and polite."
                },
                {
                    question: "What if the pet's name has changed or we have it wrong?",
                    answer: "You can customize messages or skip the pet name in the template. But when it's right (which is 99% of the time), personalization makes a massive difference in response rates."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Let Your Saved Lives Tell Your Story
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You do heroic work every day. Families are grateful. Pets are healthy because of you. Now help those families share what you did—so the next scared pet parent knows who to call.
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

export default VeterinariansPage;
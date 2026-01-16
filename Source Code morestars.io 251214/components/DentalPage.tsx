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
  Stethoscope,
  ShieldCheck,
  XCircle,
  ThumbsUp,
  Users,
  Smile
} from 'lucide-react';

const DentalPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Dentists | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your dental practice. New patients check reviews first. $77/month. HIPAA-friendly. Start free.');
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
                            <Stethoscope size={14} /> Dental Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Your Patients Trust You With Their Teeth. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                                Help Them Tell Google.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            New patients check your reviews before they call. Make sure they like what they see.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 bg-[#FFBA49] text-[#23001E]">
                                Start Free Trial <ArrowRight size={20} />
                            </button>
                        </div>
                        <p className="mt-6 text-sm text-gray-500 font-medium flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" /> HIPAA-friendly. No credit card required.
                        </p>
                    </div>
                    
                    {/* Hero Visual */}
                    <div className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform rotate-1">
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                     <Smile fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Sarah J.</div>
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
                                "I was so nervous about my root canal, but Dr. Chen made it completely comfortable. The staff is friendly and the office is spotless. <span className="bg-yellow-100 font-bold px-1">Best dentist in town!</span>"
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
                        You've built a great practice. Your patients love you. But your Google page doesn't reflect that.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You have 47 reviews. Your competitor across town—the one who does adequate work at best—has 312 reviews and a 4.7 rating. When someone new searches "dentist near me," they see those numbers. <strong>They pick the other guy.</strong>
                        </p>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Cost of Silence</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 A single new patient is worth <span className="font-bold">$10,000-$15,000</span> in lifetime value.
                             </p>
                             <p className="text-gray-700 text-sm">
                                 When they choose your competitor because of review count, that's $15k you'll never see. Multiply that by every searcher who skipped you this month.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, the only people who remember to review you are the ones confused about their insurance copay. Now their complaints are the first thing new patients see.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Users size={64} className="text-blue-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Where Did They Go?</h3>
                        <p className="text-gray-600 mb-4">
                            Your happy patient left 20 minutes ago. They meant to leave a review. But now they're picking up kids or answering emails.
                        </p>
                        <p className="font-bold text-gray-800">The moment is gone.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">We help you capture the "thank you" before they forget.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Patients Finally Speak Up</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            After their appointment, patients get a simple text. No awkward front desk ask.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for visiting Riverside Dental today! If you had a great experience, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Presence Matches Reality</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">4.1 Stars</p>
                                <p className="text-xs text-gray-500">Insurance gripes at top</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 90 Days</p>
                                <p className="text-green-400 font-bold text-lg">4.7 Stars</p>
                                <p className="text-xs text-gray-500">"Gentle care" dominates</p>
                            </div>
                        </div>
                        <p className="text-gray-300">If you see 150 patients a month, you could add 35+ reviews monthly.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Users />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Acquisition Gets Easier</h3>
                        <p className="text-gray-300 leading-relaxed">
                            When someone searches "dentist near me," they see your 4.7 stars and 200 reviews. They see real people describing experiences that sound like what they want. They call you first.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Stop Losing to Competitors</h3>
                        <p className="text-gray-300 leading-relaxed">
                             That competitor with 312 reviews? Maybe they're good. Maybe they're just better at collecting reviews. MoreStars levels the playing field so your quality of care wins.
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
                    <p className="text-gray-600">Capturing the patient experience.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Smile size={20}/> Scenario 1: The Routine Cleaning
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Patient comes in for their 6-month cleaning. Everything looks good. They leave happy.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They're back at work 20 minutes later. The dentist visit is forgotten. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives that afternoon. Quick tap. <span className="font-semibold text-green-600">5 Stars.</span> "Always a great experience. The hygienist is wonderful."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-100 p-4 border-b border-purple-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <Stethoscope size={20}/> Scenario 2: The Nervous Patient
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Patient was anxious about their root canal. You walked them through it. Painless. They're relieved.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They tell their spouse what a great experience it was. That's where it ends.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get a gentle nudge. <span className="font-semibold text-green-600">5 Stars.</span> "I was so nervous but Dr. Chen made it completely comfortable."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Dental --- */}
        <FAQ 
            title="Dental Practice FAQ" 
            items={[
                {
                    question: "Is this HIPAA compliant?",
                    answer: "Yes. MoreStars doesn't store or transmit protected health information (PHI) beyond contact info. We only use patient name and phone number. The text message is a generic review request—no mention of specific treatments, conditions, or anything clinical."
                },
                {
                    question: "What about dental specialists?",
                    answer: "Works for any specialty. Orthodontists, oral surgeons, periodontists, endodontists, pediatric dentists. Anyone who benefits from Google reviews."
                },
                {
                    question: "When should I send requests?",
                    answer: "Same day, afternoon works well. While the experience is fresh but they've had time to leave the office and settle in at home."
                },
                {
                    question: "What if a patient complains about insurance?",
                    answer: "It happens. But most patients understand insurance isn't your fault. When you have 200 reviews, one 3-star about billing confusion doesn't hurt your overall rating. Volume is your defense."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Grow Your Practice With the Reviews You've Earned
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your patients already trust you. They already refer their friends. Now help them tell Google—so the patients who don't know you yet can find you.
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

export default DentalPage;
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
  School,
  Heart,
  Users,
  Calendar,
  Sun,
  Clock,
  GraduationCap
} from 'lucide-react';

const DaycarePage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Daycare Centers | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your childcare center. Parents research obsessively. Be ready. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <School size={14} /> Childcare Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Parents Tour Five Centers Before Choosing. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                                Reviews Decide Which Five.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Parents research obsessively before trusting someone with their child. Your reviews answer their biggest fears.
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
                                 <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                                     <Heart fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Sarah (Liam's Mom)</div>
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
                                "I was so nervous about daycare. Now my son LOVES going. The teachers genuinely care and he's learning so much. <span className="bg-yellow-100 font-bold px-1">I trust them completely.</span>"
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
                        If your reviews don't measure up, you never even get the tour.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You have 50 happy families. Kids who've been with you for years. Parents who trust you completely. <strong className="text-gray-900">But only 15 have left reviews.</strong>
                        </p>
                        
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                             <h4 className="font-bold text-purple-800 mb-2">The Comparison Trap</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 Your competitor down the street has 180 reviews. Are they better? Probably not.
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 But to a terrified parent looking for "safety" and "love," 180 reviews looks like a sure thing. 15 reviews looks like a risk.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Parents aren't choosing a restaurant. They're choosing who will raise their child for 40 hours a week. They eliminate any center that seems risky. If you don't have the social proof, you get eliminated.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <ShieldCheck size={64} className="text-purple-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Highest Stakes</h3>
                        <p className="text-gray-600 mb-4">
                            "Is my child safe?" "Will they be loved?"
                        </p>
                        <p className="font-bold text-gray-800">Reviews answer these questions. Your website cannot.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Your happy families become your marketing team.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Users />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Families Become Visible</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Parents receive a text thanking them for trusting you. One tap takes them to Google to share their story.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thank you for trusting Little Stars Academy! If you've had a positive experience, would you mind leaving us a review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Win the Comparison</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">18 Reviews</p>
                                <p className="text-xs text-gray-500">Looks small/new</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">80+ Reviews</p>
                                <p className="text-xs text-gray-500">Trusted choice</p>
                            </div>
                        </div>
                        <p className="text-gray-300">When you have 80 reviews, you make the shortlist. You get the tour. You get the enrollment.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Fears Answered Before the Tour</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Reviews like "I trust them completely" and "My daughter thrived here" do the heavy lifting. When parents walk in for a tour, they're already leaning yes.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <GraduationCap />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Long-Term Proof</h3>
                        <p className="text-gray-300 leading-relaxed">
                             "My kids have been here for 4 years." That sentence is gold. It proves stability, consistency, and long-term quality that a website never can.
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
                    <p className="text-gray-600">Different stages, same opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-100 p-4 border-b border-purple-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <Heart size={20}/> Scenario 1: The Relieved Parent
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Mom was anxious about work. 3 months in, toddler runs to the door happy every morning.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She tells her mom friends. She's grateful. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She gets a check-in text. <span className="font-semibold text-green-600">5 Stars.</span> "I was so nervous but now my son LOVES going. Teachers genuinely care."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <GraduationCap size={20}/> Scenario 2: The Graduate
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Child is off to kindergarten after 4 years with you. Family is sad to leave.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They move on. You lose your best advocates.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">You send a graduation text. <span className="font-semibold text-green-600">5 Stars.</span> "Both kids went here. 5 years total. Amazing curriculum. Will recommend forever."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Safety & Timing Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-purple-50 rounded-3xl p-8 md:p-12 border border-purple-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Trust Equation</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-purple-600 flex items-center gap-2"><ShieldCheck/> The Safety Question</h3>
                            <p className="text-gray-600 text-sm mb-4">Every parent asks: "Is my child safe?" They can't know from a tour. They rely on other parents.</p>
                            <ul className="space-y-2 text-sm font-medium text-gray-800">
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> "Never worried about safety"</li>
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> "Staff genuinely loves kids"</li>
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> "Thrived here for 3 years"</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                             <h3 className="font-bold text-xl mb-4 text-blue-600 flex items-center gap-2"><Clock/> Timing Matters</h3>
                            <p className="text-gray-600 text-sm mb-4">Don't ask too early. Wait until they are settled and happy.</p>
                            <ul className="space-y-2 text-sm font-medium text-gray-800">
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> 3+ months enrolled</li>
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Developmental milestones</li>
                                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Graduation to next class</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Daycare --- */}
        <FAQ 
            title="Daycare Owner FAQ" 
            items={[
                {
                    question: "When should I send review requests?",
                    answer: "After families are settled in—usually 2-3 months. Or when they express how happy they are. Don't ask during the initial adjustment period when drop-offs might still be teary."
                },
                {
                    question: "What if we get a negative review?",
                    answer: "Respond professionally and compassionately. With enough positive reviews, one negative doesn't define you. Parents understand that no daycare is perfect for every single family."
                },
                {
                    question: "Should I ask families who are leaving?",
                    answer: "Yes, if they're leaving on good terms (child aging out, family moving). They can write a comprehensive review of their entire experience."
                },
                {
                    question: "What about privacy/names?",
                    answer: "Parents choose what to share in their review. You aren't sharing info; they are. Most reviews are general: 'great teachers,' 'my child loves it.' If they want to share details, that's their choice."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Help Parents Find the Quality Care You Provide
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Parents research obsessively before trusting someone with their child. Your happy families can answer every fear, every question, every hesitation. They just need a nudge.
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

export default DaycarePage;
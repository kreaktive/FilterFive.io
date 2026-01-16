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
  Wrench,
  ShieldCheck,
  XCircle,
  ThumbsUp
} from 'lucide-react';

const AutoRepairPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Auto Repair Shops | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your auto shop. Build trust with customers who assume the worst. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Wrench size={14} /> Auto Repair Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Customers Assume You're Ripping Them Off. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Reviews Prove You're Not.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            The trust problem in auto repair is real. A strong Google presence is the only way to fight it before they even walk in the door.
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
                                     <Star fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Mike R.</div>
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
                                "I was terrified to bring my Accord in because other shops have quoted me crazy prices. Main Street Auto was honest, explained everything, and the price was fair. <span className="bg-yellow-100 font-bold px-1">Finally found a mechanic I trust.</span>"
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Rating</div>
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
                        You've seen the look. The skeptical squint. The "let me call my husband" pause.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            <strong className="text-gray-900">The mechanic stereotype is killing your business.</strong> It doesn't matter that you're honest. It doesn't matter that you've been doing this for 20 years. Every new customer walks in with their guard up because they've heard horror stories about shady shops.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Here's the math that hurts:
                        </p>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <span className="font-bold text-gray-900">100</span> customers serviced
                            </li>
                            <li className="flex gap-3 items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <span className="font-bold text-green-600">95</span> leave happy (but silent)
                            </li>
                            <li className="flex gap-3 items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                                <span className="font-bold text-red-500">2</span> leave reviews (complaining about price)
                            </li>
                        </ul>
                        <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                            <p className="font-bold text-red-800">Result: Your Google rating is 3.5 stars.</p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <AlertTriangle size={64} className="text-orange-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>You Lost the Job Before They Called</h3>
                        <p className="text-gray-600">
                            When someone Googles "auto repair near me" and sees your competitor with 4.8 stars and you with 3.5, they don't call to ask if you're honest. They just call the other guy.
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
                    <p className="text-xl text-gray-300">We turn your silent happy customers into a loud marketing army.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Reach the Silent 95%</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Those 95 satisfied customers? MoreStars reaches them with a simple text after they leave.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for trusting Main St Auto with your Accord. If we took good care of you, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Rating Reflects Reality</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-red-400 font-bold text-lg">3.8 Stars</p>
                                <p className="text-xs text-gray-500">Price complaints dominate</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 90 Days</p>
                                <p className="text-green-400 font-bold text-lg">4.6 Stars</p>
                                <p className="text-xs text-gray-500">"Honest" & "Fair" dominate</p>
                            </div>
                        </div>
                        <p className="text-gray-300">When you get 30 reviews a month, your rating climbs fast.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Fight Stereotypes with Proof</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Every "honest shop, fair prices" review is a weapon. When a new customer sees 200 people saying you're trustworthy, their guard comes down. They walk in expecting good service, not a fight.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <XCircle />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">One Bad Review stops being a disaster</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Right now, a 1-star review sits at the top. With 200+ reviews, one complaint is just noise. It's context, not catastrophe. You can respond professionally and move on.
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
                    <p className="text-gray-600">How automation saves your reputation.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-green-100 p-4 border-b border-green-200">
                            <h3 className="font-bold text-green-800 flex items-center gap-2">
                                <ThumbsUp size={20}/> Scenario 1: The Satisfied Customer
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">You replaced their brakes. Fair price, done right. They drove away happy.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They meant to review you. Forgot by dinner. <span className="font-semibold text-red-500">0 Reviews.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out that afternoon. <span className="font-semibold text-green-600">5 Stars.</span> "Honest shop. Fair prices. Finally found a mechanic I trust."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-orange-100 p-4 border-b border-orange-200">
                            <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                <AlertTriangle size={20}/> Scenario 2: The Price Question
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Customer needed a catalytic converter. $1,200. They weren't thrilled about the cost.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They stew on it. Leave a <span className="font-semibold text-red-500">2-star review</span> about being "overcharged."</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Your advisor explained the repair. They get a polite review request. <span className="font-semibold text-green-600">4 Stars.</span> "Expensive but they were honest about what was needed."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Auto --- */}
        <FAQ 
            title="Auto Repair FAQ" 
            items={[
                {
                    question: "When should I send requests?",
                    answer: "Same day. While they're still relieved the car is fixed. Late afternoon works well—they've had time to drive the car and confirm everything's working."
                },
                {
                    question: "What if someone complains about the price?",
                    answer: "Some will. You can't prevent that. But 50 reviews saying 'fair and honest' make one price complaint irrelevant. Volume is your defense."
                },
                {
                    question: "Does this work for quick lube and oil change shops?",
                    answer: "Yes. High volume = high opportunity. Even with smaller tickets, you're seeing dozens of customers daily. That's dozens of review opportunities."
                },
                {
                    question: "What about body shops?",
                    answer: "Same idea. Customer gets their car back looking great. Text goes out. They leave a review about the quality of the work."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Build the Reputation Your Work Deserves
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  The trust problem in auto repair isn't going away. But you can prove you're one of the good ones—with reviews from real customers who know it.
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

export default AutoRepairPage;
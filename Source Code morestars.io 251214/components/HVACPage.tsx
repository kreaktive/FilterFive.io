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
  ShieldCheck,
  XCircle,
  ThumbsUp,
  Fan,
  Thermometer,
  Sun,
  Snowflake,
  Flame
} from 'lucide-react';

const HVACPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for HVAC Contractors | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your HVAC business. Capture customer gratitude while it\'s hot. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-orange-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Fan size={14} /> HVAC Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            You Got Their AC Running. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                                Capture That Gratitude Before It Fades.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Emergency customers are grateful in the moment. MoreStars catches them while they still feel it.
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
                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                     <Snowflake fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Tom H.</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">4 hours ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Our AC died at 3am in 90 degree heat. Comfort Air came out same-day and fixed it in an hour. <span className="bg-yellow-100 font-bold px-1">Absolute lifesavers!</span> Tech was professional and fast."
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
                        It's July. 97 degrees. Phone's ringing off the hook.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You dispatch a tech. Family's been sweating since 3am. Your guy fixes it in an hour. The moment that cold air kicks back on, the homeowner looks at him like a superhero.
                        </p>
                        <p className="text-lg italic text-gray-800 font-medium border-l-4 border-orange-500 pl-4 bg-orange-50 p-4 rounded-r-lg">
                            "Thank you so much. You saved us. I'm definitely leaving you a review."
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            <strong>They never do.</strong> By evening, they're comfortable again. The crisis is over. The gratitude fades.
                        </p>
                        
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                             <h4 className="font-bold text-gray-900 mb-2">The Lead Cost Trap</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 You're paying <strong>$50-150 per lead</strong> on Angi or LSA.
                             </p>
                             <p className="text-gray-700 text-sm">
                                 When those leads Google you and see a 4.1 rating with complaints about "sticker shock," they call your competitor. That expensive lead? Wasted.
                             </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Thermometer size={64} className="text-red-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Seasonal Trap</h3>
                        <p className="text-gray-600 mb-4">
                            Peak season is when you create the most happy customers. It's also when you have the least time to capture reviews.
                        </p>
                        <p className="font-bold text-gray-800">By the time things slow down, the gratitude window closed months ago.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Turn your summer rush into year-round reputation.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Snowflake />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Gratitude Automatically</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Same-day text. While they're still feeling the relief. While the AC is still humming.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for calling Comfort Air today! If we got you cool again, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Summer Rush = Reviews</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before Summer</p>
                                <p className="text-yellow-400 font-bold text-lg">60 Reviews</p>
                                <p className="text-xs text-gray-500">4.2 Stars</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After Summer</p>
                                <p className="text-green-400 font-bold text-lg">150+ Reviews</p>
                                <p className="text-xs text-gray-500">4.6 Stars</p>
                            </div>
                        </div>
                        <p className="text-gray-300">If 30% of your summer calls convert, you build momentum that lasts all winter.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Make Lead Spend Count</h3>
                        <p className="text-gray-300 leading-relaxed">
                            When leads Google you and see a 4.6 rating with 200 reviews, they convert. Your existing marketing budget instantly becomes more effective.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Bury Price Complaints</h3>
                        <p className="text-gray-300 leading-relaxed">
                             HVAC repairs are expensive. Some will complain. But one "sticker shock" review among 200 "worth every penny" reviews is noise. It's context, not catastrophe.
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
                    <p className="text-gray-600">The difference a text makes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-orange-100 p-4 border-b border-orange-200">
                            <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                <Flame size={20}/> Scenario 1: The Emergency Call
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Saturday afternoon. AC dead. Capacitor swap. $350. Customer is relieved.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They're at a barbecue by evening. The emergency is forgotten. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out that evening. <span className="font-semibold text-green-600">5 Stars.</span> "Came out on a Saturday and saved us. Fast, professional, fair price."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Fan size={20}/> Scenario 2: The Big Install
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">$12,000 system replacement. Two-day job. Customer is happy but exhausted.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">New system works great. Life goes on. They never think about Google.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text goes out end of day 2. <span className="font-semibold text-green-600">5 Stars.</span> "Professional installation from start to finish. Worth the investment."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Seasonal Reality --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-20 -mr-24 -mt-24"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -ml-24 -mb-24"></div>

                    <h2 className="text-3xl font-bold mb-8 text-white relative z-10">The Seasonal Reality</h2>
                    <div className="grid md:grid-cols-2 gap-8 relative z-10 text-left">
                        <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <Sun className="text-orange-400" />
                                <h3 className="font-bold text-xl text-white">Summer Slam</h3>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                You're running 50+ calls a week. No time for anything. Usually, you miss all these review opportunities.
                            </p>
                            <p className="text-white font-medium text-sm border-t border-white/20 pt-4">
                                With MoreStars: Every call triggers a request. You enter fall with 100+ new reviews automatically.
                            </p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <Snowflake className="text-blue-400" />
                                <h3 className="font-bold text-xl text-white">Winter Heat</h3>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">
                                Furnaces die. Customers panic. You save them. Gratitude is high when the heat comes back on.
                            </p>
                            <p className="text-white font-medium text-sm border-t border-white/20 pt-4">
                                With MoreStars: You capture that specific gratitude before the house even warms up fully.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to HVAC --- */}
        <FAQ 
            title="HVAC Contractor FAQ" 
            items={[
                {
                    question: "When should I send requests?",
                    answer: "Same day. While they're still feeling the relief of working AC (or heat). Late afternoon or evening works well—they've had time to confirm everything's working properly."
                },
                {
                    question: "What about maintenance agreements?",
                    answer: "Send requests after maintenance visits too. These customers already trust you. They're likely to leave detailed, positive reviews that boost your SEO keywords."
                },
                {
                    question: "What if a customer complains about pricing?",
                    answer: "HVAC repairs are expensive. Some customers will feel that. But most of your reviews will come from customers who understand you solved their problem professionally. Volume ensures that price complaints are a small percentage of your total."
                },
                {
                    question: "Does it integrate with ServiceTitan or Housecall Pro?",
                    answer: "We integrate with any software that can export a CSV or connect via Zapier. Many pros simply upload their customer list at the end of the day—it takes 30 seconds."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Peak Season Into Year-Round Reviews
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You're creating happy customers all summer. Right now, that gratitude evaporates. MoreStars captures it—automatically.
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

export default HVACPage;
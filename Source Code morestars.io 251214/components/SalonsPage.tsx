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
  Scissors,
  Camera,
  Sparkles,
  Clock,
  Smile
} from 'lucide-react';

const SalonsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Salons & Spas | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your salon or spa. Capture clients while they\'re still admiring their look. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Scissors size={14} /> Salon Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            They're Taking Selfies of Their New Hair. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                                Time to Ask for a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Catch clients while they're still admiring their reflection. MoreStars captures the glow before it fades.
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
                                 <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                                     <Sparkles fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Jessica M.</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">1 hour ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Obsessed with my new color! Sarah always knows exactly what I want even when I can't describe it. <span className="bg-yellow-100 font-bold px-1">Best salon experience ever.</span>"
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
                        They walk out feeling amazing. They don't think "Google review."
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your client is checking herself out in the mirror. She's taking a selfie. She feels great. An hour later? She's picking up groceries. The moment passes.
                        </p>
                        
                        <div className="bg-pink-50 p-6 rounded-xl border border-pink-100">
                             <h4 className="font-bold text-pink-800 mb-2">The Asymmetry Is Brutal</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 Hair is emotional. When they love it, they just feel beautiful. When they hate it, they feel devastated.
                             </p>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>100 clients this month</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>95 walk out feeling amazing</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>3 leave reviews</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>2 of those are complaints</li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your online presence doesn't represent your actual work. It represents the exceptions.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Camera size={64} className="text-purple-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Selfie Trap</h3>
                        <p className="text-gray-600 mb-4">
                            They post on Instagram. They tell their friends. But Instagram tags don't help new clients find you on Google Maps.
                        </p>
                        <p className="font-bold text-gray-800">That joy needs to go on Google.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Turn that "new hair feeling" into 5 stars.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Sparkles />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture the Glow</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The text arrives while they're still admiring themselves. While the emotional high is real. One tap.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for visiting Studio B today! If you love your new look, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Outnumbers Unhappy</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">80 Reviews</p>
                                <p className="text-xs text-gray-500">Built over 3 years</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 3 Months</p>
                                <p className="text-green-400 font-bold text-lg">350+ Reviews</p>
                                <p className="text-xs text-gray-500">"Best haircut ever"</p>
                            </div>
                        </div>
                        <p className="text-gray-300">If 25% of your 100 weekly clients respond, that's 25 new reviews every single week.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Smile />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Stylists Get Recognized</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Reviews mentioning stylists by name build their personal brand—and your salon's reputation. "Sarah is amazing" is worth more than any ad.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Complaints Get Context</h3>
                        <p className="text-gray-300 leading-relaxed">
                             One upset client among 300 happy ones? That's a 4.9 rating. New clients see the complaint as an exception, not the rule.
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
                    <p className="text-gray-600">The difference timing makes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-pink-100 p-4 border-b border-pink-200">
                            <h3 className="font-bold text-pink-800 flex items-center gap-2">
                                <Scissors size={20}/> Scenario 1: The Perfect Cut
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Client came in for a trim. Stylist nailed it. She's taking parking lot selfies.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She shows her husband. Posts on Instagram. Tells coworkers. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives that afternoon. <span className="font-semibold text-green-600">5 Stars.</span> "Best haircut I've ever had. Sarah is amazing!"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-100 p-4 border-b border-purple-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <Sparkles size={20}/> Scenario 2: The Color Transformation
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Client wanted balayage. Came out perfect. She's obsessed with the lighting.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Tags the salon on Instagram. But Instagram isn't where new clients search.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She taps the link. <span className="font-semibold text-green-600">5 Stars.</span> "Incredible color work. Worth every penny. Already booked my next appointment."</p>
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
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Timing Advantage</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">MORESTARS ZONE</div>
                            <div className="flex items-center gap-3 mb-4 text-green-600">
                                <Clock />
                                <h3 className="font-bold text-xl">Right After Appointment</h3>
                            </div>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500"/> Hair looks perfect (just styled)</li>
                                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500"/> Client feels beautiful</li>
                                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500"/> They're taking photos</li>
                                <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-500"/> Emotional high point</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-70">
                             <div className="flex items-center gap-3 mb-4 text-gray-500">
                                <Clock />
                                <h3 className="font-bold text-xl">Two Days Later</h3>
                            </div>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><XCircle className="w-5 h-5 text-gray-400"/> Hair has been slept on</li>
                                <li className="flex gap-2"><XCircle className="w-5 h-5 text-gray-400"/> Styled differently</li>
                                <li className="flex gap-2"><XCircle className="w-5 h-5 text-gray-400"/> They've moved on mentally</li>
                                <li className="flex gap-2"><XCircle className="w-5 h-5 text-gray-400"/> Moment is gone</li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-8 text-gray-500 text-sm max-w-2xl mx-auto">
                        MoreStars catches them in the window. Same-day text. While they're still in love with their look.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Salons --- */}
        <FAQ 
            title="Salon & Spa FAQ" 
            items={[
                {
                    question: "When should I send requests?",
                    answer: "Same day. Within a few hours. While they're still loving their look and telling people about it."
                },
                {
                    question: "What about regulars who've already left a review?",
                    answer: "Once a client has reviewed you, focus on others. Don't over-ask. You can flag clients in your system to skip."
                },
                {
                    question: "What if the client seemed unhappy but didn't say anything?",
                    answer: "If you suspect they weren't thrilled, skip the review request. Focus on the ones who clearly loved their result."
                },
                {
                    question: "Does this work for spas and med spas?",
                    answer: "Absolutely. Facials, massages, injectables—same idea. Client has a great experience, text goes out, they review while they're still feeling pampered."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Happy Clients Into 5-Star Reviews
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your clients walk out feeling beautiful. Right now, that feeling evaporates without a trace. MoreStars captures it.
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

export default SalonsPage;
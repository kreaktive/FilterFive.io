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
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  Box
} from 'lucide-react';

const MovingCompaniesPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Moving Companies | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your moving company. Stand out in an industry full of horror stories. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Truck size={14} /> Mover Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Moving Companies Have a Reputation Problem. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                Yours Doesn't Have To.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            The industry is full of horror stories. Reviews prove you're one of the good ones.
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
                                 <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                                     <Package fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">The Chen Family</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">3 hours ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Was terrified of using movers after reading horror stories online. These guys were the opposite. <span className="bg-yellow-100 font-bold px-1">Professional, careful, fair.</span> Wish I'd found them sooner."
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                4.8 <Star fill="#FFBA49" className="text-[#FFBA49]" />
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
                        You're professional. You're honest. But Google doesn't know that.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You know what people think when they hear "moving company." Scams. Hidden fees. Hostage situations. <strong className="text-gray-900">You're fighting the entire industry's reputation.</strong>
                        </p>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Happy Customer Paradox</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 You moved them across town. Not a scratch. On time. They were relieved and grateful. "Thank you so much!"
                             </p>
                             <p className="text-gray-700 text-sm font-bold">
                                 Then they unpacked, settled in, and forgot you existed. No review.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, the customer who misunderstood that packing costs extra? "Hidden fees. SCAM." The complaints find you. The praise gets lost in the unpacking.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <AlertTriangle size={64} className="text-orange-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Trust Deficit</h3>
                        <p className="text-gray-600 mb-4">
                            Even if you do everything right, customers arrive skeptical. They've read the horror stories. They're waiting for the scam.
                        </p>
                        <p className="font-bold text-gray-800">Reviews are the only way to lower their guard.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Prove you're not like the others.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Skepticism Dissolves Early</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            When someone Googles you and sees 200 reviews describing smooth, honest moves, their guard comes down. They stop expecting a scam.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for choosing Thompson Moving! If we took good care of your belongings, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Escape the Average</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Industry Avg</p>
                                <p className="text-yellow-400 font-bold text-lg">3.5 Stars</p>
                                <p className="text-xs text-gray-500">Mixed bag</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">You with MoreStars</p>
                                <p className="text-green-400 font-bold text-lg">4.7 Stars</p>
                                <p className="text-xs text-gray-500">"Honest" & "Careful"</p>
                            </div>
                        </div>
                        <p className="text-gray-300">Building a strong review presence separates you from the pack instantly.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Box />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Relief</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Moving is stressful. When it's over and nothing is broken, customers feel huge relief. MoreStars captures that exact emotion before they get distracted by unpacking.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Complaints Become Noise</h3>
                        <p className="text-gray-300 leading-relaxed">
                             One complaint about a scratch among 200 positive reviews is noise. New customers see the pattern: overwhelmingly good experiences, with occasional accidents.
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
                    <p className="text-gray-600">Every move is an opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-indigo-100 p-4 border-b border-indigo-200">
                            <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                                <Truck size={20}/> Scenario 1: The Local Move
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Family moved across town. 3-bedroom house. 5 hours. Nothing broken. Price matched quote.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They're relieved. They unpack. They never think about you again. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives that evening. <span className="font-semibold text-green-600">5 Stars.</span> "Amazing crew. Showed up on time, handled everything with care, no surprise fees."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-100 p-4 border-b border-purple-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <MapPin size={20}/> Scenario 2: The Long Distance
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Customer relocated 800 miles. Everything arrived intact. They were dreading it, but it went fine.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They start their new life. The move becomes a distant memory.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They tap the link. <span className="font-semibold text-green-600">5 Stars.</span> "Was terrified of using movers. These guys were professional and careful."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Trust Equation --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Trust Equation</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-red-600 flex items-center gap-2"><AlertTriangle/> High Stakes</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>You're touching everything they own</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>Irreplaceable items are at risk</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>They've read the horror stories</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2"></div>They're spending thousands</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm relative overflow-hidden">
                            <h3 className="font-bold text-xl mb-4 text-green-600 flex items-center gap-2"><ShieldCheck/> Reviews Answer The Fear</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"They were careful with everything"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"No hidden fees"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"Showed up when they said they would"</li>
                                <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>"Would absolutely use again"</li>
                            </ul>
                        </div>
                    </div>
                    <p className="mt-8 text-gray-500 text-sm max-w-2xl mx-auto font-medium">
                        Every review that says "they were honest" is worth more for a moving company than almost any other business. The bar is low. You just have to clear it visibly.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Movers --- */}
        <FAQ 
            title="Moving Company FAQ" 
            items={[
                {
                    question: "When should I send requests?",
                    answer: "Day of or day after the move. They've seen how you work. They know nothing was damaged. They're relieved it went well. Don't wait too long or they get lost in unpacking."
                },
                {
                    question: "What about damage claims?",
                    answer: "If there's a dispute, don't send a review request. Handle the claim first. But most moves go smoothly—focus on capturing those. Don't let the 2% of claims silence the 98% of happy moves."
                },
                {
                    question: "Should I send requests for small moves?",
                    answer: "Yes. A small apartment move still has a customer who can review you. Every review counts toward your total."
                },
                {
                    question: "What about corporate relocations?",
                    answer: "The employee being relocated can and should review you. Often these are detailed, thoughtful reviews because they appreciate the lack of stress during a big career change."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Prove You're One of the Good Ones
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  The moving industry has a reputation problem. You can't fix that. But you can prove you're different—with reviews from real customers who were scared, skeptical, and relieved when you proved them wrong.
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

export default MovingCompaniesPage;
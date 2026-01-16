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
  Zap,
  Lightbulb,
  Eye,
  EyeOff,
  AlertTriangle,
  Plug
} from 'lucide-react';

const ElectriciansPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Electricians | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your electrical business. Build trust with homeowners who can\'t see the work. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Zap size={14} /> Electrician Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            You Made Their Home Safe. <br/>
                            They Can't See It. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                                Reviews Prove It.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Electrical work is invisible until something goes wrong. Reviews show you did it right.
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
                                 <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
                                     <Lightbulb fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">The Robinson Family</div>
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
                                "Completely upgraded our electrical system. Explained everything, showed us what was wrong, made our house safe. <span className="bg-yellow-100 font-bold px-1">Worth every penny.</span>"
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
                        They have no idea what you actually did.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You just spent four hours rewiring a panel. You fixed a fire hazard. The homeowner looks at the panel, nods, and writes a check. <strong className="text-gray-900">They can't appreciate what they can't see.</strong>
                        </p>
                        
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                             <h4 className="font-bold text-yellow-800 mb-2">The "Quick Fix" Trap</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 "$200 to install an outlet? That was twenty minutes of work!"
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 They don't see the license, the insurance, the truck, the tools, or the 4 years of apprenticeship. They see 20 minutes and feel robbed.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            When they Google "electrician near me," they're nervous. They've heard stories about house fires and shoddy work. They can't evaluate your work themselves, so they rely entirely on reviews.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <EyeOff size={64} className="text-gray-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Invisible Value</h3>
                        <p className="text-gray-600 mb-4">
                            When a plumber fixes a leak, the water stops. When you upgrade a panel, the house just... works.
                        </p>
                        <p className="font-bold text-gray-800">Same as before, except now it won't burn down.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Make your expertise tangible.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Eye />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Make Invisible Work Visible</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Reviews describe what you did. "Upgraded our panel," "Fixed an issue others couldn't find," "Made us feel safe." Words make your work real to new customers.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for calling Certified Electric! If we solved your electrical issue, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Build Trust Before the Estimate</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">45 Reviews</p>
                                <p className="text-xs text-gray-500">Skeptical customers</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">180+ Reviews</p>
                                <p className="text-xs text-gray-500">Call ready to hire</p>
                            </div>
                        </div>
                        <p className="text-gray-300">200 reviews saying "honest" and "professional" answers the fear of getting scammed.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Pricing Complaints Get Buried</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Some people don't understand the cost of safety. But when 95% of your reviews say "fair price" and "worth it," the occasional "too expensive" complaint looks like an outlier.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Star />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Compete on Reputation</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Unlicensed handymen undercut you on price. You can't compete on that. But you can crush them on trust. Your 200 reviews vs. their 12 proves you're the pro.
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
                    <p className="text-gray-600">Different jobs, same opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-yellow-100 p-4 border-b border-yellow-200">
                            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                                <Plug size={20}/> Scenario 1: The Outlet Install
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">New outlet in garage. 30 minutes. Charged $175.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They thought it was a lot for "such a quick job." <span className="font-semibold text-red-500">No review (or a complaint).</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get a text. <span className="font-semibold text-green-600">5 Stars.</span> "Quick, professional, cleaned up after themselves. Fair price for licensed work."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-100 p-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Zap size={20}/> Scenario 2: The Panel Upgrade
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Old house. Full day upgrading panel and fixing hazards. $2,400.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They wrote a check. They don't really understand what you did. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They reflect on the safety. <span className="font-semibold text-green-600">5 Stars.</span> "Explained everything, showed us what was wrong, made our house safe."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Invisible Work Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl opacity-10 -mr-24 -mt-24"></div>
                    
                    <h2 className="text-3xl font-bold mb-8 relative z-10">The Invisible Work Problem</h2>
                    
                    <div className="bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm relative z-10 max-w-3xl mx-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/20 bg-black/20">
                                    <th className="p-4 font-bold text-yellow-400 w-1/2">What You Did</th>
                                    <th className="p-4 font-bold text-gray-400 w-1/2">What They See</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-white/10">
                                    <td className="p-4">Rewired entire panel to code</td>
                                    <td className="p-4 text-gray-300">Same house, lights still work</td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="p-4">Fixed a major fire hazard</td>
                                    <td className="p-4 text-gray-300">Nothing looks different</td>
                                </tr>
                                <tr className="border-b border-white/10">
                                    <td className="p-4">Used quality copper & materials</td>
                                    <td className="p-4 text-gray-300">They can't see inside walls</td>
                                </tr>
                                <tr>
                                    <td className="p-4">Ensured long-term safety</td>
                                    <td className="p-4 text-gray-300">"It took 4 hours"</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <p className="mt-8 text-gray-300 max-w-2xl mx-auto relative z-10">
                        Reviews bridge this gap. When customers describe what you did and how you explained it, future customers can "see" your work through their words.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Electricians --- */}
        <FAQ 
            title="Electrician FAQ" 
            items={[
                {
                    question: "When should I send requests?",
                    answer: "Same day or next morning. While they're still relieved the problem is solved and the house didn't catch fire. Don't wait too long or they forget the urgency."
                },
                {
                    question: "What about commercial electricians?",
                    answer: "Same principle. Commercial clients leave detailed, thoughtful reviews. Facility managers and business owners understand the value of professional work and rely heavily on reputation."
                },
                {
                    question: "Should I send requests after small jobs?",
                    answer: "Yes. An outlet install is still a customer who can review you. Every review counts toward your total and helps bury any negatives."
                },
                {
                    question: "What if a customer disputes the price?",
                    answer: "If there's a disagreement, handle it first. Don't send a review request during a dispute. But most jobs go smoothly—focus on capturing the 95% that are happy."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Make Your Invisible Work Visible
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You know you do quality work. Your customers know it while you're there. Now help them tell the people who don't know you yet—so when they need an electrician, they call someone they already trust.
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

export default ElectriciansPage;
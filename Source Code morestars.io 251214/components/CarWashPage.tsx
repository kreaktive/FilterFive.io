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
  Car,
  Droplet,
  QrCode,
  AlertTriangle,
  Users,
  Zap
} from 'lucide-react';

const CarWashPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Car Washes | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your car wash. Turn high volume into high reviews. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-cyan-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Droplet size={14} /> Car Wash Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            500 Cars This Week. <br/>
                            2 Reviews. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
                                Let's Fix That.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            High volume means high opportunity. MoreStars helps you capture it.
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
                                 <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xl">
                                     <Car fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Express Wash Customer</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">10 mins ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Fast and my car always looks great. Been coming here for months. <span className="bg-yellow-100 font-bold px-1">Best wash in town!</span>"
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
                        Your reviews don't reflect your volume.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You wash hundreds of cars every week. A customer drives through, car comes out clean, they drive away. They don't think "I should leave a review." They think about where they're headed next. <strong className="text-gray-900">The car wash is invisible.</strong>
                        </p>
                        
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                             <h4 className="font-bold text-red-800 mb-2">The Brutal Ratio</h4>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>500 cars this week.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>495 drove away happy.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>3 reviews posted.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>2 are damage claims or cancellations.</li>
                             </ul>
                             <p className="font-bold text-red-800 mt-4">Result: Your Google page tells a story that doesn't match your parking lot.</p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Damage claims ("They scratched my car!") and membership cancellations ("Scam company!") dominate because anger creates urgency. Satisfaction doesn't.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <AlertTriangle size={64} className="text-orange-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Invisible Majority</h3>
                        <p className="text-gray-600 mb-4">
                            You have thousands of happy customers. But online, you look like a business that scratches cars and steals money.
                        </p>
                        <p className="font-bold text-gray-800">You need the silent majority to speak up.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Your high volume becomes a high advantage.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <QrCode />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Turn Traffic Into Reviews</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Customer grabs their car, sees a QR code, scans, leaves a review. Monthly members get a text. They already love your wash—they'll say so.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            If 5% of 500 cars scan and review, that's 100+ reviews per month.
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Damage Claims Get Buried</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">90 Reviews</p>
                                <p className="text-xs text-gray-500">22% Damage Claims</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">600+ Reviews</p>
                                <p className="text-xs text-gray-500">3% Damage Claims</p>
                            </div>
                        </div>
                        <p className="text-gray-300">You can't prevent claims. But you can bury them with hundreds of "great wash" reviews.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Users />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Membership Complaints Lose Power</h3>
                        <p className="text-gray-300 leading-relaxed">
                            "They won't let me cancel" looks bad. But when you have 500 reviews from active members saying "best value ever," the complaints look like what they are: people who didn't read the terms.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Unbeatable Volume</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Most businesses see 50 customers a week. You see 500+. That's 500+ opportunities. With MoreStars, you build a review presence your competitors can't touch.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- How It Works --- */}
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>How It Works</h2>
                    <p className="text-gray-600">Two strategies for maximum coverage.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                        <div className="bg-cyan-100 w-12 h-12 rounded-full flex items-center justify-center text-cyan-600 mb-6 font-bold"><QrCode /></div>
                        <h3 className="font-bold text-xl mb-4">QR Codes (For Everyone)</h3>
                        <p className="text-gray-600 mb-4 text-sm">Post it at pickup, vacuum stations, or exit. Customers scan while they wait or as they leave.</p>
                        <div className="space-y-2 text-sm font-medium text-gray-800">
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Pickup area (full service)</div>
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Exit lane (express)</div>
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Vacuum stations</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-6 font-bold"><MessageSquare /></div>
                        <h3 className="font-bold text-xl mb-4">SMS for Members (Best Reviewers)</h3>
                        <p className="text-gray-600 mb-4 text-sm">Monthly members are your most loyal customers. Export your list, upload to MoreStars, and send a text.</p>
                        <div className="space-y-2 text-sm font-medium text-gray-800">
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> After their first month</div>
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> After 3 months (proven loyalty)</div>
                            <div className="flex gap-2"><CheckCircle size={16} className="text-green-500" /> Higher conversion rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Volume Advantage --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8 text-center bg-cyan-600 text-white">
                        <h2 className="text-3xl font-bold mb-2">The Volume Advantage</h2>
                        <p className="opacity-90">Even a modest scan rate turns into massive numbers.</p>
                    </div>
                    <div className="p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-sm uppercase text-gray-500">
                                        <th className="pb-4 font-bold">Your Volume</th>
                                        <th className="pb-4 font-bold">Scan Rate (Est.)</th>
                                        <th className="pb-4 font-bold">Reviews/Week</th>
                                        <th className="pb-4 font-bold text-green-600">Reviews/Year</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4 font-medium">300 cars/week</td>
                                        <td className="py-4">3%</td>
                                        <td className="py-4">9</td>
                                        <td className="py-4 font-bold text-green-600">450+</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-4 font-medium">500 cars/week</td>
                                        <td className="py-4">3%</td>
                                        <td className="py-4">15</td>
                                        <td className="py-4 font-bold text-green-600">750+</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 font-medium">1,000 cars/week</td>
                                        <td className="py-4">3%</td>
                                        <td className="py-4">30</td>
                                        <td className="py-4 font-bold text-green-600">1,500+</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-6 text-center text-sm text-gray-500">
                            Your competitor washing 200 cars a week can't match this. Volume is your advantage—if you capture it.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Car Wash --- */}
        <FAQ 
            title="Car Wash FAQ" 
            items={[
                {
                    question: "Where should I put QR codes?",
                    answer: "Anywhere customers pause. Pickup area. Exit lane. Vacuum stations. The key is visibility at a moment when they have a few seconds."
                },
                {
                    question: "How big should QR codes be?",
                    answer: "Big enough to scan from 3+ feet. 6\"x6\" minimum if they are scanning from inside their car. Bigger is usually better for visibility."
                },
                {
                    question: "What about membership cancellations?",
                    answer: "Some cancelled members will leave angry reviews. That's unavoidable. But active members leaving positive reviews drowns out the noise. Focus on capturing the happy majority."
                },
                {
                    question: "Does this work for express washes?",
                    answer: "Yes. QR codes at the exit or on receipts work well. Since customers stay in their car, make sure signage is large and easy to scan from the driver's seat."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Your Traffic Into Reviews
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You wash more cars in a week than most businesses see in a month. That's 500+ chances to build your online presence. Don't let them drive away without a trace.
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
                 14-day free trial. Unlimited QR codes. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default CarWashPage;
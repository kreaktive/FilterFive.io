import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Comparison from './Comparison';
import { COLORS } from '../constants';
import { Check, AlertCircle, ShieldCheck, Lock, XCircle, Calculator, CheckCircle, User, Link as LinkIcon, Send, Star, MousePointer2, ArrowRight } from 'lucide-react';

function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    document.title = "Pricing | One New Customer Pays For It | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Simple pricing. $77/month. No contracts. If MoreStars brings you one new customer, it pays for itself. Start your 14-day free trial.');
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#F9F7FA', color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section: The Value Proposition --- */}
        <div className="pt-24 pb-16 text-center bg-[#F9F7FA]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-xs font-bold tracking-wide uppercase mb-6 border border-green-200">
                14-Day Free Trial • No Credit Card
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
              One New Customer <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBA49] to-orange-500">Pays For The Whole Year.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              If MoreStars gets you just <strong>one</strong> extra customer per month, the software is free. Everything else is pure profit.
            </p>
          </div>
        </div>

        {/* --- Pricing Switcher & Card --- */}
        <section className="pb-24 px-4 -mt-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Toggle */}
                <div className="flex justify-center mb-12 relative z-10">
                    <div className="bg-white p-1 rounded-full shadow-md border border-gray-200 inline-flex relative">
                        <button 
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 ${!isAnnual ? 'bg-[#23001E] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Monthly (No Contract)
                        </button>
                        <button 
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${isAnnual ? 'bg-[#23001E] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Yearly <span className="bg-[#FFBA49] text-[#23001E] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save 17%</span>
                        </button>
                    </div>
                </div>

                {/* The Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-4xl mx-auto flex flex-col md:flex-row relative z-20">
                    {/* Best Value Badge for Annual */}
                    {isAnnual && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl z-20 shadow-sm">
                            2 MONTHS FREE
                        </div>
                    )}

                    {/* Left Side: The Offer */}
                    <div className="p-8 md:p-12 md:w-3/5 border-b md:border-b-0 md:border-r border-gray-100">
                        <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.dark }}>The Growth Plan</h3>
                        <p className="text-gray-500 mb-8">Everything you need to dominate your local market.</p>
                        
                        <div className="space-y-5">
                            <li className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                                <div>
                                    <span className="font-bold text-gray-800">1,000 SMS Requests / mo</span>
                                    <p className="text-xs text-gray-500">Reach customers directly on their phone.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                                <div>
                                    <span className="font-bold text-gray-800">Unlimited QR Codes</span>
                                    <p className="text-xs text-gray-500">For receipts, front desk, or vehicles.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                                <div>
                                    <span className="font-bold text-gray-800">Review Monitoring</span>
                                    <p className="text-xs text-gray-500">Track your growth in one dashboard.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                                <div>
                                    <span className="font-bold text-gray-800">POS Integrations</span>
                                    <p className="text-xs text-gray-500">Square, Shopify, and Zapier included.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={14} strokeWidth={3} /></div>
                                <div>
                                    <span className="font-bold text-gray-800">Multi-Location Ready</span>
                                    <p className="text-xs text-gray-500">Manage all your spots from one login.</p>
                                </div>
                            </li>
                        </div>
                    </div>

                    {/* Right Side: The Price & CTA */}
                    <div className="p-8 md:p-12 md:w-2/5 bg-gray-50 flex flex-col justify-center items-center text-center relative">
                        <div className="mb-2">
                            <span className="text-6xl font-extrabold tracking-tight" style={{ color: COLORS.dark }}>
                                ${isAnnual ? Math.round(770/12) : 77}
                            </span>
                            <span className="text-gray-500 font-medium text-xl">/mo</span>
                        </div>
                        
                        {isAnnual ? (
                            <div className="mb-8">
                                <p className="text-sm text-gray-500">Billed $770 yearly</p>
                                <p className="text-sm text-green-600 font-bold bg-green-100 px-2 py-1 rounded-md mt-2 inline-block">You save $154/year</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mb-8 font-medium">Cancel anytime. No fees.</p>
                        )}

                        <button className="w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-4 bg-[#FFBA49] text-[#23001E]">
                            Start 14-Day Free Trial
                        </button>
                        
                        <div className="flex flex-col gap-3 text-xs text-gray-500 font-medium w-full">
                            <div className="flex items-center justify-center gap-2">
                                <Lock size={12}/> No credit card required
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center gap-2 text-[10px] text-gray-400">
                                <MousePointer2 size={12} className="text-gray-400"/> Cancel in 2 clicks. No phone calls.
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Timeline Section --- */}
                <div className="mt-24">
                    <h3 className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-12">What Happens After You Start</h3>
                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-14 h-14 bg-white border-4 border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <User size={24} />
                                </div>
                                <div className="bg-white px-3 relative">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide block mb-1">Minute 1</span>
                                    <h4 className="font-bold text-gray-900">Create Account</h4>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-14 h-14 bg-white border-4 border-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <LinkIcon size={24} />
                                </div>
                                <div className="bg-white px-3 relative">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wide block mb-1">Minute 3</span>
                                    <h4 className="font-bold text-gray-900">Paste Google Link</h4>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-14 h-14 bg-white border-4 border-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Send size={24} />
                                </div>
                                <div className="bg-white px-3 relative">
                                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wide block mb-1">Minute 5</span>
                                    <h4 className="font-bold text-gray-900">Send First Text</h4>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center group">
                                <div className="w-14 h-14 bg-white border-4 border-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Star size={24} />
                                </div>
                                <div className="bg-white px-3 relative">
                                    <span className="text-xs font-bold text-green-600 uppercase tracking-wide block mb-1">Minute 10</span>
                                    <h4 className="font-bold text-gray-900">Get First Review</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Micro-Social Proof */}
                <div className="mt-16 text-center border-t border-gray-100 pt-8">
                    <p className="text-sm text-gray-500">
                        Join 2,000+ local businesses getting more stars every day.
                    </p>
                </div>
            </div>
        </section>

        {/* --- The "Freedom Guarantee" --- */}
        <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-[#23001E] rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    
                    <div className="flex-shrink-0 bg-white/10 p-6 rounded-full">
                        <Lock size={48} className="text-[#FFBA49]" />
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">The Freedom Guarantee</h2>
                        <p className="text-gray-300 text-lg leading-relaxed mb-6">
                            We hate 12-month contracts as much as you do. With MoreStars, you are <strong>never</strong> locked in.
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-200">
                            <li className="flex items-center gap-2 justify-center md:justify-start"><Check size={16} className="text-[#FFBA49]"/> Cancel with one click</li>
                            <li className="flex items-center gap-2 justify-center md:justify-start"><Check size={16} className="text-[#FFBA49]"/> Export your data anytime</li>
                            <li className="flex items-center gap-2 justify-center md:justify-start"><Check size={16} className="text-[#FFBA49]"/> No "30-day notice" required</li>
                            <li className="flex items-center gap-2 justify-center md:justify-start"><Check size={16} className="text-[#FFBA49]"/> We earn your business monthly</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* --- ROI Visualizer --- */}
        <section className="py-24 bg-gray-50">
           <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-extrabold mb-12 text-center" style={{ color: COLORS.dark }}>The Math That Matters</h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                 {/* Visual Equation */}
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex flex-col items-center justify-center space-y-6">
                        {/* Cost */}
                        <div className="text-center">
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-2">Cost of MoreStars</p>
                            <div className="text-4xl font-bold text-red-500">$77<span className="text-lg text-gray-400">/mo</span></div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-100 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-white px-3 text-sm font-bold text-gray-400">VS</span>
                            </div>
                        </div>

                        {/* Value */}
                        <div className="text-center w-full">
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-4">Value of 1 New Customer</p>
                            
                            <div className="grid grid-cols-3 gap-2 text-sm w-full">
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="font-bold text-gray-800">$400</div>
                                    <div className="text-xs text-gray-500">Auto Repair</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="font-bold text-gray-800">$1,200</div>
                                    <div className="text-xs text-gray-500">Dental</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <div className="font-bold text-gray-800">$5,000+</div>
                                    <div className="text-xs text-gray-500">Real Estate</div>
                                </div>
                            </div>
                        </div>

                        {/* Result */}
                        <div className="bg-green-50 w-full p-4 rounded-xl border border-green-100 text-center">
                            <p className="text-green-800 font-bold flex items-center justify-center gap-2">
                                <Calculator size={18} />
                                One customer pays for the whole year.
                            </p>
                        </div>
                    </div>
                 </div>

                 {/* Explanation */}
                 <div>
                    <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>Why Enterprise Tools are a Rip-off</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="mt-1"><XCircle className="text-red-400"/></div>
                            <div>
                                <h4 className="font-bold text-gray-800">Competitors charge $350-$500/mo</h4>
                                <p className="text-gray-600 text-sm">They load their software with "AI sentiment analysis" and "social listening" features you will literally never use.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><XCircle className="text-red-400"/></div>
                            <div>
                                <h4 className="font-bold text-gray-800">They lock you in</h4>
                                <p className="text-gray-600 text-sm">12-month contracts are standard. Even if it doesn't work, you keep paying.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><CheckCircle className="text-green-500"/></div>
                            <div>
                                <h4 className="font-bold text-gray-800">We do one thing</h4>
                                <p className="text-gray-600 text-sm">We help you ask for reviews. We charge a fair price for a simple tool. That's it.</p>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- Comparison Section --- */}
        <Comparison />

        {/* --- Transparency & SMS Limits --- */}
        <section className="py-24" style={{ backgroundColor: '#fafafa' }}>
           <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16">
              
              {/* Not Included */}
              <div>
                 <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>Transparency Check</h2>
                 <p className="text-gray-600 mb-6">We don't hide fees. Here's exactly what you get:</p>
                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                       <thead className="bg-gray-50 border-b">
                          <tr>
                             <th className="p-3 text-left">Item</th>
                             <th className="p-3 text-left">Cost</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          <tr>
                             <td className="p-3 font-medium">Account Setup</td>
                             <td className="p-3 text-green-600 font-bold">$0</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-medium">Onboarding Call</td>
                             <td className="p-3 text-green-600 font-bold">$0</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-medium">Cancellation Fee</td>
                             <td className="p-3 text-green-600 font-bold">$0</td>
                          </tr>
                          <tr>
                             <td className="p-3 font-medium">Extra SMS (over 1,000)</td>
                             <td className="p-3 text-gray-600">$17 / 1,000</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* SMS Limits */}
              <div>
                 <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>What about the 1,000 SMS limit?</h2>
                 <div className="space-y-6">
                    <p className="text-gray-600">Most small businesses never hit this. 1,000 requests is about 33 customers <strong>per day</strong>, every day.</p>
                    
                    <div className="flex gap-4 items-start">
                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
                          <Check className="text-green-600" size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-800">No Overage Charges</h4>
                          <p className="text-sm text-gray-600 mt-1">We never automatically charge you more. If you hit the limit, sending pauses.</p>
                       </div>
                    </div>

                    <div className="flex gap-4 items-start">
                       <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                          <AlertCircle className="text-blue-600" size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-800">We Warn You</h4>
                          <p className="text-sm text-gray-600 mt-1">You get an alert at 80% usage (800 messages) so you aren't surprised.</p>
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </section>

        {/* --- Mini FAQ --- */}
        <section className="py-24 bg-white">
           <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-extrabold mb-12 text-center" style={{ color: COLORS.dark }}>
                 Frequently Asked Questions
              </h2>
              <div className="space-y-10">
                 <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">What if I sign up and it doesn't work?</h4>
                    <p className="text-gray-600 leading-relaxed">
                       You cancel. There are no contracts, no "30-day notice" periods, and no retention calls. You can cancel with one click from your dashboard. We earn your business every month.
                    </p>
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Is this just another tool I have to manage?</h4>
                    <p className="text-gray-600 leading-relaxed">
                       No. The goal is automation. Connect your POS or print your QR code once, and it runs in the background. You don't need to log in daily to get results.
                    </p>
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">Will asking for reviews annoy my customers?</h4>
                    <p className="text-gray-600 leading-relaxed">
                       No. We have built-in safeguards. We never message the same customer more than once every 30 days, even if they visit you multiple times. It's polite, spaced out, and effective.
                    </p>
                 </div>
              </div>
              
              <div className="mt-12 text-center">
                 <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-5 py-2.5 rounded-full border border-gray-200 hover:border-blue-200">
                    Read full FAQ <ArrowRight size={14} />
                 </Link>
              </div>
           </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 bg-[#F9F7FA]">
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                 Ready to get more stars?
              </h2>
              <button
                className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 bg-[#23001E] text-white"
              >
                 Start 14-Day Free Trial
              </button>
              <p className="mt-4 text-sm text-gray-500">No credit card required.</p>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default PricingPage;
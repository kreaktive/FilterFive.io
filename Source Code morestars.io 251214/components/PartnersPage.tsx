import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FAQ from './FAQ';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  DollarSign, 
  Briefcase, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Headphones,
  FileText,
  Users
} from 'lucide-react';

const PartnersPage: React.FC = () => {
  useEffect(() => {
    document.title = "MoreStars for Agencies | Add Review Management to Your Services";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Marketing agencies: offer review management to clients at your own price. You pay $45-60/client. Charge whatever you want. We handle support.');
    }
    window.scrollTo(0, 0);
  }, []);

  const scrollToForm = () => {
    const form = document.getElementById('partner-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-20 bg-gray-50 border-b border-gray-200">
           <div className="max-w-5xl mx-auto px-4 text-center">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide mb-6">
                    <Briefcase size={14} /> For Agencies & Consultants
               </div>
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                   Add Review Management to <br/> Every Client Retainer
               </h1>
               <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                   You pay <strong>$45-60 per client</strong>. Charge them whatever you want. <br className="hidden md:block"/>
                   We handle the tech. They get results. You keep the margin.
               </p>
               <button 
                 onClick={scrollToForm}
                 className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E] mx-auto"
               >
                  Apply for Partner Pricing <ArrowRight />
               </button>
           </div>
        </section>

        {/* --- The Pitch --- */}
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                        Your Clients Need More Reviews. <br/> You Can Sell Them the Solution.
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Every SMB client you manage has the same problem: not enough Google reviews. They ask you about it. You know it matters for their SEO. But until now, the options were:
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg mb-2">Enterprise Tools</h3>
                        <p className="text-sm text-gray-600">$300-500/month. Hard to justify to a small business budget.</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg mb-2">DIY Solutions</h3>
                        <p className="text-sm text-gray-600">They forget to send links. It doesn't get done. They blame you.</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg mb-2">Manual Work</h3>
                        <p className="text-sm text-gray-600">You doing it manually? That's time you don't have.</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-2xl text-center border border-blue-100">
                    <p className="text-xl font-medium text-blue-900">
                        MoreStars lets you add review management to your service packages. Your clients get a tool that actually works. You get a new revenue stream that doesn't eat your time.
                    </p>
                </div>
            </div>
        </section>

        {/* --- The Math --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-5xl mx-auto px-4 text-white">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Your Cost vs. What You Charge</h2>
                    <p className="text-xl text-gray-300">You set the price. We just provide the engine.</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/10">
                            <tr>
                                <th className="p-6 font-bold text-lg">Your Volume</th>
                                <th className="p-6 font-bold text-lg text-gray-300">Your Cost</th>
                                <th className="p-6 font-bold text-lg text-[#FFBA49]">You Charge</th>
                                <th className="p-6 font-bold text-lg text-green-400">Your Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 bg-white/5">
                            <tr>
                                <td className="p-6 font-bold">10 clients</td>
                                <td className="p-6 text-gray-300">$50 / client</td>
                                <td className="p-6 font-bold text-[#FFBA49]">$150 / client</td>
                                <td className="p-6 font-bold text-green-400 text-xl">$1,000 / month</td>
                            </tr>
                            <tr>
                                <td className="p-6 font-bold">20 clients</td>
                                <td className="p-6 text-gray-300">$45 / client</td>
                                <td className="p-6 font-bold text-[#FFBA49]">$150 / client</td>
                                <td className="p-6 font-bold text-green-400 text-xl">$2,100 / month</td>
                            </tr>
                            <tr>
                                <td className="p-6 font-bold">30 clients</td>
                                <td className="p-6 text-gray-300">$45 / client</td>
                                <td className="p-6 font-bold text-[#FFBA49]">$150 / client</td>
                                <td className="p-6 font-bold text-green-400 text-xl">$3,150 / month</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <p className="mt-8 text-center text-gray-400 text-sm">
                    * Scenario assumes you charge $150/month. You can charge whatever you want. Bundle it, sell it standalone, it's up to you.
                </p>
            </div>
        </section>

        {/* --- Why This Works for Agencies --- */}
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>
                        Why This Works for Agencies
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">You're Not Adding Work</h3>
                            <p className="text-gray-600 leading-relaxed">
                                MoreStars takes 5 minutes to set up per client. Upload their customer list or generate a QR code. Done. The tool runs itself. You're not managing another platform—you're collecting another check.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Clients See Results</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Reviews show up on Google. Rating goes up. They can see it working. That's the kind of deliverable that keeps clients on retainer.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            <Headphones size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">We Handle Technical Support</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Client locked out? SMS not sending? They contact us, not you. You stay focused on strategy. We deal with the tickets.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">No Contracts on Your End</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Add clients when you want. Remove them when they churn. Your billing adjusts monthly. No minimums. No commitments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Partner Pricing --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-12" style={{ color: COLORS.dark }}>
                    The More Clients, the Better Your Cost
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="p-6 font-bold text-gray-600">Active Clients</th>
                                <th className="p-6 font-bold text-gray-900">Your Cost (per client/month)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="p-6 font-medium text-gray-600">1 - 9</td>
                                <td className="p-6 font-bold text-lg text-gray-900">$60</td>
                            </tr>
                            <tr>
                                <td className="p-6 font-medium text-gray-600">10 - 20</td>
                                <td className="p-6 font-bold text-lg text-gray-900">$50</td>
                            </tr>
                            <tr>
                                <td className="p-6 font-medium text-gray-600">21 - 50</td>
                                <td className="p-6 font-bold text-lg text-gray-900">$45</td>
                            </tr>
                            <tr>
                                <td className="p-6 font-medium text-gray-600">51+</td>
                                <td className="p-6 font-bold text-lg text-blue-600">Let's talk</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    <strong>Retail price is $77/month.</strong> But as a partner, you're not limited to retail margins. Charge your clients $100, $150, $200—whatever fits your positioning.
                </p>
            </div>
        </section>

        {/* --- What You Get --- */}
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: COLORS.dark }}>What You Get</h2>
                </div>
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-600"><Users /></div>
                        <h3 className="font-bold text-lg mb-2">Partner Account</h3>
                        <p className="text-sm text-gray-600">Single login to manage all client accounts. See analytics for everyone in one place.</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-purple-600"><Headphones /></div>
                        <h3 className="font-bold text-lg mb-2">Priority Support</h3>
                        <p className="text-sm text-gray-600">Dedicated support channel for partners. Faster response times.</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-orange-600"><FileText /></div>
                        <h3 className="font-bold text-lg mb-2">Sales Resources</h3>
                        <p className="text-sm text-gray-600">Pitch deck and talking points for selling review management to clients.</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-green-600"><CheckCircle /></div>
                        <h3 className="font-bold text-lg mb-2">Onboarding Help</h3>
                        <p className="text-sm text-gray-600">First few clients, we'll walk you through setup personally.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- How It Works --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-12" style={{ color: COLORS.dark }}>How to Get Started</h2>
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">1</div>
                            <h3 className="font-bold text-lg mb-2">Apply</h3>
                            <p className="text-gray-600 text-sm">Fill out the form below. Tell us about your agency.</p>
                        </div>
                        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">2</div>
                            <h3 className="font-bold text-lg mb-2">Quick Call</h3>
                            <p className="text-gray-600 text-sm">15-min call to confirm fit and set up your partner account.</p>
                        </div>
                        <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">3</div>
                            <h3 className="font-bold text-lg mb-2">Add Clients</h3>
                            <p className="text-gray-600 text-sm">We'll help with setup. You start billing them at your price.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Partner FAQ --- */}
        <FAQ 
            title="Partner FAQ" 
            description="Questions specific to the agency program."
            items={[
                {
                    question: "How do I bill my clients?",
                    answer: "You bill them directly at whatever price you set. We bill you monthly for active client accounts at your partner rate."
                },
                {
                    question: "Can I add this to existing retainers?",
                    answer: "Yes. Most partners bundle it into their SEO or marketing retainers as 'reputation management.' Clients see it as added value."
                },
                {
                    question: "What if a client cancels?",
                    answer: "Remove them from your partner account. Your billing adjusts next month. No penalties."
                },
                {
                    question: "Do my clients know about MoreStars?",
                    answer: "The product has MoreStars branding. You can position it as 'we use MoreStars for reputation management' or 'powered by MoreStars.' White-label is on our roadmap but not available yet."
                },
                {
                    question: "What if I just want to refer clients, not manage them?",
                    answer: "We have a referral program: 20% recurring commission on any client you send directly to us. But if you want the bigger margins, partner pricing is the better deal."
                },
                {
                    question: "Is there a minimum number of clients?",
                    answer: "No minimum to start. But partner pricing is designed for agencies with 10+ clients. If you have fewer, the standard referral program might be a better fit."
                },
                {
                    question: "What kind of results should I promise clients?",
                    answer: "Don't promise specific review counts. Do promise a system that makes collecting reviews easy and consistent. Most clients using MoreStars actively see 20-30+ new reviews per month."
                }
            ]}
        />

        {/* --- Form Section --- */}
        <section id="partner-form" className="py-24 bg-white">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Let's Talk Numbers</h2>
                    <p className="text-gray-600">Fill out the form. We'll schedule a 15-minute call to discuss partner pricing and get you set up.</p>
                </div>

                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Agency Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Acme Marketing" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="john@agency.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="(555) 123-4567" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                            <input type="url" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="https://agency.com" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">How many clients would you onboard in the first 90 days?</label>
                            <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">
                                <option>1-5 clients</option>
                                <option>5-10 clients</option>
                                <option>10-25 clients</option>
                                <option>25+ clients</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Anything else we should know? (Optional)</label>
                            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-32" placeholder="Tell us about your agency..."></textarea>
                        </div>

                        <button className="w-full py-4 rounded-xl text-xl font-bold shadow-lg transition-transform hover:scale-[1.01] bg-[#23001E] text-white hover:text-[#23001E] hover:bg-white border-2 border-[#23001E]">
                            Apply for Partner Pricing
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            Questions first? Email <a href="mailto:partners@morestars.io" className="text-blue-600 font-bold hover:underline">partners@morestars.io</a>
                        </p>
                    </div>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default PartnersPage;
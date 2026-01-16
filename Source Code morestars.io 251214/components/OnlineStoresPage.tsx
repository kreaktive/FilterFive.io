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
  ShoppingBag,
  Package,
  Truck,
  Globe,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';

const OnlineStoresPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for E-commerce & Shopify Stores | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your online store. Syncs with Shopify. Automated requests after every order. $77/month. Start free.');
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
                            <ShoppingBag size={14} /> E-commerce Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            1,000 Orders. <br/>
                            12 Reviews. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                Your Store Deserves Better.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Automatically request reviews after every order. Syncs natively with Shopify.
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
                                     <Package fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Verified Buyer</div>
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
                                "Great quality, fast shipping, fits perfectly. <span className="bg-yellow-100 font-bold px-1">Already ordered another color.</span> Customer service was super responsive too."
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
                        High volume, low engagement. The e-commerce paradox.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You shipped 1,000 orders last month. Most customers were happy. They got their product, used it, and moved on. <strong>Only 12 left reviews.</strong>
                        </p>
                        
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                             <h4 className="font-bold text-purple-800 mb-2">The 1.2% Review Rate</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 That's a typical manual review rate. And half of those 12 were complaints about shipping delays.
                             </p>
                             <p className="text-red-600 text-sm font-bold">
                                 Your actual customer satisfaction is 95%. Your reviews make it look like 50%.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Happy customers treat the transaction as complete. Unhappy customers feel wronged and have motivation to write paragraphs. The math destroys small stores.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <BarChart3 size={64} className="text-purple-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Comparison Killer</h3>
                        <p className="text-gray-600 mb-4">
                            If your competitor has 500 reviews and you have 50, they look safer. Customers choose safety every time.
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
                    <p className="text-xl text-gray-300">Automate your reputation growth.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Zap />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Reviews Become Automatic</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Connect Shopify (or any store). After fulfillment, customers get a text. No manual work. Every order. Automatic.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Hi Sarah! Thanks for your order from [Store]. If you're happy with your purchase, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Review Rate Multiplies</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">12 Reviews</p>
                                <p className="text-xs text-gray-500">1.2% Rate</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After MoreStars</p>
                                <p className="text-green-400 font-bold text-lg">200+ Reviews</p>
                                <p className="text-xs text-gray-500">20% Rate</p>
                            </div>
                        </div>
                        <p className="text-gray-300">Same customers. Same products. 15x the reviews.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Build Trust at Scale</h3>
                        <p className="text-gray-300 leading-relaxed">
                            New customers see volume. 500 reviews tells a different story than 50. "Lots of people buy here. Lots are happy. This seems safe."
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Happy Drowns Out Unhappy</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Reach the silent majority—the 95% who were happy. When they show up, they drown out the shipping complaints.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Math & Integration Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>The E-commerce Math</h2>
                    <p className="text-gray-600">The numbers work in your favor when you actually ask.</p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200 overflow-hidden mb-16">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 text-sm uppercase text-gray-500">
                                    <th className="pb-4 font-bold p-2">Your Volume</th>
                                    <th className="pb-4 font-bold p-2">Review Rate Without</th>
                                    <th className="pb-4 font-bold p-2">Reviews/Mo Without</th>
                                    <th className="pb-4 font-bold p-2 text-green-600">Review Rate With</th>
                                    <th className="pb-4 font-bold p-2 text-green-600">Reviews/Mo With</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                <tr className="border-b border-gray-100 bg-white">
                                    <td className="py-4 p-2 font-medium">100 orders</td>
                                    <td className="py-4 p-2">1-2%</td>
                                    <td className="py-4 p-2">1-2</td>
                                    <td className="py-4 p-2 font-bold text-green-600">20-30%</td>
                                    <td className="py-4 p-2 font-bold text-green-600">20-30</td>
                                </tr>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <td className="py-4 p-2 font-medium">500 orders</td>
                                    <td className="py-4 p-2">1-2%</td>
                                    <td className="py-4 p-2">5-10</td>
                                    <td className="py-4 p-2 font-bold text-green-600">20-30%</td>
                                    <td className="py-4 p-2 font-bold text-green-600">100-150</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="py-4 p-2 font-medium">1,000 orders</td>
                                    <td className="py-4 p-2">1-2%</td>
                                    <td className="py-4 p-2">10-20</td>
                                    <td className="py-4 p-2 font-bold text-green-600">20-30%</td>
                                    <td className="py-4 p-2 font-bold text-green-600">200-300</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12 text-left">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 text-green-600">
                            <Zap size={24} />
                            <h3 className="font-bold text-xl">Native Shopify Integration</h3>
                        </div>
                        <ul className="space-y-4 text-gray-600 text-sm">
                            <li className="flex gap-3"><span className="font-bold text-gray-900">1.</span> Connect your Shopify store</li>
                            <li className="flex gap-3"><span className="font-bold text-gray-900">2.</span> After orders are fulfilled, customers automatically get a text</li>
                            <li className="flex gap-3"><span className="font-bold text-gray-900">3.</span> They tap, land on Google, review</li>
                            <li className="flex gap-3"><span className="font-bold text-gray-900">4.</span> Reviews flow in automatically</li>
                        </ul>
                        <p className="mt-6 text-xs text-gray-400 font-bold uppercase">No manual work. Fully automated.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 text-purple-600">
                            <Globe size={24} />
                            <h3 className="font-bold text-xl">Works With Any Platform</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">Don't use Shopify? MoreStars works with:</p>
                        <ul className="space-y-2 text-sm text-gray-700 font-medium">
                            <li className="flex gap-2"><CheckCircle size={16} className="text-purple-500"/> WooCommerce (via Zapier)</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-purple-500"/> BigCommerce (via Zapier)</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-purple-500"/> Squarespace (via Zapier)</li>
                            <li className="flex gap-2"><CheckCircle size={16} className="text-purple-500"/> Any platform with CSV export</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Scenarios --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Real World Scenarios</h2>
                    <p className="text-gray-600">The difference automation makes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-purple-100 p-4 border-b border-purple-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <Package size={20}/> Scenario 1: The Happy Customer
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Ordered a jacket. Arrived in 3 days. Fits perfectly. She wears it every week.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She loves the jacket. Never thinks about you again. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives after delivery. <span className="font-semibold text-green-600">5 Stars.</span> "Great quality, fast shipping, fits perfectly. Already ordered another."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-red-100 p-4 border-b border-red-200">
                            <h3 className="font-bold text-red-800 flex items-center gap-2">
                                <Truck size={20}/> Scenario 2: The Complaint
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Package took 7 days instead of 5. Customer is annoyed. Leaves a 2-star "Shipping was slow."</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">That 2-star is 1 of your 12 reviews. <span className="font-semibold text-red-500">It's prominent.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">That 2-star is 1 of 200 reviews. <span className="font-semibold text-green-600">It's noise.</span> The 190 "fast shipping" reviews tell the real story.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Online Stores --- */}
        <FAQ 
            title="E-commerce FAQ" 
            items={[
                {
                    question: "How does the Shopify integration work?",
                    answer: "Connect your store in MoreStars settings. After orders are marked fulfilled, customers automatically receive a review request via SMS. No manual work required."
                },
                {
                    question: "When should I send review requests?",
                    answer: "After delivery. Set a delay (e.g. 3-7 days) so customers have time to receive and try the product. You can customize this timing."
                },
                {
                    question: "What about product reviews vs. store reviews?",
                    answer: "MoreStars focuses on store reviews (Google, Trustpilot, etc.) which help with SEO and overall trust. For individual product reviews on your site, use your platform's built-in tools—or use MoreStars to supplement."
                },
                {
                    question: "What if my product has a long lead time?",
                    answer: "Adjust the timing delay. If your product takes 3 weeks to arrive, set the request to send after 25 days. The goal is asking when satisfaction is highest."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Turn Every Order Into a Review Opportunity
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You're shipping orders every day. Happy customers everywhere. Silent on Google. MoreStars changes the math—automatically.
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
                 14-day free trial. Shopify integration included. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default OnlineStoresPage;
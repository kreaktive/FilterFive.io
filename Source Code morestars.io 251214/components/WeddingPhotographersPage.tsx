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
  Camera,
  Heart,
  Video,
  Image,
  Calendar,
  Users
} from 'lucide-react';

const WeddingPhotographersPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Wedding Photographers | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews as a wedding photographer. Couples research everything. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Camera size={14} /> Wedding Vendor Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            She Cried When She Saw the Photos. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">
                                She Never Left a Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Couples obsessively research wedding vendors. Reviews are how they find you—and trust you.
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
                                 <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xl">
                                     <Heart fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Emily & James</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">2 hours ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Absolutely incredible. She captured moments I didn't even know happened. <span className="bg-yellow-100 font-bold px-1">Worth every penny.</span> Every bride needs to hire her."
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                5.0 <Star fill="#FFBA49" className="text-[#FFBA49]" />
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
                        You're part of their best memories, but invisible on their search results.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You captured the first dance, the speeches, the sparkler exit. She hugged you. She said she'd recommend you to everyone. <strong className="text-gray-900">But she never reviewed you.</strong>
                        </p>
                        
                        <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
                             <h4 className="font-bold text-rose-800 mb-2">The Memory Fade</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 A year later, she's living married life. The wedding is a beautiful memory.
                             </p>
                             <p className="text-gray-700 text-sm font-medium">
                                 You're part of that memory—but not part of her daily thoughts. She meant to review you. She just... didn't.
                             </p>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, you're competing against everyone with a camera. Instagram is full of pretty portfolios. But reviews show the experience: "Did they show up on time? Were they easy to work with?" Without reviews, you're just another pretty portfolio.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Image size={64} className="text-rose-400 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>More Than Pretty Pictures</h3>
                        <p className="text-gray-600 mb-4">
                            Portfolios only show the best shots. Reviews show the reliability, personality, and professionalism that couples are paying thousands for.
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
                    <p className="text-xl text-gray-300">Capture the joy when it's fresh.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Heart />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture Post-Delivery Joy</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            The moment couples see their photos is magical. They're reliving the best day of their lives. That's when you send the request.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "So glad you love your wedding photos! If you'd recommend us to other couples, would you mind leaving a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Real Experiences Visible</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">12 Reviews</p>
                                <p className="text-xs text-gray-500">Over 3 years</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 2 Years</p>
                                <p className="text-green-400 font-bold text-lg">50+ Reviews</p>
                                <p className="text-xs text-gray-500">Consistent & Trusted</p>
                            </div>
                        </div>
                        <p className="text-gray-300">Reviews like "Made us feel comfortable" and "Delivered faster than promised" answer questions portfolios can't.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Users />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Couples Book with Confidence</h3>
                        <p className="text-gray-300 leading-relaxed">
                            Couples are about to spend $3,000-$10,000. They want proof they're making the right choice. 50 reviews averaging 4.9 stars provides that proof.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <XCircle />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Bad Reviews Lose Power</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Weddings are high-stress. Some couples are impossible. When you have 50 glowing reviews, the one complaint about "didn't get enough shots of Uncle Bob" is seen for what it is: noise.
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
                    <p className="text-gray-600">The difference delivery day makes.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-rose-100 p-4 border-b border-rose-200">
                            <h3 className="font-bold text-rose-800 flex items-center gap-2">
                                <Heart size={20}/> Scenario 1: The Crying Bride
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">She saw photos and cried happy tears. "You captured exactly what I wanted."</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She showed friends. Posted on Instagram. Tagged you maybe. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives after delivery. <span className="font-semibold text-green-600">5 Stars.</span> "Absolutely incredible. Captured moments I didn't even know happened."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Users size={20}/> Scenario 2: The Referral
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Couple loved your work. Told engaged friends "you should use our photographer."</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Friends Googled you. Saw only 8 reviews. Went with someone who looked more established.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">You have 45 reviews. Friends see the pattern: consistently great. <span className="font-semibold text-green-600">They book.</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Vendor Reality / Timing --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-rose-50 rounded-3xl p-8 md:p-12 border border-rose-100 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Delivery Day Advantage</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
                            <h3 className="font-bold text-xl mb-4 text-rose-600 flex items-center gap-2"><Calendar/> Day of Delivery</h3>
                            <p className="text-gray-600 text-sm mb-4">They've just received hundreds of photos. They're scrolling, crying, sharing.</p>
                            <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded inline-block">Best Time to Ask</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm opacity-70">
                             <h3 className="font-bold text-xl mb-4 text-gray-500 flex items-center gap-2"><Calendar/> One Week Later</h3>
                            <p className="text-gray-600 text-sm mb-4">They're back to normal life. The urgency is gone. The emotion has faded.</p>
                            <div className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded inline-block">Too Late</div>
                        </div>
                    </div>
                    <p className="mt-8 text-rose-800 text-sm font-medium max-w-2xl mx-auto">
                        Send the request the day you deliver photos (or the highlight reel). Capture the magic.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Wedding --- */}
        <FAQ 
            title="Wedding Photographer FAQ" 
            items={[
                {
                    question: "When exactly should I send the request?",
                    answer: "Day of delivery or day after. While they're still looking through photos/video and feeling the magic. Don't wait until album delivery months later."
                },
                {
                    question: "What about videographers?",
                    answer: "Same principle. When you deliver the highlight reel and they're watching it for the 10th time, that's when to ask."
                },
                {
                    question: "Should I ask couples who were difficult?",
                    answer: "Use judgment. If they seemed unhappy during the process, you might skip it. But sometimes difficult couples are thrilled with the final product and leave great reviews."
                },
                {
                    question: "What about destination weddings?",
                    answer: "Same process. Distance doesn't change anything. Send the request when you deliver the assets."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Let Happy Couples Sell Your Next Booking
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  You create beautiful images. Couples fall in love with them. Now help those couples tell engaged friends—and strangers—what it's like to work with you.
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

export default WeddingPhotographersPage;
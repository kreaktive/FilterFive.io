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
  PenTool,
  Image,
  Instagram,
  Clock,
  Palette,
  Droplet
} from 'lucide-react';

const TattooShopsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Tattoo Shops | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your tattoo shop. People research tattoo artists obsessively. $77/month. Start free.');
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
            <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <PenTool size={14} /> Tattoo Shop Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            8-Hour Session. <br/>
                            Perfect Piece. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-black">
                                They Posted Everywhere Except Google.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Your art lives on Instagram. Your business lives on Google. MoreStars connects them.
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
                                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                                     <Palette fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Alex (Sleeve Project)</div>
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
                                "Sat for 8 hours and it was worth every minute. Jake is a true artist. Shop was spotless and vibe was great. <span className="bg-yellow-100 font-bold px-1">Already planning my next piece.</span>"
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
                        They love the work. They tag you on stories. But your Google review count stays flat.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            You just finished a masterpiece. Your client looks in the mirror and says "This is exactly what I wanted." They're taking photos. They're texting friends.
                        </p>
                        
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h4 className="font-bold text-slate-800 mb-2">The Platform Gap</h4>
                             <ul className="space-y-3 text-sm text-gray-700 font-medium">
                                <li className="flex items-center gap-2"><Instagram size={16} className="text-pink-600"/> <strong>Instagram?</strong> Definitely posted.</li>
                                <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">f</div> <strong>Facebook?</strong> Probably.</li>
                                <li className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-white border border-gray-400 text-gray-600 flex items-center justify-center text-[10px] font-bold">G</div> <strong>Google?</strong> Never crosses their mind.</li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Meanwhile, someone searching "tattoo shops near me" sees your competitor has 180 reviews and you have 35. They don't know you're better. They just see numbers.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Droplet size={64} className="text-red-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Healing Trap</h3>
                        <p className="text-gray-600 mb-4">
                            Client didn't follow aftercare. Tattoo didn't heal right. <span className="font-bold text-red-600">Now</span> they remember Google.
                        </p>
                        <p className="font-medium text-gray-800">Your happy clients stay quiet. Your aftercare failures get loud.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Redirect social media energy to your business profile.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ArrowRight />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Redirect the Energy</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            They're already in sharing mode. A text right after the session captures that excitement and points it at Google.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for the session at Black Ink Studio! If you're happy with your piece, would you mind leaving us a Google review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Google Catches Up to Insta</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Instagram</p>
                                <p className="text-pink-400 font-bold text-lg">5k Followers</p>
                                <p className="text-xs text-gray-500">Looks pro</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Google</p>
                                <p className="text-green-400 font-bold text-lg">150+ Reviews</p>
                                <p className="text-xs text-gray-500">Confirms the hype</p>
                            </div>
                        </div>
                        <p className="text-gray-300">When both channels tell the same story, new clients book with confidence.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Aftercare Context</h3>
                        <p className="text-gray-300 leading-relaxed">
                            You can't prevent every "it got infected" complaint. But when you have 150 reviews saying "healed perfectly" and "cleanest shop ever," one bad healing story is clearly the exception.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <PenTool />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Artists Build Followings</h3>
                        <p className="text-gray-300 leading-relaxed">
                             Reviews often mention artists by name. "Ask for Maria." "Jake is incredible." Each review builds the artist's reputation inside your shop's page.
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
                    <p className="text-gray-600">Different sessions, same opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-slate-100 p-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Palette size={20}/> Scenario 1: The Sleeve Session
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">8 hours of work. Client is thrilled. Taking photos from every angle.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Posted on Instagram with 47 hashtags. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives. <span className="font-semibold text-green-600">5 Stars.</span> "Sat for 8 hours and it was worth every minute. Jake is a true artist."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <PenTool size={20}/> Scenario 2: The First Timer
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Nervous client. Small piece. You made them comfortable. They're excited.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">They show friends. Friends are impressed. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">They get a nudge. <span className="font-semibold text-green-600">5 Stars.</span> "First tattoo and I was so nervous. They made me feel comfortable and it came out perfect."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Research Reality & Healing --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 text-center">
                    <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>The Research Reality</h2>
                    
                    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200 mb-12 text-left">
                        <table className="w-full">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-bold text-slate-700">What They Look At</th>
                                    <th className="p-4 font-bold text-slate-700">What It Tells Them</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                <tr>
                                    <td className="p-4 font-medium"><Instagram className="inline mr-2 w-4 h-4 text-pink-600"/> Portfolio (Instagram)</td>
                                    <td className="p-4 text-gray-600">Can they do the style I want?</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium"><Star className="inline mr-2 w-4 h-4 text-yellow-500"/> Google Reviews</td>
                                    <td className="p-4 text-gray-600">What's the experience like? Is it clean?</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-medium"><Image className="inline mr-2 w-4 h-4 text-blue-500"/> Shop Photos</td>
                                    <td className="p-4 text-gray-600">Is it professional and safe?</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>Healing Timeline Strategy</h3>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-lg mb-2 text-blue-600 flex items-center gap-2"><Clock size={18}/> Option 1: Same Day</h4>
                            <p className="text-sm text-gray-600 mb-3">They're excited and in sharing mode.</p>
                            <p className="text-xs font-bold text-slate-800">Best for: Experience, freshness, professionalism.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-lg mb-2 text-purple-600 flex items-center gap-2"><Clock size={18}/> Option 2: 2-3 Weeks Later</h4>
                            <p className="text-sm text-gray-600 mb-3">They've lived with it and it's healed.</p>
                            <p className="text-xs font-bold text-slate-800">Best for: Healing quality, long-term satisfaction.</p>
                        </div>
                    </div>
                    <p className="mt-6 text-sm text-gray-500">Many shops do both: Ask same-day, then follow up post-healing.</p>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Tattoo --- */}
        <FAQ 
            title="Tattoo Shop FAQ" 
            items={[
                {
                    question: "Should I ask after every session?",
                    answer: "Yes, unless you know they were unhappy. Every session is a review opportunity."
                },
                {
                    question: "What about small pieces vs. large pieces?",
                    answer: "Both matter. A client who got a small piece can still describe the experience, cleanliness, and professionalism perfectly. Often small pieces are 'gateway' tattoos to larger work."
                },
                {
                    question: "What about touch-ups?",
                    answer: "Sure. Loyal clients coming back for touch-ups often leave the best reviews because they have long-term perspective on how your work ages."
                },
                {
                    question: "How do I handle aftercare complaints?",
                    answer: "Respond professionally. Explain aftercare requirements. With enough positive reviews, one complaint is clearly an outlier. Volume is your best defense against the 'it faded' (because they went swimming) review."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Let Your Art Speak on Google Too
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your work is all over Instagram. Your clients love their pieces. Now help them share that love where new clients are actually searching—so your Google presence matches your talent.
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

export default TattooShopsPage;
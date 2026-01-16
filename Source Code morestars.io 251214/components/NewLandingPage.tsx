import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  Star, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, 
  Smartphone, QrCode, MousePointerClick, MessageSquare, 
  ShieldCheck, Check, Clock, ThumbsUp, XCircle, HelpCircle,
  Zap, MapPin, BarChart3, Globe, Layout, Users
} from 'lucide-react';

const SectionHeader: React.FC<{ title: string; subtitle?: string; centered?: boolean }> = ({ title, subtitle, centered = true }) => (
  <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
    <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
      {title}
    </h2>
    {subtitle && (
      <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

const MoneyCalculator = () => {
    const [customers, setCustomers] = useState(120);
    const [avgValue, setAvgValue] = useState(250);

    // Math Logic:
    // 1. Assume SMS conversion rate = 30% (conservative for SMS)
    // 2. Reviews gained = Monthly Customers * 0.30
    // 3. Revenue Impact: Assume 1 new customer acquired for every 10 new 5-star reviews posted (Social proof conversion)
    // This is a heuristic to show potential value of reputation.
    
    const reviewsPerMonth = Math.round(customers * 0.3);
    const newCustomersPerMonth = reviewsPerMonth / 10; // 1 customer per 10 reviews
    const monthlyRevenue = Math.round(newCustomersPerMonth * avgValue);
    const yearlyRevenue = monthlyRevenue * 12;

    // Calculate percentage for slider backgrounds
    const customersPercent = ((customers - 10) / (500 - 10)) * 100;
    const valuePercent = ((avgValue - 50) / (2000 - 50)) * 100;

    return (
        <section className="py-20 bg-[#23001E] text-white overflow-hidden border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[#FFBA49]/10 border border-[#FFBA49]/30 text-[#FFBA49] text-xs font-bold uppercase tracking-wide mb-6">
                            <BarChart3 size={14} /> ROI Calculator
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
                            Stop Leaving Money <br/>on the Table
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                            Every happy customer who leaves without reviewing is a missed opportunity for future revenue. See exactly what you're losing.
                        </p>

                        <div className="space-y-10">
                            {/* Slider 1 */}
                            <div className="relative">
                                <div className="flex justify-between text-sm font-bold mb-4">
                                    <span className="text-gray-400 uppercase tracking-wider">Monthly Customers</span>
                                    <span className="text-[#FFBA49] text-xl">{customers}</span>
                                </div>
                                <div className="relative h-2 w-full bg-gray-700 rounded-full">
                                    <div className="absolute h-full bg-[#FFBA49] rounded-full" style={{ width: `${customersPercent}%` }}></div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="500"
                                        step="10"
                                        value={customers}
                                        onChange={(e) => setCustomers(parseInt(e.target.value))}
                                        className="absolute w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div 
                                        className="absolute w-6 h-6 bg-white rounded-full shadow-lg -mt-2 pointer-events-none transition-all duration-75"
                                        style={{ left: `calc(${customersPercent}% - 12px)` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Slider 2 */}
                            <div className="relative">
                                <div className="flex justify-between text-sm font-bold mb-4">
                                    <span className="text-gray-400 uppercase tracking-wider">Avg. Customer Value</span>
                                    <span className="text-[#FFBA49] text-xl">${avgValue}</span>
                                </div>
                                <div className="relative h-2 w-full bg-gray-700 rounded-full">
                                    <div className="absolute h-full bg-[#FFBA49] rounded-full" style={{ width: `${valuePercent}%` }}></div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="2000"
                                        step="50"
                                        value={avgValue}
                                        onChange={(e) => setAvgValue(parseInt(e.target.value))}
                                        className="absolute w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div 
                                        className="absolute w-6 h-6 bg-white rounded-full shadow-lg -mt-2 pointer-events-none transition-all duration-75"
                                        style={{ left: `calc(${valuePercent}% - 12px)` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
                        {/* Glow Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBA49] rounded-full blur-[100px] opacity-10 pointer-events-none -mr-20 -mt-20"></div>
                        
                        <div className="relative z-10 text-center py-4">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Potential Yearly Revenue Impact</p>
                            <div className="text-5xl md:text-7xl font-extrabold text-[#FFBA49] mb-4 tracking-tight">
                                ${yearlyRevenue.toLocaleString()}
                            </div>
                            <p className="text-gray-300 text-sm max-w-sm mx-auto leading-relaxed opacity-80">
                                This is the estimated value of new customers acquired through a stronger reputation.*
                            </p>
                            
                            <div className="mt-10 pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-3xl font-bold text-white mb-1">{reviewsPerMonth}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">New Reviews/Mo</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-green-400 mb-1">${monthlyRevenue.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Monthly Boost</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MapSimulator = () => {
    const [reviews, setReviews] = useState(12); // User starts low
    
    // Competitors (Static)
    const comp1 = { name: "Pro Service Experts", reviews: 145, rating: 4.8, isMe: false };
    const comp2 = { name: "City Best Local", reviews: 88, rating: 4.6, isMe: false };
    const comp3 = { name: "Budget Bros", reviews: 42, rating: 4.2, isMe: false };

    const myBusiness = { name: "Your Business", reviews: reviews, rating: 4.9, isMe: true };

    // Sort to determine rank
    const all = [comp1, comp2, comp3, myBusiness].sort((a, b) => b.reviews - a.reviews);
    const myRank = all.findIndex(b => b.isMe) + 1;

    // Slider percent
    const sliderPercent = ((reviews - 12) / (200 - 12)) * 100;

    return (
        <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                        Don't Let Them Win Just Because They're Louder
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your competitors aren't better than you. They just have more reviews. Drag the slider to see how easy it is to overtake them.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-16 items-center">
                    {/* Controls */}
                    <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10">
                        <label className="block text-sm font-bold text-gray-500 mb-6 uppercase tracking-wide">
                            Add Reviews to Your Profile
                        </label>
                        
                        <div className="relative h-4 w-full bg-gray-100 rounded-full mb-10">
                            <div className="absolute h-full bg-blue-600 rounded-full" style={{ width: `${sliderPercent}%` }}></div>
                            <input
                                type="range"
                                min="12"
                                max="200"
                                value={reviews}
                                onChange={(e) => setReviews(parseInt(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
                            />
                            <div 
                                className="absolute w-8 h-8 bg-white border-2 border-blue-600 rounded-full shadow-lg -mt-2 pointer-events-none transition-all duration-75 flex items-center justify-center"
                                style={{ left: `calc(${sliderPercent}% - 16px)` }}
                            >
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>
                        
                        <div className="text-center mb-8">
                            <div className="text-7xl font-extrabold text-[#23001E] mb-2 transition-all duration-100">{reviews}</div>
                            <p className="text-gray-500 font-medium">Your Total Reviews</p>
                        </div>

                        <div className={`p-4 rounded-xl border text-center transition-colors duration-300 ${myRank <= 3 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            <p className="font-bold text-lg">
                                {myRank === 1 ? "🥇 You are #1 in the Map Pack!" : 
                                 myRank === 2 ? "🥈 You're beating 2 competitors!" :
                                 myRank === 3 ? "🥉 You made the Top 3!" : "You are invisible on page 2."}
                            </p>
                        </div>
                    </div>

                    {/* Simulation */}
                    <div className="lg:col-span-7 relative">
                        {/* Google Map Mockup Container */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-md mx-auto relative transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center gap-2">
                                <MapPin size={16} className="text-red-500" />
                                <span className="font-bold text-gray-600 text-sm">Businesses near you</span>
                            </div>
                            
                            {/* The List */}
                            <div className="relative h-[360px] bg-white">
                                {all.map((biz, i) => (
                                    <div 
                                        key={biz.name}
                                        className={`absolute w-full p-4 flex items-start gap-4 transition-all duration-500 ease-in-out border-b border-gray-50 ${biz.isMe ? 'bg-blue-50/80 z-20' : 'bg-white z-10'}`}
                                        style={{ 
                                            transform: `translateY(${i * 90}px)`,
                                            height: '90px'
                                        }} 
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {biz.isMe ? 
                                                <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold text-xs shadow-md shadow-blue-200">You</div> :
                                                <div className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center font-bold text-sm shadow-sm">{String.fromCharCode(65 + i)}</div>
                                            }
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className={`font-bold text-base ${biz.isMe ? 'text-blue-700' : 'text-gray-900'}`}>{biz.name}</h4>
                                            <div className="flex items-center gap-1.5 text-sm mt-1">
                                                <span className="font-bold text-orange-500">{biz.rating}</span>
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, stars) => (
                                                        <Star key={stars} size={14} fill="currentColor" />
                                                    ))}
                                                </div>
                                                <span className="text-gray-500">({biz.reviews})</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 font-medium">Service Business • Open now</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                                <span className="text-blue-600 font-bold text-sm cursor-pointer hover:underline">View all businesses</span>
                            </div>
                        </div>
                        
                        {/* Decorative Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-blue-100 to-purple-100 opacity-30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const NewLandingPage: React.FC = () => {
  useEffect(() => {
    document.title = "Get More Google Reviews | MoreStars";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-24 relative overflow-hidden bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                 <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                    More stars. More customers.
                 </div>
                 <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                   Your Happiest Customers Never Leave Reviews. <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Your Angriest One Did.</span>
                 </h1>
                 <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                   That's why your Google rating doesn't match reality. MoreStars sends customers a text after their visit. One tap. They're on your Google page. Review done.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 bg-[#FFBA49] text-[#23001E]">
                        Start Free Trial <ArrowRight size={20} />
                    </button>
                    <Link to="/how-it-works" className="px-8 py-4 rounded-full font-bold text-lg border-2 border-[#23001E] text-[#23001E] hover:bg-gray-100 flex items-center justify-center">
                        See How It Works
                    </Link>
                 </div>
                 <p className="text-sm text-gray-500 font-medium">
                    14-day free trial. No credit card required. Set up in 5 minutes.
                 </p>
              </div>
              <div className="relative">
                 {/* Visual Mockup */}
                 <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform rotate-2">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                       <div className="text-sm font-bold text-gray-400 ml-auto">Dashboard</div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-sm text-gray-500">Total Reviews</p>
                             <p className="text-3xl font-extrabold">142</p>
                          </div>
                          <div className="text-green-500 text-sm font-bold">+28 this month</div>
                       </div>
                       <div className="h-32 bg-gray-50 rounded-xl flex items-end justify-between px-4 pb-0 pt-8 gap-2">
                          {[20, 35, 30, 50, 45, 60, 55, 75, 70, 90].map((h, i) => (
                             <div key={i} className="w-full bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                          ))}
                       </div>
                       <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="bg-green-100 p-2 rounded-full"><Star className="w-4 h-4 text-green-600 fill-current" /></div>
                          <div className="text-sm">
                             <p className="font-bold text-gray-800">New 5-Star Review</p>
                             <p className="text-gray-500">Just now from Sarah J.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- NEW COMPONENTS ADDED HERE --- */}
        <MoneyCalculator />
        <MapSimulator />

        {/* --- Problem Section --- */}
        <section className="py-24 bg-white">
           <div className="max-w-4xl mx-auto px-4">
              <SectionHeader 
                 title="You're Losing Customers to Competitors With Worse Service" 
              />
              <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1" style={{ color: COLORS.dark }}>95 Happy Customers Stay Silent</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">You serve 100 people. 95 are thrilled. Maybe 2 leave a review. The rest just go home happy.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                             <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1" style={{ color: COLORS.dark }}>The 1 Angry Customer is Loud</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">That one person who misunderstood the price? They found Google immediately. Now your rating is skewed.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                             <MousePointerClick size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1" style={{ color: COLORS.dark }}>Competitors Win on Looks</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Prospects search "<span className="italic">best near me</span>". They call the competitor with 200 reviews. Not because they're better, but because they <strong>look</strong> better.
                            </p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-l-4 border-[#23001E] rounded-r-lg mt-6">
                        <p className="font-bold text-lg" style={{ color: COLORS.dark }}>Every day you don't ask, that gap grows.</p>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={64} className="text-orange-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-2">The Silent Majority</h3>
                    <p className="text-gray-600">95% of happy customers stay silent.</p>
                    <p className="text-gray-600">100% of angry customers speak up.</p>
                    <div className="mt-8 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                       <div className="flex justify-between text-sm mb-2 font-bold">
                          <span>Without MoreStars</span>
                          <span className="text-red-500">Skewed Negative</span>
                       </div>
                       <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="w-[10%] bg-green-500"></div>
                          <div className="w-[80%] bg-gray-300"></div>
                          <div className="w-[10%] bg-red-500"></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- Solution Section --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Get Your Google Rating to Match Reality</h2>
                 <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    MoreStars reaches your happy customers before they forget. A simple text. A direct link. One tap and they're on your Google page, ready to review.
                 </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <div className="text-4xl font-extrabold text-[#FFBA49] mb-4">Month 1</div>
                    <p className="text-lg font-bold mb-2">Reviews Start Flowing</p>
                    <p className="text-gray-400">You see 15-30 new reviews instead of 2-3. The silence is broken.</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <div className="text-4xl font-extrabold text-[#FFBA49] mb-4">Month 3</div>
                    <p className="text-lg font-bold mb-2">Rating Climbs</p>
                    <p className="text-gray-400">Your average goes up. You pass competitors who've been coasting.</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <div className="text-4xl font-extrabold text-[#FFBA49] mb-4">Month 6</div>
                    <p className="text-lg font-bold mb-2">Obvious Choice</p>
                    <p className="text-gray-400">When someone searches for what you do, you win the click. More revenue.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* --- How It Works --- */}
        <section className="py-24 bg-white">
           <div className="max-w-6xl mx-auto px-4">
              <SectionHeader title="Four Steps. Five Minutes to Set Up." />
              <div className="grid md:grid-cols-4 gap-8">
                 {[
                    { icon: <ThumbsUp />, title: "1. Customer Leaves Happy", desc: "They just got their car fixed, teeth cleaned, or hair done. They're satisfied." },
                    { icon: <Smartphone />, title: "2. They Get a Text", desc: "\"Hi Sarah, thanks for visiting! If we took good care of you, mind leaving a review? [link]\"" },
                    { icon: <MousePointerClick />, title: "3. One Tap to Google", desc: "No app. No account creation. They tap the link and land directly on your review page." },
                    { icon: <Star />, title: "4. You Get the Review", desc: "And another. And another. Your rating climbs. Your Google presence transforms." }
                 ].map((step, i) => (
                    <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                       <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-blue-600">
                          {step.icon}
                       </div>
                       <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                       <p className="text-sm text-gray-600">{step.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- Two Ways to Collect --- */}
        <section className="py-24 bg-gray-50">
           <div className="max-w-6xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12">
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><MessageSquare size={32} /></div>
                       <h3 className="text-2xl font-bold">Text Messages (SMS)</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                       Best for businesses with customer phone numbers. Upload a list, add one by one, or connect your POS.
                    </p>
                    <ul className="space-y-3 mb-8">
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> Personalized requests</li>
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> Highest conversion rate</li>
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> <strong>1,000 messages included monthly</strong></li>
                    </ul>
                 </div>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><QrCode size={32} /></div>
                       <h3 className="text-2xl font-bold">QR Codes</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                       Best for walk-in traffic. Print it for checkout, receipts, or table tents. Customers scan with their camera.
                    </p>
                     <ul className="space-y-3 mb-8">
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> Instant access</li>
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> No phone numbers needed</li>
                       <li className="flex gap-2 text-sm"><CheckCircle className="w-5 h-5 text-green-500"/> <strong>Unlimited scans. No extra cost.</strong></li>
                    </ul>
                 </div>
              </div>
              <div className="text-center mt-12">
                 <p className="text-lg font-bold" style={{ color: COLORS.dark }}>Use Both. Maximize reviews from every customer.</p>
              </div>
           </div>
        </section>

        {/* --- Compliance --- */}
        <section className="py-20 bg-white">
           <div className="max-w-3xl mx-auto px-4 text-center">
              <ShieldCheck className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-extrabold mb-6" style={{ color: COLORS.dark }}>Yes, This Is Allowed.</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                 Asking customers for reviews is completely fine. Google allows it. What's not allowed is fake reviews, paying for reviews, or "review gating" (only asking happy customers).
              </p>
              <p className="text-lg font-bold" style={{ color: COLORS.dark }}>
                 MoreStars doesn't do any of that. We simply make it easy to ask. No tricks. No gray areas. Just more reviews from real customers.
              </p>
           </div>
        </section>

        {/* --- The Math --- */}
        <section className="py-24" style={{ backgroundColor: '#F9F7FA' }}>
           <div className="max-w-5xl mx-auto px-4">
              <SectionHeader title="The Numbers That Actually Matter" subtitle="Forget industry statistics. Here's math specific to your business." centered />
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h4 className="font-bold text-lg mb-2 text-gray-400 uppercase tracking-wide">You see 100 customers</h4>
                       <div className="flex justify-between items-center py-4 border-b border-gray-100">
                          <span className="text-gray-600">Without a system</span>
                          <span className="font-bold text-red-500">2-3 reviews</span>
                       </div>
                       <div className="flex justify-between items-center pt-4">
                          <span className="font-bold text-gray-800">With MoreStars</span>
                          <span className="font-extrabold text-green-600 text-xl">25-30 reviews</span>
                       </div>
                    </div>
                    <p className="text-sm text-gray-500 italic text-center">Based on typical SMS response rates of 25-35%.</p>
                 </div>

                 <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 text-center">The 90-Day Difference</h3>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                       <div className="font-bold text-gray-400">Metric</div>
                       <div className="font-bold text-red-400">Without Us</div>
                       <div className="font-bold text-green-600">With Us</div>
                       
                       <div className="col-span-3 h-px bg-gray-100 my-2"></div>
                       
                       <div className="text-gray-600">Monthly Reviews</div>
                       <div className="text-gray-500">2-3</div>
                       <div className="font-bold text-gray-900">25-30</div>

                       <div className="text-gray-600">90-Day Total</div>
                       <div className="text-gray-500">6-9</div>
                       <div className="font-bold text-gray-900">75-90</div>

                       <div className="text-gray-600">Google Presence</div>
                       <div className="text-gray-500">Stagnant</div>
                       <div className="font-bold text-green-600">Transformed</div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                       <p className="font-bold text-lg" style={{ color: COLORS.dark }}>That's not a vanity metric. That's your phone ringing more.</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- Comparison --- */}
        <section className="py-24 bg-white">
           <div className="max-w-5xl mx-auto px-4">
              <SectionHeader title="MoreStars vs. What You're Doing Now" centered />
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-gray-50">
                          <th className="p-4 md:p-6 font-bold text-gray-500 border-b border-gray-200">The Struggle</th>
                          <th className="p-4 md:p-6 font-bold text-white bg-[#23001E] border-b border-[#23001E]">With MoreStars</th>
                       </tr>
                    </thead>
                    <tbody className="text-sm md:text-base">
                       {[
                          ["Ask sometimes, forget mostly", "Every customer gets asked"],
                          ["Awkward face-to-face request", "Text goes out automatically"],
                          ["Hand out cards that go in the trash", "Link arrives in their pocket"],
                          ["Customers forget by the time they're home", "Message catches them while they care"],
                          ["Hope they find your Google page", "One tap. They're there."],
                          ["2-3 reviews a month if lucky", "25-30 reviews a month"]
                       ].map(([bad, good], i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                             <td className="p-4 md:p-6 text-gray-600 bg-white"><XCircle className="inline w-4 h-4 text-red-400 mr-2"/> {bad}</td>
                             <td className="p-4 md:p-6 font-bold text-gray-900 bg-blue-50/30"><CheckCircle className="inline w-4 h-4 text-green-500 mr-2"/> {good}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="mt-8 text-center bg-gray-50 p-6 rounded-xl">
                 <p className="text-lg font-medium text-gray-700">
                    <strong>Price Context:</strong> Enterprise tools charge $300-500/month. <br/>
                    MoreStars is <strong>$77/month</strong>. All features included. No contracts.
                 </p>
              </div>
           </div>
        </section>

        {/* --- Features --- */}
        <section className="py-24 bg-white">
           <div className="max-w-7xl mx-auto px-4">
              <SectionHeader title="Everything You Need. Nothing You Don't." centered />
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                    { icon: <Smartphone />, title: "SMS Requests", desc: "1,000 messages included monthly. Friendly and professional." },
                    { icon: <QrCode />, title: "QR Codes", desc: "Unlimited scans. Perfect for receipts and counters." },
                    { icon: <MousePointerClick />, title: "Direct Links", desc: "One tap to Google, Yelp, or Facebook. No friction." },
                    { icon: <BarChart3 />, title: "Analytics", desc: "Track sends, clicks, and conversion rates." },
                    { icon: <MapPin />, title: "Multi-Location", desc: "Track each location separately." },
                    { icon: <Zap />, title: "POS Integration", desc: "Connect Square or Shopify easily." },
                    { icon: <Globe />, title: "Zapier & API", desc: "Connect to any existing tool you use." },
                    { icon: <MessageSquare />, title: "Custom Msgs", desc: "Write your own text or use our templates." },
                 ].map((f, i) => (
                    <div key={i} className="p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
                       <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">{f.icon}</div>
                       <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                       <p className="text-sm text-gray-600">{f.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- Industries --- */}
        <section className="py-24 bg-gray-50">
           <div className="max-w-4xl mx-auto px-4">
              <SectionHeader title="Built for Local Businesses Like Yours" centered />
              <div className="grid md:grid-cols-2 gap-6">
                 {[
                    { title: "Service Businesses", desc: "Auto repair, HVAC, plumbers, contractors." },
                    { title: "Healthcare", desc: "Dental, chiropractors, physical therapists." },
                    { title: "Personal Services", desc: "Salons, spas, barbershops, pet groomers." },
                    { title: "Food & Hospitality", desc: "Restaurants, cafes, bars." },
                    { title: "Real Estate", desc: "Agents, brokers, property managers." },
                    { title: "High-Volume", desc: "Car washes, retail, oil change shops." },
                 ].map((ind, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-4">
                       <CheckCircle className="w-6 h-6 text-[#FFBA49] flex-shrink-0 mt-1" />
                       <div>
                          <h4 className="font-bold text-gray-900">{ind.title}</h4>
                          <p className="text-sm text-gray-600">{ind.desc}</p>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="text-center mt-12">
                 <Link to="/industries" className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2">
                    See how MoreStars works for your industry <ArrowRight size={16}/>
                 </Link>
              </div>
           </div>
        </section>

        {/* --- Pricing Preview --- */}
        <section className="py-24 bg-white">
           <div className="max-w-md mx-auto px-4 text-center">
              <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Simple Pricing. No Surprises.</h2>
              <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-100 mt-8 relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-2 bg-[#FFBA49]"></div>
                 <div className="text-5xl font-extrabold mb-2" style={{ color: COLORS.dark }}>$77<span className="text-xl text-gray-400 font-medium">/mo</span></div>
                 <p className="text-green-600 font-bold text-sm mb-6">Or $770/year (save $154)</p>
                 
                 <ul className="space-y-3 text-left mb-8">
                    <li className="flex gap-2"><Check className="text-green-500" /> 1,000 SMS messages included</li>
                    <li className="flex gap-2"><Check className="text-green-500" /> Unlimited QR codes</li>
                    <li className="flex gap-2"><Check className="text-green-500" /> All features included</li>
                    <li className="flex gap-2"><Check className="text-green-500" /> No contracts</li>
                    <li className="flex gap-2"><Check className="text-green-500" /> Cancel anytime</li>
                 </ul>
                 
                 <Link to="/pricing" className="block w-full py-4 rounded-xl font-bold bg-[#FFBA49] text-[#23001E] hover:opacity-90 transition-opacity">
                    Start Free Trial
                 </Link>
                 <p className="text-xs text-gray-400 mt-4">14-day free trial. 10 SMS included. No credit card required.</p>
              </div>
           </div>
        </section>

        {/* --- Objections --- */}
        <section className="py-24 bg-gray-50">
           <div className="max-w-4xl mx-auto px-4">
              <SectionHeader title="Questions You Might Have" centered />
              <div className="grid md:grid-cols-2 gap-8">
                 {[
                    { q: "What if someone leaves a bad review?", a: "That can happen. But here's the thing: unhappy customers are already leaving reviews. They don't need encouragement. The goal is to get happy customers to match their energy. One bad review among fifty good ones? That's a 4.8 rating. That's a business people trust." },
                    { q: "I don't have time for another tool.", a: "Setup takes 5 minutes. After that, it runs on autopilot. Upload a customer list or put up a QR code. Reviews come in. This isn't another thing to manage. It's a thing that manages itself." },
                    { q: "I've tried asking for reviews before.", a: "Asking face-to-face is awkward. Handing out cards doesn't work. The difference with MoreStars: the ask comes later, via text, when the customer has a quiet moment. And the link goes directly to your Google page. No searching. No friction." },
                    { q: "Is $77/month worth it?", a: "One new customer pays for a year of MoreStars. For most businesses, that customer shows up in the first month. The real question: what's it costing you to let competitors collect reviews while you don't?" }
                 ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h4 className="font-bold text-lg mb-3" style={{ color: COLORS.dark }}>"{item.q}"</h4>
                       <p className="text-gray-600 leading-relaxed text-sm">{item.a}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- FAQ --- */}
        <section className="py-24 bg-white">
           <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-extrabold mb-12 text-center" style={{ color: COLORS.dark }}>More Questions</h2>
              <div className="space-y-6">
                 {[
                    { q: "How long does setup take?", a: "About 5 minutes. Create account, paste your Google review link, and you're ready to send." },
                    { q: "What review platforms do you support?", a: "Google, Facebook, Yelp, TripAdvisor, Healthgrades, Vitals, and any platform with a review URL." },
                    { q: "Do I need technical skills?", a: "No. If you can send a text message, you can use MoreStars." },
                    { q: "Is there a contract?", a: "No. Month-to-month. Cancel anytime. No fees." },
                    { q: "What happens if I run out of SMS?", a: "You get 1,000/mo. At 80% we notify you. At 100% sending pauses. You can buy more ($17/1k) or wait for reset. No surprise charges." },
                    { q: "What happens after the free trial?", a: "Trial ends after 14 days. If you don't upgrade, account pauses. No automatic charges." },
                    { q: "Is this HIPAA compliant?", a: "MoreStars doesn't store PHI. We only need name and phone number. Requests are generic." },
                    { q: "Do you integrate with POS?", a: "Yes, Square and Shopify directly. Others via CSV upload or Zapier." },
                 ].map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                       <h4 className="font-bold text-gray-900 mb-2">{item.q}</h4>
                       <p className="text-gray-600 text-sm">{item.a}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Your Happy Customers Want to Help. <br/>Let Them.
              </h2>
              <div className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                  They meant to leave a review. They just forgot. MoreStars catches them before that happens.
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </button>
              </div>
              <p className="mt-8 text-sm font-bold opacity-75" style={{ color: COLORS.dark }}>
                 14-day free trial. 10 SMS included. No credit card required.
              </p>
              <div className="mt-4">
                 <a href="mailto:support@morestars.io" className="text-sm underline hover:opacity-80" style={{ color: COLORS.dark }}>Questions? support@morestars.io</a>
              </div>
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewLandingPage;
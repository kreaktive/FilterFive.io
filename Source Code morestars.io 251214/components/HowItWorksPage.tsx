import React, { useEffect, useRef, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRight, 
  Send, 
  Smartphone, 
  MousePointerClick, 
  Star, 
  CheckCircle, 
  Zap,
  BarChart3,
  MessageSquare,
  Clock,
  ThumbsUp,
  XCircle,
  Phone,
  Search,
  MapPin,
  MoveHorizontal,
  Mail,
  MessageCircle,
  Bell
} from 'lucide-react';

const MockupWindow = ({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${className}`}>
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="mx-auto text-xs font-medium text-gray-500">{title}</div>
    </div>
    {children}
  </div>
);

const BeforeAfterListing = () => {
    const [position, setPosition] = useState(50);

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Turn Your Google Profile Into Your Best Salesperson</h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Your online reputation is often the only difference between getting the call or losing it to a competitor. Drag the slider to see how MoreStars transforms your business from "risky" to "reliable."
                    </p>
                </div>

                <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] md:aspect-[21/9] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none group">
                    
                    {/* --- RIGHT SIDE (The AFTER / Good State) --- */}
                    <div className="absolute inset-0 bg-white flex items-center justify-center p-8">
                        <div className="w-full max-w-2xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">Acme Services</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-orange-500 font-bold text-sm">4.9</span>
                                        <div className="flex text-yellow-400 text-sm">
                                            <Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/>
                                        </div>
                                        <span className="text-gray-500 text-sm">(487 reviews)</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Service establishment • Open 24 hours</p>
                                </div>
                                <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-md">Website</div>
                            </div>
                            <div className="flex gap-3 mb-6">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Professional</span>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Best in town</span>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Great value</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-green-200"></div>
                                        <span className="font-bold text-sm">Sarah J.</span>
                                        <span className="text-gray-400 text-xs">2 days ago</span>
                                    </div>
                                    <div className="flex text-yellow-400 text-xs mb-1">
                                        <Star fill="currentColor" size={12}/><Star fill="currentColor" size={12}/><Star fill="currentColor" size={12}/><Star fill="currentColor" size={12}/><Star fill="currentColor" size={12}/>
                                    </div>
                                    <p className="text-xs text-gray-600">"Simply the best experience I've had. Quick, professional, and friendly. Highly recommend!"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- LEFT SIDE (The BEFORE / Bad State) --- */}
                    <div 
                        className="absolute inset-0 bg-gray-50 border-r border-gray-300 flex items-center justify-center p-8 overflow-hidden"
                        style={{ width: `${position}%` }}
                    >
                        <div className="w-full max-w-2xl" style={{ width: '100vw', maxWidth: '42rem' }}> {/* Force width to match container to prevent squishing */}
                             <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">Acme Services</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-orange-500 font-bold text-sm">3.4</span>
                                        <div className="flex text-yellow-400 text-sm">
                                            <Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star className="text-gray-300" size={16}/><Star className="text-gray-300" size={16}/>
                                        </div>
                                        <span className="text-gray-500 text-sm">(12 reviews)</span>
                                    </div>
                                    <p className="text-sm text-gray-500">Service establishment • Open 24 hours</p>
                                </div>
                                <div className="bg-gray-200 text-gray-500 px-6 py-2 rounded-full font-bold text-sm">Website</div>
                            </div>
                            <div className="flex gap-3 mb-6">
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">Expensive</span>
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">Rude</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white rounded-xl border border-gray-200 opacity-60">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                                        <span className="font-bold text-sm">Mike T.</span>
                                        <span className="text-gray-400 text-xs">2 years ago</span>
                                    </div>
                                    <div className="flex text-yellow-400 text-xs mb-1">
                                        <Star fill="currentColor" size={12}/><Star className="text-gray-300" size={12}/><Star className="text-gray-300" size={12}/><Star className="text-gray-300" size={12}/><Star className="text-gray-300" size={12}/>
                                    </div>
                                    <p className="text-xs text-gray-600">"Nobody answers the phone. Went elsewhere."</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Overlay Label */}
                        <div className="absolute top-6 left-6 bg-white/80 backdrop-blur text-gray-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border border-gray-200">
                            Without MoreStars
                        </div>
                    </div>

                    {/* Overlay Label Right */}
                    <div className="absolute top-6 right-6 bg-[#23001E] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
                        With MoreStars
                    </div>

                    {/* --- SLIDER HANDLE --- */}
                    <div 
                        className="absolute top-0 bottom-0 w-1 bg-[#23001E] cursor-ew-resize z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        style={{ left: `${position}%` }}
                    >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#23001E] rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-transform group-hover:scale-110">
                            <MoveHorizontal className="text-white w-6 h-6" />
                        </div>
                    </div>

                    {/* --- INPUT (Invisible control) --- */}
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={position}
                        onChange={(e) => setPosition(parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                </div>
            </div>
        </section>
    );
};

const AnatomyOfRequest = () => {
    return (
        <section className="py-24 relative overflow-hidden" style={{ backgroundColor: COLORS.dark }}>
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[150px]"></div>
                <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[150px]"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Anatomy of a Perfect Request</h2>
                    <p className="text-gray-400">Why our messages convert 10x better than email.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center">
                    
                    {/* Left Column annotations */}
                    <div className="space-y-12 text-right hidden md:block">
                        <div className="group cursor-default">
                            <h4 className="text-[#FFBA49] font-bold text-lg mb-2 group-hover:translate-x-2 transition-transform">Personalization</h4>
                            <p className="text-gray-400 text-sm">Using their real name creates an instant human connection and stops the "spam" filter in their brain.</p>
                        </div>
                        <div className="group cursor-default">
                            <h4 className="text-blue-400 font-bold text-lg mb-2 group-hover:translate-x-2 transition-transform">Brand Recognition</h4>
                            <p className="text-gray-400 text-sm">Clearly stating who you are immediately reminds them of the great service they just received.</p>
                        </div>
                    </div>

                    {/* Center Phone */}
                    <div className="flex justify-center relative">
                        {/* Connecting lines SVG (Background) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ overflow: 'visible' }}>
                            {/* Left Top Line */}
                            <path d="M-20 60 Q 40 60, 60 140" fill="none" stroke="#FFBA49" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                            <circle cx="60" cy="140" r="4" fill="#FFBA49" />
                            
                            {/* Left Bottom Line */}
                            <path d="M-20 220 Q 40 220, 70 170" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                            <circle cx="70" cy="170" r="4" fill="#60A5FA" />

                            {/* Right Top Line */}
                            <path d="M340 100 Q 280 100, 240 180" fill="none" stroke="#4ADE80" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                            <circle cx="240" cy="180" r="4" fill="#4ADE80" />

                            {/* Right Bottom Line */}
                            <path d="M340 260 Q 280 260, 220 220" fill="none" stroke="#A78BFA" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
                            <circle cx="220" cy="220" r="4" fill="#A78BFA" />
                        </svg>

                        <div className="w-72 bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl p-4 relative z-10">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-800 rounded-b-xl"></div>
                            <div className="pt-12 pb-4 space-y-4">
                                {/* Message Bubble */}
                                <div className="bg-[#232323] p-4 rounded-2xl rounded-bl-none border border-gray-700 relative">
                                    <p className="text-gray-200 text-sm leading-relaxed">
                                        Hi <span className="text-[#FFBA49] font-bold">Sarah</span>! Thanks for choosing <span className="text-blue-400 font-bold">AutoFix</span> today.
                                        <br/><br/>
                                        If we did a good job, would you mind leaving us a quick review?
                                        <br/><br/>
                                        <span className="text-green-400 underline font-bold cursor-pointer">morestars.io/link</span>
                                    </p>
                                    <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                                        <span>Now</span>
                                        <span className="text-purple-400">Reply STOP to opt out</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column annotations */}
                    <div className="space-y-12 hidden md:block">
                        <div className="group cursor-default">
                            <h4 className="text-green-400 font-bold text-lg mb-2 group-hover:-translate-x-2 transition-transform">Frictionless Link</h4>
                            <p className="text-gray-400 text-sm">A direct shortlink. No searching. No navigating. One tap opens the Google rating form.</p>
                        </div>
                        <div className="group cursor-default">
                            <h4 className="text-purple-400 font-bold text-lg mb-2 group-hover:-translate-x-2 transition-transform">Total Compliance</h4>
                            <p className="text-gray-400 text-sm">Built-in opt-out instructions ensure you stay compliant with strict carrier regulations (10DLC).</p>
                        </div>
                    </div>

                    {/* Mobile Annotations (Stacked) */}
                    <div className="md:hidden space-y-6 mt-8">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="text-[#FFBA49] font-bold mb-1">Personalization</h4>
                            <p className="text-gray-400 text-xs">Uses real names for higher trust.</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="text-green-400 font-bold mb-1">Frictionless Link</h4>
                            <p className="text-gray-400 text-xs">One tap directly to Google.</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <h4 className="text-purple-400 font-bold mb-1">Total Compliance</h4>
                            <p className="text-gray-400 text-xs">Fully compliant with SMS laws.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

const ChannelComparison = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.bar-fill', {
                width: 0,
                duration: 1.5,
                ease: "power2.out",
                stagger: 0.2,
                scrollTrigger: {
                    trigger: '.chart-container',
                    start: 'top 75%'
                }
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="py-24 bg-white chart-container">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Why Texting Beats Email</h2>
                    <p className="text-gray-600">Email inboxes are for spam. Text messages are for friends (and you).</p>
                </div>

                <div className="grid md:grid-cols-2 gap-16">
                    {/* Open Rate Chart */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Zap size={20}/></div>
                            <h3 className="font-bold text-xl">Open Rate</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-500 flex items-center gap-2"><Mail size={14}/> Email</span>
                                    <span className="text-gray-500">20%</span>
                                </div>
                                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                                    <div className="bar-fill h-full bg-gray-400 rounded-lg" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-[#23001E] flex items-center gap-2"><MessageCircle size={14}/> Text (SMS)</span>
                                    <span className="text-blue-600">98%</span>
                                </div>
                                <div className="h-10 bg-blue-50 rounded-lg overflow-hidden relative">
                                    <div className="bar-fill h-full bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: '98%' }}></div>
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-900 font-bold text-xs uppercase tracking-wide opacity-50">Winner</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Response Time Chart */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Clock size={20}/></div>
                            <h3 className="font-bold text-xl">Response Time</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-500 flex items-center gap-2"><Mail size={14}/> Email</span>
                                    <span className="text-gray-500">90 Minutes</span>
                                </div>
                                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                                    <div className="bar-fill h-full bg-gray-400 rounded-lg" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-[#23001E] flex items-center gap-2"><MessageCircle size={14}/> Text (SMS)</span>
                                    <span className="text-purple-600">90 Seconds</span>
                                </div>
                                <div className="h-10 bg-purple-50 rounded-lg overflow-hidden relative">
                                    <div className="bar-fill h-full bg-purple-500 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)]" style={{ width: '95%' }}></div>
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-900 font-bold text-xs uppercase tracking-wide opacity-50">Instant</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const GrowthSimulator = () => {
    const [days, setDays] = useState(0);
    const maxDays = 90;
    
    // Simulation Logic
    const startReviews = 24;
    const startRating = 4.2;
    const reviewsPerDay = 1.5;
    
    const currentReviews = Math.floor(startReviews + (days * reviewsPerDay));
    
    // Calculate new weighted average
    const totalScore = (startReviews * startRating) + ((days * reviewsPerDay) * 5);
    const currentRating = (totalScore / currentReviews).toFixed(1);
    
    const calls = Math.floor(12 + (days * 0.8));
    const sliderPercent = (days / maxDays) * 100;

    return (
        <section className="py-24 bg-[#23001E] text-white overflow-hidden relative border-t border-white/10">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px]"></div>
                <div className="absolute left-0 bottom-0 w-96 h-96 bg-blue-500 rounded-full blur-[128px]"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/10 border border-white/20 text-[#FFBA49] text-xs font-bold uppercase tracking-wide mb-6">
                            <BarChart3 size={14} /> See Your Future
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">The 90-Day Transformation</h2>
                        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                            What happens when you stop hoping for reviews and start automating them? 
                            <br/><br/>
                            Drag the slider to see how consistent requests transform your Google profile from "Average" to "Market Leader."
                        </p>
                        
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 select-none">
                            <div className="flex justify-between text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">
                                <span>Day 0</span>
                                <span className="text-[#FFBA49]">Day {days}</span>
                                <span>Day 90</span>
                            </div>
                            <div className="relative h-12 w-full flex items-center group">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="90"
                                    step="1"
                                    value={days}
                                    onChange={(e) => setDays(parseInt(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                                />
                                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden relative z-10">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-[#FFBA49]" 
                                        style={{ width: `${sliderPercent}%` }}
                                    ></div>
                                </div>
                                <div 
                                    className="absolute h-8 w-8 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10 flex items-center justify-center pointer-events-none group-active:scale-110 transition-transform duration-100"
                                    style={{ left: `calc(${sliderPercent}% - 16px)` }}
                                >
                                    <div className="w-2 h-2 bg-[#23001E] rounded-full"></div>
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-400 mt-4">
                                <span className="text-[#FFBA49] font-bold">PRO TIP:</span> Most businesses see results in the first 7 days.
                            </p>
                        </div>
                    </div>

                    {/* Google Card Visualization */}
                    <div className="relative transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="bg-white text-gray-900 p-6 rounded-xl shadow-2xl border-t-4 border-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-xl mb-1">Acme Local Services</h3>
                                    <div className="flex items-center text-xs text-gray-500 gap-1">
                                        <span className="font-bold text-orange-600">4.8</span>
                                        <div className="flex text-yellow-400">
                                            <Star size={12} fill="currentColor"/>
                                            <Star size={12} fill="currentColor"/>
                                            <Star size={12} fill="currentColor"/>
                                            <Star size={12} fill="currentColor"/>
                                            <Star size={12} fill="currentColor"/>
                                        </div>
                                        <span>• Service Business</span>
                                    </div>
                                </div>
                                <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded">Website</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center transition-all duration-300">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Rating</div>
                                    <div className="text-3xl font-extrabold text-[#23001E] flex justify-center items-center gap-1">
                                        {currentRating} <Star size={20} className="text-yellow-400 fill-current"/>
                                    </div>
                                    <div className={`text-xs font-bold mt-1 ${parseFloat(currentRating) > 4.5 ? 'text-green-500' : 'text-gray-400'}`}>
                                        {parseFloat(currentRating) > 4.5 ? 'Excellent' : 'Average'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center transition-all duration-300">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Reviews</div>
                                    <div className="text-3xl font-extrabold text-[#23001E]">
                                        {currentReviews}
                                    </div>
                                    <div className="text-xs text-green-500 font-bold mt-1">
                                        +{currentReviews - startReviews} New
                                    </div>
                                </div>
                            </div>

                            {/* Simulated "Impact" Metrics */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Search size={16} /> Search Views
                                    </div>
                                    <div className="font-bold text-gray-900">+{Math.floor(days * 12.5)}%</div>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full transition-all duration-300 ease-out" style={{ width: `${10 + (days)}%` }}></div>
                                </div>

                                <div className="flex items-center justify-between text-sm mt-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone size={16} /> Website Calls
                                    </div>
                                    <div className="font-bold text-gray-900">{calls} / mo</div>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full transition-all duration-300 ease-out" style={{ width: `${20 + (days * 0.8)}%` }}></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Floating Badge */}
                        <div className={`absolute -right-4 top-10 bg-[#FFBA49] text-[#23001E] font-bold text-xs px-3 py-1 rounded-full shadow-lg transform rotate-12 transition-all duration-500 ${days > 30 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                            Competitors Panicking!
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const HowItWorksPage: React.FC = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    document.title = "How It Works | MoreStars";
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
        gsap.from('.step-card', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '.steps-container',
                start: 'top 80%'
            }
        });
        
        gsap.from('.comparison-row', {
            x: -20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: {
                trigger: '.comparison-section',
                start: 'top 75%'
            }
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen font-sans bg-[#F9F7FA]" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-20 bg-[#F9F7FA] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-100/30 to-transparent pointer-events-none"></div>
           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
               <div className="inline-flex items-center gap-2 py-1 px-4 rounded-full bg-[#23001E] text-[#FFBA49] text-sm font-bold tracking-wide uppercase mb-8 shadow-md">
                    <Zap size={14} fill="currentColor" /> The 30-Second Reputation Machine
               </div>
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                   Stop Chasing Customers. <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                       Start Automating Them.
                   </span>
               </h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                   You did the hard work of making them happy. Now let our software do the easy work of getting the review. No awkward conversations. No tech skills needed.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                   <button className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 bg-[#FFBA49] text-[#23001E]">
                        Start Free Trial <ArrowRight size={20} />
                   </button>
                   <p className="text-sm text-gray-500 self-center font-medium mt-2 sm:mt-0">
                       No credit card • Cancel anytime
                   </p>
               </div>
           </div>
        </section>

        {/* --- NEW VISUAL: Before/After Slider --- */}
        <BeforeAfterListing />

        {/* --- The "Old Way" vs "New Way" --- */}
        <section className="py-20 bg-white comparison-section border-t border-gray-100">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Why You're Not Getting Reviews Now</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 lg:gap-16 relative">
                    {/* The Hard Way */}
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 opacity-70 hover:opacity-100 transition-opacity">
                        <h3 className="text-xl font-bold text-gray-500 mb-6 flex items-center gap-2"><XCircle className="text-red-400"/> The Hard Way</h3>
                        <div className="space-y-6">
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><Clock size={18} className="text-gray-400"/></div>
                                <p className="text-sm text-gray-600">You forget to ask because you're busy running a business.</p>
                            </div>
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><MessageSquare size={18} className="text-gray-400"/></div>
                                <p className="text-sm text-gray-600">Asking face-to-face feels awkward and desperate.</p>
                            </div>
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><MousePointerClick size={18} className="text-gray-400"/></div>
                                <p className="text-sm text-gray-600">Customers say "I will!" but forget the moment they leave.</p>
                            </div>
                        </div>
                    </div>

                    {/* The VS Badge */}
                    <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#23001E] text-white rounded-full items-center justify-center font-bold border-4 border-white z-10">VS</div>

                    {/* The MoreStars Way */}
                    <div className="bg-[#F9F7FA] p-8 rounded-3xl border-2 border-purple-100 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        <h3 className="text-xl font-bold text-[#23001E] mb-6 flex items-center gap-2"><CheckCircle className="text-green-500"/> The MoreStars Way</h3>
                        <div className="space-y-6 relative z-10">
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><Zap size={18} className="text-[#FFBA49]"/></div>
                                <p className="text-base font-medium text-gray-800">It happens automatically. You don't even have to think about it.</p>
                            </div>
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><Smartphone size={18} className="text-[#FFBA49]"/></div>
                                <p className="text-base font-medium text-gray-800">The request arrives on their phone, where they spend all their time.</p>
                            </div>
                            <div className="comparison-row flex gap-4 items-start">
                                <div className="mt-1"><Star size={18} className="text-[#FFBA49]"/></div>
                                <p className="text-base font-medium text-gray-800">One tap takes them directly to Google. Zero friction.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- The 3 Steps (Visual) --- */}
        <section className="py-24 bg-[#23001E] text-white steps-container">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6">It's Ridiculously Simple</h2>
                    <p className="text-lg text-gray-300">If you can send a text message, you're overqualified to use MoreStars.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent border-t border-dashed border-gray-600 opacity-50"></div>

                    {/* Step 1: Input */}
                    <div className="step-card relative">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-2xl mb-8 mx-auto shadow-lg shadow-blue-500/20 z-10 relative">1</div>
                        <h3 className="text-xl font-bold mb-4 text-center">Enter a Number</h3>
                        <p className="text-gray-400 text-center mb-8 text-sm">Type in your customer's name and phone number. Or, connect your POS to do this automatically.</p>
                        
                        {/* Mockup */}
                        <div className="bg-white rounded-xl p-4 shadow-xl text-gray-800 max-w-xs mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                            <div className="text-xs font-bold text-gray-400 uppercase mb-2">New Request</div>
                            <div className="space-y-3">
                                <div className="bg-gray-100 rounded px-3 py-2 text-sm border border-gray-200">Sarah Johnson</div>
                                <div className="bg-gray-100 rounded px-3 py-2 text-sm border border-gray-200">(555) 123-4567</div>
                                <div className="bg-[#23001E] text-white text-center rounded py-2 text-sm font-bold shadow-md cursor-pointer hover:bg-opacity-90">Send Request</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: The Text */}
                    <div className="step-card relative">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center text-white font-bold text-2xl mb-8 mx-auto shadow-lg shadow-purple-500/20 z-10 relative">2</div>
                        <h3 className="text-xl font-bold mb-4 text-center">They Get a Friendly Text</h3>
                        <p className="text-gray-400 text-center mb-8 text-sm">It feels personal, not automated. It arrives immediately or whenever you schedule it.</p>
                        
                        {/* Mockup */}
                        <div className="bg-white rounded-2xl p-2 shadow-xl max-w-[240px] mx-auto border-4 border-gray-800 transform rotate-[2deg] hover:rotate-0 transition-transform duration-300">
                            <div className="bg-gray-50 rounded-xl p-4 h-48 flex flex-col justify-end">
                                <div className="bg-[#3B82F6] text-white text-xs p-3 rounded-2xl rounded-bl-none shadow-sm mb-2">
                                    Hi Sarah! Thanks for choosing us today. Mind leaving a quick review? 
                                    <span className="underline block mt-1 text-blue-100">morestars.io/link</span>
                                </div>
                                <div className="text-[10px] text-gray-400 text-center mt-1">Delivered</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: The Result */}
                    <div className="step-card relative">
                        <div className="w-16 h-16 rounded-2xl bg-[#FFBA49] flex items-center justify-center text-[#23001E] font-bold text-2xl mb-8 mx-auto shadow-lg shadow-orange-500/20 z-10 relative">3</div>
                        <h3 className="text-xl font-bold mb-4 text-center">One Tap to 5 Stars</h3>
                        <p className="text-gray-400 text-center mb-8 text-sm">No login required. No navigating menus. They land right on your Google review form.</p>
                        
                        {/* Mockup */}
                        <div className="bg-white rounded-xl p-4 shadow-xl text-gray-800 max-w-xs mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">G</div>
                                <div>
                                    <div className="text-xs font-bold">Your Business</div>
                                    <div className="text-[10px] text-gray-500">Posting publicly</div>
                                </div>
                            </div>
                            <div className="flex justify-center gap-1 mb-3 text-yellow-400">
                                <Star fill="currentColor" size={24} />
                                <Star fill="currentColor" size={24} />
                                <Star fill="currentColor" size={24} />
                                <Star fill="currentColor" size={24} />
                                <Star fill="currentColor" size={24} />
                            </div>
                            <div className="text-xs text-gray-400 text-center mb-2">Share details of your experience...</div>
                            <div className="w-full h-8 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center">Post</div>
                            
                            {/* Success Overlay Animation Effect */}
                            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <div className="text-white text-center">
                                    <ThumbsUp size={32} className="mx-auto mb-2"/>
                                    <div className="font-bold">Review Posted!</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- NEW VISUAL: Anatomy of Request --- */}
        <AnatomyOfRequest />

        {/* --- The "Set & Forget" Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-block py-1 px-3 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide mb-4">
                            Automation
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                            Set It Up Once. <br/> Grow Forever.
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Don't have time to enter phone numbers? Connect your Point of Sale system. MoreStars detects when you complete a sale and schedules the text automatically.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">Square</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Connect Square</h4>
                                    <p className="text-xs text-gray-500">Auto-send after transactions.</p>
                                </div>
                                <div className="ml-auto text-green-500 font-bold text-xs uppercase bg-green-50 px-2 py-1 rounded">Active</div>
                            </div>
                            <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-[#95BF47] rounded-lg flex items-center justify-center text-white font-bold text-xs">Shopify</div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Connect Shopify</h4>
                                    <p className="text-xs text-gray-500">Auto-send after fulfillment.</p>
                                </div>
                                <div className="ml-auto text-gray-400 font-bold text-xs uppercase bg-gray-50 px-2 py-1 rounded">Connect</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-10 rounded-[3rem] text-center border border-gray-100">
                        <h3 className="text-2xl font-bold mb-8" style={{ color: COLORS.dark }}>This is your new daily routine:</h3>
                        <div className="space-y-8 relative">
                            {/* Dotted Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-0.5 border-l-2 border-dashed border-gray-300"></div>

                            <div className="flex gap-6 items-center text-left relative z-10">
                                <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center font-bold text-gray-400">1</div>
                                <div>
                                    <p className="font-bold text-gray-900">Serve your customers</p>
                                    <p className="text-sm text-gray-500">Do what you do best.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-center text-left relative z-10">
                                <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center font-bold text-gray-400">2</div>
                                <div>
                                    <p className="font-bold text-gray-900">Go home & relax</p>
                                    <p className="text-sm text-gray-500">Seriously. That's it.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-center text-left relative z-10">
                                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
                                    <Star fill="currentColor" size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Watch phone light up</p>
                                    <p className="text-sm text-gray-500">MoreStars does the work in the background.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- NEW VISUAL: Channel Comparison --- */}
        <ChannelComparison />

        {/* --- GROWTH SIMULATOR INSERTED HERE --- */}
        <GrowthSimulator />

        {/* --- QR Codes Section --- */}
        <section className="py-24 bg-[#F9F7FA]">
            <div className="max-w-5xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-extrabold mb-12" style={{ color: COLORS.dark }}>Don't Have Phone Numbers? Use QR Codes.</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 transform hover:-translate-y-1 transition-transform">
                        <div className="h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-xs">
                            <span className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200">Receipt Image</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">On Receipts</h3>
                        <p className="text-sm text-gray-600">Great for restaurants and retail. Print it right at the bottom.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 transform hover:-translate-y-1 transition-transform">
                        <div className="h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-xs">
                            <span className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200">Table Tent Image</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">On Counters</h3>
                        <p className="text-sm text-gray-600">Reception desks, waiting rooms, or cafe tables.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 transform hover:-translate-y-1 transition-transform">
                        <div className="h-40 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-xs">
                            <span className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200">Card Image</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">On Business Cards</h3>
                        <p className="text-sm text-gray-600">Hand them to happy clients as you say goodbye.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ / Objection Handling --- */}
        <section className="py-24 bg-white">
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-3xl font-extrabold mb-12 text-center" style={{ color: COLORS.dark }}>Common "What Ifs"</h2>
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">?</div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">What if they leave a bad review?</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Unhappy customers are already leaving reviews. They don't need encouragement. MoreStars helps your <strong>happy</strong> customers speak up. When you get 50 positive reviews, one negative review becomes meaningless noise.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">?</div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">Is this safe for my Google account?</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Yes. 100%. We follow Google's terms strictly. We don't buy fake reviews. We don't "gate" reviews (filter out bad ones). We simply give real customers a direct link to your real profile.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">?</div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">What if I'm not tech savvy?</h4>
                            <p className="text-gray-600 leading-relaxed">
                                We built this for you. If you can send an email, you can use MoreStars. The dashboard has essentially two buttons: "Send Request" and "Download QR Code."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 relative overflow-hidden" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Ready to dominate your local market?
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                 Setup takes 5 minutes. Your first 14 days are on us.
              </p>
              <div className="flex justify-center">
                  <button 
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </button>
              </div>
              <p className="mt-6 text-sm font-bold opacity-75" style={{ color: COLORS.dark }}>
                 1,000 SMS credits included • No credit card required
              </p>
           </div>
        </section>
    </div>
  );
};

export default HowItWorksPage;
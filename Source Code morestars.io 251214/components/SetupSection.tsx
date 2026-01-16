import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ThumbsUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';
import MapSimulator from './MapSimulator';

gsap.registerPlugin(ScrollTrigger);

const SetupSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo('.setup-header', 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: '.setup-header',
            start: 'top 80%',
          }
        }
      );

      // Steps Animation
      gsap.fromTo('.setup-step', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.steps-container',
            start: 'top 75%',
          }
        }
      );

      // Line Reveal Animation (Scales the container)
      gsap.fromTo('.connecting-line', 
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.steps-container',
            start: 'top 75%',
          }
        }
      );

      // CTA Animation
      gsap.fromTo('.setup-cta', 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.steps-container',
            start: 'top 60%',
          }
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="setup" className="py-24 overflow-hidden" style={{ backgroundColor: '#F9F7FA' }}>
      <style>{`
        @keyframes flowRight {
          from { background-position: 0 center; }
          to { background-position: 24px center; }
        }
        @keyframes superGlow {
          0% {
            box-shadow: 0 0 5px rgba(255, 186, 73, 0.6), 0 0 10px rgba(255, 186, 73, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 186, 73, 0.8), 0 0 60px rgba(255, 186, 73, 0.5);
          }
          100% {
            box-shadow: 0 0 5px rgba(255, 186, 73, 0.6), 0 0 10px rgba(255, 186, 73, 0.3);
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="setup-header text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
            It's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBA49] to-orange-500">Ridiculously Simple</span>
          </h2>
          <p className="text-xl text-gray-600">
            If you can send a text message, you're overqualified to use MoreStars.
          </p>
        </div>

        {/* Steps Container */}
        <div className="steps-container relative">
            
            {/* Connecting Line (Desktop Only) */}
            <div className="hidden md:block absolute top-4 left-[16%] right-[16%] h-0.5 z-0 connecting-line origin-left overflow-hidden">
                <div 
                    className="w-full h-full"
                    style={{
                        backgroundImage: 'linear-gradient(90deg, #CBD5E1 50%, transparent 50%)',
                        backgroundSize: '24px 100%',
                        animation: 'flowRight 1s linear infinite'
                    }}
                ></div>
            </div>

            <div className="grid md:grid-cols-3 gap-12 lg:gap-16 mb-20">
                
                {/* Step 1 */}
                <div className="setup-step flex flex-col items-center text-center group">
                    <div className="px-6 py-2 rounded-full bg-[#3B82F6] shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)] flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest mb-8 z-10 relative transition-transform group-hover:scale-105 duration-300">
                        Step 1
                    </div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Enter a Number</h3>
                    <p className="text-gray-600 mb-10 text-sm leading-relaxed px-4">
                        Type in your customer's name and phone number. Or, connect your POS to do this automatically.
                    </p>
                    
                    {/* Visual 1: Input Form */}
                    <div className="w-full max-w-[300px] mx-auto bg-white p-5 rounded-2xl shadow-xl border border-gray-100 transform rotate-[-2deg] transition-transform group-hover:rotate-0 duration-500">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-left">New Request</div>
                        <div className="space-y-3">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-left">
                                <span className="text-gray-800 text-sm font-medium">Sarah Johnson</span>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-left">
                                <span className="text-gray-800 text-sm font-medium">(555) 123-4567</span>
                            </div>
                            <div className="bg-[#3B82F6] text-white rounded-lg py-2.5 text-sm font-bold shadow-md">
                                Send Request
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="setup-step flex flex-col items-center text-center group">
                    <div className="px-6 py-2 rounded-full bg-[#A855F7] shadow-[0_10px_25px_-5px_rgba(168,85,247,0.4)] flex items-center justify-center text-white text-xs font-bold uppercase tracking-widest mb-8 z-10 relative transition-transform group-hover:scale-105 duration-300">
                        Step 2
                    </div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>They Get a Friendly Text</h3>
                    <p className="text-gray-600 mb-10 text-sm leading-relaxed px-4">
                        It feels personal, not automated. It arrives immediately or whenever you schedule it.
                    </p>
                    
                    {/* Visual 2: Phone Bubble */}
                    <div className="w-full max-w-[280px] mx-auto bg-white p-2 rounded-3xl shadow-xl border-4 border-gray-100 transform rotate-[2deg] transition-transform group-hover:rotate-0 duration-500">
                        <div className="bg-gray-50 rounded-2xl p-4 h-[180px] flex flex-col justify-end items-end relative overflow-hidden">
                            <div className="bg-[#3B82F6] text-white text-xs p-3 rounded-2xl rounded-tr-none shadow-sm text-left leading-relaxed mb-1 relative z-10">
                                Hi Sarah! Thanks for choosing us today. Mind leaving a quick review? 
                                <br />
                                <span className="underline text-blue-100 font-semibold cursor-pointer">morestars.io/link</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mr-1">Delivered</span>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="setup-step flex flex-col items-center text-center group">
                    <div className="px-6 py-2 rounded-full bg-[#FFBA49] shadow-[0_10px_25px_-5px_rgba(255,186,73,0.4)] flex items-center justify-center text-[#23001E] text-xs font-bold uppercase tracking-widest mb-8 z-10 relative transition-transform group-hover:scale-105 duration-300">
                        Step 3
                    </div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>One Tap to 5 Stars</h3>
                    <p className="text-gray-600 mb-10 text-sm leading-relaxed px-4">
                        No login required. No navigating menus. They land right on your Google review form.
                    </p>
                    
                    {/* Visual 3: Google Review Card */}
                    <div className="w-full max-w-[300px] mx-auto bg-white p-5 rounded-2xl shadow-xl border border-gray-100 transform rotate-[-1deg] transition-transform group-hover:rotate-0 duration-500 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-lg">
                                G
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-900 text-sm">Your Business</div>
                                <div className="text-[10px] text-gray-500">Posting publicly</div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={28} className="text-[#FFBA49] fill-current cursor-pointer hover:scale-110 transition-transform" />
                            ))}
                        </div>
                        
                        <div className="text-xs text-gray-400 text-left mb-4 px-2">
                            Share details of your own experience at this place...
                        </div>

                        <div className="w-full h-9 bg-[#1A73E8] rounded text-white text-sm font-bold flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                            Post
                        </div>

                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <ThumbsUp size={24} />
                            </div>
                            <span className="font-bold text-gray-900">Review Posted!</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Comparison Simulator Inserted Here */}
            <MapSimulator />

            {/* CTA Button */}
            <div className="setup-cta text-center opacity-0">
              <Link to="/pricing" 
                className="inline-flex items-center gap-3 px-12 py-6 bg-[#FFBA49] text-[#23001E] text-2xl font-bold rounded-full hover:scale-105 transition-all duration-300 transform"
                style={{
                    animation: 'superGlow 2s infinite ease-in-out'
                }}
              >
                Start Getting More Stars <ArrowRight size={28} strokeWidth={3} />
              </Link>
              <p className="mt-6 text-sm text-gray-500 font-medium tracking-wide">
                14-day free trial • No credit card required • Setup in 5 mins
              </p>
            </div>

        </div>

      </div>
    </section>
  );
};

export default SetupSection;
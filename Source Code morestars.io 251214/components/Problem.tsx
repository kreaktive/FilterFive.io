import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS, PRICING } from '../constants';
import { Star, AlertTriangle, TrendingDown, Check, ArrowRight } from 'lucide-react';

const Problem: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate left side content stagger
      gsap.from('.problem-content > *', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
        }
      });

      // Animate right side visual
      gsap.from('.problem-visual', {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: '.problem-visual',
          start: 'top 80%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 bg-[#F9F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            
          {/* Left Column: The Problem */}
          <div className="space-y-8 problem-content">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: COLORS.dark }}>
              It's Not Your Fault. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBA49] to-orange-500">
                But We Fix That.
              </span>
            </h2>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 transition-transform hover:scale-[1.02]">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            <span className="font-bold text-green-600">99% of your customers are happy</span>. They meant to leave a review. They just... didn't.
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 transition-transform hover:scale-[1.02]">
                     <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Meanwhile, the one customer who had a bad day? <span className="font-bold text-red-600">They found your Google page just fine.</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 transition-transform hover:scale-[1.02]">
                     <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                         <p className="text-lg text-gray-700 leading-relaxed font-medium">
                            That's why your online reputation doesn't reflect how good you actually are and you're losing customers to competitors.
                        </p>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Pricing Card (formerly Dashboard Graphic) */}
          <div className="relative problem-visual flex justify-center lg:justify-end">
             <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 w-full max-w-md relative overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.dark }}>One New Customer Pays for This</h3>
                        
                        {/* Toggle */}
                        <div className="inline-flex bg-gray-100 p-1 rounded-full mb-2">
                            <button 
                                onClick={() => setIsAnnual(false)}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${!isAnnual ? 'bg-white shadow-md text-[#23001E]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Monthly
                            </button>
                            <button 
                                onClick={() => setIsAnnual(true)}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isAnnual ? 'bg-white shadow-md text-[#23001E]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Yearly <span className="text-green-600 text-xs ml-1">-17%</span>
                            </button>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-6xl font-extrabold tracking-tight" style={{ color: COLORS.dark }}>
                                ${isAnnual ? Math.round(PRICING.annual / 12) : PRICING.monthly}
                            </span>
                            <span className="text-xl text-gray-400 font-medium">/mo</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 font-medium">
                            {isAnnual ? `Billed $${PRICING.annual} yearly` : 'No contracts. Cancel anytime.'}
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {[
                            "1,000 SMS requests/month",
                            "Unlimited QR codes (free to print)",
                            "Google, Facebook, Yelp & more",
                            "Every feature included. No upsells.",
                            "See exactly what's working"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="text-gray-600 font-medium text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.gold, color: COLORS.dark }}>
                        Start Free Trial <ArrowRight size={20} />
                    </button>
                    
                    <p className="text-center text-xs text-gray-400 mt-4 font-medium">
                        14-day free trial • No credit card • Setup in 5 minutes
                    </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
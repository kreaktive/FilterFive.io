import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS } from '../constants';
import { TrendingUp } from 'lucide-react';

const SocialProof: React.FC = () => {
  const [customers, setCustomers] = useState(150);
  const conversionRate = 0.80; // 80% conversion
  const monthlyReviews = Math.round(customers * conversionRate);
  const yearlyReviews = monthlyReviews * 12;

  // Calculate percentage of max for slider background gradient
  const sliderPercentage = (customers / 1000) * 100;

  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate header and stats first now
      gsap.from(['.sp-header', '.stat-item'], {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.sp-header',
          start: 'top 85%',
        }
      });

      // Animate calculator second
      gsap.from('.calculator-card', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: '.calculator-card',
          start: 'top 85%',
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative" style={{ backgroundColor: COLORS.dark }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Header & Stats - Now First */}
        <h2 className="sp-header text-3xl md:text-4xl font-extrabold mb-12 text-white">
          The Numbers Don't Lie
        </h2>
        
        <div className="stats-container grid md:grid-cols-3 gap-8 mb-20">
          <div className="stat-item p-6">
            <div className="text-5xl font-extrabold mb-2" style={{ color: COLORS.gold }}>88%</div>
            <p className="text-lg text-gray-300">of consumers trust online reviews as much as personal recommendations.</p>
          </div>
          
          <div className="stat-item p-6 border-t md:border-t-0 md:border-l border-white/10">
            <div className="text-5xl font-extrabold mb-2" style={{ color: COLORS.gold }}>28%</div>
            <p className="text-lg text-gray-300">more clicks go to businesses with 4.5+ stars vs. 4.0 stars.</p>
          </div>

          <div className="stat-item p-6 border-t md:border-t-0 md:border-l border-white/10">
            <div className="text-5xl font-extrabold mb-2" style={{ color: COLORS.gold }}>5 min</div>
            <p className="text-lg text-gray-300">to set up MoreStars and send your first request.</p>
          </div>
        </div>

        {/* Calculator Section - Now Second */}
        <div className="w-full relative z-20">
            {/* Outer Card: Purple Background */}
            <div className="calculator-card border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden text-left" style={{ backgroundColor: COLORS.dark }}>
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBA49] rounded-full blur-[100px] opacity-10 pointer-events-none -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none -ml-32 -mb-32"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 text-left">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">See What You're Missing</h3>
                            <p className="text-gray-400">Drag the slider to see how many reviews you could be getting.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-12 gap-12 items-center">
                        {/* Input Side */}
                        <div className="md:col-span-7 space-y-8">
                            <div>
                                <div className="flex justify-between text-gray-300 font-medium mb-4">
                                    <span>Monthly Customers</span>
                                    <span className="text-[#FFBA49] font-mono text-xl bg-white/10 px-3 py-1 rounded-lg">{customers}</span>
                                </div>
                                
                                {/* Slider Container */}
                                <div className="relative h-12 w-full flex items-center">
                                    {/* Invisible Native Input (The actual functional part) */}
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1000" 
                                        step="1"
                                        value={customers} 
                                        onChange={(e) => setCustomers(parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                        aria-label="Monthly Customers"
                                    />
                                    
                                    {/* Visual Track Background */}
                                    <div className="absolute w-full h-4 bg-gray-700/50 rounded-full overflow-hidden z-10 pointer-events-none">
                                        {/* Colored Fill */}
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#FFBA49] to-[#FFD587]"
                                            style={{ width: `${sliderPercentage}%` }}
                                        ></div>
                                    </div>

                                    {/* Visual Thumb Handle */}
                                    <div 
                                        className="absolute h-8 w-8 bg-white border-4 border-[#FFBA49] rounded-full shadow-lg z-20 pointer-events-none flex items-center justify-center"
                                        style={{ 
                                            left: `calc(${sliderPercentage}% - 16px)` // -16px is half of width (32px)
                                        }}
                                    >
                                        <div className="w-2 h-2 bg-[#FFBA49] rounded-full"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                                    <span>0</span>
                                    <span>500</span>
                                    <span>1000+</span>
                                </div>
                            </div>
                        </div>

                        {/* Result Side - Inner Card: White Background */}
                        <div className="md:col-span-5">
                            <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-2xl transform transition-transform hover:scale-105 duration-300 h-full flex flex-col justify-center">
                                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Potential Growth</p>
                                <div className="flex flex-col mb-6">
                                    <span className="text-6xl font-extrabold text-[#23001E] mb-1">+{monthlyReviews}</span>
                                    <span className="text-xl font-bold text-gray-400">reviews/mo</span>
                                </div>
                                
                                <div className="h-px w-full bg-gray-100 my-6"></div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full text-[#23001E] bg-[#FFBA49]">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-[#23001E]">+{yearlyReviews}</p>
                                        <p className="text-sm text-gray-500 font-medium">New reviews in 12 months</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
};

export default SocialProof;
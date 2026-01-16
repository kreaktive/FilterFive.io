import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Check, MousePointer2 } from 'lucide-react';
import { COLORS } from '../constants';

const FinalCTA: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <section className="py-24 bg-white relative z-10">
      {/* Animation definition for border pulse */}
      <style>{`
        @keyframes border-pulse {
          0%, 100% { border-color: #FFBA49; }
          50% { border-color: #FFE6B3; } /* Lighter gold */
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          className="relative rounded-[3rem] overflow-hidden group transition-all duration-500 hover:-translate-y-2 border-[5px]"
          style={{
            backgroundColor: COLORS.dark,
            // Initial shadow (yellowish but subtle)
            boxShadow: `0 25px 50px -12px ${COLORS.gold}40`,
            // Animated border
            animation: 'border-pulse 3s infinite ease-in-out'
          }}
        >
          {/* Glowing Shadow Element (intensifies on hover) - projected via pseudo-element effect */}
          <div 
             className="absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
             style={{
                boxShadow: `0 0 100px 0px ${COLORS.gold}60`,
                zIndex: -1
             }}
          />

          {/* Mouse Follow Gradient */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 186, 73, 0.15), transparent 40%)`
            }}
          />
          
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          </div>

          <div className="relative z-10 px-6 py-16 md:px-12 md:py-24 text-center">
              {/* Lost Revenue Frame */}
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
                 You Missed ~3 Reviews Today.
              </h2>
              <p className="text-xl md:text-2xl font-medium mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed text-gray-200">
                  Every day you wait is a 5-star review that vanishes forever. Stop the leak.
              </p>

              {/* Setup Timer */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-6 text-sm font-bold mb-10 bg-white/5 inline-flex py-3 px-6 rounded-full backdrop-blur-sm mx-auto border border-white/10 shadow-lg">
                 <div className="flex items-center gap-2 text-white">
                   <div className="w-6 h-6 rounded-full bg-[#FFBA49] text-[#23001E] flex items-center justify-center text-xs shadow-sm">1</div>
                   <span>Create Account</span>
                 </div>
                 <div className="hidden md:block text-white/20">→</div>
                 <div className="flex items-center gap-2 text-white">
                   <div className="w-6 h-6 rounded-full bg-[#FFBA49] text-[#23001E] flex items-center justify-center text-xs shadow-sm">2</div>
                   <span>Paste Link</span>
                 </div>
                 <div className="hidden md:block text-white/20">→</div>
                 <div className="flex items-center gap-2 text-white">
                   <div className="w-6 h-6 rounded-full bg-[#FFBA49] text-[#23001E] flex items-center justify-center text-xs shadow-sm">3</div>
                   <span>Send</span>
                 </div>
                 <div className="md:ml-4 flex items-center gap-1 text-[#FFBA49] bg-[#FFBA49]/10 px-3 py-1 rounded-full border border-[#FFBA49]/20">
                    <Clock size={14} /> <span>4m 30s</span>
                 </div>
              </div>

              {/* ROI Anchor */}
              <div className="mb-8 text-[#FFBA49] font-serif italic text-lg md:text-xl">
                 "If this gets you just ONE new customer, it pays for itself."
              </div>

              <Link to="/pricing">
                  <button 
                    className="px-10 md:px-14 py-5 rounded-full text-xl font-bold shadow-[0_0_30px_rgba(255,186,73,0.3)] transition-all transform hover:scale-105 bg-[#FFBA49] text-[#23001E] hover:bg-white flex items-center gap-3 mx-auto group/btn"
                  >
                     Start Free Trial <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
              </Link>

              {/* Visual Guarantee Badges */}
              <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm font-bold text-gray-400">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={16} className="text-[#FFBA49]" /> 14-Day Free Trial • 5 Free SMS Included
                  </div>
                  <div className="flex items-center gap-2">
                     <Check size={16} className="text-[#FFBA49]" /> No Credit Card Required
                  </div>
                  <div className="flex items-center gap-2">
                     <MousePointer2 size={16} className="text-[#FFBA49]" /> Cancel Anytime
                  </div>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
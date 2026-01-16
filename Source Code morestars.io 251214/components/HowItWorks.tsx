import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Send, MousePointerClick, TrendingUp, Zap } from 'lucide-react';
import { COLORS } from '../constants';

const stepsData = [
  {
    step: "Step 1",
    title: "You Ask (Automatically)",
    desc: "Send a text via our dashboard, connect your POS, or let customers scan a QR code at checkout.",
    icon: <Send />,
    colorClass: "bg-indigo-50 text-indigo-600",
    borderColor: "border-indigo-100",
    hoverColor: "rgba(99, 102, 241, 0.1)",
    shadowColor: "rgba(99, 102, 241, 0.25)"
  },
  {
    step: "Step 2",
    title: "They Click (Instantly)",
    desc: "No login required. One tap opens your Google review form directly. Friction is gone.",
    icon: <MousePointerClick />,
    colorClass: "bg-yellow-50 text-yellow-600",
    borderColor: "border-yellow-100",
    hoverColor: "rgba(234, 179, 8, 0.1)",
    shadowColor: "rgba(234, 179, 8, 0.25)"
  },
  {
    step: "Step 3",
    title: "You Grow (Visibly)",
    desc: "Watch your rating climb, SEO improve, and new customers choose you over competitors.",
    icon: <TrendingUp />,
    colorClass: "bg-teal-50 text-teal-600",
    borderColor: "border-teal-100",
    hoverColor: "rgba(20, 184, 166, 0.1)",
    shadowColor: "rgba(20, 184, 166, 0.25)"
  }
];

const StepCard: React.FC<{ step: typeof stepsData[0] }> = ({ step }) => {
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
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`step-card relative bg-white p-8 rounded-3xl border ${step.borderColor} shadow-sm hover:shadow-[0_20px_50px_-12px_var(--shadow-color)] transition-all duration-500 group hover:-translate-y-2 overflow-hidden flex flex-col h-full flex-1 w-full`}
      style={{
        '--shadow-color': step.shadowColor
      } as React.CSSProperties}
    >
      {/* Mouse Follow Gradient */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${step.hoverColor}, transparent 40%)`
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.colorClass} group-hover:scale-110 transition-transform duration-300`}>
                  {React.cloneElement(step.icon as React.ReactElement<any>, { size: 28 })}
              </div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-full ${step.colorClass}`}>
                  {step.step}
              </span>
          </div>

          <h3 className="font-bold text-xl mb-3" style={{ color: COLORS.dark }}>{step.title}</h3>
          <p className="text-gray-600 leading-relaxed text-[15px] flex-grow">{step.desc}</p>
      </div>
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation - using fromTo for reliability
      gsap.fromTo('.hiw-header', 
        { y: 30, opacity: 0, visibility: 'hidden' },
        {
          y: 0,
          opacity: 1,
          visibility: 'visible',
          duration: 0.8,
          scrollTrigger: {
            trigger: '.hiw-header',
            start: 'top 90%', // Triggers earlier
          }
        }
      );

      // Steps stagger animation - using fromTo for reliability
      gsap.fromTo('.step-card', 
        { y: 50, opacity: 0, visibility: 'hidden' },
        {
          y: 0,
          opacity: 1,
          visibility: 'visible',
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.step-cards-container',
            start: 'top 85%',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="how-it-works" className="py-24" style={{ backgroundColor: COLORS.bgLight }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hiw-header text-center max-w-4xl mx-auto mb-20 opacity-0 invisible">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6 border border-blue-100 shadow-sm">
              <Zap size={14} /> WHAT YOU GET
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
            Reviews on <span className="relative inline-block">
              Autopilot
              <span className="absolute bottom-1 left-0 w-full h-3 opacity-30 -z-10" style={{ backgroundColor: COLORS.gold }}></span>
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set it up once. Watch reviews come in while you run your business. We remove every barrier between your happy customer and a 5-star review.
          </p>
        </div>

        <div className="step-cards-container flex flex-col md:flex-row gap-8">
          {stepsData.map((step, index) => (
            <StepCard key={index} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
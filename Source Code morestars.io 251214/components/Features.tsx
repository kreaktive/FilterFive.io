import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Smartphone, QrCode, BarChart3, MapPin, Zap, Globe, ShieldCheck, Lock, FileCheck } from 'lucide-react';
import { COLORS } from '../constants';

const featuresList = [
  {
    icon: <Smartphone />,
    title: "SMS Review Requests",
    desc: "Send personalized text messages asking for reviews. Choose from friendly, professional, or grateful tones, or write your own. 1,000 messages included every month.",
    colorClass: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-100",
    badgeText: "High Conversion",
    hoverColor: "rgba(37, 99, 235, 0.1)",
    shadowColor: "rgba(37, 99, 235, 0.25)"
  },
  {
    icon: <QrCode />,
    title: "QR Codes",
    desc: "Generate QR codes for your checkout counter, receipts, table tents, or anywhere customers can scan. No phone numbers needed. Unlimited scans.",
    colorClass: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-100",
    badgeText: "Unlimited Scans",
    hoverColor: "rgba(147, 51, 234, 0.1)",
    shadowColor: "rgba(147, 51, 234, 0.25)"
  },
  {
    icon: <BarChart3 />,
    title: "Analytics Dashboard",
    desc: "See how many requests you've sent, who clicked, and your conversion rate. Know exactly what's working. Track everything in one place.",
    colorClass: "bg-green-50 text-green-600",
    borderColor: "border-green-100",
    badgeText: "Real-Time Data",
    hoverColor: "rgba(22, 163, 74, 0.1)",
    shadowColor: "rgba(22, 163, 74, 0.25)"
  },
  {
    icon: <MapPin />,
    title: "Multi-Location Support",
    desc: "Managing multiple locations? Track each one separately. See which locations are getting reviews and which need attention. One dashboard for everything.",
    colorClass: "bg-orange-50 text-orange-600",
    borderColor: "border-orange-100",
    badgeText: "Scalable",
    hoverColor: "rgba(234, 88, 12, 0.1)",
    shadowColor: "rgba(234, 88, 12, 0.25)"
  },
  {
    icon: <Zap />,
    title: "POS Integrations",
    desc: "Connect Square or Shopify. Send review requests automatically after every sale. Set it and forget it. Works with your existing tools.",
    colorClass: "bg-yellow-50 text-yellow-600",
    borderColor: "border-yellow-100",
    badgeText: "Automated",
    hoverColor: "rgba(202, 138, 4, 0.1)",
    shadowColor: "rgba(202, 138, 4, 0.25)"
  },
  {
    icon: <Globe />,
    title: "Works With Any Platform",
    desc: "Google, Facebook, Yelp, TripAdvisor, Vitals... You choose where reviews go, we handle the rest.",
    colorClass: "bg-indigo-50 text-indigo-600",
    borderColor: "border-indigo-100",
    badgeText: "Universal",
    hoverColor: "rgba(79, 70, 229, 0.1)",
    shadowColor: "rgba(79, 70, 229, 0.25)"
  },
  {
    icon: <FileCheck />,
    title: "Google Compliant",
    desc: "MoreStars follows all Google review policies. We help you ask for reviews, and give customers a direct link. No fake reviews. No incentives. No funny business.",
    colorClass: "bg-green-50 text-green-600",
    borderColor: "border-green-100",
    badgeText: "Zero Risk",
    hoverColor: "rgba(22, 163, 74, 0.1)",
    shadowColor: "rgba(22, 163, 74, 0.25)"
  },
  {
    icon: <Smartphone />, 
    title: "SMS Compliant",
    desc: "A2P 10DLC registered. TCPA compliant. Every message includes opt-out instructions. Your customers can unsubscribe anytime.",
    colorClass: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-100",
    badgeText: "10DLC Registered",
    hoverColor: "rgba(37, 99, 235, 0.1)",
    shadowColor: "rgba(37, 99, 235, 0.25)"
  },
  {
    icon: <Lock />,
    title: "Your Data Is Yours",
    desc: "We don't sell customer data. We don't use it for anything except sending your review requests. Your list is your property. Period.",
    colorClass: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-100",
    badgeText: "Encrypted",
    hoverColor: "rgba(147, 51, 234, 0.1)",
    shadowColor: "rgba(147, 51, 234, 0.25)"
  }
];

const FeatureCard: React.FC<{ feature: typeof featuresList[0] }> = ({ feature }) => {
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
      className={`feature-card relative bg-white p-8 rounded-3xl border ${feature.borderColor} shadow-sm hover:shadow-[0_30px_60px_-15px_var(--shadow-color)] transition-all duration-500 group hover:-translate-y-3 overflow-hidden flex flex-col h-full hover:z-20`}
      style={{
        '--shadow-color': feature.shadowColor
      } as React.CSSProperties}
    >
      {/* Mouse Follow Gradient */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.hoverColor}, transparent 40%)`
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feature.colorClass} group-hover:scale-110 transition-transform duration-300`}>
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 28 })}
              </div>
              {feature.badgeText && (
                <span className={`text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-full ${feature.colorClass}`}>
                    {feature.badgeText}
                </span>
              )}
          </div>

          <h3 className="font-bold text-xl mb-3" style={{ color: COLORS.dark }}>{feature.title}</h3>
          <p className="text-gray-600 leading-relaxed text-[15px] flex-grow">{feature.desc}</p>
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  const containerRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in the whole marquee container
      gsap.fromTo('.marquee-container', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '#features',
            start: 'top 80%',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let lastTimestamp = 0;
    
    const scroll = (timestamp: number) => {
      if (!isPaused && scrollContainer) {
        // Scroll 1px roughly every frame to keep it smooth
        
        // Only scroll if we haven't hit the end of the cloned set
        // Reset logic: if we've scrolled past 1/3 of the total width (since we have 3 sets), jump back to 0
        // Total width is roughly 3 * setWidth. 
        // We want to jump back when scrollLeft reaches setWidth.
        
        const setWidth = scrollContainer.scrollWidth / 3;
        
        if (scrollContainer.scrollLeft >= setWidth) {
            scrollContainer.scrollLeft = 0; 
            // Note: If user is actively scrolling near this boundary, this reset might be fighting them.
            // But since !isPaused check is there, it only resets when user IS NOT touching.
        } else {
            scrollContainer.scrollLeft += 1;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <section ref={containerRef} id="features" className="py-24 bg-[#F9F7FA] overflow-hidden">
      <div className="w-full">
        
        {/* Features Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide mb-6 border border-green-100 shadow-sm">
              <ShieldCheck size={14} /> 100% Secure & Compliant
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
            Everything You Need. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBA49] to-orange-500">Nothing You Don't.</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you get more reviews without adding more work to your plate.
          </p>
        </div>

        {/* Features Marquee */}
        <div className="marquee-container w-full relative py-24">
            {/* Fade Edges */}
            <div className="absolute top-0 left-0 w-16 md:w-64 h-full bg-gradient-to-r from-[#F9F7FA] to-transparent z-20 pointer-events-none" />
            <div className="absolute top-0 right-0 w-16 md:w-64 h-full bg-gradient-to-l from-[#F9F7FA] to-transparent z-20 pointer-events-none" />

            <div 
                ref={scrollRef}
                className="flex w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing pb-12 pt-4 px-4"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => {
                    // Small delay before resuming to prevent jumpiness after swipe
                    setTimeout(() => setIsPaused(false), 1000);
                }}
            >
                {/* Render cards thrice to create seamless loop buffer */}
                {[...featuresList, ...featuresList, ...featuresList].map((f, i) => (
                    <div key={i} className="mx-6 w-[380px] h-full flex-shrink-0">
                        <FeatureCard feature={f} />
                    </div>
                ))}
            </div>
        </div>

      </div>

      <style>{`
         .no-scrollbar::-webkit-scrollbar {
           display: none;
         }
         .no-scrollbar {
           -ms-overflow-style: none;
           scrollbar-width: none;
         }
       `}</style>
    </section>
  );
};

export default Features;
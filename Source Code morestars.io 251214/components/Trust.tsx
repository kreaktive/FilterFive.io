import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS } from '../constants';
import { ShieldCheck, Lock, Check, Smartphone, FileCheck } from 'lucide-react';

interface TrustItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  badgeText?: string;
  borderColor: string;
  hoverColor: string;
}

const TrustItem: React.FC<TrustItemProps> = ({ icon, title, description, colorClass, badgeText, borderColor, hoverColor }) => {
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
        className={`trust-card relative bg-white p-8 rounded-3xl border ${borderColor} shadow-sm hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 overflow-hidden`}
    >
        {/* Mouse Follow Gradient */}
        <div 
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${hoverColor}, transparent 40%)`
            }}
        />

        <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                {badgeText && (
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-full ${colorClass}`}>
                        {badgeText}
                    </span>
                )}
            </div>
            
            <h3 className="font-bold text-xl mb-3" style={{ color: COLORS.dark }}>{title}</h3>
            <p className="text-gray-600 leading-relaxed text-[15px]">
                {description}
            </p>
            
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-green-600 transition-colors">
                <Check size={16} strokeWidth={4} className="text-green-500" /> Verified Compliant
            </div>
        </div>
    </div>
  );
};

const Trust: React.FC = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo('.trust-header', 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
              trigger: '.trust-header',
              start: 'top 90%'
          }
        }
      );

      // Cards animation
      gsap.fromTo('.trust-card', 
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.trust-grid',
            start: 'top 85%',
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden border-t border-gray-100" style={{ backgroundColor: '#F9F7FA' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="trust-header text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide mb-6 border border-green-100 shadow-sm">
                <ShieldCheck size={14} /> 100% Secure & Compliant
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                Sleep Soundly. <span className="text-gray-300">You're Covered.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We handle the heavy lifting of compliance so you can focus on running your business. No risks. No grey areas.
            </p>
        </div>

        <div className="trust-grid grid md:grid-cols-3 gap-8">
            <TrustItem 
                icon={<FileCheck size={28} />}
                colorClass="bg-green-50 text-green-600"
                borderColor="border-green-100"
                title="Google Compliant"
                badgeText="Zero Risk"
                description="MoreStars follows all Google review policies. We help you ask for reviews, and give customers a direct link. No fake reviews. No incentives. No funny business."
                hoverColor="rgba(22, 163, 74, 0.1)"
            />

            <TrustItem 
                icon={<Smartphone size={28} />}
                colorClass="bg-blue-50 text-blue-600"
                borderColor="border-blue-100"
                title="SMS Compliant"
                badgeText="10DLC Registered"
                description="A2P 10DLC registered. TCPA compliant. Every message includes opt-out instructions. Your customers can unsubscribe anytime."
                hoverColor="rgba(37, 99, 235, 0.1)"
            />

            <TrustItem 
                icon={<Lock size={28} />}
                colorClass="bg-purple-50 text-purple-600"
                borderColor="border-purple-100"
                title="Your Data Is Yours"
                badgeText="Encrypted"
                description="We don't sell customer data. We don't use it for anything except sending your review requests. Your list is your property. Period."
                hoverColor="rgba(147, 51, 234, 0.1)"
            />
        </div>
      </div>
    </section>
  );
};

export default Trust;
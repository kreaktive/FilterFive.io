import React, { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { Smartphone, QrCode, BarChart3, MapPin, Zap, Globe, Lock, FileCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const featuresList = [
  {
    icon: <Smartphone />,
    title: "SMS Review Requests",
    desc: "Send personalized text messages asking for reviews. Choose from friendly, professional, or grateful tones, or write your own. 1,000 messages included every month.",
    colorClass: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-100",
    badgeText: "High Conversion",
    hoverColor: "rgba(37, 99, 235, 0.1)"
  },
  {
    icon: <QrCode />,
    title: "QR Codes",
    desc: "Generate QR codes for your checkout counter, receipts, table tents, or anywhere customers can scan. No phone numbers needed. Unlimited scans.",
    colorClass: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-100",
    badgeText: "Unlimited Scans",
    hoverColor: "rgba(147, 51, 234, 0.1)"
  },
  {
    icon: <BarChart3 />,
    title: "Analytics Dashboard",
    desc: "See how many requests you've sent, who clicked, and your conversion rate. Know exactly what's working. Track everything in one place.",
    colorClass: "bg-green-50 text-green-600",
    borderColor: "border-green-100",
    badgeText: "Real-Time Data",
    hoverColor: "rgba(22, 163, 74, 0.1)"
  },
  {
    icon: <MapPin />,
    title: "Multi-Location Support",
    desc: "Managing multiple locations? Track each one separately. See which locations are getting reviews and which need attention. One dashboard for everything.",
    colorClass: "bg-orange-50 text-orange-600",
    borderColor: "border-orange-100",
    badgeText: "Scalable",
    hoverColor: "rgba(234, 88, 12, 0.1)"
  },
  {
    icon: <Zap />,
    title: "POS Integrations",
    desc: "Connect Square or Shopify. Send review requests automatically after every sale. Set it and forget it. Works with your existing tools.",
    colorClass: "bg-yellow-50 text-yellow-600",
    borderColor: "border-yellow-100",
    badgeText: "Automated",
    hoverColor: "rgba(202, 138, 4, 0.1)"
  },
  {
    icon: <Globe />,
    title: "Works With Any Platform",
    desc: "Google, Facebook, Yelp, TripAdvisor, Vitals... You choose where reviews go, we handle the rest.",
    colorClass: "bg-indigo-50 text-indigo-600",
    borderColor: "border-indigo-100",
    badgeText: "Universal",
    hoverColor: "rgba(79, 70, 229, 0.1)"
  },
  {
    icon: <FileCheck />,
    title: "Google Compliant",
    desc: "MoreStars follows all Google review policies. We help you ask for reviews, and give customers a direct link. No fake reviews. No incentives. No funny business.",
    colorClass: "bg-green-50 text-green-600",
    borderColor: "border-green-100",
    badgeText: "Zero Risk",
    hoverColor: "rgba(22, 163, 74, 0.1)"
  },
  {
    icon: <Smartphone />, 
    title: "SMS Compliant",
    desc: "A2P 10DLC registered. TCPA compliant. Every message includes opt-out instructions. Your customers can unsubscribe anytime.",
    colorClass: "bg-blue-50 text-blue-600",
    borderColor: "border-blue-100",
    badgeText: "10DLC Registered",
    hoverColor: "rgba(37, 99, 235, 0.1)"
  },
  {
    icon: <Lock />,
    title: "Your Data Is Yours",
    desc: "We don't sell customer data. We don't use it for anything except sending your review requests. Your list is your property. Period.",
    colorClass: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-100",
    badgeText: "Encrypted",
    hoverColor: "rgba(147, 51, 234, 0.1)"
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
      className={`feature-card-item relative bg-white p-8 rounded-3xl border ${feature.borderColor} shadow-sm hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 overflow-hidden flex flex-col h-full`}
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

const FeaturesPage: React.FC = () => {
  useEffect(() => {
    document.title = "Features | MoreStars Review Software";
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
        gsap.from('.features-hero-content', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        });

        // Use fromTo for more reliability with ScrollTrigger
        gsap.fromTo('.feature-card-item', 
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.features-grid',
                    start: 'top 90%' // Trigger earlier
                }
            }
        );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-20 bg-gray-50 border-b border-gray-200">
           <div className="max-w-4xl mx-auto px-4 text-center features-hero-content">
               <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                    Powerful & Simple
               </div>
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                   Everything You Need to <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Grow Your Reputation</span>
               </h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                   We stripped away the complexity of enterprise tools and kept the features that actually get results.
               </p>
               <div className="flex justify-center">
                   <Link to="/pricing" className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-[#23001E] text-white flex items-center gap-2">
                       Start Free Trial <ArrowRight size={20} />
                   </Link>
               </div>
           </div>
        </section>

        {/* --- Features Grid --- */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="features-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresList.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} />
                    ))}
                </div>
            </div>
        </section>

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Ready to dominate your local market?
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                 All features included. No tiered pricing. One simple plan.
              </p>
              <div className="flex justify-center">
                  <Link to="/pricing" 
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </Link>
              </div>
              <p className="mt-6 text-sm font-bold opacity-75" style={{ color: COLORS.dark }}>
                 14-day free trial. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
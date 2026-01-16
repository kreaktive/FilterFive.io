import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { COLORS } from '../constants';

const NOTIFICATIONS = [
  { name: "Sarah J.", time: "Just now", source: "Google Reviews" },
  { name: "Mike T.", time: "2m ago", source: "Yelp" },
  { name: "Jessica R.", time: "15m ago", source: "Vitals.com" },
  { name: "David L.", time: "4h ago", source: "TripAdvisor" },
  { name: "Emily W.", time: "1h ago", source: "Facebook" }
];

const ReviewNotification = () => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (containerRef.current) {
        const tl = gsap.timeline();
        
        // Animate out
        tl.to(containerRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 10,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            setIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
          }
        })
        // Animate in
        .fromTo(containerRef.current,
          { opacity: 0, scale: 0.9, y: -10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
      }
    }, 3000); // Slightly longer than 2s to allow reading time with the larger animation

    return () => clearInterval(interval);
  }, []);

  const data = NOTIFICATIONS[index];

  return (
    <div 
      ref={containerRef} 
      className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm transition-all"
    >
       <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
         <Star className="w-4 h-4 text-green-600 fill-current" />
       </div>
       <div className="text-sm">
          <p className="font-bold" style={{ color: COLORS.dark }}>New 5-Star in {data.source}</p>
          <p className="text-gray-500">{data.time} from {data.name}</p>
       </div>
    </div>
  );
};

const Hero: React.FC = () => {
  const containerRef = useRef(null);
  const reviewsRef = useRef<HTMLParagraphElement>(null);
  const monthlyReviewsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate text content
      gsap.from('.hero-content > *', {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2
      });

      // Animate visual mockup
      gsap.from('.hero-visual', {
        x: 50,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.4
      });
      
      // Animate chart bars
      gsap.from('.hero-chart-bar', {
        scaleY: 0,
        transformOrigin: 'bottom',
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out",
        delay: 1.2
      });

      // Animate total review count number
      if (reviewsRef.current) {
        const counter = { val: 3 };
        gsap.to(counter, {
          val: 452,
          duration: 2.5,
          ease: "power2.out",
          delay: 1.0,
          onUpdate: () => {
            if (reviewsRef.current) {
              reviewsRef.current.innerText = Math.round(counter.val).toString();
            }
          }
        });
      }

      // Animate monthly review count number
      if (monthlyReviewsRef.current) {
        const counterMonth = { val: 2 };
        gsap.to(counterMonth, {
          val: 137,
          duration: 2.5,
          ease: "power2.out",
          delay: 1.0,
          onUpdate: () => {
            if (monthlyReviewsRef.current) {
              monthlyReviewsRef.current.innerText = `+${Math.round(counterMonth.val)} this month`;
            }
          }
        });
      }
      
      // Floating animation for mockup
      gsap.to('.hero-visual', {
        y: 15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.6
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="pt-24 pb-24 relative overflow-hidden bg-[#F9F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="hero-content">
             <div className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                More stars. More customers.
             </div>
             <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
               Your Happiest Customers Never Leave Reviews. <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBA49] to-orange-500">Your Angriest One Did.</span>
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
                14-day free trial. No credit card required. Set up in 5 minutes. Works with the platforms you use.
             </p>
          </div>
          <div className="relative">
             {/* Visual Mockup */}
             <div className="hero-visual relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform rotate-2">
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
                         <p ref={reviewsRef} className="text-3xl font-extrabold" style={{ color: COLORS.dark }}>3</p>
                      </div>
                      <div ref={monthlyReviewsRef} className="text-green-500 text-sm font-bold">+2 this month</div>
                   </div>
                   <div className="h-32 bg-gray-50 rounded-xl flex items-end justify-between px-4 pb-0 pt-8 gap-2">
                      {[20, 35, 30, 50, 45, 60, 55, 75, 70, 90].map((h, i) => (
                         <div key={i} className="hero-chart-bar w-full bg-blue-500 rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                   
                   <ReviewNotification />
                   
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
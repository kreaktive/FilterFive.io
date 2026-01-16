import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';
import { COLORS, PRICING } from '../constants';

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.pricing-card',
          start: 'top 80%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            ${PRICING.monthly}/month. {PRICING.smsLimit.toLocaleString()} SMS included. All features. No contracts.
            <br/>
            <span className="text-green-600 font-medium">Or save $154 with the annual plan at ${PRICING.annual}/year.</span>
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-[#23001E]' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: isAnnual ? COLORS.gold : '#e5e7eb' }}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-sm ${
                  isAnnual ? 'translate-x-8' : 'translate-x-0'
                }`}
              ></div>
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-[#23001E]' : 'text-gray-400'}`}>
              Annual
            </span>
          </div>
        </div>

        <div className="max-w-md mx-auto pricing-card">
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 transform hover:-translate-y-1 transition-transform">
            <div className="mb-6 text-center">
              <span className="text-5xl font-extrabold" style={{ color: COLORS.dark }}>
                ${isAnnual ? Math.round(PRICING.annual / 12) : PRICING.monthly}
              </span>
              <span className="text-gray-500">/month</span>
            </div>
             {isAnnual && (
                <p className="text-sm text-green-600 font-semibold -mt-4 mb-6 text-center">Billed ${PRICING.annual} yearly</p>
            )}

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                <span className="text-gray-700">1,000 SMS messages included</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                <span className="text-gray-700">All features included</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                <span className="text-gray-700">Unlimited QR code scans</span>
              </li>
               <li className="flex items-start gap-3">
                <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                <span className="text-gray-700">Multi-location support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                <span className="text-gray-700">Cancel anytime</span>
              </li>
            </ul>
            <button
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: COLORS.gold, color: COLORS.dark }}
            >
              Start Free Trial
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">14-day free trial. 10 SMS included.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS } from '../constants';
import { Check, X } from 'lucide-react';

const Comparison: React.FC = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.comparison-table', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.comparison-table',
          start: 'top 85%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24" style={{ backgroundColor: COLORS.bgLight }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>
            Why MoreStars?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enterprise review tools cost $300-500/month, require onboarding calls, and come loaded with features you'll never use.
          </p>
        </div>

        <div className="comparison-table overflow-x-auto">
          <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-left text-gray-500 font-medium">What You Get</th>
                <th className="p-6 text-center text-xl font-bold" style={{ color: COLORS.dark, backgroundColor: '#fffbeb' }}>MoreStars</th>
                <th className="p-6 text-center text-gray-500 font-bold">Enterprise Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-6 font-medium text-gray-700">Monthly Price</td>
                <td className="p-6 text-center font-bold text-lg" style={{ color: COLORS.positive, backgroundColor: '#fffbeb' }}>$77</td>
                <td className="p-6 text-center text-gray-500">$300 - $500</td>
              </tr>
              <tr>
                <td className="p-6 font-medium text-gray-700">Setup Time</td>
                <td className="p-6 text-center font-bold" style={{ color: COLORS.dark, backgroundColor: '#fffbeb' }}>5 minutes</td>
                <td className="p-6 text-center text-gray-500">Days to weeks</td>
              </tr>
               <tr>
                <td className="p-6 font-medium text-gray-700">Contracts</td>
                <td className="p-6 text-center font-bold" style={{ color: COLORS.dark, backgroundColor: '#fffbeb' }}>None</td>
                <td className="p-6 text-center text-gray-500">12-month minimum</td>
              </tr>
              <tr>
                <td className="p-6 font-medium text-gray-700">SMS Included</td>
                <td className="p-6 text-center font-bold" style={{ color: COLORS.dark, backgroundColor: '#fffbeb' }}>1,000</td>
                <td className="p-6 text-center text-gray-500">Often extra</td>
              </tr>
               <tr>
                <td className="p-6 font-medium text-gray-700">Complexity</td>
                <td className="p-6 text-center font-bold" style={{ color: COLORS.dark, backgroundColor: '#fffbeb' }}>Simple</td>
                <td className="p-6 text-center text-gray-500">Feature bloat</td>
              </tr>
            </tbody>
          </table>
        </div>

         <div className="mt-12 text-center">
            <p className="text-lg font-medium" style={{ color: COLORS.dark }}>
               MoreStars does one thing: helps you get more stars. <br/>
               <span className="font-bold">$77/month. Start in 5 minutes. Cancel anytime.</span>
            </p>
         </div>
      </div>
    </section>
  );
};

export default Comparison;
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORS } from '../constants';
import { Wrench, Stethoscope, Fan, Utensils, Scissors, Store } from 'lucide-react';

const UseCaseCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="use-case-card flex flex-col items-start p-6 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="mb-4 p-3 rounded-lg bg-white shadow-sm" style={{ color: COLORS.accent }}>
            {icon}
        </div>
        <h3 className="font-bold text-lg mb-2" style={{ color: COLORS.dark }}>{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
);

const UseCases: React.FC = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.use-case-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '.use-cases-grid',
          start: 'top 80%',
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: COLORS.dark }}>
            Built for Businesses Like Yours
          </h2>
        </div>

        <div className="use-cases-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard 
                icon={<Wrench />}
                title="Auto Repair"
                description="Customers trust mechanics with great reviews. Make sure your online reputation matches the quality of your work."
            />
            <UseCaseCard 
                icon={<Stethoscope />}
                title="Dental Practices"
                description="Patients check reviews before booking. Turn satisfied patients into 5-star reviews without the awkward ask."
            />
            <UseCaseCard 
                icon={<Fan />}
                title="HVAC & Plumbing"
                description="Emergency calls go to businesses with the best ratings. Make sure that's you."
            />
            <UseCaseCard 
                icon={<Utensils />}
                title="Restaurants"
                description="One bad review feels like a disaster. Steady 5-star reviews from happy customers put it in perspective."
            />
             <UseCaseCard 
                icon={<Scissors />}
                title="Salons & Spas"
                description="Your work speaks for itself. Make sure it speaks on Google too."
            />
             <UseCaseCard 
                icon={<Store />}
                title="And More..."
                description="Any local business that depends on Google reviews can use MoreStars. If you see customers regularly, this is for you."
            />
        </div>
      </div>
    </section>
  );
};

export default UseCases;
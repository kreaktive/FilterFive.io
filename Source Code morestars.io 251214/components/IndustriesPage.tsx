import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { 
  Car, 
  Stethoscope, 
  Wrench, 
  Utensils, 
  Scissors, 
  Home, 
  Dog, 
  ShoppingBag, 
  Scale, 
  Hammer, 
  Droplet,
  ArrowRight,
  Smile,
  Briefcase,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';

const IndustryCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color: string; slug: string }> = ({ icon, title, desc, color, slug }) => (
  <div className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full">
    {/* Hover gradient background effect */}
    <div className={`absolute inset-0 bg-gradient-to-br from-white to-${color}-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
    
    <div className="relative z-10 flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-${color}-600 bg-${color}-50 group-hover:scale-110 transition-transform duration-300`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
        </div>
        
        <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.dark }}>{title}</h3>
        <p className="text-gray-600 leading-relaxed mb-6 flex-grow text-sm">
          {desc}
        </p>
        
        <div className="flex items-center text-sm font-bold text-gray-400 group-hover:text-[#23001E] transition-colors mt-auto">
            See {title} Solution <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
        </div>
    </div>
  </div>
);

const IndustriesPage: React.FC = () => {
  useEffect(() => {
    document.title = "Industries We Serve | MoreStars";
    window.scrollTo(0, 0);
  }, []);

  const industries = [
    { 
        icon: <Car />, 
        title: "Auto Repair", 
        slug: "auto-repair",
        desc: "Trust is the engine of your business. Showcase your expertise and reliability to drive new customers to your bay.",
        color: "blue"
    },
    { 
        icon: <Droplet />, 
        title: "Car Wash", 
        slug: "car-wash",
        desc: "High volume means high opportunity. Turn everyday shines into a sparkling online reputation.",
        color: "cyan"
    },
    { 
        icon: <Stethoscope />, 
        title: "Healthcare", 
        slug: "healthcare",
        desc: "Patients choose providers they trust. Build that trust before they even walk in the door.",
        color: "green"
    },
    { 
        icon: <Wrench />, 
        title: "HVAC & Plumbing", 
        slug: "hvac",
        desc: "When emergencies happen, people pick the top-rated pro. Make sure that's you.",
        color: "orange"
    },
    { 
        icon: <Utensils />, 
        title: "Restaurants", 
        slug: "restaurants",
        desc: "Dominate 'food near me' searches. Turn happy diners into your best marketing team.",
        color: "red"
    },
    { 
        icon: <Scissors />, 
        title: "Salons & Spas", 
        slug: "salons",
        desc: "Your work is visual and personal. Let your 5-star reviews reflect the beauty you create.",
        color: "pink"
    },
    { 
        icon: <Home />, 
        title: "Real Estate", 
        slug: "real-estate",
        desc: "Referrals are great, but online presence closes the deal. Stand out in a crowded market.",
        color: "indigo"
    },
    { 
        icon: <Dog />, 
        title: "Pet Services", 
        slug: "pet-services",
        desc: "Pet owners are protective. Show them you're the most trusted groomer, vet, or boarder in town.",
        color: "yellow"
    },
    { 
        icon: <ShoppingBag />, 
        title: "Retail", 
        slug: "retail",
        desc: "Drive foot traffic by looking like the must-visit spot in your neighborhood.",
        color: "purple"
    },
    { 
        icon: <Scale />, 
        title: "Legal", 
        slug: "legal",
        desc: "Professionalism matters. Build authority and credibility with a stellar review profile.",
        color: "slate"
    },
    { 
        icon: <Hammer />, 
        title: "Contractors", 
        slug: "contractors",
        desc: "Roofing, flooring, remodeling. Show homeowners you show up and do the job right.",
        color: "amber"
    },
    { 
        icon: <Briefcase />, 
        title: "Professional Services", 
        slug: "professional-services",
        desc: "Accountants, consultants, and agencies. Reputation is your currency.",
        color: "teal"
    },
  ];

  return (
    <div className="min-h-screen font-sans bg-white">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-20 relative overflow-hidden bg-gray-50">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-gray-100/50 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                    <LayoutGrid size={16} /> Built for Local Business
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight" style={{ color: COLORS.dark }}>
                    Powering Reviews for <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                        Every Industry
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                    Whether you fix cars, clean teeth, or sell houses, MoreStars is designed to fit your workflow and grow your reputation.
                </p>
            </div>
        </section>

        {/* Industry Grid */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {industries.map((ind, i) => (
                        <Link to={`/industries/${ind.slug}`} key={i} className="block h-full no-underline">
                             <IndustryCard 
                                icon={ind.icon}
                                title={ind.title}
                                desc={ind.desc}
                                color={ind.color}
                                slug={ind.slug}
                             />
                        </Link>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Strip */}
        <section className="py-20" style={{ backgroundColor: COLORS.bgLight }}>
            <div className="max-w-4xl mx-auto px-4 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-green-600">
                    <Smile size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                    Don't See Your Industry?
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    If you have customers and a Google Business Profile, MoreStars will work for you. Our system is flexible enough for any business flow.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/pricing" className="inline-flex items-center justify-center px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-[#23001E] text-white">
                        Get Started Now <ArrowRight className="ml-2" />
                    </Link>
                    <a href="mailto:support@morestars.io" className="inline-flex items-center justify-center px-10 py-5 rounded-full font-bold text-lg border-2 border-gray-200 hover:border-[#23001E] hover:bg-white transition-all text-[#23001E]">
                        Contact Us
                    </a>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default IndustriesPage;
import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { 
  Car, Droplet, Stethoscope, Wrench, Utensils, Scissors, Home, Dog, ShoppingBag, Scale, Hammer, Briefcase, 
  ArrowRight, Check, Star, MessageSquare, QrCode 
} from 'lucide-react';

// --- Content Data Dictionary ---
const INDUSTRY_DATA: Record<string, any> = {
  'auto-repair': {
    title: "Auto Repair",
    icon: <Car size={48} />,
    heroTitle: "Build Trust Before They Even Enter the Bay.",
    heroSubtitle: "In the auto industry, trust is everything. Show potential customers you're the honest mechanic they've been looking for.",
    painPoint: "People are terrified of getting ripped off by mechanics.",
    solution: "A wall of 5-star reviews puts their mind at ease instantly.",
    exampleText: "Hi [Name], thanks for trusting AutoFix with your [Vehicle Model] today! We'd love to know how we did: [Link]",
    workflow: "Send the text automatically when the invoice is paid via your POS, or print a QR code for the service counter.",
    color: "blue"
  },
  'car-wash': {
    title: "Car Wash",
    icon: <Droplet size={48} />,
    heroTitle: "Turn A Clean Car Into A Sparkling Reputation.",
    heroSubtitle: "High volume means high opportunity. Capture the satisfaction of a fresh shine immediately.",
    painPoint: "Customers drive away happy but forget to review you 5 minutes later.",
    solution: "Catch them while they are admiring their clean car with a simple SMS.",
    exampleText: "Hope you enjoy the shine, [Name]! If you liked the service at SparkleWash, leave us a quick rating here: [Link]",
    workflow: "Use a QR code at the payment kiosk or on the receipt. Send SMS if you have a loyalty program.",
    color: "cyan"
  },
  'healthcare': {
    title: "Healthcare",
    icon: <Stethoscope size={48} />,
    heroTitle: "Patient Care Doesn't Stop at the Door.",
    heroSubtitle: "For dentists, doctors, and clinics. Build the online authority that makes new patients choose you.",
    painPoint: "Happy patients rarely write reviews; they just go home relieved.",
    solution: "A polite, private text message makes it easy for them to say 'thank you'.",
    exampleText: "Hi [Name], thank you for visiting Dr. Smith today. We hope you felt well taken care of. Would you mind leaving a review? [Link]",
    workflow: "Send a request 1 hour after the appointment ends. Compliant and professional.",
    color: "green"
  },
  'hvac': {
    title: "HVAC & Plumbing",
    icon: <Wrench size={48} />,
    heroTitle: "Be The First Call In An Emergency.",
    heroSubtitle: "When a pipe bursts or the AC dies, people Google 'best plumber near me'. Be the top result.",
    painPoint: "You save the day, but then rush to the next job without asking for a review.",
    solution: "Automate the ask so you build your reputation while you work.",
    exampleText: "Thanks for choosing Rapid HVAC, [Name]. Glad we could get the AC running! Please share your experience: [Link]",
    workflow: "Trigger the text immediately after the job is marked complete.",
    color: "orange"
  },
  'restaurants': {
    title: "Restaurants",
    icon: <Utensils size={48} />,
    heroTitle: "Dominate 'Food Near Me' Searches.",
    heroSubtitle: "The food industry is crowded. Make sure your tables stay full by owning the top spot on Google.",
    painPoint: "One angry diner writes a novel. 100 happy diners say nothing.",
    solution: "Balance the scales by making it effortless for happy guests to rate you.",
    exampleText: "Thanks for dining at Bistro 42! We hope you loved the meal. Help us out with a quick review? [Link]",
    workflow: "Place a QR code on the table tent or the bottom of the receipt.",
    color: "red"
  },
  'salons': {
    title: "Salons & Spas",
    icon: <Scissors size={48} />,
    heroTitle: "Style Speaks. Reviews Shout.",
    heroSubtitle: "Your business is built on visuals and trust. Let your client's rave reviews bring in the next appointment.",
    painPoint: "Clients love their look but forget to tag or review you once they leave.",
    solution: "A text right after the appointment captures that 'new hair' excitement.",
    exampleText: "You look great, [Name]! Thanks for visiting Luxe Salon. If you love your new look, please let us know: [Link]",
    workflow: "Send via SMS right as they check out.",
    color: "pink"
  },
  'real-estate': {
    title: "Real Estate",
    icon: <Home size={48} />,
    heroTitle: "Your Reputation Closes The Deal.",
    heroSubtitle: "In real estate, you are your brand. Build a profile that screams 'trustworthy expert'.",
    painPoint: "Referrals are great, but strangers check Google before calling you.",
    solution: "Showcase your wins with a consistent stream of 5-star feedback.",
    exampleText: "Congrats on the new home, [Name]! It was a pleasure helping you. Would you mind leaving a review for me? [Link]",
    workflow: "Send a personalized request the moment closing is confirmed.",
    color: "indigo"
  },
  'pet-services': {
    title: "Pet Services",
    icon: <Dog size={48} />,
    heroTitle: "Pet Parents Are Protective. Show You Care.",
    heroSubtitle: "Groomers, boarders, and vets. Show pet owners you are the safe, loving choice.",
    painPoint: "Trust is the #1 barrier for new customers in the pet industry.",
    solution: "Reviews from other pet parents are the ultimate social proof.",
    exampleText: "We loved hanging out with Fido today! 🐶 If you were happy with the groom, please leave us a review: [Link]",
    workflow: "SMS on pickup is highly effective here.",
    color: "yellow"
  },
  'retail': {
    title: "Retail",
    icon: <ShoppingBag size={48} />,
    heroTitle: "Drive Foot Traffic From The Web.",
    heroSubtitle: "Local SEO is vital for boutiques and shops. Look like the busiest spot in town.",
    painPoint: "Shoppers browse online before they head downtown.",
    solution: "Ensure they see you first with a high rating and recent reviews.",
    exampleText: "Thanks for shopping local at Main St. Boutique! We appreciate you. Leave a review for 10% off next time: [Link]",
    workflow: "QR code at the checkout counter is perfect for retail.",
    color: "purple"
  },
  'legal': {
    title: "Legal Services",
    icon: <Scale size={48} />,
    heroTitle: "Authority & Credibility Wins Cases.",
    heroSubtitle: "Lawyers and firms need to establish professionalism instantly online.",
    painPoint: "Legal clients are often stressed and researching heavily.",
    solution: "A strong review profile establishes you as the competent expert.",
    exampleText: "It was a privilege to represent you, [Name]. If you were satisfied with our counsel, please share your thoughts: [Link]",
    workflow: "Send manually after a case is closed or a milestone is reached.",
    color: "slate"
  },
  'contractors': {
    title: "Contractors",
    icon: <Hammer size={48} />,
    heroTitle: "Show Homeowners You Show Up.",
    heroSubtitle: "Roofing, flooring, remodeling. The biggest fear is a contractor who ghosts.",
    painPoint: "Homeowners are skeptical of contractors due to horror stories.",
    solution: "Overwhelm skepticism with proof of reliability.",
    exampleText: "Job done! Thanks for choosing Apex Roofing. We hope you love the result. Please review us here: [Link]",
    workflow: "Send immediately upon job completion walkthrough.",
    color: "amber"
  },
  'professional-services': {
    title: "Professional Services",
    icon: <Briefcase size={48} />,
    heroTitle: "Reputation Is Your Currency.",
    heroSubtitle: "Accountants, consultants, agencies. Your business grows on your good name.",
    painPoint: "Your expertise is invisible until someone vouches for it.",
    solution: "Make your expertise visible with detailed client feedback.",
    exampleText: "Thanks for the meeting, [Name]. I enjoyed working on your account. Would you mind leaving a brief review? [Link]",
    workflow: "Personalized SMS or email link after a project delivery.",
    color: "teal"
  }
};

const IndustryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!slug || !INDUSTRY_DATA[slug]) {
    return <Navigate to="/industries" replace />;
  }

  const data = INDUSTRY_DATA[slug];

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* Dynamic Hero */}
        <section className={`pt-24 pb-20 relative overflow-hidden bg-${data.color}-50`}>
             <div className="max-w-7xl mx-auto px-4 text-center">
                 <div className={`w-20 h-20 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 text-${data.color}-600`}>
                     {React.cloneElement(data.icon, { size: 40 })}
                 </div>
                 <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900">
                    {data.heroTitle}
                 </h1>
                 <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                    {data.heroSubtitle}
                 </p>
                 <button className="px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 bg-[#23001E] text-white">
                    Get More {data.title} Reviews
                 </button>
             </div>
        </section>

        {/* Problem / Solution Split */}
        <section className="py-24">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.dark }}>The Challenge</h2>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
                            <p className="text-lg text-red-800 font-medium">"{data.painPoint}"</p>
                        </div>
                        <h2 className="text-3xl font-bold mb-6" style={{ color: COLORS.dark }}>The Solution</h2>
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                             <p className="text-lg text-green-800 font-medium"><Check className="inline mr-2" /> {data.solution}</p>
                        </div>
                    </div>
                    
                    {/* Visual Mockup for Industry */}
                    <div className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform rotate-1">
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                                <div className={`w-10 h-10 rounded-full bg-${data.color}-100 flex items-center justify-center text-${data.color}-600`}>
                                    <MessageSquare size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Review Request</p>
                                    <p className="text-xs text-gray-500">Sent via MoreStars</p>
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-xl rounded-tl-none p-4 mb-4 text-gray-800 leading-relaxed">
                                {data.exampleText}
                            </div>
                            <p className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">
                                Your customer clicks the link &rarr; Lands on Google &rarr; 5 Stars
                            </p>
                        </div>
                        
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                            <div className="flex text-yellow-400">
                                <Star fill="currentColor" size={20} />
                                <Star fill="currentColor" size={20} />
                                <Star fill="currentColor" size={20} />
                                <Star fill="currentColor" size={20} />
                                <Star fill="currentColor" size={20} />
                            </div>
                            <span className="font-bold text-gray-900">100% Legit</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-12" style={{ color: COLORS.dark }}>How It Fits Your Workflow</h2>
                
                <div className="grid md:grid-cols-2 gap-8 text-left">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className={`w-12 h-12 rounded-xl bg-${data.color}-100 text-${data.color}-600 flex items-center justify-center mb-4`}>
                            <QrCode />
                        </div>
                        <h3 className="text-xl font-bold mb-2">In Person? Use QR.</h3>
                        <p className="text-gray-600">{data.workflow.includes('QR') ? "Perfect for your front desk or receipts." : "Print a QR code for your office or vehicle."}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className={`w-12 h-12 rounded-xl bg-${data.color}-100 text-${data.color}-600 flex items-center justify-center mb-4`}>
                            <MessageSquare />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Have a list? Use SMS.</h3>
                        <p className="text-gray-600">{data.workflow.includes('SMS') ? "Send automatically or in bulk." : "Upload your client list at the end of the day."}</p>
                    </div>
                </div>
                
                <p className="mt-12 text-lg text-gray-600 italic">
                    "Specific Advice: {data.workflow}"
                </p>
            </div>
        </section>

        {/* Final CTA */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Start Getting More Reviews
              </h2>
              <div className="text-lg md:text-xl font-medium mb-8 opacity-90" style={{ color: COLORS.dark }}>
                  14-day free trial. Setup takes 5 minutes.
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 hover:bg-white flex items-center justify-center gap-3 bg-[#23001E] text-white hover:text-[#23001E]"
                  >
                     Start Free Trial <ArrowRight />
                  </button>
                  <Link to="/pricing"
                    className="px-10 py-5 rounded-full text-xl font-bold border-2 border-[#23001E] text-[#23001E] hover:bg-white/50 flex items-center justify-center"
                  >
                     See Pricing
                  </Link>
              </div>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default IndustryDetailPage;
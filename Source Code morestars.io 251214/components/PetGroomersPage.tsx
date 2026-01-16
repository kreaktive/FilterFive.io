import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FAQ from './FAQ';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Star, 
  CheckCircle, 
  TrendingUp, 
  MessageSquare, 
  ShieldCheck,
  XCircle,
  Dog,
  Camera,
  Heart,
  Scissors,
  Truck,
  Smile
} from 'lucide-react';

const PetGroomersPage: React.FC = () => {
  useEffect(() => {
    document.title = "Google Reviews for Pet Groomers | MoreStars";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get more Google reviews for your grooming business. Capture the post-pickup joy. $77/month. Start free.');
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-24 relative overflow-hidden bg-gray-50">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-50 opacity-50 skew-x-12 transform origin-top-right"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Dog size={14} /> Pet Groomer Marketing
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: COLORS.dark }}>
                            Fluffy Looks Amazing. <br/>
                            Mom's Taking Photos. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                                Ask for the Review.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Pet parents are already sharing photos of their fresh-cut fur babies. Redirect some of that love to Google.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 bg-[#FFBA49] text-[#23001E]">
                                Start Free Trial <ArrowRight size={20} />
                            </button>
                        </div>
                        <p className="mt-6 text-sm text-gray-500 font-medium flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" /> 14-day free trial. No credit card required.
                        </p>
                    </div>
                    
                    {/* Hero Visual */}
                    <div className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 transform rotate-1">
                             <div className="flex items-center gap-4 mb-6">
                                 <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
                                     <Dog fill="currentColor" />
                                 </div>
                                 <div>
                                     <div className="font-bold text-lg">Jen & "Bella"</div>
                                     <div className="flex text-yellow-400 text-sm">
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                         <Star fill="currentColor" size={16} />
                                     </div>
                                 </div>
                                 <div className="ml-auto text-xs text-gray-400">20 mins ago</div>
                             </div>
                             <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "Oh my god, she looks so cute! The teddy bear cut is perfect. <span className="bg-yellow-100 font-bold px-1">We love Pampered Paws!</span> Bella smells amazing too."
                             </p>
                        </div>
                        {/* Floating Stats */}
                        <div className="absolute -bottom-6 -left-6 bg-[#23001E] text-white p-6 rounded-xl shadow-lg">
                            <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Google Rating</div>
                            <div className="text-3xl font-bold flex items-center gap-2">
                                4.9 <Star fill="#FFBA49" className="text-[#FFBA49]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- The Pain Section --- */}
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                        The Pain You Know Too Well
                    </h2>
                    <p className="text-xl text-gray-600">
                        When they love the cut, they tell their spouse. When they hate it, they tell Google.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            The dog comes out looking adorable. The owner's face lights up. They scoop up their fur baby and take pictures. They drive away thrilled. <strong>That's the last you hear from them.</strong>
                        </p>
                        
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                             <h4 className="font-bold text-yellow-800 mb-2">Pet Parents Are Protective</h4>
                             <p className="text-gray-700 text-sm mb-4">
                                 When someone thinks you messed up their dog's hair, emotions run high. "They butchered my baby" sounds terrifying to new customers.
                             </p>
                             <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>You groom 30 pets a week.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>28 owners are thrilled.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>1 leaves a glowing review.</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>1 leaves a dramatic 1-star rant.</li>
                             </ul>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Your Google page makes it look like 50% of your customers are unhappy, when in reality, it's less than 3%.
                        </p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
                        <Camera size={64} className="text-purple-500 mb-6" />
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>The Photo Trap</h3>
                        <p className="text-gray-600 mb-4">
                            They show the photos to everyone. They post on Facebook. But Facebook likes don't help new customers find you on Google Maps.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- What Changes --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.dark }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white">What Changes With MoreStars</h2>
                    <p className="text-xl text-gray-300">Capture the parking lot joy before they drive away.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Change 1 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Dog />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Pet Names Make It Personal</h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Include the pet's name in the message. Pet parents love that. It feels like you care. Because you do.
                        </p>
                        <div className="bg-black/30 p-4 rounded-lg border-l-2 border-[#FFBA49] text-sm text-gray-200 italic">
                            "Thanks for bringing Max to Pampered Paws! If you love how he looks, would you mind leaving us a quick review? [link]"
                        </div>
                    </div>

                    {/* Change 2 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <TrendingUp />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Dramatic Reviews Get Buried</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Before</p>
                                <p className="text-yellow-400 font-bold text-lg">25 Reviews</p>
                                <p className="text-xs text-gray-500">3 dramatic complaints (12%)</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase">After 6 Months</p>
                                <p className="text-green-400 font-bold text-lg">200+ Reviews</p>
                                <p className="text-xs text-gray-500">3 complaints (1.5%)</p>
                            </div>
                        </div>
                        <p className="text-gray-300">Volume is your defense against the occasional unhappy owner.</p>
                    </div>

                    {/* Change 3 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <Smile />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Capture the Parking Lot Joy</h3>
                        <p className="text-gray-300 leading-relaxed">
                            The text arrives while they're still cooing over their pet. While they're taking photos. While the joy is fresh. One tap. They gush on Google.
                        </p>
                    </div>

                    {/* Change 4 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-6 text-white">
                            <ShieldCheck />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">New Clients Book with Confidence</h3>
                        <p className="text-gray-300 leading-relaxed">
                             When a pet owner Googles "pet groomer near me," they're nervous. 200 reviews saying "they're so patient with anxious dogs" builds trust before they call.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Scenarios --- */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold mb-4" style={{ color: COLORS.dark }}>Real World Scenarios</h2>
                    <p className="text-gray-600">Every grooming session is an opportunity.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Scenario 1 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-yellow-100 p-4 border-b border-yellow-200">
                            <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                                <Scissors size={20}/> Scenario 1: The Perfect Cut
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Goldendoodle gets a teddy bear cut. Looks adorable. Owner is thrilled.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">She posts on Instagram. Tells her neighbor. <span className="font-semibold text-red-500">No Google review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">Text arrives while she's taking photos. <span className="font-semibold text-green-600">5 Stars.</span> "Oscar looks amazing! Best groomer in town."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario 2 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-100 p-4 border-b border-blue-200">
                            <h3 className="font-bold text-blue-800 flex items-center gap-2">
                                <Heart size={20}/> Scenario 2: The Nervous Dog
                            </h3>
                        </div>
                        <div className="p-8">
                            <p className="mb-6 text-gray-700">Anxious rescue terrified of grooming. You were patient. Dog looks great and seems calm.</p>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0"><XCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">Without MoreStars</p>
                                        <p className="text-sm text-gray-600">Owner is relieved and grateful. Tells her dog trainer. <span className="font-semibold text-red-500">No review.</span></p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 shrink-0"><CheckCircle size={16}/></div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">With MoreStars</p>
                                        <p className="text-sm text-gray-600">She taps the link. <span className="font-semibold text-green-600">5 Stars.</span> "My dog is usually terrified. They were so patient. Can't recommend enough."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Mobile Grooming --- */}
        <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4">
                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide mb-6">
                            <Truck size={14} /> Mobile Grooming
                        </div>
                        <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.dark }}>Works for Mobile Groomers Too</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            You go to the client's home. Grooming complete. Pet looks great. Text goes out after you leave the driveway.
                        </p>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-700 italic">
                            "Thanks for booking mobile grooming for Bella! If she looks as cute as we think she does, would you mind leaving us a review? [link]"
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <Truck size={160} className="text-blue-200" />
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Specific to Groomers --- */}
        <FAQ 
            title="Pet Groomer FAQ" 
            items={[
                {
                    question: "Can I include the pet's name?",
                    answer: "Yes! You should. 'Thanks for bringing Max' feels personal. Pet parents notice and appreciate the detail."
                },
                {
                    question: "When should I send requests?",
                    answer: "Same day. A few hours after pickup. While they're still gushing over how cute their pet looks and sharing photos."
                },
                {
                    question: "What about cats?",
                    answer: "Same thing. Cat owners are just as likely to leave reviews if asked. Maybe more—good cat groomers are harder to find, so they appreciate you more."
                },
                {
                    question: "What if I know the owner wasn't happy?",
                    answer: "Skip the review request. If they seemed disappointed or complained at pickup, don't poke the bear. Focus on the ones who were clearly thrilled."
                }
            ]}
        />

        {/* --- CTA --- */}
        <section className="py-24" style={{ backgroundColor: COLORS.gold }}>
           <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-8" style={{ color: COLORS.dark }}>
                 Build Reviews That Match Your Grooming
              </h2>
              <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed" style={{ color: COLORS.dark }}>
                  Your work makes pets look adorable and owners happy. Right now, that happiness evaporates without a trace. MoreStars captures it.
              </p>
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
              <p className="mt-8 text-sm font-bold opacity-75" style={{ color: COLORS.dark }}>
                 14-day free trial. 10 SMS included. No credit card required.
              </p>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default PetGroomersPage;
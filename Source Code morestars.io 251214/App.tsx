import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import HowItWorks from './components/HowItWorks';
import SetupSection from './components/SetupSection';
import Features from './components/Features';
import SocialProof from './components/SocialProof';
import Pricing from './components/Pricing';
import UseCases from './components/UseCases';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PricingPage from './components/PricingPage';
import HowItWorksPage from './components/HowItWorksPage';
import AboutPage from './components/AboutPage';
import IndustriesPage from './components/IndustriesPage';
import IndustryDetailPage from './components/IndustryDetailPage';
import AutoRepairPage from './components/AutoRepairPage';
import DentalPage from './components/DentalPage';
import HVACPage from './components/HVACPage';
import PlumbersPage from './components/PlumbersPage';
import RestaurantsPage from './components/RestaurantsPage';
import SalonsPage from './components/SalonsPage';
import RealEstatePage from './components/RealEstatePage';
import ChiropractorsPage from './components/ChiropractorsPage';
import PetGroomersPage from './components/PetGroomersPage';
import CarWashPage from './components/CarWashPage';
import VeterinariansPage from './components/VeterinariansPage';
import MovingCompaniesPage from './components/MovingCompaniesPage';
import ElectriciansPage from './components/ElectriciansPage';
import HomeCleaningPage from './components/HomeCleaningPage';
import LawnCarePage from './components/LawnCarePage';
import DaycarePage from './components/DaycarePage';
import WeddingPhotographersPage from './components/WeddingPhotographersPage';
import MedSpasPage from './components/MedSpasPage';
import TattooShopsPage from './components/TattooShopsPage';
import SeniorCarePage from './components/SeniorCarePage';
import OnlineStoresPage from './components/OnlineStoresPage';
import LogoMarquee from './components/LogoMarquee';
import NewLandingPage from './components/NewLandingPage';
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import FAQPage from './components/FAQPage';
import DetailedHowItWorks from './components/DetailedHowItWorks';
import PartnersPage from './components/PartnersPage';
import FeaturesPage from './components/FeaturesPage';
import FinalCTA from './components/FinalCTA';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import SMSCompliancePage from './components/SMSCompliancePage';
import { COLORS } from './constants';
import { ArrowRight, Clock, ShieldCheck, Check, MousePointer2 } from 'lucide-react';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Helper to handle scrolling to anchors like #features
const ScrollToAnchor = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);
  return null;
};

// Home Page Component
const HomePage = () => (
  <div className="min-h-screen bg-[#F9F7FA]">
    <Navbar />
    <main>
      <Hero />
      <LogoMarquee />
      <Problem />
      <HowItWorks />
      <SetupSection />
      <Features />
      <SocialProof />
      <DetailedHowItWorks />
      
      {/* Final CTA Component */}
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <HashRouter>
      <ScrollToAnchor />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/sms-compliance" element={<SMSCompliancePage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        {/* Specific Industry Routes */}
        <Route path="/industries/auto-repair" element={<AutoRepairPage />} />
        <Route path="/industries/dental" element={<DentalPage />} />
        <Route path="/industries/hvac" element={<HVACPage />} />
        <Route path="/industries/plumbers" element={<PlumbersPage />} />
        <Route path="/industries/restaurants" element={<RestaurantsPage />} />
        <Route path="/industries/salons" element={<SalonsPage />} />
        <Route path="/industries/real-estate" element={<RealEstatePage />} />
        <Route path="/industries/chiropractors" element={<ChiropractorsPage />} />
        <Route path="/industries/pet-groomers" element={<PetGroomersPage />} />
        <Route path="/industries/car-wash" element={<CarWashPage />} />
        <Route path="/industries/veterinarians" element={<VeterinariansPage />} />
        <Route path="/industries/moving-companies" element={<MovingCompaniesPage />} />
        <Route path="/industries/electricians" element={<ElectriciansPage />} />
        <Route path="/industries/home-cleaning" element={<HomeCleaningPage />} />
        <Route path="/industries/lawn-care" element={<LawnCarePage />} />
        <Route path="/industries/daycare" element={<DaycarePage />} />
        <Route path="/industries/wedding-photographers" element={<WeddingPhotographersPage />} />
        <Route path="/industries/med-spas" element={<MedSpasPage />} />
        <Route path="/industries/tattoo-shops" element={<TattooShopsPage />} />
        <Route path="/industries/senior-care" element={<SeniorCarePage />} />
        <Route path="/industries/online-stores" element={<OnlineStoresPage />} />
        {/* Generic Industry Route */}
        <Route path="/industries/:slug" element={<IndustryDetailPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/revised" element={<NewLandingPage />} />
        <Route path="/partners" element={<PartnersPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { 
  FileText, Users, User, MessageSquare, Ban, CreditCard, XCircle, 
  Lock, Cpu, Globe, AlertTriangle, ShieldAlert, ShieldCheck, Gavel, File, Mail 
} from 'lucide-react';
import gsap from 'gsap';

const TERMS_SECTIONS = [
  { id: "overview", title: "1. Overview", icon: <FileText size={18} /> },
  { id: "eligibility", title: "2. Eligibility", icon: <Users size={18} /> },
  { id: "account", title: "3. Account", icon: <User size={18} /> },
  { id: "sms-compliance", title: "4. SMS Compliance", icon: <MessageSquare size={18} /> },
  { id: "prohibited", title: "5. Prohibited Uses", icon: <Ban size={18} /> },
  { id: "billing", title: "6. Billing", icon: <CreditCard size={18} /> },
  { id: "cancellation", title: "7. Cancellation", icon: <XCircle size={18} /> },
  { id: "privacy", title: "8. Data & Privacy", icon: <Lock size={18} /> },
  { id: "ip", title: "9. Intellectual Property", icon: <Cpu size={18} /> },
  { id: "third-party", title: "10. Third-Party", icon: <Globe size={18} /> },
  { id: "warranty", title: "11. Warranties", icon: <AlertTriangle size={18} /> },
  { id: "liability", title: "12. Liability", icon: <ShieldAlert size={18} /> },
  { id: "indemnification", title: "13. Indemnification", icon: <ShieldCheck size={18} /> },
  { id: "dispute", title: "14. Disputes", icon: <Gavel size={18} /> },
  { id: "general", title: "15. General", icon: <File size={18} /> },
  { id: "contact", title: "16. Contact", icon: <Mail size={18} /> },
];

const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(TERMS_SECTIONS[0].id);

  useEffect(() => {
    document.title = "Terms of Service | MoreStars";
    window.scrollTo(0, 0);

    // GSAP Animation for sections on load
    gsap.from('.terms-section', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2
    });
  }, []);

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Trigger point offset

      let currentSectionId = TERMS_SECTIONS[0].id;
      
      for (const section of TERMS_SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          if (element.offsetTop <= scrollPosition) {
            currentSectionId = section.id;
          }
        }
      }
      
      setActiveSection(currentSectionId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      // Set active immediately for responsiveness
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* --- Hero Section --- */}
        <section className="pt-24 pb-20 bg-gray-50 border-b border-gray-200">
           <div className="max-w-4xl mx-auto px-4 text-center">
               <h1 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                   Terms of Service
               </h1>
               <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                   Please read these terms carefully before using MoreStars.
               </p>
               <p className="text-sm text-gray-500 mt-4">
                   Last Updated: October 2024
               </p>
           </div>
        </section>

        {/* --- Main Content Layout --- */}
        <section className="py-12 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Sidebar Navigation (Desktop) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-28 space-y-1 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                            <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4 px-3">Table of Contents</h3>
                            {TERMS_SECTIONS.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeSection === section.id ? 'bg-gray-100 text-[#23001E]' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span className={activeSection === section.id ? 'text-[#FFBA49]' : 'text-gray-400'}>{section.icon}</span>
                                    {section.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Terms Content Area */}
                    <div className="lg:col-span-9">
                        <div className="prose prose-lg max-w-none text-gray-700">
                            
                            <div className="mb-12 bg-blue-50 p-6 rounded-2xl border border-blue-100 text-base">
                                <p className="mb-0">These Terms of Service ("Terms") govern your access to and use of MoreStars ("Service"), operated by KREAKTIVE LLC ("Company," "we," "us," or "our"). By accessing or using the Service, you agree to be bound by these Terms. <strong>If you do not agree to these Terms, do not use the Service.</strong></p>
                            </div>

                            {/* 1. Overview */}
                            <div id="overview" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">01.</span> Overview of the Service
                                </h2>
                                <p>MoreStars is a business-to-business (B2B) software-as-a-service platform that enables businesses to send SMS review requests to their customers. The Service includes:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>SMS delivery to customers requesting reviews</li>
                                    <li>Tracking of message delivery and engagement</li>
                                    <li>Dashboard for managing review requests</li>
                                    <li>Integration with third-party services (e.g., Zapier)</li>
                                </ul>
                                <p>The Service is intended for use by businesses, not individual consumers.</p>
                            </div>

                            {/* 2. Eligibility */}
                            <div id="eligibility" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">02.</span> Eligibility
                                </h2>
                                <p>To use the Service, you must:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Be at least 18 years of age</li>
                                    <li>Have the legal authority to bind the business entity you represent</li>
                                    <li>Operate a legitimate business</li>
                                    <li>Provide accurate and complete registration information</li>
                                    <li>Comply with all applicable laws and regulations</li>
                                </ul>
                            </div>

                            {/* 3. Account */}
                            <div id="account" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">03.</span> Account Registration
                                </h2>
                                <p>When you create an account, you agree to:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Provide truthful, accurate, and complete information</li>
                                    <li>Maintain and promptly update your account information</li>
                                    <li>Keep your login credentials confidential</li>
                                    <li>Accept responsibility for all activity under your account</li>
                                    <li>Notify us immediately of any unauthorized access</li>
                                </ul>
                                <p>We reserve the right to suspend or terminate accounts that contain false information or violate these Terms.</p>
                            </div>

                            {/* 4. SMS Compliance */}
                            <div id="sms-compliance" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">04.</span> SMS Compliance Obligations
                                </h2>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-sm font-bold mb-6">
                                    <AlertTriangle className="inline mr-2 -mt-1" size={16}/>
                                    Critical Section: Violation may result in immediate termination and legal liability.
                                </div>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.1 Consent Requirements</h3>
                                <p>By using the Service, you represent, warrant, and agree that:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>You will only submit phone numbers for customers who have provided prior express written consent to receive SMS review requests from your business</li>
                                    <li>You will use consent language that includes, at minimum:
                                        <ul className="list-circle pl-6 mt-2 space-y-1 text-sm text-gray-600">
                                            <li>Your business name</li>
                                            <li>Clear description that the customer will receive an SMS review request</li>
                                            <li>Disclosure that message and data rates may apply</li>
                                            <li>Instructions to reply STOP to opt out</li>
                                            <li>Reference to your privacy policy</li>
                                        </ul>
                                    </li>
                                    <li>You will obtain consent before submitting any phone number to MoreStars</li>
                                    <li>You will never submit phone numbers obtained through purchasing lists, scraping, or any method other than direct consent from the customer</li>
                                </ul>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.2 Required Consent Language</h3>
                                <p>You must use consent language substantially similar to:</p>
                                <blockquote className="bg-gray-50 border-l-4 border-blue-500 pl-4 py-3 italic my-4 text-gray-700">
                                    "I agree to receive a one-time SMS review request from [Your Business Name]. Message and data rates may apply. Reply STOP to opt out."
                                </blockquote>
                                <p>Sample consent forms are available at <a href="#" className="text-blue-600 hover:underline">morestars.io/sms-compliance</a>.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.3 Consent Record Keeping</h3>
                                <p>You are required to maintain records of consent for each customer for a minimum of four (4) years. Records must include date/time, method of consent, exact language used, and customer acknowledgment.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.4 Honoring Opt-Outs</h3>
                                <p>When a customer opts out by replying STOP (or similar keywords), their phone number is automatically blocked from receiving future messages. You agree to never resubmit an opted-out phone number and to honor opt-out requests in your own systems.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.5 Compliance with Laws</h3>
                                <p>You are solely responsible for compliance with Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, and all other applicable laws.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.6 Liability for Non-Compliance</h3>
                                <p>You agree to indemnify and hold harmless KREAKTIVE LLC from any claims arising from your failure to obtain proper consent. This includes TCPA violations which may result in penalties of $500 to $1,500 per unsolicited message.</p>
                            </div>

                            {/* 5. Prohibited */}
                            <div id="prohibited" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">05.</span> Prohibited Uses
                                </h2>
                                <p>You may not use the Service to:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Send messages to anyone who has not provided proper consent</li>
                                    <li>Generate fake or fraudulent reviews</li>
                                    <li>Harass, threaten, or abuse any person</li>
                                    <li>Transmit spam or unsolicited commercial messages</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Resell or redistribute the Service without authorization</li>
                                </ul>

                                <h3 className="text-xl font-bold mt-6 mb-3">5.1 Prohibited Business Types</h3>
                                <p>The Service may not be used by businesses engaged in Cannabis/CBD, Adult content, Gambling, Firearms, unlicensed Pharmaceuticals, Debt collection, or any illegal activity. We reserve the right to refuse service to any business at our sole discretion.</p>
                            </div>

                            {/* 6. Billing */}
                            <div id="billing" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">06.</span> Subscription Plans and Billing
                                </h2>
                                
                                <h3 className="text-xl font-bold mt-6 mb-3">6.1 Plans & Free Trial</h3>
                                <p>The Service is offered through subscription plans. New accounts receive a free trial period of 14 days. At the end of the trial, you must subscribe to a paid plan to continue using the Service.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">6.2 Billing & Refund Policy</h3>
                                <p>Payment is due upon subscription signup. Subscriptions renew automatically. <strong>All fees are non-refundable.</strong> No refunds are provided for partial months, unused SMS requests, or annual subscriptions cancelled mid-term.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">6.3 Usage Limits</h3>
                                <p>Each plan includes a monthly limit on SMS requests. We will notify you at 80% usage. Upon reaching your limit, the Service will pause until your next billing cycle or until you upgrade/purchase more credits. Unused requests do not roll over.</p>
                            </div>

                            {/* 7. Cancellation */}
                            <div id="cancellation" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">07.</span> Cancellation and Termination
                                </h2>
                                <p>You may cancel your subscription at any time through your account dashboard. Upon cancellation, you retain access until the end of your current billing period. No refunds are provided for the remaining period.</p>
                                <p>We may terminate your account immediately if you violate these Terms, particularly SMS compliance obligations.</p>
                            </div>

                            {/* 8. Privacy */}
                            <div id="privacy" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">08.</span> Data and Privacy
                                </h2>
                                <p>You retain ownership of all data you submit to the Service. By using the Service, you grant us a limited license to use your data solely to provide the Service.</p>
                                <p>You are responsible for your collection, use, and protection of your customers' personal information. Upon account cancellation, your data is retained for 30 days and then permanently deleted.</p>
                            </div>

                            {/* 9. IP */}
                            <div id="ip" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">09.</span> Intellectual Property
                                </h2>
                                <p>The Service, including all software, design, text, graphics, and other content, is owned by KREAKTIVE LLC and protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service.</p>
                            </div>

                            {/* 10. Third Party */}
                            <div id="third-party" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">10.</span> Third-Party Services
                                </h2>
                                <p>The Service integrates with third-party services including Twilio, Zapier, and Google Business Profile. Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party services.</p>
                            </div>

                            {/* 11. Warranty */}
                            <div id="warranty" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">11.</span> Disclaimer of Warranties
                                </h2>
                                <p className="uppercase text-sm font-bold text-gray-500">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</p>
                                <p>We disclaim all warranties, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that SMS messages will be delivered, as delivery depends on carriers and recipient devices.</p>
                            </div>

                            {/* 12. Liability */}
                            <div id="liability" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">12.</span> Limitation of Liability
                                </h2>
                                <p className="uppercase text-sm font-bold text-gray-500">TO THE MAXIMUM EXTENT PERMITTED BY LAW, KREAKTIVE LLC SHALL NOT BE LIABLE FOR:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                                    <li>Loss of profits, revenue, data, or business opportunities</li>
                                    <li>Any amount exceeding the fees paid by you in the twelve (12) months preceding the claim</li>
                                </ul>
                            </div>

                            {/* 13. Indemnification */}
                            <div id="indemnification" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">13.</span> Indemnification
                                </h2>
                                <p>You agree to indemnify, defend, and hold harmless KREAKTIVE LLC and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your failure to obtain proper consent for SMS messages.</p>
                            </div>

                            {/* 14. Dispute */}
                            <div id="dispute" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">14.</span> Dispute Resolution
                                </h2>
                                <p>Before initiating formal proceedings, you agree to contact us at info@morestars.io to attempt to resolve any dispute informally. If unresolved, disputes shall be resolved by binding arbitration administered by the American Arbitration Association in Colorado Springs, Colorado. You agree to resolve disputes only on an individual basis and waive any right to participate in a class action lawsuit.</p>
                            </div>

                            {/* 15. General */}
                            <div id="general" className="terms-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">15.</span> General Provisions
                                </h2>
                                <p>These Terms are governed by the laws of the State of Colorado. These Terms constitute the entire agreement between you and KREAKTIVE LLC regarding the Service. We may modify these Terms at any time by posting updated Terms on our website.</p>
                            </div>

                            {/* 16. Contact */}
                            <div id="contact" className="terms-section scroll-mt-28 mb-16">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">16.</span> Contact Information
                                </h2>
                                <p className="mb-4">Notices to you may be sent to the email address associated with your account. Notices to us should be sent to:</p>
                                <p className="font-bold">Email: <a href="mailto:info@morestars.io" className="text-blue-600 hover:underline">info@morestars.io</a></p>
                            </div>

                            <p className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500 font-medium italic">By using MoreStars, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
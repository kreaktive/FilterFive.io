import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  Info, FileText, MessageSquare, XCircle, HelpCircle, Briefcase, 
  CheckSquare, Smartphone, Clipboard, Database, ShieldCheck, Mail, Globe 
} from 'lucide-react';
import gsap from 'gsap';

const COMPLIANCE_SECTIONS = [
  { id: "about", title: "About SMS Messages", icon: <Info size={18} /> },
  { id: "details", title: "Message Details", icon: <FileText size={18} /> },
  { id: "sample", title: "Sample Message", icon: <MessageSquare size={18} /> },
  { id: "opt-out", title: "How to Opt Out", icon: <XCircle size={18} /> },
  { id: "help", title: "How to Get Help", icon: <HelpCircle size={18} /> },
  { id: "business-consent", title: "Business Consent", icon: <Briefcase size={18} /> },
  { id: "consent-elements", title: "Consent Elements", icon: <CheckSquare size={18} /> },
  { id: "digital-consent", title: "Digital Consent", icon: <Smartphone size={18} /> },
  { id: "paper-consent", title: "Paper Consent", icon: <Clipboard size={18} /> },
  { id: "records", title: "Record Requirements", icon: <Database size={18} /> },
  { id: "verification", title: "Compliance Verification", icon: <ShieldCheck size={18} /> },
  { id: "contact-regulatory", title: "Contact & Regulatory", icon: <Globe size={18} /> },
];

const SMSCompliancePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(COMPLIANCE_SECTIONS[0].id);

  useEffect(() => {
    document.title = "SMS Compliance | MoreStars";
    window.scrollTo(0, 0);

    // GSAP Animation for sections on load
    gsap.from('.compliance-section', {
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
      const scrollPosition = window.scrollY + 200;

      let currentSectionId = COMPLIANCE_SECTIONS[0].id;
      
      for (const section of COMPLIANCE_SECTIONS) {
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
    handleScroll(); 
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
                   SMS Compliance
               </h1>
               <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                   Information about MoreStars's SMS messaging practices and consent requirements.
               </p>
               <p className="text-sm text-gray-500 mt-4">
                   This page is publicly accessible and does not require login.
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
                            {COMPLIANCE_SECTIONS.map(section => (
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

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <div className="prose prose-lg max-w-none text-gray-700">
                            
                            <div className="mb-12 bg-blue-50 p-6 rounded-2xl border border-blue-100 text-base">
                                <p className="mb-0">This page provides information about MoreStars's SMS messaging practices and consent requirements for compliance with the Telephone Consumer Protection Act (TCPA), Cellular Telecommunications Industry Association (CTIA) guidelines, and carrier requirements.</p>
                            </div>

                            {/* About */}
                            <div id="about" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    About MoreStars SMS Messages
                                </h2>
                                <p>MoreStars is a business-to-business platform that helps local businesses request customer reviews via SMS. When you receive an SMS from a MoreStars-powered business, it means:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>You recently visited or did business with a local business</li>
                                    <li>That business uses MoreStars to request customer feedback</li>
                                    <li>You provided your phone number and consent to receive a review request</li>
                                </ul>
                            </div>

                            {/* Message Details */}
                            <div id="details" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Message Details
                                </h2>
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Item</th>
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Message Type</td>
                                                <td className="py-2 px-4">One-time transactional review request</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Frequency</td>
                                                <td className="py-2 px-4">Maximum ONE message per 30-day period per business</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Content</td>
                                                <td className="py-2 px-4">Brief thank-you message with a link to leave a Google review</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-4 font-bold">Cost</td>
                                                <td className="py-2 px-4">Message and data rates may apply based on your carrier plan</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Sample Message */}
                            <div id="sample" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Sample Message
                                </h2>
                                <p>Here is an example of messages sent through MoreStars:</p>
                                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 font-mono text-sm my-4 max-w-md">
                                    <p>Hi [Name]! Thanks for visiting [Business Name]. We'd love your feedback:</p>
                                    <p className="text-blue-600 underline">https://g.page/r/xxxxx/review</p>
                                    <p className="text-gray-500 mt-2 text-xs">Msg&data rates may apply. Reply STOP to opt out.</p>
                                </div>
                            </div>

                            {/* Opt Out */}
                            <div id="opt-out" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    How to Opt Out
                                </h2>
                                <p>You can stop receiving messages at any time by replying with any of these keywords:</p>
                                <div className="flex flex-wrap gap-2 my-4">
                                    {['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].map(keyword => (
                                        <span key={keyword} className="bg-gray-200 px-3 py-1 rounded text-sm font-bold text-gray-700">{keyword}</span>
                                    ))}
                                </div>
                                <p>Opt-out requests are processed immediately and automatically. Once you opt out, you will not receive any further messages.</p>
                            </div>

                            {/* Help */}
                            <div id="help" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    How to Get Help
                                </h2>
                                <p>Reply <strong>HELP</strong> to any message to receive:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                    <li>MoreStars sends review requests on behalf of local businesses.</li>
                                    <li>For help, contact <a href="mailto:info@morestars.io" className="text-blue-600 underline">info@morestars.io</a> or visit <a href="#" className="text-blue-600 underline">morestars.io/sms-compliance</a>.</li>
                                    <li>Reply STOP to opt out.</li>
                                </ul>
                                <p>You can also contact us directly at <a href="mailto:info@morestars.io" className="text-blue-600 font-bold hover:underline">info@morestars.io</a>.</p>
                            </div>

                            {/* Business Consent */}
                            <div id="business-consent" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Consent Requirements for Businesses
                                </h2>
                                <p>MoreStars requires all subscribing businesses to obtain prior express written consent before submitting any customer phone numbers. This section documents our consent requirements.</p>
                            </div>

                            {/* Required Consent Elements */}
                            <div id="consent-elements" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Required Consent Elements
                                </h2>
                                <p>All consent collection must include:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Business Identification</strong> — Clear identification of the business name</li>
                                    <li><strong>Message Description</strong> — Clear statement that the customer will receive an SMS review request</li>
                                    <li><strong>Frequency Disclosure</strong> — Statement that this is a one-time message</li>
                                    <li><strong>Rate Disclosure</strong> — "Message and data rates may apply"</li>
                                    <li><strong>Opt-Out Instructions</strong> — "Reply STOP to opt out"</li>
                                    <li><strong>Policy Links</strong> — References to terms of service and privacy policy</li>
                                </ul>
                            </div>

                            {/* Digital Consent */}
                            <div id="digital-consent" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Approved Digital Consent Language
                                </h2>
                                <p>Businesses must use consent language substantially similar to:</p>
                                
                                <h4 className="font-bold mt-4 mb-2">Standard Checkbox Consent</h4>
                                <p className="text-sm text-gray-500 mb-2">For web forms, booking systems, and digital intake forms:</p>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded bg-white flex-shrink-0"></div>
                                        <p className="text-sm">I agree to receive a one-time SMS review request from [Business Name]. Message and data rates may apply. Reply STOP to opt out.<br/><span className="text-blue-500 text-xs">Terms: [link] | Privacy: [link]</span></p>
                                    </div>
                                </div>

                                <h4 className="font-bold mt-4 mb-2">Expanded Consent Language</h4>
                                <p className="text-sm text-gray-500 mb-2">For businesses preferring more detailed disclosure:</p>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 border-2 border-gray-400 rounded bg-white flex-shrink-0"></div>
                                        <p className="text-sm"><strong>SMS Consent:</strong> By checking this box, I consent to receive a one-time text message from [Business Name] requesting feedback about my visit. Message frequency: 1 message. Message and data rates may apply. Reply STOP to cancel. View our Terms of Service and Privacy Policy.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Paper Consent */}
                            <div id="paper-consent" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Approved Paper Consent Form
                                </h2>
                                <p>For businesses collecting consent via paper forms:</p>
                                <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 my-4 text-sm font-serif">
                                    <h3 className="text-center font-bold text-lg mb-4 uppercase">Customer Feedback Consent Form</h3>
                                    <p className="mb-4"><strong>Business Name:</strong> ____________________________</p>
                                    
                                    <p className="font-bold mb-2">Customer Information:</p>
                                    <p className="mb-2">Name: ____________________________</p>
                                    <p className="mb-2">Phone Number: ____________________________</p>
                                    <p className="mb-4">Email (optional): ____________________________</p>

                                    <p className="font-bold mb-2">SMS Consent:</p>
                                    <div className="flex gap-2 mb-4">
                                        <div className="w-4 h-4 border border-black mt-1"></div>
                                        <p>I agree to receive a one-time SMS text message from the business named above requesting feedback about my experience.</p>
                                    </div>

                                    <ul className="list-disc pl-5 mb-6 text-xs text-gray-600">
                                        <li>Message Frequency: One (1) message</li>
                                        <li>Message & Data Rates: Standard messaging and data rates from your wireless carrier may apply</li>
                                        <li>Opt-Out: Reply STOP to any message to unsubscribe</li>
                                        <li>Help: Reply HELP for assistance or contact the business directly</li>
                                        <li>Terms & Privacy: Available at the business location or online</li>
                                    </ul>

                                    <div className="flex justify-between mt-8">
                                        <div>Customer Signature: ____________________________</div>
                                        <div>Date: ____________</div>
                                    </div>
                                </div>
                            </div>

                            {/* Records */}
                            <div id="records" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Consent Record Requirements
                                </h2>
                                <p>Businesses must maintain records of consent including:</p>
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Required Element</th>
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Timestamp</td>
                                                <td className="py-2 px-4">Date and time consent was obtained</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Method</td>
                                                <td className="py-2 px-4">How consent was collected (web form, paper, etc.)</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Consent Text</td>
                                                <td className="py-2 px-4">The exact language shown to the customer</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4 font-bold">Acknowledgment</td>
                                                <td className="py-2 px-4">Proof of customer action (checkbox selected, signature, etc.)</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-4 font-bold">Retention</td>
                                                <td className="py-2 px-4">Records must be kept for minimum 4 years</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Verification */}
                            <div id="verification" className="compliance-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Compliance Verification
                                </h2>
                                <p>MoreStars enforces compliance through:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Contractual Obligation</strong> — Businesses agree to consent requirements in our Terms of Service</li>
                                    <li><strong>30-Day Frequency Limit</strong> — System prevents messages to the same number within 30 days</li>
                                    <li><strong>Automatic Opt-Out Processing</strong> — STOP requests are honored immediately across all businesses</li>
                                    <li><strong>Audit Rights</strong> — MoreStars may request consent documentation from businesses</li>
                                </ul>
                                <h4 className="font-bold mt-6 mb-2">Platform Policies</h4>
                                <ul className="list-disc pl-6 mb-4 space-y-1">
                                    <li><Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link></li>
                                    <li><Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></li>
                                </ul>
                            </div>

                            {/* Contact & Regulatory */}
                            <div id="contact-regulatory" className="compliance-section scroll-mt-28 mb-16">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    Contact & Regulatory
                                </h2>
                                <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@morestars.io" className="text-blue-600 font-bold hover:underline">info@morestars.io</a></p>
                                
                                <p className="mb-2"><strong>For end customers:</strong> If you received a message and have questions, reply HELP to the message or email info@morestars.io.</p>
                                <p className="mb-6"><strong>For businesses:</strong> To learn more about MoreStars, visit <Link to="/" className="text-blue-600 hover:underline">morestars.io</Link>.</p>

                                <h4 className="font-bold mb-2">Regulatory Compliance</h4>
                                <p className="mb-2">MoreStars is designed to comply with:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-1 text-sm">
                                    <li>Telephone Consumer Protection Act (TCPA)</li>
                                    <li>CTIA Messaging Principles and Best Practices</li>
                                    <li>Carrier-specific requirements</li>
                                    <li>FTC regulations on review practices</li>
                                </ul>
                                <p className="text-sm text-gray-500 italic mt-4">This page serves as public documentation of our consent collection requirements and is available for review by carriers, regulators, and the public.</p>
                            </div>

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

export default SMSCompliancePage;
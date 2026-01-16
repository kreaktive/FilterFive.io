import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { 
  Building, Database, Server, Share2, Clock, Shield, Settings, 
  UserCheck, MapPin, Globe, Baby, Link as LinkIcon, RefreshCw, Mail 
} from 'lucide-react';
import gsap from 'gsap';

const PRIVACY_SECTIONS = [
  { id: "who-we-are", title: "1. Who We Are", icon: <Building size={18} /> },
  { id: "info-collect", title: "2. Info We Collect", icon: <Database size={18} /> },
  { id: "how-use", title: "3. How We Use It", icon: <Server size={18} /> },
  { id: "how-share", title: "4. How We Share", icon: <Share2 size={18} /> },
  { id: "retention", title: "5. Data Retention", icon: <Clock size={18} /> },
  { id: "security", title: "6. Data Security", icon: <Shield size={18} /> },
  { id: "choices", title: "7. Your Rights", icon: <Settings size={18} /> },
  { id: "end-customer", title: "8. End Customer", icon: <UserCheck size={18} /> },
  { id: "california", title: "9. California", icon: <MapPin size={18} /> },
  { id: "international", title: "10. International", icon: <Globe size={18} /> },
  { id: "children", title: "11. Children", icon: <Baby size={18} /> },
  { id: "third-party", title: "12. Third-Party", icon: <LinkIcon size={18} /> },
  { id: "changes", title: "13. Changes", icon: <RefreshCw size={18} /> },
  { id: "contact", title: "14. Contact", icon: <Mail size={18} /> },
];

const PrivacyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(PRIVACY_SECTIONS[0].id);

  useEffect(() => {
    document.title = "Privacy Policy | MoreStars";
    window.scrollTo(0, 0);

    // GSAP Animation for sections on load
    gsap.from('.privacy-section', {
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

      let currentSectionId = PRIVACY_SECTIONS[0].id;
      
      for (const section of PRIVACY_SECTIONS) {
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
                   Privacy Policy
               </h1>
               <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                   How we collect, use, and protect your information.
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
                            {PRIVACY_SECTIONS.map(section => (
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
                                <p className="mb-0">This Privacy Policy describes how KREAKTIVE LLC ("Company," "we," "us," or "our") collects, uses, and shares information in connection with MoreStars ("Service"). By using the Service, you agree to the collection and use of information as described in this policy.</p>
                            </div>

                            {/* 1. Who We Are */}
                            <div id="who-we-are" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">01.</span> Who We Are
                                </h2>
                                <p>MoreStars is operated by KREAKTIVE LLC. <br/>Email: <a href="mailto:info@morestars.io" className="text-blue-600 hover:underline">info@morestars.io</a></p>
                            </div>

                            {/* 2. Info We Collect */}
                            <div id="info-collect" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">02.</span> Information We Collect
                                </h2>
                                <p>We collect information in three categories:</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">2.1 Information from Business Subscribers</h3>
                                <p>When you register for an account, we collect:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Account Information:</strong> Email address, password (encrypted), business name</li>
                                    <li><strong>Business Details:</strong> Google Business Profile link, business category</li>
                                    <li><strong>Billing Information:</strong> Payment card details (processed securely by our payment processor)</li>
                                </ul>

                                <h3 className="text-xl font-bold mt-6 mb-3">2.2 Information About End Customers</h3>
                                <p>When business subscribers submit customer information for review requests, we collect:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Contact Information:</strong> Customer name, phone number, and optionally email address</li>
                                    <li><strong>Message Data:</strong> Delivery status, timestamps, and engagement data (e.g., whether a link was clicked)</li>
                                </ul>
                                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 text-sm my-4">
                                    <strong>Important:</strong> We do not collect information directly from end customers. All customer data is provided to us by business subscribers who are responsible for obtaining appropriate consent.
                                </div>

                                <h3 className="text-xl font-bold mt-6 mb-3">2.3 Information Collected Automatically</h3>
                                <p>When you use the Service, we automatically collect:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Usage Data:</strong> Pages visited, features used, actions taken within the dashboard</li>
                                    <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                                    <li><strong>Log Data:</strong> IP addresses, access times, referring URLs</li>
                                </ul>
                                <p>We may use cookies and similar technologies to collect this information.</p>
                            </div>

                            {/* 3. How We Use */}
                            <div id="how-use" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">03.</span> How We Use Information
                                </h2>
                                <p>We use collected information to:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Provide the Service:</strong> Send SMS messages, track delivery, display analytics</li>
                                    <li><strong>Manage Accounts:</strong> Process registrations, authenticate users, handle billing</li>
                                    <li><strong>Improve the Service:</strong> Analyze usage patterns, fix bugs, develop new features</li>
                                    <li><strong>Communicate:</strong> Send service announcements, respond to inquiries, provide support</li>
                                    <li><strong>Ensure Compliance:</strong> Maintain consent records, honor opt-out requests, comply with legal obligations</li>
                                    <li><strong>Protect Rights:</strong> Detect fraud, enforce our Terms of Service, protect against misuse</li>
                                </ul>
                            </div>

                            {/* 4. How We Share */}
                            <div id="how-share" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">04.</span> How We Share Information
                                </h2>
                                <p>We do not sell personal information. We share information only as follows:</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.1 Service Providers</h3>
                                <p>We share information with third-party service providers who perform services on our behalf:</p>
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Provider</th>
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Purpose</th>
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Data Shared</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Twilio</td>
                                                <td className="py-2 px-4">SMS delivery</td>
                                                <td className="py-2 px-4">Customer phone numbers, message content</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Resend</td>
                                                <td className="py-2 px-4">Email notifications</td>
                                                <td className="py-2 px-4">Business subscriber email addresses</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-4">Payment Processor</td>
                                                <td className="py-2 px-4">Billing</td>
                                                <td className="py-2 px-4">Payment card information</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p>These providers are contractually obligated to protect your information and use it only for the services they provide to us.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.2 Legal Requirements</h3>
                                <p>We may disclose information if required by law, regulation, legal process, or governmental request, or to protect the rights, property, or safety of KREAKTIVE LLC, our users, or the public.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.3 Business Transfers</h3>
                                <p>If KREAKTIVE LLC is involved in a merger, acquisition, or sale of assets, information may be transferred as part of that transaction. We will notify you of any such change.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">4.4 With Consent</h3>
                                <p>We may share information with your consent or at your direction.</p>
                            </div>

                            {/* 5. Data Retention */}
                            <div id="retention" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">05.</span> Data Retention
                                </h2>
                                <p>We retain information as follows:</p>
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Data Type</th>
                                                <th className="py-2 px-4 text-left font-bold text-gray-600">Retention Period</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Account information</td>
                                                <td className="py-2 px-4">Duration of account plus 30 days</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Customer contact data</td>
                                                <td className="py-2 px-4">Duration of account plus 30 days</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Message delivery records</td>
                                                <td className="py-2 px-4">4 years (regulatory requirement)</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-4">Opt-out records</td>
                                                <td className="py-2 px-4">Indefinitely</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-4">Billing records</td>
                                                <td className="py-2 px-4">7 years (tax/legal requirement)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p>After the retention period, data is permanently deleted from our systems.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">5.1 Account Cancellation</h3>
                                <p>When you cancel your account:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Your data is retained for 30 days in case you wish to reactivate</li>
                                    <li>After 30 days, all data is permanently deleted</li>
                                    <li>Certain records (opt-outs, billing) may be retained longer as required by law</li>
                                </ul>
                            </div>

                            {/* 6. Security */}
                            <div id="security" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">06.</span> Data Security
                                </h2>
                                <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Encryption of data in transit (TLS/SSL)</li>
                                    <li>Encryption of passwords using industry-standard hashing</li>
                                    <li>Access controls limiting who can view data</li>
                                    <li>Regular security assessments</li>
                                </ul>
                                <p>However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
                            </div>

                            {/* 7. Rights */}
                            <div id="choices" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">07.</span> Your Rights and Choices
                                </h2>
                                
                                <h3 className="text-xl font-bold mt-6 mb-3">7.1 Account Information</h3>
                                <p>You can access, update, or delete your account information through your dashboard or by contacting us at info@morestars.io.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">7.2 Marketing Communications</h3>
                                <p>We do not send marketing emails. All communications are transactional (account-related).</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">7.3 Cookies</h3>
                                <p>Most web browsers accept cookies by default. You can configure your browser to reject cookies, though this may affect functionality.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">7.4 Data Export</h3>
                                <p>Business subscribers may request an export of their data by contacting info@morestars.io.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">7.5 Data Deletion</h3>
                                <p>Business subscribers may request deletion of their account and associated data by contacting info@morestars.io. Deletion will be completed within 30 days, subject to legal retention requirements.</p>
                            </div>

                            {/* 8. End Customer */}
                            <div id="end-customer" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">08.</span> End Customer Rights
                                </h2>
                                <p>If you are an end customer who received an SMS through our Service:</p>
                                
                                <h3 className="text-xl font-bold mt-6 mb-3">8.1 Opt-Out</h3>
                                <p>Reply STOP to any message to immediately stop receiving messages. You can also reply UNSUBSCRIBE, CANCEL, END, or QUIT.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">8.2 Questions</h3>
                                <p>Reply HELP to receive assistance information, or contact info@morestars.io.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">8.3 Data Requests</h3>
                                <p>To request information about your data or request deletion, contact info@morestars.io with:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Your phone number</li>
                                    <li>The business that sent you a message (if known)</li>
                                    <li>Your request (access, deletion, etc.)</li>
                                </ul>
                                <p>We will respond within 30 days.</p>
                            </div>

                            {/* 9. California */}
                            <div id="california" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">09.</span> California Privacy Rights
                                </h2>
                                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li><strong>Right to Know:</strong> You can request information about what personal information we collect, use, and disclose.</li>
                                    <li><strong>Right to Delete:</strong> You can request deletion of your personal information, subject to exceptions.</li>
                                    <li><strong>Right to Opt-Out:</strong> We do not sell personal information, so this right does not apply.</li>
                                    <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your rights.</li>
                                </ul>
                                <p>To exercise these rights, contact info@morestars.io.</p>
                            </div>

                            {/* 10. International */}
                            <div id="international" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">10.</span> International Users
                                </h2>
                                <p>MoreStars is operated from the United States. If you access the Service from outside the United States, your information will be transferred to and processed in the United States.</p>

                                <h3 className="text-xl font-bold mt-6 mb-3">10.1 European Economic Area (EEA)</h3>
                                <p>If you are in the EEA, our legal basis for processing personal information includes:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Contract Performance: To provide the Service you requested</li>
                                    <li>Legitimate Interests: To improve and secure the Service</li>
                                    <li>Legal Compliance: To meet regulatory obligations</li>
                                    <li>Consent: Where you have provided consent</li>
                                </ul>
                                <p>EEA residents have additional rights including access, rectification, erasure, restriction, portability, and objection. Contact info@morestars.io to exercise these rights.</p>
                            </div>

                            {/* 11. Children */}
                            <div id="children" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">11.</span> Children's Privacy
                                </h2>
                                <p>The Service is not intended for anyone under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected information from a child, we will delete it promptly.</p>
                            </div>

                            {/* 12. Third Party */}
                            <div id="third-party" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">12.</span> Third-Party Links
                                </h2>
                                <p>The Service may contain links to third-party websites (such as Google Business Profile). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.</p>
                            </div>

                            {/* 13. Changes */}
                            <div id="changes" className="privacy-section scroll-mt-28 mb-16 border-b border-gray-100 pb-10">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">13.</span> Changes to This Policy
                                </h2>
                                <p>We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
                                <ul className="list-disc pl-6 mb-4 space-y-2">
                                    <li>Posting the updated policy on our website</li>
                                    <li>Updating the "Last Updated" date</li>
                                    <li>Sending an email notification for significant changes</li>
                                </ul>
                                <p>Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
                            </div>

                            {/* 14. Contact */}
                            <div id="contact" className="privacy-section scroll-mt-28 mb-16">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.dark }}>
                                    <span className="text-gray-300">14.</span> Contact Us
                                </h2>
                                <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
                                <p className="font-bold mt-2">Email: <a href="mailto:info@morestars.io" className="text-blue-600 hover:underline">info@morestars.io</a></p>
                            </div>

                            <p className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500 font-medium italic">By using MoreStars, you acknowledge that you have read and understood this Privacy Policy.</p>
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

export default PrivacyPage;
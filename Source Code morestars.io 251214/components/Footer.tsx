import React from 'react';
import { Star, Lock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="pt-20 pb-10 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Column (4 cols) */}
          <div className="md:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-2">
               <div className="relative">
                 <Star className="w-6 h-6 fill-current" style={{ color: COLORS.gold }} />
               </div>
               <span className="font-bold text-xl tracking-tight" style={{ color: COLORS.dark }}>
                 MoreStars.io
               </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Automated Google review management for local businesses. 
              Simple, affordable, and compliant.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
               <span>🇺🇸 Made in Colorado Springs, CO</span>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-4 pt-2">
               <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <Lock size={12} className="text-green-600"/> Secure 256-bit SSL
               </div>
               <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  <CreditCard size={12} className="text-blue-600"/> Stripe Verified
               </div>
            </div>
          </div>

          {/* Links Columns (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            
            {/* Product */}
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider" style={{ color: COLORS.dark }}>Product</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><Link to="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link to="/features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link to="/industries" className="hover:text-blue-600 transition-colors">Industries</Link></li>
                <li><Link to="/pricing" className="font-bold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">Start Free Trial <span className="text-xs">→</span></Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider" style={{ color: COLORS.dark }}>Resources</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><Link to="/blog" className="hover:text-blue-600 transition-colors">Blog & Guides</Link></li>
                <li><Link to="/faq" className="hover:text-blue-600 transition-colors">Help Center & FAQ</Link></li>
                <li><Link to="/partners" className="hover:text-blue-600 transition-colors">Agency Partners</Link></li>
                <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Legal / Contact */}
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-wider" style={{ color: COLORS.dark }}>Support</h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li><a href="mailto:support@morestars.io" className="hover:text-blue-600 transition-colors">support@morestars.io</a></li>
                <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                <li><Link to="/sms-compliance" className="hover:text-blue-600 transition-colors">SMS Compliance</Link></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} MoreStars.io. All rights reserved.</p>
          <div className="flex items-center gap-1">
             <span>Made with <span className="text-red-500">♥</span> for small business by</span>
             <a href="https://digitalmarketingservices.pro" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-700 hover:text-blue-600 transition-colors underline decoration-dotted underline-offset-2">DMS</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
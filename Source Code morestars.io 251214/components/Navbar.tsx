import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, X, Star, ChevronDown, Search, Wrench, Car, Activity, School, Smile, Zap, Sparkles, Thermometer, Sprout, Flower, Truck, ShoppingBag, Scissors, Droplet, Home, Utensils, Users, PenTool, Heart, Camera, Dog, ArrowRight, LayoutGrid, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { COLORS, NAV_LINKS } from '../constants';
import { BLOG_POSTS } from './BlogData';

const INDUSTRIES_LIST = [
  { name: 'Auto Repair', href: '/industries/auto-repair', icon: Wrench },
  { name: 'Car Wash', href: '/industries/car-wash', icon: Car },
  { name: 'Chiropractors', href: '/industries/chiropractors', icon: Activity },
  { name: 'Daycare', href: '/industries/daycare', icon: School },
  { name: 'Dental', href: '/industries/dental', icon: Smile },
  { name: 'Electricians', href: '/industries/electricians', icon: Zap },
  { name: 'Home Cleaning', href: '/industries/home-cleaning', icon: Sparkles },
  { name: 'HVAC', href: '/industries/hvac', icon: Thermometer },
  { name: 'Lawn Care', href: '/industries/lawn-care', icon: Sprout },
  { name: 'Med Spas', href: '/industries/med-spas', icon: Flower },
  { name: 'Moving Companies', href: '/industries/moving-companies', icon: Truck },
  { name: 'Online Stores', href: '/industries/online-stores', icon: ShoppingBag },
  { name: 'Pet Groomers', href: '/industries/pet-groomers', icon: Dog },
  { name: 'Plumbers', href: '/industries/plumbers', icon: Droplet },
  { name: 'Real Estate', href: '/industries/real-estate', icon: Home },
  { name: 'Restaurants', href: '/industries/restaurants', icon: Utensils },
  { name: 'Salons', href: '/industries/salons', icon: Scissors },
  { name: 'Senior Care', href: '/industries/senior-care', icon: Users },
  { name: 'Tattoo Shops', href: '/industries/tattoo-shops', icon: PenTool },
  { name: 'Veterinarians', href: '/industries/veterinarians', icon: Heart },
  { name: 'Wedding Photographers', href: '/industries/wedding-photographers', icon: Camera },
].sort((a, b) => a.name.localeCompare(b.name));

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false); // For Mega Menu hover/click
  const [isMobileIndustriesOpen, setIsMobileIndustriesOpen] = useState(false); // For Mobile Accordion
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search Data
  const searchableItems = useMemo(() => {
    return [
        ...NAV_LINKS.map(l => ({ name: l.name, href: l.href, type: 'Page', icon: Star })),
        ...INDUSTRIES_LIST.map(i => ({ name: i.name, href: i.href, type: 'Industry', icon: i.icon })),
        ...BLOG_POSTS.map(b => ({ name: b.title, href: `/blog/${b.slug}`, type: 'Article', icon: FileText })),
        { name: "SMS Requests", href: "/features", type: "Feature", icon: Zap },
        { name: "QR Codes", href: "/features", type: "Feature", icon: Zap },
    ];
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return searchableItems.filter(item => 
        item.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  }, [searchQuery, searchableItems]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    
    // Prevent scrolling when search is open
    if (isSearchOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  // Close search on route change or ESC
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsSearchOpen(false);
        }
        // Open search with CMD+K or CTRL+K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + href);
      } else {
        const element = document.getElementById(href.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setIsIndustriesOpen(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setIsIndustriesOpen(false);
    }, 150); // Small delay to prevent flickering
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 sm:px-6 pointer-events-none">
        <nav className="w-full max-w-7xl bg-white/90 backdrop-blur-lg border border-gray-200/60 rounded-full shadow-xl pointer-events-auto transition-all duration-300 relative">
          <div className="px-6 md:px-8">
            <div className="flex justify-between h-16 md:h-20 items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <Link to="/" className="flex items-center gap-2">
                   <div className="relative">
                     <Star className="w-8 h-8 fill-current" style={{ color: COLORS.gold }} />
                     <Star className="w-4 h-4 absolute -top-1 -right-1 fill-current" style={{ color: COLORS.accent }} />
                   </div>
                   <span className="font-bold text-2xl tracking-tight" style={{ color: COLORS.dark }}>
                     MoreStars.io
                   </span>
                </Link>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-8">
                {NAV_LINKS.map((link) => {
                   if (link.name === 'Industries') {
                     return (
                       <div 
                          key={link.name} 
                          className="relative group"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                       >
                          <Link
                            to={link.href}
                            className="flex items-center gap-1 text-base font-medium transition-colors hover:opacity-75 py-2"
                            style={{ color: COLORS.dark }}
                          >
                            {link.name}
                            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isIndustriesOpen ? 'rotate-180' : ''}`} />
                          </Link>

                          {/* Mega Menu */}
                          <div 
                            className={`absolute left-1/2 transform -translate-x-1/2 mt-4 w-[800px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top ${isIndustriesOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'}`}
                            style={{ top: '100%' }}
                          >
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                 <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    <LayoutGrid size={14} /> Industries We Serve
                                 </div>
                                 <Link to="/industries" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1" onClick={() => setIsIndustriesOpen(false)}>
                                    View All <ArrowRight size={14} />
                                 </Link>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-x-2 gap-y-2">
                                {INDUSTRIES_LIST.map((industry) => (
                                  <Link 
                                    key={industry.name}
                                    to={industry.href}
                                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group/item"
                                    onClick={() => setIsIndustriesOpen(false)}
                                  >
                                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-colors shrink-0">
                                      <industry.icon size={14} />
                                    </div>
                                    <span className="font-medium text-sm text-gray-700 group-hover/item:text-gray-900 line-clamp-1">{industry.name}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                               <p className="text-xs text-gray-500">
                                 Don't see your industry? <Link to="/industries" className="text-blue-600 font-bold hover:underline">It probably still works.</Link>
                               </p>
                            </div>
                          </div>
                       </div>
                     );
                   }

                   if (link.href.startsWith('#')) {
                       return (
                           <button
                               key={link.name}
                               onClick={() => handleNavClick(link.href)}
                               className="text-base font-medium transition-colors hover:opacity-75 bg-transparent border-none cursor-pointer"
                               style={{ color: COLORS.dark }}
                           >
                               {link.name}
                           </button>
                       );
                   }
                   return (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="text-base font-medium transition-colors hover:opacity-75"
                        style={{ color: COLORS.dark }}
                      >
                        {link.name}
                      </Link>
                   );
                })}
                
                {/* Search Trigger (Desktop) */}
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    aria-label="Search"
                >
                    <Search size={20} />
                </button>

                <button
                  className="px-6 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-md border border-transparent hover:border-black/5"
                  style={{ backgroundColor: COLORS.gold, color: COLORS.dark }}
                >
                  Start Free Trial
                </button>
              </div>

              {/* Mobile Controls */}
              <div className="md:hidden flex items-center gap-4">
                <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    aria-label="Search"
                >
                    <Search size={24} />
                </button>

                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-md focus:outline-none"
                  style={{ color: COLORS.dark }}
                >
                  {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* Search Modal */}
          {isSearchOpen && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 sm:pt-24">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSearchOpen(false)}
                ></div>
                
                {/* Search Container */}
                <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                    {/* Search Header */}
                    <div className="flex items-center p-4 border-b border-gray-100 bg-white z-10 shrink-0">
                        <Search size={20} className="text-gray-400 ml-2" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search industries, features, articles..."
                            className="flex-1 px-4 py-3 text-lg outline-none bg-transparent placeholder:text-gray-400 text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="hidden sm:flex gap-2 mr-2">
                            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-md">ESC</kbd>
                        </div>
                        <button 
                            onClick={() => setIsSearchOpen(false)}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Results Area */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 min-h-[300px]">
                        {searchQuery.trim() === '' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-60">
                                <Search size={48} strokeWidth={1} className="mb-4 text-gray-300" />
                                <p className="text-sm font-medium">Type to search across our site.</p>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredResults.map((item, index) => (
                                    <Link 
                                        key={index}
                                        to={item.href}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all group"
                                        onClick={() => setIsSearchOpen(false)}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            item.type === 'Industry' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                            item.type === 'Article' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                                            item.type === 'Feature' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' :
                                            'bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white'
                                        }`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-600 transition-colors">{item.type}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{item.name}</h4>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <p className="text-gray-900 font-bold mb-1">No results found</p>
                                <p className="text-gray-500 text-sm">We couldn't find anything matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-white px-4 py-3 text-xs text-gray-400 border-t border-gray-100 flex justify-between items-center shrink-0">
                        <span className="hidden sm:inline">Search powered by MoreStars</span>
                        <span>{filteredResults.length} results</span>
                    </div>
                </div>
            </div>
          )}

          {/* Mobile Menu */}
          {isOpen && (
            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl p-4 overflow-hidden animate-in slide-in-from-top-5 duration-200">
              <div className="px-2 pt-2 pb-6 space-y-2 max-h-[70vh] overflow-y-auto">
                {NAV_LINKS.map((link) => {
                   if (link.name === 'Industries') {
                     return (
                       <div key={link.name}>
                         <button
                            onClick={() => setIsMobileIndustriesOpen(!isMobileIndustriesOpen)}
                            className="flex items-center justify-between w-full text-left px-3 py-3 text-lg font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            style={{ color: COLORS.dark }}
                         >
                            {link.name}
                            <ChevronDown size={20} className={`transform transition-transform ${isMobileIndustriesOpen ? 'rotate-180' : ''}`} />
                         </button>
                         {isMobileIndustriesOpen && (
                           <div className="pl-4 pr-2 space-y-2 pb-4 bg-gray-50/50 rounded-xl my-2 grid grid-cols-1 gap-1">
                              <Link 
                                to="/industries"
                                className="block px-3 py-3 text-base font-bold text-blue-600 border-b border-gray-100"
                                onClick={() => setIsOpen(false)}
                              >
                                All Industries
                              </Link>
                              {INDUSTRIES_LIST.map(industry => (
                                <Link
                                  key={industry.name}
                                  to={industry.href}
                                  className="flex items-center gap-3 px-3 py-2 text-base text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
                                  onClick={() => setIsOpen(false)}
                                >
                                  <industry.icon size={16} className="text-gray-400" />
                                  {industry.name}
                                </Link>
                              ))}
                           </div>
                         )}
                       </div>
                     );
                   }

                   if (link.href.startsWith('#')) {
                     return (
                        <button
                            key={link.name}
                            onClick={() => handleNavClick(link.href)}
                            className="block w-full text-left px-3 py-3 text-lg font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            style={{ color: COLORS.dark }}
                        >
                            {link.name}
                        </button>
                     )
                   }
                   return (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="block px-3 py-3 text-lg font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        style={{ color: COLORS.dark }}
                        onClick={() => setIsOpen(false)}
                      >
                        {link.name}
                      </Link>
                   );
                })}
                
                <div className="pt-4 mt-2">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-2 text-center">Ready to grow?</h4>
                      <p className="text-sm text-gray-500 text-center mb-4">Get more reviews in your first 14 days.</p>
                      <button
                        className="w-full px-6 py-3.5 rounded-xl font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{ backgroundColor: COLORS.gold, color: COLORS.dark }}
                      >
                        Start Free Trial <ArrowRight size={18} />
                      </button>
                      <p className="text-center text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wide">
                        No credit card required
                      </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
      
      {/* Spacer to prevent content jump due to fixed position */}
      <div className="h-28 w-full invisible pointer-events-none" aria-hidden="true" />
    </>
  );
};

export default Navbar;
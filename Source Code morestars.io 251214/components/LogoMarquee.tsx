import React from 'react';
import { COLORS } from '../constants';

const LOGOS = [
  {
    name: "Google",
    path: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
  },
  {
    name: "Facebook",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
  },
  {
    name: "Square",
    path: "M19.7 0H4.3C1.9 0 0 1.9 0 4.3v15.4C0 22.1 1.9 24 4.3 24h15.4c2.4 0 4.3-1.9 4.3-4.3V4.3C24 1.9 22.1 0 19.7 0zM18 18H6V6h12v12zM8 8h8v8H8V8z"
  },
  {
    name: "Shopify",
    path: "M21.9 6.8l-1.9-3.7c-.3-.6-1-1-1.7-.8L16 3.1l-1.3-2.2c-.3-.6-1-1-1.6-.9-.7.1-1.2.6-1.3 1.3L11.5 6l-5.6 1c-.7.1-1.3.7-1.3 1.4L5.8 20c.1 1.6 1.4 2.8 3 2.9h6.4c1.6-.1 2.9-1.3 3-2.9l1.2-11.6c.1-.7-.4-1.3-1-1.5l-5.5-1.1 1.1 5.5c.1.4 0 .9-.3 1.2-.3.3-.8.4-1.2.3-.4-.1-.7-.4-.8-.8l-1.3-6.4 3.7 2.1c.2.1.4.1.6 0 .2-.1.3-.2.4-.4l2.5-4.3 1.4 2.7c.3.6 1 1 1.6 1 .2 0 .4 0 .5-.1.7-.2 1.1-.9.8-1.6z"
  },
  {
    name: "Zapier",
    path: "M9 0H0v9h9V0zm15 15h-9v9h9v-9zM9 15H0v9h9v-9zM24 0h-9v9h9V0z"
  },
  {
    name: "TripAdvisor",
    path: "M21.5 9h-2.1c-.5-1.8-2.1-3.1-4.1-3.1-1.2 0-2.3.5-3.1 1.3-.8-.8-1.9-1.3-3.1-1.3-1.9 0-3.6 1.3-4.1 3.1H2.5C1.1 9 0 10.1 0 11.5v3c0 1.4 1.1 2.5 2.5 2.5h19c1.4 0 2.5-1.1 2.5-2.5v-3c0-1.4-1.1-2.5-2.5-2.5zM6.5 13.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zm11 0c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
  },
  {
    name: "Yelp",
    path: "M17.65 14.71l-5.18-1.55 1.76 5.16c.41 1.2.33 2.5-.23 3.61-.56 1.11-1.53 1.9-2.71 2.21-2.45.64-4.88-.85-5.43-3.32l-1.07-4.81-4.48 2.05c-2.33 1.07-5.06.12-6.19-2.15-1.13-2.26-.26-4.99 1.97-6.2l4.73-2.57-4.7-2.61C-6.1 3.42-6.9.7 5.25-1.56 7.4-2.69 10.13-1.82 11.26.45l2.45 4.9 2.51-4.87c1.15-2.24 3.89-3.08 6.1-1.91 2.21 1.17 3.03 3.92 1.83 6.19l-2.4 4.67 5.16 1.63c2.47.78 3.87 3.39 3.13 5.86-.74 2.46-3.35 3.86-5.82 3.08l-5.08-1.59z" // Simplified burst shape
  }
];

const LogoMarquee: React.FC = () => {
  return (
    <div className="w-full py-10 bg-[#F9F7FA] overflow-hidden relative">
       {/* Fade edges - Using explicit RGBA to ensure exact color match with #F9F7FA (249, 247, 250) */}
       <div 
         className="absolute top-0 left-0 w-16 md:w-32 h-full z-10 pointer-events-none"
         style={{
           background: 'linear-gradient(to right, #F9F7FA, rgba(249, 247, 250, 0))'
         }}
       ></div>
       <div 
         className="absolute top-0 right-0 w-16 md:w-32 h-full z-10 pointer-events-none"
         style={{
           background: 'linear-gradient(to left, #F9F7FA, rgba(249, 247, 250, 0))'
         }}
       ></div>
       
       <div className="flex w-full group">
          <div className="flex animate-scroll hover:pause" style={{ width: 'max-content' }}>
             {/* Render logos multiple times to create seamless loop on large screens */}
             {[...Array(16)].map((_, i) => (
                <React.Fragment key={i}>
                  {LOGOS.map((logo, index) => (
                    <div key={`${i}-${index}`} className="flex items-center justify-center mx-8 md:mx-12 opacity-40 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 cursor-default">
                      <svg 
                        viewBox="0 0 24 24" 
                        className="h-8 md:h-10 w-auto fill-current" 
                        style={{ color: COLORS.dark }}
                        aria-label={logo.name}
                      >
                        <path d={logo.path} />
                      </svg>
                    </div>
                  ))}
                </React.Fragment>
             ))}
          </div>
       </div>

       <style>{`
         @keyframes scroll {
           0% { transform: translateX(0); }
           100% { transform: translateX(-50%); }
         }
         .animate-scroll {
           animation: scroll 120s linear infinite; 
         }
         .hover\\:pause:hover {
           animation-play-state: paused;
         }
       `}</style>
    </div>
  );
};

export default LogoMarquee;
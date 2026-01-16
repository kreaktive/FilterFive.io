import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { BLOG_POSTS } from './BlogData';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';

const BlogPage: React.FC = () => {
  useEffect(() => {
    document.title = "MoreStars Blog | Advice for Local Businesses";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        {/* Hero */}
        <section className="pt-24 pb-20 bg-gray-50">
           <div className="max-w-4xl mx-auto px-4 text-center">
               <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                    Resources
               </span>
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                   Advice for Local Businesses
               </h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                   Tips, strategies, and guides to help you manage your reputation and grow your business online.
               </p>
           </div>
        </section>

        {/* Post Grid */}
        <section className="py-24">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {BLOG_POSTS.map((post, i) => (
                        <article key={i} className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                            {post.imageUrl && (
                                <div className="h-48 overflow-hidden">
                                    <img 
                                        src={post.imageUrl} 
                                        alt={post.title} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            )}
                            <div className="p-8 flex flex-col flex-grow">
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    <span className="text-blue-600">{post.category}</span>
                                    <span>•</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors" style={{ color: COLORS.dark }}>
                                    <Link to={`/blog/${post.slug}`}>
                                        {post.title}
                                    </Link>
                                </h2>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-medium">{post.date}</span>
                                    <Link to={`/blog/${post.slug}`} className="text-sm font-bold flex items-center gap-2 text-[#23001E] hover:text-blue-600 transition-colors">
                                        Read Article <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-24" style={{ backgroundColor: COLORS.bgLight }}>
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-extrabold mb-6" style={{ color: COLORS.dark }}>Get More Stars</h2>
                <p className="text-lg text-gray-600 mb-8">
                    Ready to put these strategies to work? Start your free trial today.
                </p>
                <div className="flex justify-center">
                    <Link to="/pricing" className="px-10 py-5 rounded-full text-xl font-bold shadow-xl transition-transform hover:scale-105 bg-[#23001E] text-white">
                        Start Free Trial
                    </Link>
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { COLORS } from '../constants';
import { useParams, Navigate, Link } from 'react-router-dom';
import { BLOG_POSTS } from './BlogData';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Facebook, Twitter, Linkedin, Star, CheckCircle, ArrowRight } from 'lucide-react';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  useEffect(() => {
    if (post) {
        document.title = `${post.title} | MoreStars Blog`;
        window.scrollTo(0, 0);
    }
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen font-sans bg-white" style={{ color: COLORS.dark }}>
      <Navbar />
      
      <main>
        <article className="pt-24 pb-24">
            {/* Header */}
            <header className="max-w-4xl mx-auto px-4 mb-12 text-center">
                <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-blue-600 font-medium text-sm mb-8 transition-colors">
                    <ArrowLeft size={16} className="mr-2" /> Back to Blog
                </Link>
                
                <div className="flex items-center justify-center gap-4 text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">{post.category}</span>
                    <span>{post.readTime}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight" style={{ color: COLORS.dark }}>
                    {post.title}
                </h1>

                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Calendar size={16} />
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <span>By MoreStars Team</span>
                </div>
            </header>

            {/* Featured Image */}
            {post.imageUrl && (
                <div className="max-w-5xl mx-auto px-4 mb-16">
                    <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg">
                         <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                </div>
            )}

            {/* Main Layout: Content + Sidebar */}
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-12">
                
                {/* Content Column */}
                <div className="lg:col-span-8">
                    <div className="prose prose-lg prose-blue text-gray-700 max-w-none">
                        {post.content}
                    </div>

                    {/* Share / Tags */}
                    <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-900">Share this:</span>
                            <button className="text-gray-400 hover:text-[#1877F2]"><Facebook size={20}/></button>
                            <button className="text-gray-400 hover:text-[#1DA1F2]"><Twitter size={20}/></button>
                            <button className="text-gray-400 hover:text-[#0A66C2]"><Linkedin size={20}/></button>
                        </div>
                    </div>

                    {/* Author Bio Section */}
                    <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col sm:flex-row items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full bg-[#23001E] flex items-center justify-center text-[#FFBA49] shadow-md ring-4 ring-white">
                                <Star size={40} fill="currentColor" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.dark }}>Written by the MoreStars Team</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                We help local businesses build 5-star reputations on autopilot. Our team is obsessed with simplifying reputation management for the busy business owner.
                            </p>
                            <Link to="/about" className="text-blue-600 font-bold hover:underline text-sm inline-flex items-center gap-1">
                                Read more about us <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <aside className="lg:col-span-4 space-y-8">
                     <div className="sticky top-32">
                        {/* CTA Card */}
                        <div className="bg-[#23001E] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBA49] rounded-full blur-3xl opacity-10 -mr-16 -mt-16 transition-opacity group-hover:opacity-20"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-10 -ml-12 -mb-12"></div>
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                                    <Star className="w-8 h-8 text-[#FFBA49] fill-current" />
                                </div>
                                
                                <h3 className="text-2xl font-bold mb-4">Get More 5-Star Reviews</h3>
                                <p className="text-gray-300 mb-8 leading-relaxed">
                                    Stop losing customers to competitors with better ratings. Automate your review requests today.
                                </p>
                                
                                <ul className="text-left space-y-3 mb-8 w-full max-w-xs mx-auto">
                                    <li className="flex gap-3 text-sm text-gray-300">
                                        <CheckCircle size={18} className="text-[#FFBA49] shrink-0" /> 1,000 SMS Included
                                    </li>
                                    <li className="flex gap-3 text-sm text-gray-300">
                                        <CheckCircle size={18} className="text-[#FFBA49] shrink-0" /> Unlimited QR Codes
                                    </li>
                                    <li className="flex gap-3 text-sm text-gray-300">
                                        <CheckCircle size={18} className="text-[#FFBA49] shrink-0" /> Cancel Anytime
                                    </li>
                                </ul>

                                <Link to="/pricing" className="block w-full py-4 rounded-xl font-bold text-[#23001E] bg-[#FFBA49] hover:bg-white transition-all transform hover:scale-105 shadow-lg">
                                    Start Free Trial
                                </Link>
                                <p className="text-xs text-gray-400 mt-4">14-day free trial. No card required.</p>
                            </div>
                        </div>
                     </div>
                </aside>

            </div>
        </article>

        {/* Read Next */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-4">
                <h3 className="text-2xl font-bold mb-10 text-center" style={{ color: COLORS.dark }}>Read Next</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    {BLOG_POSTS.filter(p => p.slug !== slug).slice(0, 3).map((related, i) => (
                        <Link to={`/blog/${related.slug}`} key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow block group">
                            <span className="text-xs font-bold text-blue-600 uppercase mb-2 block">{related.category}</span>
                            <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors" style={{ color: COLORS.dark }}>{related.title}</h4>
                            <p className="text-gray-500 text-sm line-clamp-2">{related.excerpt}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
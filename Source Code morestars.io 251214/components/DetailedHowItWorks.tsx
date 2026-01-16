import React from 'react';
import { COLORS } from '../constants';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Send, 
  Smartphone, 
  MousePointerClick, 
  Star, 
  CheckCircle,
  BarChart3,
  QrCode,
  MessageSquare
} from 'lucide-react';

const MockupWindow = ({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${className}`}>
    <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="mx-auto text-xs font-medium text-gray-500">{title}</div>
    </div>
    {children}
  </div>
);

const DetailedHowItWorks: React.FC = () => {
  return (
    <div className="bg-white">
        {/* Hero */}
        <section className="pt-24 pb-20 bg-gray-50">
           <div className="max-w-4xl mx-auto px-4 text-center">
               <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase mb-6">
                    Step-by-Step Guide
               </span>
               <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: COLORS.dark }}>
                   How MoreStars Works
               </h1>
               <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                   From "Happy Customer" to "5-Star Review" in under 60 seconds. Automation makes it effortless.
               </p>
           </div>
        </section>

        {/* Step 1: Request */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                        <Send size={32} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.dark }}>1. You Send a Request</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        There are two easy ways to ask for a review.
                    </p>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="mt-1"><QrCode className="text-purple-600" /></div>
                            <div>
                                <h3 className="font-bold text-lg">QR Codes (In-Person)</h3>
                                <p className="text-gray-600 text-sm">Perfect for counters, tables, or receipts. Customers scan and review instantly.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><MessageSquare className="text-blue-600" /></div>
                            <div>
                                <h3 className="font-bold text-lg">SMS (Automated)</h3>
                                <p className="text-gray-600 text-sm">Upload a list or connect your POS. Texts go out automatically after service.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    {/* Mockup of SMS Interface or QR Code */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Send size={16} /></div>
                            <span className="font-bold text-sm">Send Request</span>
                        </div>
                        <div className="space-y-3">
                            <div className="h-10 bg-gray-50 rounded border border-gray-200 px-3 flex items-center text-sm text-gray-500">Customer Name</div>
                            <div className="h-10 bg-gray-50 rounded border border-gray-200 px-3 flex items-center text-sm text-gray-500">Phone Number</div>
                            <button className="w-full bg-blue-600 text-white rounded h-10 font-bold text-sm">Send Text</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Step 2: Customer Receives */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 flex justify-center">
                    {/* Phone Mockup */}
                    <div className="w-72 bg-white rounded-[2.5rem] border-8 border-gray-900 shadow-2xl overflow-hidden relative">
                        <div className="bg-gray-100 h-full p-4 pt-12">
                            <div className="bg-gray-200 w-32 h-6 rounded-full mx-auto mb-8"></div>
                            <div className="flex flex-col gap-3">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-sm text-gray-800">
                                    Hi Sarah! Thanks for choosing AutoFix. Would you mind leaving us a quick review? It helps a lot! <br/>
                                    <span className="text-blue-500 underline">morestars.io/r/x8s9</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                        <Smartphone size={32} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.dark }}>2. Customer Gets a Friendly Text</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        It arrives on their phone, where they are already spending their time.
                    </p>
                    <ul className="space-y-3">
                        <li className="flex gap-2"><CheckCircle className="text-green-500" /> High open rates (98%)</li>
                        <li className="flex gap-2"><CheckCircle className="text-green-500" /> Personal and direct</li>
                        <li className="flex gap-2"><CheckCircle className="text-green-500" /> No app to download</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* Step 3: Google */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                        <MousePointerClick size={32} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.dark }}>3. One Tap to Google</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        We remove the friction. The link opens directly to your Google Review form.
                    </p>
                    <p className="text-gray-600">
                        They don't have to search for you. They don't have to navigate menus. They just tap "5 Stars" and write a sentence.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg relative transform rotate-2">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">G</div>
                        <div>
                            <div className="font-bold text-gray-900">Your Business Name</div>
                            <div className="text-gray-500 text-sm">Posting publicly</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6 text-gray-300">
                        <Star className="text-yellow-400 fill-current w-8 h-8" />
                        <Star className="text-yellow-400 fill-current w-8 h-8" />
                        <Star className="text-yellow-400 fill-current w-8 h-8" />
                        <Star className="text-yellow-400 fill-current w-8 h-8" />
                        <Star className="text-yellow-400 fill-current w-8 h-8" />
                    </div>
                    <div className="h-24 border border-gray-200 rounded-lg p-3 text-gray-400 text-sm">Share details of your own experience at this place...</div>
                </div>
            </div>
        </section>

        {/* Step 4: Dashboard */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6 mx-auto">
                        <BarChart3 size={32} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: COLORS.dark }}>4. You Watch Your Reputation Grow</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Track every request, click, and new review in your MoreStars dashboard.
                    </p>
                </div>

                {/* Mockup: Dashboard Overview */}
                <MockupWindow title="MoreStars Dashboard - Real-time Overview" className="max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
                  <div className="bg-gray-50 p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Total Requests Sent</div>
                        <div className="text-3xl font-extrabold" style={{ color: COLORS.dark }}>1,248</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Click-Through Rate</div>
                        <div className="text-3xl font-extrabold text-blue-600">42%</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Est. New Reviews</div>
                        <div className="text-3xl font-extrabold text-green-500">+312</div>
                      </div>
                    </div>
                    {/* Fake Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute top-6 left-6 text-sm font-bold text-gray-400">Review Growth (Last 30 Days)</div>
                       <div className="flex items-end justify-between gap-2 h-48 px-2">
                          {[30, 45, 40, 55, 50, 65, 60, 80, 75, 90, 85, 95, 100].map((h, i) => (
                            <div key={i} className="w-full h-full bg-blue-50 rounded-t-md relative group overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-700 ease-out" style={{ height: `${h}%` }}></div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </MockupWindow>
            </div>
        </section>
    </div>
  );
};

export default DetailedHowItWorks;